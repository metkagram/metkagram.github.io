import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";
import { REVIEWED_STARTER_SET_IDS, resolveEditorialReadiness } from "../src/editorial-readiness.mjs";
import { studySetPath } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative) => JSON.parse(read(relative));
const dataOf = (value) => value && typeof value === "object" && "data" in value ? value.data : value;
const tiers = readJson("data/quality/editorial-tiers.json");
const content = loadContent();
const resolved = resolveEditorialReadiness({ tiers, studySets: content.studySets.sets });

function keysDeep(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => keysDeep(item, output));
    return output;
  }
  if (!value || typeof value !== "object") return output;
  for (const [key, child] of Object.entries(value)) {
    output.push(key);
    keysDeep(child, output);
  }
  return output;
}

test("reviewed starter policy accepts only explicit A/B study sets", () => {
  assert.deepEqual(resolved.starters.map((record) => record.set_id), REVIEWED_STARTER_SET_IDS);
  for (const record of resolved.starters) {
    assert.ok(["A", "B"].includes(record.tier), `${record.set_id} starter tier must be A/B`);
    assert.equal(record.starter_eligible, true);
    assert.equal(record.featured_start, true);
  }

  const tierD = tiers.tiers.find((tier) => tier.id === "D");
  assert.ok(tierD?.set_ids?.length, "tier D needs at least one remediation set for fail-closed regression coverage");
  const bySetId = new Map(resolved.sets.map((record) => [record.set_id, record]));
  for (const setId of tierD.set_ids) {
    assert.equal(bySetId.get(setId)?.starter_eligible, false, `${setId} must not be starter eligible`);
    assert.equal(bySetId.get(setId)?.featured_start, false, `${setId} must not be featured`);
  }

  assert.throws(() => resolveEditorialReadiness({
    tiers,
    studySets: content.studySets.sets,
    starterSetIds: [tierD.set_ids[0]],
  }), /only A\/B may enter reviewed starter discovery/i);
});

test("Practice leads with reviewed Routes and A/B sets before the full reference catalogue", () => {
  const setById = new Map(content.studySets.sets.map((set) => [set.id, set]));
  const tierD = new Set(tiers.tiers.find((tier) => tier.id === "D").set_ids);

  for (const locale of ["en", "ru"]) {
    const html = read(`dist/${locale}/practice/index.html`);
    const reviewedIndex = html.indexOf("data-reviewed-discovery");
    const catalogueIndex = html.indexOf('id="all-patterns"');
    assert.ok(reviewedIndex >= 0, `${locale} Practice needs reviewed discovery`);
    assert.ok(catalogueIndex > reviewedIndex, `${locale} reviewed discovery must precede the full catalogue`);
    assert.ok(html.includes(`href="/${locale}/packs/"`), `${locale} Practice should lead to reviewed Routes`);
    assert.ok(html.includes('href="#all-patterns"'), `${locale} Practice should retain an explicit route to the complete catalogue`);

    for (const setId of REVIEWED_STARTER_SET_IDS) {
      const set = setById.get(setId);
      assert.ok(set, `missing starter set ${setId}`);
      assert.ok(html.includes(`data-reviewed-starter-set="${setId}"`), `${locale} Practice missing starter ${setId}`);
      assert.ok(html.includes(`href="${studySetPath(locale, set)}"`), `${locale} Practice starter ${setId} must keep its canonical URL`);
    }
    for (const setId of tierD) {
      assert.equal(html.includes(`data-reviewed-starter-set="${setId}"`), false, `${locale} Practice must not promote Tier D set ${setId}`);
    }
  }
});

test("editorial readiness API covers the complete study-set inventory without efficacy scoring", () => {
  const published = readJson("dist/data/editorial-readiness.json");
  const api = readJson("dist/api/v1/editorial-readiness.json");
  assert.equal(published.schemaVersion, 1);
  assert.equal(published.status, "editorial-readiness");
  assert.equal(published.sets.length, content.studySets.sets.length);
  assert.deepEqual(published.starterPolicy.featured_set_ids, REVIEWED_STARTER_SET_IDS);
  assert.deepEqual(published.starterPolicy.allowed_tiers, ["A", "B"]);
  assert.match(published.evidenceBoundary, /not a learning-efficacy score/i);
  assert.equal(api.provenance.record_type, "editorial_readiness");
  assert.equal(dataOf(api).sets.length, content.studySets.sets.length);

  for (const key of keysDeep(published)) {
    assert.equal(/(?:^|_)score(?:_|$)/i.test(key), false, `readiness API must not expose a numeric score field: ${key}`);
  }

  const dRecords = published.sets.filter((set) => set.tier === "D");
  assert.ok(dRecords.length > 0);
  assert.ok(dRecords.every((set) => !set.starter_eligible && !set.featured_start));
});

test("agents can retrieve readiness policy directly instead of inferring it from HTML", () => {
  const index = dataOf(readJson("dist/api/v1/index.json"));
  assert.ok(index.endpoints.some((item) => item.path === "/editorial-readiness.json"));
  assert.ok(index.datasets.some((item) => item.id === "editorial-readiness"));

  const mcp = readJson("dist/api/v1/mcp-server.json");
  assert.ok(mcp.tools.some((tool) => tool.name === "metkagram_get_editorial_readiness"));

  const openapi = readJson("dist/api/v1/openapi.json");
  assert.ok(openapi.paths["/editorial-readiness.json"]);

  const llms = read("dist/llms.txt");
  assert.match(llms, /## Editorial readiness/);
  assert.match(llms, /Tier A\/B/);
  assert.match(llms, /not learning efficacy/i);
});
