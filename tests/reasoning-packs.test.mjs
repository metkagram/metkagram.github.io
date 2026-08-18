import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const source = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "reasoning-packs.json"), "utf8"));
const contrasts = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "contrasts.json"), "utf8"));
const drills = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "choice-drills.json"), "utf8"));
const patterns = JSON.parse(fs.readFileSync(path.join(DIST, "data", "advanced-patterns.json"), "utf8"));
const patternIds = new Set(patterns.map((item) => item.id));
const contrastIds = new Set(contrasts.items.map((item) => item.id));
const drillIds = new Set(drills.items.map((item) => item.id));

function html(...parts) {
  return fs.readFileSync(path.join(DIST, ...parts, "index.html"), "utf8");
}

test("Reasoning Packs reference only canonical reviewed objects", () => {
  assert.equal(source.schemaVersion, 1);
  assert.equal(source.status, "reviewed-pilot");
  assert.ok(source.packs.length >= 5);
  assert.equal(new Set(source.packs.map((pack) => pack.id)).size, source.packs.length);
  for (const pack of source.packs) {
    assert.equal(pack.review_status, "reviewed");
    assert.ok(pack.steps.length >= 4);
    assert.ok(pack.title_en && pack.title_ru && pack.description_en && pack.description_ru && pack.outcome_en && pack.outcome_ru);
    for (const step of pack.steps) {
      assert.ok(step.instruction_en && step.instruction_ru);
      if (step.kind === "pattern") assert.ok(patternIds.has(step.id), `${pack.id} missing pattern ${step.id}`);
      else if (step.kind === "contrast") assert.ok(contrastIds.has(step.id), `${pack.id} missing contrast ${step.id}`);
      else if (step.kind === "drill") assert.ok(drillIds.has(step.id), `${pack.id} missing drill ${step.id}`);
      else assert.fail(`${pack.id} has unsupported step kind ${step.kind}`);
    }
  }
});

test("Reasoning Pack pages preserve the ordered canonical route", () => {
  for (const locale of ["en", "ru"]) {
    const index = html(locale, "packs");
    assert.match(index, /Reasoning Packs/);
    assert.match(index, /ItemList/);
    for (const pack of source.packs) {
      assert.match(index, new RegExp(`/${locale}/packs/${pack.id}/`));
      const page = html(locale, "packs", pack.id);
      assert.match(page, /LearningResource/);
      let cursor = -1;
      for (const step of pack.steps) {
        let token;
        if (step.kind === "pattern") token = `/${locale}/practice/${step.id.toLowerCase()}/`;
        else if (step.kind === "contrast") token = `/${locale}/contrasts/${step.id}/`;
        else token = `/${locale}/clinic/#${step.id}`;
        const next = page.indexOf(token);
        assert.ok(next > cursor, `${pack.id} should preserve step order for ${step.id}`);
        cursor = next;
      }
    }
  }
});

test("Reasoning Packs are connected to discovery and agent surfaces", () => {
  const api = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "reasoning-packs.json"), "utf8"));
  assert.equal(api.data.packs.length, source.packs.length);
  assert.equal(api.provenance.record_type, "reasoning_pack_collection");

  const mcp = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "mcp-server.json"), "utf8"));
  assert.ok(mcp.tools.some((tool) => tool.name === "metkagram_get_reasoning_packs"));

  const openapi = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "openapi.json"), "utf8"));
  assert.ok(openapi.paths["/reasoning-packs.json"]);

  const catalog = JSON.parse(fs.readFileSync(path.join(DIST, "data", "catalog.json"), "utf8"));
  assert.equal(catalog.reasoningPacks.count, source.packs.length);

  const discovery = JSON.parse(fs.readFileSync(path.join(DIST, "data", "discovery.json"), "utf8"));
  assert.ok(discovery.surfaces.some((surface) => surface.id === "reasoning-packs"));
  assert.ok(discovery.recommendationPolicy.routes.some((route) => route.recommend === "reasoning-packs"));

  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  const inventory = JSON.parse(fs.readFileSync(path.join(DIST, "seo", "site-pages.json"), "utf8"));
  const routes = new Set(inventory.pages.map((page) => page.route));
  for (const locale of ["en", "ru"]) {
    assert.ok(routes.has(`/${locale}/packs/`));
    assert.match(sitemap, new RegExp(`<loc>https://metkagram\\.github\\.io/${locale}/packs/</loc>`));
    assert.match(html(locale, "practice"), new RegExp(`href="/${locale}/packs/"`));
    assert.match(html(locale, "clinic"), new RegExp(`href="/${locale}/packs/"`));
    for (const pack of source.packs) {
      assert.ok(routes.has(`/${locale}/packs/${pack.id}/`));
      assert.match(sitemap, new RegExp(`<loc>https://metkagram\\.github\\.io/${locale}/packs/${pack.id}/</loc>`));
    }
  }

  const llms = fs.readFileSync(path.join(DIST, "llms.txt"), "utf8");
  assert.match(llms, /## Reasoning Packs/);
  assert.match(llms, /Packs reference canonical pattern, contrast and drill IDs/i);
});
