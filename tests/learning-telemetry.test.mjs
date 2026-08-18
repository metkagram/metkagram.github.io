import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const json = (relative) => JSON.parse(read(relative));

const expectedEvents = [
  "lens_analyze",
  "learning_object_open",
  "clinic_feedback_reveal",
  "pack_step_open",
  "transfer_feedback_reveal",
  "export_download",
];

test("learning event schema is bounded and excludes learner content or identity fields", () => {
  const schema = json("data/learning-event.schema.json");
  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.properties.event_name.enum, expectedEvents);
  const source = JSON.stringify(schema).toLowerCase();
  for (const forbidden of ["raw_text", "input_text", "email", "ip_address", "persistent_user", "cookie_id"]) assert.equal(source.includes(forbidden), false, `schema must not contain ${forbidden}`);
  assert.equal(schema.properties.metadata.additionalProperties, false);
});

test("browser runtime is local-only and has no network transport", () => {
  const source = read("public/assets/learning-events.js");
  assert.match(source, /localStorage/);
  assert.match(source, /sessionStorage/);
  assert.match(source, /MAX_EVENTS = 1000/);
  for (const forbidden of ["fetch(", "sendBeacon", "XMLHttpRequest", "WebSocket", "EventSource"]) assert.equal(source.includes(forbidden), false, `runtime must not use ${forbidden}`);
  assert.equal(source.includes("data-lens-text"), false, "runtime must not read Pattern Lens input text");
});

test("build publishes localized activity pages with explicit learner control", () => {
  for (const locale of ["en", "ru"]) {
    const html = read(`dist/${locale}/activity/index.html`);
    assert.match(html, /data-learning-activity/);
    assert.match(html, /assets\/learning-events\.js/);
    assert.match(html, /assets\/learning-activity\.js/);
    assert.match(html, /learning-event\.schema\.json/);
  }
});

test("learning runtime is wired into the reviewed product surfaces", () => {
  const routes = [
    "en/lens/index.html",
    "en/clinic/index.html",
    "en/packs/index.html",
    "en/transfer/index.html",
    "en/exports/index.html",
    "ru/lens/index.html",
    "ru/clinic/index.html",
    "ru/packs/index.html",
    "ru/transfer/index.html",
    "ru/exports/index.html",
  ];
  for (const route of routes) {
    const html = read(`dist/${route}`);
    assert.match(html, /assets\/learning-events\.js/, route);
    assert.match(html, /data-learning-activity-bridge/, route);
  }
});

test("privacy page discloses local learning storage and learner controls", () => {
  for (const locale of ["en", "ru"]) {
    const html = read(`dist/${locale}/legal/privacy/index.html`);
    assert.match(html, /data-local-learning-privacy/);
    assert.match(html, new RegExp(`/${locale}/activity/`));
  }
});

test("event schema is published consistently through data and API surfaces", () => {
  const source = json("data/learning-event.schema.json");
  assert.deepEqual(json("dist/data/learning-event.schema.json"), source);
  assert.deepEqual(json("dist/api/v1/learning-event-schema.json"), source);
  const api = json("dist/api/v1/index.json");
  assert.match(api.learning_event_schema, /learning-event-schema\.json$/);
  assert.ok(api.endpoints.some((item) => item.path === "/learning-event-schema.json"));
  const mcp = json("dist/api/v1/mcp-server.json");
  assert.ok(mcp.tools.some((tool) => tool.name === "metkagram_get_learning_event_schema"));
  assert.match(mcp.local_learning_activity.note, /browser-local/);
  const openapi = json("dist/api/v1/openapi.json");
  assert.ok(openapi.paths["/learning-event-schema.json"]);
});

test("activity routes are included in sitemap and SEO inventory", () => {
  const sitemap = read("dist/sitemap.xml");
  const seo = json("dist/seo/site-pages.json");
  for (const locale of ["en", "ru"]) {
    assert.match(sitemap, new RegExp(`/${locale}/activity/`));
    assert.ok(seo.pages.some((page) => page.route === `/${locale}/activity/`));
  }
  assert.match(read("dist/llms.txt"), /## Local learning activity/);
});
