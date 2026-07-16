import { CODE_PATTERN, dueIds, loadCode, loadProgress, mergeStates, normalizeEnvelope, progressStats, saveCode, saveProgress, scheduleReview } from "./srs-core.js";

const locale = document.documentElement.lang === "ru" ? "ru" : "en";
const copy = {
  en: { reviewSaved: "Review saved.", counter: "in queue", importDone: "Progress imported.", importError: "This file is not a valid Metkagram progress export.", syncDone: "Progress synchronized.", syncError: "Synchronization failed. Your local progress is safe.", syncWorking: "Synchronizing…", invalidCode: "Use 3–64 letters, numbers, - or _.", days: "days", due: "Due", yes: "yes", no: "no", showing: "Showing", of: "of", sets: "sets", patterns: "patterns", dueReviews: "Due reviews", availablePatterns: "Available patterns", continueLearning: "Continue learning", startWith: "Start with", availableToLearn: "Ready to learn" },
  ru: { reviewSaved: "Повторение сохранено.", counter: "в очереди", importDone: "Прогресс импортирован.", importError: "Файл не является корректным экспортом прогресса Metkagram.", syncDone: "Прогресс синхронизирован.", syncError: "Не удалось синхронизировать. Локальный прогресс сохранён.", syncWorking: "Идёт синхронизация…", invalidCode: "Используйте 3–64 буквы, цифры, - или _.", days: "дней", due: "Сейчас", yes: "да", no: "нет", showing: "Показано", of: "из", sets: "наборов", patterns: "паттернов", dueReviews: "К повторению", availablePatterns: "Доступно моделей", continueLearning: "Продолжить", startWith: "Начните с", availableToLearn: "Можно начать" }
}[locale];
const formatCount = (value) => value.toLocaleString(locale === "ru" ? "ru-RU" : "en-US");

function setupMenu() {
  const button = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("#site-nav");
  if (!button || !nav) return;
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    nav.dataset.open = String(open);
  });
}

function setupLocaleSuggestion() {
  const suggestion = document.querySelector("[data-locale-suggestion]");
  if (!suggestion || !navigator.language?.toLowerCase().startsWith("ru") || sessionStorage.getItem("metkagram:locale-dismissed")) return;
  suggestion.hidden = false;
  suggestion.querySelector("[data-dismiss-locale]")?.addEventListener("click", () => {
    sessionStorage.setItem("metkagram:locale-dismissed", "1");
    suggestion.hidden = true;
  });
}

function setupTagRules() {
  const triggers = [...document.querySelectorAll("[data-tag-trigger]")];
  if (!triggers.length) return;
  const closeAll = (except) => triggers.forEach((trigger) => {
    if (trigger !== except) trigger.setAttribute("aria-expanded", "false");
  });
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const next = trigger.getAttribute("aria-expanded") !== "true";
      closeAll(trigger);
      trigger.setAttribute("aria-expanded", String(next));
    });
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        trigger.setAttribute("aria-expanded", "false");
        trigger.blur();
      }
    });
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-tag-trigger]")) closeAll();
  });
}

function setupAnnotationMode() {
  const controls = document.querySelector("[data-annotation-controls]");
  if (!controls) return;
  const buttons = [...controls.querySelectorAll("[data-annotation-mode]")];
  const details = [...document.querySelectorAll("[data-annotation-details]")];
  const copy = controls.querySelector("[data-annotation-mode-copy]");
  const messages = { reading: controls.dataset.readingCopy, study: controls.dataset.studyCopy };
  const setMode = (mode) => {
    const studying = mode === "study";
    details.forEach((item) => { item.open = studying; });
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.annotationMode === mode)));
    if (copy) copy.textContent = messages[mode];
  };
  buttons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.annotationMode)));
}

function setupCollectionSearch() {
  const input = document.querySelector("[data-collection-search]");
  const list = document.querySelector("[data-collection-list]");
  if (!input || !list) return;
  const items = [...list.querySelectorAll("a[data-search-text]")];
  const empty = list.querySelector("[data-empty-state]");
  const count = document.querySelector("[data-collection-count]");
  input.addEventListener("input", () => {
    const query = input.value.trim().toLocaleLowerCase(locale);
    let visible = 0;
    for (const item of items) {
      const match = !query || item.dataset.searchText.includes(query);
      item.hidden = !match;
      if (match) visible += 1;
    }
    if (empty) empty.hidden = visible > 0;
    if (count) count.textContent = `${copy.showing} ${visible} ${copy.of} ${items.length} ${copy.sets}`;
  });
}

