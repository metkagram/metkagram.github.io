import { intentById } from "./intents.mjs";
import { patternsForIntent, rankIntentsForQuery } from "./intent-discovery.mjs";
import { getDatasetVersion } from "./provenance.mjs";

export const EVALUATION_THRESHOLDS = {
  intent_top1_accuracy: 0.9,
  intent_recall_at3: 0.98,
  move_top1_accuracy: 0.95,
  pattern_hit_at1: 0.85,
  pattern_hit_at3: 0.98
};

function ratio(value, total) {
  return total ? Number((value / total).toFixed(4)) : 0;
}

function reciprocalRank(values, predicate) {
  const index = values.findIndex(predicate);
  return index >= 0 ? 1 / (index + 1) : 0;
}

function metricsFor(results) {
  const total = results.length;
  return {
    cases: total,
    intent_top1_accuracy: ratio(results.filter((item) => item.intent_top1).length, total),
    intent_recall_at3: ratio(results.filter((item) => item.intent_recall_at3).length, total),
    move_top1_accuracy: ratio(results.filter((item) => item.move_top1).length, total),
    pattern_hit_at1: ratio(results.filter((item) => item.pattern_hit_at1).length, total),
    pattern_hit_at3: ratio(results.filter((item) => item.pattern_hit_at3).length, total),
    intent_mrr: total ? Number((results.reduce((sum, item) => sum + item.intent_rr, 0) / total).toFixed(4)) : 0,
    pattern_mrr: total ? Number((results.reduce((sum, item) => sum + item.pattern_rr, 0) / total).toFixed(4)) : 0
  };
}

function groupMetrics(results, key) {
  const groups = new Map();
  for (const item of results) {
    const value = item[key];
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(item);
  }
  return Object.fromEntries([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, items]) => [name, metricsFor(items)]));
}

function validateCase(caseItem, patternById) {
  const intent = intentById.get(caseItem.expected_intent);
  if (!intent) throw new Error(`Unknown expected intent ${caseItem.expected_intent} in benchmark case ${caseItem.id}`);
  if (intent.move !== caseItem.expected_move) {
    throw new Error(`Benchmark case ${caseItem.id} expects move ${caseItem.expected_move}, but intent ${intent.id} uses ${intent.move}`);
  }
  if (!Array.isArray(caseItem.acceptable_patterns) || !caseItem.acceptable_patterns.length) {
    throw new Error(`Benchmark case ${caseItem.id} requires acceptable_patterns`);
  }
  for (const patternId of caseItem.acceptable_patterns) {
    const pattern = patternById.get(patternId);
    if (!pattern) throw new Error(`Benchmark case ${caseItem.id} references unknown pattern ${patternId}`);
    if (pattern.reasoning?.move !== caseItem.expected_move) {
      throw new Error(`Benchmark case ${caseItem.id} accepts ${patternId}, but its move is ${pattern.reasoning?.move || "none"}`);
    }
  }
  return intent;
}

function evaluateCase(content, caseItem, patternById) {
  validateCase(caseItem, patternById);
  const rankedIntents = rankIntentsForQuery(caseItem.query, 3);
  const predictedIntent = rankedIntents[0]?.intent || null;
  const rankedPatterns = predictedIntent ? patternsForIntent(predictedIntent, content.advancedPatterns, 3) : [];
  const patternIds = rankedPatterns.map((item) => item.pattern.id);
  const acceptable = new Set(caseItem.acceptable_patterns);
  const intentIds = rankedIntents.map((item) => item.intent.id);
  const intentRr = reciprocalRank(rankedIntents, (item) => item.intent.id === caseItem.expected_intent);
  const patternRr = reciprocalRank(rankedPatterns, (item) => acceptable.has(item.pattern.id));

  return {
    id: caseItem.id,
    split: caseItem.split,
    locale: caseItem.locale,
    query: caseItem.query,
    expected_intent: caseItem.expected_intent,
    predicted_intent: predictedIntent?.id || null,
    expected_move: caseItem.expected_move,
    predicted_move: predictedIntent?.move || null,
    acceptable_patterns: caseItem.acceptable_patterns,
    ranked_intents: rankedIntents.map((item) => ({ id: item.intent.id, move: item.intent.move, score: item.score })),
    ranked_patterns: rankedPatterns.map((item) => ({ id: item.pattern.id, editorial_priority: item.editorial_priority, score: item.score })),
    intent_top1: intentIds[0] === caseItem.expected_intent,
    intent_recall_at3: intentIds.includes(caseItem.expected_intent),
    move_top1: predictedIntent?.move === caseItem.expected_move,
    pattern_hit_at1: patternIds.length > 0 && acceptable.has(patternIds[0]),
    pattern_hit_at3: patternIds.some((id) => acceptable.has(id)),
    intent_rr: Number(intentRr.toFixed(4)),
    pattern_rr: Number(patternRr.toFixed(4))
  };
}

export function evaluateReasoningBenchmark(content, benchmark) {
  if (!benchmark || !Array.isArray(benchmark.cases) || !benchmark.cases.length) {
    throw new Error("Reasoning benchmark must contain cases");
  }
  const ids = new Set();
  for (const item of benchmark.cases) {
    if (!item.id || ids.has(item.id)) throw new Error(`Reasoning benchmark contains duplicate or missing case id ${item.id || "<missing>"}`);
    ids.add(item.id);
  }

  const patternById = new Map(content.advancedPatterns.map((pattern) => [pattern.id, pattern]));
  const results = benchmark.cases.map((item) => evaluateCase(content, item, patternById));
  const metrics = metricsFor(results);
  const pass = Object.entries(EVALUATION_THRESHOLDS).every(([key, threshold]) => metrics[key] >= threshold);
  const moveCounts = {};
  for (const pattern of content.advancedPatterns.filter((item) => item.reasoning?.move)) {
    moveCounts[pattern.reasoning.move] = (moveCounts[pattern.reasoning.move] || 0) + 1;
  }

  return {
    schemaVersion: 1,
    version: getDatasetVersion(),
    purpose: benchmark.purpose,
    disclaimer: "This is an internal editorial regression benchmark. It measures deterministic routing against curated expectations; it does not measure language-learning efficacy or constitute independent external validation.",
    thresholds: EVALUATION_THRESHOLDS,
    pass,
    metrics,
    by_split: groupMetrics(results, "split"),
    by_locale: groupMetrics(results, "locale"),
    corpus: {
      intents: intentById.size,
      reasoning_frames: Object.values(moveCounts).reduce((sum, count) => sum + count, 0),
      move_counts: Object.fromEntries(Object.entries(moveCounts).sort(([a], [b]) => a.localeCompare(b)))
    },
    failures: results.filter((item) => !item.intent_top1 || !item.move_top1 || !item.pattern_hit_at3).map((item) => ({
      id: item.id,
      expected_intent: item.expected_intent,
      predicted_intent: item.predicted_intent,
      expected_move: item.expected_move,
      predicted_move: item.predicted_move,
      acceptable_patterns: item.acceptable_patterns,
      ranked_intents: item.ranked_intents,
      ranked_patterns: item.ranked_patterns
    })),
    cases: results
  };
}

export function assertReasoningEvaluation(report) {
  if (report.pass) return;
  const failed = Object.entries(report.thresholds)
    .filter(([key, threshold]) => report.metrics[key] < threshold)
    .map(([key, threshold]) => `${key}=${report.metrics[key]} < ${threshold}`)
    .join(", ");
  throw new Error(`Reasoning evaluation failed release thresholds: ${failed}`);
}
