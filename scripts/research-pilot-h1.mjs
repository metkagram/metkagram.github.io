import fs from 'node:fs';
import path from 'node:path';
import { SITE_RELEASE_DATE } from '../src/site.mjs';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const SITE_URL = 'https://metkagram.github.io';
const SOCIAL_IMAGE = `${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png`;
const source = path.join(ROOT, 'data', 'research', 'h1-cue-utility-v1.json');
const study = JSON.parse(fs.readFileSync(source, 'utf8'));

function writeFile(relative, content) {
  const target = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function metaFor(locale) {
  const ru = locale === 'ru';
  return {
    pathname: `/${locale}/research/pilot-h1/`,
    title: ru ? 'H1: пилот визуальной разметки | Metkagram' : 'H1 functional-tag cue utility pilot | Metkagram',
    description: ru
      ? 'Исследовательский пилот Metkagram: сравнение распознавания структуры в чистом предложении и предложении с функциональными метками.'
      : 'A Metkagram research pilot comparing structural-role identification in clean and functionally tagged sentences.'
  };
}

function page(locale) {
  const ru = locale === 'ru';
  const { pathname, title, description } = metaFor(locale);
  const canonical = `${SITE_URL}${pathname}`;
  const copy = ru ? {
    back: 'Исследования',
    eyebrow: `${study.study_id} · exploratory pilot`,
    headline: 'Помогает ли компактная разметка быстрее увидеть структуру?',
    intro: 'Этот короткий браузерный эксперимент сравнивает одинаковые английские предложения с функциональными метками и без них. Он измеряет распознавание ролей, скорость ответа и понимание смысла.',
    boundary: 'Это пилот полезности интерфейсного сигнала, а не доказательство того, что Metkagram улучшает владение английским или долгосрочное обучение.',
    protocol: 'Замороженный протокол',
    privacy: 'Данные остаются в браузере, пока участник сам не экспортирует файл. Имя, email и точная геолокация не запрашиваются.',
    notation: 'Перед стартом обе группы видят одну и ту же легенду обозначений. Разница только в том, появляются ли эти метки прямо в предложениях.',
    shareLabel: 'Поделиться или распечатать страницу',
    copyLink: 'Копировать ссылку',
    print: 'Печать',
    copied: 'Ссылка скопирована.'
  } : {
    back: 'Research',
    eyebrow: `${study.study_id} · exploratory pilot`,
    headline: 'Do compact functional tags make sentence structure easier to see?',
    intro: 'This short browser experiment compares the same English sentences with and without functional labels. It measures role identification, response time, and meaning comprehension.',
    boundary: 'This is a cue-utility pilot, not evidence that Metkagram improves English proficiency, long-term learning, retention, or transfer.',
    protocol: 'Frozen protocol',
    privacy: 'Data stays in the browser unless the participant explicitly exports a file. The pilot does not ask for a name, email address, or precise location.',
    notation: 'Before starting, both groups see the same notation legend. The only condition difference is whether those labels appear inline in the sentence.',
    shareLabel: 'Share or print this page',
    copyLink: 'Copy link',
    print: 'Print page',
    copied: 'Link copied.'
  };
  const alternate = locale === 'en' ? 'ru' : 'en';
  const pageStructured = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: title,
    description,
    inLanguage: locale,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    primaryImageOfPage: { '@type': 'ImageObject', url: SOCIAL_IMAGE, width: 1200, height: 630 },
    dateModified: SITE_RELEASE_DATE
  }).replaceAll('<', '\\u003c');
  const researchStructured = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ResearchProject',
    name: title,
    url: canonical,
    description,
    about: ['functional annotation', 'second-language learning', 'response time', 'sentence structure'],
    identifier: study.study_id
  }).replaceAll('<', '\\u003c');

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="${locale}" href="${canonical}">
  <link rel="alternate" hreflang="${alternate}" href="${SITE_URL}/${alternate}/research/pilot-h1/">
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/research/pilot-h1/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Metkagram">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SOCIAL_IMAGE}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Metkagram visual language research pilot">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${SOCIAL_IMAGE}">
  <link rel="icon" href="/assets/icons/favicon.ico" sizes="any">
  <link rel="manifest" href="/assets/web/site.webmanifest">
  <link rel="stylesheet" href="/assets/styles.css">
  <link rel="stylesheet" href="/assets/research-pilot-h1.css">
  <script type="application/ld+json">${pageStructured}</script>
  <script type="application/ld+json">${researchStructured}</script>
  <meta name="metkagram-rights" content="source-available-not-open-source">
  <link rel="license" href="/${locale}/licensing/">
