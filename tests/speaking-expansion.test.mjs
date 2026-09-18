import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { canonicalContent, speakingExpansionSetIds, speakingExpansionPatternIds } from './helpers/curriculum-contract.mjs';
import { C1_EXAMPLE_DIVERSITY_RULE, patternExampleDiversityProblems } from '../src/pattern-example-quality.mjs';
import { patternFrameDescription, patternFrameDescriptionEn } from '../src/pattern-editorial-copy.mjs';
import { loadPracticeAnnotationLayer } from '../src/practice-annotations.mjs';
const ids=new Set(speakingExpansionPatternIds);
const patterns=canonicalContent.advancedPatterns.filter(p=>ids.has(p.id));
test('speaking expansion has exactly 100 frames in ten complete registered sets',()=>{
 assert.equal(patterns.length,100); assert.equal(speakingExpansionSetIds.length,10);
 for(const set of speakingExpansionSetIds) assert.equal(patterns.filter(p=>p.set_id===set).length,10);
 for(const p of patterns) {
  assert.equal(p.editorial_batch,'speaking-20260918');
  assert.equal(p.description_en,p.editorial_descriptions.en);
  assert.equal(p.description_ru,p.editorial_descriptions.ru);
  assert.doesNotMatch(p.title_ru,/[A-Za-z]/u);
  assert.doesNotMatch(p.description_ru,/[A-Za-z]/u);
  assert.ok(canonicalContent.studySets.learningPaths.some(route=>route.set_ids.includes(p.set_id)));
 }
});
test('every new frame has five aligned distinct trilingual scenarios and strict lexical diversity',()=>{
 for(const p of patterns) {
  const en=p.langs.find(l=>l.lang==='en'),de=p.langs.find(l=>l.lang==='de');
  assert.equal(en.examples.length,5); assert.equal(de.examples.length,5);
  assert.equal(new Set(en.examples.map(e=>e.translation_ru)).size,5,p.id);
  for(const l of p.langs) {
   assert.deepEqual(patternExampleDiversityProblems(l,C1_EXAMPLE_DIVERSITY_RULE),[],p.id+':'+l.lang);
   assert.equal(l.example,l.examples[0].text);
   assert.equal(l.translation,l.examples[0].translation_ru);
   for(const e of l.examples) {assert.match(e.translation_ru,/[А-Яа-яЁё]/u); assert.doesNotMatch(e.text,/\*\*/u);}
  }
  assert.deepEqual(en.examples.map(e=>e.translation_ru),de.examples.map(e=>e.translation_ru));
 }
});
test('new sentences are covered by explicit pending annotations, never invented dependency spans',()=>{
 const {items,pendingPatternIds}=loadPracticeAnnotationLayer(canonicalContent);
 let count=0;
 for(const [key,record] of Object.entries(items)) if(ids.has(key.split(':')[0])) {
  count++; assert.ok(pendingPatternIds.has(key.split(':')[0]));
  if(record.validation.status==='pending') {
   assert.deepEqual(record.spans,[]); assert.equal(record.validation.needs_rebuild,true); assert.equal(record.validation.generator,'none');
  }
 }
 assert.equal(count,1200);
});
test('explicit authorial descriptions take precedence without changing fallback behaviour',()=>{
 const p={langs:[{lang:'en',formula:'Could you confirm whether [X]?'}],editorial_descriptions:{en:'A specific editorial explanation.',ru:'Конкретное пояснение автора.'}};
 assert.equal(patternFrameDescriptionEn(p),'A specific editorial explanation.');
 assert.equal(patternFrameDescription(p),'Конкретное пояснение автора.');
 assert.ok(patternFrameDescriptionEn({...p,editorial_descriptions:undefined}).length>0);
});
test('example enrichment debt remains limited to the historical GF additions',()=>{
 const ledger=JSON.parse(fs.readFileSync('data/quality/pending-example-enrichment.json','utf8'));
 const text=JSON.stringify(ledger);
 for(const id of ids) assert.ok(!text.includes(id),id+' must not enter the legacy exemption ledger');
});
