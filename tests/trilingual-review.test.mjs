import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildPatternReviewDeck } from "../src/render.mjs";
import { patternToCanonicalCards } from "../src/annotation-schema.mjs";
import { patternPath } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

function makePattern({ enTranslation, deTranslation, enCues, deCues }) {
  return {
    id: "TEST001",
    set_id: "ADJ",
    group_id: "ADJ",
    title_ru: "Тестовая подсказка",
    metaphor_ru: "",
    langs: [
      {
        lang: "en",
        formula: "EN formula",
        example: "EN primary",
        translation: enTranslation,
        examples: enCues.map((cue, index) => ({ text: `EN example ${index + 1}`, translation_ru: cue }))
      },
      {
        lang: "de",
        formula: "DE formula",
        example: "DE primary",
        translation: deTranslation,
        examples: deCues.map((cue, index) => ({ text: `DE example ${index + 1}`, translation_ru: cue }))
      }
    ]
  };
}

function deckFor(pattern) {
  return buildPatternReviewDeck(new Map(patternToCanonicalCards(pattern, {}).map((card) => [card.language, card])));
}

test("review deck pairs English and German only on an identical Russian cue", () => {
  const aligned = deckFor(makePattern({
    enTranslation: "Одинаковая подсказка",
    deTranslation: "Одинаковая подсказка",
    enCues: ["Общая 1", "Только английская", "Общая 2"],
    deCues: ["Общая 1", "Общая 2", "Только немецкая"]
  }));
  const trilingual = aligned.filter((entry) => entry.en && entry.de);
  assert.equal(trilingual.length, 3, "primary plus two shared cues form trilingual cards");
  assert.deepEqual(trilingual.map((entry) => entry.cue), ["Одинаковая подсказка", "Общая 1", "Общая 2"]);
  const enOnly = aligned.filter((entry) => entry.en && !entry.de);
  const deOnly = aligned.filter((entry) => !entry.en && entry.de);
  assert.deepEqual(enOnly.map((entry) => entry.cue), ["Только английская"]);
  assert.deepEqual(deOnly.map((entry) => entry.cue), ["Только немецкая"]);
});

test("review deck never pairs by array position", () => {
  const deck = deckFor(makePattern({
    enTranslation: "EN primary cue",
    deTranslation: "DE primary cue",
    enCues: ["cue A", "cue B"],
    deCues: ["cue B", "cue A"]
  }));
  const cards = deck.filter((entry) => entry.cue.startsWith("cue"));
  assert.equal(cards.length, 2);
  for (const entry of cards) {
    assert.equal(entry.en.text.replaceAll("**", "").includes(entry.cue === "cue A" ? "1" : "2"), true, `${entry.cue} keeps its own English sentence`);
    assert.equal(entry.de.text.replaceAll("**", "").includes(entry.cue === "cue A" ? "2" : "1"), true, `${entry.cue} keeps its own German sentence`);
  }
});

test("review deck covers every example exactly once and keeps English order", () => {
  const pattern = makePattern({
    enTranslation: "shared primary",
    deTranslation: "shared primary",
    enCues: ["c1", "c2", "c3"],
    deCues: ["c2", "c4"]
  });
  const deck = deckFor(pattern);
  const seen = [];
  for (const entry of deck) {
    if (entry.en?.id) seen.push(entry.en.id);
    if (entry.de?.id) seen.push(entry.de.id);
  }
  assert.equal(new Set(seen).size, seen.length, "no example appears twice");
  assert.equal(deck.length, 1 + 3 + 1, "primary card plus three EN cues plus one DE-only cue");
  const enOrder = deck.filter((entry) => entry.en).map((entry) => entry.cue);
  assert.deepEqual(enOrder, ["shared primary", "c1", "c2", "c3"]);
});

const ALIGNED_PATTERN = { id: "FUNCMT021", slugPath: "/en/practice/patterns/i-can-confirm-that-we-will-act-if-the-team-needs-funcmt021/" };
const UNPAIRED_PATTERN = { id: "FUNADV001", slugPath: "/en/practice/patterns/i-would-recommend-checking-whether-the-team-funadv001/" };

