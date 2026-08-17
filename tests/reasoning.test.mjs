import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";

const ROOT = process.cwd();
const FILES = ["clf-041-044.json", "clf-045-048.json", "clf-049-052.json", "clf-053-056.json", "clf-057-060.json"];

test("reasoning frame source and public assets stay identical", () => {
  for (const name of FILES) {
    const source = fs.readFileSync(path.join(ROOT, "data", "reasoning-frames", name), "utf8");
    const published = fs.readFileSync(path.join(ROOT, "public", "data", "reasoning-frames", name), "utf8");
    assert.equal(published, source, `${name} must stay identical in data and public assets`);
  }
});

test("advanced reasoning frames are merged into the practice curriculum without synthetic padding", () => {
  const { advancedPatterns } = loadContent();
  const reasoning = advancedPatterns.filter((pattern) => pattern.reasoning?.move);
  assert.ok(reasoning.length >= 20, "at least twenty reasoning-enabled patterns are required");
  assert.ok(reasoning.every((pattern) => pattern.langs.length === 2));
  assert.ok(reasoning.every((pattern) => pattern.langs.every((lang) => lang.examples.length >= 2)));
  assert.ok(reasoning.every((pattern) => pattern.quality && pattern.quality.translations_complete));
  const syntheticPrefixes = /^(In practice,|In another case,|During a review,|In der Praxis:|In einem anderen Fall:|Bei einer Prüfung:)/;
  assert.ok(reasoning.every((pattern) => pattern.langs.every((lang) => lang.examples.every((example) => !syntheticPrefixes.test(example.text)))), "reasoning examples must not be padded by mechanical prefixes");
  const moves = new Set(reasoning.map((pattern) => pattern.reasoning.move));
  for (const move of ["Limit", "Condition", "Decide", "Reframe", "Infer", "Compare", "Challenge", "Test", "Cause"]) {
    assert.ok(moves.has(move), `reasoning move ${move} must be represented`);
  }
});

test("practice enhancement exposes reasoning filtering and notes", () => {
  const app = fs.readFileSync(path.join(ROOT, "public", "assets", "app.js"), "utf8");
  assert.match(app, /dataReasoning|dataset\.reasoning/);
  assert.match(app, /Reasoning move/);
  assert.match(app, /setupReasoningNotes/);
});
