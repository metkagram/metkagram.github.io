import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const root = process.argv[2] || "dist";
const marker = '<script src="/assets/analytics-consent.js" defer></script>';
const skip = new Set([".git", "node_modules", ".tmp"]);
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && skip.has(entry.name)) continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (entry.name.endsWith(".html")) {
      let html = await readFile(target, "utf8");
      html = html
        .replace(/\s*<!-- Google Tag Manager -->.*?<!-- End Google Tag Manager -->/gs, "")
        .replace(/\s*<!-- Google Tag Manager \(noscript\) -->.*?<!-- End Google Tag Manager \(noscript\) -->/gs, "");
      if (!html.includes(marker)) html = html.replace("</head>", "  <!-- Consent-aware aggregate website analytics -->\n  " + marker + "\n</head>");
      await writeFile(target, html);
    }
  }
}
await walk(root);

