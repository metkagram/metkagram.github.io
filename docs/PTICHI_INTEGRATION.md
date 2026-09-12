# Metkagram ↔ Ptichi spoken-practice integration

Status: **the Metkagram provider contract and static API reference are published; native Ptichi module loading is not released.**

Coordination: issue #117 defined the Metkagram-side handoff/API work and was implemented by PR #122. Ptichi remains the first intended spoken-practice consumer of that provider-neutral contract. The normative transport boundary is documented in `SPOKEN_PRACTICE_HANDOFF.md`.

## Product split

Metkagram and Ptichi remain separate products with different sources of truth.

Metkagram owns reviewed language structure and communicative intent:

**Mark → Frame → Move → Contrast → Choice → Route → Bridge**

That includes stable Pattern IDs, canonical URLs, reviewed relations, language-capability metadata, provenance, dataset/release identity and rights metadata.

Ptichi owns spoken rehearsal: local recording and playback, self-listening, a bounded listener-relevant target, A/B comparison, changed-material transfer and the truth boundary for any speech evidence it displays.

The intended combined loop is:

```text
real communicative job
→ reviewed Metkagram Move / Frame / Choice / Route
→ learner retrieves or creates wording
→ small versioned practice handoff
→ Ptichi Take A
→ self-listen for one bounded target
→ Ptichi-owned cue or honest manual fallback
→ Take B
→ changed-context / changed-wording transfer
```

The integration is therefore not “learn a sentence in Metkagram, then get a pronunciation score”. Its useful boundary is **reviewed semantic retrieval → original spoken production → transfer**.

## Spoken-practice handoff

The published Metkagram bridge is a small, versioned, provider-neutral handoff rather than a copied corpus or shared database.

A handoff preserves:

- handoff/schema version;
- Metkagram dataset/release version;
- canonical object type and stable ID;
- canonical and direct API URLs;
- provenance/content hash;
- rights/attribution reference;
- learning/practice language;
- optional interface, support-translation and Bridge/reference languages as independent fields;
- bounded semantic references such as Move, Pattern/Frame, Contrast, Choice and ordered Route step IDs;
- a communicative job and production prompt;
- an optional self-check;
- a changed-context or changed-wording transfer prompt;
- an explicit boundary that speech capture, playback, delivery feedback and speech evaluation belong to the external consumer.

The current static reference surfaces are:

- `/api/v1/schemas/spoken-practice-handoff.json` — versioned handoff schema;
- `/api/v1/spoken-practice-handoffs.json` — deterministic provider-neutral Pattern/Choice/Route reference fixtures;
- `/api/v1/patterns/{id}.json` — direct Pattern retrieval;
- `/api/v1/choices/{id}.json` — direct reviewed Choice retrieval;
- `/api/v1/routes/{id}.json` — direct reviewed Route retrieval.

The handoff copies only the minimum task projection needed for an immutable snapshot. Canonical formulas, examples and full Route instructions stay in their canonical Metkagram objects rather than becoming a second corpus inside the transport record.

## What the handoff does not mean

Metkagram does not become a speech-analysis engine.

A Mark, grammatical boundary, Frame or Move is semantic/linguistic context. It does not automatically establish:

- a prosodic boundary;
- an ideal pause duration;
- a pitch or energy target;
- a pronunciation score;
- a confidence/charisma score;
- any other Ptichi measurement capability.

Ptichi must resolve speech interventions and evidence through its own reviewed capability model. When automatic evidence is unavailable, self-listening/manual practice can remain the honest path.

## Language boundary

Keep these dimensions independent:

1. Metkagram interface locale;
2. Metkagram learning/practice language;
3. learner-support translation locale;
4. optional Bridge/reference language;
5. Ptichi interface locale;
6. Ptichi speech capability support for the practice language.

A translation existing in Metkagram does not prove Ptichi speech support for that language. Likewise, a reviewed Metkagram Bridge does not imply identical prosody across languages.

## Privacy and local-first boundary

The intended V1 direction is one-way:

`Metkagram handoff → Ptichi local practice`

No raw microphone audio, transcript history, detailed acoustic evidence, calibration/device profile or private work text is returned to Metkagram by default.

A compact completion receipt may be considered later only if observed users need cross-app continuity. It is not part of the current integration contract.

A live MCP connection is also not required for ordinary Ptichi practice after a module has been imported. MCP/API surfaces remain useful for discovery, agents, authoring and retrieving canonical objects.

## Rights and attribution

Publishing a handoff schema does not change Metkagram licensing.

Current Metkagram source, datasets and public API remain governed by the repository's current `LICENSE`, `LICENSING.md` and machine-readable rights metadata. Product/commercial integrations outside separately authorized arrangements still require the permissions described there.

An authorized consumer should preserve stable IDs, canonical links, dataset/release provenance and attribution. A user-requested practice snapshot is not permission to mirror or republish the Metkagram corpus.

## Current implementation state

### Metkagram

**Published:** the provider-neutral handoff schema, three deterministic Pattern/Choice/Route reference projections, static handoff collection, direct Choice/Route retrieval, MCP/OpenAPI discovery and fail-closed validation for unresolved objects/languages.

Metkagram does not publish a Ptichi-specific canonical field, callback, account dependency, audio payload or speech score. The public API/MCP remains independently useful when Ptichi is absent.

### Ptichi

**Planned / not released:** Ptichi is preparing a consumer-side external practice-module adapter that can validate a Metkagram handoff, compile it into Ptichi's existing immutable practice Exercise/session model and keep imported practice available locally.

The intended first proof is one reviewed Metkagram Route, not a broad catalog or marketplace.

### Public UX

There is currently no claim that a production `Open in Ptichi` action ships. Until native capability/release evidence exists, canonical Metkagram pages and manual practice remain the truthful fallback.

## Decision rule

Build only as much transport as removes demonstrated friction.

If users receive equivalent value from canonical Metkagram links plus ordinary/manual Ptichi practice, keep the integration at the reference/handoff layer. A native loader, deep link or bidirectional synchronization is justified only when evidence shows that it materially improves continuity without weakening privacy, provenance or product boundaries.
