import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { generatedPatternSlugCore, seoSlug } from "../src/seo-slugs.mjs";

const stable = (current, generated, context) => {
  const value = current || generated;
  if (!value || value !== seoSlug(value)) throw new Error(`Invalid generated SEO slug for ${context}: ${value}`);
  return value;
};

function extendRegistry(previous, additions) {
  // Historical aliases still need their frozen URLs for redirects. The public
  // catalogue may shrink after canonicalization; that must not erase routes.
  return Object.fromEntries(Object.entries({ ...previous, ...Object.fromEntries(additions) })
    .sort(([left], [right]) => left.localeCompare(right)));
}

export function buildSeoSlugRegistry(content, existing = { studySets: {}, patterns: {} }) {
  const studySets = extendRegistry(existing.studySets || {}, content.studySets.sets
    .map((set) => [set.id, stable(existing.studySets?.[set.id], seoSlug(set.title_en) || set.id.toLowerCase(), `study set ${set.id}`)]));
  const patterns = extendRegistry(existing.patterns || {}, content.advancedPatterns
    .map((pattern) => [pattern.id, stable(existing.patterns?.[pattern.id], generatedPatternSlugCore(pattern), `pattern ${pattern.id}`)]));
  return {
    schemaVersion: 1,
    description: "Frozen human-readable SEO slug cores. Existing values are never regenerated when titles or formulas change.",
    studySets,
    patterns
  };
}

export function main() {
  const target = path.join(process.cwd(), "data", "seo-slugs.json");
  const existing = fs.existsSync(target)
    ? JSON.parse(fs.readFileSync(target, "utf8"))
    : { schemaVersion: 1, studySets: {}, patterns: {} };
  const payload = buildSeoSlugRegistry(loadContent(), existing);
  fs.writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`SEO slug registry: ${Object.keys(payload.studySets).length} study sets, ${Object.keys(payload.patterns).length} pattern routes including historical redirects.`);
  return payload;
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) main();
