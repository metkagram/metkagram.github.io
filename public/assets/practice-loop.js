import { evaluatePracticeStructure, nextPracticeReview } from './practice-loop-core.js';

const STORAGE_KEY = 'metkagram:practice:v1';
const locale = document.documentElement.lang === 'ru' ? 'ru' : 'en';
const copy = locale === 'ru' ? {
  eyebrow: 'Активная практика',
  title: 'Примените каркас сами',
  intro: 'Напишите новую фразу с тем же логическим ходом. Проверка ищет только опубликованный структурный каркас и не оценивает всю грамматику.',
  target: 'Цель',
  formula: 'Формула',
  placeholder: 'Напишите свой новый пример…',
  check: 'Проверить структуру',
  empty: 'Сначала напишите собственный пример.',
  detected: 'Каркас обнаружен. Теперь сравните смысл и естественность с примерами ниже.',
  partial: 'Часть каркаса видна. Попробуйте сохранить больше стабильных частей формулы.',
  missing: 'Публичный каркас пока не обнаружен. Используйте стабильные части формулы как опору.',
  manual: 'Эту формулу нельзя надёжно проверить простым совпадением. Сравните свой пример с формулой и эталонными вариантами.',
  structuralOnly: 'Это структурный сигнал, а не полная проверка грамматики или смысла.',
  found: 'Найдено',
  keep: 'Попробуйте сохранить',
  selfRate: 'Как ощущается воспроизведение?',
  needsWork: 'Нужно повторить',
  gotIt: 'Получилось',
  savedTomorrow: 'Сохранено. Следующее повторение завтра.',
  savedDays: (days) => `Сохранено. Следующее повторение через ${days} дн.`,
  dueNow: 'Пора повторить сейчас.',
  dueOn: (date) => `Следующее повторение: ${date}.`,
  queueTitle: 'Локальная очередь повторений',
  due: 'к повторению',
  upcoming: 'запланировано',
  review: 'Повторить',
  localNote: 'Прогресс хранится только в этом браузере.'
} : {
  eyebrow: 'Active practice',
  title: 'Use the frame yourself',
  intro: 'Write a new sentence that performs the same reasoning move. The check only looks for the published structural frame; it does not grade your full grammar.',
  target: 'Goal',
  formula: 'Formula',
  placeholder: 'Write your own new example…',
  check: 'Check structure',
  empty: 'Write your own example first.',
  detected: 'The frame is visible. Now compare the meaning and naturalness with the reference examples below.',
  partial: 'Part of the frame is visible. Try to keep more of the stable formula.',
  missing: 'The public frame is not visible yet. Use the stable parts of the formula as anchors.',
  manual: 'This formula cannot be checked reliably with a simple structural match. Compare your attempt with the formula and reference variations.',
  structuralOnly: 'This is a structural signal, not a full grammar or meaning check.',
  found: 'Detected',
  keep: 'Try to keep',
  selfRate: 'How did retrieval feel?',
  needsWork: 'Needs work',
  gotIt: 'Got it',
  savedTomorrow: 'Saved. Review again tomorrow.',
  savedDays: (days) => `Saved. Review again in ${days} days.`,
  dueNow: 'This pattern is due for review now.',
  dueOn: (date) => `Next review: ${date}.`,
  queueTitle: 'Local review queue',
  due: 'due now',
  upcoming: 'scheduled',
  review: 'Review',
  localNote: 'Progress stays only in this browser.'
};

