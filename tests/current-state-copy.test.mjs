import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function html(locale, ...parts) {
  return fs.readFileSync(path.join(DIST, locale, ...parts, "index.html"), "utf8");
}

test("release metadata reflects the current August 2026 public state", () => {
  assert.equal(SITE_RELEASE_DATE, "2026-08-19");
  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  assert.match(sitemap, /<lastmod>2026-08-19<\/lastmod>/);
});

test("localized roadmap describes the current product instead of the July snapshot", () => {
  const en = html("en", "roadmap");
  const ru = html("ru", "roadmap");

  assert.match(en, /Current release · August 2026/);
  assert.doesNotMatch(en, /Current release · July 2026/);
  assert.match(en, /French Frame-only pilot/);
  assert.match(en, /40 Thinking in Language Frames/);
  assert.match(en, /Pattern Practice, Lens, Atlas, Map, Contrasts, Choice, Routes and Bridge/);

  assert.match(ru, /Текущий релиз · август 2026/);
  assert.doesNotMatch(ru, /Текущий релиз · июль 2026/);
  assert.match(ru, /французский Frame-only пилот/i);
  assert.match(ru, /40 Thinking in Language Frames/);
});

test("homepage capability and rights copy no longer overstates openness or language support", () => {
  const en = html("en");
  const ru = html("ru");

  assert.match(en, /French Frame-only pilot/);
  assert.match(en, /without French annotation or interface claims/);
  assert.doesNotMatch(en, /token-level annotation scheme is also an open, machine-readable research resource/i);
  assert.match(en, /Current reuse follows the Metkagram licensing terms/);
  assert.match(en, /Substantial reuse, redistribution, model training and commercial integration require scoped permission/i);

  assert.match(ru, /французский Frame-only пилот/i);
  assert.doesNotMatch(ru, /Токеновая разметка — открытый машиночитаемый ресурс/i);
  assert.match(ru, /Повторное использование регулируется текущими условиями Metkagram/);
});

test("canonical repository documents agree on French and Thinking in Language", () => {
  const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
  const direction = fs.readFileSync(path.join(ROOT, "docs", "PRODUCT_DIRECTION.md"), "utf8");

  for (const text of [readme, direction]) {
    assert.match(text, /French/i);
    assert.match(text, /Frame-only pilot/i);
    assert.match(text, /Thinking in Language/);
    assert.match(text, /40/);
  }

  assert.match(readme, /French annotation: not available in the current pilot/);
  assert.match(direction, /French annotation: unavailable in the current pilot/);
  assert.match(direction, /54-case reasoning-routing benchmark/);
});
