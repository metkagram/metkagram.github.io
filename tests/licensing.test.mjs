import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const DIST = path.resolve("dist");

function read(...segments) {
  return fs.readFileSync(path.join(DIST, ...segments), "utf8");
}

test("machine-readable rights policy is published", () => {
  const rights = JSON.parse(read("rights.json"));
  assert.strictEqual(rights.status, "source-available-not-open-source");
  assert.strictEqual(rights.defaultRights, "all-rights-reserved");
  assert.strictEqual(rights.permissionsWithoutSeparateLicense.bulkCopy, false);
  assert.strictEqual(rights.permissionsWithoutSeparateLicense.commercialIntegration, false);
  assert.strictEqual(rights.permissionsWithoutSeparateLicense.modelTrainingOnSubstantialMaterial, false);
  assert.strictEqual(rights.licensingAvailable.academicResearch, true);
  assert.strictEqual(rights.licensingAvailable.commercial, true);
});

test("localized licensing pages are shipped", () => {
  for (const locale of ["en", "ru"]) {
    const html = read(locale, "licensing", "index.html");
    assert.ok(html.includes(`/${locale}/licensing/`));
    assert.ok(html.includes('name="metkagram-rights"'));
    assert.ok(html.includes('content="source-available-not-open-source"'));
    assert.ok(html.includes("17 August 2026") || html.includes("17 августа 2026"));
  }
});

test("generated legal and AI pages expose current rights instead of the legacy license label", () => {
  for (const locale of ["en", "ru"]) {
    for (const route of [["about", "index.html"], ["legal", "terms", "index.html"], ["ai", "index.html"]]) {
      const html = read(locale, ...route);
      assert.ok(html.includes(`rel="license" href="/${locale}/licensing/"`));
      assert.ok(html.includes(`href="/${locale}/licensing/"`));
      assert.ok(!html.includes('href="/LICENSE">CC BY-NC 4.0</a>'));
    }
  }
});
