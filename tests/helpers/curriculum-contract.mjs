import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { loadContent } from '../../src/content.mjs';
import { patternPath } from '../../src/seo-slugs.mjs';

// Keep the deduplication fixture frozen. Additions must not conceal a deleted,
// renamed, or rerouted established Pattern, even when the total count grows.
export const frozenCorpus = JSON.parse(fs.readFileSync(new URL('../fixtures/pattern-corpus-baseline.json', import.meta.url), 'utf8'));
export const pendingExampleEnrichmentSetIds = [...'ABCDEFGHIJKLMNO'].map(suffix => `GF${suffix}`);
export const pendingExampleEnrichmentPatternIds = pendingExampleEnrichmentSetIds.flatMap(setId => Array.from({ length: 20 }, (_, i) => `${setId}${String(i + 1).padStart(3, '0')}`));
export const expansionSetIds = [...'ABCDEFGHIJKLMNOPQRST'].map(suffix => `GF${suffix}`);
export const expansionPatternIds = expansionSetIds.flatMap(setId => Array.from({ length: 20 }, (_, i) => `${setId}${String(i + 1).padStart(3, '0')}`));
export const practiceExpansionPatternIds = [
  "XPRCGR004", "XPRCGR005", "XPRCGR006",
  "XPRSPK004", "XPRSPK005", "XPRSPK006",
  "XPRINT004", "XPRINT005", "XPRINT006",
  "XPRREG004", "XPRREG005", "XPRREG006",
  "XPRRTR010", "XPRRTR011", "XPRRTR012",
  "XPRTRN004", "XPRTRN005", "XPRTRN006"
];
const additivePatternIds = [...expansionPatternIds, ...practiceExpansionPatternIds];
const expansionIds = new Set(additivePatternIds);
export const isEstablishedPattern = pattern => !expansionIds.has(pattern.id);
export const expectedPatternCount = frozenCorpus.mergedCorpus.patternCount + additivePatternIds.length;
export const expectedStudySetCount = frozenCorpus.mergedCorpus.studySetCount + expansionSetIds.length;
export const minimumShardCount = frozenCorpus.basePatterns.count + expansionPatternIds.length;
export const canonicalContent = loadContent();
export const canonicalIds = canonicalContent.advancedPatterns.map(pattern => pattern.id).sort();
export const historicalAliases = JSON.parse(fs.readFileSync(new URL('../../data/pattern-aliases.json', import.meta.url), 'utf8')).aliases;

assert.equal(frozenCorpus.mergedCorpus.patternCount, 630, 'Do not silently regenerate the preservation baseline');
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
