import fs from "node:fs";
import path from "node:path";
import { ATTRIBUTION } from "../src/provenance.mjs";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";

const root = path.resolve("dist");
const indexFile = path.join(root, "index.html");
const sitemapFile = path.join(root, "sitemap.xml");
const seoInventoryFile = path.join(root, "seo", "site-pages.json");

if (!fs.existsSync(indexFile)) throw new Error("dist/index.html is missing; run the base render first");
if (!fs.existsSync(sitemapFile)) throw new Error("dist/sitemap.xml is missing; run the base render first");
if (!fs.existsSync(seoInventoryFile)) throw new Error("dist/seo/site-pages.json is missing; run the base render first");

const title = "Metkagram: Language Patterns and Annotated Examples";
const description = "Explore annotated English and German phrases, reusable B2–C1 language patterns, contrasts and practice resources from Metkagram.";
const socialImage = `${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png`;
const logo = `${SITE_URL}/assets/icons/metkagram-icon-512x512.png`;

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Metkagram",
  alternateName: ["Metkagram Language Pattern Library", "metkagram.github.io"],
  url: `${SITE_URL}/`,
  description,
  inLanguage: ["en", "ru"],
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Metkagram",
  url: `${SITE_URL}/`,
  logo: {
    "@type": "ImageObject",
    url: logo,
    width: 512,
    height: 512,
  },
};

