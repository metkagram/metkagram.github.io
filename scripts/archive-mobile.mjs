import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

const STORE_URLS = [
  "https://play.google.com/store/apps/details?id=app.metkagram.android",
  "https://apps.apple.com/us/app/grammar-cards-ai-tutor/id6502211918",
];

function replaceAllKnown(html, replacements) {
  for (const [from, to] of replacements) html = html.replaceAll(from, to);
  return html;
}

function archiveAppsPage(locale) {
  const file = path.join(DIST, locale, "apps", "index.html");
  if (!fs.existsSync(file)) return;
  let html = fs.readFileSync(file, "utf8");
  const ru = locale === "ru";
  const title = ru ? "Архив мобильного Metkagram | Metkagram" : "Metkagram mobile archive | Metkagram";
  const description = ru
    ? "История мобильного этапа Metkagram. Активная разработка продолжается в веб-проекте вокруг языковых моделей, сравнений и практики."
    : "Product history of the Metkagram mobile stage. Active development continues on the web around reusable patterns, contrasts and practice.";
  const body = ru
    ? `<section class="app-hero section-pad"><p class="eyebrow">Metkagram · история продукта</p><h1>Мобильный этап завершён.</h1><p class="lede">Android и iOS приложения были важной частью эксперимента с карточками, разметкой и интервальным повторением. Активный продукт теперь развивается в вебе.</p></section><section class="app-details section-pad ruled"><div><p class="eyebrow">Что осталось</p><h2>Идея пережила приложение.</h2></div><div class="app-feature-list"><article><span>01</span><h3>Разметка</h3><p>Структура остаётся видимой внутри целой фразы.</p></article><article><span>02</span><h3>Речевые модели</h3><p>Полезные конструкции превращаются в стабильные объекты для повторного использования.</p></article><article><span>03</span><h3>Практика</h3><p>Модели возвращаются через активное извлечение вместо бесконечного перечитывания.</p></article></div></section><section class="app-trust section-pad ruled"><div><p class="eyebrow">Текущий Metkagram</p><h2>Продолжение находится в вебе.</h2></div><div><p class="lede">Начните с Pattern Lens, Pattern Atlas, сравнений или каталога практики. Эта страница сохраняется только как история продукта.</p><p class="legal-inline-links"><a href="/${locale}/practice/">Речевые модели</a><a href="/${locale}/contrasts/">Сравнения</a><a href="/${locale}/history/">История проекта</a></p></div></section>`
    : `<section class="app-hero section-pad"><p class="eyebrow">Metkagram · product history</p><h1>The mobile stage is complete.</h1><p class="lede">The Android and iOS apps were an important experiment with cards, annotation and spaced return. Active product development now happens on the web.</p></section><section class="app-details section-pad ruled"><div><p class="eyebrow">What survived</p><h2>The idea outlived the app.</h2></div><div class="app-feature-list"><article><span>01</span><h3>Visible structure</h3><p>Grammar and function stay attached to the complete sentence.</p></article><article><span>02</span><h3>Reusable patterns</h3><p>Useful structures become stable learning objects that can travel to new contexts.</p></article><article><span>03</span><h3>Active practice</h3><p>Patterns return through retrieval instead of endless rereading.</p></article></div></section><section class="app-trust section-pad ruled"><div><p class="eyebrow">Current Metkagram</p><h2>Continue on the web.</h2></div><div><p class="lede">Start with Pattern Lens, Pattern Atlas, pattern contrasts or the Practice catalogue. This page remains only as product history.</p><p class="legal-inline-links"><a href="/${locale}/practice/">Pattern Practice</a><a href="/${locale}/contrasts/">Pattern contrasts</a><a href="/${locale}/history/">Project history</a></p></div></section>`;

  html = html.replace(/<main id="content">[\s\S]*?<\/main>/, `<main id="content">${body}</main>`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex,follow">');
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${title}">`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${description}">`);
  fs.writeFileSync(file, html);
}

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

function removeArchivedMobileEntity(html) {
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (full, raw) => {
    let value;
    try {
      value = JSON.parse(raw);
    } catch {
      return full;
    }
    if (!Array.isArray(value?.["@graph"])) return full;
    value["@graph"] = value["@graph"].filter((node) => {
      const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]].filter(Boolean);
      return !types.includes("MobileApplication") && node?.["@id"] !== "https://metkagram.github.io/#mobile-application";
    });
    return `<script type="application/ld+json">${JSON.stringify(value).replaceAll("<", "\\u003c")}</script>`;
  });
}

function patchGlobalHistoryClaims() {
  const replacements = [
    ["The mobile apps remain listed in their stores. The current work focuses on a public, readable web collection of annotated sets and patterns.", "The mobile apps are archived as product history. Current work focuses on the web collection, reusable patterns, Pattern Lens and reviewed comparison layers."],
    ["Мобильные приложения остаются в магазинах приложений. Сейчас мы развиваем открытую веб-подборку фраз с разметкой и речевых моделей.", "Мобильные приложения сохранены как история продукта. Сейчас развивается веб-проект: разметка, речевые модели, Pattern Lens и проверяемые сравнения."],
  ];
  for (const file of htmlFiles(DIST)) {
    let html = fs.readFileSync(file, "utf8");
    html = replaceAllKnown(html, replacements);
    html = removeArchivedMobileEntity(html);
    const localeTarget = file.includes(`${path.sep}ru${path.sep}`) ? "/ru/apps/" : "/en/apps/";
    for (const url of STORE_URLS) html = html.replaceAll(url, localeTarget);
    fs.writeFileSync(file, html);
  }
}

function assertNoActiveStorePromotion() {
  for (const file of htmlFiles(DIST)) {
    const html = fs.readFileSync(file, "utf8");
    for (const url of STORE_URLS) {
      if (html.includes(url)) throw new Error(`Closed mobile app is still promoted in ${file}`);
    }
    if (html.includes('"@type":["MobileApplication","SoftwareApplication"]')) {
      throw new Error(`Archived mobile application is still present in structured data: ${file}`);
    }
  }
}

for (const locale of ["en", "ru"]) {
  archiveAppsPage(locale);
}
patchGlobalHistoryClaims();
assertNoActiveStorePromotion();
console.log("Aligned active product positioning and archived stale mobile-app promotion.");
