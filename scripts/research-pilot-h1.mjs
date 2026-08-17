import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const SITE_URL = 'https://metkagram.github.io';
const source = path.join(ROOT, 'data', 'research', 'h1-cue-utility-v1.json');
const study = JSON.parse(fs.readFileSync(source, 'utf8'));

function writeFile(relative, content) {
  const target = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function page(locale) {
  const ru = locale === 'ru';
  const pathname = `/${locale}/research/pilot-h1/`;
  const title = ru ? 'H1: пилот визуальной разметки | Metkagram' : 'H1 functional-tag cue utility pilot | Metkagram';
  const description = ru
    ? 'Исследовательский пилот Metkagram: сравнение распознавания структуры в чистом предложении и предложении с функциональными метками.'
    : 'A Metkagram research pilot comparing structural-role identification in clean and functionally tagged sentences.';
  const copy = ru ? {
    back: 'Исследования',
    eyebrow: `${study.study_id} · exploratory pilot`,
    headline: 'Помогает ли компактная разметка быстрее увидеть структуру?',
    intro: 'Этот короткий браузерный эксперимент сравнивает одинаковые английские предложения с функциональными метками и без них. Он измеряет распознавание ролей, скорость ответа и понимание смысла.',
    boundary: 'Это пилот полезности интерфейсного сигнала, а не доказательство того, что Metkagram улучшает владение английским или долгосрочное обучение.',
    protocol: 'Замороженный протокол',
    privacy: 'Данные остаются в браузере, пока участник сам не экспортирует файл. Имя, email и точная геолокация не запрашиваются.'
  } : {
    back: 'Research',
    eyebrow: `${study.study_id} · exploratory pilot`,
    headline: 'Do compact functional tags make sentence structure easier to see?',
    intro: 'This short browser experiment compares the same English sentences with and without functional labels. It measures role identification, response time, and meaning comprehension.',
    boundary: 'This is a cue-utility pilot, not evidence that Metkagram improves English proficiency, long-term learning, retention, or transfer.',
    protocol: 'Frozen protocol',
    privacy: 'Data stays in the browser unless the participant explicitly exports a file. The pilot does not ask for a name, email address, or precise location.'
  };
  const alternate = locale === 'en' ? 'ru' : 'en';
  const structured = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ResearchProject',
    name: title,
    url: `${SITE_URL}${pathname}`,
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
  <link rel="canonical" href="${SITE_URL}${pathname}">
  <link rel="alternate" hreflang="${locale}" href="${SITE_URL}${pathname}">
  <link rel="alternate" hreflang="${alternate}" href="${SITE_URL}/${alternate}/research/pilot-h1/">
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}/en/research/pilot-h1/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Metkagram">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${SITE_URL}${pathname}">
  <meta property="og:image" content="${SITE_URL}/assets/social/metkagram-social-preview-1200x630.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/icons/favicon.ico" sizes="any">
  <link rel="stylesheet" href="/assets/styles.css">
  <link rel="stylesheet" href="/assets/research-pilot-h1.css">
  <script type="application/ld+json">${structured}</script>
</head>
<body>
  <header class="site-header">
    <a class="wordmark" href="/${locale}/" aria-label="Metkagram"><img src="/assets/logo/metkagram-logo-light.svg" width="800" height="200" alt="Metkagram"></a>
    <nav class="site-nav" aria-label="Research navigation"><a href="/${locale}/research/">← ${copy.back}</a><a href="/${alternate}/research/pilot-h1/">${alternate.toUpperCase()}</a></nav>
  </header>
  <main id="content">
    <section class="page-head section-pad"><p class="eyebrow">${copy.eyebrow}</p><h1>${copy.headline}</h1><p class="lede">${copy.intro}</p><p>${copy.boundary}</p><p><a href="https://github.com/metkagram/metkagram.github.io/blob/main/docs/RESEARCH_PILOT_H1.md">${copy.protocol} ↗</a></p><p><small>${copy.privacy}</small></p></section>
    <div data-h1-pilot></div>
  </main>
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

writeFile('data/research/h1-cue-utility-v1.json', `${JSON.stringify(study, null, 2)}\n`);
for (const locale of ['en', 'ru']) {
  writeFile(`${locale}/research/pilot-h1/index.html`, page(locale));
  patchResearch(locale);
}

console.log(`Generated ${study.study_id} pilot pages and frozen stimulus data.`);
