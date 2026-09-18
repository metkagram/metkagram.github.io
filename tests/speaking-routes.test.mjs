import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalContent, speakingExpansionPatternIds, speakingExpansionSetIds } from './helpers/curriculum-contract.mjs';
import { patternPath, studySetPath } from '../src/seo-slugs.mjs';

test('every new speaking pattern and set has a registered localized route',()=>{
  for(const locale of ['en','ru']) {
    const routes=[];
    for(const id of speakingExpansionPatternIds) {
      const pattern=canonicalContent.advancedPatterns.find(p=>p.id===id);
      const route=patternPath(locale,pattern);
      assert.ok(route.startsWith('/'+locale+'/practice/patterns/'));
      assert.ok(route.endsWith('-'+id.toLowerCase()+'/'));
      routes.push(route);
    }
    for(const id of speakingExpansionSetIds) {
      const set=canonicalContent.studySets.sets.find(s=>s.id===id);
      const route=studySetPath(locale,set);
      assert.ok(route.startsWith('/'+locale+'/practice/sets/'));
      routes.push(route);
    }
    assert.equal(new Set(routes).size,110);
  }
});
