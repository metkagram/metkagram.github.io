import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";
import { extractLensLiteralSegments, rankLensPatterns } from "../src/pattern-lens-ranking.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

test("hybrid Pattern Lens keeps reusable formula segments explainable", () => {
  assert.deepEqual(extractLensLiteralSegments("It's not that [X]; it's that [Y]."), ["It's not that", "it's that"]);
});

test("hybrid Pattern Lens can retrieve a pattern from reasoning cues without requiring a literal formula match", () => {
  const content = loadContent();
  const matches = rankLensPatterns(content.advancedPatterns, "Why did our sales drop?", "en", 6);
  const expected = matches.find((item) => item.id === "CLF060");
  assert.ok(expected, "CLF060 should be retrieved for an explicit why-question");
  assert.ok(expected.reasoning_match, "retrieval should preserve its reasoning evidence");
  assert.equal(expected.reasoning_match.intent_id, "explain-a-cause");
});

test("hybrid Pattern Lens preserves German reasoning retrieval", () => {
  const content = loadContent();
  const matches = rankLensPatterns(content.advancedPatterns, "Der Unterschied zwischen Gewinnen und Verlieren ist oft klein.", "de", 6);
  assert.ok(matches.slice(0, 3).some((item) => item.id === "CLF063"));
});

test("Pattern Lens build publishes one browser rule export and a gated evaluation report", () => {
  const rules = JSON.parse(fs.readFileSync(path.join(DIST, "data", "pattern-lens-rules.json"), "utf8"));
  const report = JSON.parse(fs.readFileSync(path.join(DIST, "data", "pattern-lens-evaluation.json"), "utf8"));
  assert.ok(rules.rules.length >= 40, "expected the bounded EN/DE reasoning cues");
  assert.ok(report.metrics.cases >= 20);
  assert.ok(report.metrics.expected_pattern_hit_at_3 >= report.thresholds.expected_pattern_hit_at_3);
  assert.ok(report.metrics.expected_move_hit_at_3 >= report.thresholds.expected_move_hit_at_3);
  assert.match(report.evidence_limit, /not an independent benchmark/i);
});

test("Research page exposes Pattern Lens evaluation with an evidence limit", () => {
  const html = fs.readFileSync(path.join(DIST, "en", "research", "index.html"), "utf8");
  assert.match(html, /data-pattern-lens-evaluation/);
  assert.match(html, /not independent evidence/i);
  assert.match(html, /pattern-lens-evaluation\.json/);
});
