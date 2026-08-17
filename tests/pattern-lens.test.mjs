import test from "node:test";
import assert from "node:assert/strict";
import { extractLiteralSegments, rankPatterns, removeLegacyMobileApplicationSchema } from "../scripts/pattern-lens.mjs";

test("Pattern Lens extracts stable literal parts from a reusable formula", () => {
  const segments = extractLiteralSegments("It's not that [X]; it's that [Y].");
  assert.deepEqual(segments, ["It's not that", "it's that"]);
});

test("Pattern Lens ranks a matching learning pattern above an unrelated one", () => {
  const patterns = [
    {
      id: "MATCH",
      set_id: "TEST",
      group_id: "logic",
      reasoning: { move: "correct an assumption" },
      title_ru: "Correction",
      langs: [{ lang: "en", formula: "It's not that [X]; it's that [Y].", example: "It's not that the plan is bad; it's that it is too expensive.", translation: "", examples: [] }],
    },
    {
      id: "OTHER",
      set_id: "TEST",
      group_id: "logic",
      title_ru: "Other",
      langs: [{ lang: "en", formula: "The more [X], the more [Y].", example: "The more we test, the more we learn.", translation: "", examples: [] }],
    },
  ];
  const matches = rankPatterns(patterns, "It's not that the solution is wrong; it's that it doesn't scale.", "en");
  assert.equal(matches[0].id, "MATCH");
  assert.equal(matches[0].hits.length, 2);
});

test("Pattern Lens removes stale active mobile-app structured data", () => {
  const html = '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","name":"Metkagram"},{"@type":["MobileApplication","SoftwareApplication"],"name":"Metkagram"}]}</script>';
  const patched = removeLegacyMobileApplicationSchema(html);
  assert.match(patched, /Organization/);
  assert.doesNotMatch(patched, /MobileApplication/);
  assert.doesNotMatch(patched, /SoftwareApplication/);
});
