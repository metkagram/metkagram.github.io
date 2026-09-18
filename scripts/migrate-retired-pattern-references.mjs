import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { loadContent } from "../src/content.mjs";
import { buildFrameQualityAudit } from "../src/frame-quality-audit.mjs";
import { frameQualitySnapshot } from "../src/frame-quality-baseline.mjs";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");
const ALIASES_FILE = path.join(DATA, "pattern-aliases.json");
const FRAME_QUALITY_BASELINE_FILE = path.join(DATA, "quality", "frame-audit-baseline.json");
const SEO_SLUGS_FILE = path.join(DATA, "seo-slugs.json");

const aliases = JSON.parse(fs.readFileSync(ALIASES_FILE, "utf8")).aliases || {};

function transform(value) {
  if (typeof value === "string") return aliases[value] || value;
  if (Array.isArray(value)) {
    const mapped = value.map(transform);
    if (mapped.every((item) => typeof item === "string")) return [...new Set(mapped)];
    return mapped;
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, transform(item)]));
}

function jsonFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return jsonFiles(file);
    return entry.name.endsWith(".json") ? [file] : [];
  });
}

const skipped = new Set([
  path.normalize(ALIASES_FILE),
  path.normalize(path.join(DATA, "frame-families.json")),
  path.normalize(FRAME_QUALITY_BASELINE_FILE),
]);
const patternRoot = path.normalize(path.join(DATA, "patterns")) + path.sep;
let migratedFiles = 0;
let migratedValues = 0;

for (const file of jsonFiles(DATA)) {
  const normalized = path.normalize(file);
  if (skipped.has(normalized) || normalized.startsWith(patternRoot)) continue;
  const before = fs.readFileSync(file, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(before);
  } catch {
    continue;
  }
  const afterValue = transform(parsed);
  if (JSON.stringify(afterValue) === JSON.stringify(parsed)) continue;

  const after = `${JSON.stringify(afterValue, null, 2)}\n`;
  const beforeMatches = Object.keys(aliases).reduce((sum, id) => sum + (before.includes(`"${id}"`) ? 1 : 0), 0);
  const afterMatches = Object.keys(aliases).reduce((sum, id) => sum + (after.includes(`"${id}"`) ? 1 : 0), 0);
  migratedValues += Math.max(0, beforeMatches - afterMatches);
  fs.writeFileSync(file, after);
  migratedFiles += 1;
}

function pruneRetiredSeoSlugs() {
  const activeIds = new Set(loadContent().advancedPatterns.map((pattern) => pattern.id));
  const registry = JSON.parse(fs.readFileSync(SEO_SLUGS_FILE, "utf8"));
  const before = Object.keys(registry.patterns || {}).length;
  registry.patterns = Object.fromEntries(
    Object.entries(registry.patterns || {}).filter(([patternId]) => activeIds.has(patternId)),
  );
  const after = Object.keys(registry.patterns).length;
  fs.writeFileSync(SEO_SLUGS_FILE, `${JSON.stringify(registry, null, 2)}\n`);
  return { before, after, retired: before - after };
}
function sourceFromMain(relative) {
  try {
    return execFileSync("git", ["show", `origin/main:${relative}`], { cwd: ROOT, encoding: "utf8" });
  } catch {
    return fs.readFileSync(path.join(ROOT, relative), "utf8");
  }
}

function patchContentTest() {
  const relative = "tests/content.test.mjs";
  let source = sourceFromMain(relative);
  source = source.replace(
    'assert.ok(counts.advancedPatterns >= 1000, `expected at least 1,000 patterns, found ${counts.advancedPatterns}`);',
    'assert.ok(counts.advancedPatterns >= 600, `expected at least 600 canonical patterns, found ${counts.advancedPatterns}`);',
  );
  fs.writeFileSync(path.join(ROOT, relative), source);
}

