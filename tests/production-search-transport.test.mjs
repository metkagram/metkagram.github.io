import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildProductionContract } from "../src/production-contract.mjs";
import { fetchProductionSnapshot, runProductionSmoke, validateSearchTransport } from "../scripts/production-smoke.mjs";

const contract = {
  canonicalOrigin: "https://example.test",
  routes: { home: "/en/", working: "/working/", sitemap: "/sitemap.xml", data: "/data.json" },
};
const fixture = () => ({
  "/en/": {
    status: 200, requestedUrl: "https://example.test/en/", finalUrl: "https://example.test/en/",
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "" },
    text: '<html><head><meta name="robots" content="index,follow"></head><body>Example</body></html>',
  },
  "/working/": { headers: { "x-robots-tag": "noindex" }, text: '<meta name="robots" content="noindex">' },
  "/data.json": { headers: { "x-robots-tag": "noindex" }, text: "{}" },
  "/sitemap.xml": { text: "<urlset><url><loc>https://example.test/en/</loc></url></urlset>" },
});

test("Search transport rejects header/meta noindex despite an index declaration", () => {
  assert.deepEqual(validateSearchTransport(fixture(), contract), []);
  for (const header of ["noindex", "NoIndex, follow", "googlebot: noindex", "none"]) {
    const snapshot = fixture();
    snapshot["/en/"].headers["x-robots-tag"] = header;
    assert(validateSearchTransport(snapshot, contract).some((failure) => failure.message.includes("X-Robots-Tag")));
  }
  for (const name of ["robots", "googlebot", "bingbot"]) {
    const snapshot = fixture();
    snapshot["/en/"].text += `<meta content='noindex' name='${name}'>`;
    assert(validateSearchTransport(snapshot, contract).some((failure) => failure.message.includes(`${name} meta`)));
  }
});

test("Search transport preserves non-sitemap exclusions and ignores inert examples", () => {
  const snapshot = fixture();
  snapshot["/en/"].headers["x-robots-tag"] = "max-image-preview:none";
  snapshot["/en/"].text += '<!-- <meta name="robots" content="noindex"> --><script>const sample = \'<meta name="googlebot" content="noindex">\';</script><p>noindex example</p>';
  assert.deepEqual(validateSearchTransport(snapshot, contract), []);
});

test("missing transport evidence, representation drift and redirects cannot pass", () => {
  for (const patch of [
    { headers: null },
    { headers: { "content-type": "application/json" } },
    { finalUrl: "https://other.example/en/" },
    { requestedUrl: undefined },
  ]) {
    const snapshot = fixture();
    Object.assign(snapshot["/en/"], patch);
    assert(validateSearchTransport(snapshot, contract).length > 0);
  }
  const empty = fixture();
  empty["/sitemap.xml"].text = "<urlset/>";
  assert(validateSearchTransport(empty, contract).some((failure) => failure.message.includes("unresolved")));
});

test("snapshot captures actual headers and requests canonical GET without a cache-busting query", async () => {
  const requests = [];
  const snapshot = await fetchProductionSnapshot({
    baseUrl: contract.canonicalOrigin, contract,
    fetchImpl: async (url, options) => {
      requests.push({ url: String(url), method: options.method });
      const response = new Response("fixture", { headers: { "content-type": "text/html", "x-robots-tag": "noindex" } });
      Object.defineProperty(response, "url", { value: String(url) });
      return response;
    },
  });
  assert(requests.every((request) => new URL(request.url).search === "" && request.method === "GET"));
  assert.equal(snapshot["/en/"].headers["x-robots-tag"], "noindex");
  assert.equal(snapshot["/en/"].requestedUrl, "https://example.test/en/");
});

function artifactFetch(blockedRoute) {
  return async (url) => {
    const route = new URL(url).pathname;
    const relative = route.replace(/^\//, "");
    const file = route.endsWith("/") ? path.join("dist", relative, "index.html") : path.join("dist", relative);
    const text = fs.readFileSync(file, "utf8");
    const contentType = route.endsWith("/") ? "text/html" : route.endsWith(".json") ? "application/json" : "text/plain";
    const response = new Response(text, { headers: { "content-type": contentType, ...(route === blockedRoute ? { "x-robots-tag": "noindex" } : {}) } });
    Object.defineProperty(response, "url", { value: String(url) });
    return response;
  };
}

test("full production smoke rejects a serving noindex even when generated release content is valid", async () => {
  const expected = buildProductionContract();
  const options = { baseUrl: expected.canonicalOrigin, attempts: 1, log: { log() {}, warn() {} } };
  const good = await runProductionSmoke({ ...options, fetchImpl: artifactFetch() });
  assert.equal(good.ok, true);
  await assert.rejects(runProductionSmoke({ ...options, fetchImpl: artifactFetch(expected.routes.homeEn) }), /X-Robots-Tag denies indexing/);
});
