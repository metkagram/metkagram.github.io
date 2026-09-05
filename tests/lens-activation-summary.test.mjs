import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { activationSummaryBundle, summarizeLensActivation } from "../public/assets/learning-activation-core.js";
import { RENDER_STEPS } from "../scripts/stages/render.mjs";

const ROOT = process.cwd();

const event = (event_name, session_id, overrides = {}) => ({
  schema_version: 1,
  event_id: `event-${event_name}-${session_id}`,
  event_name,
  occurred_at: overrides.occurred_at || "2026-09-05T10:00:00.000Z",
  session_id,
  locale: overrides.locale || "en",
  page: overrides.page || "/en/lens/",
  surface: overrides.surface || "lens",
  object_type: overrides.object_type || "none",
  object_id: overrides.object_id || "",
  metadata: overrides.metadata || {},
});

test("activation summary computes the Lens funnel without calling a match useful", () => {
  const events = [
    event("lens_analyze", "s1", { metadata: { result_count: 2, result_pattern_ids: ["C1HED001"] } }),
    event("lens_practice_attempt", "s1", { object_type: "pattern", object_id: "C1HED001" }),
    event("lens_practice_complete", "s1", { object_type: "pattern", object_id: "C1HED001" }),
    event("learning_object_open", "s1", { object_type: "contrast", object_id: "contrast-1" }),
    event("lens_analyze", "s2", { metadata: { result_count: 0 } }),
    event("lens_analyze", "s3", { metadata: { result_count: 1, result_pattern_ids: ["CLF041"] } }),
    event("lens_practice_attempt", "s3", { object_type: "pattern", object_id: "CLF041" }),
  ];
  const summary = summarizeLensActivation(events);
  assert.deepEqual(summary.metrics, {
    lens_session_count: 3,
    analysis_count: 3,
    matched_analysis_count: 2,
    no_match_analysis_count: 1,
    practice_attempt_count: 2,
    practice_completion_count: 1,
    continuation_count: 1,
    sessions_with_analysis: 3,
    sessions_with_attempt: 2,
    sessions_with_completion: 1,
    sessions_with_continuation: 1,
    additional_local_session_count: 2,
  });
  assert.equal(summary.rates.matched_analysis_rate, 0.6667);
  assert.equal(summary.rates.completion_per_attempt_rate, 0.5);
  assert.equal(summary.evidence_boundary.matched_analysis_rate_is_not_helpfulness, true);
  assert.equal(summary.evidence_boundary.additional_local_sessions_do_not_prove_voluntary_return, true);
  assert.equal(summary.evidence_boundary.no_learning_efficacy_claim, true);
});

test("activation export strips event, session and object identifiers", () => {
  const events = [
    event("lens_analyze", "private-session-123", {
      metadata: { result_count: 1, result_pattern_ids: ["PRIVATEPATTERN001"] },
    }),
    event("lens_practice_attempt", "private-session-123", {
      object_type: "pattern",
      object_id: "PRIVATEPATTERN001",
    }),
  ];
  const bundle = activationSummaryBundle(events, "2026-09-05T12:00:00.000Z");
  const serialized = JSON.stringify(bundle);
  assert.equal(bundle.privacy.contains_event_ids, false);
  assert.equal(bundle.privacy.contains_session_ids, false);
  assert.equal(bundle.privacy.contains_object_ids, false);
  assert.equal(bundle.privacy.contains_learner_text, false);
  assert.doesNotMatch(serialized, /private-session-123/i);
  assert.doesNotMatch(serialized, /PRIVATEPATTERN001/);
  assert.doesNotMatch(serialized, /event-lens/);
  assert.equal(bundle.participant_action, "Explicit local export");
});

test("continuation counts only navigation that starts from Lens", () => {
  const summary = summarizeLensActivation([
    event("learning_object_open", "s1", { surface: "practice", object_type: "pattern", object_id: "A" }),
    event("learning_object_open", "s1", { surface: "lens", object_type: "pattern", object_id: "B" }),
    event("learning_object_open", "s1", { surface: "lens", object_type: "other", object_id: "C" }),
  ]);
  assert.equal(summary.metrics.continuation_count, 1);
  assert.equal(summary.metrics.sessions_with_continuation, 1);
});

test("generated Local activity pages expose aggregate pilot export as an explicit module action", () => {
  for (const locale of ["en", "ru"]) {
    const html = fs.readFileSync(path.join(ROOT, "dist", locale, "activity", "index.html"), "utf8");
    assert.match(html, /data-activation-pilot-note/);
    assert.match(html, /<script type="module" src="\/assets\/learning-activity\.js"><\/script>/);
  }
  const source = fs.readFileSync(path.join(ROOT, "public", "assets", "learning-activity.js"), "utf8");
  assert.match(source, /activationSummaryBundle/);
  assert.match(source, /summarizeLensActivation/);
  assert.match(source, /data-activation-export/);
  assert.match(source, /aggregate product signals/i);
});

test("activation summary renderer runs immediately after local learning telemetry", () => {
  const telemetry = RENDER_STEPS.indexOf("scripts/learning-telemetry.mjs");
  const activation = RENDER_STEPS.indexOf("scripts/learning-activation-summary.mjs");
  assert.ok(telemetry >= 0);
  assert.equal(activation, telemetry + 1);
});

test("Lens analysis telemetry is emitted after async rendering rather than guessed on submit", () => {
  const lens = fs.readFileSync(path.join(ROOT, "public", "assets", "pattern-lens.js"), "utf8");
  const telemetry = fs.readFileSync(path.join(ROOT, "public", "assets", "learning-events.js"), "utf8");

  assert.match(lens, /metkagram:lens-analysis-complete/);
  assert.match(lens, /const render = async \(\{ emitAnalysis = false \} = \{\}\)/);
  assert.match(lens, /await loadPatterns\(\)/);
  assert.match(lens, /if \(emitAnalysis\) emitAnalysisComplete\(matches\)/);
  assert.match(lens, /await render\(\{ emitAnalysis: true \}\)/);

  assert.match(telemetry, /addEventListener\("metkagram:lens-analysis-complete"/);
  assert.match(telemetry, /result_count: resultCount/);
  assert.match(telemetry, /result_pattern_ids: patternIds/);
  assert.doesNotMatch(telemetry, /lensForm\.addEventListener\("submit"/);
  assert.doesNotMatch(telemetry, /setTimeout\(\(\) => \{[\s\S]*lens_analyze/);
});
