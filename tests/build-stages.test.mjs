import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { AUDIT_STEPS } from "../scripts/stages/audit.mjs";
import { DERIVE_STEPS } from "../scripts/stages/derive.mjs";
import { RENDER_STEPS } from "../scripts/stages/render.mjs";
import { runStage } from "../scripts/stages/run.mjs";
import { VALIDATE_STEPS } from "../scripts/stages/validate.mjs";

const ROOT = process.cwd();
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

// The build chain as it existed before the staged pipeline (issue #70). Every
// script that ran in the old opaque chain must keep exactly one explicit stage.
const LEGACY_CHAIN = [
  "scripts/build.mjs",
  "scripts/connectivity.mjs",
  "scripts/intent-discovery.mjs",
  "scripts/reasoning-evaluation.mjs",
  "scripts/public-learning.mjs",
  "scripts/research-pilot-h1.mjs",
  "scripts/enhance-licensing-pages.mjs",
  "scripts/enhance-research.mjs",
  "scripts/annotation-research.mjs",
  "scripts/pattern-lens-rules.mjs",
  "scripts/pattern-lens.mjs",
  "scripts/pattern-lens-evaluation.mjs",
  "scripts/pattern-lens-hard-evaluation.mjs",
  "scripts/finalize-product-direction.mjs",
  "scripts/active-practice.mjs",
  "scripts/discovery-growth.mjs",
  "scripts/practice-intent-growth.mjs",
  "scripts/search-discovery.mjs",
  "scripts/contrast-library.mjs",
  "scripts/contrast-growth.mjs",
  "scripts/pattern-choice-clinic.mjs",
  "scripts/reasoning-packs.mjs",
  "scripts/lens-knowledge-bridge.mjs",
  "scripts/teacher-tutor-exports.mjs",
  "scripts/cross-language-transfer.mjs",
  "scripts/learning-telemetry.mjs",
  "scripts/russian-transfer-guide.mjs",
  "scripts/archive-mobile.mjs",
  "scripts/release-contracts.mjs",
  "scripts/terminology-language-foundation.mjs",
  "scripts/practice-seo.mjs",
  "scripts/ai-adoption.mjs",
  "scripts/publication-readiness.mjs",
  "scripts/benchmark-publication.mjs",
  "scripts/multilingual-domain-model.mjs",
  "scripts/seo-graph-normalize.mjs",
];

test("package.json exposes the staged build pipeline in canonical order", () => {
  for (const stage of ["source", "validate", "derive", "render", "audit"]) {
    assert.equal(pkg.scripts[`build:${stage}`], `node scripts/stages/${stage}.mjs`, `build:${stage} command`);
  }
  assert.equal(
    pkg.scripts.build,
    "npm run build:source && npm run build:validate && npm run build:derive && npm run build:render && npm run build:audit",
    "build must compose the stages in canonical order",
  );
  assert.ok(pkg.scripts.verify.includes("npm run build"), "verify runs the staged build");
});

test("every legacy chain script is assigned to exactly one stage", () => {
  // check-links and seo-graph-audit ran outside the old chain (verify step);
  // the audit stage now owns them.
  const expected = [...LEGACY_CHAIN, "scripts/check-links.mjs", "scripts/seo-graph-audit.mjs"];
  const assigned = [...DERIVE_STEPS, ...RENDER_STEPS, ...AUDIT_STEPS];
  assert.equal(new Set(assigned).size, assigned.length, "a script appears in two stages");
  assert.deepEqual([...assigned].sort(), [...expected].sort(), "stage coverage drifted from the legacy chain");
});

test("stage runner reports stage, script and exit code on failure", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "metkagram-stage-"));
  fs.writeFileSync(path.join(fixture, "ok.mjs"), "console.log('fine');\n");
  fs.writeFileSync(path.join(fixture, "fail.mjs"), "process.exit(3);\n");
  assert.doesNotThrow(() => runStage("test", ["ok.mjs"], fixture));
  assert.throws(
    () => runStage("test", ["ok.mjs", "fail.mjs"], fixture),
    (error) => {
      assert.match(error.message, /build stage "test" failed at fail\.mjs \(exit 3\)/);
      return true;
    },
  );
  fs.rmSync(fixture, { recursive: true, force: true });
});

test("validate stage runs before rendering and never reads dist/", () => {
  assert.deepEqual(VALIDATE_STEPS, ["scripts/validate-sources.mjs"]);
  const source = fs.readFileSync(path.join(ROOT, "scripts", "validate-sources.mjs"), "utf8");
  assert.doesNotMatch(source, /dist/, "validate-sources.mjs must not depend on rendered output");
  const result = spawnSync(process.execPath, ["scripts/stages/validate.mjs"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, `validate stage must pass on canonical sources:\n${result.stderr}`);
});

test("audit stage scripts never write to dist/", () => {
  for (const script of AUDIT_STEPS) {
    const source = fs.readFileSync(path.join(ROOT, script), "utf8");
    assert.doesNotMatch(
      source,
      /writeFileSync|appendFileSync|cpSync|renameSync|rmSync/,
      `${script} runs after rendering and must be read-only`,
    );
  }
});

test("derive stage output is deterministic", () => {
  const output = path.join(ROOT, "dist", "data", "pattern-lens-rules.json");
  for (let run = 0; run < 2; run += 1) {
    const result = spawnSync(process.execPath, ["scripts/pattern-lens-rules.mjs"], { cwd: ROOT, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const bytes = fs.readFileSync(output, "utf8");
    if (run === 0) fs.writeFileSync(`${output}.first`, bytes);
    else {
      assert.equal(bytes, fs.readFileSync(`${output}.first`, "utf8"), "re-running derive changed the artifact");
      fs.rmSync(`${output}.first`, { force: true });
    }
  }
});
