import { intentById } from "./intents.mjs";

export const PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE = 2;
export const PUBLIC_LEARNING_STRENGTHS = Object.freeze(["direct", "supported", "prompt"]);
export const PUBLIC_LEARNING_STRENGTH_RANK = Object.freeze({
  direct: 3,
  supported: 2,
  prompt: 1
});

const strengthScope = Object.freeze({
  direct: "frame_structure",
  supported: "reasoning_move",
  prompt: "intent_prompt"
});

const rule = (id, language, match, move, intentId, patternId, strength, evidence, priority = 0) => ({
  id,
  language,
  match,
  move,
  intent_id: intentId,
  pattern_id: patternId,
  strength,
  scope: strengthScope[strength],
  evidence,
  priority
});

export const publicLearningRules = [
  rule("en-cause-led", "en", /\b(?:lead|leads|led|leading) to\b|\bresult(?:s|ed|ing)? in\b/iu, "Cause", "connect-cause-and-effect", "CLF059", "direct", "explicit causal result cue", 8),
  rule("en-cause-source", "en", /\b(?:because(?: of)?|due to|caused by|results? from|resulted from)\b/iu, "Cause", "explain-a-cause", "CLF060", "supported", "explicit causal source", 7),
  rule("en-cause-why", "en", /^\s*why\b/iu, "Cause", "explain-a-cause", "CLF060", "prompt", "why-question asks for a cause", 5),
  rule("en-infer-likely", "en", /\b(?:it (?:appears|seems) that|it is likely that|apparently|probably|most likely)\b|\blikely to\b/iu, "Infer", "offer-a-likely-explanation", "CLF053", "supported", "epistemic likelihood cue", 6),
  rule("en-infer-suggest", "en", /\bsuggest(?:s|ed|ing)? that\b/iu, "Infer", "draw-a-conclusion", "CLF051", "direct", "suggestion-to-inference cue", 8),
  rule("en-compare-compared", "en", /\bcompared (?:to|with)\b|\bcompare(?:d)? (?:them|the two|these|those)\b/iu, "Compare", "compare-alternatives", "CLF064", "direct", "explicit comparison cue", 8),
  rule("en-decide-tradeoff", "en", /\b(?:pros and cons|advantages? and disadvantages?|advantage.{0,100}disadvantage|disadvantage.{0,100}advantage)\b/iu, "Decide", "choose-between-options", "CLF047", "direct", "trade-off vocabulary", 9),
  rule("en-decide-options-criteria", "en", /\boptions?\b.{0,70}\bcriteria\b|\bcriteria\b.{0,70}\boptions?\b/iu, "Decide", "choose-between-options", "CLF046", "supported", "options plus explicit criteria", 8),
  rule("en-decide-stated", "en", /\b(?:i|we|they|he|she) (?:have )?decided to\b|\b(?:i|we|they|he|she) decided\b/iu, "Decide", "state-a-decision", "CLF069", "supported", "explicit completed decision", 8),
  rule("en-condition-only-if", "en", /\bonly if\b/iu, "Condition", "set-a-condition", "CLF044", "direct", "only-if condition", 10),
  rule("en-condition-without", "en", /\bwithout\b.{0,90}\b(?:cannot|can't|could not|couldn't)\b|\b(?:cannot|can't|could not|couldn't)\b.{0,90}\bwithout\b/iu, "Condition", "state-a-prerequisite", "CLF043", "direct", "without plus impossibility", 10),
  rule("en-condition-before-need", "en", /\b(?:need|must|require|requires|required)\b.{0,90}\bbefore\b|\bbefore\b.{0,90}\b(?:need|must|require|requires|required)\b/iu, "Condition", "state-a-prerequisite", "CLF045", "direct", "prerequisite before action", 9),
  rule("en-test-revision", "en", /\bif\b.{0,120}\b(?:may|might|would) need to (?:consider|reconsider|change|revise)\b/iu, "Test", "ask-what-would-change-the-conclusion", "CLF070", "supported", "explicit revision condition", 10),
  rule("en-test-if-expect", "en", /\bif\b.{0,90}\b(?:were|was) true\b.{0,90}\bwould (?:expect|see|observe)\b|\bif\b.{0,90}\bwould (?:expect|see|observe)\b/iu, "Test", "test-an-idea", "CLF056", "direct", "hypothesis plus expected observation", 10),
  rule("en-test-monitor", "en", /\b(?:monitor|review|measure|check|track)\b.{0,80}\b(?:impact|effect|effects|result|results|improvement|progress|situation)\b|\b(?:impact|effect|results?|progress|situation)\b.{0,80}\b(?:monitor|review|measure|check|track)\b/iu, "Test", "test-an-idea", "CLF067", "supported", "explicit evaluation action", 7),
  rule("en-reframe-notbut", "en", /\b(?:it's|it is|that is|the point is) not\b.{0,100}\bbut\b|\bnot because\b.{0,100}\bbut because\b/iu, "Reframe", "correct-an-assumption", "CLF061", "direct", "explicit correction cue", 9),
  rule("en-reframe-focus-not", "en", /\bfocus on\b.{0,80},?\s*not\b/iu, "Reframe", "clarify-what-you-mean", "CLF062", "supported", "contrastive focus", 5),
  rule("en-reframe-rather", "en", /\b(?:rather than|instead of)\b/iu, "Reframe", "clarify-what-you-mean", "CLF062", "supported", "replacement cue", 6),
  rule("en-limit-not-enough", "en", /\bnot enough\b|\balone (?:is|are) not enough\b/iu, "Limit", "show-something-is-not-enough", "CLF042", "direct", "insufficiency cue", 10),
  rule("en-limit-need-more", "en", /\bneed more\b.{0,80}\b(?:data|evidence|information|support)\b/iu, "Limit", "show-something-is-not-enough", "CLF041", "supported", "current evidence is insufficient", 6),
  rule("en-limit-qualify", "en", /^\s*yes,\s*but\s+not\b/iu, "Limit", "qualify-a-claim", "CLF065", "supported", "explicit qualification", 6),
  rule("en-limit-may-but-not", "en", /\bmay\b.{0,90}\bbut\b.{0,60}\bnot\b/iu, "Limit", "qualify-a-claim", "CLF065", "direct", "qualified scope cue", 9),
  rule("en-challenge-assumption", "en", /\b(?:assumes?|assumption)\b.{0,100}\b(?:may not|might not|not necessarily|question|challenge|hold)\b|\b(?:may not|might not|not necessarily)\b.{0,100}\b(?:assumes?|assumption)\b/iu, "Challenge", "question-an-assumption", "CLF066", "supported", "assumption plus challenge cue", 8),
  rule("en-challenge-polite", "en", /\b(?:i agree with your point|i see your point|i understand your point)\b.{0,80}\bbut\b|\bbut have we considered\b/iu, "Challenge", "disagree-politely", "CLF058", "supported", "softened disagreement", 8),
  rule("en-challenge-ruleout", "en", /\b(?:cannot|can't) rule out\b/iu, "Challenge", "question-an-assumption", "CLF055", "direct", "rule-out cue", 10),
  rule("en-challenge-explain-gap", "en", /\bexplain(?:s|ed)?\b.{0,100}\bbut\b.{0,70}\b(?:doesn't explain|does not explain)\b/iu, "Challenge", "disagree-politely", "CLF058", "direct", "explanatory gap", 10),
  rule("en-compare-possibilities", "en", /\bone possibility\b.{0,130}\banother\b/iu, "Compare", "compare-alternatives", "CLF054", "direct", "paired possibilities", 10),

  rule("de-cause-fuehrt", "de", /\b(?:führt|führen|führte|führten) (?:oft )?zu\b/iu, "Cause", "connect-cause-and-effect", "CLF059", "direct", "führt zu", 10),
  rule("de-cause-source", "de", /\b(?:weil|aufgrund|wegen)\b/iu, "Cause", "explain-a-cause", "CLF060", "supported", "explicit causal source", 8),
  rule("de-infer-likely", "de", /\b(?:wahrscheinlich|vermutlich|offenbar|es scheint)\b/iu, "Infer", "offer-a-likely-explanation", "CLF053", "supported", "likelihood cue", 6),
  rule("de-compare", "de", /\b(?:im vergleich zu|im vergleich mit|verglichen mit|wohingegen)\b/iu, "Compare", "compare-alternatives", "CLF064", "direct", "comparison cue", 10),
  rule("de-compare-difference", "de", /\bunterschied zwischen\b/iu, "Compare", "show-a-difference", "CLF063", "supported", "explicit difference between alternatives", 8),
  rule("de-condition-onlyif", "de", /\bnur wenn\b/iu, "Condition", "set-a-condition", "CLF044", "direct", "nur wenn", 10),
  rule("de-condition-without", "de", /\bohne\b.{0,100}\b(?:kann|könnte|würde)\b.{0,50}\bnicht\b|\b(?:kann|könnte|würde)\b.{0,80}\bnicht\b.{0,80}\bohne\b/iu, "Condition", "state-a-prerequisite", "CLF043", "direct", "ohne plus impossibility", 10),
  rule("de-condition-before", "de", /\bbevor\b.{0,100}\b(?:muss|müssen|braucht|brauchen)\b|\b(?:muss|müssen|braucht|brauchen)\b.{0,100}\bbevor\b/iu, "Condition", "state-a-prerequisite", "CLF045", "direct", "prerequisite cue", 9),
  rule("de-condition-unless", "de", /\bes sei denn\b/iu, "Condition", "set-a-condition", "CLF044", "supported", "exception condition", 8),
  rule("de-test-expect", "de", /\bwenn\b.{0,100}\b(?:zuträfe|stimmen würde|wahr wäre)\b.{0,100}\b(?:erwarten|würden wir erwarten)\b/iu, "Test", "test-an-idea", "CLF056", "direct", "hypothesis plus expected observation", 10),
  rule("de-test-pruefen", "de", /\b(?:prüfen|testen|überprüfen)\b.{0,70}\bob\b/iu, "Test", "test-an-idea", "CLF067", "direct", "test whether", 10),
  rule("de-test-revise", "de", /\bneu bewerten\b.{0,90}\bwenn\b|\bwenn\b.{0,90}\bneu bewerten\b/iu, "Test", "ask-what-would-change-the-conclusion", "CLF070", "direct", "revision condition", 10),
  rule("de-reframe-notbut", "de", /\bnicht\b.{0,110}\bsondern\b/iu, "Reframe", "correct-an-assumption", "CLF061", "direct", "nicht ... sondern", 10),
  rule("de-reframe-instead", "de", /\b(?:statt|anstatt)\b/iu, "Reframe", "clarify-what-you-mean", "CLF062", "supported", "replacement cue", 6),
  rule("de-limit-not-enough", "de", /\b(?:nicht genug|nicht ausreichend|allein reicht nicht)\b/iu, "Limit", "show-something-is-not-enough", "CLF042", "direct", "insufficiency cue", 10),
  rule("de-limit-qualify", "de", /\bmag\b.{0,100}\baber\b.{0,70}\bnicht\b/iu, "Limit", "qualify-a-claim", "CLF065", "direct", "qualified scope", 10),
  rule("de-challenge-assumption", "de", /\b(?:setzt voraus|nimmt an)\b.{0,100}\b(?:möglicherweise nicht|vielleicht nicht|nicht unbedingt|fraglich|zweifel|aber)\b|\b(?:möglicherweise nicht|vielleicht nicht|nicht unbedingt|fraglich|zweifel)\b.{0,100}\b(?:setzt voraus|nimmt an)\b/iu, "Challenge", "question-an-assumption", "CLF066", "supported", "assumption plus challenge cue", 8),
  rule("de-challenge-polite", "de", /\bich verstehe deinen punkt, aber\b/iu, "Challenge", "disagree-politely", "CLF058", "supported", "softened disagreement", 8),
  rule("de-challenge-ruleout", "de", /\bnicht ausschlie(?:ßen|sst|ßt)\b/iu, "Challenge", "question-an-assumption", "CLF055", "direct", "rule-out cue", 10),
  rule("de-challenge-explain-gap", "de", /\berklär\w*\b.{0,100}\baber\b.{0,50}\bnicht\b/iu, "Challenge", "disagree-politely", "CLF058", "direct", "explanatory gap", 10),
  rule("de-compare-possibilities", "de", /\beine möglichkeit\b.{0,130}\b(?:eine andere|andere)\b/iu, "Compare", "compare-alternatives", "CLF054", "direct", "paired possibilities", 10),
  rule("de-decide-tradeoff", "de", /\b(?:vorteil\w*.{0,120}nachteil\w*|nachteil\w*.{0,120}vorteil\w*)\b/iu, "Decide", "choose-between-options", "CLF047", "direct", "trade-off vocabulary", 10),
  rule("de-decide-between", "de", /\bzwischen\b.{0,70}\bund\b.{0,70}\bentscheiden\b|\bentscheiden\b.{0,70}\bzwischen\b/iu, "Decide", "choose-between-options", "CLF049", "supported", "explicit choice between alternatives", 8),
  rule("de-decide-balance", "de", /\bzwischen\b.{0,70}\bund\b.{0,70}\bausgleichen\b/iu, "Decide", "choose-between-options", "CLF046", "supported", "balancing alternatives", 5),
  rule("de-decide-stated", "de", /\b(?:ich|wir|sie|er) (?:haben|hat)? ?(?:beschlossen|entschieden)\b/iu, "Decide", "state-a-decision", "CLF069", "supported", "explicit completed decision", 8)
];

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
    if (!PUBLIC_LEARNING_STRENGTHS.includes(item.strength)) throw new Error(`Unknown relation strength for ${item.id}: ${item.strength}`);
    if (item.scope !== strengthScope[item.strength]) throw new Error(`Strength/scope mismatch for ${item.id}`);
  }
}

export function classifyReasoningSentence(text, language, { maxLinks = PUBLIC_LEARNING_MAX_LINKS_PER_SENTENCE } = {}) {
  const source = String(text || "");
  const matches = publicLearningRules
    .filter((item) => item.language === language && item.match.test(source))
    .sort((a, b) =>
      PUBLIC_LEARNING_STRENGTH_RANK[b.strength] - PUBLIC_LEARNING_STRENGTH_RANK[a.strength]
      || b.priority - a.priority
      || a.id.localeCompare(b.id)
    );

  const selected = [];
  for (const item of matches) {
    if (selected.some((current) => current.reasoning_move === item.move)) continue;
    selected.push({
      rule_id: item.id,
      reasoning_move: item.move,
      intent_id: item.intent_id,
      pattern_id: item.pattern_id,
      strength: item.strength,
      scope: item.scope,
      evidence: item.evidence
    });
    if (selected.length >= maxLinks) break;
  }
  return selected;
}
