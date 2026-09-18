import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeoSlugRegistry } from '../scripts/generate-seo-slugs.mjs';

const content = {
  studySets: { sets: [{ id: 'OLD', title_en: 'A revised title' }, { id: 'NEW', title_en: 'New grammar set' }] },
  advancedPatterns: [
    { id: 'P1', langs: [{ lang: 'en', formula: 'A revised formula' }] },
    { id: 'P3', langs: [{ lang: 'en', formula: 'New grammar construction' }] }
  ]
};

test('slug generation preserves historical aliases and frozen names while adding new routes', () => {
  const existing = { studySets: { OLD: 'frozen-set-title', RETIRED: 'historical-set-route' }, patterns: { P1: 'frozen-pattern', P2: 'historical-contextual-alias' } };
  const before = structuredClone(existing);
  const result = buildSeoSlugRegistry(content, existing);
  assert.equal(result.studySets.OLD, 'frozen-set-title');
  assert.equal(result.studySets.RETIRED, 'historical-set-route');
  assert.equal(result.studySets.NEW, 'new-grammar-set');
  assert.equal(result.patterns.P1, 'frozen-pattern');
  assert.equal(result.patterns.P2, 'historical-contextual-alias');
  assert.equal(result.patterns.P3, 'new-grammar-construction');
  assert.deepEqual(existing, before, 'generation must not mutate its input registry');
  assert.deepEqual(buildSeoSlugRegistry(content, result), result, 'repeat generation must be idempotent');
});

test('invalid current frozen slugs still fail rather than silently changing public URLs', () => {
  assert.throws(() => buildSeoSlugRegistry(content, { studySets: { OLD: 'Invalid Slug' }, patterns: {} }), /Invalid generated SEO slug/);
});
