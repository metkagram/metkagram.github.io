import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const SITE_URL = "https://metkagram.github.io";
const RELEASE_DATE = "2026-08-17";
const SOCIAL_PREVIEW = `${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png`;

function htmlFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.isFile() && entry.name.endsWith(".html") ? [target] : [];
  });
}

function escapeAttribute(value = "") {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

const copy = {
  en: {
    label: "Licensing",
    copyLink: "Copy link",
    print: "Print",
    share: "Share",
    copied: "Link copied",
    aboutOld: "Project materials are free for personal, educational, and other non-commercial use with Metkagram attribution. Commercial use requires separate permission.",
    aboutNew: "Metkagram is publicly inspectable and the hosted learning site remains available to end users, but the source code, new corpus revisions, annotation scheme and research materials are not open source or open data by default. Substantial reuse, corpus-based research and commercial integration require separate permission.",
    termsOld: "The website materials are available for personal, educational and other non-commercial use with Metkagram attribution under the licence shown on the About page. Do not misuse the service, interfere with its availability, attempt unauthorised access, or redistribute material beyond the applicable licence.",
    termsNew: "The hosted Metkagram learning site is available for ordinary personal end-user use. Source code, new dataset revisions, annotation materials and substantial corpus content are published for transparency but are not openly licensed by default. Copying, redistribution, derived datasets, model training on substantial material and commercial integration require permission except where applicable law independently permits the use. See the Licensing & Rights page for the current terms.",
    replacements: [
      ["An open, machine-readable corpus with token-level functional annotation", "A publicly inspectable, machine-readable corpus with token-level functional annotation"],
      ["The result is an open structured corpus", "The result is a publicly inspectable structured corpus"],
      ["Turn an open language corpus into a testable learning system.", "Turn a research language corpus into a testable learning system."]
    ]
  },
  ru: {
    label: "Права",
    copyLink: "Копировать ссылку",
    print: "Печать",
    share: "Поделиться",
    copied: "Ссылка скопирована",
    aboutOld: "Материалы проекта доступны бесплатно для личного, учебного и другого некоммерческого использования с указанием Metkagram. Для коммерческого использования требуется отдельное разрешение.",
    aboutNew: "Metkagram открыт для просмотра и обычного учебного использования сайта, но код, новые версии корпуса, схема разметки и исследовательские материалы по умолчанию не являются open source или open data. Для существенного повторного использования, исследований с копией корпуса и коммерческой интеграции требуется отдельное разрешение.",
    termsOld: "Материалы сайта доступны для личного, учебного и другого некоммерческого использования с указанием Metkagram на условиях лицензии со страницы «О проекте». Нельзя злоупотреблять сервисом, мешать его работе, пытаться получить несанкционированный доступ или распространять материалы за пределами применимой лицензии.",
    termsNew: "Учебный сайт Metkagram доступен для обычного личного использования. Исходный код, новые версии датасетов, система разметки и существенные части корпуса опубликованы для прозрачности, но по умолчанию не имеют открытой лицензии. Копирование, распространение, производные датасеты, обучение моделей на существенном материале и коммерческая интеграция требуют разрешения, кроме случаев, прямо разрешённых законом. Актуальные условия приведены на странице «Права и лицензирование».",
    replacements: [
      ["Открытый корпус с функциональной разметкой на уровне слов", "Публично доступный для изучения корпус с функциональной разметкой на уровне слов"],
      ["Получается открытый корпус для учёбы и NLP-анализа", "Получается публично доступный для изучения корпус для учёбы и NLP-анализа"],
      ["Помогите превратить открытый языковой корпус в проверяемую учебную систему.", "Помогите превратить исследовательский языковой корпус в проверяемую учебную систему."]
    ]
  }
};

const files = htmlFiles(DIST);

for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  const relative = path.relative(DIST, file).replaceAll(path.sep, "/");
  const locale = relative.startsWith("ru/") ? "ru" : "en";
  const c = copy[locale];
  const licensingHref = `/${locale}/licensing/`;

  if (!html.includes('name="metkagram-rights"')) {
    html = html.replace(
      "</head>",
      `  <meta name="metkagram-rights" content="source-available-not-open-source">\n  <link rel="license" href="${licensingHref}">\n</head>`
    );
  }

  if (relative === `${locale}/licensing/index.html`) {
    const canonical = `${SITE_URL}/${locale}/licensing/`;
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] || "Metkagram";
    const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1] || "Metkagram licensing and research use";

    if (!html.includes("assets/social/metkagram-social-preview-1200x630.png")) {
      html = html.replace(
        "</head>",
        `  <meta property="og:image" content="${SOCIAL_PREVIEW}">\n  <meta property="og:image:type" content="image/png">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:image" content="${SOCIAL_PREVIEW}">\n</head>`
      );
    }
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
        dateModified: RELEASE_DATE,
        isPartOf: { "@id": `${SITE_URL}/#website` }
      });
      html = html.replace("</head>", `  <script type="application/ld+json">${structured}</script>\n</head>`);
    }
    if (!html.includes("data-share-bar")) {
      const shareBar = `<div class="share-bar section-pad" data-share-bar data-share-url="${canonical}" data-share-title="${escapeAttribute(title)}" data-share-copied="${c.copied}"><button type="button" data-copy-link>${c.copyLink}</button><button type="button" data-print-page>${c.print}</button><button type="button" data-native-share hidden>${c.share}</button><span data-share-feedback aria-live="polite"></span></div>`;
      html = html.replace("</main>", `${shareBar}\n  </main>`);
    }
  }

  if (html.includes('<div class="footer-legal">') && !html.includes(`<div class="footer-legal"><a href="${licensingHref}">`)) {
    html = html.replace(
      '<div class="footer-legal">',
      `<div class="footer-legal"><a href="${licensingHref}">${c.label}</a>`
    );
  }

  html = html.replaceAll(c.aboutOld, c.aboutNew);
  html = html.replaceAll(c.termsOld, c.termsNew);
  html = html.replaceAll('href="/LICENSE">CC BY-NC 4.0</a>', `href="${licensingHref}">${locale === "ru" ? "Текущие права" : "Current rights"}</a>`);

  for (const [before, after] of c.replacements) html = html.replaceAll(before, after);

  fs.writeFileSync(file, html);
}

console.log(`Licensing metadata patched across ${files.length} generated HTML files.`);
