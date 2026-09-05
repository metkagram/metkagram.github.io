import { activationSummaryBundle, summarizeLensActivation } from './learning-activation-core.js';

const root = document.querySelector("[data-learning-activity]");
const api = window.MetkagramLearningEvents;

if (root && api) {
  const ru = document.documentElement.lang === "ru";
  const copy = ru
    ? {
        empty: "Локальных событий пока нет.",
        events: "событий",
        sessions: "сессий",
        export: "Экспорт событий JSON",
        exportSummary: "Экспорт activation summary",
        clear: "Очистить локальные данные",
        confirm: "Очистить локальный журнал Metkagram в этом браузере?",
        recent: "Последние события",
        activation: "Lens activation summary",
        activationNote: "Агрегированные продуктовые сигналы для пилота. Совпадение паттерна не означает, что пользователь счёл его полезным, а несколько локальных сессий не доказывают добровольный возврат.",
        analyses: "Анализы",
        matched: "С совпадением",
        attempts: "Свои примеры",
        completions: "Проверки завершены",
        continuations: "Переходы дальше",
        lensSessions: "Lens-сессии",
      }
    : {
        empty: "No local learning events yet.",
        events: "events",
        sessions: "sessions",
        export: "Export event JSON",
        exportSummary: "Export activation summary",
        clear: "Clear local data",
        confirm: "Clear the local Metkagram learning log in this browser?",
        recent: "Recent events",
        activation: "Lens activation summary",
        activationNote: "Aggregate product signals for the pilot. A Pattern match does not mean the learner found it useful, and multiple local sessions do not prove voluntary return.",
        analyses: "Analyses",
        matched: "With a match",
        attempts: "Own examples",
        completions: "Checks completed",
        continuations: "Continued onward",
        lensSessions: "Lens sessions",
      };

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const downloadJson = (value, prefix) => {
    const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const metric = (label, value) => `<article><strong>${value}</strong><span>${escapeHtml(label)}</span></article>`;

  const render = () => {
    const events = api.read();
    if (!events.length) {
      root.innerHTML = `<div class="activity-empty"><p>${escapeHtml(copy.empty)}</p></div><div class="activity-actions"><button type="button" data-activity-export disabled>${escapeHtml(copy.export)}</button><button type="button" data-activation-export disabled>${escapeHtml(copy.exportSummary)}</button><button type="button" data-activity-clear disabled>${escapeHtml(copy.clear)}</button></div>`;
      return;
    }

    const sessions = new Set(events.map((item) => item.session_id)).size;
    const counts = Object.entries(events.reduce((acc, event) => {
      acc[event.event_name] = (acc[event.event_name] || 0) + 1;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]);
    const recent = events.slice(-50).reverse();
    const activation = summarizeLensActivation(events);
    const m = activation.metrics;

    root.innerHTML = `
      <div class="activity-summary">
        <article><strong>${events.length}</strong><span>${escapeHtml(copy.events)}</span></article>
        <article><strong>${sessions}</strong><span>${escapeHtml(copy.sessions)}</span></article>
      </div>
      <section class="activity-activation" data-activation-summary>
        <h2>${escapeHtml(copy.activation)}</h2>
        <p>${escapeHtml(copy.activationNote)}</p>
        <div class="activity-summary activity-summary--activation">
          ${metric(copy.analyses, m.analysis_count)}
          ${metric(copy.matched, m.matched_analysis_count)}
          ${metric(copy.attempts, m.practice_attempt_count)}
          ${metric(copy.completions, m.practice_completion_count)}
          ${metric(copy.continuations, m.continuation_count)}
          ${metric(copy.lensSessions, m.lens_session_count)}
        </div>
      </section>
      <div class="activity-counts">${counts.map(([name, count]) => `<div><code>${escapeHtml(name)}</code><strong>${count}</strong></div>`).join("")}</div>
      <div class="activity-actions"><button type="button" data-activity-export>${escapeHtml(copy.export)}</button><button type="button" data-activation-export>${escapeHtml(copy.exportSummary)}</button><button type="button" data-activity-clear>${escapeHtml(copy.clear)}</button></div>
      <section class="activity-recent"><h2>${escapeHtml(copy.recent)}</h2><div class="activity-table-wrap"><table><thead><tr><th>Time</th><th>Event</th><th>Object</th><th>Surface</th></tr></thead><tbody>${recent.map((event) => `<tr><td>${escapeHtml(new Date(event.occurred_at).toLocaleString())}</td><td><code>${escapeHtml(event.event_name)}</code></td><td>${escapeHtml(event.object_id || "—")}</td><td>${escapeHtml(event.surface)}</td></tr>`).join("")}</tbody></table></div></section>`;

    root.querySelector("[data-activity-export]")?.addEventListener("click", () => downloadJson(api.exportBundle(), "metkagram-learning-activity"));
    root.querySelector("[data-activation-export]")?.addEventListener("click", () => downloadJson(activationSummaryBundle(events), "metkagram-lens-activation"));
    root.querySelector("[data-activity-clear]")?.addEventListener("click", () => {
      if (!confirm(copy.confirm)) return;
      api.clear();
      render();
    });
  };

  window.addEventListener("metkagram:learning-event", render);
  render();
}
