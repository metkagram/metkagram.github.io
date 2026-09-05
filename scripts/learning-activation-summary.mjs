import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIST = path.join(process.cwd(), "dist");

function patchActivityPage(locale) {
  const file = path.join(DIST, locale, "activity", "index.html");
  if (!fs.existsSync(file)) throw new Error(`Missing Local activity page: ${file}`);
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(
    '<script src="/assets/learning-activity.js"></script>',
    '<script type="module" src="/assets/learning-activity.js"></script>',
  );
  if (!html.includes('data-activation-pilot-note')) {
    const note = locale === "ru"
      ? "Для пользовательского пилота можно отдельно экспортировать только агрегированный Lens activation summary: без текста, event ID, session ID и object ID. Полезность совпадения и добровольный возврат всё равно требуют отдельного ответа участника."
      : "For the user pilot you can export a separate aggregate Lens activation summary with no learner text, event IDs, session IDs or object IDs. Match usefulness and voluntary return still require separate participant evidence.";
    html = html.replace(
      '<div data-learning-activity></div>',
      `<div data-learning-activity></div><p class="activity-note" data-activation-pilot-note>${note}</p>`,
    );
  }
  fs.writeFileSync(file, html);
}

export function buildLearningActivationSummary() {
  for (const locale of ["en", "ru"]) patchActivityPage(locale);
  console.log("Lens activation summary wired into Local activity with aggregate-only export semantics.");
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) buildLearningActivationSummary();
