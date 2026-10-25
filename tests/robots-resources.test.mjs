import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildRobotsTxt } from "../src/api.mjs";

const DIST = path.join(process.cwd(), "dist");
const ORIGIN = "https://metkagram.github.io";

// Evaluate this project's path rules with longest-match precedence. This is a
// regression fixture, not a general robots.txt conformance implementation.
function allows(robots, userAgent, pathname) {
  const groups = [];
  let group;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const match = line.match(/^(user-agent|allow|disallow):\s*(.*)$/i);
    if (!match) continue;
    const [, directive, value] = match;
    if (directive.toLowerCase() === "user-agent") {
      if (!group || group.rules.length) groups.push(group = { agents: [], rules: [] });
      group.agents.push(value.toLowerCase());
    } else if (group && value) {
      group.rules.push({ allow: directive.toLowerCase() === "allow", value });
    }
  }
  const selected = groups.map(item => ({ ...item, specificity: Math.max(-1,
    ...item.agents.map(agent => agent === "*" ? 0 : userAgent.toLowerCase().includes(agent) ? agent.length : -1)) }));
  const specificity = Math.max(-1, ...selected.map(item => item.specificity));
  const matches = selected.filter(item => item.specificity === specificity).flatMap(item => item.rules)
    .filter(rule => {
      const end = rule.value.endsWith("$");
      const pattern = (end ? rule.value.slice(0, -1) : rule.value)
        .split("*").map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
      return new RegExp(`^${pattern}${end ? "$" : ""}`).test(pathname);
    }).sort((a, b) => b.value.replace(/[\*$]/g, "").length - a.value.replace(/[\*$]/g, "").length || Number(b.allow) - Number(a.allow));
  return matches[0]?.allow ?? true;
}

test("default Search crawlers can retrieve released rendering and image resources", () => {
  const robots = buildRobotsTxt([]);
  for (const resource of ["/assets/styles.css", "/assets/app.js", "/assets/pattern-reading.css",
    "/assets/pattern-reading.js", "/assets/icons/favicon.ico", "/assets/logo/metkagram-logo-dark.svg",
    "/assets/images/studio-texture-yellow.jpg", "/assets/social/metkagram-social-preview-1200x630.png",
    "/assets/web/site.webmanifest"]) {
    for (const agent of ["Googlebot", "Googlebot-Image", "bingbot"]) {
      assert.ok(allows(robots, agent, resource), `${agent} is blocked from ${resource}`);
    }
  }
});

test("rendering exceptions preserve migration and other asset exclusions", () => {
  const robots = buildRobotsTxt([]);
  for (const resource of ["/migration/", "/migration/archive.json", "/assets/source/metkagram-mark-source.svg",
    "/assets/README.md", "/assets/private.json", "/assets/web/head-snippet.html", "/assets/app.js.map"]) {
    assert.equal(allows(robots, "Googlebot", resource), false, `Unexpected crawl exception: ${resource}`);
  }
  assert.ok(allows(robots, "Googlebot", "/api/v1/index.json"));
  assert.ok(allows(robots, "OAI-SearchBot", "/en/"));
});

test("built root and locale HTML resources are available and crawlable", () => {
  const robots = fs.readFileSync(path.join(DIST, "robots.txt"), "utf8");
  assert.equal(robots, buildRobotsTxt([]));
  const resources = new Set();
  for (const file of ["index.html", "en/index.html", "ru/index.html"]) {
    const html = fs.readFileSync(path.join(DIST, file), "utf8");
    for (const match of html.matchAll(/\b(?:src|href|content)=["']([^"']+)["']/g)) {
      let url;
      try { url = new URL(match[1], ORIGIN); } catch { continue; }
      if (url.origin === ORIGIN && url.pathname.startsWith("/assets/")) resources.add(url.pathname + url.search);
    }
  }
  assert.ok(resources.has("/assets/styles.css"));
  assert.ok(resources.has("/assets/app.js"));
  assert.ok(resources.has("/assets/icons/favicon.ico"));
  for (const resource of resources) {
    assert.ok(fs.existsSync(path.join(DIST, new URL(resource, ORIGIN).pathname)), `Missing built asset ${resource}`);
    assert.ok(allows(robots, "Googlebot", resource), `Final artifact blocks rendered asset ${resource}`);
  }
});
