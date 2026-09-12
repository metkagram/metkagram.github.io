import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const DIST = path.join(process.cwd(), "dist");

for (const name of ["llms.txt", "llms-full.txt"]) {
  test(`${name} exposes the provider-neutral spoken-practice contract`, () => {
    const text = fs.readFileSync(path.join(DIST, name), "utf8");
    assert.ok(text.includes("/api/v1/schemas/spoken-practice-handoff.json"));
    assert.ok(text.includes("/api/v1/spoken-practice-handoffs.json"));
    assert.ok(text.includes("/api/v1/choices/{id}.json"));
    assert.ok(text.includes("/api/v1/routes/{id}.json"));
  });
}

test("full agent guide preserves product and evidence ownership boundaries", () => {
  const text = fs.readFileSync(path.join(DIST, "llms-full.txt"), "utf8");
  assert.ok(text.includes("Metkagram owns the language structure and prompt"));
  assert.ok(text.includes("external rehearsal tool owns recording, playback, speech evidence, feedback and local session state"));
  assert.ok(text.includes("Do not infer additional objects"));
  assert.ok(text.includes("do not infer equivalence without the published relation"));
});
