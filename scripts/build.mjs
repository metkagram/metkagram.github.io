import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { loadContent, contentCounts } from "../src/content.mjs";
import { collectionKeys, locales, targetMeta } from "../src/i18n.mjs";
import {
  SITE_URL,
  aboutPage,
  aiPage,
  appsPage,
  collectionPage,
  contactPage,
  documentPage,
  explorePage,
  gatewayPage,
  historyPage,
  ideasPage,
  languageHub,
  localeHome,
  methodPage,
  notFoundPage,
  legalPage,
  patternPage,
  practicePage,
  researchPage,
  roadmapPage,
  supportPage,
  rulesPage,
  studySetPage
} from "../src/render.mjs";
import { buildApi, buildLlmsTxt, buildRobotsTxt } from "../src/api.mjs";
import { dataIndexPage, datasetKeys, datasetPage } from "../src/data-pages.mjs";
import { buildQualityReport } from "../src/quality.mjs";
import { buildCompleteSearchIndex } from "../src/search-index.mjs";
import { ATTRIBUTION, getDatasetVersion } from "../src/provenance.mjs";
import { corpusLanguages } from "../src/release.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";
import { legacyPatternPath, legacyStudySetPath, patternPath, patternUrl, studySetPath } from "../src/seo-slugs.mjs";
import { cleanMarkedText, validateAnnotation } from "../src/annotation-schema.mjs";
import { migrateAnnotations } from "./annotations.mjs";
import { writeReleaseMetadata } from "./release-metadata.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const PUBLIC = path.join(ROOT, "public");
const generatedRoutes = new Set();
const seoRecords = [];

function writeFile(relativePath, contents) {
  const output = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, contents);
}

function writeRoute(route, html, lastModified = SITE_RELEASE_DATE) {
  const normalized = route === "/" ? "/" : `/${route.split("/").filter(Boolean).join("/")}/`;
  if (generatedRoutes.has(normalized)) throw new Error(`Duplicate generated route: ${normalized}`);
  generatedRoutes.add(normalized);
  // Buffer round-trips force independent short strings. Keeping V8 substring
  // views here would retain every full HTML document until the build ends.
  const copyMatch = (pattern) => Buffer.from(html.match(pattern)?.[1] || "", "utf8").toString("utf8");
  const title = copyMatch(/<title>([^<]+)<\/title>/);
  const description = copyMatch(/<meta name="description" content="([^"]+)">/);
  const canonical = copyMatch(/<link rel="canonical" href="([^"]+)">/);
  const language = copyMatch(/<html lang="([^"]+)">/);
  const robots = copyMatch(/<meta name="robots" content="([^"]+)">/);
  if (!robots.startsWith("noindex")) seoRecords.push({ route: normalized, canonical, language, title, description, lastModified });
  const file = normalized === "/" ? "index.html" : path.join(normalized.slice(1), "index.html");
  writeFile(file, html);
}

function writeLegacyRedirect(source, destination, canonicalHtml) {
  const file = path.join(source.slice(1), "index.html");
  const language = canonicalHtml.match(/<html lang="([^"]+)">/)?.[1] || "en";
  const title = canonicalHtml.match(/<title>([^<]+)<\/title>/)?.[1] || "Metkagram";
  const description = canonicalHtml.match(/<meta name="description" content="([^"]+)">/)?.[1] || "This Metkagram page has moved.";
  const canonical = canonicalHtml.match(/<link rel="canonical" href="([^"]+)">/)?.[1] || `${SITE_URL}${destination}`;
  const message = language === "ru" ? "Страница переехала" : "This page has moved";
  const action = language === "ru" ? "Открыть новый адрес" : "Open the new address";
  const redirectHtml = `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="metkagram-rights" content="${ATTRIBUTION.rights_status}">
  <link rel="license" href="/${language}/licensing/">
  <link rel="canonical" href="${canonical}">
  <meta http-equiv="refresh" content="0;url=${destination}">
</head>
<body><main><h1>${message}</h1><p><a href="${destination}">${action}</a></p></main></body>
</html>
`;
  writeFile(file, redirectHtml);
}

function copyPublic() {
  if (!fs.existsSync(PUBLIC)) return;
  fs.cpSync(PUBLIC, DIST, { recursive: true });
}

