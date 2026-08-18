(() => {
  const root = document.querySelector("[data-learning-activity]");
  const api = window.MetkagramLearningEvents;
  if (!root || !api) return;

  const copy = document.documentElement.lang === "ru"
    ? {
        empty: "Локальных событий пока нет.",
        events: "событий",
        sessions: "сессий",
        export: "Экспорт JSON",
        clear: "Очистить локальные данные",
        confirm: "Очистить локальный журнал Metkagram в этом браузере?",
        recent: "Последние события",
      }
    : {
        empty: "No local learning events yet.",
        events: "events",
        sessions: "sessions",
        export: "Export JSON",
        clear: "Clear local data",
        confirm: "Clear the local Metkagram learning log in this browser?",
        recent: "Recent events",
      };

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const download = () => {
    const blob = new Blob([`${JSON.stringify(api.exportBundle(), null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `metkagram-learning-activity-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const render = () => {
    const events = api.read();
    if (!events.length) {
      root.innerHTML = `<div class="activity-empty"><p>${escapeHtml(copy.empty)}</p></div><div class="activity-actions"><button type="button" data-activity-export disabled>${escapeHtml(copy.export)}</button><button type="button" data-activity-clear disabled>${escapeHtml(copy.clear)}</button></div>`;
      return;
    }
    const sessions = new Set(events.map((item) => item.session_id)).size;
    const counts = Object.entries(events.reduce((acc, event) => {
      acc[event.event_name] = (acc[event.event_name] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]);
    const recent = events.slice(-50).reverse();
    root.innerHTML = `
      <div class="activity-summary">
        <article><strong>${events.length}</strong><span>${escapeHtml(copy.events)}</span></article>
        <article><strong>${sessions}</strong><span>${escapeHtml(copy.sessions)}</span></article>
      </div>
      <div class="activity-counts">${counts.map(([name, count]) => `<div><code>${escapeHtml(name)}</code><strong>${count}</strong></div>`).join("")}</div>
      <div class="activity-actions"><button type="button" data-activity-export>${escapeHtml(copy.export)}</button><button type="button" data-activity-clear>${escapeHtml(copy.clear)}</button></div>
      <section class="activity-recent"><h2>${escapeHtml(copy.recent)}</h2><div class="activity-table-wrap"><table><thead><tr><th>Time</th><th>Event</th><th>Object</th><th>Surface</th></tr></thead><tbody>${recent.map((event) => `<tr><td>${escapeHtml(new Date(event.occurred_at).toLocaleString())}</td><td><code>${escapeHtml(event.event_name)}</code></td><td>${escapeHtml(event.object_id || "—")}</td><td>${escapeHtml(event.surface)}</td></tr>`).join("")}</tbody></table></div></section>`;
    root.querySelector("[data-activity-export]")?.addEventListener("click", download);
    root.querySelector("[data-activity-clear]")?.addEventListener("click", () => {
      if (!confirm(copy.confirm)) return;
      api.clear();
      render();
    });
  };

  window.addEventListener("metkagram:learning-event", render);
  render();
})();
