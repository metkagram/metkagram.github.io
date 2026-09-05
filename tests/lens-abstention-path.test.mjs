import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

test("Lens abstention routes to intent discovery before the full library", () => {
  const source = read("public/assets/lens-practice-bridge.js");
  assert.match(source, /querySelector\('\[data-lens-empty\]'\)/);
  assert.match(source, /dataset\.lensAbstentionPath = 'true'/);
  assert.match(source, /No confident reviewed match\./);
  assert.match(source, /Надёжного совпадения не найдено\./);
  assert.match(source, /href="\/\$\{locale\}\/practice\/intents\/"/);
  assert.match(source, /href="\/\$\{locale\}\/practice\/"/);
  assert.match(source, /class="lens-primary"/);
  assert.match(source, /class="lens-secondary"/);
});

test("abstention enhancement preserves the Lens-owned empty-state node", () => {
  const source = read("public/assets/lens-practice-bridge.js");
  assert.doesNotMatch(source, /replaceWith\(/);
  assert.doesNotMatch(source, /remove\(\)/);
  assert.match(source, /emptyState\.innerHTML/);
});

test("abstention UX does not alter browser matching thresholds", () => {
  const matcher = read("public/assets/pattern-lens.js");
  const bridge = read("public/assets/lens-practice-bridge.js");
  assert.doesNotMatch(bridge, /reasoningScore|strengthRank|hasStrongLiteralEvidence|classifyReasoning/);
  assert.match(matcher, /hasStrongLiteralEvidence/);
  assert.match(matcher, /if \(!reasoningMatch && !hasStrongLiteralEvidence\(hits, exampleMatch\)\) return null/);
});
