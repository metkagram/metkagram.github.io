import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const DIST = path.join(process.cwd(), "dist");

test("quality report covers the bounded public pattern release", () => {
  const report = JSON.parse(fs.readFileSync(path.join(DIST, "data", "quality-report.json"), "utf8"));
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.patternCount, 28);
  assert.equal(report.variationDuplicatePatternCount, 0);
  assert.equal(report.nonIndexablePatternCount, 0);
  assert.equal(report.rules.duplicateVariationsAllowed, false);
});

test("published pattern quality remains machine-readable", () => {
  const patterns = JSON.parse(fs.readFileSync(path.join(DIST, "data", "advanced-patterns.json"), "utf8"));
  assert.equal(patterns.length, 28);
  assert.ok(patterns.every((pattern) => typeof pattern.quality?.has_variation_duplicates === "boolean"));
  assert.ok(patterns.every((pattern) => !pattern.quality.has_variation_duplicates));
});
