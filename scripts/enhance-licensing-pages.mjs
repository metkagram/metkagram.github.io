// Non-semantic presentation enhancement for the two hand-maintained licensing
// pages (public/{en,ru}/licensing/index.html): OG/Twitter meta, manifest link,
// WebPage JSON-LD and the share bar. Semantic rights state (the metkagram-rights
// meta, license link, rights copy) lives in the page sources and in
// src/release.mjs — this script must not rewrite licensing meaning.
import fs from "node:fs";
import path from "node:path";
import { SITE_RELEASE_DATE, SITE_URL } from "../src/site.mjs";

const DIST = path.resolve("dist");
const SOCIAL_PREVIEW = `${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png`;

function escapeAttribute(value = "") {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function ensureMeta(html, attribute, name, content) {
  if (html.includes(`<meta ${attribute}="${name}"`)) return html;
  return html.replace("</head>", `  <meta ${attribute}="${name}" content="${content}">\n</head>`);
}

const copy = {
  en: { copyLink: "Copy link", print: "Print", share: "Share", copied: "Link copied" },
  ru: { copyLink: "Копировать ссылку", print: "Печать", share: "Поделиться", copied: "Ссылка скопирована" },
};

for (const locale of ["en", "ru"]) {
  const file = path.join(DIST, locale, "licensing", "index.html");
  if (!fs.existsSync(file)) throw new Error(`Missing licensing page: ${file}`);
  let html = fs.readFileSync(file, "utf8");

  // The semantic rights markers must already be present in the hand-maintained
  // source; never inject them here.
  if (!html.includes('name="metkagram-rights"') || !html.includes('rel="license"')) {
    throw new Error(`Licensing page lost its semantic rights markers: ${file}`);
  }

  const c = copy[locale];
  const canonical = `${SITE_URL}/${locale}/licensing/`;
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || "Metkagram";
  const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1] || "Metkagram licensing and research use";
  const socialTitle = html.match(/<meta property="og:title" content="([^"]+)">/)?.[1] || title;

  html = ensureMeta(html, "property", "og:type", "website");
  html = ensureMeta(html, "property", "og:site_name", "Metkagram");
  html = ensureMeta(html, "property", "og:locale", locale === "ru" ? "ru_RU" : "en_US");
  html = ensureMeta(html, "property", "og:locale:alternate", locale === "ru" ? "en_US" : "ru_RU");
  html = ensureMeta(html, "property", "og:title", socialTitle);
  html = ensureMeta(html, "property", "og:description", description);
  html = ensureMeta(html, "property", "og:url", canonical);
  html = ensureMeta(html, "property", "og:image", SOCIAL_PREVIEW);
  html = ensureMeta(html, "property", "og:image:type", "image/png");
  html = ensureMeta(html, "property", "og:image:width", "1200");
  html = ensureMeta(html, "property", "og:image:height", "630");
  html = ensureMeta(html, "property", "og:image:alt", "Metkagram — annotated language patterns for English and German");
  html = ensureMeta(html, "name", "twitter:card", "summary_large_image");
  html = ensureMeta(html, "name", "twitter:title", socialTitle);
  html = ensureMeta(html, "name", "twitter:description", description);
  html = ensureMeta(html, "name", "twitter:image", SOCIAL_PREVIEW);
  html = ensureMeta(html, "name", "twitter:image:alt", "Metkagram — annotated language patterns for English and German");
  if (!html.includes('rel="manifest" href="/assets/web/site.webmanifest"')) {
    html = html.replace("</head>", '  <link rel="manifest" href="/assets/web/site.webmanifest">\n</head>');
  }
  if (!html.includes(`${canonical}#webpage`)) {
    const structured = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${canonical}#webpage`,
      url: canonical,
      name: title,
      description,
      dateModified: SITE_RELEASE_DATE,
      isPartOf: { "@id": `${SITE_URL}/#website` }
    });
    html = html.replace("</head>", `  <script type="application/ld+json">${structured}</script>\n</head>`);
  }
  if (!html.includes("data-share-bar")) {
    const shareBar = `<div class="share-bar section-pad" data-share-bar data-share-url="${canonical}" data-share-title="${escapeAttribute(title)}" data-share-copied="${c.copied}"><button type="button" data-copy-link>${c.copyLink}</button><button type="button" data-print-page>${c.print}</button><button type="button" data-native-share hidden>${c.share}</button><span data-share-feedback aria-live="polite"></span></div>`;
    html = html.replace("</main>", `${shareBar}\n  </main>`);
  }

  fs.writeFileSync(file, html);
}

console.log("Licensing pages enhanced with presentation metadata.");
