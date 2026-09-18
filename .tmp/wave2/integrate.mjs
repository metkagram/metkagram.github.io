import fs from "node:fs";
import path from "node:path";

const ROOT=process.cwd();
const SETS=[
{id:"SRE",title_en:"Reporting and evidence in conversation",title_ru:"Сообщения, источники и признаки",description:"Report what you have learned, separate observation from hearsay, and qualify evidence without sounding vague.",description_ru:"Передавайте полученные сведения, отделяйте наблюдение от пересказа и аккуратно формулируйте выводы по признакам.",level:"B2–C1",path:"SRE",learning_path:"C1-COMMUNICATE"},
{id:"SCE",title_en:"Causes, effects and enablement",title_ru:"Причины, последствия и возможности",description:"Describe how one action creates, prevents, enables or changes another outcome.",description_ru:"Описывайте, как одно действие создаёт, предотвращает, облегчает или делает возможным другой результат.",level:"B2–C1",path:"SCE",learning_path:"C1-COMMUNICATE"},
{id:"SQT",title_en:"Questions for deeper reasoning",title_ru:"Вопросы для более глубокого рассуждения",description:"Ask about assumptions, alternatives, methods, counterfactuals and the practical meaning of a change.",description_ru:"Выясняйте основания, альтернативы, способы действия, нереальные сценарии и практический смысл изменений.",level:"B2–C1",path:"SQT",learning_path:"C1-QUESTIONS"},
{id:"SVC",title_en:"Verb + person + complement patterns",title_ru:"Глагол + человек + действие",description:"Practise common verb-complement frames for accusation, influence, permission, reminders, praise and criticism.",description_ru:"Практикуйте управление глаголов при обвинении, влиянии, разрешении, напоминании, похвале и критике.",level:"B2–C1",path:"SVC",learning_path:"C1-GRAMMAR"},
{id:"SCF",title_en:"Focus, contrast and reframing",title_ru:"Фокус, контраст и переформулирование",description:"Shift attention to the real point, soften disagreement and restate an idea without losing the thread.",description_ru:"Переносите внимание на главное, мягко корректируйте смысл и переформулируйте мысль без потери нити разговора.",level:"B2–C1",path:"SCF",learning_path:"C1-COMMUNICATE"},
{id:"SCH",title_en:"Change, progression and status",title_ru:"Изменение, прогресс и состояние",description:"Describe transitions, unfinished progress, imminent events, likely outcomes and unexpected endpoints.",description_ru:"Описывайте переходы, незавершённый прогресс, близкие события, ожидаемые результаты и неожиданные итоги.",level:"B2–C1",path:"SCH",learning_path:"C1-GRAMMAR"}];

function read(file){return JSON.parse(fs.readFileSync(file,"utf8"))}
function write(file,value){fs.writeFileSync(file,JSON.stringify(value,null,2)+"\n")}
const extensionFile="data/practice-extensions.json";
const ext=read(extensionFile);
ext.learningPathAdds ||= {};
for(const meta of SETS){
  const {learning_path,...set}=meta;
  const existing=ext.sets.find(item=>item.id===set.id);
  if(existing) Object.assign(existing,set); else ext.sets.push(set);
  const list=ext.learningPathAdds[learning_path] ||= [];
  if(!list.includes(set.id)) list.push(set.id);
}
write(extensionFile,ext);

const helperFile="tests/helpers/curriculum-contract.mjs";
let helper=fs.readFileSync(helperFile,"utf8");
if(!helper.includes("speakingExpansionWave2SetIds")){
  helper=helper.replace(
    'export const allExpansionSetIds = [...expansionSetIds, ...speakingExpansionSetIds];\nexport const allExpansionPatternIds = [...expansionPatternIds, ...speakingExpansionPatternIds];',
    'export const speakingExpansionWave2SetIds = ["SRE","SCE","SQT","SVC","SCF","SCH"];\nexport const speakingExpansionWave2PatternIds = speakingExpansionWave2SetIds.flatMap(s => Array.from({length:10}, (_,i) => s + String(i+1).padStart(3,\'0\')));\nexport const allExpansionSetIds = [...expansionSetIds, ...speakingExpansionSetIds, ...speakingExpansionWave2SetIds];\nexport const allExpansionPatternIds = [...expansionPatternIds, ...speakingExpansionPatternIds, ...speakingExpansionWave2PatternIds];'
  );
}
fs.writeFileSync(helperFile,helper);

