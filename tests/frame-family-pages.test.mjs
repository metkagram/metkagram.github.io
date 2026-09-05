import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";
import { patternPath, studySetPath } from "../src/seo-slugs.mjs";

const content = loadContent();
const readPage = (route) => fs.readFileSync(path.join("dist", route, "index.html"), "utf8");

test("pilot sets explain shared frames while retaining every existing variant link", () => {
  for (const setId of ["PRO", "ARG", "HED"]) {
    const set = content.studySets.sets.find((item) => item.id === setId);
    const patterns = content.advancedPatterns.filter((pattern) => pattern.set_id === setId);
    assert.equal(set.frame_families.length, 1);
    assert.equal(patterns.length, 40);
    for (const locale of ["en", "ru"]) {
      const html = readPage(studySetPath(locale, set));
      assert.match(html, /id="frame-families"/);
      assert.match(html, locale === "en" ? /1 frame · 40 variants/ : /Каркасов: 1 · вариантов: 40/);
      assert.doesNotMatch(html, /Study 40 reusable|40 patterns in this study set|40 моделей B2/);
      for (const pattern of patterns) {
        assert.ok(html.includes(`href="${patternPath(locale, pattern)}"`), `${pattern.id} remains reachable`);
        const detail = readPage(patternPath(locale, pattern));
        assert.ok(detail.includes(`${studySetPath(locale, set)}#frame-families`));
      }
    }
  }
});

test("published family metadata resolves legacy IDs without claiming independent review", () => {
  const api = JSON.parse(fs.readFileSync("dist/api/v1/frame-families.json", "utf8"));
  assert.equal(api.data.length, 3);
  const index = JSON.parse(fs.readFileSync("dist/api/v1/index.json", "utf8"));
  const catalog = JSON.parse(fs.readFileSync("dist/api/v1/catalog.json", "utf8"));
  assert.ok(index.endpoints.some((endpoint) => endpoint.path === "/frame-families.json"));
  assert.equal(catalog.datasets.find((dataset) => dataset.id === "frame-families").count, 3);
  assert.match(fs.readFileSync("dist/llms.txt", "utf8"), /frame-families\.json/);
  for (const family of api.data) {
    assert.equal(family.independent_language_review, "pending");
    assert.equal(family.member_pattern_ids.length, 40);
    for (const id of family.member_pattern_ids) {
      const record = JSON.parse(fs.readFileSync(`dist/api/v1/patterns/${id.toLowerCase()}.json`, "utf8"));
      assert.equal(record.data.frame_family_id, family.id);
    }
  }
});
