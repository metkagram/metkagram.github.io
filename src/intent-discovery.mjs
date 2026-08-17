import { intentTaxonomy, intentSearchText } from "./intents.mjs";
import { getDatasetVersion } from "./provenance.mjs";
import { SITE_URL } from "./site.mjs";

const STOP = new Set("a an and are as at be between by can for from how i in into is it of on or that the this to what when where which who why with you your мы я и или как что где когда для из по на в с это это".split(" "));

function tokens(value = "") {
  return String(value)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .match(/[\p{L}]+/gu)
    ?.filter((token) => token.length > 2 && !STOP.has(token)) || [];
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
  const phrases = [...(intent.queries_en || []), ...(intent.queries_ru || [])]
    .map((query) => query.toLocaleLowerCase())
    .filter((query) => query.includes(" "));

  return candidates
    .map((pattern) => {
      const haystack = patternSearchText(pattern);
      const tokenScore = intentTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
      const phraseScore = phrases.reduce((score, phrase) => score + (haystack.includes(phrase) ? 3 : 0), 0);
      const reviewedBonus = pattern.quality?.status === "curated" ? 0.25 : 0;
      return { pattern, score: tokenScore + phraseScore + reviewedBonus };
    })
    .sort((a, b) => b.score - a.score || a.pattern.id.localeCompare(b.pattern.id))
    .slice(0, limit)
    .map(({ pattern, score }) => ({ pattern, score: Number(score.toFixed(2)) }));
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
      pattern_ids: ranked.map((item) => item.pattern.id),
      routes: {
        en: `${SITE_URL}/en/practice/intents/#intent-${intent.id}`,
        ru: `${SITE_URL}/ru/practice/intents/#intent-${intent.id}`
      }
    };
  });

  return {
    schemaVersion: 1,
    version: getDatasetVersion(),
    purpose: "Human communicative intents mapped to Metkagram reasoning moves and reusable English/German sentence frames.",
    intentCount: items.length,
    reasoningMoveCount: new Set(items.map((item) => item.reasoning_move)).size,
    items
  };
}
