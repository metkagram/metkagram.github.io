import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { loadContent } from '../src/content.mjs';
import { patternPath } from '../src/seo-slugs.mjs';
import { validateAnnotation } from '../src/annotation-schema.mjs';
import { loadPracticeAnnotationLayer } from '../src/practice-annotations.mjs';
import { C1_EXAMPLE_DIVERSITY_RULE, PRACTICE_EXAMPLE_DIVERSITY_RULE, patternExampleDiversityProblems, measurePatternExampleDiversity } from '../src/pattern-example-quality.mjs';

// One-off, bounded authoring transaction. No network, model calls or generated
// sentence padding: the inputs are explicitly authored trilingual examples.
const setIds = ['SQA','SQB','SQC','SQD','SVA','SVB','SAD','SNC','SPH','SHB'];
const ids = new Set(setIds.flatMap(s => Array.from({length:10}, (_,i) => s + String(i+1).padStart(3,'0'))));
const seedDir = 'scripts/editorial/speaking-20260918';
const read = file => JSON.parse(fs.readFileSync(file,'utf8'));
const write = (file, value) => { fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n'); };
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const norm = value => String(value).normalize('NFKC').toLowerCase().replace(/\[[^\]]*\]/g,'[]').replaceAll('…','...').replace(/\s+/g,'').replace(/[.?!]$/,'');
const before = loadContent();
const established = before.advancedPatterns.filter(p => !ids.has(p.id));
assert.equal(established.length,930,'Rebase and reassess the inventory if the baseline changes');
const oldFiles = fs.readdirSync('data/patterns').filter(f=>f.endsWith('.json') && !setIds.includes(f.slice(0,-5)));
const oldHashes = new Map(oldFiles.map(f=>[f,sha(fs.readFileSync('data/patterns/'+f))]));
const oldRoutes = new Map(established.map(p=>[p.id,patternPath('en',p)]));
const baselineFailures = established.flatMap(p=>p.langs.flatMap(l=>{
 const problems=patternExampleDiversityProblems(l,PRACTICE_EXAMPLE_DIVERSITY_RULE);
 return problems.length ? [{id:p.id,language:l.lang,problems}] : [];
}));

const seeds = setIds.map(s=>read(`${seedDir}/${s}.json`));
const draft = new Map(seeds.flatMap(s=>s.patterns.map(p=>[p.id,p])));
assert.equal(draft.size,100);
for (const change of read(`${seedDir}/REVISIONS.json`)) {
 const p=draft.get(change.id); assert.ok(p,change.id);
 for (const field of ['en','de','note_en','note_ru','title_ru']) if (change[field]) p[field]=change[field];
 for (const [index,row] of Object.entries(change.examples||{})) p.examples[Number(index)]=row;
 for (const [index,text] of Object.entries(change.de_examples||{})) p.examples[Number(index)][1]=text;
}

const seen = new Map(established.flatMap(p=>p.langs.map(l=>[l.lang+':'+norm(l.formula),p.id])));
const metrics=[];
const additions=[];
for (const seed of seeds) {
 assert.ok(setIds.includes(seed.set.id)); assert.equal(seed.patterns.length,10);
 for (const p of seed.patterns) {
  assert.ok(ids.has(p.id)); assert.ok(p.id.startsWith(seed.set.id));
  assert.equal(p.examples.length,5,p.id);
  for(const row of p.examples) {
   assert.equal(row.length,3,p.id);
   row.forEach(value=>assert.ok(typeof value==='string' && value.trim().length>10,p.id));
   assert.match(row[2],/[А-Яа-яЁё]/u,p.id);
  }
  assert.doesNotMatch(p.title_ru,/[A-Za-z]/u,p.id);
  assert.doesNotMatch(p.note_ru,/[A-Za-z]/u,p.id);
  const langs=['en','de'].map((lang,i)=>({lang,formula:p[lang],example:p.examples[0][i],translation:p.examples[0][2],examples:p.examples.map(row=>({text:row[i],translation_ru:row[2]}))}));
  for(const l of langs) {
   const key=l.lang+':'+norm(l.formula);
   assert.ok(!seen.has(key),`${p.id}/${l.lang} duplicates ${seen.get(key)}: ${l.formula}`);
   seen.set(key,p.id);
   const problems=patternExampleDiversityProblems(l,C1_EXAMPLE_DIVERSITY_RULE);
   assert.deepEqual(problems,[],`${p.id}/${l.lang}: ${problems.join('; ')}`);
   metrics.push({id:p.id,language:l.lang,...measurePatternExampleDiversity(l)});
  }
  additions.push({id:p.id,set_id:seed.set.id,group_id:seed.set.id,title_ru:p.title_ru,title_en:p.en,level:'B2–C1',metaphor_ru:p.note_ru,editorial_descriptions:{en:p.note_en,ru:p.note_ru},langs,formulas:langs.map(l=>l.formula),gen:{status:'generated',iterations:2,lastGeneratedAt:'2026-09-18T00:00:00.000Z',languages:['en','de'],notes:'Original AI-authored examples with an editorial revision pass and deterministic checks. Not independently native-speaker reviewed. CEFR is an editorial target, not an assessed result.'},editorial_batch:'speaking-20260918'});
 }
}
assert.equal(additions.length,100);

