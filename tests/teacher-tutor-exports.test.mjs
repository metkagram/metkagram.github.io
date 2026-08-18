import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const packs = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "reasoning-packs.json"), "utf8"));
const index = JSON.parse(fs.readFileSync(path.join(DIST, "data", "teacher-exports.json"), "utf8"));

function exportPath(packId, extension) {
  return path.join(DIST, "exports", "reasoning-packs", `${packId}.${extension}`);
}

test("every reviewed Reasoning Pack has portable JSON, CSV and TSV exports", () => {
  assert.equal(index.schemaVersion, 1);
  assert.equal(index.status, "reviewed-public-exports");
  assert.equal(index.items.length, packs.packs.length);
  assert.equal(index.rights.attribution_required, true);
  assert.equal(index.rights.rights_status, "source-available-not-open-source");

  for (const pack of packs.packs) {
    const item = index.items.find((entry) => entry.pack_id === pack.id);
    assert.ok(item, `Missing export index item for ${pack.id}`);
    assert.equal(item.stepCount, pack.steps.length);
    assert.ok(fs.existsSync(exportPath(pack.id, "json")));
    assert.ok(fs.existsSync(exportPath(pack.id, "csv")));
    assert.ok(fs.existsSync(exportPath(pack.id, "anki.tsv")));
  }
});

test("JSON bundles preserve pack order, stable IDs, canonical links and rights", () => {
  for (const pack of packs.packs) {
    const bundle = JSON.parse(fs.readFileSync(exportPath(pack.id, "json"), "utf8"));
    assert.equal(bundle.type, "teacher-tutor-reuse-bundle");
    assert.equal(bundle.pack.id, pack.id);
    assert.equal(bundle.cards.length, pack.steps.length);
    assert.equal(bundle.rights.attribution_required, true);
    assert.match(bundle.rights.license_url, /\/en\/licensing\/$/);
    assert.deepEqual(bundle.cards.map((card) => card.object_id), pack.steps.map((step) => step.id));
    for (const card of bundle.cards) {
      assert.ok(["pattern", "contrast", "drill"].includes(card.kind));
      assert.match(card.canonical_url, /^https:\/\/metkagram\.github\.io\/(en\/practice|en\/contrasts|en\/clinic)/);
      assert.ok(card.front_en);
      assert.ok(card.back_en);
      assert.ok(card.front_ru);
      assert.ok(card.back_ru);
    }
  }
});

test("CSV and study TSV expose stable columns without private pipeline fields", () => {
  for (const pack of packs.packs) {
    const csv = fs.readFileSync(exportPath(pack.id, "csv"), "utf8");
    const tsv = fs.readFileSync(exportPath(pack.id, "anki.tsv"), "utf8");
    assert.match(csv.split("\n")[0], /pack_id,pack_title_en,pack_title_ru,step_no,kind,object_id/);
    assert.match(csv, /canonical_url/);
    assert.match(tsv.split("\n")[0], /^Front_EN\tBack_EN\tFront_RU\tBack_RU\tTags\tCanonical_URL$/);
    assert.doesNotMatch(csv, /spacy_pipeline|lexical_rules|private research core/i);
    assert.doesNotMatch(tsv, /spacy_pipeline|lexical_rules|private research core/i);
  }
});

test("localized export pages and pack pages expose download links", () => {
  for (const locale of ["en", "ru"]) {
    const page = fs.readFileSync(path.join(DIST, locale, "exports", "index.html"), "utf8");
    assert.match(page, /Teacher &amp; Tutor Exports|Teacher & Tutor Exports/);
    assert.match(page, /\/exports\/reasoning-packs\//);
    for (const pack of packs.packs) {
      assert.match(page, new RegExp(`${pack.id}\\.json`));
      assert.match(page, new RegExp(`${pack.id}\\.csv`));
      assert.match(page, new RegExp(`${pack.id}\\.anki\\.tsv`));
      const packPage = fs.readFileSync(path.join(DIST, locale, "packs", pack.id, "index.html"), "utf8");
      assert.match(packPage, /data-teacher-export-links/);
      assert.match(packPage, new RegExp(`${pack.id}\\.json`));
    }
  }
});

test("teacher exports are discoverable through API, MCP, teaching and SEO surfaces", () => {
  const api = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "teacher-exports.json"), "utf8"));
  assert.equal(api.data.items.length, packs.packs.length);
  assert.equal(api.provenance.record_type, "teacher_tutor_export_index");

  const mcp = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "mcp-server.json"), "utf8"));
  assert.ok(mcp.tools.some((tool) => tool.name === "metkagram_get_teacher_exports"));

  const openapi = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "openapi.json"), "utf8"));
  assert.ok(openapi.paths["/teacher-exports.json"]);

  const catalog = JSON.parse(fs.readFileSync(path.join(DIST, "data", "catalog.json"), "utf8"));
  assert.equal(catalog.teacherExports.packCount, packs.packs.length);

  const teaching = JSON.parse(fs.readFileSync(path.join(DIST, "api", "v1", "teaching-manifest.json"), "utf8"));
  assert.match(teaching.interfaces.teacher_exports, /teacher-exports\.json$/);
  assert.ok(teaching.recommended_workflows.some((workflow) => workflow.id === "reuse_reviewed_pack"));

  const discovery = JSON.parse(fs.readFileSync(path.join(DIST, "data", "discovery.json"), "utf8"));
  assert.ok(discovery.surfaces.some((surface) => surface.id === "teacher-exports"));
  assert.ok(discovery.recommendationPolicy.routes.some((route) => route.recommend === "teacher-exports"));

  const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
  assert.match(sitemap, /<loc>https:\/\/metkagram\.github\.io\/en\/exports\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/metkagram\.github\.io\/ru\/exports\/<\/loc>/);
});
