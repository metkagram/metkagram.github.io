import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const DIST = path.join(process.cwd(), "dist");
const graph = JSON.parse(fs.readFileSync(path.join(DIST, "data", "connections.json"), "utf8"));

function html(...parts) {
  return fs.readFileSync(path.join(DIST, ...parts, "index.html"), "utf8");
}

test("connectivity graph links the three product layers", () => {
  assert.equal(graph.schemaVersion, 1);
  assert.equal(graph.sourceCounts.advancedPatterns, 3456);
  assert.equal(graph.sourceCounts.annotatedDocuments, 2240);
  assert.equal(graph.sourceCounts.reasoningFrames, 20);
  assert.equal(graph.relationCounts.reasoningMoveCount, 9);
  assert.ok(graph.relationCounts.connectedDocumentCount >= 700);
  assert.ok(graph.relationCounts.connectedSentenceCount >= 1800);
  assert.equal(graph.reasoningMoves.reduce((sum, item) => sum + item.count, 0), 20);
});

test("hypothetical language connects to the matching reusable pattern", () => {
  const key = "en:library:nCwTfsL1gV21PfxhqsJj";
  assert.ok(graph.documents[key]);
  assert.ok(graph.documents[key].patterns.some((item) => item.pattern_id === "CON001"));
  assert.ok(graph.patterns.CON001.documents.some((item) => item.document_id === "nCwTfsL1gV21PfxhqsJj"));
});

test("practice and detail pages expose server-rendered connectivity", () => {
  const practice = html("en", "practice");
  assert.match(practice, /data-connectivity="reasoning-nav"/);
  assert.match(practice, /Start from the move you want to make/);

  const reasoningPattern = html("en", "practice", "clf045");
  assert.match(reasoningPattern, /id="reasoning-move"/);
  assert.match(reasoningPattern, /Condition/);

  const connectedPattern = html("en", "practice", "con001");
  assert.match(connectedPattern, /See this structure in context/);
  assert.match(connectedPattern, /nCwTfsL1gV21PfxhqsJj/);

  const document = html("en", "explore", "english", "library", "nCwTfsL1gV21PfxhqsJj");
  assert.match(document, /data-connectivity="document"/);
  assert.match(document, /\/en\/practice\/con001\//);
});

test("all connection references point to known records", () => {
  const patternIds = new Set(Object.keys(graph.patterns));
  for (const document of Object.values(graph.documents)) {
    for (const relation of document.patterns) {
      assert.ok(patternIds.has(relation.pattern_id), `unknown pattern ${relation.pattern_id}`);
      assert.ok(relation.score >= 12.5);
    }
    for (const relation of document.sentence_links) {
      assert.ok(patternIds.has(relation.pattern_id));
      assert.ok(relation.score >= 13.5);
    }
  }
  for (const relation of Object.values(graph.patterns)) {
    for (const id of relation.related_patterns) assert.ok(patternIds.has(id), `unknown related pattern ${id}`);
  }
});
