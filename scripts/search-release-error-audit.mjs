import { readFile } from "node:fs/promises";

const html = await readFile("dist/404.html", "utf8");
const sitemap = await readFile("dist/sitemap.xml", "utf8");
const failures = [];

if (!/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\bcontent=["'][^"']*noindex[^"']*["'][^>]*>/i.test(html)) {
  failures.push("dist/404.html must be noindex");
}
if (/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i.test(html)) {
  failures.push("dist/404.html must not advertise canonical content");
}
if (/<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>/i.test(html)) {
  failures.push("dist/404.html must not advertise og:url");
}
if (/type=["']application\/ld\+json["']/i.test(html)) {
  failures.push("dist/404.html must not expose structured page identity");
}
if (!html.includes('href="/"')) {
  failures.push("dist/404.html needs a recovery path to the homepage");
}
if (/\/404(?:\.html)?\/?<\/loc>/i.test(sitemap)) {
  failures.push("sitemap must not contain the 404 error route");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Metkagram error-surface audit passed: noindex, no canonical/og:url/JSON-LD identity, recovery path present, sitemap clean.");
