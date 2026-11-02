import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const dist = path.join(root, "dist");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "public/assets/web/site.webmanifest"), "utf8"));

test("PWA manifest has one stable origin-wide identity, launch route and real icons", () => {
  assert.equal(manifest.id, "/");
  assert.equal(manifest.start_url, "/en/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.name, "Metkagram");
  assert.equal(manifest.theme_color, "#FFC400");
  assert.equal(manifest.background_color, "#111111");
  for (const size of [192, 512]) {
    const icon = manifest.icons.find((entry) => entry.sizes === `${size}x${size}`);
    assert.ok(icon, `missing ${size}px icon`);
    assert.equal(icon.type, "image/png");
    assert.equal(icon.purpose, "any");
    const bytes = fs.readFileSync(path.join(root, "public", icon.src.slice(1)));
    assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dist, "assets/web/site.webmanifest"), "utf8")), manifest);
});

test("existing indexable routes keep canonicals and advertise install metadata", () => {
  const routes = [
    ["index.html", "/"],
    ["en/index.html", "/en/"],
    ["ru/index.html", "/ru/"],
    ["en/practice/index.html", "/en/practice/"],
    ["ru/practice/index.html", "/ru/practice/"],
    ["en/lens/index.html", "/en/lens/"]
  ];
  for (const [relative, route] of routes) {
    const html = fs.readFileSync(path.join(dist, relative), "utf8");
    assert.ok(html.includes(`<link rel="canonical" href="https://metkagram.github.io${route}">`), relative);
    assert.ok(html.includes('<link rel="manifest" href="/assets/web/site.webmanifest">'), relative);
    assert.match(html, /<link rel="apple-touch-icon" href="\/assets\/icons\/metkagram-icon-(?:180x180|512x512)\.png">/);
    assert.ok(html.includes('<script src="/assets/pwa-register.js" defer></script>'), relative);
  }
});

test("service worker and offline fallback are published without caching the corpus", () => {
  const worker = fs.readFileSync(path.join(dist, "service-worker.js"), "utf8");
  const registration = fs.readFileSync(path.join(dist, "assets/pwa-register.js"), "utf8");
  const offline = fs.readFileSync(path.join(dist, "offline.html"), "utf8");
  assert.match(registration, /register\("\/service-worker\.js"/);
  assert.match(worker, /request\.mode === "navigate"/);
  assert.match(worker, /CACHE_VERSION = "v1"/);
  assert.match(worker, /response\.ok/);
  assert.doesNotMatch(worker, /self\.skipWaiting\s*\(/);
  assert.doesNotMatch(worker, /SHELL_ASSETS = new Set\(\[[\s\S]*?\/data\//);
  assert.match(offline, /<meta name="robots" content="noindex,follow">/);
  assert.match(offline, /Metkagram is offline/);
});
