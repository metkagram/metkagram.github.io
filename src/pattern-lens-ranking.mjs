import { classifyReasoningSentence } from "./public-learning.mjs";

const REASONING_SCORE = Object.freeze({ direct: 18, supported: 16, prompt: 14 });

export function normalizeLensText(value = "") {
  return String(value)
    .replaceAll("**", "")
    .replace(/[’‘]/g, "'")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
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
    .filter((part) => part.length >= 2 && /[\p{L}\p{N}]/u.test(part));
}

function languageRecord(pattern, language) {
  return pattern.langs?.find((item) => item.lang === language) || null;
}

export function rankLensPatterns(patterns, text, language = "en", limit = 6) {
  const normalizedText = normalizeLensText(text);
  if (!normalizedText) return [];
  const reasoningLinks = classifyReasoningSentence(text, language, { maxLinks: 3 });
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
        example_match: exampleMatch || null,
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
