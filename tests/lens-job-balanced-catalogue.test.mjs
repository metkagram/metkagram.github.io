import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { intentTaxonomy } from "../src/intents.mjs";
import { LENS_CATALOGUE_LIMIT, LENS_FOUNDATION_JOBS } from "../src/lens-catalogue.mjs";
import { RENDER_STEPS } from "../scripts/stages/render.mjs";

const ROOT = process.cwd();
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

test("Lens final catalogue is job-balanced rather than a corpus-position sample", () => {
  const coverage = readJson("dist/data/pattern-lens-coverage.json");
  const catalogue = readJson("dist/data/pattern-lens-patterns.json");

  assert.equal(coverage.selectionPolicy, "job-balanced-frame-v1");
  assert.equal(coverage.catalogueLimit, LENS_CATALOGUE_LIMIT);
  assert.equal(coverage.catalogueCount, catalogue.length);
  assert.ok(catalogue.length > 18, "curated catalogue must be larger than the inline starter");
  assert.ok(catalogue.length <= LENS_CATALOGUE_LIMIT, "browser catalogue must stay bounded");
  assert.deepEqual(catalogue.map((pattern) => pattern.id), coverage.patterns.map((pattern) => pattern.id));
  assert.equal(coverage.coverage.distinctFrameKeys, catalogue.length, "one bounded slot should represent one canonical/abstract Frame");

  const renderIndex = RENDER_STEPS.indexOf("scripts/pattern-lens.mjs");
  const catalogueIndex = RENDER_STEPS.indexOf("scripts/lens-catalogue.mjs");
  const evaluationIndex = RENDER_STEPS.indexOf("scripts/pattern-lens-evaluation.mjs");
  assert.ok(renderIndex >= 0 && catalogueIndex === renderIndex + 1, "job-balanced curation must immediately replace the initial Lens build catalogue");
  assert.ok(catalogueIndex < evaluationIndex, "Lens evaluations must see the final catalogue state");
});

test("every reviewed intent and every priority learner job has explicit Pattern coverage", () => {
  const coverage = readJson("dist/data/pattern-lens-coverage.json");
  const jobs = new Map(coverage.jobs.map((job) => [job.id, job]));

  for (const intent of intentTaxonomy) {
    const job = jobs.get(`intent:${intent.id}`);
    assert.ok(job, `missing Lens job for intent ${intent.id}`);
    assert.deepEqual(job.anchor_pattern_ids, intent.pattern_priority, `intent ${intent.id} must keep its reviewed Pattern priorities`);
    assert.equal(job.covered, true, `intent ${intent.id} needs at least one selected Pattern`);
    assert.ok(job.selected_pattern_ids.length >= 1);
  }

  for (const expected of LENS_FOUNDATION_JOBS) {
    const job = jobs.get(expected.id);
    assert.ok(job, `missing foundation learner job ${expected.id}`);
    assert.equal(job.covered, true, `foundation job ${expected.id} needs Pattern coverage`);
    assert.ok(job.anchor_pattern_ids.length >= 1, `${expected.id} needs explicit anchor IDs`);
    assert.ok(job.selected_pattern_ids.length >= 1, `${expected.id} needs at least one selected Pattern`);
  }

  assert.equal(coverage.coverage.coveredLearnerJobCount, coverage.coverage.learnerJobCount);
});

test("job-balanced Lens catalogue preserves bilingual retrieval and limits contextual variants", () => {
  const coverage = readJson("dist/data/pattern-lens-coverage.json");
  const catalogue = readJson("dist/data/pattern-lens-patterns.json");

  assert.equal(coverage.coverage.languages.en, catalogue.length);
  assert.equal(coverage.coverage.languages.de, catalogue.length);
  assert.ok(Object.keys(coverage.coverage.studySets).length >= 8, "Lens should span several high-value C1 sets");
  assert.ok(Object.keys(coverage.coverage.moves).length >= 9, "Lens should preserve broad reasoning-Move coverage");
  assert.ok(coverage.coverage.contextualVariantPatternIds.length <= 3, "reviewed Frame variants must not dominate the bounded catalogue");

  for (const pattern of catalogue) {
    const languages = new Set(pattern.langs.map((lang) => lang.lang));
    assert.equal(languages.has("en"), true, `${pattern.id} needs English`);
    assert.equal(languages.has("de"), true, `${pattern.id} needs German`);
  }
});
