import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
export const METHOD_GUIDE_LOCALES = ["en", "ru"];
export const METHOD_GUIDE_COUNT = 40;
export const METHOD_GUIDE_CATEGORIES = ["foundations", "learning-science", "practice", "transfer", "comparisons"];

function fail(message) {
  throw new Error(`Method guide validation failed: ${message}`);
}

function words(value = "") {
  return String(value).trim().split(/\s+/u).filter(Boolean).length;
}

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
}

export function loadMethodGuideSources() {
  const sources = readJson("data/method-guide-sources.json");
  if (!Array.isArray(sources) || !sources.length) fail("data/method-guide-sources.json must contain a non-empty array");
  const ids = new Set();
  for (const source of sources) {
    if (!source?.id || typeof source.id !== "string") fail("every research source needs an id");
    if (ids.has(source.id)) fail(`duplicate source id ${source.id}`);
    ids.add(source.id);
    if (!source.title || !source.url || !/^https?:\/\//.test(source.url)) fail(`${source.id} needs title and absolute URL`);
    if (!source.authors || !source.year) fail(`${source.id} needs authors and year`);
  }
  return sources;
}

export function loadMethodGuides() {
  const directory = path.join(ROOT, "data", "method-guides");
  if (!fs.existsSync(directory)) fail("data/method-guides is missing");
  const names = fs.readdirSync(directory).filter((name) => name.endsWith(".json")).sort();
  if (!names.length) fail("data/method-guides contains no JSON files");
  const guides = names.flatMap((name) => {
    const value = JSON.parse(fs.readFileSync(path.join(directory, name), "utf8"));
    if (!Array.isArray(value)) fail(`${name} must contain an array`);
    return value;
  });
  const sources = loadMethodGuideSources();
  validateMethodGuides(guides, sources);
  return { guides, sources };
}

export function validateMethodGuides(guides, sources) {
  if (guides.length !== METHOD_GUIDE_COUNT) fail(`expected ${METHOD_GUIDE_COUNT} editorial concepts, found ${guides.length}`);
  const sourceIds = new Set(sources.map((source) => source.id));
  const ids = new Set();
  const slugs = new Set();
  const localizedTitles = new Set();

  for (const guide of guides) {
    if (!guide?.id || !/^[a-z0-9-]+$/.test(guide.id)) fail("every guide needs a stable lowercase id");
    if (ids.has(guide.id)) fail(`duplicate guide id ${guide.id}`);
    ids.add(guide.id);
    if (!guide.slug || !/^[a-z0-9-]+$/.test(guide.slug)) fail(`${guide.id} needs a URL-safe slug`);
    if (slugs.has(guide.slug)) fail(`duplicate guide slug ${guide.slug}`);
    slugs.add(guide.slug);
    if (!METHOD_GUIDE_CATEGORIES.includes(guide.category)) fail(`${guide.id} has unsupported category ${guide.category}`);
    if (!Array.isArray(guide.source_ids) || !guide.source_ids.length) fail(`${guide.id} needs at least one evidence/source reference`);
    for (const sourceId of guide.source_ids) if (!sourceIds.has(sourceId)) fail(`${guide.id} references unknown source ${sourceId}`);
    if (!Array.isArray(guide.related) || guide.related.length < 2 || guide.related.length > 5) fail(`${guide.id} needs 2–5 related guide ids`);

    for (const locale of METHOD_GUIDE_LOCALES) {
      const copy = guide.locales?.[locale];
      if (!copy) fail(`${guide.id} is missing ${locale} localization`);
      if (!copy.title || copy.title.length < 18 || copy.title.length > 82) fail(`${guide.id}/${locale} title length is outside 18–82 characters`);
      const titleKey = `${locale}:${copy.title.toLocaleLowerCase()}`;
      if (localizedTitles.has(titleKey)) fail(`${guide.id}/${locale} duplicates another title`);
      localizedTitles.add(titleKey);
      if (!copy.description || copy.description.length < 70 || copy.description.length > 190) fail(`${guide.id}/${locale} description length is outside 70–190 characters`);
      if (!copy.intro || words(copy.intro) < 35) fail(`${guide.id}/${locale} intro is too thin`);
      if (!Array.isArray(copy.sections) || copy.sections.length < 3 || copy.sections.length > 6) fail(`${guide.id}/${locale} needs 3–6 sections`);
      const bodyText = [copy.intro, ...copy.sections.flatMap((section) => [section.heading, ...(section.paragraphs || []), ...(section.bullets || []), section.example || ""]), copy.takeaway || ""].join(" ");
      if (words(bodyText) < 220) fail(`${guide.id}/${locale} needs at least 220 words of localized editorial content`);
      for (const [index, section] of copy.sections.entries()) {
        if (!section?.heading || !Array.isArray(section.paragraphs) || !section.paragraphs.length) fail(`${guide.id}/${locale} section ${index + 1} needs heading and paragraphs`);
      }
      if (!copy.takeaway || words(copy.takeaway) < 18) fail(`${guide.id}/${locale} takeaway is too short`);
    }
  }

  for (const guide of guides) {
    for (const relatedId of guide.related) {
      if (relatedId === guide.id) fail(`${guide.id} cannot relate to itself`);
      if (!ids.has(relatedId)) fail(`${guide.id} references unknown related guide ${relatedId}`);
    }
  }

  return true;
}
