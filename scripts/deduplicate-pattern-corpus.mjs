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

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");

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
  return ["en", "de"].map((language) => language + ":" + (byLanguage.get(language) || "")).join("|");
}

function countsBySet(patterns) {
  const counts = {};
  for (const pattern of patterns) counts[pattern.set_id] = (counts[pattern.set_id] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function patchContentValidation() {
  const file = path.join(ROOT, "src", "content.mjs");
  let source = fs.readFileSync(file, "utf8");
  const normalizeAnchor = 'function normalizeFormula(value = "") {\n  return String(value).trim().toLocaleLowerCase();\n}\n';

  if (!source.includes("function normalizeStructuralFormula")) {
    const addition = normalizeAnchor + [
      "",
      'function normalizeStructuralFormula(value = "") {',
      "  return String(value)",
      '    .replaceAll("…", "...")',
      "    .trim()",
      "    .toLocaleLowerCase()",
      '    .replace(/\\[[^\\]]*\\]/g, "[]")',
      '    .replace(/\\s+/g, " ")',
      '    .replace(/\\s*([,;:?.!])\\s*/g, "$1")',
      '    .replace(/\\s*\\+\\s*/g, "+")',
      "    .trim();",
      "}",
      "",
      "function structuralPatternSignature(pattern) {",
      "  const byLanguage = new Map((pattern.langs || []).map((language) => [language.lang, normalizeStructuralFormula(language.formula)]));",
      '  return corpusLanguages().map((language) => language + ":" + (byLanguage.get(language) || "")).join("|");',
      "}",
      ""
    ].join("\n");
    if (!source.includes(normalizeAnchor)) throw new Error("Could not find normalizeFormula anchor in src/content.mjs");
    source = source.replace(normalizeAnchor, addition);
  }

  source = source.replace(
    /  assert\(advancedPatterns\.length >= 1000, `pattern corpus \(data\/patterns\/\) requires at least 1,000 patterns; found \$\{advancedPatterns\.length\}`\);/,
    '  assert(advancedPatterns.length > 0, "pattern corpus must not be empty");'
  );

  if (!source.includes("const structuralFrames = new Map();")) {
    source = source.replace(
      "  const patternIds = new Set();\n  const formulas = new Set();",
      "  const patternIds = new Set();\n  const formulas = new Set();\n  const structuralFrames = new Map();"
    );
  }

  if (!source.includes("structural duplicate advanced pattern")) {
    const anchor = "    patternIds.add(pattern.id.toLowerCase());\n";
    const addition = anchor + [
      '    const structuralKey = pattern.set_id + ":" + structuralPatternSignature(pattern);',
      "    const structuralOwner = structuralFrames.get(structuralKey);",
      '    assert(!structuralOwner, "structural duplicate advanced pattern " + pattern.id + " repeats " + structuralOwner + " in " + pattern.set_id);',
      "    structuralFrames.set(structuralKey, pattern.id);",
      ""
    ].join("\n");
    if (!source.includes(anchor)) throw new Error("Could not find pattern ID validation anchor in src/content.mjs");
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

function patchArchitecture() {
  const file = path.join(ROOT, "ARCHITECTURE.md");
  let source = fs.readFileSync(file, "utf8");
  const anchor = "For the existing EN/DE curriculum:\n\n";
  const rule = "- one canonical Pattern represents one EN+DE structural frame inside a study set; historical slot-value expansions are retired aliases, not separate learning objects;\n";
  if (!source.includes("historical slot-value expansions are retired aliases")) {
    if (!source.includes(anchor)) throw new Error("Could not find architecture data-quality anchor");
    source = source.replace(anchor, anchor + rule);
  }
  fs.writeFileSync(file, source);
}

function writeDocumentation(sourceBaseCount, retainedBaseCount, retiredCount, finalMergedCount) {
  const file = path.join(ROOT, "docs", "PATTERN_DEDUPLICATION.md");
  const text = `# Pattern structural deduplication\n\nMetkagram treats one reusable language frame as one canonical Pattern. Historical slot-value expansion created many records whose English and German formulas differed only in the values written inside square-bracket slots. Those records were generated examples, not distinct learning objects.\n\n## Canonical rule\n\nTwo records are structural duplicates only when all of the following are true:\n\n- they belong to the same study set;\n- their normalized English formulas are identical after square-bracket slot contents become \`[]\`;\n- their normalized German formulas are identical under the same rule.\n\nThe first stable record in study-set order remains canonical. Retired IDs are recorded in \`data/pattern-aliases.json\`. Similar-looking constructions with different grammar or communicative function are not merged by this rule.\n\n## 2026-09-17 migration\n\n- base records before structural deduplication: **${sourceBaseCount.toLocaleString("en-US")}**\n- canonical base Patterns after deduplication: **${retainedBaseCount.toLocaleString("en-US")}**\n- retired slot-expansion IDs: **${retiredCount.toLocaleString("en-US")}**\n- final merged active corpus, including reviewed supplemental Frames: **${finalMergedCount.toLocaleString("en-US")}**\n\nPrecomputed Practice annotations for retired IDs were removed with the records. The build validates that active Patterns remain structurally unique under this conservative same-set EN+DE rule.\n`;
  fs.writeFileSync(file, text);
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
  const key = pattern.set_id + "\u0000" + structuralSignature(pattern);
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
  if (keptIds.has(aliasId)) throw new Error("Alias " + aliasId + " is still canonical");
  if (!keptIds.has(targetId)) throw new Error("Alias " + aliasId + " points to non-canonical base pattern " + targetId);
}

const activeMerged = contentBefore.advancedPatterns.filter((pattern) => !aliases[pattern.id]);
const activeIds = new Set(activeMerged.map((pattern) => pattern.id));
const owners = new Map();
for (const pattern of activeMerged) {
  const key = pattern.set_id + "\u0000" + structuralSignature(pattern);
  const previous = owners.get(key);
  if (previous) throw new Error("Structural duplicate survives migration: " + pattern.id + " repeats " + previous);
  owners.set(key, pattern.id);
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
patchReadme();
patchArchitecture();

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
  setCounts: countsBySet(kept)
};
baseline.mergedCorpus = {
  ...baseline.mergedCorpus,
  patternCount: activeMerged.length,
  sortedIdSha256: sha(activeMerged.map((pattern) => pattern.id).sort().join("\n")),
  recordSetSha256: stableRecordHash(activeMerged.map(({ quality, ...pattern }) => pattern)),
  idRouteSha256: sha(activeMerged.map((pattern) => pattern.id + ":" + patternPath("en", pattern)).sort().join("\n")),
  setCounts: countsBySet(activeMerged),
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
writeDocumentation(sourceBaseCount, kept.length, retiredCount, activeMerged.length);

console.log(`Pattern corpus deduplicated: ${basePatterns.length} -> ${kept.length} base records; ${retiredCount} retired IDs; ${activeMerged.length} active merged patterns.`);
