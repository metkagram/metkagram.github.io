import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { patternPath } from "../src/seo-slugs.mjs";

const DIST = path.join(process.cwd(), "dist");

function readJson(...parts) {
  return JSON.parse(fs.readFileSync(path.join(DIST, ...parts), "utf8"));
}

function html(...parts) {
  return fs.readFileSync(path.join(DIST, ...parts, "index.html"), "utf8");
}

test("intent dataset maps human goals to reasoning moves and calibrated patterns", () => {
  const dataset = readJson("data", "intents.json");
  assert.equal(dataset.schemaVersion, 2);
  assert.equal(dataset.intentCount, 18);
  assert.equal(dataset.reasoningMoveCount, 9);
  assert.equal(dataset.items.length, 18);
  assert.equal(dataset.resolver.type, "deterministic_editorial");
  assert.equal(dataset.resolver.runtime_ai_required, false);

  const ids = new Set(dataset.items.map((intent) => intent.id));
  assert.ok(ids.has("disagree-politely"));
  assert.ok(ids.has("correct-an-assumption"));
  assert.ok(ids.has("draw-a-conclusion"));
  assert.ok(dataset.items.every((intent) => intent.pattern_ids.length > 0));
  assert.ok(dataset.items.every((intent) => intent.signals_en.length > 0 && intent.signals_ru.length > 0));
  assert.ok(dataset.items.every((intent) => intent.pattern_priority.length > 0));

  const stateDecision = dataset.items.find((intent) => intent.id === "state-a-decision");
  assert.equal(stateDecision.pattern_ids[0], "CLF069");
  const revision = dataset.items.find((intent) => intent.id === "ask-what-would-change-the-conclusion");
  assert.equal(revision.pattern_ids[0], "CLF070");
});

test("intent discovery is present in the public search index", () => {
  const search = readJson("api", "v1", "search-index.json");
  assert.equal(search.data.intents.length, 18);
  const disagree = search.data.intents.find((intent) => intent.id === "disagree-politely");
  assert.equal(disagree.reasoning_move, "Challenge");
  assert.ok(disagree.queries_en.includes("disagree politely"));
  assert.ok(disagree.pattern_ids.length > 0);
});

test("intent browser is server-rendered and indexed", () => {
  const page = html("en", "practice", "intents");
  assert.match(page, /Find a pattern by what you want to do/);
  assert.match(page, /id="intent-disagree-politely"/);
  assert.match(page, /id="intent-correct-an-assumption"/);
  assert.match(page, /Reasoning move · Challenge/);
  assert.match(page, /data-reasoning-evaluation="summary"/);

  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/en\/practice\/intents\//);
  assert.match(sitemap, /https:\/\/metkagram\.github\.io\/ru\/practice\/intents\//);

  const seo = readJson("seo", "site-pages.json");
  assert.ok(seo.pages.some((record) => record.route === "/en/practice/intents/"));
  assert.ok(seo.pages.some((record) => record.route === "/ru/practice/intents/"));
});

test("practice search text includes human intent language", () => {
  const practice = html("en", "practice");
  assert.match(practice, /data-intent-discovery="practice"/);
  assert.match(practice, /Browse all 18 intents/);
  assert.match(practice, /disagree politely/);
  assert.match(practice, /correct an assumption/);
});

test("reasoning pattern pages link back to their human intents", () => {
  const dataset = readJson("data", "intents.json");
  const disagree = dataset.items.find((intent) => intent.id === "disagree-politely");
  const page = fs.readFileSync(path.join(DIST, patternPath("en", disagree.pattern_ids[0]).slice(1), "index.html"), "utf8");
  assert.match(page, /data-intent-discovery="pattern"/);
  assert.match(page, /\/en\/practice\/intents\/#intent-disagree-politely/);
});

test("catalog and project metadata expose intent discovery", () => {
  const catalog = readJson("data", "catalog.json");
  assert.equal(catalog.intentDiscovery.count, 18);
  assert.equal(catalog.intentDiscovery.reasoningMoveCount, 9);
  assert.equal(catalog.intentDiscovery.dataset, "https://metkagram.github.io/data/intents.json");

  const project = readJson("project.json");
  assert.equal(project.intentDiscovery.intents, 18);
  assert.equal(project.intentDiscovery.reasoningMoves, 9);
});
