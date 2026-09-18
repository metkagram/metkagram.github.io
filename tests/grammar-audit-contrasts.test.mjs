import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFrameQualityAudit } from '../src/frame-quality-audit.mjs';

function audit(entries) {
  return buildFrameQualityAudit({
    studySets: { sets: [{ id: 'TST' }] },
    advancedPatterns: entries.map((entry, index) => ({
      id: `TST${index + 1}`, set_id: 'TST',
      langs: [{ lang: 'en', formula: entry.formula || 'Subject + predicate',
        example: entry.text, translation: 'Русский перевод для проверки.', examples: [] }]
    }))
  });
}

const agreementIssues = text => audit([{ text }]).linguisticIssues.filter(item => item.type === 'en_subject_verb_agreement');

test('few and a few remain different grammatical frames, not duplicate pages', () => {
  const result = audit([
    { formula: 'Few + plural count noun + predicate, so + consequence', text: 'Few people noticed the change, so we explained it again.' },
    { formula: 'A few + plural count noun + predicate, so + consequence', text: 'A few people volunteered, so we were able to start.' }
  ]);
  assert.deepEqual(result.duplicateGroups.exact, []);
  assert.deepEqual(result.duplicateGroups.slotVariants, []);
  assert.deepEqual(result.duplicateGroups.nearPairs, []);
});

test('the audit still detects exact duplicates and slot-only variants', () => {
  const exact = audit([{ text: 'We agree.' }, { text: 'They agree.' }]);
  assert.equal(exact.duplicateGroups.exact.length, 1);
  const slots = audit([
    { formula: 'I agree with [proposal].', text: 'I agree with the proposal.' },
    { formula: 'I agree with [decision].', text: 'I agree with the decision.' }
  ]);
  assert.equal(slots.duplicateGroups.slotVariants.length, 1);
});

test('as-if and as-though irrealis were are not subject-verb agreement errors', () => {
  for (const text of [
    'He talks as if he were in charge.',
    'She treats the deadline as if it were optional.',
    'They spend money as if it were unlimited.',
    'She behaves as though she were the owner.'
  ]) assert.deepEqual(agreementIssues(text), [], text);
});

test('genuine agreement errors remain detectable, including after an irrealis clause', () => {
  for (const text of ['He were in charge yesterday.', 'She have the key.', 'They is ready.', 'I are ready.', 'He talks as if he are in charge.']) {
    assert.ok(agreementIssues(text).length > 0, text);
  }
  const later = agreementIssues('He talks as if he were in charge, but she have the key.');
  assert.ok(later.some(item => item.evidence === 'she have'));
});
