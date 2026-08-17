import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const DIST = path.join(process.cwd(), "dist");
const graph = JSON.parse(fs.readFileSync(path.join(DIST, "data", "connections.json"), "utf8"));
const patterns = JSON.parse(fs.readFileSync(path.join(DIST, "data", "advanced-patterns.json"), "utf8"));
const reasoning = JSON.parse(fs.readFileSync(path.join(DIST, "data", "reasoning-frames", "index.json"), "utf8"));

function html(...parts) {
  return fs.readFileSync(path.join(DIST, ...parts, "index.html"), "utf8");
}

test("connectivity graph covers full public Practice with a bounded reasoning layer", () => {
  assert.equal(graph.schemaVersion, 1);
  assert.equal(graph.sourceCounts.advancedPatterns, patterns.length);
  assert.ok(patterns.length >= 1000, `expected full Practice curriculum, found ${patterns.length}`);
  assert.equal(graph.sourceCounts.annotatedDocuments, 72);
  assert.equal(graph.sourceCounts.reasoningFrames, 30);
  assert.equal(reasoning.count, 30);
  assert.equal(graph.relationCounts.reasoningMoveCount, 9);
  assert.equal(Object.keys(graph.documents).length, 72);
  assert.equal(Object.keys(graph.patterns).length, patterns.length);
});

test("practice and a reasoning detail page expose server-rendered reasoning navigation", () => {
  const practice = html("en", "practice");
  assert.match(practice, /data-connectivity="reasoning-nav"/);
  const reasoningPattern = patterns.find((pattern) => pattern.reasoning?.move);
  assert.ok(reasoningPattern, "expected at least one reasoning-enabled public pattern");
  const detail = html("en", "practice", reasoningPattern.id.toLowerCase());
  assert.match(detail, /id="reasoning-move"/);
});

test("all public connection references point to public patterns", () => {
  const ids = new Set(Object.keys(graph.patterns));
  for (const document of Object.values(graph.documents)) {
    for (const relation of document.patterns) assert.ok(ids.has(relation.pattern_id));
    for (const relation of document.sentence_links) assert.ok(ids.has(relation.pattern_id));
  }
  for (const relation of Object.values(graph.patterns)) {
    for (const id of relation.related_patterns) assert.ok(ids.has(id));
  }
});