</head>
<body class="research-pilot-body" data-locale="${locale}">
  <a class="skip-link" href="#content">${ru ? 'К содержанию' : 'Skip to content'}</a>
  <header class="site-header">
    <a class="wordmark" href="/${locale}/" aria-label="Metkagram"><span class="wordmark-name" aria-hidden="true">Metka</span><img src="/assets/logo/metkagram-logo-dark.svg" width="800" height="200" alt="Metkagram"></a>
    <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="site-nav">${ru ? 'Меню' : 'Menu'}</button>
    <nav id="site-nav" class="site-nav" aria-label="${ru ? 'Основная навигация' : 'Primary'}"><a href="/${locale}/explore/">${ru ? 'Разметка' : 'Annotations'}</a><a href="/${locale}/practice/">${ru ? 'Паттерны' : 'Patterns'}</a><a href="/${locale}/method/">${ru ? 'Метод' : 'Method'}</a><a href="/${locale}/ai/">${ru ? 'Для ИИ' : 'For AI'}</a></nav>
    <div class="header-preferences"><div class="locale-switch" aria-label="${ru ? 'Выберите язык интерфейса' : 'Choose the interface language'}"><a href="/en/research/pilot-h1/" lang="en"${locale === 'en' ? ' aria-current="page"' : ''}>EN</a><span aria-hidden="true">/</span><a href="/ru/research/pilot-h1/" lang="ru"${locale === 'ru' ? ' aria-current="page"' : ''}>RU</a></div></div>
  </header>
  <main id="content">
    <section class="page-head section-pad"><p class="eyebrow">${copy.eyebrow}</p><h1>${copy.headline}</h1><p class="lede">${copy.intro}</p><p>${copy.boundary}</p><p>${copy.notation}</p><div class="pilot-notation-guide" aria-label="Metkagram notation legend"><span><b>S</b> subject</span><span><b>V</b> main verb</span><span><b>M</b> modal / helper</span><span><b>v2</b> verb after modal</span></div><p><a href="https://github.com/metkagram/metkagram.github.io/blob/main/docs/RESEARCH_PILOT_H1.md">${copy.protocol} ↗</a></p><p><small>${copy.privacy}</small></p></section>
    <div data-h1-pilot></div>
  </main>
  <aside class="share-bar section-pad" data-share-bar data-share-url="${canonical}" data-share-title="${title}" data-share-copied="${copy.copied}" aria-label="${copy.shareLabel}"><span class="share-label">${copy.shareLabel}</span><div class="share-actions"><button type="button" class="share-button" data-copy-link>${copy.copyLink}</button><button type="button" class="share-button" data-print-page>${copy.print}</button></div><output class="share-feedback" data-share-feedback aria-live="polite"></output></aside>
  <footer class="site-footer site-footer--index"><div class="footer-brand"><a class="footer-mark" href="/${locale}/" aria-label="Metkagram"><img src="/assets/logo/metkagram-logo-dark.svg" width="800" height="200" alt="Metkagram"></a><p>${ru ? 'Фразы, паттерны, осознанная практика.' : 'Phrases, patterns, deliberate practice.'}</p></div><nav class="footer-links" aria-label="${ru ? 'Навигация в подвале' : 'Footer navigation'}"><a href="/${locale}/explore/">${ru ? 'Библиотека' : 'Library'}</a><a href="/${locale}/practice/">${ru ? 'Практика' : 'Practice'}</a><a href="/${locale}/research/">${copy.back}</a><a href="/${locale}/about/">${ru ? 'О проекте' : 'About'}</a><a href="/${locale}/ai/">${ru ? 'Для ИИ и разработчиков' : 'For AI & Developers'}</a><a href="/${locale}/contact/">${ru ? 'Контакты' : 'Contact'}</a></nav><p class="footer-languages"><strong>EN · DE</strong><span>${ru ? 'Паттерны B2–C1' : 'B2–C1 patterns'}</span></p><div class="footer-bottom"><p>${ru ? 'Проект Applied Systems Lab в MetalHatsCats.' : 'A project connected to Applied Systems Lab at MetalHatsCats.'}</p><nav aria-label="${ru ? 'Юридическая информация' : 'Legal information'}"><a href="/${locale}/legal/privacy/">${ru ? 'Приватность' : 'Privacy'}</a><a href="/${locale}/legal/terms/">${ru ? 'Условия' : 'Terms'}</a><a href="https://github.com/metkagram/metkagram.github.io">${ru ? 'Исходный код' : 'Source'}</a></nav></div></footer>
  <script type="module" src="/assets/app.js"></script>
  <script type="module" src="/assets/research-pilot-h1.js"></script>
