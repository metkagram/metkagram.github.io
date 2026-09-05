const EVENT_NAMES = new Set([
  "lens_analyze",
  "lens_practice_attempt",
  "lens_practice_complete",
  "learning_object_open",
]);

function percent(numerator, denominator) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : null;
}

function eventSession(event) {
  return typeof event?.session_id === "string" && event.session_id ? event.session_id : null;
}

function eventTime(event) {
  const value = Date.parse(event?.occurred_at || "");
  return Number.isFinite(value) ? value : null;
}

function lensContinuation(event) {
  return event?.event_name === "learning_object_open"
    && event?.surface === "lens"
    && ["pattern", "contrast", "drill", "pack"].includes(event?.object_type);
}

export function summarizeLensActivation(events = []) {
  const safeEvents = Array.isArray(events)
    ? events.filter((event) => EVENT_NAMES.has(event?.event_name))
    : [];

  const analyses = safeEvents.filter((event) => event.event_name === "lens_analyze");
  const matchedAnalyses = analyses.filter((event) => Number.isInteger(event.metadata?.result_count) && event.metadata.result_count > 0);
  const noMatchAnalyses = analyses.filter((event) => event.metadata?.result_count === 0);
  const attempts = safeEvents.filter((event) => event.event_name === "lens_practice_attempt");
  const completions = safeEvents.filter((event) => event.event_name === "lens_practice_complete");
  const continuations = safeEvents.filter(lensContinuation);

  const lensSessions = new Set();
  const sessionSignals = new Map();
  const markSession = (event, signal) => {
    const session = eventSession(event);
    if (!session) return;
    lensSessions.add(session);
    if (!sessionSignals.has(session)) sessionSignals.set(session, new Set());
    sessionSignals.get(session).add(signal);
  };

  analyses.forEach((event) => markSession(event, "analyze"));
  attempts.forEach((event) => markSession(event, "attempt"));
  completions.forEach((event) => markSession(event, "complete"));
  continuations.forEach((event) => markSession(event, "continue"));

  const sessionCount = (signal) => [...sessionSignals.values()].filter((signals) => signals.has(signal)).length;
  const times = safeEvents.map(eventTime).filter((value) => value !== null).sort((a, b) => a - b);
  const locales = [...new Set(safeEvents.map((event) => event?.locale).filter((locale) => ["en", "ru"].includes(locale)))].sort();

  const metrics = {
    lens_session_count: lensSessions.size,
    analysis_count: analyses.length,
    matched_analysis_count: matchedAnalyses.length,
    no_match_analysis_count: noMatchAnalyses.length,
    practice_attempt_count: attempts.length,
    practice_completion_count: completions.length,
    continuation_count: continuations.length,
    sessions_with_analysis: sessionCount("analyze"),
    sessions_with_attempt: sessionCount("attempt"),
    sessions_with_completion: sessionCount("complete"),
    sessions_with_continuation: sessionCount("continue"),
    additional_local_session_count: Math.max(0, lensSessions.size - 1),
  };

  return {
    schema_version: 1,
    summary_type: "metkagram_lens_activation",
    privacy: {
      contains_learner_text: false,
      contains_event_ids: false,
      contains_session_ids: false,
      contains_object_ids: false,
      aggregate_only: true,
    },
    evidence_boundary: {
      matched_analysis_rate_is_not_helpfulness: true,
      additional_local_sessions_do_not_prove_voluntary_return: true,
      no_learning_efficacy_claim: true,
      note: "This summary describes local product activation signals only. Learner-perceived usefulness and voluntary repeat pull require separate participant evidence.",
    },
    window: {
      first_event_at: times.length ? new Date(times[0]).toISOString() : null,
      last_event_at: times.length ? new Date(times.at(-1)).toISOString() : null,
      locales,
    },
    metrics,
    rates: {
      matched_analysis_rate: percent(metrics.matched_analysis_count, metrics.analysis_count),
      attempt_per_analysis_rate: percent(metrics.practice_attempt_count, metrics.analysis_count),
      completion_per_attempt_rate: percent(metrics.practice_completion_count, metrics.practice_attempt_count),
      continuation_per_completion_rate: percent(metrics.continuation_count, metrics.practice_completion_count),
      session_attempt_rate: percent(metrics.sessions_with_attempt, metrics.sessions_with_analysis),
      session_completion_rate: percent(metrics.sessions_with_completion, metrics.sessions_with_analysis),
      session_continuation_rate: percent(metrics.sessions_with_continuation, metrics.sessions_with_analysis),
    },
  };
}

export function activationSummaryBundle(events = [], exportedAt = new Date().toISOString()) {
  return {
    ...summarizeLensActivation(events),
    exported_at: exportedAt,
    source: "Metkagram browser-local learning activity",
    participant_action: "Explicit local export",
  };
}
