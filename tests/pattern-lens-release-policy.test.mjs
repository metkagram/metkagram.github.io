import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const policy = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "evaluation", "pattern-lens-release-policy.json"), "utf8"));
const review = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "evaluation", "pattern-lens-release-review.json"), "utf8"));
const hard = JSON.parse(fs.readFileSync(path.join(DIST, "data", "pattern-lens-hard-evaluation.json"), "utf8"));
const readiness = JSON.parse(fs.readFileSync(path.join(DIST, "data", "pattern-lens-release-readiness.json"), "utf8"));

test("Pattern Lens release policy has an explicit 150-case reviewed target", () => {
  assert.equal(policy.schemaVersion, 1);
  assert.equal(policy.releaseReviewTarget.totalReviewedCasesMin, 150);
  assert.deepEqual(policy.releaseReviewTarget.languages, ["en", "de"]);
  const bucketTotal = policy.releaseReviewTarget.buckets.reduce((sum, bucket) => sum + bucket.minimum, 0);
  assert.equal(bucketTotal, 150);
  assert.ok(policy.releaseReviewTarget.buckets.some((bucket) => bucket.family === "near_match"));
  assert.ok(policy.releaseReviewTarget.buckets.some((bucket) => bucket.family === "metalinguistic"));
  assert.ok(policy.releaseReviewTarget.buckets.some((bucket) => bucket.family === "incomplete_frame"));
  assert.ok(policy.releaseReviewTarget.buckets.some((bucket) => bucket.family === "ambiguous"));
  assert.ok(policy.releaseReviewTarget.buckets.some((bucket) => bucket.family === "neutral"));
});

test("engineering regression thresholds stay aligned with the release policy", () => {
  assert.equal(hard.thresholds.positive_pattern_hit_at_3, policy.engineeringGate.positive_pattern_hit_at_3_min);
  assert.equal(hard.thresholds.positive_move_hit_at_3, policy.engineeringGate.positive_move_hit_at_3_min);
  assert.equal(hard.thresholds.negative_abstention_rate, policy.engineeringGate.negative_abstention_rate_min);
  assert.equal(hard.thresholds.false_positive_rate_max, policy.engineeringGate.false_positive_rate_max);
  assert.ok(hard.metrics.positive_pattern_hit_at_3 >= hard.thresholds.positive_pattern_hit_at_3);
  assert.ok(hard.metrics.positive_move_hit_at_3 >= hard.thresholds.positive_move_hit_at_3);
  assert.ok(hard.metrics.negative_abstention_rate >= hard.thresholds.negative_abstention_rate);
  assert.ok(hard.metrics.false_positive_rate <= hard.thresholds.false_positive_rate_max);
});

test("release readiness does not turn an incomplete review set into a precision claim", () => {
  assert.equal(review.cases.length, 0);
  assert.equal(readiness.coverage.reviewed_cases, 0);
  assert.equal(readiness.coverage.target_reviewed_cases, 150);
  assert.equal(readiness.coverage.complete, false);
  assert.equal(readiness.precision_claim_ready, false);
  assert.equal(readiness.status, "review_in_progress");
  assert.equal(readiness.public_claim_policy.precisionClaimAllowedBeforeReady, false);
  assert.match(readiness.evidenceBoundary, /engineering regression fixture/i);
});

test("release policy is stricter than the current engineering gate", () => {
  assert.ok(policy.releaseThresholds.overall_false_positive_rate_max < policy.engineeringGate.false_positive_rate_max);
  assert.ok(policy.releaseThresholds.language_clear_negative_abstention_rate_min > policy.engineeringGate.negative_abstention_rate_min);
  assert.equal(policy.releaseThresholds.family_abstention_min.metalinguistic, 1);
  assert.equal(policy.engineeringGate.regressionBudget.new_false_positive_cases_max, 0);
});

test("review provenance is mandatory before a case can count", () => {
  for (const field of ["status", "reviewer_id", "reviewed_at", "independent_of_generation", "notes"]) {
    assert.ok(policy.reviewRequirements.reviewFields.includes(field));
  }
  assert.match(policy.reviewRequirements.reviewerRule, /human reviewer/i);
  assert.match(policy.reviewRequirements.reviewerRule, /do not count/i);
});

test("release readiness is discoverable but publicly bounded", () => {
  const api = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "index.json"), "utf8"));
  assert.match(api.pattern_lens_release_readiness, /\/data\/pattern-lens-release-readiness\.json$/);
  const llms = fs.readFileSync(path.join(DIST, "llms.txt"), "utf8");
  assert.match(llms, /Pattern Lens release readiness:/);
  assert.match(llms, /0\/150 human-reviewed release cases/);

  for (const locale of ["en", "ru"]) {
    const research = fs.readFileSync(path.join(DIST, locale, "research", "index.html"), "utf8");
    assert.match(research, /data-pattern-lens-release-readiness/);
    assert.match(research, /150/);
    assert.match(research, /precision/i);
  }
});
