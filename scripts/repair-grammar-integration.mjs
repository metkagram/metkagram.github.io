import fs from 'node:fs';
import assert from 'node:assert/strict';

// One-off, guarded source repair. Never adjust the quality baseline to hide failures.
function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  assert.equal(source.split(before).length, 2, `${label}: unexpected source; inspect before editing`);
  return source.replace(before, after);
}

const integratorFile = 'scripts/integrate-grammar-flexibility.mjs';
let integrator = fs.readFileSync(integratorFile, 'utf8');
// group_id is required even though groups have no separate registry file.
if (integrator.includes('if (groups) p.group_id=family;')) integrator = integrator.replace('if (groups) p.group_id=family;', 'p.group_id=family;');
assert.ok(integrator.includes('p.group_id=family;'));
const oldNote = "p.logic.metaphor_ru += ' В немецком естественно meine beiden Eltern и ihre beiden Vorschläge; для alle сохраняется alle unsere Dateien.';";
if (!integrator.includes("if (!p.logic.metaphor_ru.includes('meine beiden Eltern'))")) integrator = replaceOnce(integrator, oldNote, "if (!p.logic.metaphor_ru.includes('meine beiden Eltern')) " + oldNote, 'idempotent note');
if (!integrator.includes("if(p.id==='GFL008')")) integrator = replaceOnce(integrator, "if(p.id==='GFH018')", "if(p.id==='GFL008') p.langs.find(l=>l.lang==='de').formula='Subject + finite verb in second position + ... + wh-phrase + remaining verb parts?';\n  if(p.id==='GFH018')", 'German echo-question formula');
// The SEO and learner-facing set renderers consume top-level descriptions,
// not the inventory outcome. Describe the actual topic in both interfaces.
integrator = replaceOnce(integrator,
  "title_en:enTitle,levels:['B2','C1']",
  "title_en:enTitle,description:`Compare how English and German express ${enTitle.toLowerCase()}. Practise reusable constructions with Russian translations.`,description_ru:`${ruTitle}: сравнивайте английские и немецкие конструкции по примерам с русским переводом.`,levels:['B2','C1']",
  'new set topic descriptions');
fs.writeFileSync(integratorFile, integrator);

const auditFile = 'src/frame-quality-audit.mjs';
let audit = fs.readFileSync(auditFile, 'utf8');
// Articles and one-letter pronouns carry grammatical meaning. Dropping `a`
// incorrectly collapses the contrast between `few` and `a few`.
audit = replaceOnce(audit, '.filter((token) => token.length > 1));', '.filter((token) => token.length > 0));', 'retain one-letter grammar tokens');
const oldAgreement = `    const match = cleanText(text).match(rule.regex)?.[0];
    if (match) issues.push({ type: "en_subject_verb_agreement", severity: "high", confidence: "high", evidence: match, note: rule.label });`;
const newAgreement = `    const normalized = cleanText(text);
    const match = [...normalized.matchAll(rule.regex)].find((candidate) => {
      // Irrealis were is grammatical directly after as if / as though.
      // Do not suppress other agreement errors or later errors in the sentence.
      const prefix = normalized.slice(0, candidate.index);
      const licensedWere = /\\bwere$/iu.test(candidate[0]) && /\\bas\\s+(?:if|though)\\s*$/iu.test(prefix);
      return !licensedWere;
    });
    if (match) issues.push({ type: "en_subject_verb_agreement", severity: "high", confidence: "high", evidence: match[0], note: rule.label });`;
audit = replaceOnce(audit, oldAgreement, newAgreement, 'recognize as-if irrealis without suppressing genuine agreement errors');
fs.writeFileSync(auditFile, audit);

const shardTestFile = 'tests/pattern-shards.test.mjs';
let shardTests = fs.readFileSync(shardTestFile, 'utf8');
shardTests = replaceOnce(shardTests,
  'const studySets = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "study-sets.json"), "utf8"));',
  'const studySets = loadContent().studySets;',
  'shard tests must use the registered extension set order');
shardTests = replaceOnce(shardTests,
  'const { patterns, shards } = loadPatternShards({ setOrder: studySetOrder() });',
  'const { patterns: allPatterns, shards } = loadPatternShards({ setOrder: studySetOrder() });\n  const patterns = allPatterns.filter(isEstablishedPattern);\n  assert.equal(allPatterns.length, baseline.basePatterns.count + expansionPatternIds.length, "established raw patterns plus complete expansion");\n  assert.deepEqual(allPatterns.filter(pattern => !isEstablishedPattern(pattern)).map(pattern => pattern.id).sort(), [...expansionPatternIds].sort(), "all new shard IDs must be present");\n  assert.equal(new Set(allPatterns.map(pattern => pattern.id)).size, allPatterns.length, "all shard IDs must be unique");',
  'separate additive shard membership from the unchanged historical hash');
shardTests = replaceOnce(shardTests,
  'assert.equal(shards.size, Object.keys(baseline.basePatterns.setCounts).length, "one shard per study set with base patterns");',
  'assert.equal(shards.size, Object.keys(baseline.basePatterns.setCounts).length + expansionSetIds.length, "all established shards plus 15 additive sets");',
  'additive shard count');
const expansionImport = "import { expansionPatternIds, expansionSetIds } from './helpers/curriculum-contract.mjs';";
if (!shardTests.includes(expansionImport)) shardTests = expansionImport + '\n' + shardTests;
fs.writeFileSync(shardTestFile, shardTests);
console.log('Repaired integration metadata, distinct topic descriptions and additive shard coverage; frozen identity hashes and quality thresholds unchanged.');