function injectStyles() {
  if (document.querySelector('#metkagram-practice-loop-styles')) return;
  const style = document.createElement('style');
  style.id = 'metkagram-practice-loop-styles';
  style.textContent = `
  .active-practice{margin:clamp(2rem,5vw,4rem) 0;padding:clamp(1.25rem,3vw,2rem);border:1px solid var(--line,#d8d8d2);border-radius:18px;background:color-mix(in srgb,var(--paper,#fff) 94%,#ffc400 6%)}
  .active-practice h2,.practice-review-queue h2{margin:.3rem 0 .65rem;font-size:clamp(1.55rem,3vw,2.35rem)}
  .active-practice .practice-intro-copy{max-width:72ch;margin:0 0 1.25rem;color:var(--muted,#5f5f58)}
  .practice-language-switch{display:flex;gap:.45rem;margin:1rem 0}.practice-language-switch button,.practice-actions button,.practice-rating button{font:inherit;border:1px solid var(--line,#cfcfc8);background:var(--paper,#fff);border-radius:999px;padding:.62rem .9rem;cursor:pointer}.practice-language-switch button[aria-pressed=true]{background:#111;color:#fff;border-color:#111}
  .practice-frame{display:grid;gap:.9rem;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin:1rem 0}.practice-frame>div{padding:1rem;border:1px solid var(--line,#d8d8d2);border-radius:12px;background:var(--paper,#fff)}.practice-frame small{display:block;margin-bottom:.35rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted,#666)}.practice-frame code{white-space:normal;font-size:1rem}
  .practice-answer{display:block;margin-top:1rem}.practice-answer span{display:block;font-weight:700;margin-bottom:.45rem}.practice-answer textarea{width:100%;min-height:7.5rem;resize:vertical;font:inherit;line-height:1.5;padding:.9rem;border:1px solid var(--line,#cfcfc8);border-radius:12px;background:var(--paper,#fff);color:inherit}
  .practice-actions,.practice-rating{display:flex;flex-wrap:wrap;gap:.55rem;align-items:center;margin-top:.8rem}.practice-actions button:first-child{background:#111;color:#fff;border-color:#111}.practice-rating button:last-child{background:#111;color:#fff;border-color:#111}
  .practice-feedback{margin-top:1rem;padding:1rem;border-left:4px solid #ffc400;background:var(--paper,#fff);border-radius:0 10px 10px 0}.practice-feedback p{margin:.25rem 0}.practice-feedback small{color:var(--muted,#666)}.practice-anchor-list{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.55rem}.practice-anchor-list code{padding:.25rem .4rem;border-radius:6px;background:rgba(0,0,0,.05)}
  .practice-schedule{margin-top:.8rem;font-size:.92rem;color:var(--muted,#666)}
  .practice-review-queue{margin-top:1rem}.practice-review-summary{display:flex;gap:1rem;flex-wrap:wrap;color:var(--muted,#666)}.practice-review-list{display:grid;gap:.5rem;margin-top:1rem}.practice-review-list a{display:flex;justify-content:space-between;gap:1rem;padding:.75rem .9rem;border:1px solid var(--line,#d8d8d2);border-radius:10px;text-decoration:none}.practice-review-list small{color:var(--muted,#666)}
  `;
  document.head.append(style);
}

function readState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? { version: 1, items: parsed.items || {} } : { version: 1, items: {} };
  } catch {
    return { version: 1, items: {} };
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: state.items || {} }));
}