function setupPatternFilters() {
  const list = document.querySelector("[data-pattern-list]");
  if (!list) return;
  const buttons = [...document.querySelectorAll("[data-language-filter]")];
  const category = document.querySelector("[data-category-filter]");
  const search = document.querySelector("[data-pattern-search]");
  const items = [...list.querySelectorAll("a[data-language]")];
  const empty = list.querySelector("[data-empty-state]");
  const count = document.querySelector("[data-pattern-count]");
  const apply = () => {
    const active = buttons.filter((button) => button.getAttribute("aria-pressed") === "true").map((button) => button.dataset.languageFilter);
    const query = search?.value.trim().toLocaleLowerCase(locale) || "";
    let visible = 0;
    for (const item of items) {
      const languages = item.dataset.language.split(" ");
      const matchesLanguage = active.some((language) => languages.includes(language));
      const matchesCategory = !category?.value || item.dataset.category === category.value;
      const matchesQuery = !query || item.dataset.searchText.includes(query);
      const match = matchesLanguage && matchesCategory && matchesQuery;
      item.hidden = !match;
      if (match) visible += 1;
    }
    if (empty) empty.hidden = visible > 0;
    if (count) count.textContent = `${copy.showing} ${visible} ${copy.patterns}`;
  };
  buttons.forEach((button) => button.addEventListener("click", () => {
    const next = button.getAttribute("aria-pressed") !== "true";
    if (!next && buttons.filter((item) => item.getAttribute("aria-pressed") === "true").length === 1) return;
    button.setAttribute("aria-pressed", String(next));
    apply();
  }));
  category?.addEventListener("change", apply);
  search?.addEventListener("input", apply);
}

async function loadPatterns() {
  const response = await fetch("/data/advanced-patterns.json");
  if (!response.ok) throw new Error("patterns unavailable");
  return response.json();
}

function storeReview(id, grade) {
  const records = loadProgress();
  records[id] = scheduleReview(records[id] || { id }, grade);
  saveProgress(records);
  document.dispatchEvent(new CustomEvent("metkagram:progress"));
  return records[id];
}

function setupInlineReview() {
  const container = document.querySelector("[data-inline-review]");
  const page = document.querySelector("[data-pattern-id]");
  if (!container || !page) return;
  container.querySelectorAll("[data-grade]").forEach((button) => button.addEventListener("click", () => {
    const state = storeReview(page.dataset.patternId, Number(button.dataset.grade));
    const output = container.querySelector("output");
    if (output) output.textContent = `${copy.reviewSaved} ${state.interval} ${copy.days}.`;
  }));
}

async function setupReviewQueue() {
  const workspace = document.querySelector("[data-review-workspace]");
  if (!workspace) return;
  const patterns = await loadPatterns();
  let records = loadProgress();
  let queue = dueIds(patterns.map((pattern) => pattern.id), records);
  let position = 0;
  const card = workspace.querySelector("[data-review-card]");
  const empty = workspace.querySelector("[data-review-empty]");
  const counter = workspace.querySelector("[data-review-counter]");
  const answer = workspace.querySelector("[data-review-answer]");
  const reveal = workspace.querySelector("[data-reveal]");
  const grades = [...workspace.querySelectorAll("[data-grade]")];
  const render = () => {
    const id = queue[position];
    const pattern = patterns.find((item) => item.id === id);
    if (!pattern) {
      card.hidden = true;
      empty.hidden = false;
      counter.textContent = `0 ${copy.counter}`;
      return;
    }
    const lang = pattern.langs[0];
    card.hidden = false;
    empty.hidden = true;
    counter.textContent = `${formatCount(queue.length - position)} ${copy.counter}`;
    workspace.querySelector("[data-review-title]").textContent = locale === "ru" ? pattern.title_ru : lang.formula;
    workspace.querySelector("[data-review-formula]").textContent = lang.formula;
    workspace.querySelector("[data-review-example]").textContent = lang.example;
    workspace.querySelector("[data-review-translation]").textContent = locale === "ru" ? lang.translation || "" : "";
    answer.hidden = true;
    reveal.hidden = false;
    grades.forEach((button) => { button.hidden = true; });
  };
  reveal.addEventListener("click", () => {
    answer.hidden = false;
    reveal.hidden = true;
    grades.forEach((button) => { button.hidden = false; });
  });
  grades.forEach((button) => button.addEventListener("click", () => {
    storeReview(queue[position], Number(button.dataset.grade));
    position += 1;
    render();
  }));
  render();
}

