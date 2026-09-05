const dataNode = document.querySelector("#pattern-lens-data");
const root = document.querySelector("[data-pattern-lens]");

if (dataNode && root) {
  const lensPayload = JSON.parse(dataNode.textContent);
  const locale = lensPayload.locale === "ru" ? "ru" : "en";
  const results = root.querySelector("[data-lens-results]");

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const copy = locale === "ru"
    ? {
        title: "Следующий шаг",
        compare: "Сравнить с соседним паттерном",
        test: "Проверить выбор",
        route: "Пройти reasoning-маршрут",
        fit: "задача, где этот паттерн подходит",
      }
    : {
        title: "Next step",
        compare: "Compare with a nearby pattern",
        test: "Test the choice",
        route: "Follow a reasoning route",
        fit: "a drill where this pattern is the best fit",
      };

  const contrastLink = (record) => {
    const contrast = record.contrasts?.[0];
    if (!contrast) return "";
    const title = locale === "ru" ? contrast.title_ru : contrast.title_en;
    return `<a class="lens-relation-link" data-relation-kind="contrast" href="/${locale}/contrasts/${escapeHtml(contrast.id)}/"><span>${escapeHtml(copy.compare)}</span><strong>${escapeHtml(contrast.paired_pattern)}</strong><small>${escapeHtml(title)}</small></a>`;
  };

  const drillLink = (record) => {
    const drill = record.drills?.find((item) => item.role === "best-fit") || record.drills?.[0];
    if (!drill) return "";
    const scenario = locale === "ru" ? drill.scenario_ru : drill.scenario_en;
    return `<a class="lens-relation-link" data-relation-kind="drill" href="/${locale}/clinic/#${escapeHtml(drill.id)}"><span>${escapeHtml(copy.test)}</span><strong>${escapeHtml(copy.fit)}</strong><small>${escapeHtml(scenario)}</small></a>`;
  };

  const packLink = (record) => {
    const pack = record.packs?.[0];
    if (!pack) return "";
    const title = locale === "ru" ? pack.title_ru : pack.title_en;
    const description = locale === "ru" ? pack.description_ru : pack.description_en;
    return `<a class="lens-relation-link" data-relation-kind="pack" href="/${locale}/packs/${escapeHtml(pack.id)}/"><span>${escapeHtml(copy.route)}</span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></a>`;
  };

  const augment = (relationIndex) => {
    if (!results) return;
    const card = results.querySelector(".lens-card--primary") || results.querySelector(".lens-card");
    if (!card || card.dataset.knowledgeBridge === "true") return;

    const patternId = card.querySelector("code")?.textContent?.trim();
    const record = patternId ? relationIndex.byPattern?.[patternId] : null;
    card.dataset.knowledgeBridge = "true";
    if (!record) return;

    const links = [contrastLink(record), drillLink(record), packLink(record)].filter(Boolean).join("");
    if (!links) return;

    const section = document.createElement("nav");
    section.className = "lens-relations";
    section.dataset.lensGuidedNextStep = patternId;
    section.setAttribute("aria-label", copy.title);
    section.innerHTML = `<p class="lens-relations-title">${escapeHtml(copy.title)}</p><div class="lens-relation-links">${links}</div>`;

    // The reviewed continuation is deliberately gated behind the learner's
    // first reuse check. Hide it by default so module-fetch timing cannot
    // expose Contrast / Choice / Route before the practice bridge is ready.
    section.hidden = card.dataset.lensPracticeComplete !== "true";
    if (section.hidden) {
      card.addEventListener("metkagram:lens-practice-complete", (event) => {
        if (event.detail?.patternId !== patternId) return;
        section.hidden = false;
      }, { once: true });
    }

    card.append(section);
  };

  fetch("/data/pattern-relations.json")
    .then((response) => response.ok ? response.json() : null)
    .then((relationIndex) => {
      if (!relationIndex?.byPattern) return;
      augment(relationIndex);
      if (!results) return;
      const observer = new MutationObserver(() => augment(relationIndex));
      observer.observe(results, { childList: true, subtree: true });
    })
    .catch(() => {});
}
