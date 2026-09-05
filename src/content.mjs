import fs from "node:fs";
import path from "node:path";
import { collectionKeys, targetMeta } from "./i18n.mjs";
import { loadPatternShards } from "./pattern-sources.mjs";
import { corpusLanguages } from "./release.mjs";
import { attachFrameFamilies } from "./frame-families.mjs";

const ROOT = process.cwd();
const PRACTICE_QUALITY_SET_IDS = new Set(["CGR", "SPK", "INT", "REG", "RTR", "TRN"]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(`Content validation failed: ${message}`);
}

function readJsonDirectory(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .flatMap((name) => {
      const file = path.join(directory, name);
      const value = readJson(file);
      assert(Array.isArray(value), `${file} must be an array`);
      return value;
    });
}

function applyPracticeExtensions(studySets) {
  const file = path.join(ROOT, "data", "practice-extensions.json");
  if (!fs.existsSync(file)) return studySets;

  const extension = readJson(file);
  const extensionSets = Array.isArray(extension.sets) ? extension.sets : [];
  const existingSetIds = new Set((studySets.sets || []).map((set) => set.id));
  for (const set of extensionSets) {
    assert(set && typeof set.id === "string" && set.id, `${file}: every extension set needs an id`);
    assert(!existingSetIds.has(set.id), `${file}: duplicate study set ${set.id}`);
    existingSetIds.add(set.id);
  }

  const learningPaths = (studySets.learningPaths || []).map((item) => ({
    ...item,
    set_ids: [...(item.set_ids || [])]
  }));
  const pathById = new Map(learningPaths.map((item) => [item.id, item]));
  for (const [pathId, setIds] of Object.entries(extension.learningPathAdds || {})) {
    const target = pathById.get(pathId);
    assert(target, `${file}: unknown learning path ${pathId}`);
    assert(Array.isArray(setIds), `${file}: learningPathAdds.${pathId} must be an array`);
    for (const setId of setIds) {
      assert(existingSetIds.has(setId), `${file}: ${pathId} references unknown study set ${setId}`);
      if (!target.set_ids.includes(setId)) target.set_ids.push(setId);
    }
  }

  return {
    ...studySets,
    sets: [...(studySets.sets || []), ...extensionSets],
    learningPaths
  };
}

function normalizeFormula(value = "") {
  return String(value).trim().toLocaleLowerCase();
}

