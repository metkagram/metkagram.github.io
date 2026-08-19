import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const workflow = fs.readFileSync(path.join(ROOT, ".github", "workflows", "indexnow.yml"), "utf8");

test("IndexNow discovers additive Pattern Atlas extension files", () => {
  assert.match(workflow, /discovery-topics\(-extension\(\?:-\[a-z0-9-\]\+\)\?\)\?/);
  assert.match(workflow, /for topic_file in data\/discovery-topics\*\.json/);
  assert.match(workflow, /\/en\/patterns\/\$slug\//);
  assert.match(workflow, /\/ru\/patterns\/\$slug\//);
});

test("IndexNow maps current multilingual and benchmark publication surfaces", () => {
  assert.match(workflow, /data\/language-pilots\/\.\*\\\.json/);
  assert.match(workflow, /\/en\/practice\/language\/french\//);
  assert.match(workflow, /\/api\/v1\/language-pilots\.json/);
  assert.match(workflow, /benchmark-publication/);
  assert.match(workflow, /\/en\/evals\//);
  assert.match(workflow, /\/api\/v1\/evals\/reasoning-routing\.json/);
});

test("IndexNow maps release, rights and citation changes to public pages", () => {
  assert.match(workflow, /scripts\/release-contracts\\\.mjs/);
  assert.match(workflow, /\/en\/roadmap\//);
  assert.match(workflow, /scripts\/\(patch-licensing\|publication-readiness\)/);
  assert.match(workflow, /\/en\/licensing\//);
  assert.match(workflow, /\/en\/cite\//);
  assert.match(workflow, /\/api\/v1\/publication\.json/);
});

test("changed reasoning-frame files submit their individual pattern pages", () => {
  assert.match(workflow, /data\/reasoning-frames\/\.\*\\\.json/);
  assert.match(workflow, /jq -r '\.\[\]\.id \/\/ empty'/);
  assert.match(workflow, /\/api\/v1\/patterns\/\$pattern_slug\.json/);
});
