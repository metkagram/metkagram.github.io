import fs from "node:fs";
import { escapeHtml } from "./render.mjs";
import { patternPath } from "./seo-slugs.mjs";

export const workplacePractice = JSON.parse(fs.readFileSync(new URL("../data/workplace-practice.json", import.meta.url), "utf8"));

export function validateWorkplacePractice(source, patterns) {
  const byId = new Map(patterns.map((pattern) => [pattern.id, pattern]));
  if (source.schemaVersion !== 1 || source.target_language !== "en" || source.review_status !== "editorial-pilot" || source.independent_language_review !== "pending") throw new Error("Workplace practice must retain its explicit English pilot scope");
  if (!Array.isArray(source.steps) || source.steps.length !== 5) throw new Error("Workplace practice needs five steps");
  for (const key of ["title", "scenario", "transfer"]) for (const locale of ["en", "ru"]) if (!source[`${key}_${locale}`]?.trim()) throw new Error(`Missing workplace practice ${key}_${locale}`);
  for (const step of source.steps) {
    if (!byId.get(step.pattern_id)?.langs.some((language) => language.lang === source.target_language)) throw new Error(`Unknown workplace practice English pattern ${step.pattern_id}`);
    for (const field of ["title_en", "title_ru", "prompt_en", "prompt_ru", "example_en", "check_en", "check_ru"]) if (!step[field]?.trim()) throw new Error(`Missing workplace practice ${field}`);
  }
}

export function workplacePracticeSection(locale, setId) {
  const source = workplacePractice;
  if (source.set_id !== setId) return "";
  const ru = locale === "ru";
  const steps = source.steps.map((step, index) => `<li class="workplace-practice-step"><h3>${index + 1}. ${escapeHtml(step[`title_${locale}`])}</h3><p>${escapeHtml(step[`prompt_${locale}`])}</p><a href="${patternPath(locale, step.pattern_id)}">${ru ? "Посмотреть каркас" : "View the frame"} →</a><details><summary>${ru ? "Сравнить с примером после своего ответа" : "Compare with an example after answering"}</summary><p lang="en">${escapeHtml(step.example_en)}</p><p>${escapeHtml(step[`check_${locale}`])}</p></details></li>`).join("");
  return `<section id="workplace-practice" class="section-pad ruled"><p class="eyebrow">${ru ? "Пробный практикум · английский · около 15 минут" : "Practice pilot · English · about 15 minutes"}</p><h2>${escapeHtml(source[`title_${locale}`])}</h2><p>${escapeHtml(source[`scenario_${locale}`])}</p><p>${ru ? "Сначала ответьте вслух или запишите свою фразу. Затем откройте пример и проверьте смысл и форму. Возможны разные хорошие ответы." : "First say your answer aloud or write it down. Then open the example and check meaning and form. More than one answer can work."}</p><ol class="workplace-practice-steps">${steps}</ol><h3>${ru ? "Новая ситуация — без подсказки" : "A new situation — without a prompt"}</h3><p>${escapeHtml(source[`transfer_${locale}`])}</p><p>${ru ? "Для работы с преподавателем: попросите обратную связь по ясности мысли, выбору конструкции и грамматике. Этот практикум не выставляет оценку владению языком." : "With a teacher: ask for feedback on clarity, choice of frame, and grammar. This practice does not assign a language proficiency score."}</p></section>`;
}
