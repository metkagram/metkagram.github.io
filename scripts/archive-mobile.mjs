import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

const STORE_URLS = [
  "https://play.google.com/store/apps/details?id=app.metkagram.android",
  "https://apps.apple.com/us/app/grammar-cards-ai-tutor/id6502211918",
];

function archiveCopy(locale) {
  return locale === "ru"
    ? {
        eyebrow: "04 · История продукта",
        title: "Мобильное приложение было этапом исследования",
        detail: "Карточки, разметка и повторение были проверены в мобильном продукте. Сейчас активный Metkagram развивается в вебе вокруг Pattern Library и Pattern Lens.",
        link: "История мобильного приложения",
      }
    : {
        eyebrow: "04 · Product history",
        title: "The mobile app became a research stage",
        detail: "Cards, annotation and repetition were tested in the mobile product. Active Metkagram now develops on the web around the Pattern Library and Pattern Lens.",
        link: "Mobile app history",
      };
}

function patchHome(locale) {
  const file = path.join(DIST, locale, "index.html");
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, "utf8");
  const copy = archiveCopy(locale);
  const replacement = `$1<article><p class="eyebrow">${copy.eyebrow}</p><h2>${copy.title}</h2><p>${copy.detail}</p><a class="text-link" href="/${locale}/apps/">${copy.link} <span aria-hidden="true">→</span></a></article></section>`;
  html = html.replace(/(<section class="home-connect[^>]*>[\s\S]*?<\/article>)<article>[\s\S]*?<nav class="home-store-links"[\s\S]*?<\/nav><\/article><\/section>/, replacement);
  for (const url of STORE_URLS) html = html.replaceAll(url, `/${locale}/apps/`);
  fs.writeFileSync(file, html);
}

function assertNoActiveStorePromotion() {
  for (const locale of ["en", "ru"]) {
    for (const relative of ["index.html", "apps/index.html"]) {
      const file = path.join(DIST, locale, relative);
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, "utf8");
      for (const url of STORE_URLS) {
        if (html.includes(url)) throw new Error(`Closed mobile app is still promoted in ${file}`);
      }
    }
  }
}

for (const locale of ["en", "ru"]) patchHome(locale);
assertNoActiveStorePromotion();
console.log("Archived stale mobile-app promotion in generated pages.");
