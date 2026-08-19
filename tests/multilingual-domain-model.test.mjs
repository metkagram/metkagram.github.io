import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildDomainModel, frameId, moveId } from "../src/domain-model.mjs";
import { languageRegistry, normalizeTranslations } from "../src/language-registry.mjs";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");

const json = (...parts) => JSON.parse(fs.readFileSync(path.join(DIST, ...parts), "utf8"));
const sourceJson = (...parts) => JSON.parse(fs.readFileSync(path.join(ROOT, ...parts), "utf8"));
const html = (...parts) => fs.readFileSync(path.join(DIST, ...parts, "index.html"), "utf8");

test("published domain model separates Moves, Frames and reviewed Bridges", () => {
  const manifest = json("data", "domain", "index.json");
  const moves = json("data", "domain", "moves.json");
  const frames = json("data", "domain", "frames.json");
  const bridges = json("data", "domain", "bridges.json");
  const frameIds = new Set(frames.items.map((frame) => frame.id));
  const moveIds = new Set(moves.items.map((move) => move.id));

  assert.equal(manifest.modelVersion, "1.1.0");
  assert.equal(manifest.counts.moves, moves.count);
  assert.equal(manifest.counts.frames, frames.count);
  assert.equal(manifest.counts.bridges, bridges.count);
  assert.ok(moves.count > 0);
  assert.ok(frames.count > 0);
  assert.ok(bridges.count > 0);

  for (const move of moves.items) {
    assert.equal(move.kind, "move");
    assert.equal(move.language, null);
    assert.equal(move.language_independent, true);
  }

  for (const frame of frames.items) {
    assert.equal(frame.kind, "frame");
    assert.ok(languageRegistry[frame.language]?.roles.learning);
    assert.ok(frame.formula);
    assert.ok(frame.example);
    if (frame.move_id) assert.ok(moveIds.has(frame.move_id));
  }

  for (const bridge of bridges.items) {
    assert.equal(bridge.kind, "bridge");
    assert.equal(bridge.review_status, "reviewed");
    assert.equal(bridge.literal_equivalence, false);
    assert.notEqual(bridge.from_language, bridge.to_language);
    assert.ok(frameIds.has(bridge.from_frame_id));
    assert.ok(frameIds.has(bridge.to_frame_id));
  }
});

test("pattern compatibility index keeps stable pattern IDs while exposing language-specific Frame IDs", () => {
  const patterns = json("data", "advanced-patterns.json");
  const frames = json("data", "domain", "frames.json");
  const index = json("data", "domain", "pattern-index.json");
  const frenchPilot = sourceJson("data", "language-pilots", "french-v1.json");
  const expectedFrameCount = patterns.reduce((sum, pattern) => sum + (pattern.langs?.length || 0), 0) + frenchPilot.length;

  assert.equal(index.count, patterns.length);
  assert.equal(frames.count, expectedFrameCount);
  for (const pattern of patterns.slice(0, 100)) {
    const record = index.items.find((item) => item.pattern_id === pattern.id);
    assert.ok(record, `Missing pattern compatibility record for ${pattern.id}`);
    for (const language of pattern.langs || []) {
      assert.equal(record.frame_ids[language.lang], frameId(pattern.id, language.lang));
    }
    if (pattern.reasoning?.move) assert.equal(record.move_id, moveId(pattern.reasoning.move));
  }
  for (const pilot of frenchPilot) {
    const record = index.items.find((item) => item.pattern_id === pilot.pattern_id);
    assert.equal(record.frame_ids.fr, frameId(pilot.pattern_id, "fr"));
  }
});

test("a future learning language can have Frames before annotation or interface support", () => {
  const registry = {
    ...languageRegistry,
    es: {
      code: "es",
      slug: "spanish",
      nativeName: "Español",
      direction: "ltr",
      status: "pilot",
      roles: { interface: false, learning: true, translation: false, annotation: false },
    },
  };
  const patterns = [{
    id: "DEMO001",
    reasoning: { move: "Reframe" },
    langs: [
      { lang: "en", formula: "It is not [X]; it is [Y].", example: "It is not speed; it is clarity.", translation: "Дело не в скорости, а в ясности." },
      { lang: "es", formula: "No es [X], sino [Y].", example: "No es velocidad, sino claridad.", translation: "Дело не в скорости, а в ясности." },
    ],
  }];

  const withoutBridge = buildDomainModel(patterns, { registry, reviewedMappings: [] });
  assert.ok(withoutBridge.frames.some((frame) => frame.language === "es"));
  assert.equal(withoutBridge.bridges.length, 0);
  assert.equal(registry.es.roles.annotation, false);
  assert.equal(registry.es.roles.interface, false);

  const withBridge = buildDomainModel(patterns, {
    registry,
    reviewedMappings: [{
      pattern_id: "DEMO001",
      from_language: "en",
      to_language: "es",
      relation: "functional_near_equivalent",
      review_status: "reviewed",
      literal_equivalence: false,
      review_basis: "Reviewed bilingual example for the domain-model test.",
    }],
  });
  assert.equal(withBridge.bridges.length, 1);
  assert.equal(withBridge.bridges[0].from_language, "en");
  assert.equal(withBridge.bridges[0].to_language, "es");
});

