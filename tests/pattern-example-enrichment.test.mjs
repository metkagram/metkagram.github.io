import test from 'node:test';
import assert from 'node:assert/strict';
import { hasPendingExampleEnrichment, pendingExampleEnrichmentInventory } from '../src/pattern-example-enrichment.mjs';
import { loadContent } from '../src/content.mjs';
import { loadEditorialCorpus } from '../src/pattern-sources.mjs';
import { expansionPatternIds } from './helpers/curriculum-contract.mjs';

const exampleLanguage = count => ({ lang: 'en', example: 'A primary example.', examples: Array.from({ length: count }, (_, index) => ({ text: `Example ${index}.` })) });

test('the temporary enrichment ledger covers exactly the approved 300 patterns', () => {
  const ledger = pendingExampleEnrichmentInventory();
  assert.deepEqual([...ledger.patternIds].sort(), [...expansionPatternIds].sort());
  const patterns = loadEditorialCorpus().patterns;
  for (const pattern of patterns) for (const language of pattern.langs) {
    if (language.examples.length >= 5 && language.examples.length <= 7) continue;
    assert.ok(hasPendingExampleEnrichment(pattern, language), `${pattern.id}/${language.lang}: unregistered example debt`);
    assert.equal(language.examples.length + 1, 3);
    assert.equal(new Set([language.example, ...language.examples.map(example => example.text)]).size, 3);
  }
});

test('pending enrichment never licenses unrelated patterns, languages or arbitrary undersized counts', () => {
  const pattern = { id: 'GFA001', set_id: 'GFA' };
  assert.equal(hasPendingExampleEnrichment(pattern, exampleLanguage(2)), true);
  for (const count of [0, 1, 3, 4, 5, 7, 8]) assert.equal(hasPendingExampleEnrichment(pattern, exampleLanguage(count)), false);
  for (const other of [{ id: 'CON001', set_id: 'CON' }, { id: 'GFA021', set_id: 'GFA' }, { id: 'GFA001', set_id: 'OTHER' }]) {
    assert.equal(hasPendingExampleEnrichment(other, exampleLanguage(2)), false);
  }
  assert.equal(hasPendingExampleEnrichment(pattern, { ...exampleLanguage(2), lang: 'fr' }), false);
  assert.equal(hasPendingExampleEnrichment(pattern, { ...exampleLanguage(2), example: '' }), false);
});

test('editorial tooling includes registered extension study sets', () => {
  assert.deepEqual(loadEditorialCorpus().setOrder, loadContent().studySets.sets.map(set => set.id));
});
