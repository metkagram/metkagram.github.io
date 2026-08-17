import { intentById } from "./intents.mjs";

export const PUBLIC_LEARNING_MIN_CONFIDENCE = 0.9;
export const PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE = 2;

const rule = (id, language, match, move, intentId, patternId, confidence, scope, evidence, priority = 0) => ({
  id,
  language,
  match,
  move,
  intent_id: intentId,
  pattern_id: patternId,
  confidence,
  scope,
  evidence,
  priority
});

export const publicLearningRules = [
  rule("en-cause-led", "en", /\b(?:lead|leads|led|leading) to\b|\bresult(?:s|ed|ing)? in\b/iu, "Cause", "connect-cause-and-effect", "CLF059", 0.97, "frame_structure", "explicit causal result cue", 5),
  rule("en-cause-source", "en", /\b(?:because|because of|due to|caused by|results? from|resulted from)\b/iu, "Cause", "explain-a-cause", "CLF060", 0.96, "reasoning_move", "explicit causal source", 4),
  rule("en-cause-why", "en", /^\s*why\b/iu, "Cause", "explain-a-cause", "CLF060", 0.92, "intent_prompt", "why-question asks for a cause", 3),
  rule("en-infer-likely", "en", /\b(?:it (?:appears|seems) that|apparently|probably|most likely|likely)\b/iu, "Infer", "offer-a-likely-explanation", "CLF053", 0.93, "reasoning_move", "epistemic likelihood cue", 3),
  rule("en-infer-suggest", "en", /\bsuggest(?:s|ed|ing)? that\b/iu, "Infer", "draw-a-conclusion", "CLF051", 0.95, "frame_structure", "suggestion-to-inference cue", 4),
  rule("en-compare-compared", "en", /\bcompared (?:to|with)\b|\bcompare(?:d)? (?:them|the two|these|those)\b/iu, "Compare", "compare-alternatives", "CLF064", 0.96, "frame_structure", "explicit comparison cue", 4),
  rule("en-decide-tradeoff", "en", /\b(?:pros and cons|advantages? and disadvantages?|advantage.{0,100}disadvantage|disadvantage.{0,100}advantage)\b/iu, "Decide", "choose-between-options", "CLF047", 0.98, "frame_structure", "trade-off vocabulary", 6),
  rule("en-decide-options-criteria", "en", /\boptions?\b.{0,70}\bcriteria\b|\bcriteria\b.{0,70}\boptions?\b/iu, "Decide", "choose-between-options", "CLF046", 0.95, "reasoning_move", "options plus explicit criteria", 5),
  rule("en-decide-stated", "en", /\b(?:i|we|they|he|she) (?:have )?decided to\b|\b(?:i|we|they|he|she) decided\b/iu, "Decide", "state-a-decision", "CLF069", 0.94, "reasoning_move", "explicit completed decision", 5),
  rule("en-decide-prefer", "en", /\bprefer(?:s|red|ring)?\b.{0,100}\bto\b/iu, "Decide", "choose-between-options", "CLF049", 0.94, "reasoning_move", "explicit preference between alternatives", 4),
  rule("en-condition-only-if", "en", /\bonly if\b/iu, "Condition", "set-a-condition", "CLF044", 0.99, "frame_structure", "only-if condition", 8),
  rule("en-condition-without", "en", /\bwithout\b.{0,90}\b(?:cannot|can't|could not|couldn't)\b|\b(?:cannot|can't|could not|couldn't)\b.{0,90}\bwithout\b/iu, "Condition", "state-a-prerequisite", "CLF043", 0.99, "frame_structure", "without plus impossibility", 8),
  rule("en-condition-before-need", "en", /\b(?:need|must|require|requires|required)\b.{0,90}\bbefore\b|\bbefore\b.{0,90}\b(?:need|must|require|requires|required)\b/iu, "Condition", "state-a-prerequisite", "CLF045", 0.97, "frame_structure", "prerequisite before action", 7),
  rule("en-condition-if-start", "en", /^\s*if\b/iu, "Condition", "set-a-condition", "CLF044", 0.92, "reasoning_move", "initial if-clause", 3),
  rule("en-test-revision", "en", /\bif\b.{0,120}\b(?:may|might|would) need to (?:consider|reconsider|change|revise)\b/iu, "Test", "ask-what-would-change-the-conclusion", "CLF070", 0.98, "reasoning_move", "explicit revision condition", 7),
  rule("en-test-if-would", "en", /\bif\b.{0,110}\bwould\b|\bwould\b.{0,110}\bif\b/iu, "Test", "test-an-idea", "CLF056", 0.95, "frame_structure", "if plus hypothetical consequence", 6),
  rule("en-test-what-if", "en", /^\s*what if\b/iu, "Test", "test-an-idea", "CLF056", 0.91, "intent_prompt", "what-if scenario", 3),
  rule("en-test-monitor", "en", /\b(?:monitor|review|measure|check|track)\b.{0,80}\b(?:impact|effect|effects|result|results|improvement|progress|situation)\b|\b(?:impact|effect|results?|progress|situation)\b.{0,80}\b(?:monitor|review|measure|check|track)\b/iu, "Test", "test-an-idea", "CLF067", 0.92, "reasoning_move", "explicit evaluation action", 4),
  rule("en-reframe-notbut", "en", /\bnot\b.{0,100}\bbut\b/iu, "Reframe", "correct-an-assumption", "CLF061", 0.97, "frame_structure", "not-X-but-Y correction", 7),
  rule("en-reframe-focus-not", "en", /\bfocus on\b.{0,80},?\s*not\b/iu, "Reframe", "clarify-what-you-mean", "CLF062", 0.91, "reasoning_move", "contrastive focus", 3),
  rule("en-reframe-rather", "en", /\b(?:rather than|instead of)\b/iu, "Reframe", "clarify-what-you-mean", "CLF062", 0.94, "reasoning_move", "replacement cue", 4),
  rule("en-limit-not-enough", "en", /\bnot enough\b|\balone (?:is|are) not enough\b/iu, "Limit", "show-something-is-not-enough", "CLF042", 0.99, "frame_structure", "insufficiency cue", 8),
  rule("en-limit-need-more", "en", /\bneed more\b.{0,80}\b(?:data|evidence|information|support)\b/iu, "Limit", "show-something-is-not-enough", "CLF041", 0.9, "reasoning_move", "current evidence is insufficient", 3),
  rule("en-limit-qualify", "en", /^\s*yes,\s*but\s+not\b/iu, "Limit", "qualify-a-claim", "CLF065", 0.92, "reasoning_move", "explicit qualification", 4),
  rule("en-limit-may-but-not", "en", /\bmay\b.{0,90}\bbut\b.{0,60}\bnot\b/iu, "Limit", "qualify-a-claim", "CLF065", 0.96, "frame_structure", "qualified scope cue", 6),
  rule("en-challenge-assumption", "en", /\b(?:assumes?|assumption)\b/iu, "Challenge", "question-an-assumption", "CLF066", 0.97, "frame_structure", "assumption cue", 6),
  rule("en-challenge-polite", "en", /\b(?:i agree with your point|i see your point|i understand your point)\b.{0,80}\bbut\b|\bbut have we considered\b/iu, "Challenge", "disagree-politely", "CLF058", 0.95, "reasoning_move", "softened disagreement", 6),
  rule("en-challenge-ruleout", "en", /\b(?:cannot|can't) rule out\b/iu, "Challenge", "question-an-assumption", "CLF055", 0.99, "frame_structure", "rule-out cue", 8),
  rule("en-challenge-explain-gap", "en", /\bexplain(?:s|ed)?\b.{0,100}\bbut\b.{0,70}\b(?:doesn't explain|does not explain|not)\b/iu, "Challenge", "disagree-politely", "CLF058", 0.99, "frame_structure", "explanatory gap", 8),
  rule("en-compare-possibilities", "en", /\bone possibility\b.{0,130}\banother\b/iu, "Compare", "compare-alternatives", "CLF054", 0.99, "frame_structure", "paired possibilities", 8),

  rule("de-cause-fuehrt", "de", /\b(?:führt|führen|führte|führten) (?:oft )?zu\b/iu, "Cause", "connect-cause-and-effect", "CLF059", 0.98, "frame_structure", "führt zu", 7),
  rule("de-cause-source", "de", /\b(?:weil|aufgrund|wegen)\b/iu, "Cause", "explain-a-cause", "CLF060", 0.96, "reasoning_move", "explicit causal source", 5),
  rule("de-infer-likely", "de", /\b(?:wahrscheinlich|vermutlich|offenbar|es scheint)\b/iu, "Infer", "offer-a-likely-explanation", "CLF053", 0.93, "reasoning_move", "likelihood cue", 4),
  rule("de-compare", "de", /\b(?:im vergleich zu|im vergleich mit|verglichen mit|wohingegen)\b/iu, "Compare", "compare-alternatives", "CLF064", 0.98, "frame_structure", "comparison cue", 7),
  rule("de-compare-difference", "de", /\bunterschied zwischen\b/iu, "Compare", "show-a-difference", "CLF063", 0.97, "reasoning_move", "explicit difference between alternatives", 6),
  rule("de-condition-onlyif", "de", /\bnur wenn\b/iu, "Condition", "set-a-condition", "CLF044", 0.99, "frame_structure", "nur wenn", 8),
  rule("de-condition-without", "de", /\bohne\b.{0,100}\b(?:kann|könnte|würde)\b.{0,50}\bnicht\b|\b(?:kann|könnte|würde)\b.{0,80}\bnicht\b.{0,80}\bohne\b/iu, "Condition", "state-a-prerequisite", "CLF043", 0.99, "frame_structure", "ohne plus impossibility", 8),
  rule("de-condition-before", "de", /\bbevor\b.{0,100}\b(?:muss|müssen|braucht|brauchen)\b|\b(?:muss|müssen|braucht|brauchen)\b.{0,100}\bbevor\b/iu, "Condition", "state-a-prerequisite", "CLF045", 0.97, "frame_structure", "prerequisite cue", 7),
  rule("de-condition-unless", "de", /\bes sei denn\b/iu, "Condition", "set-a-condition", "CLF044", 0.98, "reasoning_move", "exception condition", 7),
  rule("de-condition-wenn-start", "de", /^\s*wenn\b/iu, "Condition", "set-a-condition", "CLF044", 0.92, "reasoning_move", "initial wenn-clause", 3),
  rule("de-test-wenn-wuerde", "de", /\bwenn\b.{0,130}\b(?:würde|würden|würdest|würdet)\b/iu, "Test", "test-an-idea", "CLF056", 0.96, "frame_structure", "wenn plus würde hypothetical", 6),
  rule("de-test-pruefen", "de", /\b(?:prüfen|testen|überprüfen)\b.{0,70}\bob\b/iu, "Test", "test-an-idea", "CLF067", 0.96, "frame_structure", "test whether", 7),
  rule("de-test-revise", "de", /\bneu bewerten\b.{0,90}\bwenn\b|\bwenn\b.{0,90}\bneu bewerten\b/iu, "Test", "ask-what-would-change-the-conclusion", "CLF070", 0.99, "frame_structure", "revision condition", 8),
  rule("de-reframe-notbut", "de", /\bnicht\b.{0,110}\bsondern\b/iu, "Reframe", "correct-an-assumption", "CLF061", 0.99, "frame_structure", "nicht ... sondern", 8),
  rule("de-reframe-instead", "de", /\b(?:statt|anstatt)\b/iu, "Reframe", "clarify-what-you-mean", "CLF062", 0.94, "reasoning_move", "replacement cue", 4),
  rule("de-limit-not-enough", "de", /\b(?:nicht genug|nicht ausreichend|allein reicht nicht)\b/iu, "Limit", "show-something-is-not-enough", "CLF042", 0.99, "frame_structure", "insufficiency cue", 8),
  rule("de-limit-qualify", "de", /\bmag\b.{0,100}\baber\b.{0,70}\bnicht\b/iu, "Limit", "qualify-a-claim", "CLF065", 0.98, "frame_structure", "qualified scope", 7),
  rule("de-challenge-assumption", "de", /\b(?:setzt voraus|annahme|nimmt an)\b/iu, "Challenge", "question-an-assumption", "CLF066", 0.98, "frame_structure", "assumption cue", 7),
  rule("de-challenge-polite", "de", /\bich verstehe deinen punkt, aber\b/iu, "Challenge", "disagree-politely", "CLF058", 0.96, "reasoning_move", "softened disagreement", 7),
  rule("de-challenge-ruleout", "de", /\bnicht ausschlie(?:ßen|sst|ßt)\b|\bausschließen\b/iu, "Challenge", "question-an-assumption", "CLF055", 0.98, "frame_structure", "rule-out cue", 7),
  rule("de-challenge-explain-gap", "de", /\berklär\w*\b.{0,100}\baber\b.{0,50}\bnicht\b/iu, "Challenge", "disagree-politely", "CLF058", 0.99, "frame_structure", "explanatory gap", 8),
  rule("de-compare-possibilities", "de", /\beine möglichkeit\b.{0,130}\b(?:eine andere|andere)\b/iu, "Compare", "compare-alternatives", "CLF054", 0.99, "frame_structure", "paired possibilities", 8),
  rule("de-decide-tradeoff", "de", /\b(?:vorteil\w*.{0,120}nachteil\w*|nachteil\w*.{0,120}vorteil\w*)\b/iu, "Decide", "choose-between-options", "CLF047", 0.98, "frame_structure", "trade-off vocabulary", 7),
  rule("de-decide-between", "de", /\bzwischen\b.{0,70}\bund\b.{0,70}\bentscheiden\b|\bentscheiden\b.{0,70}\bzwischen\b/iu, "Decide", "choose-between-options", "CLF049", 0.97, "reasoning_move", "explicit choice between alternatives", 6),
  rule("de-decide-balance", "de", /\bzwischen\b.{0,70}\bund\b.{0,70}\bausgleichen\b/iu, "Decide", "choose-between-options", "CLF046", 0.92, "reasoning_move", "balancing alternatives", 3),
  rule("de-decide-stated", "de", /\b(?:ich|wir|sie|er) (?:haben|hat)? ?(?:beschlossen|entschieden)\b|\b(?:beschlossen|entschieden),?\b/iu, "Decide", "state-a-decision", "CLF069", 0.92, "reasoning_move", "explicit decision", 5)
];

const genericConditionRuleIds = new Set(["en-condition-if-start", "de-condition-wenn-start"]);

export function validatePublicLearningRules(publicPatternIds) {
  const ids = publicPatternIds instanceof Set ? publicPatternIds : new Set(publicPatternIds || []);
  for (const item of publicLearningRules) {
    const intent = intentById.get(item.intent_id);
    if (!intent) throw new Error(`Unknown public-learning intent ${item.intent_id} in ${item.id}`);
    if (intent.move !== item.move) throw new Error(`Move mismatch for ${item.id}: ${item.move} vs ${intent.move}`);
    if (!intent.pattern_priority.includes(item.pattern_id)) {
      throw new Error(`Pattern ${item.pattern_id} is not a calibrated frame for ${item.intent_id}`);
    }
    if (ids.size && !ids.has(item.pattern_id)) throw new Error(`Public-learning rule ${item.id} points outside the public pattern release: ${item.pattern_id}`);
    if (item.confidence < PUBLIC_LEARNING_MIN_CONFIDENCE || item.confidence > 1) {
      throw new Error(`Invalid confidence for ${item.id}: ${item.confidence}`);
    }
  }
}

export function classifyReasoningSentence(text, language, { maxLinks = PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE, minConfidence = PUBLIC_LEARNING_MIN_CONFIDENCE } = {}) {
  const source = String(text || "");
  let matches = publicLearningRules
    .filter((item) => item.language === language && item.confidence >= minConfidence && item.match.test(source))
    .sort((a, b) => b.confidence - a.confidence || b.priority - a.priority || a.id.localeCompare(b.id));

  const hasStrongTest = matches.some((item) => item.move === "Test" && item.confidence >= 0.95);
  if (hasStrongTest) matches = matches.filter((item) => !genericConditionRuleIds.has(item.id));

  const selected = [];
  for (const item of matches) {
    if (selected.some((current) => current.reasoning_move === item.move)) continue;
    selected.push({
      rule_id: item.id,
      reasoning_move: item.move,
      intent_id: item.intent_id,
      pattern_id: item.pattern_id,
      confidence: item.confidence,
      scope: item.scope,
      evidence: item.evidence
    });
    if (selected.length >= maxLinks) break;
  }
  return selected;
}
