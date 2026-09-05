import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { loadContent } from "../src/content.mjs";
import { workplacePractice, validateWorkplacePractice } from "../src/workplace-practice.mjs";
import { patternPage, SITE_URL } from "../src/render.mjs";
import { patternPath, studySetPath } from "../src/seo-slugs.mjs";

const content = loadContent();

test("workplace practice links current English frames and rejects broken or incomplete content", () => {
  validateWorkplacePractice(workplacePractice, content.advancedPatterns);
  const missing = structuredClone(workplacePractice);
  missing.steps[0].pattern_id = "missing";
  assert.throws(() => validateWorkplacePractice(missing, content.advancedPatterns), /Unknown/);
  const untranslated = structuredClone(workplacePractice);
  delete untranslated.steps[1].check_ru;
  assert.throws(() => validateWorkplacePractice(untranslated, content.advancedPatterns), /Missing/);
});

test("workplace practice starts with learner production and keeps model answers collapsed", () => {
  for (const locale of ["en", "ru"]) {
    const html = fs.readFileSync(`dist${studySetPath(locale, { id: "PRO" })}index.html`, "utf8");
    const practice = html.split('id="workplace-practice"')[1]?.split('</section>')[0];
    assert.ok(practice);
    assert.equal((practice.match(/<details>/g) || []).length, 5);
    assert.doesNotMatch(practice, /<details\s+open/);
    assert.ok(practice.includes(workplacePractice[`transfer_${locale}`]));
    for (const step of workplacePractice.steps) assert.ok(practice.includes(patternPath(locale, step.pattern_id)));
  }
});

test("base renderer connects extension patterns to their actual study set", () => {
  const pattern = content.advancedPatterns.find((item) => item.id === "QSTQIND001");
  assert.ok(pattern);
  for (const locale of ["en", "ru"]) {
    const html = patternPage(locale, pattern);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((match) => JSON.parse(match[1]));
    const resource = blocks.flatMap((block) => [block, ...(block["@graph"] || [])]).find((node) => node["@type"] === "LearningResource");
    assert.equal(resource.isPartOf["@id"], `${SITE_URL}${studySetPath(locale, { id: pattern.set_id })}#learning-resource`);
  }
});

test("legacy expansion refuses before changing an established curriculum", () => {
  const paths = ["data/study-sets.json", "data/patterns/PRO.json", "data/patterns/ARG.json"];
  const before = paths.map((file) => fs.readFileSync(file, "utf8"));
  const result = spawnSync(process.execPath, ["scripts/expand-patterns.mjs"], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Legacy expansion cannot overwrite a preserved curriculum/);
  assert.deepEqual(paths.map((file) => fs.readFileSync(file, "utf8")), before);
});
