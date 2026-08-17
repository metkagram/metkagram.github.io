const root = document.querySelector('[data-h1-pilot]');

if (root) {
  const locale = document.documentElement.lang === 'ru' ? 'ru' : 'en';
  const copy = locale === 'ru' ? {
    start: 'Начать пилот',
    resume: 'Продолжить сохранённую сессию',
    subject: 'подлежащее',
    main_verb: 'главный глагол',
    helper: 'служебный глагол',
    select: 'Выберите фрагмент, который выполняет роль:',
    confidence: 'Насколько вы уверены в ответе?',
    low: 'совсем не уверен',
    high: 'полностью уверен',
    comprehension: 'Проверка смысла',
    true: 'Верно',
    false: 'Неверно',
    visualLoad: 'Насколько визуально нагруженным был интерфейс?',
    easy: 'очень лёгкий',
    heavy: 'очень нагруженный',
    finish: 'Завершить',
    complete: 'Сессия завершена',
    accuracy: 'Точность распознавания ролей',
    rt: 'Медианное время правильного ответа',
    comprehensionAccuracy: 'Понимание смысла',
    condition: 'Условие',
    clean: 'без разметки',
    tagged: 'с разметкой',
    exportJson: 'Экспорт JSON',
    exportCsv: 'Экспорт CSV',
    copySummary: 'Копировать сводку',
    copied: 'Сводка скопирована',
    privacy: 'Ответы сохранены только в этом браузере. Они никуда не отправляются автоматически.',
    progress: 'Задание',
    of: 'из',
    recorded: 'Ответ записан. Теперь оцените уверенность.',
    nextMeaning: 'Теперь ответьте на вопрос о смысле предложения.',
    saved: 'Сессия сохранена локально.',
    invalid: 'Подтвердите возраст 18+, согласие и выберите уровень английского.'
  } : {
    start: 'Start pilot',
    resume: 'Continue saved session',
    subject: 'subject',
    main_verb: 'main verb',
    helper: 'helper verb',
    select: 'Select the chunk that carries the role:',
    confidence: 'How confident are you in that answer?',
    low: 'not confident',
    high: 'fully confident',
    comprehension: 'Meaning check',
    true: 'True',
    false: 'False',
    visualLoad: 'How visually demanding did the interface feel?',
    easy: 'very light',
    heavy: 'very demanding',
    finish: 'Finish session',
    complete: 'Session complete',
    accuracy: 'Role-identification accuracy',
    rt: 'Median correct-response time',
    comprehensionAccuracy: 'Meaning comprehension',
    condition: 'Condition',
    clean: 'clean sentence',
    tagged: 'tagged sentence',
    exportJson: 'Export JSON',
    exportCsv: 'Export CSV',
    copySummary: 'Copy summary',
    copied: 'Summary copied',
    privacy: 'Responses are stored only in this browser. Nothing is sent automatically.',
    progress: 'Task',
    of: 'of',
    recorded: 'Response recorded. Now rate your confidence.',
    nextMeaning: 'Now answer the meaning check.',
    saved: 'Session saved locally.',
    invalid: 'Confirm age 18+, consent, and select your English level.'
  };

  const storageKey = 'metkagram:research:h1:v1';
  const dataUrl = '/data/research/h1-cue-utility-v1.json';
  let study;
  let state;
  let trialStartedAt = 0;

  const randomFloat = () => {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] / 4294967296;
  };

  const randomId = () => {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
  };

  const shuffle = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(randomFloat() * (index + 1));
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  };

  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const load = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; }
  };

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  };

  const percentage = (correct, total) => total ? Math.round((correct / total) * 100) : 0;

  const currentTrial = () => study.stimuli.find((item) => item.id === state.order[state.index]);

  function renderTrial() {
    const trial = currentTrial();
    if (!trial) return renderVisualLoad();
    const tagged = state.condition === 'tagged';
    const roleLabel = copy[trial.target_role] || trial.target_role;
    root.innerHTML = `<section class="pilot-panel pilot-task">
      <header class="pilot-progress"><p>${copy.progress} ${state.index + 1} ${copy.of} ${state.order.length}</p><progress max="${state.order.length}" value="${state.index + 1}"></progress></header>
      <p class="pilot-condition" aria-live="polite">${copy.condition}: <strong>${tagged ? copy.tagged : copy.clean}</strong></p>
      <h2>${copy.select} <strong>${escapeHtml(roleLabel)}</strong></h2>
      <div class="pilot-sentence" data-pilot-sentence>${trial.chunks.map((chunk, index) => `<button type="button" class="pilot-chunk" data-chunk-index="${index}">${tagged ? `<small aria-label="functional tag ${escapeHtml(chunk.tag)}">${escapeHtml(chunk.tag)}</small>` : ''}<span>${escapeHtml(chunk.text)}</span></button>`).join(' ')}</div>
      <p class="pilot-feedback" data-pilot-feedback aria-live="polite"></p>
      <fieldset class="pilot-confidence" data-pilot-confidence disabled><legend>${copy.confidence}</legend><div>${[1,2,3,4,5].map((value) => `<button type="button" data-confidence="${value}">${value}</button>`).join('')}</div><small><span>${copy.low}</span><span>${copy.high}</span></small></fieldset>
      <fieldset class="pilot-comprehension" data-pilot-comprehension hidden><legend>${copy.comprehension}</legend><p>${escapeHtml(trial.comprehension.statement)}</p><div><button type="button" data-comprehension="true">${copy.true}</button><button type="button" data-comprehension="false">${copy.false}</button></div></fieldset>
      <p class="pilot-privacy">${copy.privacy}</p>
    </section>`;

    const buttons = [...root.querySelectorAll('[data-chunk-index]')];
    const confidence = root.querySelector('[data-pilot-confidence]');
    const comprehension = root.querySelector('[data-pilot-comprehension]');
    const feedback = root.querySelector('[data-pilot-feedback]');
    let response;
    trialStartedAt = performance.now();

    buttons.forEach((button) => button.addEventListener('click', () => {
      if (response) return;
      const selectedIndex = Number(button.dataset.chunkIndex);
      const selected = trial.chunks[selectedIndex];
      response = {
        stimulus_id: trial.id,
        target_role: trial.target_role,
        selected_index: selectedIndex,
        selected_text: selected.text,
        selected_role: selected.role,
        correct: selected.role === trial.target_role,
        response_time_ms: Math.round(performance.now() - trialStartedAt),
        confidence: null,
        comprehension_response: null,
        comprehension_correct: null
      };
      buttons.forEach((item) => { item.disabled = true; });
      button.dataset.selected = 'true';
      confidence.disabled = false;
      feedback.textContent = copy.recorded;
    }));

    root.querySelectorAll('[data-confidence]').forEach((button) => button.addEventListener('click', () => {
      if (!response || response.confidence) return;
      response.confidence = Number(button.dataset.confidence);
      confidence.disabled = true;
      button.dataset.selected = 'true';
      comprehension.hidden = false;
      feedback.textContent = copy.nextMeaning;
      comprehension.querySelector('button')?.focus();
    }));

    root.querySelectorAll('[data-comprehension]').forEach((button) => button.addEventListener('click', () => {
      if (!response || !response.confidence || response.comprehension_response !== null) return;
      const answer = button.dataset.comprehension === 'true';
      response.comprehension_response = answer;
      response.comprehension_correct = answer === trial.comprehension.answer;
      state.responses.push(response);
      state.index += 1;
      state.updated_at = new Date().toISOString();
      save();
      renderTrial();
    }));
  }

  function renderVisualLoad() {
    root.innerHTML = `<section class="pilot-panel pilot-finish"><p class="eyebrow">${study.study_id}</p><h2>${copy.visualLoad}</h2><div class="pilot-scale">${[1,2,3,4,5].map((value) => `<button type="button" data-visual-load="${value}">${value}</button>`).join('')}</div><div class="pilot-scale-label"><span>${copy.easy}</span><span>${copy.heavy}</span></div><p>${copy.privacy}</p></section>`;
    root.querySelectorAll('[data-visual-load]').forEach((button) => button.addEventListener('click', () => {
      state.visual_load = Number(button.dataset.visualLoad);
      state.completed_at = new Date().toISOString();
      state.completed = true;
      save();
      renderSummary();
    }));
  }

  function summary() {
    const responses = state.responses || [];
    const correct = responses.filter((item) => item.correct);
    const comprehensionCorrect = responses.filter((item) => item.comprehension_correct);
    return {
      role_accuracy_pct: percentage(correct.length, responses.length),
      median_correct_response_time_ms: median(correct.map((item) => item.response_time_ms)),
      comprehension_accuracy_pct: percentage(comprehensionCorrect.length, responses.length),
      mean_confidence: responses.length ? Number((responses.reduce((sum, item) => sum + (item.confidence || 0), 0) / responses.length).toFixed(2)) : null,
      visual_load: state.visual_load,
      completed_trials: responses.length
    };
  }

  function exportRecord() {
    return {
      study_id: study.study_id,
      study_version: study.version,
      session_id: state.session_id,
      condition: state.condition,
      cefr: state.cefr,
      locale,
      browser_language: navigator.language || null,
      device_class: window.innerWidth < 700 ? 'small-screen' : 'large-screen',
      started_at: state.started_at,
      completed_at: state.completed_at,
      order: state.order,
      responses: state.responses,
      visual_load: state.visual_load,
      summary: summary()
    };
  }

  function download(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function toCsv(record) {
    const headers = ['study_id','study_version','session_id','condition','cefr','stimulus_id','target_role','selected_text','selected_role','correct','response_time_ms','confidence','comprehension_response','comprehension_correct','visual_load'];
    const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = record.responses.map((item) => [record.study_id, record.study_version, record.session_id, record.condition, record.cefr, item.stimulus_id, item.target_role, item.selected_text, item.selected_role, item.correct, item.response_time_ms, item.confidence, item.comprehension_response, item.comprehension_correct, record.visual_load]);
    return [headers, ...rows].map((row) => row.map(quote).join(',')).join('\n');
  }

  function renderSummary() {
    const result = summary();
    const conditionText = state.condition === 'tagged' ? copy.tagged : copy.clean;
    root.innerHTML = `<section class="pilot-panel pilot-summary"><p class="eyebrow">${study.study_id}</p><h2>${copy.complete}</h2><p>${copy.saved}</p><dl>
      <div><dt>${copy.condition}</dt><dd>${conditionText}</dd></div>
      <div><dt>${copy.accuracy}</dt><dd>${result.role_accuracy_pct}%</dd></div>
      <div><dt>${copy.rt}</dt><dd>${result.median_correct_response_time_ms ?? 'n/a'} ms</dd></div>
      <div><dt>${copy.comprehensionAccuracy}</dt><dd>${result.comprehension_accuracy_pct}%</dd></div>
    </dl><div class="pilot-export"><button type="button" data-export-json>${copy.exportJson}</button><button type="button" data-export-csv>${copy.exportCsv}</button><button type="button" data-copy-summary>${copy.copySummary}</button></div><p data-copy-feedback aria-live="polite"></p><p class="pilot-privacy">${copy.privacy}</p></section>`;
    const record = exportRecord();
    root.querySelector('[data-export-json]')?.addEventListener('click', () => download(`${study.study_id}-${state.session_id}.json`, JSON.stringify(record, null, 2), 'application/json'));
    root.querySelector('[data-export-csv]')?.addEventListener('click', () => download(`${study.study_id}-${state.session_id}.csv`, toCsv(record), 'text/csv'));
    root.querySelector('[data-copy-summary]')?.addEventListener('click', async () => {
      const text = `${study.study_id} | ${conditionText} | accuracy ${result.role_accuracy_pct}% | median correct RT ${result.median_correct_response_time_ms ?? 'n/a'} ms | comprehension ${result.comprehension_accuracy_pct}% | visual load ${result.visual_load}/5`;
      try { await navigator.clipboard.writeText(text); } catch { /* no-op */ }
      root.querySelector('[data-copy-feedback]').textContent = copy.copied;
    });
  }

  function renderIntro() {
    const saved = load();
    const resumable = saved?.study_version === study.version && !saved.completed && saved.responses?.length < study.stimuli.length;
    root.innerHTML = `<section class="pilot-panel pilot-intro"><p class="eyebrow">${study.study_id} · ${study.status}</p><h2>${locale === 'ru' ? 'Пилот полезности визуальной разметки' : 'Functional-tag cue utility pilot'}</h2><p>${locale === 'ru' ? 'Короткий эксперимент сравнивает одно и то же предложение с функциональными метками и без них. Он измеряет распознавание структуры, скорость и понимание смысла, а не знание английского в целом.' : 'This short experiment compares the same sentence with and without functional labels. It measures structural-role identification, speed, and meaning comprehension, not English proficiency as a whole.'}</p>
      <form data-pilot-start>
        <label>${locale === 'ru' ? 'Ваш текущий уровень английского' : 'Your current English level'}<select name="cefr" required><option value="">—</option><option>B1</option><option>B2</option><option>C1+</option><option>A2 or below</option><option>Not sure</option></select></label>
        <label class="pilot-check"><input type="checkbox" name="adult"> ${locale === 'ru' ? 'Мне 18 лет или больше.' : 'I am 18 or older.'}</label>
        <label class="pilot-check"><input type="checkbox" name="consent"> ${locale === 'ru' ? 'Я добровольно участвую в этом исследовательском пилоте и понимаю, что данные остаются на моём устройстве, пока я сам их не экспортирую.' : 'I voluntarily take part in this exploratory pilot and understand that data stays on my device unless I export it myself.'}</label>
        <button class="primary-link pilot-start" type="submit">${copy.start}</button>
        ${resumable ? `<button class="pilot-resume" type="button" data-resume>${copy.resume}</button>` : ''}
        <p class="pilot-error" data-pilot-error aria-live="polite"></p>
      </form><p class="pilot-privacy">${copy.privacy}</p></section>`;

    root.querySelector('[data-resume]')?.addEventListener('click', () => {
      state = saved;
      state.completed ? renderSummary() : renderTrial();
    });

    root.querySelector('[data-pilot-start]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      if (!form.get('cefr') || !form.get('adult') || !form.get('consent')) {
        root.querySelector('[data-pilot-error]').textContent = copy.invalid;
        return;
      }
      state = {
        study_version: study.version,
        session_id: randomId(),
        condition: randomFloat() < 0.5 ? 'clean' : 'tagged',
        cefr: form.get('cefr'),
        order: shuffle(study.stimuli.map((item) => item.id)),
        index: 0,
        responses: [],
        visual_load: null,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
        completed: false
      };
      save();
      renderTrial();
    });
  }

  fetch(dataUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load ${dataUrl}`);
      return response.json();
    })
    .then((payload) => {
      study = payload;
      const saved = load();
      if (saved?.study_version === study.version && saved.completed) {
        state = saved;
        renderSummary();
      } else {
        renderIntro();
      }
    })
    .catch(() => {
      root.innerHTML = `<p>Unable to load the pilot definition.</p>`;
    });
}
