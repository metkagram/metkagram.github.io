import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { loadContent } from "../src/content.mjs";
import { loadPatternShards, writePatternCorpus } from "../src/pattern-sources.mjs";
import { patternPath } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");
const BASELINE_FILE = path.join(ROOT, "tests", "fixtures", "pattern-corpus-baseline.json");
const ALIASES_FILE = path.join(DATA, "pattern-aliases.json");
const ANNOTATIONS_FILE = path.join(DATA, "pattern-annotations.json.gz");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function stableRecordHash(records) {
  return sha(records.map((record) => JSON.stringify(stableValue(record))).sort().join("\n"));
}

function normalizeStructuralFormula(value = "") {
  return String(value)
    .replaceAll("…", "...")
    .trim()
    .toLocaleLowerCase()
    .replace(/\[[^\]]*\]/g, "[]")
    .replace(/\s+/g, " ")
    .replace(/\s*([,;:?.!])\s*/g, "$1")
    .replace(/\s*\+\s*/g, "+")
    .trim();
}

function structuralSignature(pattern) {
  const byLanguage = new Map((pattern.langs || []).map((language) => [language.lang, normalizeStructuralFormula(language.formula)]));
  return ["en", "de"].map((language) => `${language}:${byLanguage.get(language) || ""}`).join("|");
}

