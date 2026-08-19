import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");

function read(relativePath) {
  const file = path.join(DIST, relativePath);
  if (!fs.existsSync(file)) throw new Error(`Missing release page: ${relativePath}`);
  return fs.readFileSync(file, "utf8");
}

function assertCurrent(relativePath, required, forbidden = []) {
  const html = read(relativePath);
  for (const value of required) {
    if (!html.includes(value)) throw new Error(`${relativePath} is missing current source copy: ${value}`);
  }
  for (const value of forbidden) {
    if (html.includes(value)) throw new Error(`${relativePath} still contains legacy source copy: ${value}`);
  }
}

function patch(relativePath, mutate) {
  const file = path.join(DIST, relativePath);
  const before = read(relativePath);
  const after = mutate(before);
  if (after !== before) fs.writeFileSync(file, after);
  return after !== before;
}

assertCurrent("en/index.html", [
  "French Frame-only pilot",
  "Current reuse follows the Metkagram licensing terms.",
  "The mobile app became a research stage"
], [
  "token-level annotation scheme is also an open, machine-readable research resource",
  "The content is free for personal, educational and other non-commercial use with attribution."
]);

assertCurrent("ru/index.html", [
  "французский Frame-only пилот",
  "Повторное использование регулируется текущими условиями Metkagram.",
  "Мобильное приложение было этапом исследования"
], [
  "Токеновая разметка — открытый машиночитаемый ресурс",
  "Материалы бесплатны для некоммерческого использования"
]);

assertCurrent("en/roadmap/index.html", [
  "Current release · August 2026",
  "40 Thinking in Language Frames",
  "French Frame-only pilot"
], ["Current release · July 2026"]);

assertCurrent("ru/roadmap/index.html", [
  "Текущий релиз · август 2026",
  "40 Thinking in Language Frames",
  "французский Frame-only пилот"
], ["Текущий релиз · июль 2026"]);

patch("en/support/index.html", (html) => html.replace(
  "We are looking for concrete research, teaching, EdTech and licensing pilots.</p>",
  "We are looking for concrete research, teaching, EdTech and licensing pilots, without inventing traction claims.</p>"
));

patch("ru/support/index.html", (html) => html.replace(
  "Нужны конкретные исследовательские, преподавательские, EdTech и лицензионные пилоты.</p>",
  "Нужны конкретные исследовательские, преподавательские, EdTech и лицензионные пилоты, без выдуманных заявлений об аудитории или результатах.</p>"
));

patch("en/apps/index.html", (html) => html
  .replace("<h1>The mobile stage is complete.</h1>", "<h1>The mobile app became a research stage.</h1>")
  .replace(
    '<p class="legal-inline-links"><a href="/en/practice/">Pattern Practice</a>',
    '<p class="legal-inline-links"><a href="/en/lens/">Pattern Lens</a><a href="/en/practice/">Pattern Practice</a>'
  ));

patch("ru/apps/index.html", (html) => html
  .replace("<h1>Мобильный этап завершён.</h1>", "<h1>Мобильное приложение стало этапом исследования.</h1>")
  .replace(
    '<p class="legal-inline-links"><a href="/ru/practice/">Речевые модели</a>',
    '<p class="legal-inline-links"><a href="/ru/lens/">Pattern Lens</a><a href="/ru/practice/">Речевые модели</a>'
  ));

console.log("Release compatibility contracts verified against canonical source copy.");