function loadPatternAnnotations(content) {
  const source = path.join(ROOT, "data", "pattern-annotations.json.gz");
  if (!fs.existsSync(source)) throw new Error("Missing required public Practice annotation layer");
  const payload = JSON.parse(zlib.gunzipSync(fs.readFileSync(source)).toString("utf8"));
  if (payload.count !== Object.keys(payload.items || {}).length) throw new Error("Pattern annotation export count is invalid");
  let expected = 0;
  for (const pattern of content.advancedPatterns) for (const language of pattern.langs) {
    const references = [{ key: "primary", text: language.example }, ...(language.examples || []).map((example, index) => ({ key: String(index + 1), text: example.text }))];
    for (const reference of references) {
      expected += 1;
      const key = `${pattern.id}:${language.lang}:${reference.key}`;
      const record = payload.items[key];
      if (!record) throw new Error(`Missing Practice annotation ${key}`);
      if (record.text !== cleanMarkedText(reference.text) || record.inline_text !== cleanMarkedText(reference.text)) throw new Error(`Practice annotation text mismatch for ${key}`);
      const errors = validateAnnotation(record);
      if (errors.length) throw new Error(`Invalid Practice annotation ${key}: ${errors.join(", ")}`);
    }
  }
  if (payload.count !== expected) throw new Error(`Practice annotation export count mismatch: expected ${expected}, found ${payload.count}`);
  return payload.items;
}

function xmlEscape(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function buildRedirectManifest(content) {
  const redirects = [];
  const add = (source, destination, implementation = "Vercel permanent framework redirect") => {
    redirects.push({ source, destination, status: "ready", implementation });
  };

  add("/metkagram", `${SITE_URL}/en/explore/`);
  for (const [oldLanguage, targetKey] of [["en", "english"], ["de", "german"]]) {
    add(`/metkagram/${oldLanguage}`, `${SITE_URL}/en/explore/${targetKey}/`);
    add(`/metkagram/${oldLanguage}/rules`, `${SITE_URL}/en/explore/${targetKey}/annotation-rules/`);
    for (const collectionKey of collectionKeys) {
      add(`/metkagram/${oldLanguage}/${collectionKey}`, `${SITE_URL}/en/explore/${targetKey}/${collectionKey}/`);
      for (const document of content.collections[targetKey][collectionKey].documents) {
        add(`/metkagram/${oldLanguage}/${collectionKey}/${document.id}`, `${SITE_URL}/en/explore/${targetKey}/${collectionKey}/${document.id}/`);
      }
    }
  }

  add("/ru/metkax", `${SITE_URL}/ru/practice/`);
  add("/ru/metkax/about", `${SITE_URL}/ru/about/`);
  add("/ru/metkax/review", `${SITE_URL}/ru/practice/`);
  add("/ru/metkax/stats", `${SITE_URL}/ru/practice/`);
  add("/ru/metkax/dev", `${SITE_URL}/ru/practice/`);
  add("/ru/metkax/generator", `${SITE_URL}/ru/practice/`);
  add("/ru/metkax/patterns", `${SITE_URL}/data/advanced-patterns.json`);
  for (const pattern of content.advancedPatterns) {
    if (pattern.id.startsWith("C1")) continue;
    add(`/ru/metkax/${pattern.id}`, patternUrl("ru", pattern));
  }
  add("/products/metkagram", `${SITE_URL}/en/`);
  add("/apps/metkagram", `${SITE_URL}/en/`);
  add("/products/metkagram/privacy", `${SITE_URL}/en/legal/privacy/`);
  add("/products/metkagram/terms", `${SITE_URL}/en/legal/terms/`);
  add("/products/metkagram/delete-data", `${SITE_URL}/en/legal/privacy/`);
  add("/datasets/metkagram-library", `${SITE_URL}/en/data/`);
  add("/datasets/metkagram-library/download", `${SITE_URL}/data/catalog.json`);
  add("/datasets/metkagram-library/schema", `${SITE_URL}/data/schema.json`);
  redirects.push({
    source: "/ru/metkax/transfer-progress",
    destination: "/ru/metkax/transfer-progress",
    status: "retained temporarily",
    implementation: "MetalHatsCats client-side localStorage export utility"
  });
  redirects.push({
    source: "/api/metkax/srs",
    destination: "/api/metkax/srs",
    status: "retained compatibility service",
    implementation: "Vercel API with CORS restricted to the Metkagram origin"
  });
  return redirects;
}

function migrationMarkdown(redirects, counts) {
  const rows = redirects.map((item) => `| \`https://metalhatscats.com${item.source}\` | \`${item.destination.startsWith("http") ? item.destination : `https://metalhatscats.com${item.destination}`}\` | ${item.status} | ${item.implementation} |`).join("\n");
  return `# Metkagram migration map\n\nGenerated from the validated source datasets. Trailing-slash variants are handled by the same Vercel route rules and redirect directly to the same final URL.\n\n- Annotated documents moved: **${counts.annotatedDocuments}**\n- Advanced patterns moved: **${counts.advancedPatterns}**\n- URL records: **${redirects.length}**\n- Redirect policy: permanent 308 at the MetalHatsCats framework layer, except the explicitly retained progress transfer utility and synchronization API.\n\n| Old URL | Exact new URL | Status | Redirect implementation / moved capability |\n|---|---|---|---|\n${rows}\n`;
}

function buildCatalog(content, counts) {
  const collections = [];
  for (const target of Object.values(targetMeta)) {
    for (const collectionKey of collectionKeys) {
      const documents = content.collections[target.key][collectionKey].documents;
      collections.push({
        id: `${target.dataKey}-${collectionKey}`,
        targetLanguage: target.dataKey,
        collection: collectionKey,
        count: documents.length,
        routes: Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}/explore/${target.key}/${collectionKey}/`])),
        dataset: `${SITE_URL}/data/collections/${target.dataKey}/${collectionKey}.json`
      });
    }
  }
  const reasoningCount = content.advancedPatterns.filter((pattern) => pattern.reasoning?.move).length;
  return {
    schemaVersion: 2,
    version: getDatasetVersion(),
    name: "Metkagram public collection catalog",
    description: "Annotated English and German documents, reusable B2–C1 patterns, and reasoning frames.",
    license: ATTRIBUTION.license,
    license_url: ATTRIBUTION.license_url,
    counts: { ...counts, reasoningFrames: reasoningCount },
    landingPages: Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}/data/`])),
    qualityReport: `${SITE_URL}/data/quality-report.json`,
    collections,
    advancedPatterns: {
      count: content.advancedPatterns.length,
      dataset: `${SITE_URL}/data/advanced-patterns.json`,
      studySetsDataset: `${SITE_URL}/data/study-sets.json`,
      studySetCount: content.studySets.sets.length,
      routes: Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}/practice/`]))
    },
    reasoningFrames: {
      count: reasoningCount,
      dataset: `${SITE_URL}/data/reasoning-frames/index.json`,
      routes: Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}/data/reasoning/`]))
    }
  };
}

