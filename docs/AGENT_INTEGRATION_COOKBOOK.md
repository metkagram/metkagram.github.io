# Agent integration cookbook

Status: verified public-reference integration recipes over current Metkagram API/MCP surfaces.

## Principle

Use Metkagram as a reviewed reference layer, not as permission to invent project objects.

A downstream agent should:

1. discover the right public surface for the learner job;
2. retrieve a current canonical object;
3. preserve stable IDs, canonical URLs and provenance;
4. follow only reviewed relations that actually exist;
5. abstain when an exact reviewed object cannot be resolved.

AI can explain, tutor and generate contextual examples around a reviewed object. It must not silently turn generated text into a new canonical Metkagram Pattern, Contrast, Route or Bridge.

The machine-readable recipes are published at:

`/api/v1/agent-integration-recipes.json`

They are validated during every production build against current generated API files.

## Recipe 1 — learner job → reviewed surface

Start with `/api/v1/discovery.json` when the user describes a job rather than a known Pattern ID.

Reference flow:

`learner job → discovery surface → reasoning-packs → /api/v1/reasoning-packs.json`

The current fixture resolves the reviewed `reasoning-packs` surface. The important contract is not the wording of the prompt; it is that the agent selects a declared Metkagram surface before pretending a specific canonical object exists.

## Recipe 2 — canonical Pattern + provenance

Reference object: `CLF051`.

Fetch:

`/api/v1/patterns/clf051.json`

Preserve:

- `CLF051` as the stable Pattern ID;
- canonical URL from the response provenance;
- dataset/release provenance;
- reviewed language records as the source object.

The agent may explain the Pattern in the user's context, but it should clearly separate generated explanation/examples from the canonical record.

## Recipe 3 — Contrast → Choice

Reference Contrast: `necessary-vs-not-enough`.

Reference Choice drill: `testing-required-not-guaranteed`.

Fetch:

1. `/api/v1/contrasts.json`;
2. select the reviewed Contrast;
3. `/api/v1/choice-drills.json`;
4. select the drill that points back to that Contrast.

The current reviewed Pattern pair is `CLF041` and `CLF042`; the bounded drill answer is `CLF041` for that scenario.

Do not turn the rejected option into a universal grammar error. Pattern Choice feedback is scoped to the reviewed scenario and distinction.

## Recipe 4 — reviewed Route

Reference Route: `evidence-without-overclaiming`.

Fetch:

`/api/v1/reasoning-packs.json`

Preserve the route order. Its first current step is the canonical Pattern `CLF051`; later steps reference reviewed Contrasts and Choices.

A Route is a sequence of canonical references, not a second copy of the curriculum. Resolve the referenced object if the user needs its full content.

## Recipe 5 — English ↔ German functional Bridge

Reference Pattern: `CLF051`.

Fetch:

`/api/v1/cross-language-map.json`

The matching record must retain:

- the shared canonical Pattern ID;
- English and German forms;
- `mapping_type = same-canonical-pattern-functional-counterpart`;
- `literal_equivalence = false`.

This is a reviewed functional counterpart, not a claim of universal word-for-word interchangeability.

## Recipe 6 — abstain instead of fabricating

Negative fixture:

`/api/v1/patterns/metkagram-does-not-exist.json`

That route is deliberately absent. Correct behavior:

1. state that the requested reviewed Metkagram object was not found;
2. do not invent a stable ID, formula, canonical URL or provenance;
3. optionally fall back to `/api/v1/discovery.json`, `/api/v1/patterns/index.json` or the human Pattern Atlas;
4. label any subsequent free-form suggestion as generated guidance rather than a Metkagram canonical object.

The production build fails if this negative fixture ever unexpectedly resolves.

## MCP

The static MCP manifest is available at `/api/v1/mcp-server.json` and includes a tool for retrieving the verified recipe collection. Individual domain tools expose the reviewed Contrast, Choice, Route and cross-language collections.

Hosted MCP remains a demand-gated capability. These recipes work with the current static API/local bridge and do not justify operating a backend by themselves.

## Evidence boundary

Passing the integration tests shows that current API objects, references and provenance resolve consistently. It does not show that an AI tutor using these objects improves language learning. User usefulness and learning effects require separate evidence.
