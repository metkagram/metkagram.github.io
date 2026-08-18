import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  languageRegistry,
  interfaceLocales,
  learningLanguages,
  translationLocales,
  annotationLanguages,
  getTranslation,
} from "../src/language-registry.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function json(...parts) {
  return JSON.parse(fs.readFileSync(path.join(DIST, ...parts), "utf8"));
}

function html(...parts) {
  return fs.readFileSync(path.join(DIST, ...parts, "index.html"), "utf8");
}

test("language capabilities are independent rather than one global language setting", () => {
  assert.deepEqual(interfaceLocales, ["en", "ru"]);
  assert.deepEqual(learningLanguages, ["en", "de"]);
  assert.deepEqual(translationLocales, ["ru"]);
  assert.deepEqual(annotationLanguages, ["en", "de"]);

  assert.equal(languageRegistry.de.roles.learning, true);
  assert.equal(languageRegistry.de.roles.interface, false);
  assert.equal(languageRegistry.ru.roles.translation, true);
  assert.equal(languageRegistry.ru.roles.learning, false);
  assert.equal(languageRegistry.en.slug, "english");
  assert.equal(languageRegistry.de.slug, "german");
});

test("translation lookup supports future locale maps and legacy translation fields", () => {
  assert.equal(getTranslation({ translations: { ru: "новый формат" } }, "ru"), "новый формат");
  assert.equal(getTranslation({ translation_ru: "старый формат" }, "ru"), "старый формат");
  assert.equal(getTranslation({ translations: { ru: "map wins" }, translation_ru: "legacy" }, "ru"), "map wins");
  assert.equal(getTranslation({ translation_ru: "только русский" }, "de"), null);
});

test("public capability matrix exposes actual supported roles", () => {
  const matrix = json("data", "languages.json");
  assert.equal(matrix.schemaVersion, 1);
  assert.deepEqual(matrix.interfaceLocales, ["en", "ru"]);
  assert.deepEqual(matrix.learningLanguages, ["en", "de"]);
  assert.deepEqual(matrix.translationLocales, ["ru"]);
  assert.deepEqual(matrix.annotationLanguages, ["en", "de"]);
  assert.equal(matrix.languages.ru.roles.annotation, false);
  assert.equal(matrix.languages.de.roles.interface, false);
});

test("canonical terminology is published for humans and machines", () => {
  const terminology = json("data", "terminology.json");
  assert.deepEqual(terminology.canonicalChain, ["Mark", "Frame", "Move", "Contrast", "Choice", "Route", "Bridge"]);
  assert.ok(terminology.surfaces.some((surface) => surface.canonical === "Pattern Choice" && surface.legacy === "Pattern Choice Clinic"));
  assert.ok(terminology.surfaces.some((surface) => surface.canonical === "Pattern Bridge" && surface.legacy === "Cross-language Transfer"));

  for (const locale of ["en", "ru"]) {
    const page = html(locale, "glossary");
    for (const term of terminology.canonicalChain) assert.match(page, new RegExp(term));
    assert.match(page, /Translation ≠ Bridge/);
  }
});

test("method pages connect the visual annotation idea to the canonical vocabulary", () => {
  for (const locale of ["en", "ru"]) {
    const page = html(locale, "method");
    assert.match(page, /data-metkagram-glossary/);
    assert.match(page, /Mark → Frame → Move/);
    assert.match(page, new RegExp(`href="/${locale}/glossary/"`));
  }
});
