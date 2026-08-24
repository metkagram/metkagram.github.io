// Audit: the mobile apps are archived product history. The archive state is
// decided before rendering (src/render.mjs `appsPage` renders the archived,
// noindexed page directly; no store URLs are emitted). This script runs in the
// audit stage and only asserts that no generated HTML still promotes the
// closed apps or carries MobileApplication structured data. It never writes.
import fs from "node:fs";
import path from "node:path";
import { SITE_URL } from "../src/site.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

const STORE_URLS = [
  "https://play.google.com/store/apps/details?id=app.metkagram.android",
  "https://apps.apple.com/us/app/grammar-cards-ai-tutor/id6502211918",
];

function htmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".html")) output.push(full);
  }
  return output;
}

export function assertNoActiveStorePromotion(dist = DIST) {
  const files = htmlFiles(dist);
  if (!files.length) throw new Error("dist/ contains no HTML files. Run the render stage before the audit stage.");
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    for (const url of STORE_URLS) {
      if (html.includes(url)) throw new Error(`Closed mobile app is still promoted in ${file}`);
    }
    if (html.includes('"@type":["MobileApplication","SoftwareApplication"]')) {
      throw new Error(`Archived mobile application is still present in structured data: ${file}`);
    }
    if (html.includes(`${SITE_URL}/#mobile-application`)) {
      throw new Error(`Archived mobile application entity is still referenced in ${file}`);
    }
  }
  return files.length;
}

if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  const checked = assertNoActiveStorePromotion();
  console.log(`Mobile archive audit passed (${checked} HTML files, no store promotion, no mobile-app schema).`);
}
