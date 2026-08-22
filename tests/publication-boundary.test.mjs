import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { contentCounts, loadContent } from "../src/content.mjs";

const ROOT = process.cwd();

function isTracked(relative) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", relative], { cwd: ROOT, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

test("private research infrastructure stays outside the public repository", () => {
  for (const relative of [
    "data/source-tag-rules.ts",
    "annotation_service"
  ]) {
    assert.equal(isTracked(relative), false, `${relative} must remain private`);
  }
});

test("the full learner-facing Practice curriculum is public while the annotation corpus stays bounded", () => {
  const content = loadContent();
  const counts = contentCounts(content);
  assert.equal(counts.annotatedDocuments, 72);
  assert.ok(fs.existsSync(path.join(ROOT, "data/advanced-patterns.json")), "the public Practice source must exist");
  assert.ok(counts.advancedPatterns >= 1000, `expected at least 1,000 public practice patterns, found ${counts.advancedPatterns}`);
  assert.ok(content.studySets.sets.length >= 20, "the public Practice taxonomy should expose the full study-set catalogue");
  const reasoningPatterns = content.advancedPatterns.filter((pattern) => pattern.reasoning?.move);
  const reasoningMoves = new Set(reasoningPatterns.map((pattern) => pattern.reasoning.move));
  assert.ok(reasoningPatterns.length >= 30);
  assert.ok(reasoningMoves.size >= 9, `expected the established reasoning vocabulary plus extensions, found ${reasoningMoves.size}`);
  const annotationFile = path.join(ROOT, "data", "pattern-annotations.json.gz");
  assert.ok(fs.existsSync(annotationFile), "the public Practice annotation layer must be present");
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
  assert.equal(manifest.publishedLearningLinkEvaluationCases, 28);
  assert.equal(manifest.publishedLearningLinkPositiveCases, 18);
  assert.equal(manifest.publishedLearningLinkNegativeCases, 10);
  assert.match(manifest.publicLearningLinkScope, /not probabilistic/i);
  assert.match(manifest.publicLearningLinkScope, /not statistical precision\/recall/i);
  assert.match(manifest.publicLearningLinkScope, /semantic-equivalence/i);
  assert.match(manifest.publicLearningLinkScope, /language-learning efficacy evidence/i);
});
