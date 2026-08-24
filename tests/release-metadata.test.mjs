import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { ATTRIBUTION, getDatasetVersion } from "../src/provenance.mjs";
import { releaseLabel } from "../src/i18n.mjs";
import { getLanguage } from "../src/language-registry.mjs";
import {
  HISTORICAL_LICENSE,
  RELEASE,
  citationCff,
  citationFormats,
  corpusLanguages,
  rightsJson,
} from "../src/release.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function walk(directory, predicate, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target, predicate, output);
    else if (entry.isFile() && predicate(entry.name)) output.push(target);
  }
  return output;
}

test("committed CITATION.cff matches the canonical release state", () => {
  const committed = fs.readFileSync(path.join(ROOT, "CITATION.cff"), "utf8");
  assert.equal(committed, citationCff(), "CITATION.cff drifted from src/release.mjs — run `node scripts/release-metadata.mjs`");
});

test("committed public/rights.json matches the canonical release state", () => {
  const committed = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "rights.json"), "utf8"));
  assert.deepEqual(committed, rightsJson(), "public/rights.json drifted from src/release.mjs — run `node scripts/release-metadata.mjs`");
});

test("canonical release state is internally consistent", () => {
  assert.equal(RELEASE.releaseDate, SITE_RELEASE_DATE);
  assert.equal(RELEASE.citation.dateReleased, SITE_RELEASE_DATE);
  assert.equal(RELEASE.canonicalUrl, SITE_URL);
  assert.equal(RELEASE.rights.status, ATTRIBUTION.rights_status);
  assert.equal(RELEASE.rights.label, ATTRIBUTION.license);
  assert.equal(RELEASE.rights.historicalLicense.license, "CC BY-NC 4.0");
  assert.equal(RELEASE.rights.historicalLicense.before, "2026-08-17");
  assert.ok(RELEASE.releaseDate > RELEASE.rights.effectiveDate, "release date must be newer than the rights effective date");
  assert.deepEqual(corpusLanguages(), ["en", "de"]);
  // French stays a bounded Frame-only pilot: learning role only, no annotation,
  // no interface, no translation.
  const french = RELEASE.languages.languages.fr;
  assert.equal(french.status, "pilot");
  assert.deepEqual(french.roles, { interface: false, learning: true, translation: false, annotation: false });
});

test("API surfaces report the canonical release and rights metadata", () => {
  const index = JSON.parse(fs.readFileSync(path.join(DIST, "api/v1/index.json"), "utf8"));
  assert.equal(index.license, ATTRIBUTION.license);
  assert.equal(index.license_url, ATTRIBUTION.license_url);
  assert.equal(index.rights_status, "source-available-not-open-source");
  assert.equal(index.release_date, SITE_RELEASE_DATE);
  assert.equal(index.dataset_version, getDatasetVersion());

  const attribution = JSON.parse(fs.readFileSync(path.join(DIST, "api/v1/attribution.json"), "utf8"));
  assert.equal(attribution.data.policy.citation_formats.academic, citationFormats().academic);
  assert.ok(!attribution.data.policy.citation_formats.academic.includes("CC BY-NC"));

  const mcp = JSON.parse(fs.readFileSync(path.join(DIST, "api/v1/mcp-server.json"), "utf8"));
  assert.equal(mcp.version, getDatasetVersion());
  assert.equal(mcp.attribution.license, ATTRIBUTION.license);

  for (const relative of ["data/publication.json", "api/v1/publication.json"]) {
    const payload = JSON.parse(fs.readFileSync(path.join(DIST, relative), "utf8"));
    const manifest = payload.data || payload;
    assert.equal(manifest.releaseDate, SITE_RELEASE_DATE, `${relative} releaseDate`);
    assert.equal(manifest.rights.status, "source-available-not-open-source", `${relative} rights.status`);
  }

  const project = JSON.parse(fs.readFileSync(path.join(DIST, "project.json"), "utf8"));
  assert.deepEqual(project.targetLanguages, corpusLanguages());
});

test("citation formats never name the historical license as current", () => {
  const formats = citationFormats();
  for (const [name, value] of Object.entries(formats)) {
    assert.ok(!value.includes(HISTORICAL_LICENSE.license), `citation format "${name}" must not cite the historical CC BY-NC license as current`);
  }
});

