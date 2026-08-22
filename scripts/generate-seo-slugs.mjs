import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { generatedPatternSlugCore, seoSlug } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const TARGET = path.join(ROOT, "data", "seo-slugs.json");
const existing = fs.existsSync(TARGET)
  ? JSON.parse(fs.readFileSync(TARGET, "utf8"))
  : { schemaVersion: 1, studySets: {}, patterns: {} };
const content = loadContent();

const stable = (current, generated, context) => {
  const value = current || generated;
  if (!value || value !== seoSlug(value)) throw new Error(`Invalid generated SEO slug for ${context}: ${value}`);
  return value;
};

const studySets = Object.fromEntries(content.studySets.sets
  .map((set) => [set.id, stable(existing.studySets?.[set.id], seoSlug(set.title_en) || set.id.toLowerCase(), `study set ${set.id}`)])
  .sort(([left], [right]) => left.localeCompare(right)));

const patterns = Object.fromEntries(content.advancedPatterns
  .map((pattern) => [pattern.id, stable(existing.patterns?.[pattern.id], generatedPatternSlugCore(pattern), `pattern ${pattern.id}`)])
  .sort(([left], [right]) => left.localeCompare(right)));

const payload = {
  schemaVersion: 1,
  description: "Frozen human-readable SEO slug cores. Existing values are never regenerated when titles or formulas change.",
  studySets,
  patterns
};

fs.writeFileSync(TARGET, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`SEO slug registry: ${Object.keys(studySets).length} study sets, ${Object.keys(patterns).length} patterns.`);
