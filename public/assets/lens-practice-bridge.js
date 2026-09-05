import { evaluatePracticeStructure } from './practice-loop-core.js';

const root = document.querySelector('[data-pattern-lens]');
const results = root?.querySelector('[data-lens-results]');
const emptyState = root?.querySelector('[data-lens-empty]');
const locale = document.documentElement.lang === 'ru' ? 'ru' : 'en';

const copy = locale === 'ru' ? {
  best: 'Лучший найденный каркас',
  alternatives: 'Другие возможные совпадения',
  move: 'Ход мысли',
  frame: 'Каркас',
  yourTurn: 'Теперь ваш пример',
  prompt: 'Сохраните тот же каркас, но скажите что-то своё.',
  placeholder: 'Напишите новую фразу с этим каркасом…',
  check: 'Проверить каркас',
  empty: 'Сначала напишите собственный пример.',
  detected: 'Каркас виден в вашей фразе.',
  partial: 'Часть каркаса видна. Попробуйте сохранить больше устойчивых частей.',
  missing: 'Каркас пока не обнаружен. Используйте устойчивые части формулы как опору.',
  manual: 'Этот каркас нельзя надёжно проверить простым структурным совпадением.',
  boundary: 'Это только проверка структуры, а не оценка всей грамматики, смысла или естественности.',
  keep: 'Опорные части',
  deeper: 'Примеры, контрасты и повторение',
  practise: 'Практиковать паттерн →',
  noMatchTitle: 'Надёжного совпадения не найдено.',
  noMatchBody: 'Лучше честно остановиться, чем показать слабый паттерн. Попробуйте начать с того, что вы хотите выразить.',
  chooseIntent: 'Что вы хотите сказать?',
  browseLibrary: 'Открыть библиотеку паттернов',
} : {
  best: 'Best reusable frame',
  alternatives: 'Other possible matches',
  move: 'Move',
  frame: 'Frame',
  yourTurn: 'Now make it yours',
  prompt: 'Keep the same frame, but say something new.',
  placeholder: 'Write a new sentence with this frame…',
  check: 'Check the frame',
  empty: 'Write your own example first.',
  detected: 'The frame is visible in your sentence.',
  partial: 'Part of the frame is visible. Try to keep more of its stable parts.',
  missing: 'The frame is not visible yet. Use the stable formula parts as anchors.',
  manual: 'This frame cannot be checked reliably with simple structural matching.',
  boundary: 'This checks structure only, not full grammar, meaning, or naturalness.',
  keep: 'Useful anchors',
  deeper: 'Examples, contrasts, and review',
  practise: 'Practise this pattern →',
  noMatchTitle: 'No confident reviewed match.',
  noMatchBody: 'It is better to stop than show a weak pattern. Try starting from what you want to express instead.',
  chooseIntent: 'What do you want to say?',
  browseLibrary: 'Browse the pattern library',
};

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const record = (name, patternId) => {
  window.MetkagramLearningEvents?.record?.(name, {
    object_type: 'pattern',
    object_id: patternId,
  });
};

const moveFor = (card) => {
  const spans = [...card.querySelectorAll('.lens-card-meta span')];
  if (spans.length > 1) return spans[0]?.textContent?.trim() || '';
  if (card.hasAttribute('data-reasoning-strength')) return spans[0]?.textContent?.trim() || '';
  return '';
};

const feedbackMarkup = (result) => {
  const message = {
    empty: copy.empty,
    detected: copy.detected,
    partial: copy.partial,
    'not-detected': copy.missing,
    manual: copy.manual,
  }[result.status] || copy.manual;
  const anchors = (result.hits.length ? result.hits : result.missing).slice(0, 4);
  const coverage = typeof result.coverage === 'number'
    ? `<span class="lens-session-coverage">${Math.round(result.coverage * 100)}%</span>`
    : '';
  return `<div class="lens-session-feedback-head"><strong>${escapeHtml(message)}</strong>${coverage}</div>
    <p>${escapeHtml(copy.boundary)}</p>
    ${anchors.length ? `<div class="lens-session-anchors"><span>${escapeHtml(copy.keep)}</span>${anchors.map((anchor) => `<code>${escapeHtml(anchor)}</code>`).join('')}</div>` : ''}`;
};

