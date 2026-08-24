import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { SITE_RELEASE_DATE, SITE_URL } from "./site.mjs";

export const ATTRIBUTION = {
  source: "Metkagram",
  source_url: SITE_URL,
  source_repository: "https://github.com/metkagram/metkagram.github.io",
  creator: "Metkagram",
  creator_url: "https://github.com/metkagram",
  maintainer: "Applied Systems Lab at MetalHatsCats",
  maintainer_url: "https://metalhatscats.com",
  license: "Metkagram Source-Available Terms",
  license_url: `${SITE_URL}/en/licensing/`,
  rights_status: "source-available-not-open-source",
  rights_url: `${SITE_URL}/rights.json`,
  historical_license: "CC BY-NC 4.0 before 2026-08-17; prior grants remain valid for copies received under those terms",
  attribution_required: true,
  attribution_text: "Source: Metkagram — https://metkagram.github.io/",
  attribution_html: 'Source: <a href="https://metkagram.github.io/">Metkagram</a>',
  terms_url: `${SITE_URL}/en/licensing/`,
  privacy_url: `${SITE_URL}/en/legal/privacy/`,
  contact_email: "metalhatscats@gmail.com",
  contact_url: "https://www.linkedin.com/company/metalhatscats",
  collaboration_url: `${SITE_URL}/en/licensing/`,
};

const DATA_ROOT = fileURLToPath(new URL("../data/", import.meta.url));
let cachedDatasetVersion;

export function getProductVersion() {
  try {
    return JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8")).version || "1.0.0";
  } catch {
    return "1.0.0";
  }
}

function canonicalDataFiles(directory = DATA_ROOT) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return canonicalDataFiles(target);
      if (!entry.isFile() || (!entry.name.endsWith(".json") && !entry.name.endsWith(".json.gz"))) return [];
      return [target];
    });
}

function datasetFingerprint() {
  const hash = crypto.createHash("sha256");
  for (const file of canonicalDataFiles()) {
    const relative = path.relative(DATA_ROOT, file).replaceAll(path.sep, "/");
    const bytes = fs.readFileSync(file);
    hash.update(relative);
    hash.update("\0");
    hash.update(file.endsWith(".gz") ? zlib.gunzipSync(bytes) : bytes);
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 12);
}

export function getDatasetVersion() {
  if (!cachedDatasetVersion) cachedDatasetVersion = `${getProductVersion()}+${datasetFingerprint()}`;
  return cachedDatasetVersion;
}

export function getReleaseDate() {
  return SITE_RELEASE_DATE;
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
