import { classifyReasoningSentence, PUBLIC_LEARNING_STRENGTH_RANK } from "./public-learning.mjs";
import { classifyPatternLensExtraRules } from "./pattern-lens-extra-rules.mjs";

export const LENS_STOP_SEGMENTS = new Set([
  "a", "an", "and", "as", "at", "but", "for", "if", "in", "is", "it", "no", "not", "of", "on", "or", "the", "that", "this", "to", "with", "yes",
  "aber", "am", "das", "dass", "der", "die", "ein", "eine", "es", "für", "im", "ist", "ja", "mit", "nein", "nicht", "und", "von", "wenn", "zu"
]);

export const LENS_META_CUES = {
  en: /\b(?:word|phrase|term|expression|sentence|paragraph|section|title|chapter|conjunction|adverb|preposition|verb|noun|adjective)\b/iu,
  de: /\b(?:wort|wörter|ausdruck|ausdrücke|satz|sätze|absatz|abschnitt|titel|kapitel|konjunktion|adverb|präposition|verb|nomen|substantiv|adjektiv)\b/iu,
};

const REASONING_SCORE = Object.freeze({ direct: 18, supported: 16, prompt: 14 });

export function normalizeLensText(value = "") {
  return String(value)
    .replaceAll("**", "")
    .replace(/[’‘]/g, "'")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

export function isLensMetalinguistic(text, language = "en") {
  return Boolean(LENS_META_CUES[language]?.test(String(text || "")));
}

export function isInformativeLensSegment(segment = "") {
  const normalized = normalizeLensText(segment);
  if (!normalized || LENS_STOP_SEGMENTS.has(normalized)) return false;
  return /[\p{L}\p{N}]/u.test(normalized);
}

export function extractLensLiteralSegments(formula = "") {
  return String(formula)
    .replaceAll("**", "")
    .split(/\[[^\]]+\]|\{[^}]+\}|<[^>]+>/g)
    .flatMap((part) => part.split(/\s+(?:\+|\/|\|)\s+|\s*→\s*/g))
    .map((part) => part
      .replace(/^[\s,;:.!?()\-–—+/|]+|[\s,;:.!?()\-–—+/|]+$/g, "")
      .replaceAll(/\s+/g, " ")
      .trim())
    .filter(isInformativeLensSegment);
}

function languageRecord(pattern, language) {
  return pattern.langs?.find((item) => item.lang === language) || null;
}

function hasStrongLiteralEvidence(hits, exampleMatch) {
  if (exampleMatch || hits.length >= 2) return true;
  return hits.some((segment) => {
    const normalized = normalizeLensText(segment);
    const words = normalized.split(/\s+/).filter(Boolean);
    return words.length >= 2 && normalized.length >= 8;
  });
}

function reasoningLinksFor(text, language) {
  const base = classifyReasoningSentence(text, language, { maxLinks: 3 });
  const extra = classifyPatternLensExtraRules(text, language);
  const byPattern = new Map();
  for (const link of [...base, ...extra].sort((a, b) =>
    PUBLIC_LEARNING_STRENGTH_RANK[b.strength] - PUBLIC_LEARNING_STRENGTH_RANK[a.strength]
    || (b.priority || 0) - (a.priority || 0)
    || a.rule_id.localeCompare(b.rule_id)
  )) {
    if (!byPattern.has(link.pattern_id)) byPattern.set(link.pattern_id, link);
  }
  return [...byPattern.values()];
}

export function rankLensPatterns(patterns, text, language = "en", limit = 6) {
  const normalizedText = normalizeLensText(text);
  if (!normalizedText || isLensMetalinguistic(text, language)) return [];
  const reasoningLinks = reasoningLinksFor(text, language);
  const reasoningByPattern = new Map(reasoningLinks.map((link) => [link.pattern_id, link]));

  return patterns
    .map((pattern) => {
      const lang = languageRecord(pattern, language);
      if (!lang) return null;
      const segments = extractLensLiteralSegments(lang.formula);
      const hits = segments.filter((segment) => normalizedText.includes(normalizeLensText(segment)));
      const examples = [lang.example, ...(lang.examples || []).map((item) => item.text)].filter(Boolean);
      const exampleMatch = examples.find((example) => {
        const normalized = normalizeLensText(example);
        return normalized.length >= 8 && (normalizedText.includes(normalized) || normalized.includes(normalizedText));
      });
      const reasoningMatch = reasoningByPattern.get(pattern.id) || null;
      if (!reasoningMatch && !hasStrongLiteralEvidence(hits, exampleMatch)) return null;

      const literalScore = hits.reduce((sum, segment) => sum + 2 + Math.min(3, normalizeLensText(segment).length / 10), 0)
        + (exampleMatch ? 10 : 0)
        + (hits.length > 1 ? 2 : 0);
      const reasoningScore = reasoningMatch ? REASONING_SCORE[reasoningMatch.strength] || 0 : 0;
      const combinedBonus = reasoningMatch && hits.length ? 3 : 0;
      const score = literalScore + reasoningScore + combinedBonus;
      if (!score) return null;
      const evidenceType = reasoningMatch && hits.length
        ? "literal+reasoning"
        : reasoningMatch
          ? "reasoning"
          : "literal";
      return {
        id: pattern.id,
        set_id: pattern.set_id,
        group_id: pattern.group_id,
        reasoning_move: pattern.reasoning?.move || reasoningMatch?.reasoning_move || null,
        title_ru: pattern.title_ru,
        formula: lang.formula,
        example: lang.example,
        translation: lang.translation,
        hits,
        example_match: exampleMatch,
        reasoning_match: reasoningMatch,
        evidence_type: evidenceType,
        score: Number(score.toFixed(3)),
        score_breakdown: {
          literal: Number(literalScore.toFixed(3)),
          reasoning: reasoningScore,
          reasoning_strength: reasoningMatch?.strength || null,
          combined_bonus: combinedBonus,
        },
        coverage: segments.length ? Number((hits.length / segments.length).toFixed(3)) : 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage || a.id.localeCompare(b.id))
    .slice(0, limit);
}
