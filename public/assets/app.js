const locale = document.documentElement.lang === "ru" ? "ru" : "en";
const copy = {
  en: { showing: "Showing", of: "of", sets: "sets", patterns: "patterns" },
  ru: { showing: "Показано", of: "из", sets: "наборов", patterns: "паттернов" }
}[locale];

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

async function copyShareUrl(url) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }
  const field = document.createElement("textarea");
  field.value = url;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("copy unavailable");
}

function setupShareBars() {
  document.querySelectorAll("[data-share-bar]").forEach((bar) => {
    const url = bar.dataset.shareUrl;
    const title = bar.dataset.shareTitle;
    const feedback = bar.querySelector("[data-share-feedback]");
    const native = bar.querySelector("[data-native-share]");
    if (navigator.share && native) {
      native.hidden = false;
      native.addEventListener("click", async () => {
        try { await navigator.share({ title, url }); } catch (error) { if (error.name !== "AbortError") feedback.textContent = url; }
      });
    }
    bar.querySelector("[data-copy-link]")?.addEventListener("click", async () => {
      try {
        await copyShareUrl(url);
        feedback.textContent = bar.dataset.shareCopied;
      } catch {
        feedback.textContent = url;
      }
    });
  });
}

setupMenu();
setupLocaleSuggestion();
setupTagRules();
setupAnnotationMode();
setupCollectionSearch();
setupPatternFilters();
setupShareBars();