// Prefer intentionally authored descriptions over generic formula heuristics.
const copyFile='src/pattern-editorial-copy.mjs';
let copy=fs.readFileSync(copyFile,'utf8');
for(const [fn,lang] of [['patternFrameDescription','ru'],['patternFrameDescriptionEn','en']]) {
 const signature=`export function ${fn}(pattern, set = null) {`;
 const addition=`\n  const authored = compact(pattern?.editorial_descriptions?.${lang} || "");\n  if (authored) return authored;`;
 if(!copy.includes(signature+addition)) { assert.ok(copy.includes(signature)); copy=copy.replace(signature,signature+addition); }
}
fs.writeFileSync(copyFile,copy);

const extensions=read('data/practice-extensions.json');
for(const seed of seeds) {
 const existing=extensions.sets.find(s=>s.id===seed.set.id);
 if(existing) assert.deepEqual(existing,seed.set,'Refuse to replace independently changed study-set metadata');
 else extensions.sets.push(seed.set);
 extensions.learningPathAdds ||= {};
 assert.ok(!Array.isArray(extensions.learningPathAdds),'Expected a learning-path additions map');
 const list=extensions.learningPathAdds[seed.learning_path] ||= [];
 if(!list.includes(seed.set.id)) list.push(seed.set.id);
 write(`data/patterns/${seed.set.id}.json`,{schemaVersion:1,set_id:seed.set.id,patterns:additions.filter(p=>p.set_id===seed.set.id)});
}
write('data/practice-extensions.json',extensions);

// New plain-text sentences get explicit pending records, never fabricated Marks.
const annFile='data/pattern-annotations.json.gz';
const payload=JSON.parse(zlib.gunzipSync(fs.readFileSync(annFile)));
const oldAnnotations=new Map(Object.entries(payload.items).filter(([key])=>!ids.has(key.split(':')[0])).map(([k,v])=>[k,JSON.stringify(v)]));
const ledger=read('data/pending-practice-annotation-rebuilds.json');
for(const p of additions) {
 if(!ledger.patterns.some(e=>e.id===p.id)) ledger.patterns.push({id:p.id,reason:'awaiting_local_annotation',changed_at:'2026-09-18'});
 for(const l of p.langs) {
  const refs=[{key:'primary',text:l.example,translation:l.translation},...l.examples.map((e,i)=>({key:String(i+1),text:e.text,translation:e.translation_ru}))];
  for(const ref of refs) {
   const key=`${p.id}:${l.lang}:${ref.key}`;
   if(payload.items[key]) assert.equal(payload.items[key].validation?.status,'pending',`Refuse to overwrite native annotation ${key}`);
   const record={schema_version:'1.0.0',id:`pending-${p.id}-${l.lang}-${ref.key}`,kind:'sentence',text:ref.text,inline_text:ref.text,language:l.lang,locale:l.lang,translations:{ru:ref.translation},explanation:'',examples:[],cefr:p.level,source:{dataset:'advanced-patterns',set_id:p.set_id,pattern_example_id:key},slots:[],spans:[],validation:{status:'pending',reason:'awaiting_local_annotation',needs_rebuild:true,text_sha256:sha(ref.text),generator:'none'}};
   assert.deepEqual(validateAnnotation(record),[],key);
   payload.items[key]=record;
  }
 }
}
payload.count=Object.keys(payload.items).length;
payload.pending_count=Object.values(payload.items).filter(r=>r.validation?.status==='pending').length;
payload.pending_updated_at='2026-09-18';
fs.writeFileSync(annFile,zlib.gzipSync(JSON.stringify(payload),{level:9}));
write('data/pending-practice-annotation-rebuilds.json',ledger);
for(const [key,json] of oldAnnotations) assert.equal(JSON.stringify(payload.items[key]),json,`Old annotation changed: ${key}`);

