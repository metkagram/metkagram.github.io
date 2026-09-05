import { contentCounts, loadContent } from "./content.mjs";
import { citationFormats, releaseState } from "./release.mjs";
import { getDatasetVersion } from "./provenance.mjs";
import { SITE_URL } from "./site.mjs";
import { patternPath, studySetPath } from "./seo-slugs.mjs";

const SAMPLE_PATTERN_ID = "CLF041";
const SAMPLE_SET_ID = "HED";

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function canonicalMarkup(url) {
  return `<link rel="canonical" href="${url}">`;
}

function rightsMarkup(status) {
  return `<meta name="metkagram-rights" content="${status}">`;
}

function normalizedInteger(value) {
  const digits = String(value ?? "").replace(/[^0-9]/g, "");
  return digits ? Number(digits) : NaN;
}

function datasetCardCount(html, label) {
  const pattern = new RegExp(`<h3>${escapeRegex(label)}</h3><p>Records: <strong>([^<]+)</strong>`);
  return normalizedInteger(html.match(pattern)?.[1]);
}

function addFailure(failures, route, message, actual = undefined) {
  failures.push({ route, message, ...(actual === undefined ? {} : { actual }) });
}

function requireText(failures, snapshot, route, needle, label = needle) {
  const record = snapshot[route];
  if (!record?.text?.includes(needle)) addFailure(failures, route, `missing ${label}`);
}

function forbidText(failures, snapshot, route, needle, label = needle) {
  const record = snapshot[route];
  if (record?.text?.includes(needle)) addFailure(failures, route, `superseded ${label} is present`);
}

function requirePublishedHtml(failures, snapshot, route, expected, { canonical = `${SITE_URL}${route}` } = {}) {
  requireText(failures, snapshot, route, rightsMarkup(expected.release.rights.status), "canonical rights meta");
  requireText(failures, snapshot, route, canonicalMarkup(canonical), "production canonical");
  requireText(failures, snapshot, route, `\"dateModified\":\"${expected.release.releaseDate}\"`, "current dateModified");
}

export function buildProductionContract() {
  const content = loadContent();
  const counts = contentCounts(content);
  const release = releaseState();
  const routes = {
    root: "/",
    homeEn: "/en/",
    homeRu: "/ru/",
    practiceEn: "/en/practice/",
    sampleSetEn: studySetPath("en", SAMPLE_SET_ID),
    lensEn: "/en/lens/",
    aiEn: "/en/ai/",
    aiRu: "/ru/ai/",
    licensingEn: "/en/licensing/",
    researchEn: "/en/research/",
    samplePatternEn: patternPath("en", SAMPLE_PATTERN_ID),
    rights: "/rights.json",
    apiIndex: "/api/v1/index.json",
    attribution: "/api/v1/attribution.json",
    languages: "/data/languages.json",
    llms: "/llms.txt",
    sitemap: "/sitemap.xml",
    robots: "/robots.txt",
  };

  return {
    schemaVersion: 1,
    canonicalOrigin: SITE_URL,
    release,
    datasetVersion: getDatasetVersion(),
    citation: citationFormats(),
    counts: {
      advancedPatterns: counts.advancedPatterns,
      annotatedDocuments: counts.annotatedDocuments,
      annotatedSentences: counts.annotatedSentences,
      sets: content.studySets.sets.length,
      learningPaths: content.studySets.learningPaths.length,
    },
    samplePatternId: SAMPLE_PATTERN_ID,
    sampleSetId: SAMPLE_SET_ID,
    routes,
  };
}

export function productionRouteList(contract = buildProductionContract()) {
  return [...new Set(Object.values(contract.routes))];
}

