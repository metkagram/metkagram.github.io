import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const read = (relative) => fs.readFileSync(path.join(DIST, relative), "utf8");
const readJson = (relative) => JSON.parse(read(relative));

function page(...parts) {
  return read(path.join(...parts, "index.html"));
}

test("Language Pattern Knowledge Graph preserves explicit curriculum relations", () => {
  const graph = readJson("data/language-pattern-knowledge-graph.json");
  assert.equal(graph.schemaVersion, 1);
  assert.ok(graph.stats.nodes > 3000);
  assert.ok(graph.stats.edges > 3000);
  assert.equal(graph.stats.byType.intent, 18);
  assert.ok(graph.stats.byType.reasoning_move >= 8);
  assert.ok(graph.nodes.some((node) => node.type === "pattern" && node.stable_id === "CLF061"));
  assert.ok(graph.edges.some((edge) => edge.type === "recommended_pattern"));
  assert.ok(graph.edges.some((edge) => edge.type === "performs_move"));
  assert.ok(graph.edges.some((edge) => edge.type === "includes_set"));
});

test("learner task pages are indexable learning resources with canonical pattern links", () => {
  const inventory = readJson("seo/site-pages.json");
  const routes = new Set(inventory.pages.map((item) => item.route));
  const sitemap = read("sitemap.xml");

  for (const locale of ["en", "ru"]) {
    const index = page(locale, "learn");
    const knowledge = page(locale, "knowledge");
    const correction = page(locale, "learn", "correct-an-assumption");
    assert.match(index, /Communication goals|Речевые задачи|задач/i);
    assert.match(correction, /CLF061/);
    assert.match(correction, /LearningResource/);
    assert.match(knowledge, /Knowledge Graph|Граф языковых паттернов/);
    assert.doesNotMatch(index, /#mobile-application/);
    assert.doesNotMatch(correction, /#mobile-application/);
    assert.doesNotMatch(knowledge, /#mobile-application/);
    assert.ok(routes.has(`/${locale}/learn/`));
    assert.ok(routes.has(`/${locale}/learn/correct-an-assumption/`));
    assert.ok(routes.has(`/${locale}/knowledge/`));
    assert.match(sitemap, new RegExp(`<loc>https://metkagram\\.github\\.io/${locale}/learn/correct-an-assumption/</loc>`));
  }
});

test("recommendation corpus, benchmark, discovery and MCP expose the same stable objects", () => {
  const jsonl = read("data/recommendations.jsonl").trim().split("\n").map((line) => JSON.parse(line));
  const benchmark = readJson("data/recommendation-benchmark.json");
  const discovery = readJson("data/discovery.json");
  const mcp = readJson("api/v1/mcp-server.json");

  assert.ok(jsonl.length >= 50);
  assert.equal(benchmark.cases.length, jsonl.length);
  assert.ok(jsonl.some((record) => record.intent_id === "correct-an-assumption" && record.suggested_pattern_ids.includes("CLF061")));
  assert.ok(discovery.surfaces.some((surface) => surface.id === "learner-task-guides"));
  assert.ok(discovery.surfaces.some((surface) => surface.id === "language-pattern-knowledge-graph"));
  for (const tool of ["metkagram_get_knowledge_graph", "metkagram_get_recommendations", "metkagram_get_recommendation_benchmark"]) {
    assert.ok(mcp.tools.some((item) => item.name === tool), `missing MCP tool ${tool}`);
  }
});
