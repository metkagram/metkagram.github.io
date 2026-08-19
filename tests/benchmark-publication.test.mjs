import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const read = (...parts) => fs.readFileSync(path.join(DIST, ...parts), "utf8");
const json = (...parts) => JSON.parse(read(...parts));

test("public benchmark manifest matches the existing editorial regression suite", () => {
  const benchmark = json("data", "reasoning-benchmark.json");
  const report = json("data", "reasoning-evaluation.json");
  const manifest = json("data", "benchmark-manifest.json");
  const api = json("api", "v1", "evals", "reasoning-routing.json");
  assert.equal(manifest.caseCount, benchmark.cases.length);
  assert.deepEqual(manifest.bundledBaseline.metrics, report.metrics);
  assert.equal(manifest.bundledBaseline.pass, report.pass);
  assert.equal(api.data.id, "reasoning-routing-v1");
  assert.match(manifest.limitations.join(" "), /not independent external validation/i);
});

test("benchmark JSONL preserves every public gold case", () => {
  const benchmark = json("data", "reasoning-benchmark.json");
  const lines = read("evals", "reasoning-routing", "tasks.jsonl").trim().split("\n").map(JSON.parse);
  assert.equal(lines.length, benchmark.cases.length);
  assert.deepEqual(lines.map((item) => item.id), benchmark.cases.map((item) => item.id));
  assert.ok(lines.every((item) => item.query && item.expected_intent && item.expected_move && item.acceptable_patterns.length));

  const patternIds = new Set(json("api", "v1", "patterns.json").data.map((item) => item.data.id));
  for (const item of lines) for (const id of item.acceptable_patterns) assert.ok(patternIds.has(id), `${item.id} references missing pattern ${id}`);
});

test("localized benchmark pages state the evidence boundary instead of making model claims", () => {
  for (const locale of ["en", "ru"]) {
    const html = read(locale, "evals", "index.html");
    assert.match(html, /54/);
    assert.match(html, /intent top-1/i);
    assert.match(html, /pattern hit@3/i);
    assert.match(html, /independent|независим/i);
    assert.match(html, /learning efficacy|эффективност/i);
    assert.doesNotMatch(html, /outperforms GPT|beats GPT|лучше GPT/i);
  }
});

test("benchmark assets are discoverable through API, catalog, llms and sitemap", () => {
  const api = json("api", "v1", "index.json");
  const root = api.data && typeof api.data === "object" ? api.data : api;
  assert.ok(root.endpoints.some((item) => item.path === "/evals/reasoning-routing.json"));
  const catalog = json("data", "catalog.json");
  assert.equal(catalog.publicBenchmark.cases, 54);
  const llms = read("llms.txt");
  assert.match(llms, /## Public retrieval benchmark/);
  assert.match(llms, /reasoning-routing\/tasks\.jsonl/);
  const sitemap = read("sitemap.xml");
  assert.match(sitemap, /\/en\/evals\//);
  assert.match(sitemap, /\/ru\/evals\//);
  assert.doesNotMatch(sitemap, /\/api\/v1\/evals\/reasoning-routing\.json/);
});