async function setupStudySetQueue() {
  const workspace = document.querySelector("[data-study-workspace]");
  if (!workspace) return;
  const patterns = (await loadPatterns()).filter((pattern) => pattern.set_id === workspace.dataset.studySet);
  let position = 0;
  const card = workspace.querySelector("[data-review-card]");
  const empty = workspace.querySelector("[data-review-empty]");
  const counter = workspace.querySelector("[data-review-counter]");
  const answer = workspace.querySelector("[data-review-answer]");
  const reveal = workspace.querySelector("[data-reveal]");
  const grades = [...workspace.querySelectorAll("[data-grade]")];
  const render = () => {
    const pattern = patterns[position];
    if (!pattern) { card.hidden = true; empty.hidden = false; counter.textContent = `0 ${copy.counter}`; return; }
    const lang = pattern.langs[0];
    card.hidden = false; empty.hidden = true;
    counter.textContent = `${formatCount(patterns.length - position)} ${copy.counter}`;
    workspace.querySelector("[data-review-title]").textContent = locale === "ru" ? pattern.title_ru : lang.formula;
    workspace.querySelector("[data-review-formula]").textContent = lang.formula;
    workspace.querySelector("[data-review-example]").textContent = lang.example;
    workspace.querySelector("[data-review-translation]").textContent = lang.translation || "";
    answer.hidden = true; reveal.hidden = false; grades.forEach((button) => { button.hidden = true; });
  };
  reveal.addEventListener("click", () => { answer.hidden = false; reveal.hidden = true; grades.forEach((button) => { button.hidden = false; }); });
  grades.forEach((button) => button.addEventListener("click", () => { storeReview(patterns[position].id, Number(button.dataset.grade)); position += 1; render(); }));
  render();
}

async function setupPracticeDashboard() {
  const dashboard = document.querySelector("[data-practice-status]");
  if (!dashboard) return;
  const patterns = await loadPatterns();
  const render = () => {
    const records = loadProgress();
    const stats = progressStats(records, patterns.map((pattern) => pattern.id));
    const isFirstRun = stats.reviewed === 0;
    dashboard.querySelector("[data-practice-due]").textContent = formatCount(isFirstRun ? patterns.length : stats.due);
    dashboard.querySelector("[data-practice-queue-label]").textContent = isFirstRun ? copy.availablePatterns : copy.dueReviews;
    dashboard.querySelector("[data-practice-continue-label]").textContent = isFirstRun ? copy.startWith : copy.continueLearning;
    const next = patterns.find((pattern) => !records[pattern.id]?.history?.length) || patterns.find((pattern) => records[pattern.id]?.next <= Date.now());
    dashboard.querySelector("[data-practice-continue]").textContent = next ? (locale === "ru" ? next.title_ru : next.langs[0].formula) : copy.queueEmpty;
    document.querySelectorAll("[data-set-progress]").forEach((output) => {
      const group = patterns.filter((pattern) => pattern.set_id === output.dataset.setProgress);
      const reviewed = group.filter((pattern) => records[pattern.id]?.history?.length).length;
      output.textContent = `${Math.round((reviewed / group.length) * 100)}%`;
    });
  };
  document.addEventListener("metkagram:progress", render);
  render();
}

