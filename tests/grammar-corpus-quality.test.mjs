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

test('the grammar-flexibility expansion publishes all 400 patterns in 20 registered sets', () => {
  const additions = content.advancedPatterns.filter((pattern) => /^GF[A-O]\d{3}$/.test(pattern.id));
  assert.equal(additions.length, 400);
  for (const suffix of 'ABCDEFGHIJKLMNOPQRST') {
    const id = `GF${suffix}`;
    assert.ok(content.studySets.sets.some((set) => set.id === id), `${id}: missing study set`);
    const patterns = additions.filter((pattern) => pattern.set_id === id);
    assert.equal(patterns.length, 20, `${id}: missing patterns`);
    for (const pattern of patterns) {
      assert.equal(pattern.group_id, id);
      assert.match(pattern.title_ru, /\p{Script=Cyrillic}/u);
      assert.deepEqual(pattern.langs.map((lang) => lang.lang).sort(), ['de', 'en']);
      for (const lang of pattern.langs) {
        const all = [{ text: lang.example, translation_ru: lang.translation }, ...lang.examples];
        assert.equal(new Set(all.map((item) => normalize(item.text))).size, all.length, `${pattern.id}/${lang.lang}: duplicate examples`);
        for (const example of all) assert.match(example.translation_ru, /\p{Script=Cyrillic}/u);
      }
    }
  }
});
