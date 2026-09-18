// Conservative agreement cues, not a parser or a proof of grammaticality.
// Ambiguous relative "that" does not establish a singular antecedent.
function normalize(text) {
  return String(text ?? '').replaceAll('**', '').normalize('NFKC')
    .replaceAll(/[‘’]/g, "'").replaceAll(/\s+/g, ' ').trim();
}

const BASE_LICENSER = /\b(?:do|does|did|can|could|will|would|shall|should|may|might|must|don't|doesn't|didn't|can't|couldn't|won't|wouldn't|shan't|shouldn't|mightn't|mustn't)(?:\s+not)?\s*$/iu;
const IRREALIS = /\b(?:if|as\s+though|wish|wished|wishes|rather)\s*$/iu;

export function detectEnglishAgreement(text) {
  const normalized = normalize(text);
  const issues = [];
  const rules = [
    { regex: /\b(?:he|she|it|this|that)\s+(?:do|have|are|were)\b/giu, label: 'singular subject with plural/base auxiliary' },
    { regex: /\b(?:they|we)\s+(?:is|has|does|was)\b/giu, label: 'plural subject with singular auxiliary' },
    { regex: /\bi\s+(?:is|has|does|are)\b/giu, label: 'first-person subject with incompatible auxiliary' },
    { regex: /\b(?:do|does|did|can|could|will|would|shall|should|may|might|must)\s+(?:he|she|it|they|we|i|you)\s+(?:has|does|is|are|was|were|had|did)\b/giu, label: 'inverted auxiliary requires a bare infinitive, not a finite verb' },
  ];
  for (const rule of rules) {
    const match = [...normalized.matchAll(rule.regex)].find(candidate => {
      const prefix = normalized.slice(0, candidate.index);
      const [subject, verb] = candidate[0].toLowerCase().split(/\s+/u);
      // That at a sentence boundary is demonstrative; inside a clause it may
      // instead be relative/complementizer. Abstain without a known antecedent.
      if (subject === 'that' && prefix.trim() && !/[.!?;:]\s*$/u.test(prefix)) return false;
      if ((verb === 'do' || verb === 'have') && BASE_LICENSER.test(prefix)) return false;
      if (verb === 'were' && IRREALIS.test(prefix)) return false;
      return true;
    });
    if (match) issues.push({type:'en_subject_verb_agreement',severity:'high',confidence:'high',evidence:match[0],note:rule.label});
  }
  return issues;
}
