import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { classifyReasoningSentence, PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE, PUBLIC_LEARNING_MIN_CONFIDENCE } from "../src/public-learning.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const graph = JSON.parse(fs.readFileSync(path.join(DIST, "data", "learning-connections.json"), "utf8"));
const benchmark = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "evaluation", "public-learning-links.json"), "utf8"));
const publicPatterns = new Set(JSON.parse(fs.readFileSync(path.join(DIST, "data", "advanced-patterns.json"), "utf8")).map((pattern) => pattern.id));
const intents = JSON.parse(fs.readFileSync(path.join(DIST, "data", "intents.json"), "utf8"));
const publicIntents = new Set(intents.items.map((intent) => intent.id));

function html(...parts) {
  return fs.readFileSync(path.join(DIST, ...parts, "index.html"), "utf8");
}

test("public learning regression cases resolve from real published sentences", () => {
  assert.equal(benchmark.schemaVersion, 1);
  assert.equal(benchmark.cases.length, 22);
  assert.match(benchmark.scope, /not evidence/i);
  assert.ok(new Set(benchmark.cases.map((item) => item.id)).size === benchmark.cases.length);
  assert.ok(new Set(benchmark.cases.map((item) => item.language)).size === 2);

  for (const item of benchmark.cases) {
    const key = `${item.language}:${item.collection}:${item.document_id}`;
    const document = graph.documents[key];
    assert.ok(document, `missing public document for ${item.id}`);
    const sourceLinks = document.sentence_links.filter((link) => link.sentence_index === item.sentence_index);
    assert.ok(sourceLinks.some((link) => link.sentence === item.sentence), `fixture text drift for ${item.id}`);
    assert.ok(sourceLinks.some((link) => link.reasoning_move === item.expected_move && link.intent_id === item.expected_intent && link.pattern_id === item.expected_pattern), `expected public-learning route missing for ${item.id}`);

    const classified = classifyReasoningSentence(item.sentence, item.language);
    assert.ok(classified.some((link) => link.reasoning_move === item.expected_move && link.intent_id === item.expected_intent && link.pattern_id === item.expected_pattern), `classifier regression for ${item.id}`);
  }
});

test("public learning links stay high-confidence and bounded", () => {
  assert.equal(graph.schemaVersion, 1);
  assert.equal(graph.sourceCounts.annotatedDocuments, 72);
  assert.equal(graph.sourceCounts.annotatedSentences, 969);
  assert.equal(graph.sourceCounts.publicReasoningFrames, 30);
  assert.equal(graph.sourceCounts.intents, 18);
  assert.equal(Object.keys(graph.documents).length, 72);
  assert.equal(Object.keys(graph.patterns).length, 30);
  assert.equal(Object.keys(graph.intents).length, 18);

  assert.ok(graph.relationCounts.connectedDocumentCount >= 20);
  assert.ok(graph.relationCounts.connectedSentenceCount >= 90);
  assert.ok(graph.relationCounts.relationCount >= 95);
  assert.equal(graph.relationCounts.coveredReasoningMoveCount, 9);
  assert.ok(graph.relationCounts.coveredIntentCount >= 15);
  assert.ok(graph.relationCounts.coveredPatternCount >= 19);
  assert.equal(graph.rules.minimumConfidence, PUBLIC_LEARNING_MIN_CONFIDENCE);
  assert.equal(graph.rules.maximumLinksPerSentence, PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE);
  assert.match(graph.evidenceLimit, /not a claim/i);

  const allowedScopes = new Set(graph.rules.relationScopes);
  let relationCount = 0;
  for (const document of Object.values(graph.documents)) {
    const bySentence = new Map();
    for (const relation of document.sentence_links) {
      relationCount += 1;
      assert.ok(relation.confidence >= PUBLIC_LEARNING_MIN_CONFIDENCE, `low confidence ${relation.rule_id}`);
      assert.ok(allowedScopes.has(relation.scope), `unknown scope ${relation.scope}`);
      assert.ok(relation.evidence, `missing evidence ${relation.rule_id}`);
      assert.ok(publicPatterns.has(relation.pattern_id), `private/non-public pattern ${relation.pattern_id}`);
      assert.ok(publicIntents.has(relation.intent_id), `unknown intent ${relation.intent_id}`);
      if (!bySentence.has(relation.sentence_index)) bySentence.set(relation.sentence_index, 0);
      bySentence.set(relation.sentence_index, bySentence.get(relation.sentence_index) + 1);
    }
    assert.ok([...bySentence.values()].every((count) => count <= PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE));
  }
  assert.equal(relationCount, graph.relationCounts.relationCount);
});

test("document, intent and frame pages expose the public learning bridge", () => {
  for (const locale of ["en", "ru"]) {
    const document = html(locale, "explore", "english", "library", "eqE7I4VnFdlZJFiHb8d9");
    assert.match(document, /data-public-learning="sentence"/);
    assert.match(document, /data-public-learning="document-summary"/);
    assert.match(document, /practice\/intents\/#intent-connect-cause-and-effect/);
    assert.match(document, /practice\/clf059\/#reasoning-move/);

    const pattern = html(locale, "practice", "clf059");
    assert.match(pattern, /data-public-learning="pattern-corpus"/);
    assert.match(pattern, /explore\/(?:english|german)\/(?:dialogues|patterns|library)\/.+?#sentence-/);
    assert.match(pattern, /(?:led to|führt zu)/i);

    const intentPage = html(locale, "practice", "intents");
    const marker = 'id="intent-connect-cause-and-effect"';
    const start = intentPage.indexOf(marker);
    assert.ok(start >= 0);
    const end = intentPage.indexOf("</article>", start);
    const article = intentPage.slice(start, end + 10);
    assert.match(article, /data-public-learning="intent-corpus"/);
    assert.match(article, /explore\/(?:english|german)\/(?:dialogues|patterns|library)\/.+?#sentence-/);
  }
});

test("learning connections are discoverable to people and agents with evidence limits", () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(DIST, "data", "catalog.json"), "utf8"));
  assert.equal(catalog.publicLearningConnections.connectedSentenceCount, graph.relationCounts.connectedSentenceCount);
  assert.match(catalog.publicLearningConnections.dataset, /\/data\/learning-connections\.json$/);
  assert.match(catalog.publicLearningConnections.evidenceLimit, /not a claim/i);

  const project = JSON.parse(fs.readFileSync(path.join(DIST, "project.json"), "utf8"));
  assert.equal(project.publicLearningConnections.linkedSentences, graph.relationCounts.connectedSentenceCount);
  assert.equal(project.publicLearningConnections.coveredReasoningMoves, 9);

  const llms = fs.readFileSync(path.join(DIST, "llms.txt"), "utf8");
  assert.match(llms, /Public learning connections/);
  assert.match(llms, /\/data\/learning-connections\.json/);
  assert.match(llms, /not semantic-equivalence claims/i);
});
