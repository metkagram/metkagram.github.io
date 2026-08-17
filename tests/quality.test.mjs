import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const DIST = path.join(process.cwd(), "dist");

test("quality report distinguishes source mirroring from real variation duplicates", () => {
  const report = JSON.parse(fs.readFileSync(path.join(DIST, "data", "quality-report.json"), "utf8"));
  assert.equal(report.schemaVersion, 2);
  assert.ok(report.patternCount >= 1000);
  assert.ok(report.primaryRepeatedInVariationsPatternCount > 0, "the source model currently mirrors some primary examples into variations");
  assert.equal(report.variationDuplicatePatternCount, 0, "variation-to-variation duplicates must enter the review queue");
  assert.equal(report.nonIndexablePatternCount, 0);
  assert.equal(report.rules.primaryMayBeMirroredInVariations, true);
  assert.equal(report.rules.duplicateVariationsAllowed, false);
});

test("published pattern quality exposes the distinction per language", () => {
  const patterns = JSON.parse(fs.readFileSync(path.join(DIST, "data", "advanced-patterns.json"), "utf8"));
  assert.ok(patterns.every((pattern) => typeof pattern.quality?.has_variation_duplicates === "boolean"));
  assert.ok(patterns.every((pattern) => Object.values(pattern.quality.languages).every((language) =>
    typeof language.primary_repeated_in_variations === "boolean" &&
    Number.isInteger(language.variation_duplicate_count) &&
    Number.isInteger(language.unique_variation_count)
  )));
  assert.ok(patterns.every((pattern) => !pattern.quality.has_variation_duplicates));
});
