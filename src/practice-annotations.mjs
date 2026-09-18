import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import {
  ANNOTATION_SCHEMA_VERSION,
  cleanMarkedText,
  validateAnnotation
} from "./annotation-schema.mjs";

function pendingRecord(pattern, language, reference, reason) {
  const text = cleanMarkedText(reference.text);
  return {
    schema_version: ANNOTATION_SCHEMA_VERSION,
    id: `pending-rebuild-${pattern.id}-${language.lang}-${reference.key}`,
    kind: "sentence",
    text,
    inline_text: text,
    language: language.lang,
    locale: language.lang,
    translations: reference.translation ? { ru: reference.translation } : {},
    explanation: "",
    examples: [],
    cefr: pattern.level || "B2–C1",
    source: {
      dataset: "advanced-patterns",
      set_id: pattern.set_id,
      pattern_example_id: `${pattern.id}:${language.lang}:${reference.key}`
    },
    slots: [],
    spans: [],
    validation: {
      status: "pending",
      reason,
      needs_rebuild: true,
      text_sha256: crypto.createHash("sha256").update(text, "utf8").digest("hex"),
      generator: "none"
    }
  };
}

function referencesFor(language) {
  return [
    { key: "primary", text: language.example, translation: language.translation },
    ...(language.examples || []).map((example, index) => ({
      key: String(index + 1),
      text: example.text,
      translation: example.translation_ru || example.translation
    }))
  ];
}

export function loadPracticeAnnotationLayer(content, root = process.cwd()) {
  const annotationFile = path.join(root, "data", "pattern-annotations.json.gz");
  const ledgerFile = path.join(root, "data", "pending-practice-annotation-rebuilds.json");
  if (!fs.existsSync(annotationFile)) throw new Error("Missing required public Practice annotation layer");
  if (!fs.existsSync(ledgerFile)) throw new Error("Missing Practice annotation rebuild ledger");

  const payload = JSON.parse(zlib.gunzipSync(fs.readFileSync(annotationFile)).toString("utf8"));
  if (payload.count !== Object.keys(payload.items || {}).length) {
    throw new Error("Pattern annotation export count is invalid");
  }

  const ledger = JSON.parse(fs.readFileSync(ledgerFile, "utf8"));
  const pendingEntries = new Map((ledger.patterns || []).map((entry) => [entry.id, entry]));
  const items = { ...payload.items };
  let expected = 0;
  const expectedKeys = new Set();
  let overlayPendingCount = 0;

  for (const pattern of content.advancedPatterns) {
    for (const language of pattern.langs || []) {
      for (const reference of referencesFor(language)) {
        expected += 1;
        const key = `${pattern.id}:${language.lang}:${reference.key}`;
        expectedKeys.add(key);
        const record = payload.items[key];
        if (!record) throw new Error(`Missing Practice annotation ${key}`);
        const expectedText = cleanMarkedText(reference.text);
        const matches = record.text === expectedText && record.inline_text === expectedText;

        if (!matches) {
          const pending = pendingEntries.get(pattern.id);
          if (!pending) throw new Error(`Practice annotation text mismatch for ${key}`);
          const replacement = pendingRecord(pattern, language, reference, pending.reason);
          const errors = validateAnnotation(replacement);
          if (errors.length) throw new Error(`Invalid pending Practice annotation ${key}: ${errors.join(", ")}`);
          items[key] = replacement;
          overlayPendingCount += 1;
          continue;
        }

        const errors = validateAnnotation(record);
        if (errors.length) throw new Error(`Invalid Practice annotation ${key}: ${errors.join(", ")}`);
      }
    }
  }

  if (payload.count !== expected) {
    const staleKeys = Object.keys(payload.items || {}).filter((key) => !expectedKeys.has(key));
    throw new Error(`Practice annotation export count mismatch: expected ${expected}, found ${payload.count}; stale keys: ${staleKeys.slice(0, 30).join(", ") || "none"}`);
  }

  return {
    payload,
    items,
    ledger,
    pendingPatternIds: new Set(pendingEntries.keys()),
    overlayPendingCount
  };
}
