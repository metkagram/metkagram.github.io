# Agent-Ready Web Profile adoption

Start with the repository's governing instructions and `.arwp/adoption.json`. This is a publisher-authored adoption contract, not a ranking certification.

Audience: Language learners inspecting grammar patterns and practice. Useful action: Try one pattern-based practice and inspect its explanation.

## Sources and publication

- Canonical publication: https://metkagram.github.io/
- Profile source: `ai/site-profile.json`; public location: `ai/site-profile.json` under the canonical site base.
- Authoritative site source: `src + data + ai`.
- Published directory: `dist`.
- Build evidence: `package.json; .github/workflows/deploy-pages.yml`.
- Product claims are bounded by `README.md`; CLI or source availability does not imply a hosted agent endpoint.

## Editorial experiment

Compare two explanations of the same grammar pattern with a worked example and a counterexample; preserve local-only learning telemetry.

Reuse the existing intent owner before adding a page. Put the direct answer, concrete example, sources and strongest limitation in visible HTML. Keep comparison criteria symmetric; state where another approach is a better fit. Label synthetic fixtures and first-party interpretations.

The tactic IDs in the adoption contract resolve against [the ARWP corpus](https://github.com/dkharlanau/agent-ready-web-profile/blob/main/knowledge/discoverability-corpus.json). New tactics require evidence and a measurable product consequence.

## Validation and baseline

Validate the profile against [the ARWP v0.1 schema](https://github.com/dkharlanau/agent-ready-web-profile/blob/main/schema/site-profile.schema.json). Use this repository's existing build and profile publication mechanism; `public/` assets are served directly by Next.js, and root static assets must survive the site generator.

Check the exact emitted JSON and HTML before release. After an authorized release, verify the canonical live URL, HTTP status, profile link and response body. Record crawl eligibility, index status, search clicks/impressions, useful-action completion and independent AI citation separately. Missing observations remain unavailable; no score is a ranking promise.

This application is local only. Existing unrelated changes, product telemetry constraints and publication approvals remain in force.