</body>
</html>`;
}

function patchResearch(locale) {
  const target = path.join(DIST, locale, 'research', 'index.html');
  if (!fs.existsSync(target)) throw new Error(`Research page missing: ${target}`);
  let html = fs.readFileSync(target, 'utf8');
  if (html.includes('data-h1-pilot-link')) return;
  const ru = locale === 'ru';
  const block = `<section class="research-protocol section-pad ruled" data-h1-pilot-link><div><p class="eyebrow">Live pilot · ${study.study_id}</p><h2>${ru ? 'Первый пилот уже можно пройти' : 'The first pilot is ready to run'}</h2></div><div><p>${ru ? 'Сравниваем чистое предложение и компактную функциональную разметку. Сессия занимает несколько минут, случайно назначает одно условие и хранит результаты только локально.' : 'Compare a clean sentence with compact functional notation. The short session randomly assigns one condition and keeps results local unless the participant exports them.'}</p><a class="primary-link" href="/${locale}/research/pilot-h1/">${ru ? 'Открыть H1 пилот' : 'Run the H1 pilot'} <span aria-hidden="true">→</span></a></div></section>`;
  const marker = '<section class="research-questions';
  const index = html.indexOf(marker);
  if (index < 0) throw new Error(`Could not place H1 pilot link in ${target}`);
  html = `${html.slice(0, index)}${block}${html.slice(index)}`;
  fs.writeFileSync(target, html);
}

function patchDiscovery() {
  const sitemapFile = path.join(DIST, 'sitemap.xml');
  let sitemap = fs.readFileSync(sitemapFile, 'utf8');
  for (const locale of ['en', 'ru']) {
    const { pathname } = metaFor(locale);
    const canonical = `${SITE_URL}${pathname}`;
    if (!sitemap.includes(`<loc>${canonical}</loc>`)) {
      sitemap = sitemap.replace('</urlset>', `  <url><loc>${canonical}</loc><lastmod>${SITE_RELEASE_DATE}</lastmod></url>\n</urlset>`);
    }
  }
  fs.writeFileSync(sitemapFile, sitemap);

  const seoFile = path.join(DIST, 'seo', 'site-pages.json');
  const seo = JSON.parse(fs.readFileSync(seoFile, 'utf8'));
  seo.pages ||= [];
  for (const locale of ['en', 'ru']) {
    const { pathname, title, description } = metaFor(locale);
    if (!seo.pages.some((pageRecord) => pageRecord.route === pathname)) {
      seo.pages.push({ route: pathname, canonical: `${SITE_URL}${pathname}`, language: locale, title, description, lastModified: SITE_RELEASE_DATE });
    }
  }
  seo.pages.sort((a, b) => a.route.localeCompare(b.route));
  seo.pageCount = seo.pages.length;
  fs.writeFileSync(seoFile, `${JSON.stringify(seo, null, 2)}\n`);
}

writeFile('data/research/h1-cue-utility-v1.json', `${JSON.stringify(study, null, 2)}\n`);
for (const locale of ['en', 'ru']) {
  writeFile(`${locale}/research/pilot-h1/index.html`, page(locale));
  patchResearch(locale);
}
patchDiscovery();

console.log(`Generated ${study.study_id} pilot pages, frozen stimulus data and discovery records.`);
