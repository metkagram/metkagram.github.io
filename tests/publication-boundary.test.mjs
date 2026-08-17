import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { contentCounts, loadContent } from "../src/content.mjs";

const ROOT = process.cwd();

test("private-core sources are absent from the public repository", () => {
  for (const relative of [
    "data/advanced-patterns.json",
    "data/pattern-annotations.json.gz",
    "data/source-tag-rules.ts",
    "annotation_service"
  ]) {
    assert.equal(fs.existsSync(path.join(ROOT, relative)), false, `${relative} must remain private`);
  }
});

test("public content remains deliberately bounded", () => {
  const content = loadContent();
  const counts = contentCounts(content);
  assert.equal(counts.annotatedDocuments, 72);
  assert.equal(counts.advancedPatterns, 30);
  assert.equal(content.studySets.sets.length, 6);
  assert.equal(new Set(content.advancedPatterns.map((pattern) => pattern.reasoning?.move)).size, 9);
  assert.ok(content.advancedPatterns.every((pattern) => pattern.reasoning?.move));
});

test("publication manifest records every selected collection and approved evaluation surface", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data/publication-manifest.json"), "utf8"));
  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.totalDocuments, 72);
  assert.equal(manifest.collections.length, 6);
  assert.ok(manifest.collections.every((entry) => entry.documents === 12));
  assert.equal(manifest.publishedReasoningFrames, 30);
  assert.equal(manifest.publishedReasoningMoves, 9);
  assert.equal(manifest.publishedEvaluationCases, 54);
  assert.match(manifest.evaluationScope, /not language-learning efficacy evidence/i);
  assert.equal(manifest.publishedLearningLinkEvaluationCases, 22);
  assert.match(manifest.publicLearningLinkScope, /not semantic-equivalence/i);
  assert.match(manifest.publicLearningLinkScope, /not .*efficacy evidence/i);
});
