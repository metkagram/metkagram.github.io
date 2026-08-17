import { intentTaxonomy, intentSearchText } from "./intents.mjs";
import { getDatasetVersion } from "./provenance.mjs";
import { SITE_URL } from "./site.mjs";

const STOP = new Set("a an and are as at be between by can for from how i in into is it of on or that the this to what when where which who why with you your we our us they their them мы я и или как что где когда для из по на в с это".split(" "));

export function tokens(value = "") {
  return String(value)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .match(/[\p{L}]+/gu)
    ?.filter((token) => token.length > 2 && !STOP.has(token)) || [];
}

function tokenMatches(left, right) {
  if (left === right) return true;
  return left.length >= 6 && right.length >= 6 && left.slice(0, 6) === right.slice(0, 6);
}

function queryLocale(value = "") {
  return /[а-яё]/iu.test(String(value)) ? "ru" : "en";
}

function intentPhrases(intent, locale) {
  return [
    intent[`title_${locale}`],
    ...(intent[`queries_${locale}`] || []),
    ...(intent[`signals_${locale}`] || [])
  ].filter(Boolean);
}

function matchedPhraseWeight(phrase) {
  const meaningfulTokens = tokens(phrase).length;
  return 4 + Math.min(6, meaningfulTokens * 2);
}

export function scoreIntentForQuery(query, intent) {
  const normalized = String(query).normalize("NFKC").toLocaleLowerCase();
  if (!normalized.trim()) return 0;
  const locale = queryLocale(normalized);
  const phrases = intentPhrases(intent, locale);
  const queryTokens = [...new Set(tokens(normalized))];
  const signalTokens = [...new Set(tokens(phrases.join(" ")))];
  const descriptionTokens = [...new Set(tokens(intent[`description_${locale}`] || ""))];

  const phraseScore = phrases.reduce((score, phrase) => {
    const normalizedPhrase = String(phrase).normalize("NFKC").toLocaleLowerCase().trim();
    return score + (normalizedPhrase.length >= 5 && normalized.includes(normalizedPhrase) ? matchedPhraseWeight(normalizedPhrase) : 0);
  }, 0);
  const signalScore = queryTokens.reduce(
    (score, token) => score + (signalTokens.some((candidate) => tokenMatches(token, candidate)) ? 2.5 : 0),
    0
  );
  const descriptionScore = queryTokens.reduce(
    (score, token) => score + (descriptionTokens.some((candidate) => tokenMatches(token, candidate)) ? 0.75 : 0),
    0
  );
  return Number((phraseScore + signalScore + descriptionScore).toFixed(2));
}

export function rankIntentsForQuery(query, limit = 5) {
  if (!String(query).trim()) return [];
  return intentTaxonomy
    .map((intent) => ({ intent, score: scoreIntentForQuery(query, intent) }))
    .sort((a, b) => b.score - a.score || a.intent.id.localeCompare(b.intent.id))
    .slice(0, limit);
}

function patternSearchText(pattern) {
  const reasoning = pattern.reasoning || {};
  return [
    pattern.id,
    pattern.title_ru,
    pattern.logic,
    reasoning.move,
    reasoning.what_it_does_en,
    reasoning.what_it_does_ru,
    reasoning.when_to_use_en,
    reasoning.when_to_use_ru,
    reasoning.common_mistake_en,
    reasoning.common_mistake_ru,
    ...(pattern.langs || []).flatMap((lang) => [lang.formula, lang.example, ...(lang.examples || []).map((item) => item.text)])
  ].filter(Boolean).join(" ").toLocaleLowerCase();
}

export function patternsForIntent(intent, patterns, limit = 4) {
  const candidates = patterns.filter((pattern) => pattern.reasoning?.move === intent.move);
  const intentTokens = [...new Set(tokens(intentSearchText(intent)))];
  const phrases = [...(intent.queries_en || []), ...(intent.queries_ru || []), ...(intent.signals_en || []), ...(intent.signals_ru || [])]
    .map((query) => query.toLocaleLowerCase())
    .filter((query) => query.includes(" "));
  const priority = new Map((intent.pattern_priority || []).map((id, index) => [id, index]));

  return candidates
    .map((pattern) => {
      const haystack = patternSearchText(pattern);
      const tokenScore = intentTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
      const phraseScore = phrases.reduce((score, phrase) => score + (haystack.includes(phrase) ? 3 : 0), 0);
      const reviewedBonus = pattern.quality?.status === "curated" ? 0.25 : 0;
      return {
        pattern,
        score: tokenScore + phraseScore + reviewedBonus,
        editorialPriority: priority.has(pattern.id) ? priority.get(pattern.id) : Number.POSITIVE_INFINITY
      };
    })
    .sort((a, b) => a.editorialPriority - b.editorialPriority || b.score - a.score || a.pattern.id.localeCompare(b.pattern.id))
    .slice(0, limit)
    .map(({ pattern, score, editorialPriority }) => ({
      pattern,
      score: Number(score.toFixed(2)),
      editorial_priority: Number.isFinite(editorialPriority) ? editorialPriority + 1 : null
    }));
}

export function buildIntentDataset(content) {
  const items = intentTaxonomy.map((intent) => {
    const ranked = patternsForIntent(intent, content.advancedPatterns, 6);
    return {
      id: intent.id,
      reasoning_move: intent.move,
      title_en: intent.title_en,
      title_ru: intent.title_ru,
      description_en: intent.description_en,
      description_ru: intent.description_ru,
      queries_en: intent.queries_en,
      queries_ru: intent.queries_ru,
      signals_en: intent.signals_en || [],
      signals_ru: intent.signals_ru || [],
      pattern_priority: intent.pattern_priority || [],
      pattern_ids: ranked.map((item) => item.pattern.id),
      routes: {
        en: `${SITE_URL}/en/practice/intents/#intent-${intent.id}`,
        ru: `${SITE_URL}/ru/practice/intents/#intent-${intent.id}`
      }
    };
  });

  return {
    schemaVersion: 2,
    version: getDatasetVersion(),
    purpose: "Human communicative intents mapped to Metkagram reasoning moves and reusable English/German sentence frames.",
    resolver: {
      type: "deterministic_editorial",
      runtime_ai_required: false,
      intent_ranking: "length-weighted phrase + token + description overlap with conservative prefix matching",
      pattern_ranking: "editorial priority first, lexical content score second"
    },
    intentCount: items.length,
    reasoningMoveCount: new Set(items.map((item) => item.reasoning_move)).size,
    items
  };
}
