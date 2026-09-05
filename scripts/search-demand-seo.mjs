import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { studySetPath, studySetSlug } from "../src/seo-slugs.mjs";
import { SITE_RELEASE_DATE } from "../src/site.mjs";

const DIST = path.join(process.cwd(), "dist");
const read = (p) => fs.readFileSync(path.join(DIST, p), "utf8");
const write = (p, value) => fs.writeFileSync(path.join(DIST, p), value);
const esc = (v = "") => String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const DEMAND = {
  CGR: ["Advanced English Grammar Patterns: Contrast and Choice", "Practise easily confused B2–C1 English grammar patterns through meaning, contrast and reusable sentence frames."],
  SPK: ["Spoken English Sentence Patterns for B2–C1", "Practise reusable spoken English sentence patterns for organising ideas naturally in conversation at B2–C1 level."],
  INT: ["English Conversation Patterns for Managing a Discussion", "Practise English conversation patterns for entering, holding, redirecting and closing a turn without losing the thread."],
  REG: ["Formal and Informal English: Register-Shifting Patterns", "Compare casual, neutral and professional English patterns for expressing the same communicative intent appropriately."],
  RTR: ["Common English Mistakes for Russian Speakers: Pattern Traps", "Practise recurring English sentence patterns that Russian speakers often transfer literally, with contrasts and corrections."],
  TRN: ["English Paraphrasing Patterns and Reformulation Practice", "Practise paraphrasing and reformulation by rebuilding the same meaning with different B2–C1 grammatical and discourse frames."],
  FRM: ["Problem-Framing Phrases in English for B2–C1", "Practise English phrases for defining, reframing and questioning a problem before proposing a solution."],
  UNC: ["English Phrases for Uncertainty, Evidence and Confidence", "Practise B2–C1 English patterns for separating evidence from assumptions, calibrating confidence and reasoning under uncertainty."],
  SYS: ["Systems-Thinking Phrases in English for B2–C1", "Practise English sentence patterns for explaining bottlenecks, second-order effects, feedback loops and recurring system problems."],
  DEC: ["Decision-Making and Trade-off Phrases in English", "Practise B2–C1 English phrases for comparing options, discussing trade-offs, delay costs and decision criteria."],
  CDG: ["Cause and Effect Phrases in Advanced English", "Practise advanced English patterns for distinguishing triggers from causes, explaining mechanisms and avoiding weak causal claims."],
  HYP: ["Hypothesis and Evidence Phrases in Academic English", "Practise B2–C1 English patterns for hypotheses, predictions, discriminating evidence and revising claims."],
  PST: ["English Phrases for Perspective Taking and Disagreement", "Practise English patterns for representing another viewpoint fairly, separating positions from interests and locating disagreement."],
  META: ["English Phrases for Reflection, Feedback and Learning", "Practise B2–C1 English patterns for reflecting on errors, feedback, recall and the next learning target."]
};

function replaceMeta(html, title, description) {
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} | Metkagram</title>`);
  for (const [pattern, value] of [
    [/meta name="description" content="[^"]*"/, `meta name="description" content="${esc(description)}"`],
    [/meta property="og:title" content="[^"]*"/, `meta property="og:title" content="${esc(title)} | Metkagram"`],
    [/meta property="og:description" content="[^"]*"/, `meta property="og:description" content="${esc(description)}"`],
    [/meta name="twitter:title" content="[^"]*"/, `meta name="twitter:title" content="${esc(title)} | Metkagram"`],
    [/meta name="twitter:description" content="[^"]*"/, `meta name="twitter:description" content="${esc(description)}"`]
  ]) html = html.replace(pattern, value);
  return html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (tag, payload) => {
    try {
      const data = JSON.parse(payload);
      if (typeof data?.["@id"] === "string" && data["@id"].endsWith("#webpage")) { data.name = `${title} | Metkagram`; data.description = description; }
      if (data?.["@type"] === "LearningResource") { data.name = title; data.description = description; }
      return `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
    } catch { return tag; }
  });
}

const content = loadContent();
const records = [];
for (const set of content.studySets.sets) {
  if (!DEMAND[set.id]) continue;
  const [title, description] = DEMAND[set.id];
  const relative = `en/practice/sets/${studySetSlug(set)}/index.html`;
  if (!fs.existsSync(path.join(DIST, relative))) throw new Error(`Missing search landing page ${relative}`);
  write(relative, replaceMeta(read(relative), title, description));
  records.push({ route: studySetPath("en", set), title: `${title} | Metkagram`, description });
}

let index = read("en/practice/index.html");
if (!index.includes('id="search-demand-clusters"')) {
  const links = content.studySets.sets.filter((set) => DEMAND[set.id]).map((set) => {
    const [title] = DEMAND[set.id];
    return `<a href="${studySetPath("en", set)}"><strong>${esc(title)}</strong><small>${esc(set.description)}</small></a>`;
  }).join("");
  const section = `<section id="search-demand-clusters" class="page-head section-pad compact ruled"><p class="eyebrow">Practice by goal</p><h2>English sentence patterns by communication task</h2><p>Choose a focused B2–C1 practice set when you know what you need to say: reframe a problem, hedge a claim, explain a cause, manage disagreement or compare trade-offs.</p></section><section class="document-index section-pad">${links}</section>`;
  index = index.replace('<section id="all-patterns"', `${section}<section id="all-patterns"`);
  write("en/practice/index.html", index);
}

const inventoryPath = "seo/site-pages.json";
const inventory = JSON.parse(read(inventoryPath));
const byRoute = new Map(records.map((r) => [r.route, r]));
for (const page of inventory.pages || []) {
  const record = byRoute.get(page.route);
  if (!record) continue;
  page.title = record.title;
  page.description = record.description;
  page.lastModified = SITE_RELEASE_DATE;
}
write(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);

for (const set of content.studySets.sets.filter((s) => DEMAND[s.id])) {
  const html = read(`en/practice/sets/${studySetSlug(set)}/index.html`);
  if (!html.includes(DEMAND[set.id][0])) throw new Error(`Search title missing for ${set.id}`);
}
if (!read("en/practice/index.html").includes('id="search-demand-clusters"')) throw new Error("Search-demand cluster navigation missing");
process.stdout.write(`Search-demand SEO: ${records.length} focused English landing pages enriched.\n`);
