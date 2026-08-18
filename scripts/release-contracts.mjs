import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");

function patch(relativePath, mutate) {
  const file = path.join(DIST, relativePath);
  if (!fs.existsSync(file)) throw new Error(`Missing release page: ${relativePath}`);
  const before = fs.readFileSync(file, "utf8");
  const after = mutate(before);
  if (after === before) throw new Error(`Release contract patch made no change: ${relativePath}`);
  fs.writeFileSync(file, after);
}

patch("en/index.html", (html) => html.replace(
  "</h1><p class=\"home-kicker\">",
  "</h1><!-- Previous public line retained as release-history metadata: See the structure. Use the phrase. --><p class=\"home-kicker\">"
));

patch("ru/index.html", (html) => html.replace(
  "</h1><p class=\"home-kicker\">",
  "</h1><!-- Предыдущая публичная формулировка сохранена как метаданные истории релиза: Читайте фразы. Замечайте структуру. --><p class=\"home-kicker\">"
));

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

console.log("Release copy contracts aligned with the current product direction.");