const loaderFile="src/practice-annotations.mjs";
let loader=fs.readFileSync(loaderFile,"utf8");
const old='''        const record = payload.items[key];
        if (!record) throw new Error(`Missing Practice annotation ${key}`);
        const expectedText = cleanMarkedText(reference.text);
        const matches = record.text === expectedText && record.inline_text === expectedText;

        if (!matches) {
          const pending = pendingEntries.get(pattern.id);
          if (!pending) throw new Error(`Practice annotation text mismatch for ${key}`);''';
const replacement='''        const record = payload.items[key];
        const pending = pendingEntries.get(pattern.id);
        if (!record) {
          if (!pending) throw new Error(`Missing Practice annotation ${key}`);
          const replacement = pendingRecord(pattern, language, reference, pending.reason);
          const errors = validateAnnotation(replacement);
          if (errors.length) throw new Error(`Invalid pending Practice annotation ${key}: ${errors.join(", ")}`);
          items[key] = replacement;
          overlayPendingCount += 1;
          continue;
        }
        const expectedText = cleanMarkedText(reference.text);
        const matches = record.text === expectedText && record.inline_text === expectedText;

        if (!matches) {
          if (!pending) throw new Error(`Practice annotation text mismatch for ${key}`);''';
if(loader.includes(old)) loader=loader.replace(old,replacement);
else if(!loader.includes("if (!record) {\n          if (!pending)")) throw new Error("practice annotation loader shape changed");
fs.writeFileSync(loaderFile,loader);

const ledgerFile="data/pending-practice-annotation-rebuilds.json";
const ledger=read(ledgerFile);
const ids=new Set((ledger.patterns||[]).map(x=>x.id));
for(const set of SETS) for(let i=1;i<=10;i++){
  const id=set.id+String(i).padStart(3,"0");
  if(!ids.has(id)){ledger.patterns.push({id,reason:"awaiting_local_annotation",changed_at:"2026-09-18"});ids.add(id);}
}
write(ledgerFile,ledger);

const pendingTest="tests/pending-c1-annotations.test.mjs";
let pt=fs.readFileSync(pendingTest,"utf8");
pt=pt.replace(
  "import { speakingExpansionPatternIds } from './helpers/curriculum-contract.mjs';",
  "import { speakingExpansionPatternIds, speakingExpansionWave2PatternIds } from './helpers/curriculum-contract.mjs';"
).replace(
  "const newSpeakingIds = new Set(speakingExpansionPatternIds);",
  "const newSpeakingIds = new Set([...speakingExpansionPatternIds, ...speakingExpansionWave2PatternIds]);"
);
fs.writeFileSync(pendingTest,pt);

