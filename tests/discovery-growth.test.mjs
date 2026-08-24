import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { loadContent } from "../src/content.mjs";
import { topicPatterns } from "../src/discovery-pages.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const DATA = path.join(ROOT, "data");
const topicsSource = JSON.parse(fs.readFileSync(path.join(DATA, "discovery-topics.json"), "utf8"));
const topicExtensionFiles = fs.readdirSync(DATA)
  .filter((name) => /^discovery-topics-extension(?:-[a-z0-9-]+)?\.json$/.test(name))
  .sort();
const topicExtensions = topicExtensionFiles.map((name) => ({
  name,
  payload: JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"))
}));
const allTopics = [topicsSource, ...topicExtensions.map((entry) => entry.payload)].flatMap((payload) => payload.topics);
const opportunitiesSource = JSON.parse(fs.readFileSync(path.join(DATA, "partnership-opportunities.json"), "utf8"));
const studySets = JSON.parse(fs.readFileSync(path.join(DIST, "data", "study-sets.json"), "utf8"));
const sitemap = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8");
const inventory = JSON.parse(fs.readFileSync(path.join(DIST, "seo", "site-pages.json"), "utf8"));

function html(...parts) {
  return fs.readFileSync(path.join(DIST, ...parts, "index.html"), "utf8");
}

test("Pattern Atlas topics are curated against real study sets", () => {
  assert.equal(topicsSource.schemaVersion, 1);
  assert.ok(topicExtensions.length >= 1, "at least one additive discovery extension is expected");
  for (const { name, payload } of topicExtensions) {
    assert.equal(payload.schemaVersion, 1, `${name} must use schemaVersion 1`);
    assert.ok(Array.isArray(payload.topics), `${name} must expose topics`);
  }
  assert.ok(allTopics.length >= 10);
  assert.ok(allTopics.length <= 40, "discovery layer should stay deliberately curated rather than keyword-generated");

  const validSets = new Set(studySets.sets.map((set) => set.id));
  const ids = new Set(allTopics.map((topic) => topic.id));
  assert.equal(ids.size, allTopics.length);
  assert.equal(new Set(allTopics.map((topic) => topic.slug)).size, allTopics.length);

  for (const topic of allTopics) {
    assert.ok(topic.set_ids.length > 0, `${topic.id} has no study sets`);
    assert.ok(topic.use_cases_en.length >= 3, `${topic.id} has too few English use cases`);
    assert.ok(topic.use_cases_ru.length >= 3, `${topic.id} has too few Russian use cases`);
    for (const setId of topic.set_ids) assert.ok(validSets.has(setId), `${topic.id} references unknown set ${setId}`);
    for (const related of topic.related) assert.ok(ids.has(related), `${topic.id} references unknown related topic ${related}`);
  }
});