test("built pattern page initializes the review on the Russian cue with hidden answers", () => {
  const html = read(path.join("dist", ALIGNED_PATTERN.slugPath, "index.html"));
  assert.match(html, /data-pattern-review/);
  assert.match(html, /<article class="review-card" data-review-card data-stages="cue en de" data-active>/, "first card starts at the Russian cue");
  const firstCard = html.split('data-active>')[1].split("</article>")[0];
  assert.match(firstCard, /<div class="review-cue"><span class="review-lang-label">RU · Cue<\/span><p lang="ru">/);
  const answers = firstCard.match(/data-review-answer="(en|de)"/g) || [];
  assert.deepEqual(answers, ['data-review-answer="en"', 'data-review-answer="de"'], "both versions present in markup");
  assert.doesNotMatch(firstCard, /data-revealed/, "answers start hidden for the staged reveal");
  assert.match(firstCard, />Show English</, "initial action offers the English reveal");
  assert.match(html, /document\.documentElement\.classList\.add\("js"\)/, "no-flash enhancement flag");
  assert.ok(html.indexOf('id="pattern-review"') < html.indexOf('class="pattern-full"'), "review card comes before the full pattern content");
  assert.ok(html.indexOf('class="pattern-full"') < html.indexOf('class="pattern-comparison"'), "complete formulas and variations stay on the page");
});

test("built pattern page labels next example and next pattern honestly", () => {
  const html = read(path.join("dist", ALIGNED_PATTERN.slugPath, "index.html"));
  assert.match(html, /data-label-next="Next example"/, "mid-deck cards advance to the next example");
  assert.match(html, /data-label-next="Next pattern" data-review-goto|data-review-goto="[^"]+" data-label-en="Show English" data-label-de="Show German" data-label-next="Next pattern"/, "last card advances to the next pattern");
  const goto = html.match(/data-review-goto="([^"]+)"/);
  assert.ok(goto, "next pattern link present");
  assert.match(goto[1], /^\/en\/practice\/patterns\/[^/]+\/$/);
  assert.ok(fs.existsSync(path.join(ROOT, "dist", goto[1], "index.html")), "next pattern route exists");
  assert.match(html, /Example 1 of \d+/, "position indicator distinguishes examples");
  assert.match(html, /class="review-legend"/, "annotation label legend nearby");
  assert.match(html, /Try saying it in English before revealing the example/);
});

test("unpaired examples stay accessible with an honest missing-language note", () => {
  const html = read(path.join("dist", UNPAIRED_PATTERN.slugPath, "index.html"));
  assert.match(html, /data-review-missing="de"/, "cards without a verified German version say so");
  const missingCards = html.match(/data-stages="cue en"/g) || [];
  assert.ok(missingCards.length > 0, "EN-only cards skip the German reveal step");
  assert.match(html, /see the German examples in the full list below/, "limitation is explained, not a loading error");
});

test("pattern page keeps the complete corpus content below the review card", () => {
  const html = read(path.join("dist", ALIGNED_PATTERN.slugPath, "index.html"));
  assert.match(html, /class="pattern-reference-card"/, "formulas preserved");
  assert.match(html, /class="pattern-variations"/, "all variations preserved");
  const rows = html.match(/<li class="pattern-comparison-card">/g) || [];
  assert.equal(rows.length, 10, "all ten variation rows remain");
  assert.match(html, /data-pattern-id="FUNCMT021"/);
  assert.match(html, /class="review-sibling-nav"/);
  assert.match(html, /href="\/en\/practice\/sets\//, "back to set link");
});

test("patternPath keeps review test fixtures stable", () => {
  assert.equal(patternPath("en", { id: ALIGNED_PATTERN.id }), ALIGNED_PATTERN.slugPath);
  assert.equal(patternPath("en", { id: UNPAIRED_PATTERN.id }), UNPAIRED_PATTERN.slugPath);
});
