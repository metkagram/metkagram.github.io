import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const source = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "contrasts.json"), "utf8"));
const patterns = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "advanced-patterns.json"), "utf8"));
const patternIds = new Set(patterns.map((pattern) => pattern.id));

const STORE_URLS = [
  "https://play.google.com/store/apps/details?id=app.metkagram.android",
  "https://apps.apple.com/us/app/grammar-cards-ai-tutor/id6502211918",
];

test("contrast records are reviewed, bilingual and anchored to canonical patterns", () => {
  assert.equal(source.schemaVersion, 1);
  assert.ok(source.items.length >= 3);
  const ids = new Set();
  for (const item of source.items) {
    assert.ok(item.id);
    assert.equal(ids.has(item.id), false, `duplicate contrast ${item.id}`);
    ids.add(item.id);
    assert.equal(item.review_status, "reviewed");
    assert.equal(item.patterns.length, 2);
    assert.notEqual(item.patterns[0], item.patterns[1]);
    for (const patternId of item.patterns) assert.equal(patternIds.has(patternId), true, `${patternId} must exist`);
    for (const field of ["title_en", "title_ru", "question_en", "question_ru", "distinction_en", "distinction_ru"]) {
      assert.ok(item[field]?.trim(), `${item.id} missing ${field}`);
    }
  }
});

test("contrast build publishes localized pages and machine-readable data", () => {
  const api = JSON.parse(fs.readFileSync(path.join(ROOT, "dist", "api", "v1", "contrasts.json"), "utf8"));
  assert.equal(api.data.items.length, source.items.length);

  for (const locale of ["en", "ru"]) {
    const index = fs.readFileSync(path.join(ROOT, "dist", locale, "contrasts", "index.html"), "utf8");
    assert.match(index, new RegExp(`/${locale}/contrasts/${source.items[0].id}/`));
    for (const item of source.items) {
      const detail = fs.readFileSync(path.join(ROOT, "dist", locale, "contrasts", item.id, "index.html"), "utf8");
      for (const patternId of item.patterns) assert.match(detail, new RegExp(`/${locale}/practice/${patternId.toLowerCase()}/`));
    }
  }
});

test("archived mobile store links and MobileApplication schema are absent from active output", () => {
  for (const locale of ["en", "ru"]) {
    for (const relative of ["index.html", path.join("apps", "index.html"), path.join("contrasts", "index.html")]) {
      const html = fs.readFileSync(path.join(ROOT, "dist", locale, relative), "utf8");
      for (const url of STORE_URLS) assert.equal(html.includes(url), false, `${url} leaked into ${locale}/${relative}`);
      assert.equal(html.includes('"MobileApplication"'), false, `MobileApplication schema leaked into ${locale}/${relative}`);
    }
  }
});
