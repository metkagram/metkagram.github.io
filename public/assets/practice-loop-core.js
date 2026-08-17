const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizePracticeText(value = "") {
  return String(value)
    .replaceAll("**", "")
    .replace(/[’‘]/g, "'")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

export function literalPracticeSegments(formula = "") {
  return String(formula)
    .replaceAll("**", "")
    .split(/\[[^\]]+\]|\{[^}]+\}|<[^>]+>/g)
    .flatMap((part) => part.split(/\s+(?:\+|\/|\|)\s+|\s*→\s*/g))
    .map((part) => part
      .replace(/^[\s,;:.!?()\-–—+/|]+|[\s,;:.!?()\-–—+/|]+$/g, "")
      .replaceAll(/\s+/g, " ")
      .trim())
    .filter((part) => {
      const normalized = normalizePracticeText(part);
      if (!normalized || !/[\p{L}\p{N}]/u.test(normalized)) return false;
      const words = normalized.split(/\s+/).filter(Boolean);
      return words.length >= 2 || normalized.length >= 5;
    });
}

export function evaluatePracticeStructure(answer, formula) {
  const normalizedAnswer = normalizePracticeText(answer);
  const anchors = literalPracticeSegments(formula);
  if (!normalizedAnswer) {
    return { status: "empty", coverage: 0, anchors, hits: [], missing: anchors };
  }
  if (!anchors.length) {
    return { status: "manual", coverage: null, anchors: [], hits: [], missing: [] };
  }
  const hits = anchors.filter((anchor) => normalizedAnswer.includes(normalizePracticeText(anchor)));
  const missing = anchors.filter((anchor) => !hits.includes(anchor));
  const coverage = hits.length / anchors.length;
  const status = coverage >= 0.75 ? "detected" : coverage >= 0.4 ? "partial" : "not-detected";
  return { status, coverage, anchors, hits, missing };
}

export function nextPracticeReview(previous = null, rating, now = Date.now()) {
  if (!['needs-work', 'got-it'].includes(rating)) throw new Error(`Unknown practice rating: ${rating}`);
  const priorInterval = Number(previous?.intervalDays) || 0;
  const priorStreak = Number(previous?.streak) || 0;
  const intervalDays = rating === 'needs-work' ? 1 : Math.min(priorInterval > 0 ? Math.max(3, priorInterval * 2) : 3, 30);
  const streak = rating === 'needs-work' ? 0 : priorStreak + 1;
  return {
    intervalDays,
    streak,
    lastRating: rating,
    reviewedAt: new Date(now).toISOString(),
    dueAt: new Date(now + intervalDays * DAY_MS).toISOString()
  };
}
