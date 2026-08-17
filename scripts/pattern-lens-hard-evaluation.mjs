import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "../src/content.mjs";
import { rankLensPatterns } from "../src/pattern-lens-ranking.mjs";
import { getDatasetVersion } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const CASES_FILE = path.join(ROOT, "data", "evaluation", "pattern-lens-hard-cases.json");
const REPORT_FILE = path.join(DIST, "data", "pattern-lens-hard-evaluation.json");

const ratio = (value, total) => total ? Number((value / total).toFixed(4)) : 0;

function compactMatch(match) {
  return {
    id: match.id,
    reasoning_move: match.reasoning_move,
    score: match.score,
    evidence_type: match.evidence_type,
    hits: match.hits,
    reasoning_match: match.reasoning_match ? {
      rule_id: match.reasoning_match.rule_id,
      intent_id: match.reasoning_match.intent_id,
      strength: match.reasoning_match.strength,
      evidence: match.reasoning_match.evidence,
    } : null,
  };
}

function evaluatePositive(patterns, item) {
  const matches = rankLensPatterns(patterns, item.sentence, item.language, 6);
  const expectedRank = matches.findIndex((match) => match.id === item.expected_pattern);
  const moveRank = matches.findIndex((match) => match.reasoning_move === item.expected_move);
  return {
    ...item,
    expected_rank: expectedRank >= 0 ? expectedRank + 1 : null,
    move_rank: moveRank >= 0 ? moveRank + 1 : null,
    top_results: matches.slice(0, 3).map(compactMatch),
  };
}

function evaluateNegative(patterns, item) {
  const matches = rankLensPatterns(patterns, item.sentence, item.language, 6);
  return {
    ...item,
    abstained: matches.length === 0,
    top_results: matches.slice(0, 3).map(compactMatch),
  };
}

function summarize(positives, negatives) {
  const positiveHit3 = positives.filter((item) => item.expected_rank && item.expected_rank <= 3).length;
  const positiveMove3 = positives.filter((item) => item.move_rank && item.move_rank <= 3).length;
  const abstained = negatives.filter((item) => item.abstained).length;
  const falsePositives = negatives.length - abstained;
  return {
    positive_cases: positives.length,
    negative_cases: negatives.length,
    positive_pattern_hit_at_3: ratio(positiveHit3, positives.length),
    positive_move_hit_at_3: ratio(positiveMove3, positives.length),
    negative_abstention_rate: ratio(abstained, negatives.length),
    false_positive_rate: ratio(falsePositives, negatives.length),
    false_positive_cases: negatives.filter((item) => !item.abstained).map((item) => item.id),
    positive_misses: positives.filter((item) => !item.expected_rank || item.expected_rank > 3).map((item) => item.id),
  };
}

function patchResearch(locale, report) {
  const file = path.join(DIST, locale, "research", "index.html");
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("data-pattern-lens-hard-evaluation")) return;
  const pct = (value) => `${Math.round(value * 100)}%`;
  const text = locale === "ru"
    ? `Hard benchmark использует ${report.metrics.positive_cases} свежих парафразов и ${report.metrics.negative_cases} ловушек/нейтральных фраз. Pattern hit@3: ${pct(report.metrics.positive_pattern_hit_at_3)}; корректное воздержание на negatives: ${pct(report.metrics.negative_abstention_rate)}.`
    : `The hard benchmark uses ${report.metrics.positive_cases} fresh paraphrases and ${report.metrics.negative_cases} traps/neutral sentences. Pattern hit@3: ${pct(report.metrics.positive_pattern_hit_at_3)}; correct abstention on negatives: ${pct(report.metrics.negative_abstention_rate)}.`;
  const caveat = locale === "ru"
    ? "Это robustness regression, а не независимый тест эффективности обучения или статистическая оценка precision/recall. Кейсы специально проверяют generalisation, abstention и false positives."
    : "This is a robustness regression, not independent evidence of learning efficacy or a statistical precision/recall estimate. The cases deliberately probe generalisation, abstention and false positives.";
  const block = `<section class="section-pad ruled" data-pattern-lens-hard-evaluation><p class="eyebrow">Pattern Lens · hard benchmark</p><h2>Generalisation and abstention</h2><p class="lede">${text}</p><p>${caveat}</p><p><a href="/data/pattern-lens-hard-evaluation.json">Machine-readable hard report →</a></p></section>`;
  html = html.replace("</main>", `${block}</main>`);
  fs.writeFileSync(file, html);
}

