import fs from "node:fs";
import path from "node:path";

import { normalizeFrameFormula } from "./frame-quality-audit.mjs";

export const PATTERN_ALIASES_FILE = path.join("data", "pattern-aliases.json");

function invariant(condition, message) {
  if (!condition) throw new Error(`Pattern alias validation failed: ${message}`);
}

function structuralSignature(pattern) {
  const languages = [...(pattern.langs || [])]
    .sort((a, b) => a.lang.localeCompare(b.lang))
    .map((lang) => `${lang.lang}:${normalizeFrameFormula(lang.formula, { abstractSlots: true })}`)
    .join(" || ");
  return `${pattern.set_id} :: ${pattern.group_id} :: ${languages}`;
}

export function loadPatternAliases(root = process.cwd()) {
  const file = path.join(root, PATTERN_ALIASES_FILE);
  invariant(fs.existsSync(file), `${PATTERN_ALIASES_FILE} is required`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function patternAliasEntries(manifest) {
  return (manifest?.groups || []).flatMap((group) => (group.alias_ids || []).map((aliasId) => ({
    alias_id: aliasId,
    canonical_id: group.canonical_id,
    set_id: group.set_id,
    group_id: group.group_id,
    reason: group.reason,
  })));
}

export function patternAliasMap(manifest) {
  return new Map(patternAliasEntries(manifest).map((entry) => [entry.alias_id, entry.canonical_id]));
}

export function validatePatternAliases(patterns, manifest) {
  invariant(manifest?.schemaVersion === 1, "schemaVersion must be 1");
  invariant(manifest?.policy === "one-reusable-frame-one-canonical-pattern", "unexpected alias policy");
  invariant(Array.isArray(manifest?.groups), "groups must be an array");

  const patternById = new Map(patterns.map((pattern) => [pattern.id, pattern]));
  const aliasIds = new Set();
  const canonicalIds = new Set();

  for (const group of manifest.groups) {
    invariant(typeof group.canonical_id === "string" && group.canonical_id, "group requires canonical_id");
    invariant(Array.isArray(group.alias_ids) && group.alias_ids.length > 0, `${group.canonical_id} needs alias_ids`);
    invariant(!group.alias_ids.includes(group.canonical_id), `${group.canonical_id} cannot alias itself`);
    invariant(!canonicalIds.has(group.canonical_id), `${group.canonical_id} appears as canonical more than once`);
    canonicalIds.add(group.canonical_id);

    const canonical = patternById.get(group.canonical_id);
    invariant(canonical, `unknown canonical Pattern ${group.canonical_id}`);
    invariant(canonical.set_id === group.set_id, `${group.canonical_id} set mismatch`);
    invariant(canonical.group_id === group.group_id, `${group.canonical_id} group mismatch`);
    const expectedSignature = structuralSignature(canonical);
    invariant(expectedSignature === group.structural_signature, `${group.canonical_id} structural signature drifted`);

    for (const aliasId of group.alias_ids) {
      invariant(!aliasIds.has(aliasId), `${aliasId} is assigned more than once`);
      aliasIds.add(aliasId);
      const alias = patternById.get(aliasId);
      invariant(alias, `unknown alias Pattern ${aliasId}`);
      invariant(alias.set_id === group.set_id, `${aliasId} set mismatch`);
      invariant(alias.group_id === group.group_id, `${aliasId} group mismatch`);
      invariant(structuralSignature(alias) === expectedSignature, `${aliasId} no longer matches canonical ${group.canonical_id}`);
    }
  }

  for (const canonicalId of canonicalIds) invariant(!aliasIds.has(canonicalId), `${canonicalId} is both canonical and alias`);
  invariant(aliasIds.size === manifest.aliasCount, `aliasCount says ${manifest.aliasCount}, found ${aliasIds.size}`);
  invariant(patterns.length === manifest.activePatternCountBeforeCanonicalization, `source corpus count changed: manifest=${manifest.activePatternCountBeforeCanonicalization}, source=${patterns.length}`);
  invariant(patterns.length - aliasIds.size === manifest.canonicalPatternCount, `canonicalPatternCount says ${manifest.canonicalPatternCount}, calculated ${patterns.length - aliasIds.size}`);
  return manifest;
}

export function canonicalPracticePatterns(patterns, manifest) {
  validatePatternAliases(patterns, manifest);
  const aliases = new Set(patternAliasEntries(manifest).map((entry) => entry.alias_id));
  return patterns.filter((pattern) => !aliases.has(pattern.id));
}