test("French pilot proves Frame-only language support without pretending annotation or Bridges", () => {
  const source = sourceJson("data", "language-pilots", "french-v1.json");
  const frames = json("data", "domain", "frames.json");
  const bridges = json("data", "domain", "bridges.json");
  const pilots = json("data", "domain", "language-pilots.json");
  const frenchFrames = frames.items.filter((frame) => frame.language === "fr");

  assert.equal(source.length, 20);
  assert.equal(frenchFrames.length, 20);
  assert.equal(pilots.pilots.fr.frameCount, 20);
  assert.equal(pilots.pilots.fr.exampleCount, 60);
  assert.equal(pilots.pilots.fr.reviewedBridges, 0);
  assert.equal(languageRegistry.fr.status, "pilot");
  assert.equal(languageRegistry.fr.roles.learning, true);
  assert.equal(languageRegistry.fr.roles.annotation, false);
  assert.equal(languageRegistry.fr.roles.interface, false);
  assert.ok(frenchFrames.every((frame) => frame.source_kind === "language_extension"));
  assert.ok(frenchFrames.every((frame) => frame.source_status === "editorial_pilot"));
  assert.ok(frenchFrames.every((frame) => frame.review?.status === "internal_editorial"));
  assert.ok(frenchFrames.every((frame) => frame.translations.ru));
  assert.ok(bridges.items.every((bridge) => bridge.from_language !== "fr" && bridge.to_language !== "fr"));

  for (const locale of ["en", "ru"]) {
    const page = html(locale, "practice", "language", "french");
    assert.match(page, /French Frame pilot/);
    assert.equal((page.match(/data-french-pilot-frame=/g) || []).length, 20);
  }
});

test("translation maps absorb legacy Russian fields without making Russian a Frame language", () => {
  assert.deepEqual(normalizeTranslations({ translation_ru: "старый" }), { ru: "старый" });
  assert.deepEqual(normalizeTranslations({ translation: "ещё старый" }), { ru: "ещё старый" });
  assert.deepEqual(normalizeTranslations({ translations: { ru: "новый" }, translation_ru: "старый" }), { ru: "новый" });

  const frames = json("data", "domain", "frames.json");
  assert.ok(frames.items.some((frame) => frame.translations.ru));
  assert.ok(frames.items.every((frame) => frame.language !== "ru"));
});

test("domain model is exposed through API, MCP, discovery and human data pages", () => {
  const api = json("api", "v1", "domain-model.json");
  assert.equal(api.data.modelVersion, "1.1.0");

  const openapi = json("api", "v1", "openapi.json");
  for (const endpoint of ["/domain-model.json", "/moves.json", "/frames.json", "/bridges.json", "/language-pilots.json"]) {
    assert.ok(openapi.paths[endpoint], `Missing ${endpoint} from OpenAPI`);
  }

  const mcp = json("api", "v1", "mcp-server.json");
  for (const tool of ["metkagram_get_domain_model", "metkagram_get_moves", "metkagram_get_frames", "metkagram_get_bridges", "metkagram_get_language_pilots"]) {
    assert.ok(mcp.tools.some((item) => item.name === tool), `Missing MCP tool ${tool}`);
  }

  const discovery = json("data", "discovery.json");
  assert.ok(discovery.surfaces.some((surface) => surface.id === "multilingual-domain-model"));
  assert.ok(discovery.surfaces.some((surface) => surface.id === "french-frame-pilot"));
  for (const locale of ["en", "ru"]) {
    assert.match(html(locale, "ai"), /data-multilingual-domain-model/);
    assert.match(html(locale, "data"), /data-multilingual-domain-model/);
  }

  const llms = fs.readFileSync(path.join(DIST, "llms.txt"), "utf8");
  assert.match(llms, /## Multilingual domain model/);
  assert.match(llms, /A missing Bridge is meaningful/);
  assert.match(llms, /## French Frame pilot/);
  assert.match(llms, /French is learning=true, annotation=false, interface=false/);
});
