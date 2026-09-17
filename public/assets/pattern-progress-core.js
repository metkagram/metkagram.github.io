export const PATTERN_PROGRESS_STORAGE_KEY = 'metkagram:pattern-progress:v1';
export const PATTERN_PROGRESS_VERSION = 1;

function normalizePatternId(value) {
  return String(value || '').trim().toUpperCase();
}

export function emptyPatternProgressState() {
  return { version: PATTERN_PROGRESS_VERSION, items: {} };
}

export function normalizePatternProgressState(value) {
  const source = value && typeof value === 'object' ? value : {};
  const items = {};

  for (const [rawId, rawItem] of Object.entries(source.items || {})) {
    const patternId = normalizePatternId(rawItem?.patternId || rawId);
    if (!patternId || rawItem?.completed !== true) continue;

    items[patternId] = {
      patternId,
      completed: true,
      updatedAt: typeof rawItem.updatedAt === 'string' ? rawItem.updatedAt : null,
    };
  }

  return { version: PATTERN_PROGRESS_VERSION, items };
}

export function parsePatternProgress(rawValue) {
  if (!rawValue) return emptyPatternProgressState();
  try {
    return normalizePatternProgressState(
      typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue,
    );
  } catch {
    return emptyPatternProgressState();
  }
}

export function readPatternProgress(storage = globalThis.localStorage) {
  try {
    return parsePatternProgress(storage?.getItem(PATTERN_PROGRESS_STORAGE_KEY));
  } catch {
    return emptyPatternProgressState();
  }
}

export function writePatternProgress(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem(
      PATTERN_PROGRESS_STORAGE_KEY,
      JSON.stringify(normalizePatternProgressState(state)),
    );
    return true;
  } catch {
    return false;
  }
}

export function isPatternCompleted(state, patternId) {
  const id = normalizePatternId(patternId);
  return Boolean(id && normalizePatternProgressState(state).items[id]?.completed);
}

export function setPatternCompleted(state, patternId, completed, updatedAt = new Date().toISOString()) {
  const id = normalizePatternId(patternId);
  if (!id) return normalizePatternProgressState(state);

  const next = normalizePatternProgressState(state);
  if (completed) {
    next.items[id] = { patternId: id, completed: true, updatedAt };
  } else {
    delete next.items[id];
  }
  return next;
}

export function patternProgressSummary(state, recentLimit = 10) {
  const normalized = normalizePatternProgressState(state);
  const completed = Object.values(normalized.items)
    .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));

  return {
    completedCount: completed.length,
    recentlyCompleted: completed.slice(0, Math.max(0, recentLimit)).map((item) => ({
      patternId: item.patternId,
      updatedAt: item.updatedAt,
    })),
  };
}
