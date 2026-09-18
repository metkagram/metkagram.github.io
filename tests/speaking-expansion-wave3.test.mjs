import assert from "node:assert/strict";
import test from "node:test";
import { canonicalContent, speakingExpansionWave3PatternIds, speakingExpansionWave3SetIds } from "./helpers/curriculum-contract.mjs";
import { C1_EXAMPLE_DIVERSITY_RULE, patternExampleDiversityProblems } from "../src/pattern-example-quality.mjs";
import { loadPracticeAnnotationLayer } from "../src/practice-annotations.mjs";
import { patternPath, studySetPath } from "../src/seo-slugs.mjs";

const ids=new Set(speakingExpansionWave3PatternIds);
const patterns=canonicalContent.advancedPatterns.filter(p=>ids.has(p.id));
const structural=value=>String(value).toLowerCase().replace(/\[[^\]]*\]/g,"[]").replace(/\s+/g," ").trim();

test("wave three adds exactly 40 patterns in four complete sets",()=>{
  assert.equal(patterns.length,40); assert.equal(speakingExpansionWave3SetIds.length,4);
  for(const set of speakingExpansionWave3SetIds) assert.equal(patterns.filter(p=>p.set_id===set).length,10);
});
test("wave three keeps five aligned diverse EN/DE/RU scenarios per frame",()=>{
  for(const p of patterns){
    const en=p.langs.find(l=>l.lang==="en"),de=p.langs.find(l=>l.lang==="de");
    for(const l of [en,de]){
      assert.equal(l.examples.length,5,p.id);
      assert.deepEqual(patternExampleDiversityProblems(l,C1_EXAMPLE_DIVERSITY_RULE),[],p.id+":"+l.lang);
    }
    assert.deepEqual(en.examples.map(e=>e.translation_ru),de.examples.map(e=>e.translation_ru),p.id);
    assert.equal(new Set(en.examples.map(e=>e.text)).size,5,p.id);
    assert.equal(new Set(de.examples.map(e=>e.text)).size,5,p.id);
  }
});
test("wave three structural formulas do not duplicate the previous catalogue",()=>{
  const old=canonicalContent.advancedPatterns.filter(p=>!ids.has(p.id));
  for(const lang of ["en","de"]){
    const seen=new Map(old.map(p=>{const l=p.langs.find(x=>x.lang===lang);return [structural(l.formula),p.id]}));
    for(const p of patterns){
      const l=p.langs.find(x=>x.lang===lang); const key=structural(l.formula);
      assert.ok(!seen.has(key),p.id+"/"+lang+" duplicates "+seen.get(key)); seen.set(key,p.id);
    }
  }
});
test("wave three routes are registered and unique in both locales",()=>{
  for(const locale of ["en","ru"]){
    const routes=[];
    for(const p of patterns) routes.push(patternPath(locale,p));
    for(const id of speakingExpansionWave3SetIds) routes.push(studySetPath(locale,canonicalContent.studySets.sets.find(s=>s.id===id)));
    assert.equal(new Set(routes).size,44);
  }
});
test("wave three missing raw annotations are synthesized only from the explicit pending ledger",()=>{
  const {payload,items,pendingPatternIds}=loadPracticeAnnotationLayer(canonicalContent); let synthetic=0;
  for(const p of patterns){
    assert.ok(pendingPatternIds.has(p.id),p.id);
    for(const l of p.langs) for(const key of ["primary","1","2","3","4","5"]){
      const full=p.id+":"+l.lang+":"+key; const r=items[full];
      assert.ok(r,full); assert.equal(r.validation.status,"pending"); assert.equal(r.validation.reason,"awaiting_local_annotation");
      assert.equal(r.validation.generator,"none"); assert.deepEqual(r.spans,[]);
      if(!payload.items[full]) synthetic++;
    }
  }
  assert.equal(synthetic,480);
});