function patchDomainModelTest() {
  const relative = "tests/multilingual-domain-model.test.mjs";
  let source = sourceFromMain(relative);
  source = source
    .replace('import { canonicalFrameId, frameVariantId } from "../src/frame-families.mjs";\n', "")
    .replace('  assert.equal(manifest.counts.canonicalFrameFamilies, 3);', '  assert.equal(manifest.counts.canonicalFrameFamilies, 0);')
    .replace('  assert.equal(canonicalFrames.count, 6);', '  assert.equal(canonicalFrames.count, 0);')
    .replace('  assert.equal(frameVariants.count, 48);', '  assert.equal(frameVariants.count, 0);');

  const legacyBlock = `  const hedVariant = index.items.find((item) => item.pattern_id === "C1HED002");\n  assert.equal(hedVariant.frame_ids.en, frameId("C1HED002", "en"));\n  assert.equal(hedVariant.canonical_frame_ids.en, canonicalFrameId("hed-premature-conclusion", "en"));\n  assert.equal(hedVariant.canonical_frame_ids.de, canonicalFrameId("hed-premature-conclusion", "de"));\n  assert.equal(hedVariant.frame_variant_ids.en, frameVariantId("C1HED002", "en"));\n  assert.equal(hedVariant.frame_variant_ids.de, frameVariantId("C1HED002", "de"));`;
  const canonicalBlock = `  const retainedHed = index.items.find((item) => item.pattern_id === "C1HED001");\n  assert.ok(retainedHed, "expected canonical HED Pattern C1HED001");\n  assert.equal(retainedHed.canonical_frame_ids.en, frameId("C1HED001", "en"));\n  assert.equal(retainedHed.canonical_frame_ids.de, frameId("C1HED001", "de"));\n  assert.equal(retainedHed.frame_variant_ids.en, undefined);\n  assert.ok(!index.items.some((item) => item.pattern_id === "C1HED002"), "retired contextual duplicate must not remain active");`;
  if (!source.includes(legacyBlock)) throw new Error("Could not locate the legacy HED FrameVariant test block");
  source = source.replace(legacyBlock, canonicalBlock);
  fs.writeFileSync(path.join(ROOT, relative), source);
}

function patchCanonicalCorpusGuards() {
  const relative = "scripts/search-discovery.mjs";
  let source = sourceFromMain(relative);
  source = source.replace(
    'if (content.advancedPatterns.length < 1000) throw new Error("Unexpected Practice corpus regression");',
    'if (content.advancedPatterns.length < 600) throw new Error("Unexpected canonical Practice corpus regression");',
  );
  fs.writeFileSync(path.join(ROOT, relative), source);
}

function recaptureFrameQualityBaseline() {
  const snapshot = frameQualitySnapshot(buildFrameQualityAudit(loadContent()));
  const baseline = {
    schemaVersion: 1,
    capturedOn: "2026-09-17",
    patternCountAtCapture: snapshot.patternCount,
    studySetCountAtCapture: snapshot.studySetCount,
    global: snapshot.global,
    sets: snapshot.sets,
    migrationNote: "Baseline recaptured after canonical structural deduplication changed the Pattern denominator from 3,530 records to 630 active Patterns. This is a denominator reset, not a waiver for new audit regressions."
  };
  fs.writeFileSync(FRAME_QUALITY_BASELINE_FILE, `${JSON.stringify(baseline, null, 2)}\n`);
  return snapshot;
}

const seoSlugs = pruneRetiredSeoSlugs();
patchContentTest();
patchDomainModelTest();
patchCanonicalCorpusGuards();
const frameQuality = recaptureFrameQualityBaseline();

console.log(`Retired Pattern references migrated: ${migratedFiles} JSON files updated; ${migratedValues} retired-ID references replaced.`);
console.log(`Frame quality baseline recaptured: ${frameQuality.patternCount} active patterns / ${frameQuality.studySetCount} study sets.`);

console.log(`SEO slug registry pruned ${seoSlugs.retired} retired IDs (${seoSlugs.before} -> ${seoSlugs.after}).`);
