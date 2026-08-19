import fs from "node:fs";
import path from "node:path";
import { rankLensPatterns } from "../src/pattern-lens-ranking.mjs";
import { loadContent } from "../src/content.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const POLICY_FILE = path.join(ROOT, "data", "evaluation", "pattern-lens-release-policy.json");
const REVIEW_FILE = path.join(ROOT, "data", "evaluation", "pattern-lens-release-review.json");
const HARD_REPORT_FILE = path.join(DIST, "data", "pattern-lens-hard-evaluation.json");
const OUTPUT_FILE = path.join(DIST, "data", "pattern-lens-release-readiness.json");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const ratio = (value, total) => total ? Number((value / total).toFixed(4)) : null;

function validatePolicy(policy) {
  if (policy.schemaVersion !== 1) throw new Error("Pattern Lens release policy schemaVersion must be 1");
  const bucketTotal = policy.releaseReviewTarget.buckets.reduce((sum, bucket) => sum + bucket.minimum, 0);
  if (bucketTotal !== policy.releaseReviewTarget.totalReviewedCasesMin) {
    throw new Error(`Release-review bucket minima ${bucketTotal} must equal target ${policy.releaseReviewTarget.totalReviewedCasesMin}`);
  }
  if (policy.publicClaimPolicy.precisionClaimAllowedBeforeReady !== false) {
    throw new Error("Precision claims must stay blocked before release-review readiness");
  }
}

function validateHardGate(policy, hardReport) {
  const expected = policy.engineeringGate;
  const actual = hardReport.thresholds;
  const checks = [
    ["positive_pattern_hit_at_3", expected.positive_pattern_hit_at_3_min],
    ["positive_move_hit_at_3", expected.positive_move_hit_at_3_min],
    ["negative_abstention_rate", expected.negative_abstention_rate_min],
    ["false_positive_rate_max", expected.false_positive_rate_max]
  ];
  for (const [field, value] of checks) {
    if (actual[field] !== value) throw new Error(`Hard evaluation threshold drift: ${field} expected ${value}, found ${actual[field]}`);
  }
}

function validateReviewedCase(item, policy) {
  const required = policy.reviewRequirements.requiredFields;
  for (const field of required) if (item[field] === undefined || item[field] === null || item[field] === "") throw new Error(`${item.id || "review case"}: missing ${field}`);
  if (!["en", "de"].includes(item.language)) throw new Error(`${item.id}: unsupported release-review language ${item.language}`);
  if (!["positive", "negative"].includes(item.kind)) throw new Error(`${item.id}: kind must be positive or negative`);
  if (item.kind === "positive") {
    for (const field of policy.reviewRequirements.positiveRequiredFields) if (!item[field]) throw new Error(`${item.id}: positive case missing ${field}`);
  }
  const review = item.review || {};
  for (const field of policy.reviewRequirements.reviewFields) {
    if (review[field] === undefined || review[field] === null || review[field] === "") throw new Error(`${item.id}: review missing ${field}`);
  }
  if (review.status !== policy.reviewRequirements.acceptedReviewStatus) throw new Error(`${item.id}: case is stored in reviewed set without reviewed status`);
  if (review.independent_of_generation !== true) throw new Error(`${item.id}: reviewer must explicitly confirm independent_of_generation=true`);
}

function evaluateCase(patterns, item) {
  const matches = rankLensPatterns(patterns, item.sentence, item.language, 6);
  if (item.kind === "positive") {
    const patternRank = matches.findIndex((match) => match.id === item.expected_pattern);
    const moveRank = matches.findIndex((match) => match.reasoning_move === item.expected_move);
    return {
      ...item,
      expected_rank: patternRank >= 0 ? patternRank + 1 : null,
      move_rank: moveRank >= 0 ? moveRank + 1 : null,
      abstained: matches.length === 0
    };
  }
  return { ...item, abstained: matches.length === 0 };
}

