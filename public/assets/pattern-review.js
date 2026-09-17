const section = document.querySelector("[data-pattern-review]");
if (section) {
  const cards = [...section.querySelectorAll("[data-review-card]")];
  const patternId = document.querySelector(".pattern-page")?.dataset.patternId || "";
  const storeKey = `metkagram:pattern-review:v1:${patternId}`;
  const store = {
    read() {
      try {
        const value = Number.parseInt(localStorage.getItem(storeKey) || "0", 10);
        return Number.isFinite(value) ? value : 0;
      } catch { return 0; }
    },
    write(index) {
      try { localStorage.setItem(storeKey, String(index)); } catch { /* storage unavailable */ }
    }
  };

  const state = cards.map((card) => ({
    card,
    stages: (card.dataset.stages || "cue").split(" "),
    stageIndex: 0,
    advance: card.querySelector("[data-review-advance]")
  }));

  const updateButton = (item, isLast) => {
    const { advance, stages, stageIndex } = item;
    if (!advance) return;
    advance.setAttribute("aria-expanded", String(stageIndex === stages.length - 1));
    if (stageIndex < stages.length - 1) {
      const nextStage = stages[stageIndex + 1];
      advance.textContent = nextStage === "de" ? advance.dataset.labelDe : advance.dataset.labelEn;
      return;
    }
    if (isLast && !advance.dataset.reviewGoto) {
      advance.hidden = true;
      return;
    }
    advance.textContent = advance.dataset.labelNext;
  };

  const activate = (index, { focus = false } = {}) => {
    state.forEach((item, itemIndex) => {
      if (itemIndex === index) item.card.dataset.active = "";
      else delete item.card.dataset.active;
    });
    store.write(index);
    if (focus) {
      const card = state[index]?.card;
      if (!card) return;
      card.tabIndex = -1;
      card.scrollIntoView({ block: "start" });
      card.focus({ preventScroll: true });
    }
  };

  const complete = (item) => {
    item.stageIndex = item.stages.length - 1;
    item.card.dataset.complete = "";
    for (const answer of item.card.querySelectorAll("[data-review-answer]")) answer.dataset.revealed = "";
  };

  state.forEach((item, index) => {
    const isLast = index === state.length - 1;
    updateButton(item, isLast);
    item.advance?.addEventListener("click", () => {
      if (item.stageIndex < item.stages.length - 1) {
        item.stageIndex += 1;
        const stage = item.stages[item.stageIndex];
        const answer = item.card.querySelector(`[data-review-answer="${stage}"]`);
        if (answer) answer.dataset.revealed = "";
        if (item.stageIndex === item.stages.length - 1) item.card.dataset.complete = "";
        updateButton(item, isLast);
        return;
      }
      if (isLast) {
        if (item.advance.dataset.reviewGoto) window.location.href = item.advance.dataset.reviewGoto;
        return;
      }
      activate(index + 1, { focus: true });
    });
    item.card.querySelector("[data-review-show-all]")?.addEventListener("click", () => {
      complete(item);
      updateButton(item, isLast);
    });
    item.card.querySelector("[data-review-skip]")?.addEventListener("click", () => {
      if (!isLast) activate(index + 1, { focus: true });
    });
  });

  const saved = Math.min(store.read(), state.length - 1);
  if (saved > 0) activate(saved);
}
