import { PUBLIC_LEARNING_STRENGTH_RANK } from "./public-learning.mjs";

const extraRule = (id, language, match, move, intentId, patternId, strength, evidence, priority = 0) => ({
  id,
  language,
  match,
  move,
  intent_id: intentId,
  pattern_id: patternId,
  strength,
  scope: "pattern_lens_generalisation",
  evidence,
  priority,
});

export const patternLensExtraRules = [
  extraRule("lens-en-challenge-polite-see", "en", /\bi see your point\b.{0,90}\bbut\b/iu, "Challenge", "disagree-politely", "CLF058", "supported", "softened disagreement paraphrase", 6),
  extraRule("lens-en-compare-difference", "en", /\b(?:the )?difference between\b/iu, "Compare", "show-a-difference", "CLF063", "supported", "explicit difference between alternatives", 7),
  extraRule("lens-en-decide-chose", "en", /\b(?:i|we|they|he|she) chose to\b/iu, "Decide", "state-a-decision", "CLF069", "supported", "completed choice paraphrase", 6),
  extraRule("lens-en-limit-lack-evidence", "en", /\black(?:s|ed|ing)? enough\b.{0,50}\b(?:data|evidence|information|support)\b/iu, "Limit", "show-something-is-not-enough", "CLF041", "supported", "insufficient evidence paraphrase", 6),
  extraRule("lens-de-infer-looks", "de", /\bes sieht so aus, als ob\b/iu, "Infer", "offer-a-likely-explanation", "CLF053", "supported", "appearance-to-inference paraphrase", 6),
  extraRule("lens-en-reframe-isnt-its", "en", /\bisn['’]?t\b.{0,120}[;,.]\s*(?:it is|it['’]?s)\b/iu, "Reframe", "correct-an-assumption", "CLF061", "direct", "X-is-not / Y-is correction frame", 7),
  extraRule("lens-de-reframe-istnicht-esist", "de", /\bist nicht\b.{0,120}[;,.]\s*es ist\b/iu, "Reframe", "correct-an-assumption", "CLF061", "direct", "nicht-X / es-ist-Y correction frame", 7),
  extraRule("lens-de-condition-ohne-koennen", "de", /\bohne\b.{0,100}\b(?:kann|können|könnte|könnten|würde|würden)\b.{0,60}\bnicht\b/iu, "Condition", "state-a-prerequisite", "CLF043", "direct", "ohne plus impossibility", 7),
  extraRule("lens-en-test-conditional-question", "en", /^\s*if\b.{0,120},\s*would\b.{0,100}\?\s*$/iu, "Test", "test-an-idea", "CLF056", "supported", "conditional stress-test question", 8)
];

export function classifyPatternLensExtraRules(text, language) {
  const source = String(text || "");
  return patternLensExtraRules
    .filter((item) => item.language === language && item.match.test(source))
    .sort((a, b) =>
      PUBLIC_LEARNING_STRENGTH_RANK[b.strength] - PUBLIC_LEARNING_STRENGTH_RANK[a.strength]
      || b.priority - a.priority
      || a.id.localeCompare(b.id)
    )
    .map((item) => ({
      rule_id: item.id,
      reasoning_move: item.move,
      intent_id: item.intent_id,
      pattern_id: item.pattern_id,
      strength: item.strength,
      scope: item.scope,
      evidence: item.evidence,
      priority: item.priority,
    }));
}
