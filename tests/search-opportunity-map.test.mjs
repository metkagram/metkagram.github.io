import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";
import { loadDiscoveryTopicExtensions, loadDiscoveryTopics } from "../src/discovery-pages.mjs";
import { buildSearchMeasurementReport, renderSearchMeasurementMarkdown } from "../src/search-measurement.mjs";
import {
  buildSearchOpportunityIndex,
  normalizeOpportunityMetricRow,
} from "../src/search-opportunity-map.mjs";

const ROOT = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

function canonicalIndex() {
  const content = loadContent();
  const baseTopics = loadDiscoveryTopics(content);
  const { combined: topics } = loadDiscoveryTopicExtensions(content, baseTopics);
  const source = readJson("data/search-opportunity-clusters.json");
  return {
    content,
    source,
    topics,
    index: buildSearchOpportunityIndex(source, topics, content.studySets.sets, content.advancedPatterns),
  };
}

test("reviewed search opportunity pilot maps learner jobs to the canonical Atlas graph", () => {
  const { content, index } = canonicalIndex();
  assert.equal(index.schemaVersion, 1);
  assert.equal(index.status, "editorial-pilot");
  assert.equal(index.clusters.length, 12);
  assert.match(index.evidenceBoundary, /not evidence of search demand/i);

  const patternMap = new Map(content.advancedPatterns.map((pattern) => [pattern.id, pattern]));
  for (const cluster of index.clusters) {
    assert.equal(cluster.review_status, "editorial");
    assert.ok(cluster.topic_slug);
    assert.ok(cluster.set_ids.length >= 1);
    assert.ok(cluster.representative_pattern_ids.length >= 1);
    assert.ok(cluster.representative_pattern_ids.length <= 6);
    for (const patternId of cluster.representative_pattern_ids) {
      const pattern = patternMap.get(patternId);
      assert.ok(pattern, `${cluster.id}: missing representative Pattern ${patternId}`);
      assert.ok(cluster.set_ids.includes(pattern.set_id), `${cluster.id}: representative Pattern is outside mapped sets`);
    }
  }
});

test("opportunity validation rejects unknown topics and sets outside the declared Atlas topic", () => {
  const { content, source, topics } = canonicalIndex();

  const unknownTopic = structuredClone(source);
  unknownTopic.clusters[0].topic_id = "not-a-real-topic";
  assert.throws(
    () => buildSearchOpportunityIndex(unknownTopic, topics, content.studySets.sets, content.advancedPatterns),
    /unknown Atlas topic/,
  );

  const outsideTopic = structuredClone(source);
  outsideTopic.clusters[0].set_ids = ["HYP"];
  assert.throws(
    () => buildSearchOpportunityIndex(outsideTopic, topics, content.studySets.sets, content.advancedPatterns),
    /outside Atlas topic/,
  );
});

test("cluster metrics reject raw queries and join only through stable reviewed cluster ids", () => {
  const { index } = canonicalIndex();
  assert.throws(
    () => normalizeOpportunityMetricRow({ cluster_id: "build-argument-with-evidence", query: "private search phrase", clicks: 1, impressions: 2 }, index),
    /raw query fields are not allowed/i,
  );
  assert.throws(
    () => normalizeOpportunityMetricRow({ cluster_id: "not-reviewed", clicks: 1, impressions: 2 }, index),
    /unknown search opportunity cluster/i,
  );

  const row = normalizeOpportunityMetricRow({
    cluster_id: "build-argument-with-evidence",
    clicks: 7,
    impressions: 160,
    position: 10.6,
    helpful_yes: 8,
    helpful_no: 2,
  }, index);
  assert.equal(row.ctr, 7 / 160);
  assert.equal(row.helpfulness_rate, 0.8);
});

test("search report exposes observed and unobserved learner-job clusters without inventing zero demand", () => {
  const { index } = canonicalIndex();
  const payload = {
    schemaVersion: 1,
    source: "synthetic-cluster-test",
    scope: "non_brand",
    period: { start: "2026-05-01", end: "2026-07-31" },
    rows: [],
    cluster_rows: [
      {
        cluster_id: "build-argument-with-evidence",
        clicks: 7,
        impressions: 160,
        position: 10.6,
        helpful_yes: 8,
        helpful_no: 2,
      },
    ],
  };
  const report = buildSearchMeasurementReport(payload, index);
  assert.equal(report.opportunityClusterCoverage.mapped, 12);
  assert.equal(report.opportunityClusterCoverage.observed, 1);
  assert.equal(report.opportunityClusterCoverage.unobserved, 11);
  assert.match(report.opportunityClusterCoverage.note, /does not mean zero search demand/i);

  const observed = report.opportunityClusters.find((cluster) => cluster.id === "build-argument-with-evidence");
  const unobserved = report.opportunityClusters.find((cluster) => cluster.id === "test-a-hypothesis");
  assert.equal(observed.metrics.impressions, 160);
  assert.equal(observed.metrics.helpfulness_rate, 0.8);
  assert.equal(unobserved.metrics, null);

  const markdown = renderSearchMeasurementMarkdown(report);
  assert.match(markdown, /## Reviewed learner-job opportunity clusters/);
  assert.match(markdown, /build-argument-with-evidence/);
  assert.match(markdown, /test-a-hypothesis/);
  assert.match(markdown, /n\/a/);
});

test("cluster metrics cannot bypass canonical opportunity validation", () => {
  const payload = {
    schemaVersion: 1,
    scope: "non_brand",
    period: { start: "2026-05-01", end: "2026-07-31" },
    rows: [],
    cluster_rows: [{ cluster_id: "build-argument-with-evidence", clicks: 1, impressions: 2 }],
  };
  assert.throws(
    () => buildSearchMeasurementReport(payload),
    /cluster_rows require a validated search opportunity index/i,
  );
});
