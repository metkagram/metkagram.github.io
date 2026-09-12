import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { SITE_URL } from "../src/site.mjs";

const html = fs.readFileSync(path.resolve("dist", "index.html"), "utf8");
const repositoryUrl = "https://github.com/metkagram/metkagram.github.io";

function structuredData() {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}

test("root gateway publishes crawlable product identity and locale relationships", () => {
  assert.match(html, /<title>Metkagram: Language Patterns and Annotated Examples<\/title>/);
  assert.match(html, /<meta name="description" content="Explore annotated English and German phrases, reusable B2–C1 language patterns, contrasts and practice resources from Metkagram\.">/);
  assert.match(html, /Language patterns · annotated examples · deliberate practice/);
  assert.match(html, /Annotated English and German phrases, reusable B2–C1 patterns, contrasts and practice resources\./);
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\/">`));
  assert.match(html, new RegExp(`<link rel="alternate" hreflang="en" href="${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\/en\/">`));
  assert.match(html, new RegExp(`<link rel="alternate" hreflang="ru" href="${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\/ru\/">`));
  assert.match(html, new RegExp(`<link rel="alternate" hreflang="x-default" href="${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\/">`));
  assert.doesNotMatch(html, /http-equiv="refresh"|location\.replace\s*\(/i);
});

test("root gateway exposes method, evidence, citation and canonical repository exits", () => {
  for (const href of ["/en/method/", "/en/research/", "/en/cite/", repositoryUrl]) {
    assert.ok(html.includes(`href="${href}"`), `root should link to ${href}`);
  }

  const graph = structuredData();
  const website = graph.find((item) => item["@type"] === "WebSite");
  const organization = graph.find((item) => item["@type"] === "Organization");
  const webpage = graph.find((item) => item["@type"] === "WebPage");

  assert.equal(website?.["@id"], `${SITE_URL}/#website`);
  assert.equal(organization?.["@id"], `${SITE_URL}/#organization`);
  assert.deepEqual(organization?.sameAs, [repositoryUrl]);
  assert.equal(webpage?.publisher?.["@id"], `${SITE_URL}/#organization`);
  assert.equal(webpage?.isPartOf?.["@id"], `${SITE_URL}/#website`);
});
