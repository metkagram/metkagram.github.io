import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  buildProductionContract,
  productionRouteList,
  validateProductionSnapshot,
} from "../src/production-contract.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

function distFileForRoute(route) {
  if (route === "/") return path.join(DIST, "index.html");
  const relative = route.replace(/^\//, "");
  return route.endsWith("/")
    ? path.join(DIST, relative, "index.html")
    : path.join(DIST, relative);
}

function localSnapshot(contract = buildProductionContract()) {
  const snapshot = {};
  for (const route of productionRouteList(contract)) {
    const file = distFileForRoute(route);
    const text = fs.readFileSync(file, "utf8");
    let json = null;
    if (route.endsWith(".json")) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
    snapshot[route] = { status: 200, finalUrl: `${contract.canonicalOrigin}${route}`, text, json };
  }
  return snapshot;
}

function cloneSnapshot(snapshot) {
  return structuredClone(snapshot);
}

test("generated artifact satisfies the same contract used by post-deploy smoke", () => {
  const contract = buildProductionContract();
  const failures = validateProductionSnapshot(localSnapshot(contract), contract);
  assert.deepEqual(failures, []);
});

test("production contract detects stale homepage product entry", () => {
  const contract = buildProductionContract();
  const snapshot = cloneSnapshot(localSnapshot(contract));
  snapshot[contract.routes.homeEn].text = snapshot[contract.routes.homeEn].text
    .replace('data-product-entry="lens" href="/en/lens/"', 'data-product-entry="legacy" href="/en/practice/"');
  const failures = validateProductionSnapshot(snapshot, contract);
  assert.ok(failures.some((failure) => failure.route === contract.routes.homeEn && failure.message.includes("Lens primary product entry")));
});

test("production contract detects stale API counts and release metadata", () => {
  const contract = buildProductionContract();
  const snapshot = cloneSnapshot(localSnapshot(contract));
  snapshot[contract.routes.apiIndex].json.counts.advancedPatterns -= 1;
  snapshot[contract.routes.apiIndex].json.release_date = "2026-07-01";
  const failures = validateProductionSnapshot(snapshot, contract);
  assert.ok(failures.some((failure) => failure.route === contract.routes.apiIndex && failure.message.includes("counts.advancedPatterns drift")));
  assert.ok(failures.some((failure) => failure.route === contract.routes.apiIndex && failure.message.includes("release_date drift")));
});

test("production contract rejects old rights while allowing historical license context", () => {
  const contract = buildProductionContract();
  const valid = localSnapshot(contract);
  assert.equal(validateProductionSnapshot(valid, contract).some((failure) => failure.route === contract.routes.licensingEn), false, "historical CC BY-NC note on licensing page must remain allowed");

  const stale = cloneSnapshot(valid);
  stale[contract.routes.rights].json.status = "open-data";
  stale[contract.routes.rights].json.defaultRights = "CC BY-NC 4.0";
  const failures = validateProductionSnapshot(stale, contract);
  assert.ok(failures.some((failure) => failure.route === contract.routes.rights && failure.message.includes("rights.status drift")));
  assert.ok(failures.some((failure) => failure.route === contract.routes.rights && failure.message.includes("defaultRights drift")));
});

test("production contract preserves the French Frame-only capability boundary", () => {
  const contract = buildProductionContract();
  const snapshot = cloneSnapshot(localSnapshot(contract));
  snapshot[contract.routes.languages].json.languages.fr.roles.annotation = true;
  const failures = validateProductionSnapshot(snapshot, contract);
  assert.ok(failures.some((failure) => failure.route === contract.routes.languages && failure.message.includes("Frame-only learning pilot")));
});

test("production contract names a missing live route instead of collapsing into a generic failure", () => {
  const contract = buildProductionContract();
  const snapshot = cloneSnapshot(localSnapshot(contract));
  snapshot[contract.routes.lensEn] = { status: 404, finalUrl: `${contract.canonicalOrigin}${contract.routes.lensEn}`, text: "Not found", json: null };
  const failures = validateProductionSnapshot(snapshot, contract);
  assert.ok(failures.some((failure) => failure.route === contract.routes.lensEn && failure.message.includes("HTTP 200")));
});
