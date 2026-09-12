const LENS_EVENT_NAMES = new Set([
  "lens_analyze",
  "lens_practice_attempt",
  "lens_practice_complete",
  "learning_object_open",
]);

const BUNDLE_KEYS = new Set(["schema_version", "exported_at", "source", "privacy", "events"]);
const EVENT_KEYS = new Set([
  "schema_version",
  "event_id",
  "event_name",
  "occurred_at",
  "session_id",
  "locale",
  "page",
  "surface",
  "object_type",
  "object_id",
  "metadata",
]);
const METADATA_KEYS = new Set([
  "result_count",
  "result_pattern_ids",
  "target_type",
  "target_id",
  "format",
  "direction",
]);
const RAW_TEXT_KEYS = /(^|_)(text|sentence|answer|prompt|query|input|utterance|content)(_|$)/i;

function parseTime(value, field) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${field} must be a valid date-time`);
  return timestamp;
}

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

function rejectRawTextKeys(value, path = "bundle") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectRawTextKeys(item, `${path}[${index}]`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (RAW_TEXT_KEYS.test(key)) throw new Error(`raw learner text field is not allowed in Lens activation input: ${path}.${key}`);
    rejectRawTextKeys(child, `${path}.${key}`);
  }
}

function assertAllowedKeys(value, allowed, path) {
  for (const key of Object.keys(value || {})) {
    if (!allowed.has(key)) throw new Error(`${path}.${key} is not part of the privacy-safe learning-event contract`);
  }
}

export function validateLearningActivityBundle(bundle) {
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) throw new Error("learning activity bundle must be an object");
  assertAllowedKeys(bundle, BUNDLE_KEYS, "bundle");
  if (bundle.schema_version !== 1) throw new Error("learning activity bundle schema_version must be 1");
  if (!Array.isArray(bundle.events)) throw new Error("learning activity bundle events must be an array");
  rejectRawTextKeys(bundle.events, "events");

  const eventIds = new Set();
  for (const [index, event] of bundle.events.entries()) {
    if (!event || typeof event !== "object" || Array.isArray(event)) throw new Error(`events[${index}] must be an object`);
    assertAllowedKeys(event, EVENT_KEYS, `events[${index}]`);
    if (event.metadata !== undefined) {
      if (!event.metadata || typeof event.metadata !== "object" || Array.isArray(event.metadata)) throw new Error(`events[${index}].metadata must be an object`);
      assertAllowedKeys(event.metadata, METADATA_KEYS, `events[${index}].metadata`);
    }
    if (event.schema_version !== 1) throw new Error(`events[${index}].schema_version must be 1`);
    const eventId = requiredString(event.event_id, `events[${index}].event_id`);
    if (eventIds.has(eventId)) throw new Error(`duplicate event_id: ${eventId}`);
    eventIds.add(eventId);
    requiredString(event.event_name, `events[${index}].event_name`);
    requiredString(event.session_id, `events[${index}].session_id`);
    parseTime(event.occurred_at, `events[${index}].occurred_at`);
  }
  return bundle;
}

function sortedLensEvents(bundle) {
  return bundle.events
    .filter((event) => event.surface === "lens" && LENS_EVENT_NAMES.has(event.event_name))
    .map((event) => ({ ...event, _time: parseTime(event.occurred_at, `${event.event_id}.occurred_at`) }))
    .sort((a, b) => a._time - b._time || String(a.event_id).localeCompare(String(b.event_id)));
}

function resultIds(event) {
  const ids = event?.metadata?.result_pattern_ids;
  return Array.isArray(ids) ? ids.map(String) : [];
}

function analyzeSession(events) {
  const analyses = events.filter((event) => event.event_name === "lens_analyze");
  const attempts = events.filter((event) => event.event_name === "lens_practice_attempt");
  const completions = events.filter((event) => event.event_name === "lens_practice_complete");
  const continuations = events.filter((event) => event.event_name === "learning_object_open");
  const matchReturned = analyses.some((event) => Number(event?.metadata?.result_count || 0) > 0 || resultIds(event).length > 0);

  let usefulReuse = false;
  let usefulReuseCompletedAt = null;
  for (const completion of completions) {
    const patternId = String(completion.object_id || "");
    if (!patternId) continue;
    const priorAnalyses = analyses
      .filter((event) => event._time <= completion._time && resultIds(event).includes(patternId))
      .sort((a, b) => b._time - a._time);
    for (const priorAnalysis of priorAnalyses) {
      const priorAttempt = attempts.find((event) =>
        String(event.object_id || "") === patternId
        && event._time >= priorAnalysis._time
        && event._time <= completion._time
      );
      if (!priorAttempt) continue;
      usefulReuse = true;
      usefulReuseCompletedAt = completion._time;
      break;
    }
    if (usefulReuse) break;
  }

  const continuationAfterReuse = usefulReuse && continuations.some((event) => event._time >= usefulReuseCompletedAt);
  return {
    started: analyses.length > 0,
    match_returned: matchReturned,
    practice_attempt: attempts.length > 0,
    practice_complete: completions.length > 0,
    useful_reuse: usefulReuse,
    continuation_after_reuse: continuationAfterReuse,
    first_analysis_at: analyses.length ? analyses[0]._time : null,
    last_analysis_at: analyses.length ? analyses[analyses.length - 1]._time : null,
  };
}

function rate(numerator, denominator) {
  return denominator ? numerator / denominator : null;
}

export function analyzeParticipantLensActivity(bundle, { repeatAfterDays = 2 } = {}) {
  validateLearningActivityBundle(bundle);
  if (!Number.isFinite(repeatAfterDays) || repeatAfterDays < 0) throw new Error("repeatAfterDays must be a finite number >= 0");

  const events = sortedLensEvents(bundle);
  const bySession = new Map();
  for (const event of events) {
    const list = bySession.get(event.session_id) || [];
    list.push(event);
    bySession.set(event.session_id, list);
  }
  const sessions = [...bySession.entries()]
    .map(([sessionId, sessionEvents]) => ({ sessionId, ...analyzeSession(sessionEvents) }))
    .filter((session) => session.started)
    .sort((a, b) => a.first_analysis_at - b.first_analysis_at || a.sessionId.localeCompare(b.sessionId));

  const first = sessions[0] || null;
  const firstAnalysisAt = first?.first_analysis_at ?? null;
  const repeatThresholdMs = repeatAfterDays * 24 * 60 * 60 * 1000;
  const repeatPull = firstAnalysisAt !== null && sessions.some((session, index) => index > 0 && session.first_analysis_at - firstAnalysisAt >= repeatThresholdMs);

  return {
    lens_sessions: sessions.length,
    matched_sessions: sessions.filter((session) => session.match_returned).length,
    useful_reuse_sessions: sessions.filter((session) => session.useful_reuse).length,
    continuation_sessions: sessions.filter((session) => session.continuation_after_reuse).length,
    first_session: first ? {
      analysis_started: first.started,
      match_returned: first.match_returned,
      practice_attempt: first.practice_attempt,
      practice_complete: first.practice_complete,
      useful_reuse: first.useful_reuse,
      continuation_after_reuse: first.continuation_after_reuse,
    } : null,
    repeat_pull: repeatPull,
    repeat_after_days: repeatAfterDays,
  };
}

export function aggregateLensActivationPilot(bundles, { repeatAfterDays = 2 } = {}) {
  if (!Array.isArray(bundles) || !bundles.length) throw new Error("at least one participant bundle is required");
  const participants = bundles.map((bundle) => analyzeParticipantLensActivity(bundle, { repeatAfterDays }));
  const started = participants.filter((item) => item.first_session?.analysis_started).length;
  const matched = participants.filter((item) => item.first_session?.match_returned).length;
  const attempted = participants.filter((item) => item.first_session?.practice_attempt).length;
  const completed = participants.filter((item) => item.first_session?.practice_complete).length;
  const usefulReuse = participants.filter((item) => item.first_session?.useful_reuse).length;
  const continued = participants.filter((item) => item.first_session?.continuation_after_reuse).length;
  const repeatPull = participants.filter((item) => item.repeat_pull).length;
  const totalLensSessions = participants.reduce((sum, item) => sum + item.lens_sessions, 0);
  const matchedSessions = participants.reduce((sum, item) => sum + item.matched_sessions, 0);
  const usefulReuseSessions = participants.reduce((sum, item) => sum + item.useful_reuse_sessions, 0);

  return {
    schema_version: 1,
    participant_count: participants.length,
    repeat_after_days: repeatAfterDays,
    evidence_boundary: "Behavioral activation report from explicit local exports. A returned match is not a helpfulness judgment, a Useful Reuse Session is not evidence of retention or learning efficacy, and participant feedback must be analysed separately.",
    first_session_funnel: {
      analysis_started: started,
      match_returned: matched,
      practice_attempt: attempted,
      practice_complete: completed,
      useful_reuse: usefulReuse,
      continuation_after_reuse: continued,
      match_returned_rate: rate(matched, started),
      practice_attempt_rate: rate(attempted, started),
      useful_reuse_rate: rate(usefulReuse, started),
      continuation_rate: rate(continued, started),
    },
    repeat_pull: {
      participants: repeatPull,
      rate: rate(repeatPull, started),
    },
    sessions: {
      lens_sessions: totalLensSessions,
      matched_sessions: matchedSessions,
      useful_reuse_sessions: usefulReuseSessions,
      useful_reuse_per_matched_session: rate(usefulReuseSessions, matchedSessions),
    },
    qualitative_signals_not_inferred: [
      "entry clarity",
      "learner-rated usefulness",
      "what was unclear",
      "what the learner expected next",
      "learning retention or efficacy",
    ],
  };
}

export function renderLensActivationMarkdown(report) {
  const pct = (value) => value === null ? "n/a" : `${(value * 100).toFixed(1)}%`;
  const funnel = report.first_session_funnel;
  return `# Lens activation pilot report\n\nParticipants: ${report.participant_count}\nRepeat-pull threshold: ${report.repeat_after_days} day(s)\n\n> ${report.evidence_boundary}\n\n## First-session funnel\n\n| Signal | Participants | Rate vs analysis started |\n|---|---:|---:|\n| Analysis started | ${funnel.analysis_started} | ${pct(rate(funnel.analysis_started, funnel.analysis_started))} |\n| Reviewed match returned | ${funnel.match_returned} | ${pct(funnel.match_returned_rate)} |\n| Own-example attempt | ${funnel.practice_attempt} | ${pct(funnel.practice_attempt_rate)} |\n| Structural check completed | ${funnel.practice_complete} | ${pct(rate(funnel.practice_complete, funnel.analysis_started))} |\n| Useful Reuse Session | ${funnel.useful_reuse} | ${pct(funnel.useful_reuse_rate)} |\n| Continued to a learning object after reuse | ${funnel.continuation_after_reuse} | ${pct(funnel.continuation_rate)} |\n\n## Repeat pull\n\n${report.repeat_pull.participants} participant(s) returned to Lens after at least ${report.repeat_after_days} day(s): ${pct(report.repeat_pull.rate)}.\n\n## Session-level signal\n\n- Lens sessions: ${report.sessions.lens_sessions}\n- Sessions with a reviewed match returned: ${report.sessions.matched_sessions}\n- Useful Reuse Sessions: ${report.sessions.useful_reuse_sessions}\n- Useful reuse / matched session: ${pct(report.sessions.useful_reuse_per_matched_session)}\n\n## Not inferred from telemetry\n\n${report.qualitative_signals_not_inferred.map((item) => `- ${item}`).join("\n")}\n`;
}