function countsBySet(patterns) {
  const counts = {};
  for (const pattern of patterns) counts[pattern.set_id] = (counts[pattern.set_id] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function patchContentValidation() {
  const file = path.join(ROOT, "src", "content.mjs");
  let source = fs.readFileSync(file, "utf8");

  if (!source.includes("function normalizeStructuralFormula")) {
    const anchor = `function normalizeFormula(value = "") {\n  return String(value).trim().toLocaleLowerCase();\n}\n`;
    const addition = `${anchor}\nfunction normalizeStructuralFormula(value = "") {\n  return String(value)\n    .replaceAll("…", "...")\n    .trim()\n    .toLocaleLowerCase()\n    .replace(/\\[[^\\]]*\\]/g, "[]")\n    .replace(/\\s+/g, " ")\n    .replace(/\\s*([,;:?.!])\\s*/g, "$1")\n    .replace(/\\s*\\+\\s*/g, "+")\n    .trim();\n}\n\nfunction structuralPatternSignature(pattern) {\n  const byLanguage = new Map((pattern.langs || []).map((language) => [language.lang, normalizeStructuralFormula(language.formula)]));\n  return corpusLanguages().map((language) => `${language}:${byLanguage.get(language) || ""}`).join("|");\n}\n`;
    if (!source.includes(anchor)) throw new Error("Could not find normalizeFormula anchor in src/content.mjs");
    source = source.replace(anchor, addition);
  }

  source = source.replace(
    `  assert(advancedPatterns.length >= 1000, \`pattern corpus (data/patterns/) requires at least 1,000 patterns; found ${advancedPatterns.length}\`);`,
    `  assert(advancedPatterns.length > 0, "pattern corpus must not be empty");`
  );

  if (!source.includes("const structuralFrames = new Map();")) {
    source = source.replace(
      `  const patternIds = new Set();\n  const formulas = new Set();`,
      `  const patternIds = new Set();\n  const formulas = new Set();\n  const structuralFrames = new Map();`
    );
  }

  if (!source.includes("structural duplicate advanced pattern")) {
    const anchor = `    patternIds.add(pattern.id.toLowerCase());\n`;
    const addition = `${anchor}    const structuralKey = \`${pattern.set_id}:${structuralPatternSignature(pattern)}\`;\n    const structuralOwner = structuralFrames.get(structuralKey);\n    assert(!structuralOwner, \`structural duplicate advanced pattern ${pattern.id} repeats ${structuralOwner} in ${pattern.set_id}\`);\n    structuralFrames.set(structuralKey, pattern.id);\n`;
    if (!source.includes(anchor)) throw new Error("Could not find pattern ID validation anchor in src/content.mjs");
    source = source.replace(anchor, addition);
  }

  fs.writeFileSync(file, source);
}

function writeAliasRenderer() {
  const file = path.join(ROOT, "scripts", "pattern-alias-redirects.mjs");
  const source = `import fs from "node:fs";\nimport path from "node:path";\n\nimport { loadContent } from "../src/content.mjs";\nimport { SITE_URL } from "../src/site.mjs";\nimport { legacyPatternPath, patternPath } from "../src/seo-slugs.mjs";\n\nconst ROOT = process.cwd();\nconst DIST = path.join(ROOT, "dist");\nconst ALIASES_FILE = path.join(ROOT, "data", "pattern-aliases.json");\n\nfunction escapeHtml(value) {\n  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");\n}\n\nfunction writeRedirect(route, destination, locale, aliasId, targetId) {\n  const relative = route.split("/").filter(Boolean).join("/");\n  const file = path.join(DIST, relative, "index.html");\n  fs.mkdirSync(path.dirname(file), { recursive: true });\n  const targetUrl = \`${SITE_URL}${destination}\`;\n  const title = locale === "ru" ? "Паттерн объединён · Metkagram" : "Pattern consolidated · Metkagram";\n  const message = locale === "ru" ? \`Паттерн ${aliasId} объединён с ${targetId}.\` : \`Pattern ${aliasId} was consolidated into ${targetId}.\`;\n  fs.writeFileSync(file, \`<!doctype html>\n<html lang="${locale}">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <title>${escapeHtml(title)}</title>\n  <meta name="robots" content="noindex,follow">\n  <link rel="canonical" href="${escapeHtml(targetUrl)}">\n  <meta http-equiv="refresh" content="0;url=${escapeHtml(destination)}">\n</head>\n<body><main><p>${escapeHtml(message)}</p><p><a href="${escapeHtml(destination)}">${locale === "ru" ? "Открыть канонический паттерн" : "Open canonical pattern"}</a></p></main></body>\n</html>\n\`);\n}\n\nif (fs.existsSync(ALIASES_FILE)) {\n  const payload = JSON.parse(fs.readFileSync(ALIASES_FILE, "utf8"));\n  const aliases = payload.aliases || {};\n  const content = loadContent();\n  const activeById = new Map(content.advancedPatterns.map((pattern) => [pattern.id, pattern]));\n  for (const [aliasId, targetId] of Object.entries(aliases)) {\n    if (activeById.has(aliasId)) throw new Error(\`Retired alias ${aliasId} is still active\`);\n    const target = activeById.get(targetId);\n    if (!target) throw new Error(\`Alias ${aliasId} points to missing pattern ${targetId}\`);\n    for (const locale of ["en", "ru"]) {\n      const destination = patternPath(locale, target);\n      for (const source of new Set([patternPath(locale, aliasId), legacyPatternPath(locale, aliasId)])) {\n        if (source !== destination) writeRedirect(source, destination, locale, aliasId, targetId);\n      }\n    }\n  }\n  fs.mkdirSync(path.join(DIST, "data"), { recursive: true });\n  fs.copyFileSync(ALIASES_FILE, path.join(DIST, "data", "pattern-aliases.json"));\n}\n`;
  fs.writeFileSync(file, source);
}

function patchRenderStage() {
  const file = path.join(ROOT, "scripts", "stages", "render.mjs");
  let source = fs.readFileSync(file, "utf8");
  if (!source.includes("pattern-alias-redirects")) {
    source = source.replace(
      `// - seo-graph-normalize remains the final broad SEO graph pass so it cannot re-add\n`,
      `// - pattern-alias-redirects restores retired Pattern URLs only as noindex redirects\n//   after normal Pattern-producing passes and before broad SEO normalization;\n// - seo-graph-normalize remains the final broad SEO graph pass so it cannot re-add\n`
    );
    source = source.replace(
      `  "scripts/method-guides.mjs",\n  "scripts/seo-graph-normalize.mjs",`,
      `  "scripts/method-guides.mjs",\n  "scripts/pattern-alias-redirects.mjs",\n  "scripts/seo-graph-normalize.mjs",`
    );
  }
  fs.writeFileSync(file, source);
}

function writeAliasTests() {
  const file = path.join(ROOT, "tests", "pattern-aliases.test.mjs");
  const source = `import assert from "node:assert/strict";\nimport fs from "node:fs";\nimport path from "node:path";\nimport test from "node:test";\n\nimport { loadContent } from "../src/content.mjs";\n\nconst ROOT = process.cwd();\nconst aliases = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "pattern-aliases.json"), "utf8")).aliases;\nconst baseline = JSON.parse(fs.readFileSync(path.join(ROOT, "tests", "fixtures", "pattern-corpus-baseline.json"), "utf8"));\n\nfunction normalize(value = "") {\n  return String(value).replaceAll("…", "...").trim().toLocaleLowerCase().replace(/\\[[^\\]]*\\]/g, "[]").replace(/\\s+/g, " ").replace(/\\s*([,;:?.!])\\s*/g, "$1").replace(/\\s*\\+\\s*/g, "+").trim();\n}\n\nfunction signature(pattern) {\n  const byLanguage = new Map((pattern.langs || []).map((language) => [language.lang, normalize(language.formula)]));\n  return ["en", "de"].map((language) => `${language}:${byLanguage.get(language) || ""}`).join("|");\n}\n\ntest("retired slot-expansion IDs resolve only to active canonical patterns", () => {\n  const active = new Set(loadContent().advancedPatterns.map((pattern) => pattern.id));\n  assert.equal(Object.keys(aliases).length, baseline.structuralDeduplication.retiredPatternCount);\n  for (const [aliasId, targetId] of Object.entries(aliases)) {\n    assert.ok(!active.has(aliasId), `${aliasId} must stay retired`);\n    assert.ok(active.has(targetId), `${aliasId} points to missing canonical pattern ${targetId}`);\n    assert.notEqual(aliasId, targetId);\n  }\n});\n\ntest("active patterns are structurally unique within each study set", () => {\n  const owners = new Map();\n  for (const pattern of loadContent().advancedPatterns) {\n    const key = `${pattern.set_id}:${signature(pattern)}`;\n    const previous = owners.get(key);\n    assert.ok(!previous, `${pattern.id} repeats structural frame ${previous}`);\n    owners.set(key, pattern.id);\n  }\n});\n`;
  fs.writeFileSync(file, source);
}

function writeDocumentation({ sourceBaseCount, retainedBaseCount, retiredCount, finalMergedCount }) {
  const file = path.join(ROOT, "docs", "PATTERN_DEDUPLICATION.md");
  const source = `# Pattern structural deduplication\n\nMetkagram treats one reusable language frame as one canonical Pattern. Historical slot-value expansion created many records whose English and German formulas differed only in the values written inside square-bracket slots. Those records were useful as generated examples, but they were not distinct learning objects.\n\n## Canonical rule\n\nTwo records are structural duplicates only when all of the following are true:\n\n- they belong to the same study set;\n- their normalized English formulas are identical after square-bracket slot contents become \`[]\`;\n- their normalized German formulas are identical under the same rule.\n\nThe first stable record in study-set order remains canonical. Retired IDs are recorded in \`data/pattern-aliases.json\` and old Pattern URLs render as \`noindex,follow\` redirects to the canonical Pattern. Similar-looking constructions with different grammar or communicative function are not merged by this rule.\n\n## 2026-09-17 migration\n\n- base records before structural deduplication: **${sourceBaseCount.toLocaleString("en-US")}**\n- canonical base Patterns after deduplication: **${retainedBaseCount.toLocaleString("en-US")}**\n- retired slot-expansion IDs: **${retiredCount.toLocaleString("en-US")}**\n- final merged active corpus, including reviewed supplemental Frames: **${finalMergedCount.toLocaleString("en-US")}**\n\nPrecomputed Practice annotations for retired IDs were removed with the records. The build validates that active Patterns remain structurally unique under this conservative same-set EN+DE rule.\n`;
  fs.writeFileSync(file, source);
}

function patchArchitecture() {
  const file = path.join(ROOT, "ARCHITECTURE.md");
  let source = fs.readFileSync(file, "utf8");
  const anchor = `For the existing EN/DE curriculum:\n\n`;
  const addition = `${anchor}- one canonical Pattern represents one EN+DE structural frame inside a study set; historical slot-value expansions are retired aliases, not separate learning objects;\n`;
  if (!source.includes("historical slot-value expansions are retired aliases")) {
    if (!source.includes(anchor)) throw new Error("Could not find architecture data-quality anchor");
    source = source.replace(anchor, addition);
  }
  fs.writeFileSync(file, source);
}

function patchReadme() {
  const file = path.join(ROOT, "README.md");
  let source = fs.readFileSync(file, "utf8");
  source = source.replace("The public curriculum contains 1,000+ reusable B2–C1 English/German patterns", "The public curriculum contains 600+ reusable B2–C1 English/German patterns");
  fs.writeFileSync(file, source);
}

const baseline = readJson(BASELINE_FILE);
const contentBefore = loadContent();
const studySets = readJson(path.join(DATA, "study-sets.json"));
const setOrder = studySets.sets.map((set) => set.id);
const { patterns: basePatterns } = loadPatternShards({ setOrder });
const existingAliases = fs.existsSync(ALIASES_FILE) ? (readJson(ALIASES_FILE).aliases || {}) : {};

const canonicalByKey = new Map();
const kept = [];
const newAliases = {};
for (const pattern of basePatterns) {
  const key = `${pattern.set_id}\u0000${structuralSignature(pattern)}`;
  const canonicalId = canonicalByKey.get(key);
  if (canonicalId) newAliases[pattern.id] = canonicalId;
  else {
    canonicalByKey.set(key, pattern.id);
    kept.push(pattern);
  }
}

const aliases = { ...existingAliases, ...newAliases };
const keptIds = new Set(kept.map((pattern) => pattern.id));
for (const [aliasId, targetId] of Object.entries(aliases)) {
  if (keptIds.has(aliasId)) throw new Error(`Alias ${aliasId} is still canonical`);
  if (!keptIds.has(targetId)) throw new Error(`Alias ${aliasId} points to non-canonical base pattern ${targetId}`);
}

const activeMerged = contentBefore.advancedPatterns.filter((pattern) => !aliases[pattern.id]);
const activeIds = new Set(activeMerged.map((pattern) => pattern.id));
const activeStructuralKeys = new Map();
for (const pattern of activeMerged) {
  const key = `${pattern.set_id}\u0000${structuralSignature(pattern)}`;
  const existing = activeStructuralKeys.get(key);
  if (existing) throw new Error(`Structural duplicate survives migration: ${pattern.id} repeats ${existing}`);
  activeStructuralKeys.set(key, pattern.id);
}

writePatternCorpus(kept, { setOrder });
writeJson(ALIASES_FILE, {
  schemaVersion: 1,
  strategy: "same-set-en-de-structural-frame",
  description: "Retired pattern IDs produced by historical slot-value expansion. Each alias resolves to the first retained canonical pattern with the same normalized English and German structural frame in the same study set.",
  aliases: Object.fromEntries(Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b)))
});

