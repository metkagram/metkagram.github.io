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
console.log('Repaired integration metadata and two grammar-audit false positives; regression thresholds unchanged.');
