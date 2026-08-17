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

test("hybrid Pattern Lens can retrieve a pattern from a reviewed reasoning cue without a literal formula match", () => {
  const content = loadContent();
  const matches = rankLensPatterns(content.advancedPatterns, "Why did our sales drop?", "en", 6);
  const expected = matches.find((item) => item.id === "CLF060");
  assert.ok(expected, "CLF060 should be retrieved for an explicit why-question");
  assert.ok(expected.reasoning_match, "retrieval should preserve its reasoning evidence");
  assert.equal(expected.reasoning_match.intent_id, "explain-a-cause");
  assert.equal(expected.reasoning_match.strength, "prompt");
  assert.equal("confidence" in expected.reasoning_match, false);
});

test("hybrid Pattern Lens preserves reviewed German reasoning retrieval", () => {
  const content = loadContent();
  const matches = rankLensPatterns(content.advancedPatterns, "Der Unterschied zwischen Gewinnen und Verlieren ist oft klein.", "de", 6);
  const expected = matches.slice(0, 3).find((item) => item.id === "CLF063");
  assert.ok(expected);
  assert.equal(expected.reasoning_match?.strength, "supported");
});

test("known ambiguous sentences do not receive reasoning evidence inside Pattern Lens", () => {
  const content = loadContent();
  for (const [sentence, language] of [
    ["She prefers coffee to tea.", "en"],
    ["Unter der Annahme, dass alles gut geht, starten wir morgen.", "de"],
    ["Wenn ich mehr Zeit hätte, würde ich ein Buch schreiben.", "de"],
    ["What if you need to make a quick decision?", "en"],
    ["Wenn die Last steigt, würden wir mehr Instanzen brauchen.", "de"]
  ]) {
    const matches = rankLensPatterns(content.advancedPatterns, sentence, language, 6);
    assert.ok(matches.every((item) => !item.reasoning_match), `ambiguous reasoning evidence leaked for: ${sentence}`);
  }
});

test("Pattern Lens build publishes categorical browser rules and a gated reviewed evaluation report", () => {
  const rules = JSON.parse(fs.readFileSync(path.join(DIST, "data", "pattern-lens-rules.json"), "utf8"));
  const report = JSON.parse(fs.readFileSync(path.join(DIST, "data", "pattern-lens-evaluation.json"), "utf8"));
  assert.equal(rules.schema_version, 3);
  assert.deepEqual(rules.relation_strengths, ["direct", "supported", "prompt"]);
  assert.match(rules.score_policy, /not probability/i);
  assert.ok(rules.rules.length >= 35, "expected the bounded EN/DE reasoning cues");
  assert.ok(rules.rules.every((item) => item.strength && !("confidence" in item)));
  assert.equal(report.schema_version, 2);
  assert.equal(report.metrics.cases, 18);
  assert.ok(report.metrics.expected_pattern_hit_at_3 >= report.thresholds.expected_pattern_hit_at_3);
  assert.ok(report.metrics.expected_move_hit_at_3 >= report.thresholds.expected_move_hit_at_3);
  assert.match(report.evidence_limit, /not an independent benchmark/i);
  assert.match(report.reasoning_strength_policy, /not probability/i);
  assert.ok(report.cases.flatMap((item) => item.top_results).every((item) => !item.reasoning_match || !("confidence" in item.reasoning_match)));
});

test("Pattern Lens browser UI does not present reasoning strength as a probability", () => {
  const js = fs.readFileSync(path.join(DIST, "assets", "pattern-lens.js"), "utf8");
  assert.doesNotMatch(js, /confidence/);
  assert.doesNotMatch(js, /% cue/);
  assert.match(js, /reasoning cue/);
  assert.match(js, /structure coverage/);
});

test("Research page exposes Pattern Lens evaluation with an evidence limit", () => {
  const html = fs.readFileSync(path.join(DIST, "en", "research", "index.html"), "utf8");
  assert.match(html, /data-pattern-lens-evaluation/);
  assert.match(html, /not independent evidence/i);
  assert.match(html, /statistical precision\/recall/i);
  assert.match(html, /learning efficacy/i);
  assert.match(html, /pattern-lens-evaluation\.json/);
});