// Keep the frozen 630-pattern baseline AND the explicit 300-pattern GF family.
// The legacy enrichment ledger must not silently expand to cover these additions.
const helperFile='tests/helpers/curriculum-contract.mjs';
let helper=fs.readFileSync(helperFile,'utf8');
if(!helper.includes('export const speakingExpansionSetIds')) {
 const anchor='const expansionIds = new Set(expansionPatternIds);';
 assert.ok(helper.includes(anchor));
 helper=helper.replace(anchor,`export const speakingExpansionSetIds = ${JSON.stringify(setIds)};\nexport const speakingExpansionPatternIds = speakingExpansionSetIds.flatMap(s => Array.from({length:10}, (_,i) => s + String(i+1).padStart(3,'0')));\nexport const allExpansionSetIds = [...expansionSetIds, ...speakingExpansionSetIds];\nexport const allExpansionPatternIds = [...expansionPatternIds, ...speakingExpansionPatternIds];\nconst expansionIds = new Set(allExpansionPatternIds);`)
 .replaceAll('+ expansionPatternIds.length','+ allExpansionPatternIds.length')
 .replaceAll('+ expansionSetIds.length','+ allExpansionSetIds.length')
 .replace('[...expansionPatternIds].sort()','[...allExpansionPatternIds].sort()');
 fs.writeFileSync(helperFile,helper);
}
const shardTest='tests/pattern-shards.test.mjs';
let shard=fs.readFileSync(shardTest,'utf8');
shard=shard.replace('import { expansionPatternIds, expansionSetIds }','import { allExpansionPatternIds as expansionPatternIds, allExpansionSetIds as expansionSetIds }').replace('all established shards plus 15 additive sets','all established shards plus explicitly registered additive sets');
fs.writeFileSync(shardTest,shard);

fs.writeFileSync('tests/speaking-expansion.test.mjs',`import assert from 'node:assert/strict';
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
   for(const e of l.examples) {assert.match(e.translation_ru,/[А-Яа-яЁё]/u); assert.doesNotMatch(e.text,/\\*\\*/u);}
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
 const ledger=JSON.parse(fs.readFileSync('data/pending-pattern-example-enrichment.json','utf8'));
 const text=JSON.stringify(ledger);
 for(const id of ids) assert.ok(!text.includes(id),id+' must not enter the legacy exemption ledger');
});
`);

