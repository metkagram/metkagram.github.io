import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const WORKFLOWS = path.join(ROOT, ".github", "workflows");
const workflowFiles = fs.readdirSync(WORKFLOWS).filter((name) => /\.ya?ml$/.test(name));
const workflowText = Object.fromEntries(workflowFiles.map((name) => [name, fs.readFileSync(path.join(WORKFLOWS, name), "utf8")]));

const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const packageLock = JSON.parse(fs.readFileSync(path.join(ROOT, "package-lock.json"), "utf8"));
const readme = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");

test("project runtime baseline is Node 24", () => {
  assert.equal(packageJson.engines.node, ">=24");
  assert.equal(packageLock.packages[""].engines.node, ">=24");
  assert.match(readme, /Requirements: Node\.js 24 or newer\./);
});

test("GitHub workflows use Node-24-compatible checkout and setup actions", () => {
  const all = Object.values(workflowText).join("\n");
  assert.doesNotMatch(all, /actions\/checkout@v[1-5]\b/);
  assert.doesNotMatch(all, /actions\/setup-node@v[1-5]\b/);

  for (const name of ["verify.yml", "verify-reasoning.yml", "deploy-pages.yml"]) {
    assert.match(workflowText[name], /actions\/checkout@v6/);
    assert.match(workflowText[name], /actions\/setup-node@v6/);
    assert.match(workflowText[name], /node-version:\s*24/);
  }

  assert.match(workflowText["indexnow.yml"], /actions\/checkout@v6/);
});