function sliceMetrics(items) {
  const positives = items.filter((item) => item.kind === "positive");
  const negatives = items.filter((item) => item.kind === "negative");
  const hit3 = positives.filter((item) => item.expected_rank && item.expected_rank <= 3).length;
  const abstained = negatives.filter((item) => item.abstained).length;
  return {
    cases: items.length,
    positives: positives.length,
    negatives: negatives.length,
    positive_pattern_hit_at_3: ratio(hit3, positives.length),
    negative_abstention_rate: ratio(abstained, negatives.length),
    false_positive_rate: ratio(negatives.length - abstained, negatives.length)
  };
}

function buildBucketCoverage(policy, reviewed) {
  return policy.releaseReviewTarget.buckets.map((bucket) => {
    const count = reviewed.filter((item) => item.language === bucket.language && item.kind === bucket.kind && item.family === bucket.family).length;
    return { ...bucket, reviewed: count, complete: count >= bucket.minimum };
  });
}

function assessMetric(value, minimum, sample, minimumSample) {
  if (sample < minimumSample || value === null) return { ready: false, pass: null, reason: `needs at least ${minimumSample} reviewed cases` };
  return { ready: true, pass: value >= minimum, reason: null };
}

function buildMetricGates(policy, evaluated) {
  const minSample = policy.releaseThresholds.minimumCasesBeforeSliceMetric;
  const languages = {};
  for (const language of policy.releaseReviewTarget.languages) {
    const items = evaluated.filter((item) => item.language === language);
    const metrics = sliceMetrics(items);
    const positiveGate = assessMetric(metrics.positive_pattern_hit_at_3, policy.releaseThresholds.language_positive_pattern_hit_at_3_min, metrics.positives, minSample);
    const clearNegatives = items.filter((item) => item.kind === "negative" && item.family !== "ambiguous" && item.family !== "near_match");
    const clearMetrics = sliceMetrics(clearNegatives);
    const negativeGate = assessMetric(clearMetrics.negative_abstention_rate, policy.releaseThresholds.language_clear_negative_abstention_rate_min, clearMetrics.negatives, minSample);
    languages[language] = { metrics, clear_negative_metrics: clearMetrics, positive_gate: positiveGate, clear_negative_gate: negativeGate };
  }

  const families = {};
  for (const [family, threshold] of Object.entries(policy.releaseThresholds.family_abstention_min)) {
    const items = evaluated.filter((item) => item.kind === "negative" && item.family === family);
    const metrics = sliceMetrics(items);
    families[family] = { metrics, gate: assessMetric(metrics.negative_abstention_rate, threshold, metrics.negatives, minSample) };
  }

  const negatives = evaluated.filter((item) => item.kind === "negative");
  const overall = sliceMetrics(evaluated);
  const overallFalsePositiveReady = negatives.length >= minSample;
  const overallFalsePositivePass = overallFalsePositiveReady && overall.false_positive_rate !== null
    ? overall.false_positive_rate <= policy.releaseThresholds.overall_false_positive_rate_max
    : null;

  return {
    overall,
    overall_false_positive_gate: {
      ready: overallFalsePositiveReady,
      pass: overallFalsePositivePass,
      threshold_max: policy.releaseThresholds.overall_false_positive_rate_max
    },
    languages,
    families
  };
}

function allMetricGatesPass(gates) {
  if (gates.overall_false_positive_gate.pass !== true) return false;
  for (const value of Object.values(gates.languages)) {
    if (value.positive_gate.pass !== true || value.clear_negative_gate.pass !== true) return false;
  }
  for (const value of Object.values(gates.families)) if (value.gate.pass !== true) return false;
  return true;
}

function patchDiscovery(report) {
  const apiIndex = path.join(DIST, "api", "v1", "index.json");
  if (fs.existsSync(apiIndex)) {
    const value = readJson(apiIndex);
    value.pattern_lens_release_readiness = `${SITE_URL}/data/pattern-lens-release-readiness.json`;
    fs.writeFileSync(apiIndex, `${JSON.stringify(value, null, 2)}\n`);
  }

  const llms = path.join(DIST, "llms.txt");
  if (fs.existsSync(llms)) {
    let text = fs.readFileSync(llms, "utf8");
    if (!text.includes("Pattern Lens release readiness:")) {
      text += `\n- Pattern Lens release readiness: ${SITE_URL}/data/pattern-lens-release-readiness.json (${report.coverage.reviewed_cases}/${report.coverage.target_reviewed_cases} human-reviewed release cases; precision claim ready=${report.precision_claim_ready})\n`;
      fs.writeFileSync(llms, text);
    }
  }
}

