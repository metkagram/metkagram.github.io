import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const read = (...parts) => fs.readFileSync(path.join(DIST, ...parts), "utf8");
const json = (...parts) => JSON.parse(read(...parts));

test("repository and published artifact expose machine-readable citation metadata", () => {
  const source = fs.readFileSync(path.join(ROOT, "CITATION.cff"), "utf8");
  const published = read("CITATION.cff");
  assert.equal(published, source);
  assert.match(source, /^cff-version: 1\.2\.0/m);
  assert.match(source, /Kharlanau/);
  assert.match(source, /https:\/\/metkagram\.github\.io\//);
});

test("localized citation pages publish current source-available terms", () => {
  for (const locale of ["en", "ru"]) {
    const html = read(locale, "cite", "index.html");
    assert.match(html, /Metkagram Source-Available Terms/);
    assert.match(html, /CITATION\.cff/);
    assert.match(html, /publication\.json/);
    assert.doesNotMatch(html, /CC BY-NC 4\.0/);
  }
});

test("publication manifest preserves rights and current dataset version", () => {
  const manifest = json("data", "publication.json");
  const api = json("api", "v1", "publication.json");
  assert.equal(manifest.rights.status, "source-available-not-open-source");
  assert.equal(manifest.rights.label, "Metkagram Source-Available Terms");
  assert.match(manifest.rights.summary, /model training/);
  assert.equal(api.data.datasetVersion, manifest.datasetVersion);
  assert.equal(api.provenance.dataset_version, manifest.datasetVersion);
});

test("Hugging Face-ready export is explicit about custom rights and preserves canonical records", () => {
  const card = read("distribution", "huggingface", "README.md");
  assert.match(card, /^---[\s\S]*license: other/m);
  assert.match(card, /license_name: Metkagram Source-Available Terms/);
  assert.match(card, /license_link: https:\/\/metkagram\.github\.io\/en\/licensing\//);
  assert.match(card, /source-available, not open data/i);
  assert.match(card, /model training/);

  const patterns = json("api", "v1", "patterns.json").data;
  const lines = read("distribution", "huggingface", "patterns.jsonl").trim().split("\n");
  assert.equal(lines.length, patterns.length);
  const first = JSON.parse(lines[0]);
  assert.ok(first.data.id);
  assert.equal(first.provenance.source, "Metkagram");
  assert.ok(first.provenance.canonical_url);
  assert.ok(first.provenance.dataset_version);
});

test("citation and publication surfaces are discoverable without indexing machine endpoints", () => {
  const api = json("api", "v1", "index.json");
  const root = api.data && typeof api.data === "object" ? api.data : api;
  assert.ok(root.endpoints.some((item) => item.path === "/publication.json"));

  const llms = read("llms.txt");
  assert.match(llms, /## Citation and publication/);
  assert.match(llms, /distribution\/huggingface\/patterns\.jsonl/);

  const sitemap = read("sitemap.xml");
  assert.match(sitemap, /\/en\/cite\//);
  assert.match(sitemap, /\/ru\/cite\//);
  assert.doesNotMatch(sitemap, /\/api\/v1\/publication\.json/);
});
