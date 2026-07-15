import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { SITE_URL } from "./site.mjs";

export const ATTRIBUTION = {
  source: "Metkagram",
  source_url: SITE_URL,
  source_repository: "https://github.com/metkagram/metkagram.github.io",
  creator: "Metkagram",
  creator_url: "https://github.com/metkagram",
  maintainer: "Applied Systems Lab at MetalHatsCats",
  maintainer_url: "https://metalhatscats.com",
  license: "CC BY-NC 4.0",
  license_url: "https://creativecommons.org/licenses/by-nc/4.0/",
  attribution_required: true,
  attribution_text: "Source: Metkagram — https://metkagram.github.io/",
  attribution_html: 'Source: <a href="https://metkagram.github.io/">Metkagram</a>',
  terms_url: `${SITE_URL}/en/legal/terms/`,
  privacy_url: `${SITE_URL}/en/legal/privacy/`,
  contact_url: "https://metalhatscats.com/contact",
  collaboration_url: `${SITE_URL}/en/ai/#collaborate`,
};

function readPackageVersion() {
  try {
    return JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

export function getDatasetVersion(buildDate = new Date().toISOString().slice(0, 10)) {
  return `${readPackageVersion()}+${buildDate.replace(/-/g, "")}`;
}

export function getReleaseDate() {
  return new Date().toISOString().slice(0, 10);
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])])
    );
  }
  return value;
}

export function stableHash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(sortKeys(value))).digest("hex");
}

export function provenance({ canonical_url, record_type, record_id, content_hash, extra = {} } = {}) {
  return {
    ...ATTRIBUTION,
    dataset_version: getDatasetVersion(),
    release_date: getReleaseDate(),
    canonical_url,
    record_type,
    record_id,
    content_hash,
    ...extra,
  };
}

export function wrapRecord(record, { canonical_url, record_type, record_id }) {
  const hash = stableHash(record);
  return {
    provenance: provenance({ canonical_url, record_type, record_id, content_hash: hash }),
    data: record,
  };
}

export function wrapList(items, { canonical_url, record_type, pagination = null }) {
  const hash = stableHash(items);
  const response = {
    provenance: provenance({ canonical_url, record_type, content_hash: hash }),
    data: items,
  };
  if (pagination) response.pagination = pagination;
  return response;
}
