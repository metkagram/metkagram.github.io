import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { cleanMarkedText, validateAnnotation } from "../src/annotation-schema.mjs";
import { loadContent } from "../src/content.mjs";

const ROOT = process.cwd();
const annotationPath = path.join(ROOT, "data", "pattern-annotations.json.gz");

function expectedTexts() {
  const expected = new Map();
  for (const pattern of loadContent().advancedPatterns) {
    for (const language of pattern.langs) {
      expected.set(`${pattern.id}:${language.lang}:primary`, cleanMarkedText(language.example));
      for (const [index, example] of (language.examples || []).entries()) {
        expected.set(`${pattern.id}:${language.lang}:${index + 1}`, cleanMarkedText(example.text));
      }
    }
  }
  return expected;
}

function trimRecord(record, expectedText, key) {
  if (record.text === expectedText && record.inline_text === expectedText) return false;
  if (typeof record.text !== "string" || typeof record.inline_text !== "string") {
    throw new Error(`${key}: annotation record is missing text fields`);
  }
  if (record.text !== record.inline_text) {
    throw new Error(`${key}: text and inline_text diverged before cleanup`);
  }
  if (!record.text.startsWith(`${expectedText} `)) {
    throw new Error(`${key}: cleaned canonical text is not an exact prefix of the stored annotation`);
  }

  const oldLength = record.text.length;
  record.text = expectedText;
  record.inline_text = expectedText;
  record.spans = (record.spans || []).filter((span) => span.end <= expectedText.length);
  record.validation = {
    ...(record.validation || {}),
    status: "valid",
    generated_follow_up_trimmed: true,
    previous_text_length: oldLength,
  };

  const errors = validateAnnotation(record);
  if (errors.length) throw new Error(`${key}: invalid annotation after trim: ${errors.join(", ")}`);
  return true;
}

function main() {
  if (!fs.existsSync(annotationPath)) throw new Error("Missing data/pattern-annotations.json.gz");
  const payload = JSON.parse(zlib.gunzipSync(fs.readFileSync(annotationPath)).toString("utf8"));
  const expected = expectedTexts();
  const items = payload.items || {};

  if (payload.count !== Object.keys(items).length) throw new Error("Pattern annotation export count is invalid");
  if (expected.size !== payload.count) {
    throw new Error(`Pattern annotation count mismatch before sync: expected ${expected.size}, found ${payload.count}`);
  }

  let changed = 0;
  for (const [key, expectedText] of expected.entries()) {
    const record = items[key];
    if (!record) throw new Error(`${key}: missing annotation record`);
    if (trimRecord(record, expectedText, key)) changed += 1;
  }

  for (const key of Object.keys(items)) {
    if (!expected.has(key)) throw new Error(`${key}: stale annotation record not present in canonical corpus`);
  }

  const temporary = `${annotationPath}.tmp`;
  fs.writeFileSync(temporary, zlib.gzipSync(JSON.stringify(payload), { level: 9 }));
  fs.renameSync(temporary, annotationPath);
  console.log(`Synchronized ${changed} Practice annotation records after generated-tail cleanup.`);
}

main();
