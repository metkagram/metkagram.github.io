import fs from "node:fs";
import path from "node:path";
import { loadContent } from "../src/content.mjs";
import { REVIEWED_STARTER_SET_IDS, resolveEditorialReadiness } from "../src/editorial-readiness.mjs";
import { ATTRIBUTION, wrapRecord } from "../src/provenance.mjs";
import { SITE_URL } from "../src/site.mjs";
import { studySetPath } from "../src/seo-slugs.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const API_URL = `${SITE_URL}/api/v1`;
const tiers = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "quality", "editorial-tiers.json"), "utf8"));
const content = loadContent();
const resolved = resolveEditorialReadiness({ tiers, studySets: content.studySets.sets });

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function writeFile(relative, contents) {
  const file = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

function writeJson(relative, value) {
  writeFile(relative, `${JSON.stringify(value, null, 2)}\n`);
}

function patch(relative, mutate) {
  const file = path.join(DIST, relative);
  if (!fs.existsSync(file)) throw new Error(`Reviewed discovery expected ${relative}`);
  const before = fs.readFileSync(file, "utf8");
  const after = mutate(before);
  if (after !== before) fs.writeFileSync(file, after);
}

function patchJson(relative, mutate) {
  patch(relative, (text) => {
    const value = JSON.parse(text);
    mutate(value);
    return `${JSON.stringify(value, null, 2)}\n`;
  });
}

function publicRecord(record) {
  const set = record.set;
  return {
    set_id: record.set_id,
    title_en: set.title_en,
    title_ru: set.title_ru,
    tier: record.tier,
    readiness: record.label,
    starter_eligible: record.starter_eligible,
    featured_start: record.featured_start,
    canonical_en: `${SITE_URL}${studySetPath("en", set)}`,
    canonical_ru: `${SITE_URL}${studySetPath("ru", set)}`,
  };
}

const publication = {
  schemaVersion: 1,
  status: "editorial-readiness",
  reviewedOn: resolved.reviewedOn,
  purpose: resolved.purpose,
  evidenceBoundary: "Editorial readiness describes review state and publication suitability. It is not a learning-efficacy score and does not rank learners or outcomes.",
  starterPolicy: {
    allowed_tiers: ["A", "B"],
    featured_set_ids: [...REVIEWED_STARTER_SET_IDS],
    route_surface_en: `${SITE_URL}/en/packs/`,
    route_surface_ru: `${SITE_URL}/ru/packs/`,
    rule: "Only explicit Tier A/B sets may enter the reviewed starter surface. Tier C remains reference material; Tier D remains remediation-priority until its source tier changes.",
  },
  tiers: resolved.tiers,
  sets: resolved.sets.map(publicRecord),
  rights: {
    rights_status: ATTRIBUTION.rights_status,
    rights_url: ATTRIBUTION.rights_url,
    license_url: ATTRIBUTION.license_url,
    attribution_required: ATTRIBUTION.attribution_required,
    attribution_text: ATTRIBUTION.attribution_text,
  },
};

writeJson("data/editorial-readiness.json", publication);
writeJson("api/v1/editorial-readiness.json", wrapRecord(publication, {
  canonical_url: `${API_URL}/editorial-readiness.json`,
  record_type: "editorial_readiness",
  record_id: "metkagram-editorial-readiness",
}));

function reviewedSection(locale) {
  const ru = locale === "ru";
  const route = ru
    ? {
        eyebrow: "Проверенный маршрут",
        title: "Pattern Routes",
        body: "Идите не по отдельным карточкам, а по короткой последовательности: Frame → Contrast → Choice вокруг одной коммуникативной задачи.",
        cta: "Открыть маршруты →",
      }
    : {
        eyebrow: "Reviewed route",
        title: "Pattern Routes",
        body: "Follow a short sequence of Frame → Contrast → Choice around one communicative job instead of collecting isolated cards.",
        cta: "Open Routes →",
      };
  const copy = ru
    ? {
        eyebrow: "Проверенные точки старта",
        title: "Начните с проверенного маршрута или набора.",
        lede: "Полный каталог ниже сохраняется для покрытия и стабильных ID. Если вы здесь впервые, начните с этих материалов: у них самый сильный текущий сигнал редакционной готовности.",
        browse: "Просмотреть весь справочный каталог ↓",
        A: "Проверенное ядро",
        B: "Практика с проверкой качества",
        open: "Открыть набор →",
      }
    : {
        eyebrow: "Reviewed starting points",
        title: "Start with a reviewed Route or set.",
        lede: "The complete catalogue remains below for coverage and stable IDs. If you are new, start here: these materials have the strongest current editorial-readiness signal.",
        browse: "Browse the complete reference catalogue ↓",
        A: "Reviewed core",
        B: "Quality-gated practice",
        open: "Open set →",
      };

  const starterCards = resolved.starters.map((record) => {
    const set = record.set;
    const title = ru ? set.title_ru : set.title_en;
    const description = ru ? set.description_ru : set.description;
    return `<article class="pattern-reader" data-reviewed-starter-set="${escapeHtml(set.id)}" data-editorial-tier="${record.tier}"><p class="eyebrow">${escapeHtml(copy[record.tier])}</p><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p><a href="${studySetPath(locale, set)}">${copy.open}</a></article>`;
  }).join("");

  return `<section class="section-pad ruled" data-reviewed-discovery aria-labelledby="reviewed-start-title"><p class="eyebrow">${copy.eyebrow}</p><h2 id="reviewed-start-title">${copy.title}</h2><p class="lede">${copy.lede}</p><div class="pattern-comparison-list"><article class="pattern-reader" data-reviewed-route-start><p class="eyebrow">${route.eyebrow}</p><h3>${route.title}</h3><p>${route.body}</p><a href="/${locale}/packs/">${route.cta}</a></article>${starterCards}</div><p><a href="#all-patterns">${copy.browse}</a></p></section>`;
}

for (const locale of ["en", "ru"]) {
  patch(`${locale}/practice/index.html`, (html) => {
    if (html.includes("data-reviewed-discovery")) return html;
    const marker = /<section\b[^>]*\bid="all-patterns"[^>]*>/i;
    if (!marker.test(html)) throw new Error(`${locale} Practice page has no #all-patterns catalogue marker`);
    return html.replace(marker, (match) => `${reviewedSection(locale)}${match}`);
  });
}

patchJson("api/v1/index.json", (value) => {
  const root = value.data && typeof value.data === "object" ? value.data : value;
  root.counts = {
    ...(root.counts || {}),
    editorialReadinessSets: publication.sets.length,
    reviewedStarterSets: publication.starterPolicy.featured_set_ids.length,
  };
  root.endpoints ||= [];
  if (!root.endpoints.some((item) => item.path === "/editorial-readiness.json")) {
    root.endpoints.push({
      path: "/editorial-readiness.json",
      url: `${API_URL}/editorial-readiness.json`,
      type: "collection",
      description: "Editorial readiness tiers for every canonical study set plus the fail-closed reviewed starter policy",
    });
  }
  root.datasets ||= [];
  if (!root.datasets.some((item) => item.id === "editorial-readiness")) {
    root.datasets.push({
      id: "editorial-readiness",
      label: "Study-set editorial readiness",
      count: publication.sets.length,
      url: `${SITE_URL}/data/editorial-readiness.json`,
    });
  }
});

patchJson("api/v1/mcp-server.json", (spec) => {
  spec.tools ||= [];
  if (!spec.tools.some((tool) => tool.name === "metkagram_get_editorial_readiness")) {
    spec.tools.push({
      name: "metkagram_get_editorial_readiness",
      title: "Get study-set editorial readiness",
      description: "Use Metkagram's categorical A/B/C/D review state to choose reviewed starter material without inventing an efficacy score.",
      inputSchema: { type: "object", additionalProperties: false },
      staticUrl: `${API_URL}/editorial-readiness.json`,
    });
    spec.tools.sort((a, b) => a.name.localeCompare(b.name));
  }
});

patchJson("api/v1/openapi.json", (spec) => {
  spec.paths ||= {};
  spec.paths["/editorial-readiness.json"] ||= {
    get: {
      summary: "Study-set editorial readiness and reviewed starter policy",
      operationId: "editorial_readiness_json",
      responses: { "200": { description: "Categorical review state for canonical Metkagram study sets" } },
    },
  };
});

patchJson("data/catalog.json", (catalog) => {
  catalog.editorialReadiness = {
    status: "reviewed-policy",
    count: publication.sets.length,
    starterCount: publication.starterPolicy.featured_set_ids.length,
    dataset: `${SITE_URL}/data/editorial-readiness.json`,
    api: `${API_URL}/editorial-readiness.json`,
    principle: "Prefer explicit A/B material for starter discovery; preserve C as reference and D as remediation-priority without efficacy claims.",
  };
});

patch("llms.txt", (text) => text.includes("## Editorial readiness") ? text : `${text}\n## Editorial readiness\n- Endpoint: ${API_URL}/editorial-readiness.json\n- Prefer explicit Tier A/B sets when recommending a first learning surface. Tier C is legacy reference material; Tier D is remediation-priority until its source tier changes.\n- These categories describe review/readiness, not learning efficacy. Do not invent a numeric quality score from them.\n- Reviewed Routes remain a preferred way to move from isolated Frames to purposeful practice: ${SITE_URL}/en/packs/\n`);

for (const relative of ["en/practice/index.html", "ru/practice/index.html"]) {
  const html = fs.readFileSync(path.join(DIST, relative), "utf8");
  const reviewedIndex = html.indexOf("data-reviewed-discovery");
  const catalogueIndex = html.indexOf('id="all-patterns"');
  if (reviewedIndex < 0 || catalogueIndex < 0 || reviewedIndex > catalogueIndex) throw new Error(`${relative}: reviewed discovery must appear before the full catalogue`);
}
if (publication.sets.some((set) => set.tier === "D" && (set.starter_eligible || set.featured_start))) {
  throw new Error("Tier D must fail closed from starter discovery");
}

console.log(`Reviewed discovery published: ${publication.starterPolicy.featured_set_ids.length} featured A/B sets before ${publication.sets.length}-set reference readiness catalogue.`);