test("CC BY-NC appears only as explicit history, never as current rights", () => {
  const historicalExact = ATTRIBUTION.historical_license;
  const offenders = [];
  const files = walk(DIST, (name) => /\.(html|json|jsonl|txt|md)$/.test(name));
  for (const file of files) {
    const relative = path.relative(DIST, file).replaceAll(path.sep, "/");
    let text = fs.readFileSync(file, "utf8");
    if (!text.includes("CC BY-NC")) continue;
    // Explicitly historical surfaces are allowed to name the old license.
    if (relative === "LICENSE" || relative === "rights.json" || /^(en|ru)\/licensing\//.test(relative)) continue;
    // Provenance blocks carry the historical_license note; remove the exact
    // canonical historical strings and require that nothing else mentions it.
    text = text.split(historicalExact).join("");
    text = text.split(HISTORICAL_LICENSE.note).join("");
    if (text.includes("CC BY-NC")) offenders.push(relative);
  }
  assert.deepEqual(offenders, [], `CC BY-NC mentioned outside historical context in: ${offenders.join(", ")}`);
});

test("every published HTML page carries the canonical rights meta", () => {
  const missing = [];
  for (const file of walk(DIST, (name) => name.endsWith(".html"))) {
    const html = fs.readFileSync(file, "utf8");
    if (!html.includes("</head>")) continue; // partial snippets, verification files
    if (!html.includes('<meta name="metkagram-rights" content="source-available-not-open-source">')) {
      missing.push(path.relative(DIST, file));
    }
  }
  assert.deepEqual(missing, [], `pages missing the canonical rights meta: ${missing.slice(0, 10).join(", ")}`);
});

test("language capability declarations match the registry", () => {
  const languages = JSON.parse(fs.readFileSync(path.join(DIST, "data", "languages.json"), "utf8"));
  assert.deepEqual(languages.interfaceLocales, ["en", "ru"]);
  assert.deepEqual(languages.annotationLanguages, ["en", "de"]);
  assert.equal(languages.languages.fr.status, "pilot");
  assert.equal(languages.languages.fr.roles.annotation, false);

  const apiLanguages = JSON.parse(fs.readFileSync(path.join(DIST, "api/v1/languages.json"), "utf8"));
  assert.deepEqual(apiLanguages.data.map((entry) => entry.code), corpusLanguages());
  for (const entry of apiLanguages.data) {
    assert.equal(entry.name, getLanguage(entry.code).nativeName, `languages.json name for ${entry.code} must come from the registry`);
  }
});

test("human-readable docs carry the canonical academic citation", () => {
  // Markdown emphasis markers are stripped before comparing against the
  // canonical plain-text citation from src/release.mjs.
  const canonical = citationFormats().academic;
  for (const relative of ["LICENSING.md", "docs/RESEARCH_USE.md"]) {
    const text = fs.readFileSync(path.join(ROOT, relative), "utf8").replaceAll("*", "");
    assert.ok(text.includes(canonical), `${relative} drifted from the canonical citation: ${canonical}`);
  }
});

test("llms.txt uses the canonical citation formats", () => {
  const llms = fs.readFileSync(path.join(DIST, "llms.txt"), "utf8");
  assert.ok(llms.includes(`Academic: ${citationFormats().academic}`), "llms.txt academic citation must come from citationFormats()");
  assert.ok(llms.includes(`AI-generated answer: "${citationFormats().ai_answer}"`));
  assert.ok(!llms.includes(HISTORICAL_LICENSE.license), "llms.txt must not name the historical license");
});

test("distribution surfaces derive rights and language metadata", () => {
  const card = fs.readFileSync(path.join(DIST, "distribution", "huggingface", "README.md"), "utf8");
  assert.ok(card.includes(`license_name: ${ATTRIBUTION.license}`));
  assert.ok(card.includes(`license_link: ${ATTRIBUTION.license_url}`));
  assert.ok(!card.includes(HISTORICAL_LICENSE.license), "dataset card must not present CC BY-NC as current");

  for (const locale of ["en", "ru"]) {
    const cite = fs.readFileSync(path.join(DIST, locale, "cite", "index.html"), "utf8");
    assert.ok(cite.includes(citationFormats().publication), `${locale}/cite/ must carry the canonical publication citation`);
  }
});

test("roadmap release label derives from the canonical release date", () => {
  const month = SITE_RELEASE_DATE.slice(0, 7);
  for (const locale of ["en", "ru"]) {
    const html = fs.readFileSync(path.join(DIST, locale, "roadmap", "index.html"), "utf8");
    assert.ok(html.includes(`<time datetime="${month}">${releaseLabel(locale)}</time>`), `${locale}/roadmap/ release label must derive from SITE_RELEASE_DATE`);
  }
});
