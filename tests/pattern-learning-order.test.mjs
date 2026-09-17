import test from "node:test";
import assert from "node:assert/strict";
import { reorderPatternLearningCard } from "../scripts/pattern-learning-order.mjs";

test("Pattern cards render the Russian cue before English and German", () => {
  const source = `<li class="pattern-comparison-card"><div class="pattern-comparison-sentences"><div class="pattern-comparison-language" data-target-language="en"><p>English</p></div><div class="pattern-comparison-language" data-target-language="de"><p>Deutsch</p></div></div><div class="pattern-comparison-translation" data-native-translation hidden><span class="language-code">RU · Перевод</span><p lang="ru">Русский</p></div></li>`;
  const { html, changed } = reorderPatternLearningCard(source);

  assert.equal(changed, 1);
  const russian = html.indexOf('class="pattern-comparison-translation"');
  const english = html.indexOf('data-target-language="en"');
  const german = html.indexOf('data-target-language="de"');
  assert.ok(russian !== -1 && russian < english && english < german);
  assert.doesNotMatch(html, /pattern-comparison-translation" data-native-translation hidden/);
});

test("The ordering pass leaves unrelated native-language content unchanged", () => {
  const source = `<div class="native-pattern-description" data-native-translation hidden><p lang="ru">Пояснение</p></div>`;
  const { html, changed } = reorderPatternLearningCard(source);

  assert.equal(changed, 0);
  assert.equal(html, source);
});
