import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { loadContent } from "../src/content.mjs";
import { SITE_URL } from "../src/site.mjs";
import { studySetPath } from "../src/seo-slugs.mjs";
import {
  loadStudySetPreservationManifest,
  validateStudySetPreservation,
} from "../src/study-set-preservation.mjs";

const ROOT = process.cwd();

function routeFile(route) {
  return path.join(ROOT, "dist", route.split("/").filter(Boolean).join(path.sep), "index.html");
}

test("the frozen manifest covers every established study set and allows additive growth", () => {
  const content = loadContent();
  const manifest = loadStudySetPreservationManifest();
  const summary = validateStudySetPreservation(content, { manifest });
  assert.equal(manifest.establishedSetIds.length, 94, "issue #81 freezes the 94 established study sets");
  assert.equal(summary.currentCount, 94, "the current curriculum still contains the frozen baseline");
  assert.deepEqual(summary.additiveSetIds, [], "no post-baseline additive set exists yet");

  const additive = {
    ...content,
    studySets: {
      ...content.studySets,
      sets: [...content.studySets.sets, { id: "ZZZ", title_en: "Additive test set" }],
      learningPaths: content.studySets.learningPaths.map((learningPath, index) => index === 0
        ? { ...learningPath, set_ids: [...learningPath.set_ids, "ZZZ"] }
        : learningPath),
    },
    advancedPatterns: [...content.advancedPatterns, { id: "ZZZ001", set_id: "ZZZ" }],
  };
  const additiveSummary = validateStudySetPreservation(additive, { manifest });
  assert.deepEqual(additiveSummary.additiveSetIds, ["ZZZ"], "new sets are additive and do not require rewriting the frozen baseline");
});

test("removing an established study set fails with the missing stable id", () => {
  const content = loadContent();
  const manifest = loadStudySetPreservationManifest();
  const removedId = manifest.establishedSetIds[0];
  const withoutSet = {
    ...content,
    studySets: {
      ...content.studySets,
      sets: content.studySets.sets.filter((set) => set.id !== removedId),
    },
  };
  assert.throws(
    () => validateStudySetPreservation(withoutSet, { manifest }),
    new RegExp(`disappeared.*${removedId}`, "i"),
  );
});

test("every established study set survives into EN/RU routes, data, API and sitemap", () => {
  const content = loadContent();
  const manifest = loadStudySetPreservationManifest();
  validateStudySetPreservation(content, { manifest });

  const generatedStudySets = JSON.parse(fs.readFileSync(path.join(ROOT, "dist", "data", "study-sets.json"), "utf8"));
  const generatedIds = new Set(generatedStudySets.sets.map((set) => set.id));
  const sitemap = fs.readFileSync(path.join(ROOT, "dist", "sitemap.xml"), "utf8");
  const currentById = new Map(content.studySets.sets.map((set) => [set.id, set]));

  for (const id of manifest.establishedSetIds) {
    assert.ok(generatedIds.has(id), `${id} is missing from the generated study-set dataset`);
    assert.ok(fs.existsSync(path.join(ROOT, "dist", "api", "v1", "sets", `${id.toLowerCase()}.json`)), `${id} is missing from the public API`);
    const set = currentById.get(id);
    assert.ok(set, `${id} is missing from canonical content`);
    for (const locale of ["en", "ru"]) {
      const route = studySetPath(locale, set);
      assert.ok(fs.existsSync(routeFile(route)), `${id} lost its ${locale.toUpperCase()} canonical route ${route}`);
      assert.ok(sitemap.includes(`<loc>${SITE_URL}${route}</loc>`), `${id} ${locale.toUpperCase()} canonical route is missing from sitemap.xml`);
    }
  }
});
