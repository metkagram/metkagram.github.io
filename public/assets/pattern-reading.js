import {
  isPatternCompleted,
  patternProgressSummary,
  readPatternProgress,
  setPatternCompleted,
  writePatternProgress,
} from './pattern-progress-core.js';

(() => {
  const page = document.querySelector('.pattern-page[data-pattern-id]');
  if (!page || !document.body.classList.contains('pattern-reader-body')) return;

  const LANGUAGE_STORAGE_KEY = 'metkagram:pattern-language-mode:v1';
  const patternId = String(page.dataset.patternId || '').trim().toUpperCase();
  const locale = document.documentElement.lang === 'ru' ? 'ru' : 'en';
  const copy = locale === 'ru'
    ? {
        controls: 'Настройки паттерна',
        label: 'Языки примеров',
        en: 'Только английский',
        all: 'Английский + немецкий',
        progress: 'Прогресс',
        markComplete: 'Отметить пройденным',
        completed: 'Пройдено ✓',
      }
    : {
        controls: 'Pattern controls',
        label: 'Example languages',
        en: 'English only',
        all: 'English + German',
        progress: 'Progress',
        markComplete: 'Mark complete',
        completed: 'Completed ✓',
      };

  const readMode = () => {
    try {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'all';
    } catch {
      return 'all';
    }
  };

  const saveMode = (mode) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, mode);
    } catch {
      // The view still works when storage is unavailable.
    }
  };

  const header = page.querySelector('.pattern-page-head');
  const comparison = page.querySelector('.pattern-comparison');
  if (!header || !comparison || !patternId || page.querySelector('[data-pattern-language-controls]')) return;

  const controls = document.createElement('nav');
  controls.className = 'pattern-reader-controls';
  controls.dataset.patternLanguageControls = '';
  controls.setAttribute('aria-label', copy.controls);
  controls.innerHTML = `
    <div class="pattern-reader-control-group">
      <span>${copy.label}</span>
      <div role="group" aria-label="${copy.label}">
        <button type="button" data-pattern-language-mode="en">${copy.en}</button>
        <button type="button" data-pattern-language-mode="all">${copy.all}</button>
      </div>
    </div>
    <div class="pattern-reader-control-group pattern-reader-progress" data-pattern-progress-control>
      <span>${copy.progress}</span>
      <button type="button" data-pattern-progress-toggle aria-pressed="false"></button>
    </div>
  `;
  header.after(controls);

  const languageButtons = [...controls.querySelectorAll('[data-pattern-language-mode]')];
  const progressButton = controls.querySelector('[data-pattern-progress-toggle]');

  const applyMode = (mode, persist = true) => {
    const next = mode === 'en' ? 'en' : 'all';
    document.body.dataset.patternLanguageMode = next;
    languageButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.patternLanguageMode === next));
    });
    if (persist) saveMode(next);
  };

  const currentProgress = () => {
    const state = readPatternProgress();
    const item = state.items[patternId] || null;
    return {
      patternId,
      completed: isPatternCompleted(state, patternId),
      updatedAt: item?.updatedAt || null,
      storageScope: 'browser-local',
    };
  };

  const renderProgress = () => {
    const progress = currentProgress();
    progressButton.setAttribute('aria-pressed', String(progress.completed));
    progressButton.textContent = progress.completed ? copy.completed : copy.markComplete;
    return progress;
  };

  const updateProgress = (completed) => {
    const state = setPatternCompleted(readPatternProgress(), patternId, completed);
    const persisted = writePatternProgress(state);
    const progress = renderProgress();
    const detail = { ...progress, persisted };
    window.dispatchEvent(new CustomEvent('metkagram:pattern-progress-updated', { detail }));
    return detail;
  };

  const registerWebMcpTools = async () => {
    const modelContext = document.modelContext;
    if (!modelContext?.registerTool) return;

    const tools = [
      {
        name: 'metkagram_get_pattern_progress',
        title: 'Get Metkagram pattern progress',
        description: 'Read whether the Metkagram pattern currently open in this page is marked complete in this browser.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: {
          readOnlyHint: true,
          consequentialHint: false,
        },
        execute: async () => JSON.stringify(currentProgress()),
      },
      {
        name: 'metkagram_set_pattern_progress',
        title: 'Set Metkagram pattern progress',
        description: 'Mark the Metkagram pattern currently open in this page as complete or not complete. This changes browser-local progress only.',
        inputSchema: {
          type: 'object',
          properties: {
            completed: {
              type: 'boolean',
              description: 'True to mark the current pattern complete; false to remove the completion mark.',
            },
          },
          required: ['completed'],
          additionalProperties: false,
        },
        annotations: {
          readOnlyHint: false,
          consequentialHint: false,
        },
        execute: async ({ completed }) => {
          if (typeof completed !== 'boolean') throw new TypeError('completed must be a boolean');
          return JSON.stringify(updateProgress(completed));
        },
      },
      {
        name: 'metkagram_get_progress_summary',
        title: 'Get Metkagram progress summary',
        description: 'Read the number of Metkagram patterns marked complete in this browser and the most recently completed pattern IDs.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: {
          readOnlyHint: true,
          consequentialHint: false,
        },
        execute: async () => JSON.stringify({
          ...patternProgressSummary(readPatternProgress()),
          storageScope: 'browser-local',
        }),
      },
    ];

    await Promise.allSettled(tools.map((tool) => modelContext.registerTool(tool)));
  };

  languageButtons.forEach((button) => {
    button.addEventListener('click', () => applyMode(button.dataset.patternLanguageMode));
  });

  progressButton.addEventListener('click', () => {
    updateProgress(!currentProgress().completed);
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'metkagram:pattern-progress:v1') renderProgress();
  });

  applyMode(readMode(), false);
  renderProgress();
  void registerWebMcpTools();
})();
