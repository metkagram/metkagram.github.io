import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const drills = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "choice-drills.json"), "utf8"));
const contrasts = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "contrasts.json"), "utf8"));
const patterns = JSON.parse(fs.readFileSync(path.join(DIST, "data", "advanced-patterns.json"), "utf8"));
const patternIds = new Set(patterns.map((pattern) => pattern.id));
const contrastMap = new Map(contrasts.items.map((item) => [item.id, item]));

function html(...parts) {
  return fs.readFileSync(path.join(DIST, ...parts, "index.html"), "utf8");
}

test("choice drills stay reviewed and provide two-sided coverage for every contrast", () => {
  assert.equal(drills.schemaVersion, 1);
  assert.equal(drills.status, "reviewed-pilot");
  assert.equal(drills.items.length, contrasts.items.length * 2);
  assert.equal(new Set(drills.items.map((item) => item.id)).size, drills.items.length);

  for (const contrast of contrasts.items) {
    const related = drills.items.filter((item) => item.contrast_id === contrast.id);
    assert.equal(related.length, 2, `${contrast.id} should have exactly two pilot drills`);
    assert.deepEqual(new Set(related.map((item) => item.answer_pattern)), new Set(contrast.patterns), `${contrast.id} should test both sides`);
  }

  for (const item of drills.items) {
    const contrast = contrastMap.get(item.contrast_id);
    assert.ok(contrast);
    assert.equal(item.review_status, "reviewed");
    assert.equal(item.options.length, 2);
    assert.equal(new Set(item.options).size, 2);
    assert.ok(item.options.includes(item.answer_pattern));
    for (const patternId of item.options) {
      assert.ok(patternIds.has(patternId));
      assert.ok(contrast.patterns.includes(patternId));
    }
  }
});

test("Choice Clinic is server-rendered in both interface languages", () => {
  for (const locale of ["en", "ru"]) {
    const page = html(locale, "clinic");
    assert.match(page, /Pattern Choice Clinic/);
    assert.match(page, /<details/);
    assert.match(page, /LearningResource/);
    for (const item of drills.items) {
      assert.match(page, new RegExp(`id="${item.id}"`));
      assert.match(page, new RegExp(`/${locale}/practice/${item.answer_pattern.toLowerCase()}/`));
    }
  }
});

test("each contrast exposes its related decision drills", () => {
  for (const locale of ["en", "ru"]) {
    for (const contrast of contrasts.items) {
      const page = html(locale, "contrasts", contrast.id);
      const related = drills.items.filter((item) => item.contrast_id === contrast.id);
      assert.equal(related.length, 2);
      assert.match(page, /data-choice-clinic-drills/);
      assert.match(page, new RegExp(`href="/${locale}/clinic/"`));
      for (const drill of related) assert.match(page, new RegExp(`id="${drill.id}"`));
    }
  }
});

test("Choice Clinic is exposed through discovery and agent surfaces", () => {
  const api = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "choice-drills.json"), "utf8"));
  assert.equal(api.data.items.length, drills.items.length);
  assert.equal(api.provenance.record_type, "pattern_choice_drill_collection");
  const mcp = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "mcp-server.json"), "utf8"));
  assert.ok(mcp.tools.some((tool) => tool.name === "metkagram_get_choice_drills"));
  const openapi = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "openapi.json"), "utf8"));
  assert.ok(openapi.paths["/choice-drills.json"]);
  const catalog = JSON.parse(fs.readFileSync(path.join(DIST, "data", "catalog.json"), "utf8"));
  assert.equal(catalog.choiceClinic.count, drills.items.length);
  const discovery = JSON.parse(fs.readFileSync(path.join(DIST, "data", "discovery.json"), "utf8"));
  assert.ok(discovery.surfaces.some((surface) => surface.id === "pattern-contrasts"));
  assert.ok(discovery.surfaces.some((surface) => surface.id === "choice-clinic"));
  assert.ok(discovery.recommendationPolicy.routes.some((route) => route.recommend === "choice-clinic"));
  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  const inventory = JSON.parse(fs.readFileSync(path.join(DIST, "seo", "site-pages.json"), "utf8"));
  const routes = new Set(inventory.pages.map((page) => page.route));
  for (const locale of ["en", "ru"]) {
    assert.match(sitemap, new RegExp(`<loc>https://metkagram\\.github\\.io/${locale}/clinic/</loc>`));
    assert.ok(routes.has(`/${locale}/clinic/`));
    assert.match(html(locale, "practice"), new RegExp(`href="/${locale}/clinic/"`));
    assert.match(html(locale, "contrasts"), new RegExp(`href="/${locale}/clinic/"`));
  }
});
