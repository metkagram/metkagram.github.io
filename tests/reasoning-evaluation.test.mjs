import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { intentTaxonomy } from "../src/intents.mjs";
import { EVALUATION_THRESHOLDS } from "../src/reasoning-evaluation.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function readJson(...parts) {
  return JSON.parse(fs.readFileSync(path.join(...parts), "utf8"));
}

function normalize(value = "") {
  return String(value).normalize("NFKC").toLocaleLowerCase().replaceAll(/\s+/g, " ").trim();
}

test("reasoning benchmark is balanced across every communicative intent", () => {
  const benchmark = readJson(ROOT, "data", "evaluation", "reasoning-intents.json");
  assert.equal(benchmark.schemaVersion, 1);
  assert.equal(benchmark.cases.length, 54);
  assert.equal(benchmark.cases.filter((item) => item.split === "core").length, 36);
  assert.equal(benchmark.cases.filter((item) => item.split === "near_neighbor").length, 18);
  assert.equal(benchmark.cases.filter((item) => item.locale === "en").length, 36);
  assert.equal(benchmark.cases.filter((item) => item.locale === "ru").length, 18);

  const counts = new Map();
  for (const item of benchmark.cases) counts.set(item.expected_intent, (counts.get(item.expected_intent) || 0) + 1);
  assert.equal(counts.size, 18);
  for (const intent of intentTaxonomy) assert.equal(counts.get(intent.id), 3, `${intent.id} needs exactly three benchmark cases`);
});

test("benchmark prompts are natural tasks rather than exact intent labels or query aliases", () => {
  const benchmark = readJson(ROOT, "data", "evaluation", "reasoning-intents.json");
  const exactAliases = new Set(intentTaxonomy.flatMap((intent) => [
    intent.title_en,
    intent.title_ru,
    ...(intent.queries_en || []),
    ...(intent.queries_ru || [])
  ]).map(normalize));
  for (const item of benchmark.cases) {
    assert.ok(item.query.length > 25, `${item.id} should contain a natural task, not a label`);
    assert.ok(!exactAliases.has(normalize(item.query)), `${item.id} duplicates an intent label or alias`);
  }
});

test("reasoning evaluation passes release thresholds and publishes reproducible details", () => {
  const report = readJson(DIST, "data", "reasoning-evaluation.json");
  const benchmark = readJson(DIST, "data", "reasoning-benchmark.json");
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.pass, true);
  assert.equal(report.cases.length, 54);
  assert.equal(benchmark.cases.length, 54);
  assert.match(report.disclaimer, /internal editorial regression benchmark/i);
  assert.match(report.disclaimer, /does not measure language-learning efficacy/i);
  for (const [key, threshold] of Object.entries(EVALUATION_THRESHOLDS)) {
    assert.ok(report.metrics[key] >= threshold, `${key}=${report.metrics[key]} should remain >= ${threshold}`);
  }
  assert.equal(report.by_split.core.cases, 36);
  assert.equal(report.by_split.near_neighbor.cases, 18);
  assert.equal(report.by_locale.en.cases, 36);
  assert.equal(report.by_locale.ru.cases, 18);
});

test("evaluation report reflects direct decision and revision coverage", () => {
  const report = readJson(DIST, "data", "reasoning-evaluation.json");
  assert.ok(report.corpus.reasoning_frames >= 30);
  assert.ok(report.corpus.move_counts.Decide >= 5);
  assert.ok(report.corpus.move_counts.Test >= 4);

  const decisionCases = report.cases.filter((item) => item.expected_intent === "state-a-decision");
  assert.ok(decisionCases.every((item) => item.ranked_patterns.some((pattern) => pattern.id === "CLF069")));
  const revisionCases = report.cases.filter((item) => item.expected_intent === "ask-what-would-change-the-conclusion");
  assert.ok(revisionCases.every((item) => item.ranked_patterns.some((pattern) => pattern.id === "CLF070")));
});

test("catalog, project metadata, llms and intent pages expose evaluation with evidence limits", () => {
  const catalog = readJson(DIST, "data", "catalog.json");
  const project = readJson(DIST, "project.json");
  assert.equal(catalog.reasoningEvaluation.benchmarkCases, 54);
  assert.equal(catalog.reasoningEvaluation.pass, true);
  assert.equal(project.reasoningEvaluation.benchmarkCases, 54);
  assert.equal(project.reasoningEvaluation.pass, true);

  const llms = fs.readFileSync(path.join(DIST, "llms.txt"), "utf8");
  assert.match(llms, /## Reasoning evaluation/);
  assert.match(llms, /not evidence of learning efficacy/i);

  for (const locale of ["en", "ru"]) {
    const page = fs.readFileSync(path.join(DIST, locale, "practice", "intents", "index.html"), "utf8");
    assert.match(page, /data-reasoning-evaluation="summary"/);
    assert.match(page, /reasoning-evaluation\.json/);
    assert.match(page, /reasoning-benchmark\.json/);
  }
});
