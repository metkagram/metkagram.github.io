import fs from "node:fs";
import path from "node:path";

const DEFAULT_ROOT = process.cwd();
export const STUDY_SET_PRESERVATION_FILE = path.join("data", "study-set-preservation.json");

function invariant(condition, message) {
  if (!condition) throw new Error(`Study-set preservation failed: ${message}`);
}

export function loadStudySetPreservationManifest(root = DEFAULT_ROOT) {
  const file = path.join(root, STUDY_SET_PRESERVATION_FILE);
  invariant(fs.existsSync(file), `${STUDY_SET_PRESERVATION_FILE} is required`);
  const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
  invariant(manifest?.schemaVersion === 1, "schemaVersion must be 1");
  invariant(manifest?.policy === "improve-and-add-do-not-delete-established-sets", "policy identifier drifted");
  invariant(Array.isArray(manifest.establishedSetIds) && manifest.establishedSetIds.length > 0, "establishedSetIds must be a non-empty array");
  invariant(Array.isArray(manifest.migrations), "migrations must be an array");
  const ids = manifest.establishedSetIds;
  invariant(new Set(ids).size === ids.length, "establishedSetIds contains duplicates");
  invariant(ids.every((id) => typeof id === "string" && id.trim() === id && id.length > 0), "every established set id must be a non-empty trimmed string");
  invariant(JSON.stringify(ids) === JSON.stringify([...ids].sort((a, b) => a.localeCompare(b))), "establishedSetIds must stay sorted for deterministic review");
  return manifest;
}

function migrationMap(manifest, currentSetIds) {
  const result = new Map();
  for (const [index, migration] of manifest.migrations.entries()) {
    invariant(migration && typeof migration === "object", `migrations[${index}] must be an object`);
    invariant(typeof migration.from === "string" && migration.from, `migrations[${index}].from is required`);
    invariant(typeof migration.to === "string" && migration.to, `migrations[${index}].to is required`);
    invariant(typeof migration.reason === "string" && migration.reason.trim().length >= 20, `migrations[${index}].reason must explain the owner-approved exception`);
    invariant(migration.approved === true, `migrations[${index}] must set approved=true`);
    invariant(migration.compatibility && typeof migration.compatibility === "object", `migrations[${index}].compatibility is required`);
    invariant(typeof migration.compatibility.en === "string" && migration.compatibility.en.startsWith("/en/"), `migrations[${index}] requires an EN compatibility route`);
    invariant(typeof migration.compatibility.ru === "string" && migration.compatibility.ru.startsWith("/ru/"), `migrations[${index}] requires a RU compatibility route`);
    invariant(!result.has(migration.from), `duplicate migration for ${migration.from}`);
    invariant(currentSetIds.has(migration.to), `migration ${migration.from} -> ${migration.to} targets an unknown current set`);
    result.set(migration.from, migration);
  }
  return result;
}

export function validateStudySetPreservation(content, { root = DEFAULT_ROOT, manifest = loadStudySetPreservationManifest(root) } = {}) {
  invariant(content?.studySets && Array.isArray(content.studySets.sets), "content.studySets.sets is required");
  invariant(Array.isArray(content.studySets.learningPaths), "content.studySets.learningPaths is required");
  invariant(Array.isArray(content.advancedPatterns), "content.advancedPatterns is required");

  const currentSets = new Map(content.studySets.sets.map((set) => [set.id, set]));
  invariant(currentSets.size === content.studySets.sets.length, "current study set ids must be unique");
  const currentSetIds = new Set(currentSets.keys());
  const migrations = migrationMap(manifest, currentSetIds);

  const missing = manifest.establishedSetIds.filter((id) => !currentSetIds.has(id) && !migrations.has(id));
  invariant(missing.length === 0, `established study set(s) disappeared without an approved migration: ${missing.join(", ")}`);

  const learningPathMembership = new Map();
  for (const learningPath of content.studySets.learningPaths) {
    for (const setId of learningPath.set_ids || []) {
      if (!learningPathMembership.has(setId)) learningPathMembership.set(setId, []);
      learningPathMembership.get(setId).push(learningPath.id);
    }
  }

  const patternsBySet = new Map();
  for (const pattern of content.advancedPatterns) {
    if (!patternsBySet.has(pattern.set_id)) patternsBySet.set(pattern.set_id, []);
    patternsBySet.get(pattern.set_id).push(pattern.id);
  }

  const slugRegistryFile = path.join(root, "data", "seo-slugs.json");
  const slugRegistry = JSON.parse(fs.readFileSync(slugRegistryFile, "utf8"));

  for (const id of manifest.establishedSetIds) {
    if (!currentSetIds.has(id)) continue;
    invariant((patternsBySet.get(id) || []).length > 0, `established set ${id} has no canonical pattern/source membership`);
    invariant((learningPathMembership.get(id) || []).length > 0, `established set ${id} is no longer reachable from a learning path`);
    invariant(typeof slugRegistry?.studySets?.[id] === "string" && slugRegistry.studySets[id], `established set ${id} lost its canonical SEO slug`);
  }

  const established = new Set(manifest.establishedSetIds);
  return {
    establishedCount: manifest.establishedSetIds.length,
    currentCount: currentSetIds.size,
    additiveSetIds: [...currentSetIds].filter((id) => !established.has(id)).sort((a, b) => a.localeCompare(b)),
    approvedMigrations: [...migrations.keys()].sort((a, b) => a.localeCompare(b)),
  };
}