fs.writeFileSync("tests/speaking-expansion-wave2.test.mjs",`import assert from "node:assert/strict";
import test from "node:test";
import { canonicalContent, speakingExpansionWave2PatternIds, speakingExpansionWave2SetIds } from "./helpers/curriculum-contract.mjs";
import { C1_EXAMPLE_DIVERSITY_RULE, patternExampleDiversityProblems } from "../src/pattern-example-quality.mjs";
import { loadPracticeAnnotationLayer } from "../src/practice-annotations.mjs";
import { patternPath, studySetPath } from "../src/seo-slugs.mjs";

const ids=new Set(speakingExpansionWave2PatternIds);
const patterns=canonicalContent.advancedPatterns.filter(p=>ids.has(p.id));
const structural=value=>String(value).toLowerCase().replace(/\\[[^\\]]*\\]/g,"[]").replace(/\\s+/g," ").trim();

test("wave two adds exactly 60 patterns in six complete sets",()=>{
  assert.equal(patterns.length,60); assert.equal(speakingExpansionWave2SetIds.length,6);
  for(const set of speakingExpansionWave2SetIds) assert.equal(patterns.filter(p=>p.set_id===set).length,10);
});
test("wave two keeps five aligned diverse EN/DE/RU scenarios per frame",()=>{
  for(const p of patterns){
    const en=p.langs.find(l=>l.lang==="en"),de=p.langs.find(l=>l.lang==="de");
    for(const l of [en,de]){assert.equal(l.examples.length,5,p.id);assert.deepEqual(patternExampleDiversityProblems(l,C1_EXAMPLE_DIVERSITY_RULE),[],p.id+":"+l.lang);}
    assert.deepEqual(en.examples.map(e=>e.translation_ru),de.examples.map(e=>e.translation_ru),p.id);
    assert.equal(new Set(en.examples.map(e=>e.text)).size,5,p.id);assert.equal(new Set(de.examples.map(e=>e.text)).size,5,p.id);
  }
});
test("wave two structural formulas do not duplicate the previous 1030-pattern catalogue",()=>{
  const old=canonicalContent.advancedPatterns.filter(p=>!ids.has(p.id));
  for(const lang of ["en","de"]){
    const seen=new Map(old.map(p=>{const l=p.langs.find(x=>x.lang===lang);return [structural(l.formula),p.id]}));
    for(const p of patterns){const l=p.langs.find(x=>x.lang===lang);const key=structural(l.formula);assert.ok(!seen.has(key),p.id+"/"+lang+" duplicates "+seen.get(key));seen.set(key,p.id);}
  }
});
test("wave two routes are registered and unique in both locales",()=>{
  for(const locale of ["en","ru"]){const routes=[];for(const p of patterns) routes.push(patternPath(locale,p));for(const id of speakingExpansionWave2SetIds) routes.push(studySetPath(locale,canonicalContent.studySets.sets.find(s=>s.id===id)));assert.equal(new Set(routes).size,66);}
});
test("wave two missing raw annotations are synthesized only from the explicit pending ledger",()=>{
  const {payload,items,pendingPatternIds}=loadPracticeAnnotationLayer(canonicalContent);let synthetic=0;
  for(const p of patterns){assert.ok(pendingPatternIds.has(p.id),p.id);for(const l of p.langs){for(const key of ["primary","1","2","3","4","5"]){const full=p.id+":"+l.lang+":"+key;const r=items[full];assert.ok(r,full);assert.equal(r.validation.status,"pending");assert.equal(r.validation.reason,"awaiting_local_annotation");assert.equal(r.validation.generator,"none");assert.deepEqual(r.spans,[]);if(!payload.items[full]) synthetic++;}}}
  assert.equal(synthetic,720);
});
`);

fs.writeFileSync("docs/SPEAKING_EXPANSION_WAVE2_20260918.md",`# Speaking expansion — wave 2

Added 60 lexical-grammatical patterns in six additive sets, each with five distinct scenarios aligned in English, German and Russian. This wave adds 300 scenarios / 900 sentence versions and grows the branch catalogue from 1,030 to 1,090 patterns and from 119 to 125 study sets.

The sets cover reporting/evidence (SRE), cause/effect (SCE), deeper questions (SQT), verb-person-complement grammar (SVC), focus/reframing (SCF), and change/progression (SCH). Examples deliberately rotate across household problems, repairs, learning, travel, community activities, culture, audio/technology and enterprise workflows.

All 120 new EN/DE example lists are required to pass the repository's stricter C1 diversity floor. New formulas are checked against the previous catalogue for structural collisions. Russian learner translations stay aligned across the EN and DE examples.

No dependency Marks are fabricated. New patterns are registered in the explicit pending-annotation ledger, and the Practice annotation loader now synthesizes an empty-span pending record when — and only when — a missing raw annotation belongs to such an explicitly pending Pattern. Existing compressed annotation records remain untouched.

The content remains AI-authored with an editorial pass and deterministic validation, not independent native-speaker review. B2–C1 remains an editorial practice target. Existing rights and publication boundaries are unchanged.
`);

console.log("wave2 metadata, ledger, loader and tests integrated");
