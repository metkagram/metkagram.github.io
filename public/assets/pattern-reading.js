(() => {
  const page = document.querySelector('.pattern-page[data-pattern-id]');
  if (!page || !document.body.classList.contains('pattern-reader-body')) return;

  const STORAGE_KEY = 'metkagram:pattern-language-mode:v1';
  const locale = document.documentElement.lang === 'ru' ? 'ru' : 'en';
  const copy = locale === 'ru'
    ? {
        label: 'Языки примеров',
        en: 'Только английский',
        all: 'Английский + немецкий',
      }
    : {
        label: 'Example languages',
        en: 'English only',
        all: 'English + German',
      };

  const readMode = () => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'all';
    } catch {
      return 'all';
    }
  };

  const saveMode = (mode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // The view still works when storage is unavailable.
    }
  };

  const header = page.querySelector('.pattern-page-head');
  const comparison = page.querySelector('.pattern-comparison');
  if (!header || !comparison || page.querySelector('[data-pattern-language-controls]')) return;

  const controls = document.createElement('nav');
  controls.className = 'pattern-reader-controls';
  controls.dataset.patternLanguageControls = '';
  controls.setAttribute('aria-label', copy.label);
  controls.innerHTML = `
    <span>${copy.label}</span>
    <div role="group" aria-label="${copy.label}">
      <button type="button" data-pattern-language-mode="en">${copy.en}</button>
      <button type="button" data-pattern-language-mode="all">${copy.all}</button>
    </div>
  `;
  header.after(controls);

  const buttons = [...controls.querySelectorAll('[data-pattern-language-mode]')];
  const applyMode = (mode, persist = true) => {
    const next = mode === 'en' ? 'en' : 'all';
    document.body.dataset.patternLanguageMode = next;
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.patternLanguageMode === next));
    });
    if (persist) saveMode(next);
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => applyMode(button.dataset.patternLanguageMode));
  });

  applyMode(readMode(), false);
})();
