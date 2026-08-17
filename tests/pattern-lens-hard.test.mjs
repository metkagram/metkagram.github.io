import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { extractLensLiteralSegments, isLensMetalinguistic, rankLensPatterns } from "../src/pattern-lens-ranking.mjs";

test("Pattern Lens ignores low-information literal fragments", () => {
  assert.deepEqual(extractLensLiteralSegments("If [X], then [Y]"), ["then"]);
  assert.deepEqual(extractLensLiteralSegments("[X] is [Y]"), []);
});

test("Pattern Lens abstains on metalinguistic cue mentions", () => {
  assert.equal(isLensMetalinguistic("If is a conjunction that introduces a condition.", "en"), true);
  assert.equal(isLensMetalinguistic("Das Wort Annahme ist schwer auszusprechen.", "de"), true);
  const patterns = [{
    id: "META",
    langs: [{ lang: "en", formula: "If [X], [Y]", example: "If it rains, we stay home.", translation: "", examples: [] }]
  }];
  assert.deepEqual(rankLensPatterns(patterns, "If is a conjunction that introduces a condition.", "en"), []);
});

test("hard Pattern Lens report gates both retrieval and abstention", () => {
  const report = JSON.parse(fs.readFileSync("dist/data/pattern-lens-hard-evaluation.json", "utf8"));
  assert.equal(report.metrics.positive_cases, 27);
  assert.equal(report.metrics.negative_cases, 15);
  assert.ok(report.metrics.positive_pattern_hit_at_3 >= report.thresholds.positive_pattern_hit_at_3);
  assert.ok(report.metrics.negative_abstention_rate >= report.thresholds.negative_abstention_rate);
  assert.ok(report.metrics.false_positive_rate <= report.thresholds.false_positive_rate_max);

  const research = fs.readFileSync("dist/en/research/index.html", "utf8");
  assert.match(research, /data-pattern-lens-hard-evaluation/);
  assert.match(research, /Generalisation and abstention/);
});
