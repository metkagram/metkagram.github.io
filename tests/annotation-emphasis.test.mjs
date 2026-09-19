import assert from 'node:assert/strict';
import test from 'node:test';
import { validateAnnotation, renderCanonicalText } from '../src/annotation-schema.mjs';
import { annotationSourceHash, showcaseAnnotationWork } from '../src/annotation-corpus.mjs';
import { loadContent } from '../src/content.mjs';

const record = { schema_version:'1.0.0', id:'test', language:'en', text:'😀 She has left.', spans:[{id:'s1',start:7,end:10,type:'helper',label:'Hr'}], emphasis:{version:'test',review:[],groups:[{id:'p1',kind:'predicate',confidence:'supported',segments:[{start:7,end:15,text:'has left'}]}]} };
test('emphasis validates exact UTF-16 segments and rejects malformed or stale spans',()=>{
  assert.deepEqual(validateAnnotation(record),[]);
  for(const segment of [{start:1,end:10,text:'bad'},{start:7,end:15,text:'had left'},{start:7,end:99,text:'has left'}]) {
    const changed=structuredClone(record);changed.emphasis.groups[0].segments=[segment];assert.ok(validateAnnotation(changed).length);
  }
  const duplicate=structuredClone(record);duplicate.emphasis.groups.push(duplicate.emphasis.groups[0]);assert.ok(validateAnnotation(duplicate).length);
});
test('source identity invalidates text, formula and language changes',()=>{
  const s={language:'en',text:'She left.',formula:'Subject + verb'};
  for(const next of [{...s,text:'She stayed.'},{...s,formula:'[X] left'},{...s,language:'de'}]) assert.notEqual(annotationSourceHash(s),annotationSourceHash(next));
});
test('renderer preserves text order, escapes unmarked text, and gives target priority',()=>{
 const html=renderCanonicalText(record,(_s,t)=>`<b>${t}</b>`);
 assert.equal(html.replace(/<[^>]*>/g,''),record.text);
 assert.ok(html.includes('emphasis-predicate'));
 assert.equal(renderCanonicalText({text:'a < b & c',spans:[]},()=>''),'a &lt; b &amp; c');
 const r=structuredClone(record);r.emphasis.groups.push({...r.emphasis.groups[0],id:'t1',kind:'target'});
 assert.ok(!renderCanonicalText(r,(_s,t)=>t).includes('emphasis-predicate'));
});
test('emphasis nests inside an article-leading grammatical Mark without repeating its tag',()=>{
 const phrase={schema_version:'1.0.0',id:'phrase',language:'en',text:'The main obstacle remains.',spans:[{id:'s1',start:0,end:17,type:'subject',label:'S'}],emphasis:{version:'test',review:[],groups:[{id:'t1',kind:'target',confidence:'supported',segments:[{start:9,end:17,text:'obstacle'}]}]}};
 assert.deepEqual(validateAnnotation(phrase),[]);
 const html=renderCanonicalText(phrase,(_span,_text,inner)=>`<i class="mark">${inner}</i>`);
 assert.equal(html.replace(/<[^>]*>/g,''),phrase.text);
 assert.equal((html.match(/class="mark"/g)||[]).length,1);
 assert.match(html,/The main <span class="learning-emphasis emphasis-target">obstacle<\/span>/);
});
test('refreshed nominal Marks begin at the article in the reported EN/DE pattern',async()=>{
 const {loadPracticeAnnotationLayer}=await import('../src/practice-annotations.mjs');
 const {items}=loadPracticeAnnotationLayer(loadContent());
 const extract=(key,labels)=>items[key].spans.filter(span=>labels.includes(span.label)).map(span=>[span.label,items[key].text.slice(span.start,span.end)]);
 assert.deepEqual(extract('CLF058:en:primary',['S']),[['S','The retry theory'],['S','it']]);
 assert.deepEqual(extract('CLF058:de:primary',['S','/→']),[['S','Die Retry-Theorie'],['/→','das Duplikat'],['/→','das fehlende erste Ereignis']]);
});
test('all public showcase records carry current regenerated annotation',()=>{
 const content=loadContent();const work=showcaseAnnotationWork(content);assert.equal(work.length,969);
 for(const collections of Object.values(content.collections)) for(const collection of Object.values(collections)) for(const doc of collection.documents || []) for(const a of doc.annotations){
  const r=a.canonical_annotation;assert.ok(r,a.id);assert.equal(r.text,a.original_text);assert.deepEqual(validateAnnotation(r),[]);assert.equal(r.source.source_hash,annotationSourceHash({text:a.original_text,language:r.language}));
 }
});

test('every refreshed Practice and showcase sentence survives the renderer with its exact text', async()=>{
 const {loadPracticeAnnotationLayer}=await import('../src/practice-annotations.mjs');
 const content=loadContent();
 const {items}=loadPracticeAnnotationLayer(content);
 for(const collections of Object.values(content.collections)) for(const collection of Object.values(collections)) for(const doc of collection.documents||[]) for(const a of doc.annotations) items[`showcase:${a.id}`]=a.canonical_annotation;
 const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 for(const [key,r] of Object.entries(items)){
  const html=renderCanonicalText(r,(_span,text)=>escape(text));
  const text=html.replace(/<\/?span\b[^>]*>/g,'').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
  assert.equal(text,r.text,key);
 }
});

test('loader rejects formula-only drift and wrong-language records',async()=>{
 const {loadPracticeAnnotationLayer}=await import('../src/practice-annotations.mjs');
 for(const change of ['formula','lang']){
  const content=loadContent();const l=content.advancedPatterns[0].langs[0];
  if(change==='formula')l.formula+=' changed'; else l.lang='de';
  assert.throws(()=>loadPracticeAnnotationLayer(content),/mismatch|stale|count/);
 }
});