function normalizeExample(value = "") {
  return String(value)
    .replaceAll("**", "")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

function supplementalSetId(pattern) {
  if (pattern.id === "CLF048") return "NEG";
  if (pattern.id === "CLF055") return "EVD";
  return pattern.set_id;
}

function completeSupplementalPattern(pattern) {
  return {
    ...pattern,
    set_id: supplementalSetId(pattern)
  };
}

function derivePatternQuality(pattern) {
  const languages = {};
  let minUniqueExamples = Number.POSITIVE_INFINITY;
  let completeTranslations = true;
  let hasVariationDuplicates = false;

  for (const lang of pattern.langs || []) {
    const primary = normalizeExample(lang.example);
    const variations = (lang.examples || [])
      .map((item) => normalizeExample(item.text))
      .filter(Boolean);
    const variationCounts = new Map();
    for (const value of variations) variationCounts.set(value, (variationCounts.get(value) || 0) + 1);
    const variationDuplicateCount = [...variationCounts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    const uniqueExamples = new Set([primary, ...variations].filter(Boolean));
    const translatedVariations = (lang.examples || []).filter((item) => typeof item.translation_ru === "string" && item.translation_ru.trim()).length;
    const translationsComplete = Boolean(lang.translation?.trim()) && translatedVariations === (lang.examples || []).length;
    const primaryRepeatedInVariations = Boolean(primary) && variations.includes(primary);

    completeTranslations &&= translationsComplete;
    hasVariationDuplicates ||= variationDuplicateCount > 0;
    minUniqueExamples = Math.min(minUniqueExamples, uniqueExamples.size);
    languages[lang.lang] = {
      example_count: (primary ? 1 : 0) + variations.length,
      variation_count: variations.length,
      unique_example_count: uniqueExamples.size,
      unique_variation_count: variationCounts.size,
      variation_duplicate_count: variationDuplicateCount,
      primary_repeated_in_variations: primaryRepeatedInVariations,
      translations_complete: translationsComplete
    };
  }

  if (!Number.isFinite(minUniqueExamples)) minUniqueExamples = 0;
  const editorialStatus = pattern.quality?.status || pattern.gen?.status || "unknown";
  const indexable = completeTranslations && minUniqueExamples >= 3 && !hasVariationDuplicates;

  return {
    status: editorialStatus,
    indexable,
    min_unique_examples: minUniqueExamples,
    translations_complete: completeTranslations,
    has_variation_duplicates: hasVariationDuplicates,
    languages
  };
}

function mergeSupplementalPatterns(basePatterns, supplementalPatterns) {
  const merged = basePatterns.map((pattern) => ({ ...pattern }));
  const owners = new Map();
  for (const pattern of merged) {
    for (const lang of pattern.langs || []) owners.set(normalizeFormula(lang.formula), pattern);
  }

  for (const rawPattern of supplementalPatterns) {
    const supplemental = completeSupplementalPattern(rawPattern);
    const matches = [...new Set((supplemental.langs || [])
      .map((lang) => owners.get(normalizeFormula(lang.formula)))
      .filter(Boolean))];
    assert(matches.length <= 1, `supplemental pattern ${supplemental.id} maps to multiple existing patterns`);
    const existing = matches[0];
    if (existing) {
      existing.reasoning = { ...(existing.reasoning || {}), ...(supplemental.reasoning || {}) };
      existing.logic = existing.logic || supplemental.logic;
      existing.reasoning_aliases = [...new Set([...(existing.reasoning_aliases || []), supplemental.id])];
      continue;
    }

    merged.push(supplemental);
    for (const lang of supplemental.langs || []) owners.set(normalizeFormula(lang.formula), supplemental);
  }
  return merged;
}

function applyPracticeQualityOverrides(patterns) {
  const file = path.join(ROOT, "data", "practice-quality-overrides.json");
  if (!fs.existsSync(file)) return patterns;

  const overrides = readJson(file);
  assert(Array.isArray(overrides), `${file} must be an array`);
  const byId = new Map(patterns.map((pattern) => [pattern.id, pattern]));
  const seen = new Set();

  for (const override of overrides) {
    assert(override && typeof override.pattern_id === "string" && override.pattern_id, `${file}: every override needs pattern_id`);
    assert(!seen.has(override.pattern_id), `${file}: duplicate override for ${override.pattern_id}`);
    seen.add(override.pattern_id);
    const pattern = byId.get(override.pattern_id);
    assert(pattern, `${file}: unknown pattern ${override.pattern_id}`);

    const langs = new Map((pattern.langs || []).map((lang) => [lang.lang, lang]));
    for (const [langCode, langOverride] of Object.entries(override.langs || {})) {
      const lang = langs.get(langCode);
      assert(lang, `${file}: ${override.pattern_id} has no ${langCode} language record`);
      if (typeof langOverride.formula === "string") lang.formula = langOverride.formula;
      if (typeof langOverride.example === "string") lang.example = langOverride.example;
      if (typeof langOverride.translation === "string") lang.translation = langOverride.translation;
      if (Array.isArray(langOverride.examples)) lang.examples = langOverride.examples.map((item) => ({ ...item }));
      if (Array.isArray(langOverride.additional_examples)) {
        lang.examples = [...(lang.examples || []), ...langOverride.additional_examples.map((item) => ({ ...item }))];
      }
    }
  }

  return patterns;
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
  const expectedLangs = corpusLanguages();
  assert(typeof pattern.id === "string" && pattern.id, `advanced-patterns[${index}].id is required`);
  assert(typeof pattern.title_ru === "string" && pattern.title_ru, `advanced-patterns[${index}].title_ru is required`);
  assert(typeof pattern.group_id === "string" && pattern.group_id, `advanced-patterns[${index}].group_id is required`);
  assert(typeof pattern.set_id === "string" && validSetIds.has(pattern.set_id), `advanced-patterns[${index}].set_id is not a valid study set`);
  assert(Array.isArray(pattern.langs) && pattern.langs.length > 0, `advanced-patterns[${index}].langs is required`);
  assert(new Set(pattern.langs.map((lang) => lang.lang)).size === expectedLangs.length, `advanced-patterns[${index}] must include every corpus language (${expectedLangs.join(", ")})`);
  for (const [langIndex, lang] of pattern.langs.entries()) {
    assert(expectedLangs.includes(lang.lang), `advanced-patterns[${index}].langs[${langIndex}].lang is invalid`);
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

  const studySets = applyPracticeExtensions(readJson(path.join(ROOT, "data", "study-sets.json")));
  const { patterns: baseAdvancedPatterns } = loadPatternShards({ setOrder: studySets.sets.map((set) => set.id) });
  const supplementalPatterns = readJsonDirectory(path.join(ROOT, "data", "reasoning-frames"));
  assert(Array.isArray(studySets.sets) && studySets.sets.length > 0, "study-sets.json must contain sets");
  const validSetIds = new Set(studySets.sets.map((set) => set.id));
  assert(validSetIds.size === studySets.sets.length, "study set IDs must be unique");
  assert(Array.isArray(studySets.learningPaths) && studySets.learningPaths.length > 0, "study-sets.json must contain learning paths");
  for (const pathItem of studySets.learningPaths) for (const setId of pathItem.set_ids || []) assert(validSetIds.has(setId), `learning path ${pathItem.id} references an unknown set ${setId}`);

  supplementalPatterns.map(completeSupplementalPattern).forEach((pattern, index) => validatePattern(pattern, index, validSetIds));
  const advancedPatterns = applyPracticeQualityOverrides(mergeSupplementalPatterns(baseAdvancedPatterns, supplementalPatterns))
    .map((pattern) => ({ ...pattern, quality: derivePatternQuality(pattern) }));
  assert(advancedPatterns.length >= 1000, `pattern corpus (data/patterns/) requires at least 1,000 patterns; found ${advancedPatterns.length}`);
  const patternIds = new Set();
  const formulas = new Set();
  advancedPatterns.forEach((pattern, index) => {
    validatePattern(pattern, index, validSetIds);
    assert(!patternIds.has(pattern.id.toLowerCase()), `duplicate advanced pattern id ${pattern.id}`);
    patternIds.add(pattern.id.toLowerCase());
    for (const lang of pattern.langs) {
      const formula = normalizeFormula(lang.formula);
      assert(!formulas.has(formula), `duplicate advanced pattern formula ${lang.formula}`);
      formulas.add(formula);
    }
    if (PRACTICE_QUALITY_SET_IDS.has(pattern.set_id)) {
      assert(pattern.quality.min_unique_examples >= 5, `${pattern.id} requires at least five unique examples per language`);
      assert(pattern.quality.translations_complete, `${pattern.id} requires complete Russian translations`);
      assert(!pattern.quality.has_variation_duplicates, `${pattern.id} contains duplicate example variations`);
      for (const lang of pattern.langs) {
        assert(!pattern.quality.languages[lang.lang].primary_repeated_in_variations, `${pattern.id}/${lang.lang} repeats the primary example in variations`);
      }
    }
  });
  for (const set of studySets.sets) assert(advancedPatterns.some((pattern) => pattern.set_id === set.id), `study set ${set.id} has no complete patterns`);

  const frameFamilies = attachFrameFamilies(advancedPatterns, studySets);
  return { collections, advancedPatterns, studySets, frameFamilies };
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
