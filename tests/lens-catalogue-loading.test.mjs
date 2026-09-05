import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

test("Pattern Lens lazily upgrades from the inline starter set to the curated catalogue", () => {
  const source = read("public/assets/pattern-lens.js");
  assert.match(source, /fetch\("\/data\/pattern-lens-patterns\.json"\)/);
  assert.match(source, /if \(cataloguePromise\) return cataloguePromise/);
  assert.match(source, /catalogue\.filter\(validCataloguePattern\)/);
  assert.match(source, /if \(valid\.length > patterns\.length\) patterns = valid/);
  assert.match(source, /\.catch\(\(\) => patterns\)/);
  assert.doesNotMatch(source, /advanced-patterns\.json/);
});

test("generated curated Lens catalogue is meaningfully larger than the inline starter set but remains bounded", () => {
  const catalogue = JSON.parse(read("dist/data/pattern-lens-patterns.json"));
  const enHtml = read("dist/en/lens/index.html");
  const payloadMatch = enHtml.match(/<script type="application\/json" id="pattern-lens-data">([^<]+)<\/script>/);
  assert.ok(payloadMatch, "Lens page must expose its inline starter payload");
  const payload = JSON.parse(payloadMatch[1]);
  assert.equal(payload.catalogue.length, 18);
  assert.ok(catalogue.length > payload.catalogue.length, `expected curated catalogue larger than ${payload.catalogue.length}, found ${catalogue.length}`);
  assert.ok(catalogue.length <= 96, `curated browser catalogue must stay bounded, found ${catalogue.length}`);
  assert.ok(Buffer.byteLength(JSON.stringify(catalogue)) < 500_000, "curated catalogue must remain lightweight for browser loading");
});

test("curated Lens catalogue records have the minimum browser-safe shape", () => {
  const catalogue = JSON.parse(read("dist/data/pattern-lens-patterns.json"));
  assert.ok(catalogue.every((pattern) => typeof pattern.id === "string" && pattern.id.length > 0));
  assert.ok(catalogue.every((pattern) => Array.isArray(pattern.langs) && pattern.langs.some((item) => item.lang && item.formula && item.example)));
});
