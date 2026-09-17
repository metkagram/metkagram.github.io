import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePracticeStructure, literalPracticeSegments, nextPracticeReview } from '../public/assets/practice-loop-core.js';
import {
  PATTERN_PROGRESS_STORAGE_KEY,
  emptyPatternProgressState,
  isPatternCompleted,
  patternProgressSummary,
  setPatternCompleted,
} from '../public/assets/pattern-progress-core.js';
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

test('keeps lightweight pattern completion separate from practice mastery', () => {
  const initial = emptyPatternProgressState();
  const first = setPatternCompleted(initial, 'cla002', true, '2026-09-17T12:00:00.000Z');
  const second = setPatternCompleted(first, 'CLF041', true, '2026-09-17T13:00:00.000Z');

  assert.equal(PATTERN_PROGRESS_STORAGE_KEY, 'metkagram:pattern-progress:v1');
  assert.equal(isPatternCompleted(second, 'CLA002'), true);
  assert.equal(isPatternCompleted(second, 'clf041'), true);
  assert.deepEqual(patternProgressSummary(second), {
    completedCount: 2,
    recentlyCompleted: [
      { patternId: 'CLF041', updatedAt: '2026-09-17T13:00:00.000Z' },
      { patternId: 'CLA002', updatedAt: '2026-09-17T12:00:00.000Z' },
    ],
  });

  const cleared = setPatternCompleted(second, 'CLA002', false, '2026-09-17T14:00:00.000Z');
  assert.equal(isPatternCompleted(cleared, 'CLA002'), false);
  assert.equal(patternProgressSummary(cleared).completedCount, 1);
});

test('pattern reader assets keep the requested reading contract', () => {
  const css = fs.readFileSync(path.resolve('public/assets/pattern-reading.css'), 'utf8');
  const js = fs.readFileSync(path.resolve('public/assets/pattern-reading.js'), 'utf8');
  const progressCore = fs.readFileSync(path.resolve('public/assets/pattern-progress-core.js'), 'utf8');

  assert.match(css, /--reader-page:\s*#fbfaf7/);
  assert.match(css, /body\.pattern-reader-body \.pattern-page[\s\S]*width:\s*calc\(100vw - 2rem\)[\s\S]*max-width:\s*none/);
  assert.match(css, /\.pattern-comparison-list \.pattern-comparison-language p[\s\S]*max-width:\s*none/);
  assert.match(css, /font-size:\s*1\.375rem/);
  assert.match(css, /transition:\s*none/);
  assert.match(css, /data-pattern-language-mode="en"/);
  assert.match(css, /pattern-reader-control-group/);
  assert.match(js, /Только английский/);
  assert.match(js, /English only/);
  assert.match(js, /Отметить пройденным/);
  assert.match(js, /Mark complete/);
  assert.match(js, /document\.modelContext/);
  assert.match(js, /metkagram_get_pattern_progress/);
  assert.match(js, /metkagram_set_pattern_progress/);
  assert.match(js, /metkagram_get_progress_summary/);
  assert.match(js, /data-pattern-progress-toggle/);
  assert.match(progressCore, /metkagram:pattern-progress:v1/);
});

test('production build keeps active practice off pattern pages and applies reader assets', (t) => {
  const dist = path.resolve('dist');
  const practiceIndex = path.join(dist, 'en', 'practice', 'index.html');
  if (!fs.existsSync(practiceIndex)) return t.skip('requires npm run build first');

  assert.match(fs.readFileSync(practiceIndex, 'utf8'), /\/assets\/practice-loop\.js/);

  const patternHtml = fs.readFileSync(path.join(dist, patternPath('en', 'CLF041').slice(1), 'index.html'), 'utf8');
  assert.doesNotMatch(patternHtml, /\/assets\/practice-loop\.js/);
  assert.match(patternHtml, /\/assets\/pattern-reading\.css/);
  assert.match(patternHtml, /\/assets\/pattern-reading\.js/);
  assert.match(patternHtml, /data-pattern-id="CLF041"/);
  assert.equal(fs.existsSync(path.join(dist, 'assets', 'pattern-reading.css')), true);
  assert.equal(fs.existsSync(path.join(dist, 'assets', 'pattern-reading.js')), true);
  assert.equal(fs.existsSync(path.join(dist, 'assets', 'pattern-progress-core.js')), true);

  const lensHtml = fs.readFileSync(path.join(dist, 'en', 'lens', 'index.html'), 'utf8');
  assert.match(lensHtml, /\/assets\/lens-practice-bridge\.js/);
});
