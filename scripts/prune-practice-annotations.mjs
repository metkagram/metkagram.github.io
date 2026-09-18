import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { loadContent } from "../src/content.mjs";

const ROOT = process.cwd();
const annotationFile = path.join(ROOT, "data", "pattern-annotations.json.gz");

function expectedAnnotationKeys() {
  const keys = new Set();
  for (const pattern of loadContent().advancedPatterns) {
    for (const language of pattern.langs || []) {
      keys.add(`${pattern.id}:${language.lang}:primary`);
      for (const [index] of (language.examples || []).entries()) {
        keys.add(`${pattern.id}:${language.lang}:${index + 1}`);
      }
    }
  }
  return keys;
}

const payload = JSON.parse(zlib.gunzipSync(fs.readFileSync(annotationFile)).toString("utf8"));
const expected = expectedAnnotationKeys();
const existing = payload.items || {};
const missing = [...expected].filter((key) => !(key in existing));

if (missing.length > 0) {
  throw new Error(
    `Cannot prune practice annotations: ${missing.length} retained examples are missing annotations. First missing keys:\n${missing.slice(0, 20).join("\n")}`
  );
}

const items = Object.fromEntries(
  Object.entries(existing).filter(([key]) => expected.has(key))
);
const removed = Object.keys(existing).length - Object.keys(items).length;

payload.items = items;
payload.count = Object.keys(items).length;

if (payload.count !== expected.size) {
  throw new Error(`Annotation prune count mismatch: expected ${expected.size}, kept ${payload.count}`);
}

const temporary = `${annotationFile}.tmp`;
fs.writeFileSync(temporary, zlib.gzipSync(JSON.stringify(payload), { level: 9 }));
fs.renameSync(temporary, annotationFile);
console.log(`Pruned ${removed} stale practice annotations; retained ${payload.count}.`);
