import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { patternPath } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

const source = readJson("data/russian-speaker-errors.json");
const extension = readJson("data/reasoning-frames/russian-transfer-extension-v2.json");

test("Russian-speaker error map is reviewed and linked to unique practice objects", () => {
  assert.equal(source.schemaVersion, 1);
  assert.equal(source.status, "reviewed-pilot");
  assert.equal(source.items.length, 9);
  assert.equal(new Set(source.items.map((item) => item.id)).size, source.items.length);
  assert.equal(new Set(source.items.map((item) => item.slug)).size, source.items.length);

  const extensionIds = new Set(extension.map((pattern) => pattern.id));
  for (const item of source.items) {
    assert.match(item.pattern_id, /^XPRRTR\d{3}$/);
    if (Number(item.pattern_id.slice(-3)) >= 4) assert.ok(extensionIds.has(item.pattern_id));
    assert.ok(item.wrong_en.trim());
    assert.ok(item.correct_en.trim());
    assert.ok(item.why_en.trim());
    assert.ok(item.why_ru.trim());
  }
});

test("Russian transfer extension satisfies bilingual practice contracts", () => {
  assert.equal(extension.length, 6);
  for (const pattern of extension) {
    assert.equal(pattern.set_id, "RTR");
    assert.equal(pattern.group_id, "RTR");
    assert.equal(pattern.practice?.audience, "Russian speakers");
    assert.deepEqual(new Set(pattern.langs.map((item) => item.lang)), new Set(["en", "de"]));
    for (const language of pattern.langs) {
      assert.ok(language.formula.trim());
      assert.ok(language.example.trim());
      assert.ok(language.translation.trim());
      assert.ok(language.examples.length >= 2);
      for (const example of language.examples) {
        assert.ok(example.text.trim());
        assert.ok(example.translation_ru.trim());
      }
    }
  }
});

test("build publishes localized transfer pages, API, sitemap routes and practice backlinks", () => {
  const sitemap = read("dist/sitemap.xml");
  const hubEn = read("dist/en/mistakes/russian-speakers/index.html");
  const hubRu = read("dist/ru/mistakes/russian-speakers/index.html");
  assert.match(hubEn, /Common English mistakes Russian speakers make/);
  assert.match(hubRu, /Типичные ошибки русскоязычных/);

  for (const item of source.items) {
    for (const locale of ["en", "ru"]) {
      const route = `/${locale}/mistakes/russian-speakers/${item.slug}/`;
      const page = read(`dist${route}index.html`);
      assert.ok(page.includes(item.wrong_en));
      assert.ok(page.includes(item.correct_en));
      assert.ok(sitemap.includes(`<loc>https://metkagram.github.io${route}</loc>`));

      const patternPage = read(`dist${patternPath(locale, item.pattern_id)}index.html`);
      assert.ok(patternPage.includes(route));
    }
  }

  const api = readJson("dist/api/v1/russian-speaker-errors.json");
  assert.equal(api.data.items.length, source.items.length);
  assert.equal(api.provenance.record_type, "l1_transfer_error_collection");
  assert.equal(readJson("dist/api/v1/index.json").counts.russianSpeakerErrors, source.items.length);
  assert.ok(read("dist/llms.txt").includes("## Russian-speaker transfer errors"));
});
