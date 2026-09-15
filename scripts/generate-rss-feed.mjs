import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { releaseState } from "../src/release.mjs";

const OUT = "dist";
const release = releaseState();
const siteUrl = release.canonicalUrl.replace(/\/$/, "");
const feedUrl = `${siteUrl}/feed.xml`;

const escapeXml = (value = "") => String(value).replace(/[<>&"']/g, (character) => ({
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&apos;"
})[character]);
const rfc822 = (date) => new Date(`${date}T00:00:00Z`).toUTCString();

const title = `Metkagram ${release.productVersion} public release`;
const description = `Metkagram public release ${release.productVersion}: ${release.datasetVersion} dataset, reviewed language-learning resources, research boundaries and integration surfaces.`;
const itemGuid = `urn:metkagram:release:${release.productVersion}`;
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Metkagram updates</title>
    <link>${siteUrl}/</link>
    <description>Reviewed public Metkagram releases and product updates.</description>
    <language>en</language>
    <lastBuildDate>${rfc822(release.releaseDate)}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <item>
      <title>${escapeXml(title)}</title>
      <link>${siteUrl}/</link>
      <guid isPermaLink="false">${escapeXml(itemGuid)}</guid>
      <pubDate>${rfc822(release.releaseDate)}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>
  </channel>
</rss>
`;

await writeFile(join(OUT, "feed.xml"), feed, "utf8");

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(fullPath);
  }
  return files;
}

const discoveryLink = `<link rel="alternate" type="application/rss+xml" title="Metkagram updates" href="${feedUrl}">`;
let injected = 0;
for (const file of await htmlFiles(OUT)) {
  let html = await readFile(file, "utf8");
  if (html.includes('type="application/rss+xml"')) continue;
  if (!html.includes("</head>")) continue;
  html = html.replace("</head>", `${discoveryLink}</head>`);
  await writeFile(file, html, "utf8");
  injected += 1;
}

const robotsPath = join(OUT, "robots.txt");
let robots = await readFile(robotsPath, "utf8");
const cleaned = robots
  .split(/\r?\n/)
  .filter((line) => !(/^Sitemap:/i.test(line.trim()) && /(?:feed|rss|atom)\.xml/i.test(line)))
  .join("\n")
  .replace(/\n{3,}/g, "\n\n")
  .trimEnd() + "\n";
if (cleaned !== robots) await writeFile(robotsPath, cleaned, "utf8");

console.log(`Generated ${feedUrl} from canonical release ${release.productVersion} (${release.releaseDate}); injected RSS autodiscovery into ${injected} HTML page(s).`);