export function validateProductionSnapshot(snapshot, expected = buildProductionContract()) {
  const failures = [];
  const { routes } = expected;

  for (const route of productionRouteList(expected)) {
    const record = snapshot[route];
    if (!record) {
      addFailure(failures, route, "missing smoke snapshot record");
      continue;
    }
    if (record.status !== 200) addFailure(failures, route, `expected HTTP 200, got ${record.status}`, record.status);
  }

  requireText(failures, snapshot, routes.root, '<meta name="robots" content="noindex,follow">', "root noindex gateway");
  requireText(failures, snapshot, routes.root, '<meta http-equiv="refresh" content="0;url=/en/">', "root English fallback");
  requireText(failures, snapshot, routes.root, rightsMarkup(expected.release.rights.status), "canonical rights meta");
  requireText(failures, snapshot, routes.root, canonicalMarkup(`${SITE_URL}/en/`), "root canonical");

  for (const route of [
    routes.homeEn,
    routes.homeRu,
    routes.practiceEn,
    routes.sampleSetEn,
    routes.lensEn,
    routes.aiEn,
    routes.aiRu,
    routes.researchEn,
    routes.samplePatternEn,
  ]) requirePublishedHtml(failures, snapshot, route, expected);

  requireText(failures, snapshot, routes.homeEn, 'data-product-entry="lens" href="/en/lens/"', "Lens primary product entry");
  requireText(failures, snapshot, routes.homeEn, 'data-product-entry="library" href="/en/practice/"', "Pattern Library secondary entry");
  requireText(failures, snapshot, routes.homeRu, 'data-product-entry="lens" href="/ru/lens/"', "Russian Lens primary product entry");
  requireText(failures, snapshot, routes.practiceEn, 'data-practice-entry', "intent-first Practice entry");
  requireText(failures, snapshot, routes.practiceEn, 'data-intent-discovery="practice"', "reviewed intent discovery");
  requireText(failures, snapshot, routes.lensEn, 'data-pattern-lens', "Pattern Lens workbench");
  requireText(failures, snapshot, routes.lensEn, 'id="pattern-lens-data"', "Pattern Lens starter payload");
  requireText(failures, snapshot, routes.samplePatternEn, `data-pattern-id="${expected.samplePatternId}"`, "canonical Pattern ID");

  const aiEn = snapshot[routes.aiEn]?.text || "";
  const livePatternCount = datasetCardCount(aiEn, "Advanced patterns");
  const liveSetCount = datasetCardCount(aiEn, "Study sets");
  if (livePatternCount !== expected.counts.advancedPatterns) {
    addFailure(failures, routes.aiEn, `Advanced patterns count drift: expected ${expected.counts.advancedPatterns}, got ${livePatternCount}`, livePatternCount);
  }
  if (liveSetCount !== expected.counts.sets) {
    addFailure(failures, routes.aiEn, `Study sets count drift: expected ${expected.counts.sets}, got ${liveSetCount}`, liveSetCount);
  }
  requireText(failures, snapshot, routes.aiEn, expected.datasetVersion, "current dataset version");
  requireText(failures, snapshot, routes.aiEn, "/api/v1/attribution.json", "machine-readable attribution link");

  // Licensing may legitimately mention CC BY-NC only as history; current rights must
  // be explicit independently of that historical note.
  requireText(failures, snapshot, routes.licensingEn, rightsMarkup(expected.release.rights.status), "current licensing rights meta");
  requireText(failures, snapshot, routes.licensingEn, "Publicly inspectable", "current licensing model");
  requireText(failures, snapshot, routes.licensingEn, "all-rights-reserved", "current default rights");
  requireText(failures, snapshot, routes.licensingEn, "Previous releases stay historically honest", "explicit license history boundary");

  requireText(failures, snapshot, routes.researchEn, "no efficacy claim made", "research evidence boundary");

  const rights = snapshot[routes.rights]?.json;
  if (rights) {
    if (rights.status !== expected.release.rights.status) addFailure(failures, routes.rights, `rights.status drift: expected ${expected.release.rights.status}, got ${rights.status}`, rights.status);
    if (rights.defaultRights !== expected.release.rights.defaultRights) addFailure(failures, routes.rights, `defaultRights drift: expected ${expected.release.rights.defaultRights}, got ${rights.defaultRights}`, rights.defaultRights);
    if (rights.effectiveDate !== expected.release.rights.effectiveDate) addFailure(failures, routes.rights, `effectiveDate drift: expected ${expected.release.rights.effectiveDate}, got ${rights.effectiveDate}`, rights.effectiveDate);
  } else if (snapshot[routes.rights]?.status === 200) addFailure(failures, routes.rights, "invalid JSON payload");

  const api = snapshot[routes.apiIndex]?.json;
  if (api) {
    const checks = [
      ["release_date", api.release_date, expected.release.releaseDate],
      ["dataset_version", api.dataset_version, expected.datasetVersion],
      ["rights_status", api.rights_status, expected.release.rights.status],
      ["counts.advancedPatterns", api.counts?.advancedPatterns, expected.counts.advancedPatterns],
      ["counts.sets", api.counts?.sets, expected.counts.sets],
      ["counts.annotatedDocuments", api.counts?.annotatedDocuments, expected.counts.annotatedDocuments],
      ["counts.annotatedSentences", api.counts?.annotatedSentences, expected.counts.annotatedSentences],
    ];
    for (const [field, actual, value] of checks) {
      if (actual !== value) addFailure(failures, routes.apiIndex, `${field} drift: expected ${value}, got ${actual}`, actual);
    }
  } else if (snapshot[routes.apiIndex]?.status === 200) addFailure(failures, routes.apiIndex, "invalid JSON payload");

  const attribution = snapshot[routes.attribution]?.json;
  if (attribution) {
    if (attribution.data?.rights_status !== expected.release.rights.status) addFailure(failures, routes.attribution, "current rights_status missing from attribution policy", attribution.data?.rights_status);
    if (attribution.data?.dataset_version !== expected.datasetVersion) addFailure(failures, routes.attribution, "dataset_version drift in attribution policy", attribution.data?.dataset_version);
    if (attribution.data?.policy?.citation_formats?.academic !== expected.citation.academic) addFailure(failures, routes.attribution, "academic citation drift in attribution policy", attribution.data?.policy?.citation_formats?.academic);
  } else if (snapshot[routes.attribution]?.status === 200) addFailure(failures, routes.attribution, "invalid JSON payload");

  const languages = snapshot[routes.languages]?.json;
  if (languages) {
    if (JSON.stringify(languages.interfaceLocales) !== JSON.stringify(["en", "ru"])) addFailure(failures, routes.languages, "interface locale contract drift", languages.interfaceLocales);
    if (JSON.stringify(languages.annotationLanguages) !== JSON.stringify(["en", "de"])) addFailure(failures, routes.languages, "annotation language contract drift", languages.annotationLanguages);
    const french = languages.languages?.fr;
    if (french?.status !== "pilot" || french?.roles?.learning !== true || french?.roles?.annotation !== false || french?.roles?.interface !== false) {
      addFailure(failures, routes.languages, "French must remain a Frame-only learning pilot", french);
    }
  } else if (snapshot[routes.languages]?.status === 200) addFailure(failures, routes.languages, "invalid JSON payload");

  requireText(failures, snapshot, routes.llms, `/patterns.json (${expected.counts.advancedPatterns} records)`, "current Pattern count in llms.txt");
  requireText(failures, snapshot, routes.llms, `/sets.json (${expected.counts.sets} sets)`, "current study-set count in llms.txt");
  requireText(failures, snapshot, routes.llms, `Academic: ${expected.citation.academic}`, "canonical academic citation");
  forbidText(failures, snapshot, routes.llms, expected.release.rights.historicalLicense.license, "historical license as current agent guidance");

  requireText(failures, snapshot, routes.sitemap, `${SITE_URL}${routes.homeEn}`, "English homepage in sitemap");
  requireText(failures, snapshot, routes.sitemap, `${SITE_URL}${routes.lensEn}`, "Pattern Lens in sitemap");
  requireText(failures, snapshot, routes.sitemap, `${SITE_URL}${routes.samplePatternEn}`, "sample canonical Pattern in sitemap");
  requireText(failures, snapshot, routes.sitemap, `<lastmod>${expected.release.releaseDate}</lastmod>`, "current sitemap lastmod");
  requireText(failures, snapshot, routes.robots, "OAI-SearchBot", "OAI search crawler policy");
  requireText(failures, snapshot, routes.robots, "GPTBot", "GPT crawler policy");
  requireText(failures, snapshot, routes.robots, `Sitemap: ${SITE_URL}/sitemap.xml`, "production sitemap declaration");

  return failures;
}

export function formatProductionFailures(failures) {
  return failures.map((failure) => `${failure.route}: ${failure.message}`).join("\n");
}
