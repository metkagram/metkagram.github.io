import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  buildSearchMeasurementReport,
  classifyRoute,
  normalizeSearchRow,
  recommendSearchAction,
  renderSearchMeasurementMarkdown
} from "../src/search-measurement.mjs";

const ROOT = process.cwd();

const basePayload = {
  schemaVersion: 1,
  source: "test-fixture",
  scope: "non_brand",
  period: { start: "2026-05-01", end: "2026-07-31" },
  rows: [
    { url: "https://metkagram.github.io/en/patterns/thinking-framing-uncertainty-and-decisions/", clicks: 14, impressions: 320, ctr: 0.04375, position: 8.4, crawled: true, indexed: true, age_days: 120 },
    { url: "https://metkagram.github.io/en/practice/set/hed/", clicks: 1, impressions: 180, ctr: 0.0056, position: 14.2, crawled: true, indexed: true, age_days: 210 },
    { url: "https://metkagram.github.io/en/practice/example-pattern/", clicks: 0, impressions: 4, ctr: 0, position: 42.1, crawled: true, indexed: true, age_days: 240, consolidation_group: "reviewed-overlap" },
    { url: "https://metkagram.github.io/en/apps/", clicks: 0, impressions: 0, ctr: 0, position: null, crawled: true, indexed: true, age_days: 365, indexing_review_allowed: true },
    { url: "https://metkagram.github.io/en/practice/clf041/", clicks: 0, impressions: 8, ctr: 0, position: 55, crawled: true, indexed: true, age_days: 365 }
  ]
};

test("route classification distinguishes Atlas, sets, patterns and editorial surfaces", () => {
  assert.equal(classifyRoute("/en/patterns/"), "atlas_index");
  assert.equal(classifyRoute("/ru/patterns/hypothesis-testing-and-evidence/"), "atlas_topic");
  assert.equal(classifyRoute("/en/practice/set/hyp/"), "study_set");
  assert.equal(classifyRoute("/en/practice/clf041/"), "pattern");
  assert.equal(classifyRoute("/en/research/"), "editorial");
  assert.equal(classifyRoute("/en/data/"), "developer_data");
  assert.equal(classifyRoute("/en/apps/"), "utility");
});

test("aggregate report produces a bounded editorial decision queue", () => {
  const report = buildSearchMeasurementReport(basePayload);
  assert.deepEqual(report.actionCounts, { expand: 1, improve: 1, consolidate: 1, noindex: 1, observe: 1 });
  assert.equal(report.totals.pages, 5);
  assert.equal(report.byRouteType.pattern.pages, 2);
  assert.equal(report.byRouteType.pattern.indexed_to_crawled_ratio, 1);
  assert.match(report.evidenceBoundary, /not automatic SEO actions/i);

  const byRoute = new Map(report.recommendations.map((row) => [row.route, row]));
  assert.equal(byRoute.get("/en/practice/clf041/").action, "observe");
  assert.equal(byRoute.get("/en/practice/set/hed/").action, "improve");
  assert.equal(byRoute.get("/en/patterns/thinking-framing-uncertainty-and-decisions/").action, "expand");
  assert.equal(byRoute.get("/en/practice/example-pattern/").action, "consolidate");
  assert.equal(byRoute.get("/en/apps/").action, "noindex");
  assert.ok(report.recommendations.every((row) => row.automatic === false));
});

test("core learning pages are never noindex candidates without explicit permission", () => {
  const result = recommendSearchAction({
    url: "https://metkagram.github.io/en/practice/clf041/",
    clicks: 0,
    impressions: 0,
    indexed: true,
    crawled: true,
    age_days: 500
  });
  assert.equal(result.action, "observe");
});

test("consolidation requires an explicit editor-defined overlap group", () => {
  const withoutGroup = recommendSearchAction({
    url: "https://metkagram.github.io/en/practice/clf041/",
    clicks: 0,
    impressions: 2,
    age_days: 500
  });
  const withGroup = recommendSearchAction({
    url: "https://metkagram.github.io/en/practice/clf041/",
    clicks: 0,
    impressions: 2,
    age_days: 500,
    consolidation_group: "manual-overlap-review"
  });
  assert.equal(withoutGroup.action, "observe");
  assert.equal(withGroup.action, "consolidate");
});

test("privacy contract rejects raw search query fields and branded scope", () => {
  assert.throws(() => normalizeSearchRow({ url: "/en/", clicks: 1, impressions: 2, query: "private term" }), /raw query fields are not allowed/i);
  assert.throws(() => buildSearchMeasurementReport({ ...basePayload, scope: "all" }), /scope must be non_brand/i);
});

test("markdown report exposes route summaries and all decision states", () => {
  const markdown = renderSearchMeasurementMarkdown(buildSearchMeasurementReport(basePayload));
  assert.match(markdown, /## Route-type summary/);
  assert.match(markdown, /### improve \(1\)/);
  assert.match(markdown, /### expand \(1\)/);
  assert.match(markdown, /### consolidate \(1\)/);
  assert.match(markdown, /### noindex \(1\)/);
  assert.match(markdown, /### observe \(1\)/);
  assert.match(markdown, /do not delete a useful learning object/i);
});

test("committed workflow contains only schema, docs and synthetic aggregate example", () => {
  const example = JSON.parse(fs.readFileSync(path.join(ROOT, "examples", "search-measurement.aggregate.example.json"), "utf8"));
  assert.match(example.source, /synthetic/i);
  const gitignore = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
  assert.match(gitignore, /data\/search-measurement\/private\//);
  assert.match(gitignore, /reports\/search-measurement\/private\//);
  const docs = fs.readFileSync(path.join(ROOT, "docs", "SEARCH_MEASUREMENT.md"), "utf8");
  assert.match(docs, /never changes pages, deletes study sets, adds `noindex`/i);
});
