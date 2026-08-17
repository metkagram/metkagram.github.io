import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const studyPath = path.resolve('data/research/h1-cue-utility-v1.json');
const study = JSON.parse(fs.readFileSync(studyPath, 'utf8'));

test('H1 pilot definition is frozen, bounded and internally valid', () => {
  assert.equal(study.study_id, 'H1-CUE-UTILITY-V1');
  assert.equal(study.version, '1.0.0');
  assert.deepEqual(study.conditions, ['clean', 'tagged']);
  assert.equal(study.stimuli.length, 8);
  assert.equal(new Set(study.stimuli.map((item) => item.id)).size, 8);
  const roles = new Set(study.stimuli.map((item) => item.target_role));
  assert.deepEqual([...roles].sort(), ['helper', 'main_verb', 'subject']);
  for (const stimulus of study.stimuli) {
    assert.ok(stimulus.prompt);
    assert.ok(Array.isArray(stimulus.chunks) && stimulus.chunks.length >= 4);
    assert.equal(typeof stimulus.comprehension?.answer, 'boolean');
    assert.equal(stimulus.chunks.filter((chunk) => chunk.role === stimulus.target_role).length, 1, `${stimulus.id} must have exactly one target role`);
    for (const chunk of stimulus.chunks) {
      assert.ok(chunk.text);
      assert.ok(chunk.tag);
      assert.ok(chunk.role);
    }
  }
});

test('production build contains H1 pilot routes, runtime and frozen data', () => {
  for (const locale of ['en', 'ru']) {
    const htmlPath = path.resolve('dist', locale, 'research', 'pilot-h1', 'index.html');
    assert.ok(fs.existsSync(htmlPath), `${htmlPath} must exist after build`);
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.match(html, /data-h1-pilot/);
    assert.match(html, /research-pilot-h1\.js/);
    assert.match(html, /research-pilot-h1\.css/);
    assert.match(html, /metkagram-rights/);

    const researchIndex = fs.readFileSync(path.resolve('dist', locale, 'research', 'index.html'), 'utf8');
    assert.match(researchIndex, /data-h1-pilot-link/);
    assert.match(researchIndex, new RegExp(`/${locale}/research/pilot-h1/`));
  }
  const frozen = JSON.parse(fs.readFileSync(path.resolve('dist/data/research/h1-cue-utility-v1.json'), 'utf8'));
  assert.equal(frozen.study_id, study.study_id);
  assert.equal(frozen.version, study.version);
  assert.equal(frozen.stimuli.length, study.stimuli.length);
});

test('H1 browser runtime does not automatically upload participant responses', () => {
  const runtime = fs.readFileSync(path.resolve('public/assets/research-pilot-h1.js'), 'utf8');
  assert.match(runtime, /metkagram:research:h1:v1/);
  assert.match(runtime, /localStorage/);
  assert.doesNotMatch(runtime, /fetch\([^)]*,\s*\{[^}]*method\s*:\s*['"]POST['"]/s);
  assert.doesNotMatch(runtime, /sendBeacon\s*\(/);
  assert.doesNotMatch(runtime, /XMLHttpRequest/);
});