function patchDiscovery(report) {
  const apiIndex = path.join(DIST, "api", "v1", "index.json");
  if (fs.existsSync(apiIndex)) {
    const value = JSON.parse(fs.readFileSync(apiIndex, "utf8"));
    value.pattern_lens_hard_evaluation = `${SITE_URL}/data/pattern-lens-hard-evaluation.json`;
    value.endpoints ||= [];
    if (!value.endpoints.some((item) => item.url === `${SITE_URL}/data/pattern-lens-hard-evaluation.json`)) {
      value.endpoints.push({ path: "/data/pattern-lens-hard-evaluation.json", url: `${SITE_URL}/data/pattern-lens-hard-evaluation.json`, type: "evaluation", description: "Pattern Lens hard robustness benchmark" });
    }
    fs.writeFileSync(apiIndex, `${JSON.stringify(value, null, 2)}\n`);
  }

  const manifest = path.join(DIST, "api", "v1", "teaching-manifest.json");
  if (fs.existsSync(manifest)) {
    const value = JSON.parse(fs.readFileSync(manifest, "utf8"));
    value.evaluation ||= {};
    value.evaluation.hard_report = `${SITE_URL}/data/pattern-lens-hard-evaluation.json`;
    value.evaluation.hard_metrics = report.metrics;
    fs.writeFileSync(manifest, `${JSON.stringify(value, null, 2)}\n`);
  }

  const llms = path.join(DIST, "llms.txt");
  if (fs.existsSync(llms)) {
    let text = fs.readFileSync(llms, "utf8");
    if (!text.includes("Pattern Lens hard evaluation:")) {
      text += `\n- Pattern Lens hard evaluation: ${SITE_URL}/data/pattern-lens-hard-evaluation.json (paraphrases + negative abstention cases; engineering robustness only, not statistical precision/recall)\n`;
      fs.writeFileSync(llms, text);
    }
  }
}

export function evaluatePatternLensHard() {
  if (!fs.existsSync(DIST)) throw new Error("dist/ does not exist. Run the site build first.");
  const fixture = JSON.parse(fs.readFileSync(CASES_FILE, "utf8"));
  const content = loadContent();
  const positives = fixture.positiveCases.map((item) => evaluatePositive(content.advancedPatterns, item));
  const negatives = fixture.negativeCases.map((item) => evaluateNegative(content.advancedPatterns, item));
  const metrics = summarize(positives, negatives);
  const report = {
    schema_version: 2,
    dataset_version: getDatasetVersion(),
    release_date: SITE_RELEASE_DATE,
    purpose: fixture.purpose,
    evidence_limit: fixture.scope,
    architecture: "hybrid deterministic retrieval with explicit abstention requirements and categorical reasoning strength",
    reasoning_strength_policy: "direct > supported > prompt; categorical editorial evidence, not probability",
    thresholds: {
      positive_pattern_hit_at_3: 0.9,
      positive_move_hit_at_3: 0.9,
      negative_abstention_rate: 0.9,
      false_positive_rate_max: 0.1
    },
    metrics,
    excluded_ambiguous_reasoning_cases: fixture.excludedAmbiguousReasoningCases || [],
    positive_cases: positives,
    negative_cases: negatives,
  };

  fs.mkdirSync(path.dirname(REPORT_FILE), { recursive: true });
  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);
  patchResearch("en", report);
  patchResearch("ru", report);
  patchDiscovery(report);

  const failures = [];
  if (metrics.positive_pattern_hit_at_3 < report.thresholds.positive_pattern_hit_at_3) failures.push(`pattern hit@3 ${metrics.positive_pattern_hit_at_3}`);
  if (metrics.positive_move_hit_at_3 < report.thresholds.positive_move_hit_at_3) failures.push(`move hit@3 ${metrics.positive_move_hit_at_3}`);
  if (metrics.negative_abstention_rate < report.thresholds.negative_abstention_rate) failures.push(`negative abstention ${metrics.negative_abstention_rate}`);
  if (metrics.false_positive_rate > report.thresholds.false_positive_rate_max) failures.push(`false-positive rate ${metrics.false_positive_rate}`);
  if (failures.length) {
    throw new Error(`Pattern Lens hard benchmark failed: ${failures.join(", ")}; positive misses=${metrics.positive_misses.join("|") || "none"}; false positives=${metrics.false_positive_cases.join("|") || "none"}`);
  }

  console.log(`Pattern Lens hard evaluation: ${metrics.positive_cases} positives, ${metrics.negative_cases} negatives; hit@3 ${Math.round(metrics.positive_pattern_hit_at_3 * 100)}%; abstention ${Math.round(metrics.negative_abstention_rate * 100)}%.`);
  return report;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) evaluatePatternLensHard();