function patchResearch(report) {
  for (const locale of ["en", "ru"]) {
    const file = path.join(DIST, locale, "research", "index.html");
    if (!fs.existsSync(file)) continue;
    let html = fs.readFileSync(file, "utf8");
    if (html.includes("data-pattern-lens-release-readiness")) continue;
    const text = locale === "ru"
      ? `Release-review цель: минимум ${report.coverage.target_reviewed_cases} подтверждённых человеком кейсов EN/DE. Сейчас подтверждено ${report.coverage.reviewed_cases}. До выполнения coverage и slice gates статистический precision-claim заблокирован.`
      : `Release-review target: at least ${report.coverage.target_reviewed_cases} human-reviewed EN/DE cases. ${report.coverage.reviewed_cases} are currently confirmed. Statistical precision claims stay blocked until coverage and slice gates are complete.`;
    const block = `<section class="section-pad ruled" data-pattern-lens-release-readiness><p class="eyebrow">Pattern Lens · release policy</p><h2>Precision-first review readiness</h2><p>${text}</p><p><a href="/data/pattern-lens-release-readiness.json">Machine-readable readiness →</a></p></section>`;
    html = html.replace("</main>", `${block}</main>`);
    fs.writeFileSync(file, html);
  }
}

export function buildPatternLensReleaseReadiness() {
  if (!fs.existsSync(HARD_REPORT_FILE)) throw new Error("Pattern Lens hard report is required before release readiness");
  const policy = readJson(POLICY_FILE);
  const reviewSet = readJson(REVIEW_FILE);
  const hardReport = readJson(HARD_REPORT_FILE);
  validatePolicy(policy);
  validateHardGate(policy, hardReport);
  if (reviewSet.schemaVersion !== 1 || !Array.isArray(reviewSet.cases)) throw new Error("Invalid Pattern Lens release-review fixture");

  for (const item of reviewSet.cases) validateReviewedCase(item, policy);
  const ids = reviewSet.cases.map((item) => item.id);
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate Pattern Lens release-review case id");

  const patterns = loadContent().advancedPatterns;
  const evaluated = reviewSet.cases.map((item) => evaluateCase(patterns, item));
  const bucketCoverage = buildBucketCoverage(policy, reviewSet.cases);
  const coverageComplete = reviewSet.cases.length >= policy.releaseReviewTarget.totalReviewedCasesMin && bucketCoverage.every((bucket) => bucket.complete);
  const metricGates = buildMetricGates(policy, evaluated);
  const precisionClaimReady = coverageComplete && allMetricGatesPass(metricGates);

  const report = {
    schemaVersion: 1,
    releaseDate: SITE_RELEASE_DATE,
    status: precisionClaimReady ? "ready" : "review_in_progress",
    evidenceBoundary: policy.evidenceBoundary,
    precision_claim_ready: precisionClaimReady,
    engineering_regression: {
      hard_fixture_cases: hardReport.metrics.positive_cases + hardReport.metrics.negative_cases,
      metrics: hardReport.metrics,
      thresholds: hardReport.thresholds
    },
    coverage: {
      reviewed_cases: reviewSet.cases.length,
      target_reviewed_cases: policy.releaseReviewTarget.totalReviewedCasesMin,
      complete: coverageComplete,
      buckets: bucketCoverage
    },
    release_metric_gates: metricGates,
    public_claim_policy: policy.publicClaimPolicy
  };

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(report, null, 2)}\n`);
  patchResearch(report);
  patchDiscovery(report);
  console.log(`Pattern Lens release readiness: ${report.coverage.reviewed_cases}/${report.coverage.target_reviewed_cases} reviewed cases; precision claim ready=${report.precision_claim_ready}.`);
  return report;
}

buildPatternLensReleaseReadiness();
