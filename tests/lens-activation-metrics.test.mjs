import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateLensActivationPilot,
  analyzeParticipantLensActivity,
  renderLensActivationMarkdown,
  validateLearningActivityBundle,
} from "../src/lens-activation-metrics.mjs";

function event({ id, name, at, session, objectId = "", metadata = {}, surface = "lens" }) {
  return {
    schema_version: 1,
    event_id: id,
    event_name: name,
    occurred_at: at,
    session_id: session,
    locale: "en",
    page: "/en/lens/",
    surface,
    object_type: objectId ? "pattern" : "none",
    object_id: objectId,
    metadata,
  };
}

function bundle(events) {
  return {
    schema_version: 1,
    exported_at: "2026-09-10T12:00:00.000Z",
    source: "Metkagram local learning activity",
    privacy: "Stored locally and exported explicitly; no raw learner text.",
    events,
  };
}

const participantA = bundle([
  event({ id: "event-a-001", name: "lens_analyze", at: "2026-09-01T10:00:00.000Z", session: "session-a1", metadata: { result_count: 2, result_pattern_ids: ["PAT001", "PAT002"] } }),
  event({ id: "event-a-002", name: "lens_practice_attempt", at: "2026-09-01T10:01:00.000Z", session: "session-a1", objectId: "PAT001" }),
  event({ id: "event-a-003", name: "lens_practice_complete", at: "2026-09-01T10:02:00.000Z", session: "session-a1", objectId: "PAT001" }),
  event({ id: "event-a-004", name: "learning_object_open", at: "2026-09-01T10:03:00.000Z", session: "session-a1", objectId: "PAT001", metadata: { target_type: "pattern", target_id: "PAT001" } }),
  event({ id: "event-a-005", name: "lens_analyze", at: "2026-09-04T10:00:00.000Z", session: "session-a2", metadata: { result_count: 1, result_pattern_ids: ["PAT003"] } }),
]);

const participantB = bundle([
  event({ id: "event-b-001", name: "lens_analyze", at: "2026-09-02T11:00:00.000Z", session: "session-b1", metadata: { result_count: 0, result_pattern_ids: [] } }),
]);

test("participant analysis recognizes a Useful Reuse Session only from the full Lens chain", () => {
  const result = analyzeParticipantLensActivity(participantA, { repeatAfterDays: 2 });
  assert.equal(result.lens_sessions, 2);
  assert.equal(result.matched_sessions, 2);
  assert.equal(result.useful_reuse_sessions, 1);
  assert.deepEqual(result.first_session, {
    analysis_started: true,
    match_returned: true,
    practice_attempt: true,
    practice_complete: true,
    useful_reuse: true,
    continuation_after_reuse: true,
  });
  assert.equal(result.repeat_pull, true);
});

test("practice completion alone is not counted as useful reuse without a matched result and attempt", () => {
  const invalidChain = bundle([
    event({ id: "event-c-001", name: "lens_analyze", at: "2026-09-01T10:00:00.000Z", session: "session-c1", metadata: { result_count: 1, result_pattern_ids: ["PAT001"] } }),
    event({ id: "event-c-002", name: "lens_practice_complete", at: "2026-09-01T10:02:00.000Z", session: "session-c1", objectId: "PAT002" }),
  ]);
  const result = analyzeParticipantLensActivity(invalidChain);
  assert.equal(result.first_session.practice_complete, true);
  assert.equal(result.first_session.useful_reuse, false);
});

test("Useful Reuse Session requires result then attempt then completion in order", () => {
  const outOfOrder = bundle([
    event({ id: "event-d-001", name: "lens_practice_attempt", at: "2026-09-01T09:59:00.000Z", session: "session-d1", objectId: "PAT001" }),
    event({ id: "event-d-002", name: "lens_analyze", at: "2026-09-01T10:00:00.000Z", session: "session-d1", metadata: { result_count: 1, result_pattern_ids: ["PAT001"] } }),
    event({ id: "event-d-003", name: "lens_practice_complete", at: "2026-09-01T10:01:00.000Z", session: "session-d1", objectId: "PAT001" }),
  ]);
  const result = analyzeParticipantLensActivity(outOfOrder);
  assert.equal(result.first_session.practice_attempt, true);
  assert.equal(result.first_session.practice_complete, true);
  assert.equal(result.first_session.useful_reuse, false);
});

test("pilot aggregation keeps match-returned separate from helpfulness and computes repeat pull", () => {
  const report = aggregateLensActivationPilot([participantA, participantB], { repeatAfterDays: 2 });
  assert.equal(report.participant_count, 2);
  assert.equal(report.first_session_funnel.analysis_started, 2);
  assert.equal(report.first_session_funnel.match_returned, 1);
  assert.equal(report.first_session_funnel.practice_attempt, 1);
  assert.equal(report.first_session_funnel.useful_reuse, 1);
  assert.equal(report.first_session_funnel.continuation_after_reuse, 1);
  assert.equal(report.repeat_pull.participants, 1);
  assert.equal(report.repeat_pull.rate, 0.5);
  assert.equal(report.sessions.lens_sessions, 3);
  assert.equal(report.sessions.matched_sessions, 2);
  assert.equal(report.sessions.useful_reuse_sessions, 1);
  assert.match(report.evidence_boundary, /returned match is not a helpfulness judgment/i);
  assert.ok(report.qualitative_signals_not_inferred.includes("learner-rated usefulness"));
  const serialized = JSON.stringify(report);
  assert.doesNotMatch(serialized, /session-a1|event-a-001/);
});

test("activation input rejects raw learner text and unknown fields instead of silently accepting them", () => {
  const unsafe = structuredClone(participantA);
  unsafe.events[0].metadata.answer_text = "raw learner sentence";
  assert.throws(() => validateLearningActivityBundle(unsafe), /raw learner text field is not allowed/i);

  const unknown = structuredClone(participantA);
  unknown.events[0].learnerSentence = "raw learner sentence";
  assert.throws(() => validateLearningActivityBundle(unknown), /not part of the privacy-safe learning-event contract/i);
});

test("activation markdown states the evidence boundary and missing qualitative signals", () => {
  const report = aggregateLensActivationPilot([participantA, participantB], { repeatAfterDays: 2 });
  const markdown = renderLensActivationMarkdown(report);
  assert.match(markdown, /Useful Reuse Session/);
  assert.match(markdown, /Repeat pull/);
  assert.match(markdown, /learner-rated usefulness/);
  assert.match(markdown, /not evidence of retention or learning efficacy/i);
});
