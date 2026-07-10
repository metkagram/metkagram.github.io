import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const DIST = path.join(process.cwd(), "dist");
const redirects = JSON.parse(fs.readFileSync(path.join(DIST, "migration/redirects.json"), "utf8"));

function targetExists(destination) {
  const url = new URL(destination);
  if (url.origin !== "https://metkagram.github.io") return true;
  const relative = url.pathname.replace(/^\/+/, "");
  return fs.existsSync(path.join(DIST, relative)) || fs.existsSync(path.join(DIST, relative, "index.html"));
}

test("every migrated old URL is unique and mapped", () => {
  const sources = redirects.map((redirect) => redirect.source);
  assert.equal(new Set(sources).size, sources.length);
  assert.ok(sources.includes("/metkagram/en/dialogues"));
  assert.ok(sources.includes("/metkagram/de/library"));
  assert.ok(sources.includes("/ru/metkax/CON001"));
  assert.equal(redirects.filter((redirect) => redirect.status === "ready").length, redirects.length - 2);
});

test("all new-domain redirect targets exist", () => {
  const missing = redirects.filter((redirect) => redirect.destination.startsWith("https://metkagram.github.io") && !targetExists(redirect.destination));
  assert.deepEqual(missing, []);
});

test("redirects have no chains", () => {
  const oldAbsolute = new Set(redirects.map((redirect) => `https://metalhatscats.com${redirect.source}`));
  const chained = redirects.filter((redirect) => oldAbsolute.has(redirect.destination));
  assert.deepEqual(chained, []);
});

test("migration map contains every redirect record", () => {
  const markdown = fs.readFileSync(path.join(process.cwd(), "MIGRATION_MAP.md"), "utf8");
  for (const redirect of redirects) assert.ok(markdown.includes(`https://metalhatscats.com${redirect.source}`), redirect.source);
});
