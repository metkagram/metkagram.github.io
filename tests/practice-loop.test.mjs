import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePracticeStructure, literalPracticeSegments, nextPracticeReview } from '../public/assets/practice-loop-core.js';
import { patternPath } from '../src/seo-slugs.mjs';

test('extracts stable formula segments without placeholders', () => {
  assert.deepEqual(
    literalPracticeSegments('[X] is necessary but not sufficient for [Y].'),
    ['is necessary but not sufficient for']
  );
  assert.deepEqual(
    literalPracticeSegments('Without [X], [Y] cannot [V].'),
    ['Without', 'cannot']
  );
});

test('detects a reusable frame without pretending to grade grammar', () => {
  const result = evaluatePracticeStructure(
    'Clean data is necessary but not sufficient for reliable automation.',
    '[X] is necessary but not sufficient for [Y].'
  );
  assert.equal(result.status, 'detected');
  assert.equal(result.coverage, 1);
});

test('returns a conservative partial or missing signal', () => {
  const partial = evaluatePracticeStructure(
    'Without stable identifiers, reliable matching is difficult.',
    'Without [X], [Y] cannot [V].'
  );
  assert.equal(partial.status, 'partial');
  assert.deepEqual(partial.hits, ['Without']);

  const missing = evaluatePracticeStructure(
    'Stable identifiers improve matching.',
    'Without [X], [Y] cannot [V].'
  );
  assert.equal(missing.status, 'not-detected');
});

test('schedules needs-work sooner and expands successful review intervals', () => {
  const now = Date.UTC(2026, 7, 17, 12, 0, 0);
  const retry = nextPracticeReview(null, 'needs-work', now);
  assert.equal(retry.intervalDays, 1);
  assert.equal(retry.streak, 0);
  assert.equal(new Date(retry.dueAt).getTime(), now + 24 * 60 * 60 * 1000);

  const firstSuccess = nextPracticeReview(null, 'got-it', now);
  assert.equal(firstSuccess.intervalDays, 3);
  assert.equal(firstSuccess.streak, 1);

  const laterSuccess = nextPracticeReview({ intervalDays: 6, streak: 2 }, 'got-it', now);
  assert.equal(laterSuccess.intervalDays, 12);
  assert.equal(laterSuccess.streak, 3);
});

test('production build wires practice and Lens bridge into generated pages', (t) => {
  const dist = path.resolve('dist');
  const practiceIndex = path.join(dist, 'en', 'practice', 'index.html');
  if (!fs.existsSync(practiceIndex)) return t.skip('requires npm run build first');

  assert.match(fs.readFileSync(practiceIndex, 'utf8'), /\/assets\/practice-loop\.js/);

  const patternHtml = fs.readFileSync(path.join(dist, patternPath('en', 'CLF041').slice(1), 'index.html'), 'utf8');
  assert.match(patternHtml, /\/assets\/practice-loop\.js/);
  assert.match(patternHtml, /data-pattern-id="CLF041"/);

  const lensHtml = fs.readFileSync(path.join(dist, 'en', 'lens', 'index.html'), 'utf8');
  assert.match(lensHtml, /\/assets\/lens-practice-bridge\.js/);
});
