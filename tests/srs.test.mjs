import assert from "node:assert/strict";
import test from "node:test";
import { dueIds, emptyState, mergeStates, normalizeEnvelope, progressStats, scheduleReview } from "../public/assets/srs-core.js";

test("SRS intervals match the previous MetkaX implementation", () => {
  const start = 1_700_000_000_000;
  const first = scheduleReview(emptyState("CON001"), 1, start);
  assert.equal(first.reps, 1);
  assert.equal(first.interval, 1);
  assert.equal(first.next, start + 86_400_000);
  const second = scheduleReview(first, 1, start + 86_400_000);
  assert.equal(second.reps, 2);
  assert.equal(second.interval, 3);
  const third = scheduleReview(second, 2, start + 4 * 86_400_000);
  assert.equal(third.reps, 3);
  assert.equal(third.ease, 2.65);
  assert.equal(third.interval, 8);
  const again = scheduleReview(third, 0, start + 5 * 86_400_000);
  assert.equal(again.reps, 0);
  assert.equal(again.interval, 0);
  assert.equal(again.next, start + 5 * 86_400_000 + 300_000);
});

test("merge keeps the most recently reviewed compatible state", () => {
  const older = { ...emptyState("A"), last: 10 };
  const newer = { ...emptyState("A"), last: 20, reps: 2 };
  assert.equal(mergeStates({ A: older }, { A: newer }).A.reps, 2);
  assert.equal(mergeStates({ A: newer }, { A: older }).A.reps, 2);
});

test("review queue and progress statistics work", () => {
  const now = 1000;
  const records = { A: { ...emptyState("A"), next: 900, history: [{ t: 1, grade: 1 }] }, B: { ...emptyState("B"), next: 1100, history: [{ t: 2, grade: 2 }, { t: 3, grade: 1 }] } };
  assert.deepEqual(dueIds(["A", "B", "C"], records, now), ["A", "C"]);
  assert.deepEqual(progressStats(records, ["A", "B", "C"], now), { reviewed: 2, totalReviews: 3, due: 2 });
});

test("legacy snapshots and versioned export envelopes normalize", () => {
  const records = { A: emptyState("A") };
  assert.deepEqual(normalizeEnvelope(records).records, records);
  assert.deepEqual(normalizeEnvelope({ schemaVersion: 2, exportedAt: "2026-01-01", records }).records, records);
  assert.throws(() => normalizeEnvelope({ A: { id: "B", history: [] } }));
});
