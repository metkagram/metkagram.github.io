import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "./site.mjs";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_FILE = path.join(MODULE_DIR, "..", "data", "seo-slugs.json");
const registry = fs.existsSync(REGISTRY_FILE)
  ? JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8"))
  : { studySets: {}, patterns: {} };

export function seoSlug(value = "") {
  return String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replaceAll("&", " and ")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .replaceAll(/-{2,}/g, "-");
}

export function compactSeoSlug(value = "", maxLength = 48) {
  const slug = seoSlug(value);
  if (slug.length <= maxLength) return slug;
  const clipped = slug.slice(0, maxLength + 1);
  const boundary = clipped.lastIndexOf("-");
  return clipped.slice(0, boundary >= Math.floor(maxLength * 0.6) ? boundary : maxLength).replace(/-+$/g, "");
}

export function generatedPatternSlugCore(pattern) {
  const english = pattern.langs?.find((item) => item.lang === "en") || pattern.langs?.[0] || {};
  const formula = String(english.formula || pattern.formulas?.[0] || pattern.title_ru || pattern.id)
    .replace(/\s+\[[^\]]{20,}\]\s*$/u, "")
    .replace(/\bV3\b/g, "past participle")
    .replace(/\bV\b/g, "verb")
    .replace(/\bsth\b/gi, "something")
    .replace(/\bsb\b/gi, "someone");
  return compactSeoSlug(formula, 48) || seoSlug(pattern.id);
}

function idOf(value) {
  return typeof value === "string" ? value : value?.id;
}

function registeredSlug(section, value) {
  const id = idOf(value);
  const slug = registry?.[section]?.[id];
  if (!id || !slug) throw new Error(`Missing ${section} SEO slug for ${id || "unknown record"} in ${REGISTRY_FILE}`);
  if (slug !== seoSlug(slug)) throw new Error(`Invalid ${section} SEO slug for ${id}: ${slug}`);
  return slug;
}

export function studySetSlug(set) {
  return registeredSlug("studySets", set);
}

export function studySetPath(locale, set) {
  return `/${locale}/practice/sets/${studySetSlug(set)}/`;
}

export function legacyStudySetPath(locale, set) {
  return `/${locale}/practice/set/${set.id.toLowerCase()}/`;
}

export function studySetUrl(locale, set) {
  return `${SITE_URL}${studySetPath(locale, set)}`;
}

export function patternSlug(pattern) {
  const id = idOf(pattern).toLowerCase();
  return `${registeredSlug("patterns", pattern)}-${id}`;
}

export function patternPath(locale, pattern) {
  return `/${locale}/practice/patterns/${patternSlug(pattern)}/`;
}

export function legacyPatternPath(locale, pattern) {
  return `/${locale}/practice/${idOf(pattern).toLowerCase()}/`;
}

export function patternUrl(locale, pattern) {
  return `${SITE_URL}${patternPath(locale, pattern)}`;
}
