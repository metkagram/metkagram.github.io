import fs from "node:fs";
import path from "node:path";
import { collectionKeys, targetMeta } from "./i18n.mjs";

const ROOT = process.cwd();

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(`Content validation failed: ${message}`);
}

function validateDocument(doc, file, index) {
  assert(doc && typeof doc === "object", `${file}[${index}] must be an object`);
  assert(typeof doc.id === "string" && doc.id.length > 0, `${file}[${index}].id is required`);
  assert(typeof doc.title === "string" && doc.title.trim(), `${file}[${index}].title is required`);
  assert(Array.isArray(doc.annotations), `${file}[${index}].annotations must be an array`);
  for (const [annotationIndex, annotation] of doc.annotations.entries()) {
    assert(typeof annotation.id === "string", `${file}[${index}].annotations[${annotationIndex}].id is required`);
    assert(typeof annotation.original_text === "string", `${file}[${index}].annotations[${annotationIndex}].original_text is required`);
    assert(annotation.text_span && typeof annotation.text_span === "object", `${file}[${index}].annotations[${annotationIndex}].text_span is required`);
  }
}

function validatePattern(pattern, index, validSetIds) {
  assert(typeof pattern.id === "string" && pattern.id, `advanced-patterns[${index}].id is required`);
  assert(typeof pattern.title_ru === "string" && pattern.title_ru, `advanced-patterns[${index}].title_ru is required`);
  assert(typeof pattern.group_id === "string" && pattern.group_id, `advanced-patterns[${index}].group_id is required`);
  assert(typeof pattern.set_id === "string" && validSetIds.has(pattern.set_id), `advanced-patterns[${index}].set_id is not a valid study set`);
  assert(Array.isArray(pattern.langs) && pattern.langs.length > 0, `advanced-patterns[${index}].langs is required`);
  assert(new Set(pattern.langs.map((lang) => lang.lang)).size === 2, `advanced-patterns[${index}] must include English and German`);
  for (const [langIndex, lang] of pattern.langs.entries()) {
    assert(["en", "de"].includes(lang.lang), `advanced-patterns[${index}].langs[${langIndex}].lang is invalid`);
    assert(typeof lang.formula === "string" && lang.formula.trim(), `advanced-patterns[${index}].langs[${langIndex}].formula is required`);
    assert(typeof lang.example === "string" && lang.example.trim(), `advanced-patterns[${index}].langs[${langIndex}].example is required`);
    assert(typeof lang.translation === "string" && lang.translation.trim(), `advanced-patterns[${index}].langs[${langIndex}].translation is required`);
    assert(Array.isArray(lang.examples) && lang.examples.length >= 2, `advanced-patterns[${index}].langs[${langIndex}].examples requires at least two variations`);
    for (const example of lang.examples) assert(typeof example.text === "string" && example.text.trim() && typeof example.translation_ru === "string" && example.translation_ru.trim(), `advanced-patterns[${index}].langs[${langIndex}].examples must be complete`);
  }
}

export function loadContent() {
  const collections = {};
  const seenDocumentIds = new Set();
  for (const target of Object.values(targetMeta)) {
    collections[target.key] = {};
    for (const collection of collectionKeys) {
      const base = path.join(ROOT, "data", "metkagram-export", target.gram, collection);
      const indexFile = path.join(base, "data.json");
      const documentsFile = path.join(base, "documents.json");
      const indexData = readJson(indexFile);
      const items = indexData?.[0]?.items;
      const documents = readJson(documentsFile);
      assert(Array.isArray(items), `${indexFile} must contain items`);
      assert(Array.isArray(documents), `${documentsFile} must be an array`);
      assert(items.length === documents.length, `${target.key}/${collection}: index has ${items.length} items but documents has ${documents.length}`);
      const itemRefs = new Set(items.map((item) => item.refId));
      for (const [index, doc] of documents.entries()) {
        validateDocument(doc, documentsFile, index);
        assert(!seenDocumentIds.has(`${target.key}:${collection}:${doc.id}`), `duplicate document id ${doc.id}`);
        seenDocumentIds.add(`${target.key}:${collection}:${doc.id}`);
        assert(itemRefs.has(doc.id) || itemRefs.has(doc.refId), `${target.key}/${collection}: document ${doc.id} is missing from index`);
      }
      collections[target.key][collection] = { items, documents };
    }
  }

  const advancedPatterns = readJson(path.join(ROOT, "data", "advanced-patterns.json"));
  const studySets = readJson(path.join(ROOT, "data", "study-sets.json"));
  assert(Array.isArray(advancedPatterns), "advanced-patterns.json must be an array");
  assert(Array.isArray(studySets.sets) && studySets.sets.length > 0, "study-sets.json must contain sets");
  const validSetIds = new Set(studySets.sets.map((set) => set.id));
  assert(validSetIds.size === studySets.sets.length, "study set IDs must be unique");
  assert(Array.isArray(studySets.learningPaths) && studySets.learningPaths.length > 0, "study-sets.json must contain learning paths");
  for (const pathItem of studySets.learningPaths) for (const setId of pathItem.set_ids || []) assert(validSetIds.has(setId), `learning path ${pathItem.id} references an unknown set ${setId}`);
  assert(advancedPatterns.length >= 1000, `advanced-patterns.json requires at least 1,000 patterns; found ${advancedPatterns.length}`);
  const patternIds = new Set();
  const formulas = new Set();
  advancedPatterns.forEach((pattern, index) => {
    validatePattern(pattern, index, validSetIds);
    assert(!patternIds.has(pattern.id.toLowerCase()), `duplicate advanced pattern id ${pattern.id}`);
    patternIds.add(pattern.id.toLowerCase());
    for (const lang of pattern.langs) {
      const formula = lang.formula.trim().toLocaleLowerCase();
      assert(!formulas.has(formula), `duplicate advanced pattern formula ${lang.formula}`);
      formulas.add(formula);
    }
  });
  for (const set of studySets.sets) assert(advancedPatterns.some((pattern) => pattern.set_id === set.id), `study set ${set.id} has no complete patterns`);

  return { collections, advancedPatterns, studySets };
}

export function contentCounts(content) {
  const counts = { annotatedDocuments: 0, annotatedSentences: 0, advancedPatterns: content.advancedPatterns.length };
  for (const targetCollections of Object.values(content.collections)) {
    for (const collection of Object.values(targetCollections)) {
      counts.annotatedDocuments += collection.documents.length;
      counts.annotatedSentences += collection.documents.reduce((sum, doc) => sum + doc.annotations.length, 0);
    }
  }
  return counts;
}
