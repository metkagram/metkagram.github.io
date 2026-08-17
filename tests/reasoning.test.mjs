import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";

const ROOT = process.cwd();
const FILES = ["clf-041-044.json", "clf-045-048.json", "clf-049-052.json", "clf-053-056.json", "clf-057-060.json", "clf-061-068.json"];

test("reasoning frame source and public assets stay identical", () => {
  for (const name of FILES) {
    const source = fs.readFileSync(path.join(ROOT, "data", "reasoning-frames", name), "utf8");
    const published = fs.readFileSync(path.join(ROOT, "public", "data", "reasoning-frames", name), "utf8");
    assert.equal(published, source, `${name} must stay identical in data and public assets`);
  }
});

test("public reasoning showcase is complete enough to inspect the method", () => {
  const reasoning = loadContent().advancedPatterns;
  assert.equal(reasoning.length, 20);
  assert.ok(reasoning.every((pattern) => pattern.reasoning?.move));
  assert.equal(new Set(reasoning.map((pattern) => pattern.reasoning.move)).size, 9);
  assert.ok(reasoning.every((pattern) => pattern.langs.length === 2));
  assert.ok(reasoning.every((pattern) => pattern.langs.every((lang) => lang.examples.length >= 2)));
  assert.ok(reasoning.every((pattern) => pattern.quality?.translations_complete));
  assert.ok(reasoning.every((pattern) => pattern.quality?.indexable));
});

test("practice enhancement still loads every published reasoning source", () => {
  const app = fs.readFileSync(path.join(ROOT, "public", "assets", "app.js"), "utf8");
  for (const name of FILES) assert.match(app, new RegExp(name.replaceAll(".", "\\.")));
  assert.match(app, /dataReasoning|dataset\.reasoning/);
  assert.match(app, /Reasoning move/);
});
