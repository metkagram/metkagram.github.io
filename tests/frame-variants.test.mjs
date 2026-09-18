import { expectedPatternCount, assertCanonicalIds } from './helpers/curriculum-contract.mjs';
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { loadContent } from "../src/content.mjs";
import { buildDomainModel, frameId } from "../src/domain-model.mjs";
import { loadFrameFamilies, validateFrameFamilies } from "../src/frame-families.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function json(...parts) {
  return JSON.parse(fs.readFileSync(path.join(DIST, ...parts), "utf8"));
}

test("historical contextual Frame families are retired after structural Pattern deduplication", () => {
  const content = loadContent();
  const manifest = validateFrameFamilies(content.advancedPatterns, loadFrameFamilies());
  assert.deepEqual(manifest.families, []);
  assert.match(manifest.retirement_reason, /physically deduplicated/i);
});

test("retained canonical Patterns resolve directly to their own language Frames", () => {
  const content = loadContent();
  const model = buildDomainModel(content.advancedPatterns, { frameFamilies: loadFrameFamilies() });
  assert.equal(model.patternCount, expectedPatternCount);
  assert.equal(model.canonicalFrameFamilyCount, 0);
  assert.equal(model.canonicalFrames.length, 0);
  assert.equal(model.frameVariants.length, 0);

  const retained = model.frames.find((frame) => frame.id === frameId("C1HED001", "en"));
  assert.ok(retained, "retained canonical Pattern Frame must remain available");
  assert.equal(retained.pattern_id, "C1HED001");
  assert.equal(retained.canonical_frame_id, retained.id);
  assert.equal(retained.frame_variant_id, null);
  assert.ok(!model.patternIndex.some((record) => record.pattern_id === "C1HED002"), "retired duplicate must not remain in the active Pattern index");
});

test("published domain collections no longer expose contextual duplicate variants", () => {
  const canonicalFrames = json("data", "domain", "canonical-frames.json");
  const variants = json("data", "domain", "frame-variants.json");
  const patternIndex = json("data", "domain", "pattern-index.json");

  assert.equal(canonicalFrames.count, 0);
  assert.equal(variants.count, 0);
  assert.ok(patternIndex.items.some((item) => item.pattern_id === "C1HED001"));
  assert.ok(!patternIndex.items.some((item) => item.pattern_id === "C1HED002"));
  assert.equal(patternIndex.items.find((item) => item.pattern_id === "C1HED001").canonical_frame_ids.en, frameId("C1HED001", "en"));
});
