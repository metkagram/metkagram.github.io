import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const workflow = fs.readFileSync(path.join(ROOT, ".github", "workflows", "indexnow.yml"), "utf8");

test("IndexNow discovers additive Pattern Atlas extension files", () => {
  assert.ok(workflow.includes("data/discovery-topics(-extension(-[a-z0-9-]+)?)?\\.json"));
  assert.ok(workflow.includes("for topic_file in data/discovery-topics*.json"));
  assert.ok(workflow.includes('add_url "$BASE/en/patterns/$slug/"'));
  assert.ok(workflow.includes('add_url "$BASE/ru/patterns/$slug/"'));
});

test("IndexNow maps current multilingual and benchmark publication surfaces", () => {
  assert.ok(workflow.includes("data/language-pilots/.*\\.json"));
  assert.ok(workflow.includes('add_url "$BASE/en/practice/language/french/"'));
  assert.ok(workflow.includes('add_url "$BASE/api/v1/language-pilots.json"'));
  assert.ok(workflow.includes("benchmark-publication"));
  assert.ok(workflow.includes('add_url "$BASE/en/evals/"'));
  assert.ok(workflow.includes('add_url "$BASE/api/v1/evals/reasoning-routing.json"'));
});

test("IndexNow maps release, rights and citation changes to public pages", () => {
  assert.ok(workflow.includes("scripts/release-contracts\\.mjs"));
  assert.ok(workflow.includes('add_url "$BASE/en/roadmap/"'));
  assert.ok(workflow.includes("scripts/(enhance-licensing-pages|release-metadata|publication-readiness)\\.mjs"));
  assert.ok(workflow.includes('add_url "$BASE/en/licensing/"'));
  assert.ok(workflow.includes('add_url "$BASE/en/cite/"'));
  assert.ok(workflow.includes('add_url "$BASE/api/v1/publication.json"'));
});

test("changed reasoning-frame files submit their individual pattern pages", () => {
  assert.ok(workflow.includes("data/reasoning-frames/.*\\.json"));
  assert.ok(workflow.includes("jq -r '.[].id // empty'"));
  assert.ok(workflow.includes("pattern_public_slug"));
  assert.ok(workflow.includes('add_url "$BASE/en/practice/patterns/$pattern_slug/"'));
  assert.ok(workflow.includes('add_url "$BASE/api/v1/patterns/$pattern_api_id.json"'));
  assert.equal(workflow.includes('add_url "$BASE/en/practice/$pattern_slug/"'), false);
});