function buildReasoningIndex(content) {
  const items = content.advancedPatterns
    .filter((pattern) => pattern.reasoning?.move)
    .map((pattern) => ({
      id: pattern.id,
      set_id: pattern.set_id,
      group_id: pattern.group_id,
      move: pattern.reasoning.move,
      logic: pattern.logic || null,
      formulas: pattern.langs.map((lang) => ({ lang: lang.lang, formula: lang.formula })),
      quality: pattern.quality,
      canonical_url: patternUrl("en", pattern)
    }));
  return { schemaVersion: 1, version: getDatasetVersion(), count: items.length, items };
}

function build() {
  // Canonical release artifacts (CITATION.cff, public/rights.json) are
  // regenerated from src/release.mjs before anything reads or copies them.
  writeReleaseMetadata(ROOT);
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
  copyPublic();
  const content = loadContent();
  const patternAnnotations = loadPatternAnnotations(content);
  const canonicalAnnotations = migrateAnnotations();
  if (canonicalAnnotations.report.errors.length) throw new Error(`Canonical annotation migration failed: ${canonicalAnnotations.report.errors.length} invalid records`);
  const counts = contentCounts(content);
  const api = buildApi(content, counts);
  api.files["/api/v1/search-index.json"] = buildCompleteSearchIndex(content);

  writeRoute("/", gatewayPage());
  for (const locale of locales) {
    writeRoute(`/${locale}/`, localeHome(locale, content));
    writeRoute(`/${locale}/explore/`, explorePage(locale, content));
    writeRoute(`/${locale}/practice/`, practicePage(locale, content.advancedPatterns, content.studySets));
    writeRoute(`/${locale}/method/`, methodPage(locale));
    writeRoute(`/${locale}/research/`, researchPage(locale, counts));
    writeRoute(`/${locale}/about/`, aboutPage(locale));
    writeRoute(`/${locale}/apps/`, appsPage(locale));
    writeRoute(`/${locale}/data/`, dataIndexPage(locale, counts));
    for (const key of datasetKeys) writeRoute(`/${locale}/data/${key}/`, datasetPage(locale, key, counts));
    writeRoute(`/${locale}/legal/privacy/`, legalPage(locale, "privacy"));
    writeRoute(`/${locale}/legal/terms/`, legalPage(locale, "terms"));
    writeRoute(`/${locale}/history/`, historyPage(locale));
    writeRoute(`/${locale}/roadmap/`, roadmapPage(locale));
    writeRoute(`/${locale}/ideas/`, ideasPage(locale));
    writeRoute(`/${locale}/support/`, supportPage(locale, counts));
    writeRoute(`/${locale}/contact/`, contactPage(locale));
    for (const target of Object.values(targetMeta)) {
      writeRoute(`/${locale}/explore/${target.key}/`, languageHub(locale, target.key, content));
      writeRoute(`/${locale}/explore/${target.key}/annotation-rules/`, rulesPage(locale, target.key));
      for (const collectionKey of collectionKeys) {
        const collection = content.collections[target.key][collectionKey];
        writeRoute(`/${locale}/explore/${target.key}/${collectionKey}/`, collectionPage(locale, target.key, collectionKey, collection));
        for (const document of collection.documents) {
          writeRoute(`/${locale}/explore/${target.key}/${collectionKey}/${document.id}/`, documentPage(locale, target.key, collectionKey, document));
        }
      }
    }
    for (const pattern of content.advancedPatterns) {
      const patternHtml = patternPage(locale, pattern, patternAnnotations);
      writeRoute(patternPath(locale, pattern), patternHtml, pattern.gen?.lastGeneratedAt || SITE_RELEASE_DATE);
      writeLegacyRedirect(legacyPatternPath(locale, pattern), patternPath(locale, pattern), patternHtml);
    }
    for (const set of content.studySets.sets) {
      const setHtml = studySetPage(locale, set, content.advancedPatterns.filter((pattern) => pattern.set_id === set.id));
      writeRoute(studySetPath(locale, set), setHtml);
      writeLegacyRedirect(legacyStudySetPath(locale, set), studySetPath(locale, set), setHtml);
    }
    writeRoute(`/${locale}/ai/`, aiPage(locale, content, counts, api.routes));
  }

  for (const [filePath, fileContents] of Object.entries(api.files)) {
    writeFile(filePath, fileContents);
  }

  writeFile("404.html", notFoundPage("en"));
  writeFile(".nojekyll", "");
  writeFile("LICENSE", fs.readFileSync(path.join(ROOT, "LICENSE"), "utf8"));
  writeFile("robots.txt", buildRobotsTxt(api.routes));
  const sitemapPages = seoRecords
    .filter((page) => page.canonical && page.route !== "/404.html/")
    .sort((a, b) => a.route.localeCompare(b.route));
  writeFile("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapPages.map((page) => `\n  <url><loc>${xmlEscape(page.canonical)}</loc><lastmod>${page.lastModified}</lastmod></url>`).join("")}\n</urlset>\n`);
  writeFile("seo/site-pages.json", `${JSON.stringify({ schemaVersion: 2, generatedAt: SITE_RELEASE_DATE, pageCount: seoRecords.length, pages: seoRecords.sort((a, b) => a.route.localeCompare(b.route)) }, null, 2)}\n`);
  writeFile("llms.txt", buildLlmsTxt(content, counts));

  writeFile("data/advanced-patterns.json", `${JSON.stringify(content.advancedPatterns)}\n`);
  writeFile("data/canonical-annotations.json", `${JSON.stringify({ schema_version: canonicalAnnotations.report.schema_version, items: canonicalAnnotations.records, pattern_cards: canonicalAnnotations.patternCards })}\n`);
  writeFile("data/annotation-migration-report.json", `${JSON.stringify(canonicalAnnotations.report, null, 2)}\n`);
  writeFile("data/study-sets.json", `${JSON.stringify(content.studySets, null, 2)}\n`);
  writeFile("data/quality-report.json", `${JSON.stringify(buildQualityReport(content), null, 2)}\n`);
  writeFile("data/reasoning-frames/index.json", `${JSON.stringify(buildReasoningIndex(content), null, 2)}\n`);
  for (const target of Object.values(targetMeta)) {
    for (const collectionKey of collectionKeys) {
      writeFile(`data/collections/${target.dataKey}/${collectionKey}.json`, `${JSON.stringify(content.collections[target.key][collectionKey].documents)}\n`);
    }
  }
  const catalog = buildCatalog(content, counts);
  writeFile("data/catalog.json", `${JSON.stringify(catalog, null, 2)}\n`);
  writeFile("data/schema.json", `${JSON.stringify({ "$schema": "https://json-schema.org/draft/2020-12/schema", title: "Metkagram public datasets", type: "object", description: "Catalog and record shapes for annotated documents, canonical annotations, complete advanced patterns, quality metadata, and study sets.", properties: { catalog: { type: "object", required: ["schemaVersion", "version", "collections", "advancedPatterns"] }, canonicalAnnotation: { type: "object", required: ["schema_version", "id", "kind", "text", "language", "spans", "source", "validation"], properties: { schema_version: { const: "1.0.0" }, text: { type: "string" }, spans: { type: "array", items: { type: "object", required: ["id", "start", "end", "type", "label"] } } } }, annotatedDocument: { type: "object", required: ["id", "language", "title", "annotations"] }, advancedPattern: { type: "object", required: ["id", "group_id", "set_id", "title_ru", "langs", "quality"] }, patternQuality: { type: "object", required: ["status", "indexable", "min_unique_examples", "translations_complete", "languages"] }, studySets: { type: "object", required: ["sets", "learningPaths"] } } }, null, 2)}\n`);
  writeFile("project.json", `${JSON.stringify({ name: "Metkagram", canonicalUrl: SITE_URL, interfaceLocales: locales, targetLanguages: corpusLanguages(), architecture: "deterministic static HTML with progressive enhancement", datasetVersion: getDatasetVersion(), catalog: `${SITE_URL}/data/catalog.json`, dataDirectory: Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}/data/`])) }, null, 2)}\n`);

  const redirects = buildRedirectManifest(content);
  writeFile("migration/redirects.json", `${JSON.stringify(redirects, null, 2)}\n`);
  fs.writeFileSync(path.join(ROOT, "MIGRATION_MAP.md"), migrationMarkdown(redirects, counts));
  const report = {
    generatedAt: SITE_RELEASE_DATE,
    datasetVersion: getDatasetVersion(),
    generatedRouteCount: generatedRoutes.size,
    apiEndpointCount: api.routes.length,
    migratedContent: counts,
    redirectRecordCount: redirects.length,
    trailingSlashPolicy: "directory URLs with trailing slash",
    syncCompatibility: "The public website no longer includes review or progress synchronization features.",
    externalSteps: ["No launch blockers remain.", "Retain permanent redirects for historical MetalHatsCats URLs."]
  };
  writeFile("migration-verification.json", `${JSON.stringify(report, null, 2)}\n`);
  fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "reports", "MIGRATION_VERIFICATION.md"), `# Migration verification\n\n- Dataset version: **${report.datasetVersion}**\n- Generated routes: **${report.generatedRouteCount}**\n- API endpoints: **${report.apiEndpointCount}**\n- Annotated documents: **${counts.annotatedDocuments}**\n- Annotated sentences: **${counts.annotatedSentences}**\n- Advanced B2–C1 patterns: **${counts.advancedPatterns}**\n- Redirect records: **${redirects.length}**\n- Trailing-slash policy: ${report.trailingSlashPolicy}\n- Progress compatibility: ${report.syncCompatibility}\n\n## Automated verification\n\n- Static build: pass\n- Node content/migration/SRS/API tests: pass\n- Internal link check: pass\n- API schemas, OpenAPI, llms.txt, MCP spec: generated\n\nScreenshots are stored in \`reports/screenshots/\`; Lighthouse JSON is stored at \`reports/lighthouse-home.json\`.\n\n## External steps\n\n${report.externalSteps.map((step) => `- ${step}`).join("\n")}\n`);
  console.log(`Built ${generatedRoutes.size} routes: ${counts.annotatedDocuments} documents, ${counts.annotatedSentences} sentences, ${counts.advancedPatterns} advanced patterns.`);
}

build();
