import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { releaseState } from "../src/release.mjs";

const release = releaseState();
const siteUrl = release.canonicalUrl.replace(/\/$/, "");
const feedUrl = `${siteUrl}/feed.xml`;
const expectedDate = new Date(`${release.releaseDate}T00:00:00Z`).toUTCString();

const read = (path) => readFile(path, "utf8");

test("RSS feed is derived from canonical release state", async () => {
  const rss = await read("dist/feed.xml");
  assert.match(rss, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(rss, /<rss version="2\.0"/);
  assert.ok(rss.includes(`<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`));
  assert.ok(rss.includes(`<lastBuildDate>${expectedDate}</lastBuildDate>`));
  assert.ok(rss.includes(`<pubDate>${expectedDate}</pubDate>`));
  assert.ok(rss.includes(`<guid isPermaLink="false">urn:metkagram:release:${release.productVersion}</guid>`));
  assert.ok(rss.includes(`<link>${siteUrl}/</link>`));
});

test("primary HTML surfaces advertise RSS", async () => {
  for (const path of ["dist/index.html", "dist/en/index.html", "dist/en/research/index.html"]) {
    const html = await read(path);
    assert.ok(html.includes('rel="alternate" type="application/rss+xml"'), `${path} lacks RSS autodiscovery`);
    assert.ok(html.includes(`href="${feedUrl}"`), `${path} does not advertise canonical feed URL`);
  }
});

test("robots sitemap directives never point at feeds", async () => {
  const robots = await read("dist/robots.txt");
  for (const line of robots.split(/\r?\n/)) {
    assert.equal(/^Sitemap:/i.test(line) && /(?:feed|rss|atom)\.xml/i.test(line), false, `invalid feed Sitemap directive: ${line}`);
  }
});
