import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { loadContent } from '../../src/content.mjs';
import { patternPath } from '../../src/seo-slugs.mjs';

// Keep the deduplication fixture frozen. Additions must not conceal a deleted,
// renamed, or rerouted established Pattern, even when the total count grows.
export const frozenCorpus = JSON.parse(fs.readFileSync(new URL('../fixtures/pattern-corpus-baseline.json', import.meta.url), 'utf8'));
export const expansionSetIds = [...'ABCDEFGHIJKLMNO'].map(suffix => `GF${suffix}`);
export const expansionPatternIds = expansionSetIds.flatMap(setId => Array.from({ length: 20 }, (_, i) => `${setId}${String(i + 1).padStart(3, '0')}`));
export const practiceExpansionPatternIds = [
  "XPRCGR004", "XPRCGR005", "XPRCGR006",
  "XPRSPK004", "XPRSPK005", "XPRSPK006",
  "XPRINT004", "XPRINT005", "XPRINT006",
  "XPRREG004", "XPRREG005", "XPRREG006",
  "XPRRTR010", "XPRRTR011", "XPRRTR012",
  "XPRTRN004", "XPRTRN005", "XPRTRN006"
];
// Reviewed additions to the draft C1 curriculum; keep explicit, not derived
// from the pending annotation ledger (which must become empty after spaCy rebuild).
export const approvedC1PatternIds = [
  "C1EVD042",
  "C1ARG041",
  "C1HED041",
  "C1PRB042",
  "C1CLR041",
  "C1EVD043",
  "C1AGR041",
  "C1PRO041",
  "C1STO041",
  "C1AGR042",
  "C1SOL001",
  "C1MOD042",
  "C1STO042",
  "C1QCL001",
  "C1QNGT001",
  "C1QHYP001",
  "C1QDIS001",
  "C1QDEC001",
  "C1PRI001",
  "C1SUM001",
  "C1CAU041",
  "C1EVD041",
  "C1QFOL001",
  "C1QFRM001",
  "C1CND041",
  "C1TCT001",
  "C1FBK001",
  "C1PFR001",
  "C1TAS041",
  "C1REP041",
  "C1KON001",
  "C1FCS001",
  "C1PRP001",
  "C1MOD041",
  "C1INF001",
  "C1DET001",
  "C1PRB041",
];
const additivePatternIds = [...expansionPatternIds, ...practiceExpansionPatternIds, ...approvedC1PatternIds];
const expansionIds = new Set(additivePatternIds);
export const isEstablishedPattern = pattern => !expansionIds.has(pattern.id);
export const expectedPatternCount = frozenCorpus.mergedCorpus.patternCount + additivePatternIds.length;
export const expectedStudySetCount = frozenCorpus.mergedCorpus.studySetCount + expansionSetIds.length;
export const minimumShardCount = frozenCorpus.basePatterns.count + expansionPatternIds.length;
export const canonicalContent = loadContent();
export const canonicalIds = canonicalContent.advancedPatterns.map(pattern => pattern.id).sort();
export const historicalAliases = JSON.parse(fs.readFileSync(new URL('../../data/pattern-aliases.json', import.meta.url), 'utf8')).aliases;

assert.equal(frozenCorpus.mergedCorpus.patternCount, 630, 'Do not silently regenerate the preservation baseline');
assert.equal(approvedC1PatternIds.length, 37, 'approved C1 additions need explicit review');
assert.equal(new Set(approvedC1PatternIds).size, approvedC1PatternIds.length, 'duplicate approved C1 additions');
for (const id of approvedC1PatternIds) {
  assert.ok(!Object.hasOwn(historicalAliases, id), `${id}: an approved C1 addition cannot reuse a retired alias`);
}
assert.equal(canonicalIds.length, expectedPatternCount);
assert.equal(new Set(canonicalIds).size, canonicalIds.length);
assert.deepEqual(canonicalContent.advancedPatterns.filter(pattern => !isEstablishedPattern(pattern)).map(pattern => pattern.id).sort(), [...additivePatternIds].sort());
const established = canonicalContent.advancedPatterns.filter(isEstablishedPattern);
assert.equal(established.length, frozenCorpus.mergedCorpus.patternCount);
const routes = established.map(pattern => `${pattern.id}:${patternPath('en', pattern)}`).sort().join('\n');
assert.equal(crypto.createHash('sha256').update(routes).digest('hex'), frozenCorpus.mergedCorpus.idRouteSha256, 'Established IDs or canonical URLs changed');
assert.equal(canonicalContent.studySets.sets.length, expectedStudySetCount);
for (const [alias, target] of Object.entries(historicalAliases)) {
  assert.ok(!canonicalIds.includes(alias), `${alias}: retired duplicate returned to the active catalogue`);
  assert.ok(canonicalIds.includes(target), `${alias}: canonical alias target disappeared`);
}

export function assertCanonicalIds(records, label = 'published curriculum') {
  const ids = [...records].map(record => typeof record === 'string' ? record : record.id).sort();
  assert.deepEqual(ids, canonicalIds, `${label}: exact canonical membership mismatch`);
}
