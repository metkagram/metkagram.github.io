import assert from 'node:assert/strict';
import test from 'node:test';
import { detectEnglishAgreement } from '../src/english-agreement-audit.mjs';

const grammatical = [
  'Does she have a habit of apologising before she has even asked a question?',
  'By what time will she have collected all the signatures?',
  'How else could she have checked the measurements?',
  'I will not pretend to have understood instructions that are still unclear.',
  'I dread sorting through the boxes that have followed us through three moves.',
  'Could he do the repairs before winter?',
  "Doesn't she have a spare key?",
  'Won’t she have completed the application by Friday?',
  'What if **she** were to **lead** the project?',
  'He talks as if he were the owner.',
  'She spoke as though she were certain.',
  'I wish she were here.',
  'She has the receipt. They have the keys. I am ready.',
];
for (const text of grammatical) {
  test('no high-confidence agreement allegation: '+text, () => assert.deepEqual(detectEnglishAgreement(text), []));
}
const ungrammatical = [
  ['She have a receipt.', 'She have'],
  ['They has the keys.', 'They has'],
  ['I are ready.', 'I are'],
  ['That are the missing pages.', 'That are'],
  ['Yesterday she were late.', 'she were'],
  ['Does she are ready?', 'she are'],
  ['Does she has a key?', 'Does she has'],
  ['Will he is available?', 'Will he is'],
  ['Does she have a copy, or he have the spare one?', 'he have'],
  ['The boxes that have labels are ready, but she have no tape.', 'she have'],
  ['He talks as if he were ready, but she have no notes.', 'she have'],
  ['I wish she were here. They has started without her.', 'They has'],
];
for (const [text,evidence] of ungrammatical) {
  test('retain local agreement error: '+text, () => assert.ok(detectEnglishAgreement(text).some(issue=>issue.evidence===evidence), text));
}
test('ambiguous embedded that is not assigned a singular antecedent by a two-token rule',()=>{
  assert.deepEqual(detectEnglishAgreement('We repaired the doors that were damaged.'),[]);
});
