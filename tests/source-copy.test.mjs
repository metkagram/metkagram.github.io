import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { ui } from "../src/i18n.mjs";
import { applyCurrentCopy, currentCopy } from "../src/current-copy.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

applyCurrentCopy(ui);

test("current copy overlay is the canonical rendered product state", () => {
  assert.equal(ui.en.changelogCurrent, "Current release · August 2026");
  assert.equal(ui.ru.changelogCurrent, "Текущий релиз · август 2026");
  assert.match(ui.en.roadmapNowDetail, /French Frame-only pilot/);
  assert.match(ui.ru.roadmapNowDetail, /французский Frame-only пилот/i);
  assert.match(ui.en.homeFaqItems[3][1], /Current reuse follows the Metkagram licensing terms/);
  assert.match(ui.ru.homeFaqItems[3][1], /Повторное использование регулируется текущими условиями Metkagram/);
  assert.match(ui.en.homeAppsTitle, /research stage/);
  assert.match(ui.ru.homeAppsTitle, /этапом исследования/);
  assert.equal(Object.keys(currentCopy).sort().join(","), "en,ru");
});

test("base render receives current copy before release compatibility checks", () => {
  const en = fs.readFileSync(path.join(DIST, "en", "index.html"), "utf8");
  const ru = fs.readFileSync(path.join(DIST, "ru", "index.html"), "utf8");
  const enRoadmap = fs.readFileSync(path.join(DIST, "en", "roadmap", "index.html"), "utf8");
  const ruRoadmap = fs.readFileSync(path.join(DIST, "ru", "roadmap", "index.html"), "utf8");

  assert.match(en, /French Frame-only pilot/);
  assert.match(ru, /французский Frame-only пилот/i);
  assert.match(enRoadmap, /Current release · August 2026/);
  assert.match(ruRoadmap, /Текущий релиз · август 2026/);
});

test("release-contracts verifies home and roadmap instead of rewriting their canonical copy", () => {
  const source = fs.readFileSync(path.join(ROOT, "scripts", "release-contracts.mjs"), "utf8");
  assert.match(source, /assertCurrent\("en\/index\.html"/);
  assert.match(source, /assertCurrent\("en\/roadmap\/index\.html"/);
  assert.doesNotMatch(source, /replaceAllKnown/);
  assert.doesNotMatch(source, /replaceAll\([^\n]*(?:Current release|token-level annotation scheme)/);
});
