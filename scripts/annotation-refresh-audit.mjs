import fs from 'node:fs';
import zlib from 'node:zlib';
import { loadContent } from '../src/content.mjs';
import { practiceAnnotationWork, showcaseAnnotationWork } from '../src/annotation-corpus.mjs';
import { validateAnnotation, legacyAnnotationToCanonical } from '../src/annotation-schema.mjs';
const content=loadContent();
const practice=practiceAnnotationWork(content), showcase=showcaseAnnotationWork(content);
const payload=JSON.parse(zlib.gunzipSync(fs.readFileSync('data/pattern-annotations.json.gz')));
const items={...payload.items};
for(const collections of Object.values(content.collections)) for(const [name,collection] of Object.entries(collections)) for(const doc of collection.documents||[]) for(const a of doc.annotations){
 const r=legacyAnnotationToCanonical(a);items[`${r.language}:${name}:${doc.id}:${a.id}`]=r;
}
const report={models:payload.models,spacy_version:payload.spacy_version,heuristics_version:payload.heuristics_version,patterns:content.advancedPatterns.length,study_sets:content.studySets.sets.length,practice:{},showcase:{},target_records:0,predicate_records:0,predicate_groups:0,german_discontinuous_predicates:0,review_records:0,review_reasons:{},errors:[]};
const all=[...practice,...showcase];
for(const s of all){
 const bucket=s.pattern_id?report.practice:report.showcase;bucket[s.language]=(bucket[s.language]||0)+1;
 const r=items[s.key];if(!r){report.errors.push({key:s.key,error:'missing'});continue;}
 const errors=validateAnnotation(r);
 if(r.text!==s.text||r.inline_text!==s.text||r.language!==s.language||r.source?.source_hash!==s.source_hash)errors.push('source mismatch');
 if(r.validation?.status==='pending'||!r.validation?.spacy_loaded)errors.push('not regenerated');
 if(!r.emphasis?.version)errors.push('missing emphasis analysis');
 for(const error of errors)report.errors.push({key:s.key,error});
 const groups=r.emphasis?.groups||[];
 report.target_records+=groups.some(g=>g.kind==='target')?1:0;
 report.predicate_records+=groups.some(g=>g.kind==='predicate')?1:0;
 report.predicate_groups+=groups.filter(g=>g.kind==='predicate').length;
 if(s.language==='de')report.german_discontinuous_predicates+=groups.filter(g=>g.kind==='predicate'&&g.segments.length>1).length;
 if(r.emphasis?.review.length)report.review_records++;
 for(const reason of r.emphasis?.review||[])report.review_reasons[reason]=(report.review_reasons[reason]||0)+1;
}
const expected=new Set(all.map(s=>s.key));
for(const key of Object.keys(items))if(!expected.has(key))report.errors.push({key,error:'unexpected record'});
fs.mkdirSync('.tmp/annotation-refresh',{recursive:true});
fs.writeFileSync('.tmp/annotation-refresh/work.json',JSON.stringify({practice,showcase}));
fs.writeFileSync('reports/annotation-refresh-validation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.errors.length)process.exitCode=1;
