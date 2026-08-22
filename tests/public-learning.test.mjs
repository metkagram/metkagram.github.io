import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { patternPath } from "../src/seo-slugs.mjs";
import {
  classifyReasoningSentence,
  PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE,
  PUBLIC_LEARNING_STRENGTHS
} from "../src/public-learning.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const graph = JSON.parse(fs.readFileSync(path.join(DIST, "data", "learning-connections.json"), "utf8"));
const quality = JSON.parse(fs.readFileSync(path.join(DIST, "data", "learning-connections-quality.json"), "utf8"));
const benchmark = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "evaluation", "public-learning-links.json"), "utf8"));
const canonical = JSON.parse(fs.readFileSync(path.join(DIST, "data", "canonical-annotations.json"), "utf8"));
const publicPatternRecords = JSON.parse(fs.readFileSync(path.join(DIST, "data", "advanced-patterns.json"), "utf8"));
const publicPatterns = new Set(publicPatternRecords.map((pattern) => pattern.id));
const publicReasoningFrameCount = publicPatternRecords.filter((pattern) => pattern.reasoning?.move).length;
const intents = JSON.parse(fs.readFileSync(path.join(DIST, "data", "intents.json"), "utf8"));
const publicIntents = new Set(intents.items.map((intent) => intent.id));

function html(...parts) {
  return fs.readFileSync(path.join(DIST, ...parts, "index.html"), "utf8");
}

function canonicalCaseExists(item) {
  return canonical.items.some((record) =>
    record.language === item.language
    && record.source?.document_id === item.document_id
    && record.source?.dataset === `${item.language}/${item.collection}`
    && record.text === item.sentence
  );
}

test("public learning benchmark keeps positive routes and rejects known false positives", () => {
  assert.equal(benchmark.schemaVersion, 2);
  assert.equal(benchmark.positive_cases.length, 18);
  assert.equal(benchmark.negative_cases.length, 10);
  assert.match(benchmark.scope, /not statistical precision/i);
  assert.match(benchmark.scope, /not .*efficacy evidence/i);

  const ids = [...benchmark.positive_cases, ...benchmark.negative_cases].map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set([...benchmark.positive_cases, ...benchmark.negative_cases].map((item) => item.language)).size, 2);

  for (const item of benchmark.positive_cases) {
    assert.ok(canonicalCaseExists(item), `positive fixture text drift for ${item.id}`);
    const key = `${item.language}:${item.collection}:${item.document_id}`;
    const document = graph.documents[key];
    assert.ok(document, `missing public document for ${item.id}`);
    const sourceLinks = document.sentence_links.filter((link) => link.sentence_index === item.sentence_index);
    assert.ok(sourceLinks.some((link) => link.sentence === item.sentence), `source link drift for ${item.id}`);
    assert.ok(sourceLinks.some((link) =>
      link.reasoning_move === item.expected_move
      && link.intent_id === item.expected_intent
      && link.pattern_id === item.expected_pattern
    ), `expected public-learning route missing for ${item.id}`);

    const classified = classifyReasoningSentence(item.sentence, item.language);
    assert.ok(classified.some((link) =>
      link.reasoning_move === item.expected_move
      && link.intent_id === item.expected_intent
      && link.pattern_id === item.expected_pattern
    ), `classifier regression for ${item.id}`);
  }

  for (const item of benchmark.negative_cases) {
    assert.ok(canonicalCaseExists(item), `negative fixture text drift for ${item.id}`);
    const classified = classifyReasoningSentence(item.sentence, item.language);
    assert.deepEqual(classified, [], `known false positive returned for ${item.id}: ${item.rationale}`);
  }
});

