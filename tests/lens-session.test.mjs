import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

test("Pattern Lens promotes one match into an inline reuse session", () => {
  const source = read("public/assets/lens-practice-bridge.js");
  assert.match(source, /evaluatePracticeStructure/);
  assert.match(source, /lens-card--primary/);
  assert.match(source, /lens-card--alternative/);
  assert.match(source, /data-lens-practice-answer/);
  assert.match(source, /data-lens-practice-check/);
  assert.match(source, /This checks structure only/);
  assert.match(source, /Это только проверка структуры/);
});

test("Lens session keeps canonical deep practice as the next layer", () => {
  const source = read("public/assets/lens-practice-bridge.js");
  assert.match(source, /active-practice/);
  assert.match(source, /Examples, contrasts, and review/);
  assert.match(source, /Примеры, контрасты и повторение/);
});

test("built English and Russian Lens pages load the product-session bridge", () => {
  for (const locale of ["en", "ru"]) {
    const html = read(`dist/${locale}/lens/index.html`);
    assert.match(html, /type="module" src="\/assets\/lens-practice-bridge\.js"/);
  }
});
