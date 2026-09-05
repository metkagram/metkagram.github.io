import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

test("Lens practice emits a text-free completion signal after a real check", () => {
  const source = read("public/assets/lens-practice-bridge.js");
  assert.match(source, /lensPracticeComplete = 'true'/);
  assert.match(source, /metkagram:lens-practice-complete/);
  assert.match(source, /detail: \{ patternId \}/);
  assert.doesNotMatch(source, /detail:\s*\{[^}]*answer/i);
  assert.doesNotMatch(source, /detail:\s*\{[^}]*text/i);
});

test("reviewed Lens relations belong only to the focused result", () => {
  const source = read("public/assets/lens-knowledge-bridge.js");
  assert.match(source, /querySelector\("\.lens-card--primary"\)/);
  assert.doesNotMatch(source, /for \(const card of results\.querySelectorAll\("\.lens-card"\)\)/);
  assert.match(source, /data\.lensPracticeComplete !== "true"/);
  assert.match(source, /section\.hidden = true/);
  assert.match(source, /metkagram:lens-practice-complete/);
  assert.match(source, /section\.hidden = false/);
});

test("guided next step preserves reviewed Contrast, Choice and Route destinations", () => {
  const source = read("public/assets/lens-knowledge-bridge.js");
  assert.match(source, /data-relation-kind="contrast"/);
  assert.match(source, /data-relation-kind="drill"/);
  assert.match(source, /data-relation-kind="pack"/);
  assert.match(source, /\/contrasts\//);
  assert.match(source, /\/clinic\/#/);
  assert.match(source, /\/packs\//);
});