test("public learning links favor reviewed strength over inflated coverage", () => {
  assert.equal(graph.schemaVersion, 2);
  assert.equal(graph.sourceCounts.annotatedDocuments, 72);
  assert.equal(graph.sourceCounts.annotatedSentences, 969);
  assert.equal(graph.sourceCounts.publicReasoningFrames, publicReasoningFrameCount);
  assert.equal(graph.sourceCounts.intents, 18);
  assert.equal(Object.keys(graph.documents).length, 72);
  assert.equal(Object.keys(graph.patterns).length, publicPatterns.size);
  assert.ok(publicPatterns.size >= 1000, `expected full public Practice curriculum, found ${publicPatterns.size}`);
  assert.equal(Object.keys(graph.intents).length, 18);

  assert.ok(graph.relationCounts.connectedDocumentCount >= 15);
  assert.ok(graph.relationCounts.connectedSentenceCount >= 55);
  assert.ok(graph.relationCounts.relationCount >= 60);
  assert.equal(graph.relationCounts.coveredReasoningMoveCount, 9);
  assert.ok(graph.relationCounts.coveredIntentCount >= 15);
  assert.ok(graph.relationCounts.coveredPatternCount >= 18);
  assert.equal(graph.rules.maximumLinksPerSentence, PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE);
  assert.deepEqual(graph.rules.relationStrengths, PUBLIC_LEARNING_STRENGTHS);
  assert.match(graph.rules.scorePolicy, /no probability/i);
  assert.match(graph.evidenceLimit, /not a probability estimate/i);

  const allowedScopes = new Set(graph.rules.relationScopes);
  const allowedStrengths = new Set(PUBLIC_LEARNING_STRENGTHS);
  const expectedScope = {
    direct: "frame_structure",
    supported: "reasoning_move",
    prompt: "intent_prompt"
  };

  let relationCount = 0;
  for (const document of Object.values(graph.documents)) {
    const bySentence = new Map();
    for (const relation of document.sentence_links) {
      relationCount += 1;
      assert.ok(allowedStrengths.has(relation.strength), `unknown strength ${relation.rule_id}`);
      assert.ok(allowedScopes.has(relation.scope), `unknown scope ${relation.scope}`);
      assert.equal(relation.scope, expectedScope[relation.strength], `strength/scope mismatch ${relation.rule_id}`);
      assert.equal("confidence" in relation, false, `pseudo-probability leaked from ${relation.rule_id}`);
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

test("quality report publishes positive and negative controls without pretending they are precision statistics", () => {
  assert.equal(quality.schemaVersion, 1);
  assert.equal(quality.graphSchemaVersion, 2);
  assert.equal(quality.benchmark.schemaVersion, 2);
  assert.equal(quality.benchmark.positiveCases, 18);
  assert.equal(quality.benchmark.positivePassed, 18);
  assert.equal(quality.benchmark.negativeCases, 10);
  assert.equal(quality.benchmark.negativePassed, 10);
  assert.equal(quality.benchmark.gatePassed, true);
  assert.match(quality.evidenceLimit, /not statistical precision/i);
  assert.ok(quality.suppressedBroadMappings.some((item) => /wenn .*würde/i.test(item)));
  assert.ok(quality.suppressedBroadMappings.some((item) => /prefer/i.test(item)));

  const strengthTotal = Object.values(quality.distribution.byStrength).reduce((sum, count) => sum + count, 0);
  assert.equal(strengthTotal, graph.relationCounts.relationCount);
  assert.ok((quality.distribution.byStrength.direct || 0) > 0);
  assert.ok((quality.distribution.byStrength.supported || 0) > 0);
  assert.ok((quality.distribution.byStrength.prompt || 0) > 0);
});

test("document, intent and frame pages expose reviewed connections without fake percentages", () => {
  for (const locale of ["en", "ru"]) {
    const document = html(locale, "explore", "english", "library", "eqE7I4VnFdlZJFiHb8d9");
    assert.match(document, /data-public-learning="sentence"/);
    assert.match(document, /data-public-learning="document-summary"/);
    assert.match(document, /data-strength="(?:direct|supported|prompt)"/);
    assert.match(document, /practice\/intents\/#intent-connect-cause-and-effect/);
    assert.ok(document.includes(`${patternPath(locale, "CLF059")}#reasoning-move`));
    assert.doesNotMatch(document, /(?:strong structural cue|same reasoning move|communicative prompt)[^<]*\b\d{2}%/i);

    const pattern = fs.readFileSync(path.join(DIST, patternPath(locale, "CLF059").slice(1), "index.html"), "utf8");
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

test("learning connections and their quality report are discoverable to people and agents", () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(DIST, "data", "catalog.json"), "utf8"));
  assert.equal(catalog.publicLearningConnections.connectedSentenceCount, graph.relationCounts.connectedSentenceCount);
  assert.match(catalog.publicLearningConnections.dataset, /\/data\/learning-connections\.json$/);
  assert.match(catalog.publicLearningConnections.qualityReport, /\/data\/learning-connections-quality\.json$/);
  assert.match(catalog.publicLearningConnections.evidenceLimit, /not a probability estimate/i);

  const project = JSON.parse(fs.readFileSync(path.join(DIST, "project.json"), "utf8"));
  assert.equal(project.publicLearningConnections.linkedSentences, graph.relationCounts.connectedSentenceCount);
  assert.equal(project.publicLearningConnections.coveredReasoningMoves, 9);
  assert.equal(project.publicLearningConnections.qualityGatePassed, true);
  assert.match(project.publicLearningConnections.qualityReport, /learning-connections-quality\.json$/);

  const llms = fs.readFileSync(path.join(DIST, "llms.txt"), "utf8");
  assert.match(llms, /Public learning connections/);
  assert.match(llms, /\/data\/learning-connections\.json/);
  assert.match(llms, /\/data\/learning-connections-quality\.json/);
  assert.match(llms, /not statistical precision/i);
});
