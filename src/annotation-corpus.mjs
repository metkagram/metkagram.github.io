import { createHash } from "node:crypto";
import { cleanMarkedText } from "./annotation-schema.mjs";
import { collectionKeys, targetMeta } from "./i18n.mjs";

// Source identity includes the learning objective: changing only a formula must
// invalidate its derived emphasis even when the sentence stays unchanged.
export function annotationSourceHash({ text, language, formula = "" }) {
  return createHash("sha256").update(JSON.stringify([language, text, formula])).digest("hex");
}

export function practiceAnnotationWork(content) {
  const work = [];
  for (const pattern of content.advancedPatterns) for (const lang of pattern.langs) {
    if (!["en", "de"].includes(lang.lang)) continue;
    const examples = [["primary", lang.example], ...(lang.examples || []).map((e, i) => [String(i + 1), e.text])];
    for (const [suffix, value] of examples) {
      const item = { key: `${pattern.id}:${lang.lang}:${suffix}`, text: cleanMarkedText(value), language: lang.lang, formula: lang.formula, set_id: pattern.set_id, pattern_id: pattern.id };
      work.push({ ...item, source_hash: annotationSourceHash(item) });
    }
  }
  return work;
}

export function showcaseAnnotationWork(content) {
  const work = [];
  for (const target of Object.values(targetMeta)) for (const collection of collectionKeys) {
    for (const document of content.collections[target.key][collection].documents) for (const annotation of document.annotations || []) {
      const item = { key: `${target.dataKey}:${collection}:${document.id}:${annotation.id}`, text: annotation.original_text, language: target.dataKey, formula: "", document_id: document.id, annotation_id: annotation.id, collection };
      if (!item.text) throw new Error(`Missing source text: ${item.key}`);
      work.push({ ...item, source_hash: annotationSourceHash(item) });
    }
  }
  return work;
}
