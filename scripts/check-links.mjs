import fs from "node:fs";
import path from "node:path";

const DIST = path.join(process.cwd(), "dist");
const htmlFiles = [];
const stack = [DIST];
while (stack.length) {
  const directory = stack.pop();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) stack.push(absolute);
    else if (entry.name.endsWith(".html")) htmlFiles.push(absolute);
  }
}

const failures = [];
const oldRoutePattern = /https:\/\/metalhatscats\.com\/(?:metkagram|ru\/metkax)(?:\/|["'])/i;
for (const file of htmlFiles.sort()) {
  const html = fs.readFileSync(file, "utf8");
  if (oldRoutePattern.test(html)) {
    failures.push(`${path.relative(DIST, file)}: points to an obsolete MetalHatsCats product route`);
  }
  const links = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const raw of links) {
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("data:") || raw.startsWith("javascript:")) continue;
    let pathname;
    try {
      const url = new URL(raw, "https://metkagram.github.io");
      if (url.origin !== "https://metkagram.github.io") continue;
      pathname = decodeURIComponent(url.pathname);
    } catch {
      failures.push(`${path.relative(DIST, file)}: malformed URL ${raw}`);
      continue;
    }
    const relative = pathname.replace(/^\/+/, "");
    const candidates = pathname.endsWith("/")
      ? [path.join(DIST, relative, "index.html")]
      : [path.join(DIST, relative), path.join(DIST, relative, "index.html")];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) failures.push(`${path.relative(DIST, file)}: missing target ${pathname}`);
  }
}

if (failures.length) {
  console.error(`Link check failed with ${failures.length} error(s):`);
  console.error(failures.slice(0, 100).join("\n"));
  process.exit(1);
}
console.log(`Checked ${htmlFiles.length} HTML files; all internal links resolve.`);
