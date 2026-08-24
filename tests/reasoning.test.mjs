import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";

const ROOT = process.cwd();
const FILES = ["clf-041-044.json", "clf-045-048.json", "clf-049-052.json", "clf-053-056.json", "clf-057-060.json", "clf-061-068.json", "clf-069-070.json"];

test("reasoning frame source and public assets stay identical", () => {
  for (const name of FILES) {
    const source = fs.readFileSync(path.join(ROOT, "data", "reasoning-frames", name), "utf8");
    const published = fs.readFileSync(path.join(ROOT, "public", "data", "reasoning-frames", name), "utf8");
    assert.equal(published, source, `${name} must stay identical in data and public assets`);
  }
});

test("reasoning subset remains complete inside the full public Practice curriculum", () => {
  const curriculum = loadContent().advancedPatterns;
  assert.ok(curriculum.length >= 1000);
  const reasoning = curriculum.filter((pattern) => pattern.reasoning?.move);
  const reasoningMoves = new Set(reasoning.map((pattern) => pattern.reasoning.move));
  assert.ok(reasoning.length >= 30);
  assert.ok(reasoningMoves.size >= 9, `expected the established reasoning vocabulary plus extensions, found ${reasoningMoves.size}`);
  assert.ok(reasoning.every((pattern) => pattern.langs.length === 2));
  assert.ok(reasoning.every((pattern) => pattern.langs.every((lang) => lang.examples.length >= 2)));
  assert.ok(reasoning.every((pattern) => pattern.quality?.translations_complete));
  assert.ok(reasoning.every((pattern) => pattern.quality?.indexable));

  const byId = new Map(reasoning.map((pattern) => [pattern.id, pattern]));
  assert.equal(byId.get("CLF069")?.reasoning.move, "Decide");
  assert.equal(byId.get("CLF070")?.reasoning.move, "Test");
  for (const id of ["CLF069", "CLF070"]) {
    const pattern = byId.get(id);
    assert.ok(pattern, `${id} must be public`);
    assert.ok(pattern.langs.every((lang) => lang.examples.length >= 4), `${id} needs four editorial variations per language`);
  }
});

test("practice enhancement still loads every published reasoning source", () => {
  const app = fs.readFileSync(path.join(ROOT, "public", "assets", "app.js"), "utf8");
  for (const name of FILES) assert.match(app, new RegExp(name.replaceAll(".", "\\.")));
  assert.match(app, /dataReasoning|dataset\.reasoning/);
  assert.match(app, /Reasoning move/);
  // Rights copy is rendered at build time from the canonical release state;
  // no client-side licensing patcher may come back.
  assert.doesNotMatch(app, /licensing-runtime/);
});