const attachSession = (card) => {
  const patternId = card.querySelector('.lens-card-meta code')?.textContent?.trim();
  const formula = card.querySelector('h3')?.textContent?.trim();
  const canonical = card.querySelector('.lens-card-foot a');
  if (!patternId || !formula || !canonical || card.querySelector('[data-lens-session]')) return;

  const move = moveFor(card);
  const section = document.createElement('section');
  section.className = 'lens-session';
  section.dataset.lensSession = patternId;
  section.innerHTML = `<div class="lens-session-summary">
      ${move ? `<div><small>${escapeHtml(copy.move)}</small><strong>${escapeHtml(move)}</strong></div>` : ''}
      <div><small>${escapeHtml(copy.frame)}</small><code>${escapeHtml(formula)}</code></div>
    </div>
    <div class="lens-session-turn">
      <p class="eyebrow">${escapeHtml(copy.yourTurn)}</p>
      <p>${escapeHtml(copy.prompt)}</p>
      <label><span class="sr-only">${escapeHtml(copy.yourTurn)}</span><textarea rows="3" data-lens-practice-answer placeholder="${escapeHtml(copy.placeholder)}"></textarea></label>
      <div class="lens-session-actions"><button type="button" data-lens-practice-check>${escapeHtml(copy.check)}</button><a href="${escapeHtml(canonical.getAttribute('href') || '')}">${escapeHtml(copy.deeper)} →</a></div>
      <div class="lens-session-feedback" data-lens-practice-feedback hidden aria-live="polite"></div>
    </div>`;
  card.append(section);

  const answer = section.querySelector('[data-lens-practice-answer]');
  const check = section.querySelector('[data-lens-practice-check]');
  const feedback = section.querySelector('[data-lens-practice-feedback]');
  let attemptRecorded = false;
  let completionRecorded = false;

  answer.addEventListener('input', () => {
    if (attemptRecorded) return;
    attemptRecorded = true;
    record('lens_practice_attempt', patternId);
  });

  check.addEventListener('click', () => {
    const result = evaluatePracticeStructure(answer.value, formula);
    feedback.innerHTML = feedbackMarkup(result);
    feedback.hidden = false;
    if (result.status !== 'empty' && !completionRecorded) {
      completionRecorded = true;
      card.dataset.lensPracticeComplete = 'true';
      record('lens_practice_complete', patternId);
      card.dispatchEvent(new CustomEvent('metkagram:lens-practice-complete', {
        detail: { patternId },
      }));
    }
  });
};

if (emptyState) {
  emptyState.dataset.lensAbstentionPath = 'true';
  emptyState.innerHTML = `<strong>${escapeHtml(copy.noMatchTitle)}</strong><br>
    <span>${escapeHtml(copy.noMatchBody)}</span>
    <span class="lens-actions">
      <a class="lens-primary" href="/${locale}/practice/intents/">${escapeHtml(copy.chooseIntent)} →</a>
      <a class="lens-secondary" href="/${locale}/practice/">${escapeHtml(copy.browseLibrary)}</a>
    </span>`;
}

if (results) {
  const enhance = () => {
    const cards = [...results.querySelectorAll('.lens-card')];
    cards.forEach((card, index) => {
      card.classList.toggle('lens-card--primary', index === 0);
      card.classList.toggle('lens-card--alternative', index > 0);
    });

    const first = cards[0];
    if (first) {
      if (!first.querySelector('[data-lens-best-label]')) {
        const label = document.createElement('p');
        label.className = 'lens-best-label';
        label.dataset.lensBestLabel = '';
        label.textContent = copy.best;
        first.prepend(label);
      }
      attachSession(first);
    }

    cards.slice(1).forEach((card, index) => {
      if (index === 0 && !card.querySelector('[data-lens-alternatives-label]')) {
        const label = document.createElement('p');
        label.className = 'lens-alternatives-label';
        label.dataset.lensAlternativesLabel = '';
        label.textContent = copy.alternatives;
        card.prepend(label);
      }
    });

    results.querySelectorAll('.lens-card-foot a').forEach((link) => {
      if (!link.getAttribute('href')?.includes('/practice/')) return;
      const url = new URL(link.getAttribute('href'), window.location.origin);
      url.hash = 'active-practice';
      const href = `${url.pathname}${url.hash}`;
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
      if (link.textContent !== copy.practise) link.textContent = copy.practise;
    });

    results.querySelectorAll('[data-lens-session] a').forEach((link) => {
      if (!link.getAttribute('href')?.includes('/practice/')) return;
      const url = new URL(link.getAttribute('href'), window.location.origin);
      url.hash = 'active-practice';
      const href = `${url.pathname}${url.hash}`;
      if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    });
  };

  const observer = new MutationObserver(enhance);
  observer.observe(results, { childList: true, subtree: true });
  enhance();
}