// Reload in a fresh process later for the formatter module patch. Membership,
// routes and annotations can already be verified here without changing old data.
const after=loadContent();
assert.equal(after.advancedPatterns.length,1030);
assert.equal(after.studySets.sets.length,119);
for(const [file,hash] of oldHashes) assert.equal(sha(fs.readFileSync('data/patterns/'+file)),hash,file);
for(const [id,route] of oldRoutes) assert.equal(patternPath('en',after.advancedPatterns.find(p=>p.id===id)),route,id);
loadPracticeAnnotationLayer(after);
const baselinePatternFailures=new Set(baselineFailures.map(r=>r.id)).size;
const audit={schemaVersion:1,batch:'speaking-20260918',before:{patterns:930,sets:109},after:{patterns:1030,sets:119},newPatterns:100,newSets:10,scenarios:500,sentenceVersions:1500,annotationReferences:1200,strictNewLanguageChecks:metrics.length,normalizedFormulaCollisions:0,establishedRoutesPreserved:oldRoutes.size,establishedShardsPreserved:oldHashes.size,establishedAnnotationRecordsPreserved:oldAnnotations.size,baselineDiversityFailingPatterns:baselinePatternFailures,baselineDiversityFailingLanguageRecords:baselineFailures.length,metrics,baselineFailures};
write('.tmp/speaking-expansion/new-pattern-audit.json',audit);
const rows=seeds.map(s=>'| '+s.set.id+' | '+s.set.title_en+' | 10 |').join('\n');
const report=`# Speaking expansion: 18 September 2026\n\n## Delivered content\n\n100 additive lexical-grammatical practice frames in ten study sets: 40 question frames and 60 statement/complement frames. Each has five distinct scenarios aligned in English, German and Russian: 500 scenarios, 1,500 sentence versions. The primary sentence is the first scenario, not an additional sixth example.\n\nThe canonical catalogue grows from 930 to 1,030 patterns and from 109 to 119 study sets. These are patterns and topic sets respectively, not interchangeable counts.\n\n| Set | Practice focus | Patterns |\n| --- | --- | ---: |\n${rows}\n\n## Editorial choices\n\nTitles describe reusable constructions rather than fabricated example sentences. Specific EN/RU usage notes are preserved ahead of generic renderer heuristics. Examples vary participants, settings, vocabulary and, where the construction permits, tense, aspect, polarity and sentence form. Fixed-tense questions retain their teaching target. No filler follow-up sentences were appended.\n\nThe English focus is a mix of grammatical mechanics and lexical complements, not a claim to introduce 100 wholly new grammar rules. German provides natural equivalents: a single English frame may require more than one German construction. In particular, neutral tend to and negatively coloured prone to can share German neigen; the distinction is taught in the usage notes. Matching meanings does not establish a formally reviewed Bridge.\n\n## Checks and preservation\n\nAll 200 new language example sets pass the existing stricter C1 diversity rule, including at least 30 vocabulary tokens, at least 14 variable tokens and the original similarity limits. IDs, complete translations, five unique scenarios, schema membership and placeholder-normalized formula collisions are checked. No existing normalized formula was duplicated. These checks are not proof of semantic uniqueness or linguistic perfection.\n\nPreservation checks confirm all ${oldRoutes.size} established pattern routes, all ${oldHashes.size} established shard files and all ${oldAnnotations.size} established raw annotation records are unchanged. The original 630-pattern frozen fixture remains frozen; the earlier 300 GF additions remain explicit, and their limited example-enrichment ledger is not extended.\n\nRun the focused checks with:\n\n\`\`\`sh\nnode --test tests/speaking-expansion.test.mjs tests/pattern-shards.test.mjs tests/practice-annotations.test.mjs tests/pattern-editorial-copy.test.mjs tests/pattern-example-enrichment.test.mjs\n\`\`\`\n\n## Existing quality debt\n\nBefore these additions, the corpus-wide diversity rule already reports ${baselinePatternFailures} established patterns / ${baselineFailures.length} language records below its floor, including the explicitly tracked undersized GF sets. This batch neither changes those examples nor relaxes the gate. A full repository verification can therefore remain red even when the new content and its integration pass. The workflow captures baseline and changed-revision results separately; do not report a green full verification without checking its actual result.\n\n## Annotation and review status\n\nThe 1,200 annotation references (primary plus five variations in each language) are explicitly pending local annotation. They contain empty spans, text hashes and generator none; existing dependency annotations are untouched. Run the normal local parser pipeline later instead of treating plain text as reviewed Marks.\n\nThe examples are original AI-authored text with a revision pass and deterministic checks, not copied teaching material and not independently reviewed by native speakers. B2–C1 is an editorial learning target, not a measured learner outcome. Eligibility and entitlement examples are illustrative statements under named fictional rules, not legal guidance. Existing project licensing remains unchanged.\n`;
fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/SPEAKING_EXPANSION_20260918.md',report);
console.log(JSON.stringify({...audit,metrics:undefined,baselineFailures:undefined},null,2));
