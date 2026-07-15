export const LEGACY_STATE_KEY = "metkax:srs:v1";
export const STATE_KEY = "metkagram:progress:v2";
export const SCHEMA_VERSION = 2;

export function emptyState(id) {
  return { id, reps: 0, ease: 2.5, interval: 0, last: 0, next: 0, history: [] };
}

export function scheduleReview(current, grade, timestamp = Date.now()) {
  if (![0, 1, 2].includes(grade)) throw new Error("grade must be 0, 1 or 2");
  const state = { ...emptyState(current?.id || ""), ...current };
  let ease = state.ease;
  if (grade === 2) ease = Math.max(1.3, ease + 0.15);
  else if (grade === 0) ease = Math.max(1.3, ease - 0.2);

  let reps = state.reps;
  let interval = state.interval;
  if (grade === 0) {
    reps = 0;
    interval = 0;
  } else {
    reps = Math.max(1, reps + 1);
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 3;
    else interval = Math.round(interval * ease);
  }
  const next = grade === 0 ? timestamp + 5 * 60 * 1000 : timestamp + interval * 24 * 60 * 60 * 1000;
  return { ...state, reps, ease, interval, last: timestamp, next, history: [...(state.history || []), { t: timestamp, grade }] };
}

export function mergeStates(existing = {}, incoming = {}) {
  const result = { ...existing };
  for (const [id, state] of Object.entries(incoming)) {
    const current = result[id];
    if (!current || (state.last || 0) > (current.last || 0)) result[id] = state;
  }
  return result;
}

export function normalizeEnvelope(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("progress must be an object");
  const records = value.schemaVersion === SCHEMA_VERSION ? value.records : value;
  if (!records || typeof records !== "object" || Array.isArray(records)) throw new Error("progress records must be an object");
  for (const [id, state] of Object.entries(records)) {
    if (!state || typeof state !== "object" || state.id !== id || !Array.isArray(state.history)) throw new Error(`invalid progress record ${id}`);
  }
  return { schemaVersion: SCHEMA_VERSION, exportedAt: value.exportedAt || new Date().toISOString(), records };
}

export function loadProgress(storage = window.localStorage) {
  try {
    const current = storage.getItem(STATE_KEY);
    if (current) return normalizeEnvelope(JSON.parse(current)).records;
    const legacy = storage.getItem(LEGACY_STATE_KEY);
    if (legacy) {
      const records = normalizeEnvelope(JSON.parse(legacy)).records;
      saveProgress(records, storage);
      return records;
    }
  } catch {
    return {};
  }
  return {};
}

export function saveProgress(records, storage = window.localStorage) {
  const envelope = normalizeEnvelope({ schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), records });
  storage.setItem(STATE_KEY, JSON.stringify(envelope));
  storage.setItem(LEGACY_STATE_KEY, JSON.stringify(records));
  return envelope;
}

export function dueIds(ids, records, timestamp = Date.now()) {
  return ids.filter((id) => !records[id] || records[id].next <= timestamp);
}

export function progressStats(records, ids = Object.keys(records), timestamp = Date.now()) {
  const states = ids.map((id) => records[id]).filter(Boolean);
  return {
    reviewed: states.filter((state) => state.history?.length).length,
    totalReviews: states.reduce((sum, state) => sum + (state.history?.length || 0), 0),
    due: ids.filter((id) => !records[id] || records[id].next <= timestamp).length
  };
}