function downloadProgress() {
  const envelope = saveProgress(loadProgress());
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `metkagram-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

async function syncProgress(endpoint, code, status) {
  status.textContent = copy.syncWorking;
  try {
    const getResponse = await fetch(`${endpoint}?code=${encodeURIComponent(code)}`, { cache: "no-store" });
    const remote = getResponse.ok ? (await getResponse.json()).payload || {} : {};
    const merged = mergeStates(loadProgress(), remote);
    const postResponse = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, payload: merged }) });
    if (!postResponse.ok) throw new Error("sync failed");
    saveProgress(merged);
    status.textContent = copy.syncDone;
    document.dispatchEvent(new CustomEvent("metkagram:progress"));
  } catch {
    status.textContent = copy.syncError;
  }
}

async function setupProgressPage() {
  const page = document.querySelector("[data-progress-page]");
  if (!page) return;
  const patterns = await loadPatterns();
  const patternById = new Map(patterns.map((pattern) => [pattern.id, pattern]));
  const render = () => {
    const records = loadProgress();
    const ids = patterns.map((pattern) => pattern.id);
    const stats = progressStats(records, ids);
    page.querySelector("[data-stat-due]").textContent = formatCount(stats.due);
    page.querySelector("[data-stat-due-label]").textContent = stats.reviewed === 0 ? copy.availableToLearn : copy.dueNow;
    page.querySelector("[data-stat-reviewed]").textContent = formatCount(stats.reviewed);
    page.querySelector("[data-stat-reviews]").textContent = formatCount(stats.totalReviews);
    const rows = page.querySelector("[data-progress-rows]");
    const states = Object.values(records).filter((state) => state.history?.length).sort((a, b) => b.last - a.last);
    rows.replaceChildren(...states.map((state) => {
      const pattern = patternById.get(state.id);
      const row = document.createElement("tr");
      const due = state.next <= Date.now();
      const title = pattern ? (locale === "ru" ? pattern.title_ru : pattern.langs[0]?.formula || pattern.id) : state.id;
      row.innerHTML = `<td><a href="/${locale}/practice/${state.id.toLowerCase()}/"></a></td><td></td><td></td><td></td>`;
      row.children[0].querySelector("a").textContent = title;
      row.children[1].textContent = state.history.length;
      row.children[2].textContent = `${state.interval} ${copy.days}`;
      row.children[3].textContent = due ? copy.yes : copy.no;
      return row;
    }));
    page.querySelector("[data-progress-empty]").hidden = states.length > 0;
    page.querySelector("[data-progress-first-run]").hidden = states.length > 0;
  };
  const codeInput = page.querySelector("[data-sync-code]");
  const status = page.querySelector("[data-sync-status]");
  codeInput.value = loadCode();
  page.querySelector("[data-save-code]").addEventListener("click", () => {
    if (!CODE_PATTERN.test(codeInput.value.trim())) { status.textContent = copy.invalidCode; return; }
    saveCode(codeInput.value);
    status.textContent = copy.syncDone;
  });
  page.querySelector("[data-sync-now]").addEventListener("click", () => {
    const code = codeInput.value.trim();
    if (!CODE_PATTERN.test(code)) { status.textContent = copy.invalidCode; return; }
    saveCode(code);
    const endpoint = document.querySelector('meta[name="metkagram-sync-endpoint"]')?.content;
    syncProgress(endpoint, code, status);
  });
  page.querySelector("[data-export-progress]").addEventListener("click", downloadProgress);
  const importInput = page.querySelector("[data-import-progress]");
  const importStatus = page.querySelector("[data-import-status]");
  importInput.addEventListener("change", async () => {
    try {
      const file = importInput.files?.[0];
      if (!file) return;
      const envelope = normalizeEnvelope(JSON.parse(await file.text()));
      saveProgress(mergeStates(loadProgress(), envelope.records));
      importStatus.textContent = copy.importDone;
      render();
    } catch {
      importStatus.textContent = copy.importError;
    }
  });
  document.addEventListener("metkagram:progress", render);
  render();
}

setupMenu();
setupLocaleSuggestion();
setupTagRules();
setupAnnotationMode();
setupCollectionSearch();
setupPatternFilters();
setupInlineReview();
setupReviewQueue().catch(() => {});
setupStudySetQueue().catch(() => {});
setupPracticeDashboard().catch(() => {});
setupProgressPage().catch(() => {});
