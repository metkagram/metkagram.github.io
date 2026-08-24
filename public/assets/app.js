const locale = document.documentElement.lang === "ru" ? "ru" : "en";
const copy = {
  en: { showing: "Showing", of: "of", sets: "sets", patterns: "patterns" },
  ru: { showing: "Показано", of: "из", sets: "наборов", patterns: "паттернов" }
}[locale];

const reasoningSources = [
  "/data/reasoning-frames/clf-041-044.json",
  "/data/reasoning-frames/clf-045-048.json",
  "/data/reasoning-frames/clf-049-052.json",
  "/data/reasoning-frames/clf-053-056.json",
  "/data/reasoning-frames/clf-057-060.json",
  "/data/reasoning-frames/clf-061-068.json",
  "/data/reasoning-frames/clf-069-070.json"
];

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

function setupNativeLanguage() {
  const controls = [...document.querySelectorAll("[data-native-language-control]")];
  if (!controls.length) return;
  const key = "metkagram:native-language";
  const labels = controls.map((control) => Object.fromEntries([...control.querySelectorAll("option")].map((option) => [option.value, option.textContent])));
  const saved = localStorage.getItem(key);
  const value = ["en", "ru", "other"].includes(saved) ? saved : (document.documentElement.lang === "ru" ? "ru" : "en");
  const apply = (next) => {
    document.documentElement.dataset.nativeLanguage = next;
    document.querySelectorAll("[data-native-translation]").forEach((item) => { item.hidden = next !== "ru"; });
    document.querySelectorAll("[data-native-other-notice]").forEach((item) => { item.hidden = next !== "other"; });
    controls.forEach((control, index) => {
      control.querySelector("[data-native-language-select]").value = next;
      control.querySelector("[data-native-language-summary]").textContent = labels[index][next];
    });
    localStorage.setItem(key, next);
  };
  controls.forEach((control) => control.querySelector("[data-native-language-select]").addEventListener("change", (event) => apply(event.target.value)));
  apply(value);
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

function setupReviewCards() {
  const toggles = [...document.querySelectorAll("[data-review-toggle]")];
  if (!toggles.length) return;
  const storagePrefix = `metkagram:sentence-review:v1:${window.location.pathname}:`;
  const readStored = (key) => {
    try { return window.localStorage.getItem(key) === "1"; } catch { return false; }
  };
  const writeStored = (key, reviewed) => {
    try { window.localStorage.setItem(key, reviewed ? "1" : "0"); } catch { /* Local progress stays optional. */ }
  };
  const apply = (button, reviewed) => {
    const card = button.closest("[data-review-card]");
    const line = card?.querySelector(".line-number")?.textContent?.trim() || "";
    card?.classList.toggle("is-reviewed", reviewed);
    button.setAttribute("aria-pressed", String(reviewed));
    button.setAttribute("aria-label", reviewed ? button.dataset.reviewOn : button.dataset.reviewOff);
    button.textContent = `${line} · ${reviewed ? button.dataset.reviewOn : button.dataset.reviewOff}`;
  };
  toggles.forEach((button) => {
    const key = `${storagePrefix}${button.dataset.reviewId}`;
    apply(button, readStored(key));
    button.addEventListener("click", () => {
      const reviewed = button.getAttribute("aria-pressed") !== "true";
      apply(button, reviewed);
      writeStored(key, reviewed);
    });
  });
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

function patternIdFromHref(href = "") {
  const parts = href.split("/").filter(Boolean);
  return (parts.at(-1) || "").toUpperCase();
}

async function loadReasoningFrames() {
  const responses = await Promise.all(reasoningSources.map(async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to load ${url}`);
    return response.json();
  }));
  return new Map(responses.flat().map((frame) => [frame.id.toUpperCase(), frame]));
}

function setupPatternFilters(reasoningFrames = new Map()) {
  const list = document.querySelector("[data-pattern-list]");
  if (!list) return;
  const buttons = [...document.querySelectorAll("[data-language-filter]")];
  const category = document.querySelector("[data-category-filter]");
  const search = document.querySelector("[data-pattern-search]");
  const items = [...list.querySelectorAll("a[data-language]")];
  const empty = list.querySelector("[data-empty-state]");
  const count = document.querySelector("[data-pattern-count]");

  for (const item of items) {
    const frame = reasoningFrames.get(patternIdFromHref(item.getAttribute("href")));
    const move = frame?.reasoning?.move || "";
    item.dataset.reasoning = move;
    if (frame) {
      const reasoningSearch = [frame.logic, frame.reasoning?.move, frame.reasoning?.what_it_does_en, frame.reasoning?.what_it_does_ru].filter(Boolean).join(" ");
      item.dataset.searchText = `${item.dataset.searchText || ""} ${reasoningSearch}`.toLocaleLowerCase(locale);
    }
  }

  const moves = [...new Set(items.map((item) => item.dataset.reasoning).filter(Boolean))].sort();
  let reasoning;
  if (moves.length) {
    const tools = document.querySelector(".practice-tools");
    const searchLabel = search?.closest("label");
    const label = document.createElement("label");
    label.textContent = locale === "ru" ? "Логический ход" : "Reasoning move";
    reasoning = document.createElement("select");
    reasoning.dataset.reasoningFilter = "";
    const all = document.createElement("option");
    all.value = "";
    all.textContent = locale === "ru" ? "Все логические ходы" : "All reasoning moves";
    reasoning.append(all);
    for (const move of moves) {
      const option = document.createElement("option");
      option.value = move;
      option.textContent = move;
      reasoning.append(option);
    }
    label.append(reasoning);
    if (searchLabel) searchLabel.before(label);
    else tools?.append(label);
  }

  const apply = () => {
    const active = buttons.filter((button) => button.getAttribute("aria-pressed") === "true").map((button) => button.dataset.languageFilter);
    const query = search?.value.trim().toLocaleLowerCase(locale) || "";
    let visible = 0;
    for (const item of items) {
      const languages = item.dataset.language.split(" ");
      const matchesLanguage = active.some((language) => languages.includes(language));
      const matchesCategory = !category?.value || item.dataset.category === category.value;
      const matchesReasoning = !reasoning?.value || item.dataset.reasoning === reasoning.value;
      const matchesQuery = !query || item.dataset.searchText.includes(query);
      const match = matchesLanguage && matchesCategory && matchesReasoning && matchesQuery;
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
  reasoning?.addEventListener("change", apply);
  search?.addEventListener("input", apply);
}

function findReasoningFrame(reasoningFrames) {
  const id = patternIdFromHref(window.location.pathname);
  const direct = reasoningFrames.get(id);
  if (direct) return direct;
  const formulas = [...document.querySelectorAll(".pattern-formulas code")].map((item) => item.textContent.trim().toLocaleLowerCase());
  return [...reasoningFrames.values()].find((frame) => frame.langs?.some((lang) => formulas.includes(lang.formula.trim().toLocaleLowerCase())));
}

function appendReasoningField(container, labelText, value) {
  if (!value) return;
  const block = document.createElement("div");
  const label = document.createElement("span");
  label.className = "language-code";
  label.textContent = labelText;
  const text = document.createElement("p");
  text.textContent = value;
  block.append(label, text);
  container.append(block);
}

function setupReasoningNotes(reasoningFrames) {
  const page = document.querySelector(".pattern-page");
  const comparison = page?.querySelector(".pattern-comparison");
  if (!page || !comparison) return;
  const frame = findReasoningFrame(reasoningFrames);
  if (!frame?.reasoning) return;

  const r = frame.reasoning;
  const section = document.createElement("section");
  section.className = "pattern-reference-card reasoning-reference";
  const header = document.createElement("header");
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = `${locale === "ru" ? "Логический ход" : "Reasoning move"} · ${r.move}`;
  header.append(eyebrow);
  section.append(header);

  const firstRow = document.createElement("div");
  firstRow.className = "pattern-formulas";
  appendReasoningField(firstRow, locale === "ru" ? "Что делает" : "What it does", locale === "ru" ? r.what_it_does_ru : r.what_it_does_en);
  appendReasoningField(firstRow, locale === "ru" ? "Когда использовать" : "When to use", locale === "ru" ? r.when_to_use_ru : r.when_to_use_en);
  section.append(firstRow);

  const secondRow = document.createElement("div");
  secondRow.className = "pattern-formulas";
  if (locale === "en") appendReasoningField(secondRow, "Contrast", r.contrast_en);
  appendReasoningField(secondRow, locale === "ru" ? "Частая ошибка" : "Common mistake", locale === "ru" ? r.common_mistake_ru : r.common_mistake_en);
  if (secondRow.children.length) section.append(secondRow);
  comparison.before(section);
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
    bar.querySelector("[data-print-page]")?.addEventListener("click", () => window.print());
  });
}

function setupHomeMotion() {
  const home = document.querySelector(".home-hero");
  if (!home || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const root = document.documentElement;
  root.classList.add("motion-enabled");
  const revealTargets = [
    ...document.querySelectorAll(".mode-doors, .home-method, .study-language, .home-connect, .home-faq, .site-footer")
  ];
  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      instance.unobserve(entry.target);
    });
  }, { threshold: 0.14 });
  revealTargets.forEach((target) => observer.observe(target));

  const header = document.querySelector(".site-header");
  let scheduled = false;
  const updateHeader = () => {
    scheduled = false;
    header?.classList.toggle("is-scrolled", window.scrollY > 16);
  };
  window.addEventListener("scroll", () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateHeader);
  }, { passive: true });
  updateHeader();
}

setupMenu();
setupLocaleSuggestion();
setupNativeLanguage();
setupTagRules();
setupAnnotationMode();
setupReviewCards();
setupCollectionSearch();
setupShareBars();
setupHomeMotion();

if (document.querySelector("[data-pattern-list], .pattern-page")) {
  loadReasoningFrames()
    .then((reasoningFrames) => {
      setupPatternFilters(reasoningFrames);
      setupReasoningNotes(reasoningFrames);
    })
    .catch(() => setupPatternFilters());
} else {
  setupPatternFilters();
}