const annotationPayload = JSON.parse(zlib.gunzipSync(fs.readFileSync(ANNOTATIONS_FILE)).toString("utf8"));
const filteredItems = Object.fromEntries(Object.entries(annotationPayload.items || {}).filter(([key]) => activeIds.has(key.split(":", 1)[0])));
annotationPayload.items = filteredItems;
annotationPayload.count = Object.keys(filteredItems).length;
fs.writeFileSync(ANNOTATIONS_FILE, zlib.gzipSync(Buffer.from(`${JSON.stringify(annotationPayload)}\n`), { level: 9, mtime: 0 }));

patchContentValidation();
patchRenderStage();
writeAliasRenderer();
writeAliasTests();
patchReadme();
patchArchitecture();

const baseSetCounts = countsBySet(kept);
const mergedSetCounts = countsBySet(activeMerged);
const sourceBaseCount = baseline.structuralDeduplication?.sourceBasePatternCount || baseline.basePatterns.count;
const sourceMergedCount = baseline.structuralDeduplication?.sourceMergedPatternCount || baseline.mergedCorpus.patternCount;
const retiredCount = Object.keys(aliases).length;

baseline.purpose = "Canonical corpus baseline after structural deduplication of historical slot-value expansions.";
baseline.capturedFrom = "data/patterns/*.json after same-set EN+DE structural deduplication";
baseline.basePatterns = {
  ...baseline.basePatterns,
  count: kept.length,
  sortedIdSha256: sha(kept.map((pattern) => pattern.id).sort().join("\n")),
  recordSetSha256: stableRecordHash(kept),
  setCounts: baseSetCounts
};
baseline.mergedCorpus = {
  ...baseline.mergedCorpus,
  patternCount: activeMerged.length,
  sortedIdSha256: sha(activeMerged.map((pattern) => pattern.id).sort().join("\n")),
  recordSetSha256: stableRecordHash(activeMerged.map(({ quality, ...pattern }) => pattern)),
  idRouteSha256: sha(activeMerged.map((pattern) => `${pattern.id}:${patternPath("en", pattern)}`).sort().join("\n")),
  setCounts: mergedSetCounts,
  studySetCount: contentBefore.studySets.sets.length,
  learningPathCount: contentBefore.studySets.learningPaths.length,
  reasoningMoveCount: activeMerged.filter((pattern) => pattern.reasoning?.move).length
};
baseline.structuralDeduplication = {
  date: "2026-09-17",
  rule: "same study set + equal normalized English and German formulas after replacing square-bracket slot contents with []",
  sourceBasePatternCount: sourceBaseCount,
  sourceMergedPatternCount: sourceMergedCount,
  canonicalBasePatternCount: kept.length,
  retiredPatternCount: retiredCount,
  finalMergedPatternCount: activeMerged.length
};
writeJson(BASELINE_FILE, baseline);
writeDocumentation({ sourceBaseCount, retainedBaseCount: kept.length, retiredCount, finalMergedCount: activeMerged.length });

console.log(`Pattern corpus deduplicated: ${basePatterns.length} -> ${kept.length} base records; ${retiredCount} retired IDs; ${activeMerged.length} active merged patterns.`);
