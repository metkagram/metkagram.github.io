import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SOURCE = path.join(ROOT, "ai", "site-profile.json");
const TARGET = path.join(DIST, "ai", "site-profile.json");
const DISCOVERY = '<link rel="describedby" type="application/json" href="/ai/site-profile.json" title="Agent-Ready Web Profile">';

function htmlFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...htmlFiles(file));
    else if (entry.isFile() && entry.name.endsWith(".html")) result.push(file);
  }
  return result;
}

fs.mkdirSync(path.dirname(TARGET), { recursive: true });
fs.copyFileSync(SOURCE, TARGET);

let changed = 0;
for (const file of htmlFiles(DIST)) {
  let html = fs.readFileSync(file, "utf8");
  if (html.includes("/ai/site-profile.json") || !html.includes("</head>")) continue;
  html = html.replace("</head>", `${DISCOVERY}</head>`);
  fs.writeFileSync(file, html);
  changed += 1;
}

console.log(`Published ARWP profile and advertised it from ${changed} HTML files.`);
