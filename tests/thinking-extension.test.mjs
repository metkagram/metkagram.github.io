import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const PHASE_1_SET_IDS = ["FRM", "UNC", "SYS", "DEC"];
const PHASE_2_SET_IDS = ["CDG", "HYP", "PST", "META"];
const THINKING_SET_IDS = [...PHASE_1_SET_IDS, ...PHASE_2_SET_IDS];
const ESTABLISHED_SET_IDS = ["ARG", "OPI", "EVD", "CGR", "SPK", "INT", "REG", "RTR", "TRN"];

function assertSetQuality(content, setId) {
  const patterns = content.advancedPatterns.filter((pattern) => pattern.set_id === setId);
  assert.equal(patterns.length, 5, `${setId} should contain five curated thinking patterns`);
  assert.ok(patterns.every((pattern) => pattern.reasoning?.move), `${setId} needs reasoning metadata`);
  assert.ok(patterns.every((pattern) => pattern.quality?.indexable), `${setId} patterns must be indexable`);
  assert.ok(patterns.every((pattern) => pattern.langs.length === 2), `${setId} must keep EN/DE Frames`);
  assert.ok(patterns.every((pattern) => pattern.langs.every((lang) => lang.translation && lang.examples.length >= 2)), `${setId} needs translations and practice examples`);
}

test("Thinking in Language grows additively without replacing established sets", () => {
  const content = loadContent();
  const setIds = new Set(content.studySets.sets.map((set) => set.id));

  for (const id of ESTABLISHED_SET_IDS) assert.ok(setIds.has(id), `established set ${id} must remain public`);
  for (const id of THINKING_SET_IDS) assert.ok(setIds.has(id), `thinking set ${id} must be public`);

  const thinkingPatterns = content.advancedPatterns.filter((pattern) => THINKING_SET_IDS.includes(pattern.set_id));
  assert.equal(thinkingPatterns.length, 40);
  for (const setId of THINKING_SET_IDS) assertSetQuality(content, setId);
});

test("Thinking in Language manifest records both curriculum layers", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "thinking-extension-manifest.json"), "utf8"));
  assert.deepEqual(manifest.setIds, THINKING_SET_IDS);
  assert.equal(manifest.patternCount, 40);
  assert.equal(manifest.patternFiles.length, 8);
  assert.deepEqual(manifest.phases[0].setIds, PHASE_1_SET_IDS);
  assert.deepEqual(manifest.phases[1].setIds, PHASE_2_SET_IDS);
});

test("Thinking in Language routes stay discoverable across additive Atlas extension files", () => {
  const routes = [
    "thinking-framing-uncertainty-and-decisions",
    "causal-diagnosis-and-root-cause-reasoning",
    "hypothesis-testing-and-evidence",
    "perspective-taking-and-fair-disagreement",
    "metacognitive-learning-and-error-patterns"
  ];

  for (const locale of ["en", "ru"]) {
    for (const slug of routes) {
      const route = path.join(DIST, locale, "patterns", slug, "index.html");
      assert.ok(fs.existsSync(route), `${locale}/${slug} Pattern Atlas route must exist`);
      const html = fs.readFileSync(route, "utf8");
      assert.match(html, /LearningResource|Pattern Atlas|Атлас/iu);
    }
  }

  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  for (const slug of routes) {
    assert.match(sitemap, new RegExp(`/en/patterns/${slug}/`));
    assert.match(sitemap, new RegExp(`/ru/patterns/${slug}/`));
  }
});

test("new reasoning operations extend the domain model without rewriting frozen evidence fixtures", () => {
  const content = loadContent();
  const bySet = new Map(THINKING_SET_IDS.map((setId) => [setId, content.advancedPatterns.filter((pattern) => pattern.set_id === setId)]));
  assert.ok(bySet.get("CDG").every((pattern) => pattern.reasoning.move === "Cause"));
  assert.ok(bySet.get("HYP").every((pattern) => pattern.reasoning.move === "Test"));
  assert.ok(bySet.get("PST").every((pattern) => pattern.reasoning.move === "Perspective"));
  assert.ok(bySet.get("META").every((pattern) => pattern.reasoning.move === "Learn"));

  const benchmark = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "evaluation", "reasoning-benchmark.json"), "utf8"));
  assert.equal(benchmark.cases.length, 54, "curriculum growth must not silently rewrite the frozen reasoning benchmark");
});