test("Pattern Atlas is visible, canonical and included in discovery infrastructure", () => {
  const routes = new Set(inventory.pages.map((page) => page.route));
  for (const locale of ["en", "ru"]) {
    const index = html(locale, "patterns");
    const practice = html(locale, "practice");
    assert.match(index, /Pattern Atlas|Атлас языковых паттернов/);
    assert.match(index, /application\/ld\+json/);
    assert.doesNotMatch(index, /#mobile-application/);
    assert.match(practice, new RegExp(`href="/${locale}/patterns/"`));
    assert.ok(routes.has(`/${locale}/patterns/`));
    assert.match(sitemap, new RegExp(`<loc>https://metkagram\\.github\\.io/${locale}/patterns/</loc>`));

    for (const topic of allTopics) {
      const page = html(locale, "patterns", topic.slug);
      assert.match(page, /LearningResource/);
      assert.match(page, /ItemList/);
      assert.doesNotMatch(page, /#mobile-application/);
      assert.ok(routes.has(`/${locale}/patterns/${topic.slug}/`));
      assert.match(sitemap, new RegExp(`<loc>https://metkagram\\.github\\.io/${locale}/patterns/${topic.slug}/</loc>`));
      for (const setId of topic.set_ids) {
        const set = studySets.sets.find((item) => item.id === setId);
        assert.match(page, new RegExp(`/practice/sets/[^\"]+/`));
        assert.match(page, new RegExp(locale === "ru" ? set.title_ru : set.title_en));
      }
    }
  }

  const publicTopics = JSON.parse(fs.readFileSync(path.join(DIST, "data", "discovery-topics.json"), "utf8"));
  const seoTopics = JSON.parse(fs.readFileSync(path.join(DIST, "seo", "discovery-topics.json"), "utf8"));
  assert.equal(publicTopics.topics.length, allTopics.length);
  assert.equal(seoTopics.topicCount, allTopics.length);
  assert.equal(seoTopics.routes.length, allTopics.length * 2 + 2);
});

test("public partnership page exposes bounded pilot packages", () => {
  assert.equal(opportunitiesSource.schemaVersion, 1);
  assert.ok(opportunitiesSource.opportunities.length >= 4);
  for (const locale of ["en", "ru"]) {
    const support = html(locale, "support");
    assert.match(support, /id="partnership-pilots"/);
    for (const item of opportunitiesSource.opportunities) {
      assert.match(support, new RegExp(locale === "ru" ? item.title_ru : item.title_en));
    }
  }

  const publicOpportunities = JSON.parse(fs.readFileSync(path.join(DIST, "data", "partnership-opportunities.json"), "utf8"));
  assert.equal(publicOpportunities.opportunities.length, opportunitiesSource.opportunities.length);
});

test("Atlas and partnership pilots are discoverable to agents without pretending they improve Google rankings", () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(DIST, "data", "catalog.json"), "utf8"));
  assert.equal(catalog.patternAtlas.topicCount, allTopics.length);
  assert.match(catalog.patternAtlas.dataset, /\/data\/discovery-topics\.json$/);
  assert.match(catalog.patternAtlas.pages.en, /\/en\/patterns\/$/);
  assert.equal(catalog.partnershipOpportunities.count, opportunitiesSource.opportunities.length);
  assert.match(catalog.partnershipOpportunities.dataset, /\/data\/partnership-opportunities\.json$/);

  const llms = fs.readFileSync(path.join(DIST, "llms.txt"), "utf8");
  assert.match(llms, /## Pattern Atlas/);
  assert.match(llms, /\/data\/discovery-topics\.json/);
  assert.match(llms, /learner knows the communication goal/i);
  assert.match(llms, /## Partnership pilots/);
  assert.match(llms, /not as evidence of existing partners or traction/i);
});

test("topic pattern samples follow the declared set order, not corpus storage order (#71)", () => {
  const content = loadContent();
  const multiSetTopics = allTopics.filter((topic) => topic.set_ids.length > 1);
  assert.ok(multiSetTopics.length > 0, "expected at least one multi-set topic");
  for (const topic of multiSetTopics) {
    const patterns = topicPatterns(content, topic);
    assert.ok(patterns.length > 0, `${topic.id} maps to no patterns`);
    const rank = new Map(topic.set_ids.map((id, index) => [id, index]));
    const ranks = patterns.map((pattern) => rank.get(pattern.set_id));
    for (let index = 1; index < ranks.length; index += 1) {
      assert.ok(ranks[index] >= ranks[index - 1], `${topic.id}: patterns must be grouped in declared set_ids order`);
    }
    // The displayed editorial sample is the first 24; it must start with the first declared set.
    assert.equal(patterns[0].set_id, topic.set_ids[0], `${topic.id}: sample must open with ${topic.set_ids[0]}`);
    // Set grouping is storage-order independent (within-set order follows canonical shard order).
    const shuffled = { ...content, advancedPatterns: [...content.advancedPatterns].reverse() };
    assert.deepEqual(topicPatterns(shuffled, topic).map((pattern) => pattern.set_id), patterns.map((pattern) => pattern.set_id), `${topic.id}: set grouping must be storage-order independent`);
  }
});
