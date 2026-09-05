(() => {
  const STORAGE_KEY = "metkagram.learning_events.v1";
  const SESSION_KEY = "metkagram.learning_session.v1";
  const MAX_EVENTS = 1000;
  const allowedNames = new Set([
    "lens_analyze",
    "lens_practice_attempt",
    "lens_practice_complete",
    "learning_object_open",
    "clinic_feedback_reveal",
    "pack_step_open",
    "transfer_feedback_reveal",
    "export_download",
  ]);

  const uuid = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const locale = () => location.pathname.startsWith("/ru/") ? "ru" : "en";
  const surface = () => {
    const path = location.pathname;
    if (path.includes("/lens/")) return "lens";
    if (path.includes("/clinic/")) return "clinic";
    if (path.includes("/packs/")) return "pack";
    if (path.includes("/transfer/")) return "transfer";
    if (path.includes("/exports/")) return "exports";
    if (path.includes("/practice/")) return "practice";
    return "other";
  };
  const sessionId = () => {
    let value = sessionStorage.getItem(SESSION_KEY);
    if (!value) {
      value = uuid();
      sessionStorage.setItem(SESSION_KEY, value);
    }
    return value;
  };
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };
  const write = (events) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
      return true;
    } catch {
      return false;
    }
  };
  const cleanMetadata = (value = {}) => {
    const output = {};
    if (Number.isInteger(value.result_count)) output.result_count = Math.max(0, Math.min(20, value.result_count));
    if (Array.isArray(value.result_pattern_ids)) output.result_pattern_ids = value.result_pattern_ids.filter((id) => /^[A-Z0-9_-]+$/.test(String(id))).slice(0, 10);
    if (["pattern", "contrast", "drill", "pack", "transfer", "export", "other"].includes(value.target_type)) output.target_type = value.target_type;
    if (value.target_id) output.target_id = String(value.target_id).slice(0, 160);
    if (["json", "csv", "tsv"].includes(value.format)) output.format = value.format;
    if (["en-de", "de-en"].includes(value.direction)) output.direction = value.direction;
    return output;
  };
  const record = (eventName, details = {}) => {
    if (!allowedNames.has(eventName)) return false;
    const event = {
      schema_version: 1,
      event_id: uuid(),
      event_name: eventName,
      occurred_at: new Date().toISOString(),
      session_id: sessionId(),
      locale: locale(),
      page: location.pathname,
      surface: surface(),
      object_type: ["pattern", "contrast", "drill", "pack", "transfer", "export", "none"].includes(details.object_type) ? details.object_type : "none",
      object_id: details.object_id ? String(details.object_id).slice(0, 160) : "",
      metadata: cleanMetadata(details.metadata),
    };
    const events = read();
    events.push(event);
    const stored = write(events);
    if (stored) window.dispatchEvent(new CustomEvent("metkagram:learning-event", { detail: event }));
    return stored;
  };
  const clear = () => localStorage.removeItem(STORAGE_KEY);
  const exportBundle = () => ({
    schema_version: 1,
    exported_at: new Date().toISOString(),
    source: "Metkagram local learning activity",
    privacy: "Stored locally in this browser and exported only by explicit user action. No raw learner text is recorded.",
    events: read(),
  });

  window.MetkagramLearningEvents = { storageKey: STORAGE_KEY, read, record, clear, exportBundle };

  const parseTarget = (href = "") => {
    let url;
    try { url = new URL(href, location.origin); } catch { return null; }
    if (url.origin !== location.origin) return null;
    const path = url.pathname;
    let match = path.match(/^\/(?:en|ru)\/practice\/([^/]+)\//);
    if (match) return { type: "pattern", id: match[1].toUpperCase() };
    match = path.match(/^\/(?:en|ru)\/contrasts\/([^/]+)\//);
    if (match) return { type: "contrast", id: match[1] };
    match = path.match(/^\/(?:en|ru)\/packs\/([^/]+)\//);
    if (match) return { type: "pack", id: match[1] };
    if (path.includes("/clinic/")) return { type: "drill", id: url.hash.replace(/^#/, "") || "clinic" };
    if (path.includes("/transfer/")) return { type: "transfer", id: "cross-language-transfer" };
    if (path.includes("/exports/") || /\.(json|csv|tsv)$/.test(path)) return { type: "export", id: path.split("/").filter(Boolean).pop() || "export" };
    return null;
  };

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest?.("a[href]");
    if (!anchor) return;
    const target = parseTarget(anchor.getAttribute("href"));
    if (!target) return;
    const currentSurface = surface();
    const packMatch = location.pathname.match(/^\/(?:en|ru)\/packs\/([^/]+)\//);
    const exportFormat = anchor.getAttribute("href")?.match(/\.(json|csv|tsv)(?:$|[?#])/i)?.[1]?.toLowerCase();
    if (exportFormat) {
      record("export_download", { object_type: "export", object_id: target.id, metadata: { target_type: target.type, target_id: target.id, format: exportFormat } });
    } else if (currentSurface === "pack" && packMatch) {
      record("pack_step_open", { object_type: "pack", object_id: packMatch[1], metadata: { target_type: target.type, target_id: target.id } });
    } else {
      record("learning_object_open", { object_type: target.type, object_id: target.id, metadata: { target_type: target.type, target_id: target.id } });
    }
  }, { capture: true });

  document.addEventListener("toggle", (event) => {
    if (!(event.target instanceof HTMLDetailsElement) || !event.target.open) return;
    if (surface() === "clinic") {
      const id = event.target.closest("[id]")?.id || location.hash.replace(/^#/, "") || "clinic";
      record("clinic_feedback_reveal", { object_type: "drill", object_id: id });
    }
    if (surface() === "transfer") {
      const direction = event.target.textContent?.includes("Deutsch → English") ? "de-en" : "en-de";
      record("transfer_feedback_reveal", { object_type: "transfer", object_id: "cross-language-transfer", metadata: { direction } });
    }
  }, { capture: true });

  const lensForm = document.querySelector("[data-lens-form]");
  if (lensForm) {
    lensForm.addEventListener("submit", () => {
      setTimeout(() => {
        const ids = [...document.querySelectorAll("[data-lens-results] .lens-card-meta code")].map((node) => node.textContent.trim()).filter(Boolean).slice(0, 10);
        record("lens_analyze", { object_type: "none", metadata: { result_count: ids.length, result_pattern_ids: ids } });
      }, 0);
    });
  }
})();
