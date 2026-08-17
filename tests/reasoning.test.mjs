import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";

const ROOT = process.cwd();
const FILES = ["clf-041-044.json", "clf-045-048.json", "clf-049-052.json", "clf-053-056.json", "clf-057-060.json", "clf-061-068.json"];

function reasoningPatterns() {
  return loadContent().advancedPatterns.filter((pattern) => pattern.reasoning?.move);
}

test("reasoning frame source and public assets stay identical", () => {
  for (const name of FILES) {
    const source = fs.readFileSync(path.join(ROOT, "data", "reasoning-frames", name), "utf8");
    const published = fs.readFileSync(path.join(ROOT, "public", "data", "reasoning-frames", name), "utf8");
    assert.equal(published, source, `${name} must stay identical in data and public assets`);
  }
});

test("advanced reasoning frames are merged into the practice curriculum without synthetic padding", () => {
  const reasoning = reasoningPatterns();
  assert.ok(reasoning.length >= 28, "at least twenty-eight reasoning-enabled patterns are required");
  assert.ok(reasoning.every((pattern) => pattern.langs.length === 2));
  assert.ok(reasoning.every((pattern) => pattern.langs.every((lang) => lang.examples.length >= 2)));
  assert.ok(reasoning.every((pattern) => pattern.quality && pattern.quality.translations_complete));
  assert.ok(reasoning.every((pattern) => pattern.quality.indexable), "reasoning frames must remain indexable");
  const syntheticPrefixes = /^(In practice,|In another case,|During a review,|In der Praxis:|In einem anderen Fall:|Bei einer Prüfung:)/;
  assert.ok(reasoning.every((pattern) => pattern.langs.every((lang) => lang.examples.every((example) => !syntheticPrefixes.test(example.text)))), "reasoning examples must not be padded by mechanical prefixes");
});

test("every reasoning move has enough distinct frames to support intent discovery", () => {
  const reasoning = reasoningPatterns();
  const counts = new Map();
  for (const pattern of reasoning) counts.set(pattern.reasoning.move, (counts.get(pattern.reasoning.move) || 0) + 1);
  for (const move of ["Limit", "Condition", "Decide", "Reframe", "Infer", "Compare", "Challenge", "Test", "Cause"]) {
    assert.ok((counts.get(move) || 0) >= 3, `reasoning move ${move} requires at least three distinct frames`);
  }
  assert.equal(counts.get("Reframe"), 3);
  assert.equal(counts.get("Compare"), 3);
});

test("expanded frames cover corrective, comparative, assumption, test, and causal operations", () => {
  const byId = new Map(reasoningPatterns().map((pattern) => [pattern.id, pattern]));
  const expected = {
    CLF061: "Reframe",
    CLF062: "Reframe",
    CLF063: "Compare",
    CLF064: "Compare",
    CLF065: "Limit",
    CLF066: "Challenge",
    CLF067: "Test",
    CLF068: "Cause"
  };
  for (const [id, move] of Object.entries(expected)) {
    const pattern = byId.get(id);
    assert.ok(pattern, `${id} must be present`);
    assert.equal(pattern.reasoning.move, move);
    assert.ok(pattern.reasoning.what_it_does_en?.length > 20);
    assert.ok(pattern.reasoning.when_to_use_en?.length > 20);
    assert.ok(pattern.reasoning.common_mistake_en?.length > 20);
    for (const lang of pattern.langs) {
      assert.ok(lang.examples.length >= 4, `${id}/${lang.lang} needs at least four editorial variations`);
      assert.equal(new Set([lang.example, ...lang.examples.map((item) => item.text)].map((value) => value.replaceAll("**", "").toLowerCase())).size, lang.examples.length + 1);
    }
  }
});

test("practice enhancement loads every reasoning source and exposes reasoning filtering and notes", () => {
  const app = fs.readFileSync(path.join(ROOT, "public", "assets", "app.js"), "utf8");
  for (const name of FILES) assert.match(app, new RegExp(name.replaceAll(".", "\\.")));
  assert.match(app, /dataReasoning|dataset\.reasoning/);
  assert.match(app, /Reasoning move/);
  assert.match(app, /setupReasoningNotes/);
});
