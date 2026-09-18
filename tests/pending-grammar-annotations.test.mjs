import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { loadContent } from '../src/content.mjs';
import { cleanMarkedText, patternToCanonicalCards } from '../src/annotation-schema.mjs';

const payload = JSON.parse(zlib.gunzipSync(fs.readFileSync('data/pattern-annotations.json.gz')).toString('utf8'));
const additions = loadContent().advancedPatterns.filter(p => /^GF[A-O]\d{3}$/.test(p.id));

test('pending grammar annotations remain explicitly unannotated with current text fingerprints', () => {
  for (const pattern of additions) for (const language of pattern.langs) {
    const examples = [{ key: 'primary', text: language.example }, ...language.examples.map((example, index) => ({ key: String(index + 1), text: example.text }))];
    for (const example of examples) {
      const key = `${pattern.id}:${language.lang}:${example.key}`;
      const record = payload.items[key];
      assert.ok(record, `${key}: no annotation transport record`);
      assert.equal(record.text, cleanMarkedText(example.text));
      if (record.validation?.status !== 'pending') continue;
      assert.deepEqual(record.spans, [], `${key}: pending annotation must not contain fabricated Marks`);
      assert.equal(record.validation.needs_rebuild, true);
      assert.equal(record.validation.generator, 'none');
      assert.equal(record.validation.text_sha256, crypto.createHash('sha256').update(record.text, 'utf8').digest('hex'));
    }
  }
});

test('canonical cards preserve pending status instead of claiming completed annotation', () => {
  for (const pattern of additions) {
    for (const card of patternToCanonicalCards(pattern, payload.items)) {
      const primary = payload.items[`${pattern.id}:${card.language}:primary`];
      if (primary.validation?.status === 'pending') {
        assert.equal(card.validation.status, 'pending');
        assert.deepEqual(card.spans, []);
      }
      for (const [index, example] of card.examples.entries()) {
        const record = payload.items[`${pattern.id}:${card.language}:${index + 1}`];
        if (record.validation?.status === 'pending') assert.equal(example.validation.status, 'pending');
      }
    }
  }
});
