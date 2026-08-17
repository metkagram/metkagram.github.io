import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { assertReasoningEvaluation, evaluateReasoningBenchmark } from "../src/reasoning-evaluation.mjs";
import { SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const BENCHMARK_PATH = path.join(ROOT, "data", "evaluation", "reasoning-intents.json");

function writeFile(relativePath, contents) {
  const output = path.join(DIST, relativePath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, contents);
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function updateCatalog(report, benchmark) {
  const file = path.join(DIST, "data", "catalog.json");
  const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
  catalog.reasoningEvaluation = {
    benchmarkCases: benchmark.cases.length,
    pass: report.pass,
    metrics: report.metrics,
    benchmark: `${SITE_URL}/data/reasoning-benchmark.json`,
    report: `${SITE_URL}/data/reasoning-evaluation.json`,
    scope: "internal editorial regression; not efficacy evidence"
  };
  fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`);
}

function updateProject(report, benchmark) {
  const file = path.join(DIST, "project.json");
  const project = JSON.parse(fs.readFileSync(file, "utf8"));
  project.reasoningEvaluation = {
    benchmarkCases: benchmark.cases.length,
    pass: report.pass,
    intentTop1Accuracy: report.metrics.intent_top1_accuracy,
    patternHitAt3: report.metrics.pattern_hit_at3,
    report: `${SITE_URL}/data/reasoning-evaluation.json`
  };
  fs.writeFileSync(file, `${JSON.stringify(project, null, 2)}\n`);
}

function updateLlms() {
  const file = path.join(DIST, "llms.txt");
  let llms = fs.readFileSync(file, "utf8");
  if (llms.includes("## Reasoning evaluation")) return;
  llms += `\n## Reasoning evaluation\n- Editorial benchmark: ${SITE_URL}/data/reasoning-benchmark.json\n- Evaluation report: ${SITE_URL}/data/reasoning-evaluation.json\n- The benchmark is an internal regression suite for deterministic intent/frame routing. It is not evidence of learning efficacy or independent external validation.\n`;
  fs.writeFileSync(file, llms);
}

function evaluationSection(locale, report, caseCount) {
  const en = locale === "en";
  const title = en ? "Reasoning routing is regression-tested" : "Маршрутизация логических операций проверяется regression-тестом";
  const body = en
    ? `A ${caseCount}-case editorial benchmark checks intent routing, reasoning-move routing, and acceptable frame retrieval in English and Russian.`
    : `Редакционный benchmark из ${caseCount} кейсов проверяет определение намерения, логической операции и подходящего каркаса на английском и русском.`;
  const disclaimer = en
    ? "This is an internal quality signal, not evidence that the method improves learning outcomes."
    : "Это внутренний сигнал качества, а не доказательство эффективности метода обучения.";
  return `<section class="section-pad ruled" data-reasoning-evaluation="summary"><p class="eyebrow">${en ? "Editorial evaluation" : "Редакционная оценка"}</p><h2>${title}</h2><p class="lede">${body}</p><div class="stat-grid"><article><strong>${percent(report.metrics.intent_top1_accuracy)}</strong><span>${en ? "intent top-1" : "intent top-1"}</span></article><article><strong>${percent(report.metrics.move_top1_accuracy)}</strong><span>${en ? "move top-1" : "move top-1"}</span></article><article><strong>${percent(report.metrics.pattern_hit_at3)}</strong><span>${en ? "frame hit@3" : "frame hit@3"}</span></article></div><p><small>${disclaimer}</small></p><p><a href="/data/reasoning-evaluation.json">${en ? "Evaluation report" : "Отчёт об оценке"}</a> · <a href="/data/reasoning-benchmark.json">${en ? "Benchmark cases" : "Кейсы benchmark"}</a></p></section>`;
}

function injectSummary(locale, report, caseCount) {
  const file = path.join(DIST, locale, "practice", "intents", "index.html");
  let html = fs.readFileSync(file, "utf8");
  if (html.includes('data-reasoning-evaluation="summary"')) return;
  const marker = '<section class="section-pad ruled">';
  const section = evaluationSection(locale, report, caseCount);
  if (!html.includes(marker)) throw new Error(`Unable to inject reasoning evaluation into ${locale} intent page`);
  html = html.replace(marker, `${section}${marker}`);
  fs.writeFileSync(file, html);
}

function printEvaluationSummary(report, caseCount) {
  process.stdout.write(`Reasoning evaluation: ${caseCount} cases; intent top-1 ${percent(report.metrics.intent_top1_accuracy)}; move top-1 ${percent(report.metrics.move_top1_accuracy)}; frame hit@3 ${percent(report.metrics.pattern_hit_at3)}.\n`);
  if (!report.failures.length) {
    process.stdout.write("Reasoning evaluation misses: none.\n");
    return;
  }
  process.stdout.write(`Reasoning evaluation misses (${report.failures.length}):\n`);
  for (const item of report.failures) {
    const intents = item.ranked_intents.map((ranked) => ranked.id).join(", ");
    const patterns = item.ranked_patterns.map((ranked) => ranked.id).join(", ");
    process.stdout.write(`- ${item.id}: expected ${item.expected_intent}/${item.expected_move}; predicted ${item.predicted_intent}/${item.predicted_move}; intents [${intents}]; frames [${patterns}]\n`);
  }
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist; run the base build first");
  const benchmark = JSON.parse(fs.readFileSync(BENCHMARK_PATH, "utf8"));
  const content = loadContent();
  const report = evaluateReasoningBenchmark(content, benchmark);
  writeFile("data/reasoning-benchmark.json", `${JSON.stringify(benchmark, null, 2)}\n`);
  writeFile("data/reasoning-evaluation.json", `${JSON.stringify(report, null, 2)}\n`);
  updateCatalog(report, benchmark);
  updateProject(report, benchmark);
  updateLlms();
  injectSummary("en", report, benchmark.cases.length);
  injectSummary("ru", report, benchmark.cases.length);
  printEvaluationSummary(report, benchmark.cases.length);
  assertReasoningEvaluation(report);
}

main();
