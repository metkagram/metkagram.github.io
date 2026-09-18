import { expectedPatternCount, assertCanonicalIds } from './helpers/curriculum-contract.mjs';
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const DIST = path.join(process.cwd(), "dist");

test("quality report covers the full public Practice curriculum", () => {
  const report = JSON.parse(fs.readFileSync(path.join(DIST, "data", "quality-report.json"), "utf8"));
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.patternCount, expectedPatternCount);
  assert.equal(typeof report.variationDuplicatePatternCount, "number");
  assert.equal(typeof report.nonIndexablePatternCount, "number");
  assert.equal(report.rules.duplicateVariationsAllowed, false);
  assert.ok(Array.isArray(report.reviewQueue));
});

test("published pattern quality remains machine-readable across the full curriculum", () => {
  const patterns = JSON.parse(fs.readFileSync(path.join(DIST, "data", "advanced-patterns.json"), "utf8"));
  assertCanonicalIds(patterns, "published quality coverage");
  assert.ok(patterns.every((pattern) => typeof pattern.quality?.has_variation_duplicates === "boolean"));
  assert.ok(patterns.every((pattern) => typeof pattern.quality?.indexable === "boolean"));
  assert.ok(patterns.every((pattern) => typeof pattern.quality?.translations_complete === "boolean"));
});