function itemKey(patternId, language) {
  return `${String(patternId).toUpperCase()}:${language}`;
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

function patternIdFromPath() {
  const match = window.location.pathname.match(/\/practice\/([^/]+)\/?$/i);
  return match?.[1]?.toUpperCase() || null;
}

function goalFor(pattern) {
  const r = pattern.reasoning || {};
  return locale === 'ru' ? (r.what_it_does_ru || pattern.metaphor_ru || r.move) : (r.what_it_does_en || r.move || pattern.logic);
}

function feedbackMarkup(result) {
  const message = {
    empty: copy.empty,
    detected: copy.detected,
    partial: copy.partial,
    'not-detected': copy.missing,
    manual: copy.manual
  }[result.status] || copy.manual;
  const label = result.hits.length ? copy.found : copy.keep;
  const anchors = (result.hits.length ? result.hits : result.missing).slice(0, 4);
  return `<p><strong>${message}</strong></p><p><small>${copy.structuralOnly}</small></p>${anchors.length ? `<div class="practice-anchor-list" aria-label="${label}"><span>${label}:</span>${anchors.map((anchor) => `<code>${escapeHtml(anchor)}</code>`).join('')}</div>` : ''}`;
}

function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

async function setupPatternPractice() {
  const id = patternIdFromPath();
  const page = document.querySelector('.pattern-page');
  const comparison = page?.querySelector('.pattern-comparison');
  if (!id || !page || !comparison || document.querySelector('#active-practice')) return;

  let pattern;
  try {
    const response = await fetch(`/api/v1/patterns/${id.toLowerCase()}.json`);
    if (!response.ok) return;
    pattern = (await response.json()).data;
  } catch {
    return;
  }
  if (!pattern?.langs?.length) return;

  const available = pattern.langs.filter((item) => ['en', 'de'].includes(item.lang));
  let language = available.some((item) => item.lang === 'en') ? 'en' : available[0].lang;
  let lastResult = null;

  const section = document.createElement('section');
  section.id = 'active-practice';
  section.className = 'active-practice';
  section.dataset.patternPractice = id;
  section.innerHTML = `<p class="eyebrow">${copy.eyebrow} · ${escapeHtml(id)}</p><h2>${copy.title}</h2><p class="practice-intro-copy">${copy.intro}</p><div class="practice-language-switch" role="group" aria-label="Target language">${available.map((item) => `<button type="button" data-practice-language="${item.lang}" aria-pressed="${item.lang === language}">${item.lang.toUpperCase()}</button>`).join('')}</div><div class="practice-frame"><div><small>${copy.target}</small><p data-practice-goal></p></div><div><small>${copy.formula}</small><code data-practice-formula></code></div></div><label class="practice-answer"><span>${copy.title}</span><textarea data-practice-answer placeholder="${copy.placeholder}"></textarea></label><div class="practice-actions"><button type="button" data-practice-check>${copy.check}</button></div><div class="practice-feedback" data-practice-feedback hidden aria-live="polite"></div><div class="practice-rating" data-practice-rating hidden><span>${copy.selfRate}</span><button type="button" data-practice-rate="needs-work">${copy.needsWork}</button><button type="button" data-practice-rate="got-it">${copy.gotIt}</button></div><p class="practice-schedule" data-practice-schedule></p>`;

  const reasoning = page.querySelector('.reasoning-reference');
  if (reasoning) reasoning.after(section); else comparison.before(section);

  const answer = section.querySelector('[data-practice-answer]');
  const formula = section.querySelector('[data-practice-formula]');
  const goal = section.querySelector('[data-practice-goal]');
  const feedback = section.querySelector('[data-practice-feedback]');
  const rating = section.querySelector('[data-practice-rating]');
  const schedule = section.querySelector('[data-practice-schedule]');
  const languageButtons = [...section.querySelectorAll('[data-practice-language]')];

  const currentRecord = () => available.find((item) => item.lang === language) || available[0];
  const updateSchedule = () => {
    const saved = readState().items[itemKey(id, language)];
    if (!saved?.dueAt) {
      schedule.textContent = copy.localNote;
      return;
    }
    schedule.textContent = new Date(saved.dueAt).getTime() <= Date.now() ? `${copy.dueNow} ${copy.localNote}` : `${copy.dueOn(formatDate(saved.dueAt))} ${copy.localNote}`;
  };
  const renderLanguage = () => {
    const record = currentRecord();
    formula.textContent = record?.formula || '';
    goal.textContent = goalFor(pattern) || '';
    languageButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.practiceLanguage === language)));
    feedback.hidden = true;
    rating.hidden = true;
    lastResult = null;
    updateSchedule();
  };

  languageButtons.forEach((button) => button.addEventListener('click', () => {
    language = button.dataset.practiceLanguage;
    renderLanguage();
  }));

  section.querySelector('[data-practice-check]').addEventListener('click', () => {
    const record = currentRecord();
    lastResult = evaluatePracticeStructure(answer.value, record?.formula || '');
    feedback.innerHTML = feedbackMarkup(lastResult);
    feedback.hidden = false;
    rating.hidden = lastResult.status === 'empty';
  });

  section.querySelectorAll('[data-practice-rate]').forEach((button) => button.addEventListener('click', () => {
    if (!answer.value.trim() || !lastResult || lastResult.status === 'empty') return;
    const state = readState();
    const key = itemKey(id, language);
    const previous = state.items[key] || null;
    const next = nextPracticeReview(previous, button.dataset.practiceRate);
    const attempts = [...(previous?.attempts || []), {
      text: answer.value.trim(),
      createdAt: new Date().toISOString(),
      structuralStatus: lastResult.status,
      coverage: lastResult.coverage,
      rating: button.dataset.practiceRate
    }].slice(-10);
    state.items[key] = { patternId: id, language, ...next, attempts };
    writeState(state);
    schedule.textContent = `${next.intervalDays === 1 ? copy.savedTomorrow : copy.savedDays(next.intervalDays)} ${copy.localNote}`;
    window.dispatchEvent(new CustomEvent('metkagram:practice-updated'));
  }));

  renderLanguage();
  if (window.location.hash === '#active-practice') section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setupPracticeQueue() {
  const intro = document.querySelector('.practice-intro');
  const list = document.querySelector('[data-pattern-list]');
  if (!intro || !list || patternIdFromPath()) return;

  const render = () => {
    document.querySelector('[data-practice-review-queue]')?.remove();
    const state = readState();
    const entries = Object.values(state.items || {}).filter((item) => item?.patternId && item?.language && item?.dueAt);
    if (!entries.length) return;
    const now = Date.now();
    const due = entries.filter((item) => new Date(item.dueAt).getTime() <= now).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
    const upcoming = entries.filter((item) => new Date(item.dueAt).getTime() > now).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
    const queue = document.createElement('section');
    queue.className = 'practice-review-queue section-pad ruled';
    queue.dataset.practiceReviewQueue = '';
    const visible = (due.length ? due : upcoming).slice(0, 6);
    queue.innerHTML = `<div><p class="eyebrow">${copy.eyebrow}</p><h2>${copy.queueTitle}</h2><div class="practice-review-summary"><span><strong>${due.length}</strong> ${copy.due}</span><span><strong>${upcoming.length}</strong> ${copy.upcoming}</span><span>${copy.localNote}</span></div></div><div class="practice-review-list">${visible.map((item) => `<a href="/${locale}/practice/${item.patternId.toLowerCase()}/#active-practice"><span><strong>${escapeHtml(item.patternId)}</strong> · ${item.language.toUpperCase()}<br><small>${new Date(item.dueAt).getTime() <= now ? copy.dueNow : copy.dueOn(formatDate(item.dueAt))}</small></span><span>${copy.review} →</span></a>`).join('')}</div>`;
    intro.after(queue);
  };

  render();
  window.addEventListener('metkagram:practice-updated', render);
}

injectStyles();
setupPatternPractice();
setupPracticeQueue();