const webpage = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}/#webpage`,
  name: title,
  description,
  url: `${SITE_URL}/`,
  inLanguage: "en",
  isPartOf: { "@id": `${SITE_URL}/#website` },
  publisher: { "@id": `${SITE_URL}/#organization` },
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: socialImage,
    width: 1200,
    height: 630,
  },
  dateModified: SITE_RELEASE_DATE,
};

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <meta name="application-name" content="Metkagram">
  <meta name="metkagram-rights" content="${ATTRIBUTION.rights_status}">
  <link rel="canonical" href="${SITE_URL}/">
  <link rel="alternate" hreflang="en" href="${SITE_URL}/en/">
  <link rel="alternate" hreflang="ru" href="${SITE_URL}/ru/">
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/">
  <link rel="manifest" href="/assets/web/site.webmanifest">
  <link rel="icon" href="/assets/icons/metkagram-icon-512x512.png" type="image/png" sizes="512x512">
  <link rel="apple-touch-icon" href="/assets/icons/metkagram-icon-512x512.png">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_US">
  <meta property="og:site_name" content="Metkagram">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${SITE_URL}/">
  <meta property="og:image" content="${socialImage}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Metkagram — annotated language patterns for English and German">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${socialImage}">
  <meta name="twitter:image:alt" content="Metkagram — annotated language patterns for English and German">
  <script type="application/ld+json">${JSON.stringify(website).replaceAll("<", "\\u003c")}</script>
  <script type="application/ld+json">${JSON.stringify(organization).replaceAll("<", "\\u003c")}</script>
  <script type="application/ld+json">${JSON.stringify(webpage).replaceAll("<", "\\u003c")}</script>
  <style>
    :root{color-scheme:light;--ink:#171717;--paper:#f6f0e5;--accent:#ff4f00;--line:#171717}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{min-height:100vh;display:grid;place-items:center;padding:clamp(24px,6vw,80px)}
    .gateway{width:min(980px,100%);border-top:3px solid var(--line);border-bottom:3px solid var(--line);padding:clamp(28px,5vw,64px) 0}
    .mark{width:72px;height:72px;object-fit:contain;margin-bottom:28px}p.kicker{font-size:.78rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin:0 0 16px}
    h1{font-size:clamp(3rem,9vw,7.5rem);line-height:.88;letter-spacing:-.065em;margin:0;max-width:8ch}p.lede{font-size:clamp(1.15rem,2.3vw,1.65rem);max-width:720px;margin:32px 0}
    nav{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}a{color:inherit;text-decoration:none;border:2px solid var(--line);padding:11px 16px;font-weight:800}a.primary{background:var(--ink);color:var(--paper)}a:hover{transform:translateY(-1px)}
    .note{margin-top:28px;font-size:.92rem;max-width:700px}.accent{color:var(--accent)}
  </style>
</head>
<body>
<main>
  <section class="gateway" aria-labelledby="title">
    <img class="mark" src="/assets/icons/metkagram-icon-512x512.png" width="72" height="72" alt="">
    <p class="kicker">Language patterns · annotated examples · deliberate practice</p>
    <h1 id="title">Metka<span class="accent">gram</span>.</h1>
    <p class="lede">Annotated English and German phrases, reusable B2–C1 patterns, contrasts and practice resources. Start with the interface you want; the underlying language library stays the same.</p>
    <nav aria-label="Choose Metkagram interface">
      <a class="primary" href="/en/" hreflang="en">Open in English</a>
      <a href="/ru/" hreflang="ru" lang="ru">Открыть на русском</a>
    </nav>
    <p class="note">For learners, teachers and language tools. Browse annotations, compare patterns, inspect the method, or use the machine-readable data without an account.</p>
  </section>
</main>
</body>
</html>`;

fs.writeFileSync(indexFile, html);

let sitemap = fs.readFileSync(sitemapFile, "utf8");
if (!sitemap.includes(`<loc>${SITE_URL}/</loc>`)) {
  sitemap = sitemap.replace("</urlset>", `  <url><loc>${SITE_URL}/</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`);
  fs.writeFileSync(sitemapFile, sitemap);
}

const inventory = JSON.parse(fs.readFileSync(seoInventoryFile, "utf8"));
const rootRecord = {
  route: "/",
  canonical: `${SITE_URL}/`,
  language: "en",
  title,
  description,
  lastModified: SITE_RELEASE_DATE,
};
const pages = (inventory.pages || []).filter((page) => page.route !== "/");
pages.push(rootRecord);
pages.sort((a, b) => a.route.localeCompare(b.route));
inventory.pages = pages;
inventory.pageCount = pages.length;
fs.writeFileSync(seoInventoryFile, `${JSON.stringify(inventory, null, 2)}\n`);

const output = fs.readFileSync(indexFile, "utf8");
for (const required of [
  `<link rel="canonical" href="${SITE_URL}/">`,
  `<meta property="og:site_name" content="Metkagram">`,
  `<meta property="og:locale" content="en_US">`,
  `<meta property="og:image:type" content="image/png">`,
  `<meta name="twitter:image:alt"`,
  `<meta name="metkagram-rights" content="${ATTRIBUTION.rights_status}">`,
  `<link rel="manifest" href="/assets/web/site.webmanifest">`,
  `"@type":"WebSite"`,
  `"@id":"${SITE_URL}/#webpage"`,
  `"dateModified":"${SITE_RELEASE_DATE}"`,
  `"name":"Metkagram"`,
  `href="/en/"`,
  `href="/ru/"`,
]) {
  if (!output.includes(required)) throw new Error(`Metkagram root search-release invariant missing: ${required}`);
}
if (/http-equiv="refresh"|location\.replace\s*\(/i.test(output)) {
  throw new Error("Metkagram root must remain a crawlable language gateway, not a client-side redirect");
}
if (!sitemap.includes(`<loc>${SITE_URL}/</loc>`)) throw new Error("Canonical hostname root is missing from sitemap.xml");
const checkedInventory = JSON.parse(fs.readFileSync(seoInventoryFile, "utf8"));
if (!checkedInventory.pages.some((page) => page.route === "/" && page.canonical === `${SITE_URL}/`)) {
  throw new Error("Canonical hostname root is missing from seo/site-pages.json");
}

console.log("Metkagram search-release root: canonical hostname identity published; sitemap and SEO inventory aligned.");
