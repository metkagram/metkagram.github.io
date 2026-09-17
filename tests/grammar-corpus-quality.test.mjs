import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../src/content.mjs';

const content = loadContent();
const normalize = (value) => String(value).replaceAll('**', '').replace(/\s+/g, ' ').trim().toLowerCase();

test('every public pattern has examples and Russian learner translations', () => {
  let examples = 0;
  for (const pattern of content.advancedPatterns) {
    for (const lang of pattern.langs) {
      const all = [{ text: lang.example, translation_ru: lang.translation }, ...lang.examples];
      assert.ok(all.length >= 3, `${pattern.id}/${lang.lang}: fewer than three examples`);
      assert.ok(new Set(all.map((item) => normalize(item.text))).size >= 3, `${pattern.id}/${lang.lang}: fewer than three distinct examples`);
      for (const item of all) {
        assert.ok(item.text.trim(), `${pattern.id}/${lang.lang}: missing example`);
        assert.ok(item.translation_ru.trim(), `${pattern.id}/${lang.lang}: missing Russian translation`);
      }
      examples += all.length;
    }
  }
  console.log(`GRAMMAR_AUDIT patterns=${content.advancedPatterns.length} sets=${content.studySets.sets.length} language_examples=${examples}`);
});

// Temporary compact inventory for the editorial expansion; remove before publication.
test('inventory existing canonical English grammar frames', () => {
  for (const p of content.advancedPatterns) {
    console.log('FRAME ' + p.id + ' | ' + p.set_id + ' | ' + p.langs.find((l) => l.lang === 'en').formula);
  }
});
