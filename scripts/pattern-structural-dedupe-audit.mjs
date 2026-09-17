import fs from "node:fs";
import path from "node:path";

import { loadContent } from "../src/content.mjs";
import { normalizeFrameFormula } from "../src/frame-quality-audit.mjs";

const ROOT = process.cwd();

function structuralSignature(pattern) {
  const languages = [...(pattern.langs || [])]
    .sort((a, b) => a.lang.localeCompare(b.lang))
    .map((lang) => `${lang.lang}:${normalizeFrameFormula(lang.formula, { abstractSlots: true })}`)
    .join(" || ");
  return `${pattern.set_id} :: ${pattern.group_id} :: ${languages}`;
}

function normalizedExample(value = "") {
  return String(value)
    .replaceAll("**", "")
    .normalize("NFKC")
    .replaceAll(/[‘’]/g, "'")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

function exampleSet(pattern, langCode) {
  const lang = (pattern.langs || []).find((item) => item.lang === langCode);
  if (!lang) return new Set();
  return new Set([
    normalizedExample(lang.example),
    ...(lang.examples || []).map((item) => normalizedExample(item.text)),
  ].filter(Boolean));
}

function overlap(left, right) {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const item of left) if (right.has(item)) intersection += 1;
  return intersection / Math.min(left.size, right.size);
}

function groupOverlap(group) {
  if (group.length < 2) return 1;
  const languages = [...new Set(group.flatMap((pattern) => (pattern.langs || []).map((lang) => lang.lang)))];
  let total = 0;
  let count = 0;
  for (let i = 0; i < group.length; i += 1) {
    for (let j = i + 1; j < group.length; j += 1) {
      for (const lang of languages) {
        total += overlap(exampleSet(group[i], lang), exampleSet(group[j], lang));
        count += 1;
      }
    }
  }
  return count ? total / count : 0;
}

export function buildStructuralDuplicateReport(content = loadContent()) {
  const groups = new Map();
  for (const pattern of content.advancedPatterns) {
    const key = structuralSignature(pattern);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(pattern);
  }

  const duplicates = [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([signature, group]) => ({
      set_id: group[0].set_id,
      group_id: group[0].group_id,
      signature,
      count: group.length,
      pattern_ids: group.map((pattern) => pattern.id),
      canonical_id: group[0].id,
      aliases: group.slice(1).map((pattern) => pattern.id),
      example_overlap: Number(groupOverlap(group).toFixed(3)),
    }))
    .sort((a, b) => b.count - a.count || b.example_overlap - a.example_overlap || a.set_id.localeCompare(b.set_id));

  const affectedIds = new Set(duplicates.flatMap((group) => group.pattern_ids));
  const aliases = duplicates.reduce((sum, group) => sum + group.aliases.length, 0);
  const bySet = {};
  for (const group of duplicates) {
    const item = bySet[group.set_id] ||= { groups: 0, affected_patterns: 0, removable_aliases: 0, max_group_size: 0 };
    item.groups += 1;
    item.affected_patterns += group.count;
    item.removable_aliases += group.aliases.length;
    item.max_group_size = Math.max(item.max_group_size, group.count);
  }

  return {
    generated_at: new Date().toISOString(),
    pattern_count: content.advancedPatterns.length,
    duplicate_group_count: duplicates.length,
    affected_pattern_count: affectedIds.size,
    removable_alias_count: aliases,
    estimated_canonical_pattern_count: content.advancedPatterns.length - aliases,
    by_set: Object.fromEntries(Object.entries(bySet).sort((a, b) => b[1].removable_aliases - a[1].removable_aliases || a[0].localeCompare(b[0]))),
    groups: duplicates,
  };
}

function walkFiles(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    const relative = path.relative(ROOT, full).replaceAll(path.sep, "/");
    if (entry.isDirectory()) {
      if ([".git", "node_modules", "dist"].includes(entry.name)) continue;
      if (relative === "data/patterns" || relative.startsWith("data/patterns/")) continue;
      walkFiles(full, output);
      continue;
    }
    if (!/\.(?:json|mjs|js|md|yml|yaml|html|txt)$/i.test(entry.name)) continue;
    if ([
      "tests/fixtures/pattern-corpus-baseline.json",
      "data/seo-slugs.json",
      ".tmp/pattern-dedupe-audit-trigger.txt",
    ].includes(relative)) continue;
    output.push({ full, relative });
  }
  return output;
}

function aliasReferenceReport(report) {
  const aliasToCanonical = new Map(report.groups.flatMap((group) => group.aliases.map((alias) => [alias, group.canonical_id])));
  const references = [];
  const tokenRegex = /\b[A-Z][A-Z0-9]{2,15}\b/g;
  for (const file of walkFiles(ROOT)) {
    let text;
    try { text = fs.readFileSync(file.full, "utf8"); } catch { continue; }
    const found = new Map();
    for (const match of text.matchAll(tokenRegex)) {
      const alias = match[0];
      if (!aliasToCanonical.has(alias)) continue;
      found.set(alias, (found.get(alias) || 0) + 1);
    }
    if (!found.size) continue;
    references.push({
      file: file.relative,
      alias_count: found.size,
      occurrence_count: [...found.values()].reduce((sum, count) => sum + count, 0),
      sample: [...found.entries()].slice(0, 20).map(([alias, occurrences]) => ({ alias, canonical: aliasToCanonical.get(alias), occurrences })),
    });
  }
  return references.sort((a, b) => b.alias_count - a.alias_count || a.file.localeCompare(b.file));
}

export function main() {
  const report = buildStructuralDuplicateReport();
  const references = aliasReferenceReport(report);
  console.log(JSON.stringify({
    pattern_count: report.pattern_count,
    duplicate_group_count: report.duplicate_group_count,
    affected_pattern_count: report.affected_pattern_count,
    removable_alias_count: report.removable_alias_count,
    estimated_canonical_pattern_count: report.estimated_canonical_pattern_count,
    by_set: report.by_set,
    external_reference_files: references,
  }, null, 2));
  console.log("\nTop structural duplicate groups:");
  for (const group of report.groups.slice(0, 120)) {
    console.log(`${group.set_id}\t${group.group_id}\tcount=${group.count}\toverlap=${group.example_overlap}\tcanonical=${group.canonical_id}\taliases=${group.aliases.join(",")}`);
  }
  return { ...report, external_reference_files: references };
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) main();
