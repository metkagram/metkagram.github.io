import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const patterns = JSON.parse(fs.readFileSync(path.join(DIST, "data", "advanced-patterns.json"), "utf8"));
const map = JSON.parse(fs.readFileSync(path.join(DIST, "data", "cross-language-map.json"), "utf8"));
const patternMap = new Map(patterns.map((pattern) => [pattern.id, pattern]));
const expected = patterns.filter((pattern) => pattern.reasoning?.move && pattern.langs?.some((item) => item.lang === "en") && pattern.langs?.some((item) => item.lang === "de"));

function lang(pattern, code) {
  return pattern.langs.find((item) => item.lang === code);
}

test("cross-language map only derives counterparts from the same canonical reviewed pattern", () => {
  assert.equal(map.schemaVersion, 1);
  assert.equal(map.status, "derived-reviewed-functional-map");
  assert.equal(map.itemCount, expected.length);
  assert.ok(map.itemCount >= 30);
  assert.equal(new Set(map.items.map((item) => item.pattern_id)).size, map.items.length);

  for (const item of map.items) {
    const pattern = patternMap.get(item.pattern_id);
    assert.ok(pattern);
    assert.equal(item.reasoning_move, pattern.reasoning.move);
    assert.equal(item.formula_en, String(lang(pattern, "en").formula).replaceAll("**", "").replaceAll(/\s+/g, " ").trim());
    assert.equal(item.formula_de, String(lang(pattern, "de").formula).replaceAll("**", "").replaceAll(/\s+/g, " ").trim());
    assert.equal(item.mapping_type, "same-canonical-pattern-functional-counterpart");
    assert.equal(item.literal_equivalence, false);
    assert.match(item.review_basis, /same reviewed Metkagram canonical pattern record/i);
  }
});

test("transfer map does not create cross-ID translation pairs", () => {
  for (const item of map.items) {
    assert.equal(item.canonical_urls.en, `https://metkagram.github.io/en/practice/${item.pattern_id.toLowerCase()}/`);
    assert.equal(item.canonical_urls.ru, `https://metkagram.github.io/ru/practice/${item.pattern_id.toLowerCase()}/`);
    assert.ok(item.formula_en);
    assert.ok(item.formula_de);
    assert.ok(item.example_en);
    assert.ok(item.example_de);
  }
  assert.match(map.boundary, /does not claim word-for-word equivalence/i);
});

test("Pattern Bridge pages expose recall-first EN↔DE practice", () => {
  for (const locale of ["en", "ru"]) {
    const page = fs.readFileSync(path.join(DIST, locale, "transfer", "index.html"), "utf8");
    assert.match(page, /Pattern Bridge/);
    assert.doesNotMatch(page, /Cross-language Transfer/);
    assert.match(page, /<details/);
    assert.match(page, /EN → DE/);
    assert.match(page, /DE → EN/);
    for (const item of map.items) {
      assert.match(page, new RegExp(`id="${item.pattern_id.toLowerCase()}"`));
      assert.match(page, new RegExp(`/${locale}/practice/${item.pattern_id.toLowerCase()}/`));
    }
  }
});

test("Practice, Pattern Routes and exports bridge into cross-language practice", () => {
  for (const locale of ["en", "ru"]) {
    for (const parts of [["practice"], ["packs"], ["exports"]]) {
      const page = fs.readFileSync(path.join(DIST, locale, ...parts, "index.html"), "utf8");
      assert.match(page, /data-cross-language-transfer-bridge/);
      assert.match(page, new RegExp(`href="/${locale}/transfer/"`));
    }
  }
});

test("Pattern Bridge keeps legacy API and discovery IDs for compatibility", () => {
  const api = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "cross-language-map.json"), "utf8"));
  assert.equal(api.data.itemCount, map.itemCount);
  assert.equal(api.provenance.record_type, "cross_language_functional_map");

  const mcp = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "mcp-server.json"), "utf8"));
  assert.ok(mcp.tools.some((tool) => tool.name === "metkagram_get_cross_language_map"));

  const openapi = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "openapi.json"), "utf8"));
  assert.ok(openapi.paths["/cross-language-map.json"]);

  const catalog = JSON.parse(fs.readFileSync(path.join(DIST, "data", "catalog.json"), "utf8"));
  assert.equal(catalog.crossLanguageTransfer.itemCount, map.itemCount);

  const teaching = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "teaching-manifest.json"), "utf8"));
  assert.match(teaching.interfaces.cross_language_map, /cross-language-map\.json$/);
  assert.ok(teaching.recommended_workflows.some((workflow) => workflow.id === "transfer_same_function_between_languages"));

  const discovery = JSON.parse(fs.readFileSync(path.join(DIST, "data", "discovery.json"), "utf8"));
  assert.ok(discovery.surfaces.some((surface) => surface.id === "cross-language-transfer"));
  assert.ok(discovery.recommendationPolicy.routes.some((route) => route.recommend === "cross-language-transfer"));
});
