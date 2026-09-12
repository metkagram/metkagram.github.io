export const REVIEWED_STARTER_SET_IDS = ["FRM", "UNC", "DEC", "HYP", "SPK", "TRN"];
export const STARTER_ELIGIBLE_TIERS = new Set(["A", "B"]);

function assert(condition, message) {
  if (!condition) throw new Error(`Editorial readiness invalid: ${message}`);
}

export function resolveEditorialReadiness({ tiers, studySets, starterSetIds = REVIEWED_STARTER_SET_IDS }) {
  assert(tiers?.schemaVersion === 1, "editorial tiers must use schemaVersion 1");
  assert(Array.isArray(tiers.tiers) && tiers.tiers.length > 0, "editorial tiers are required");
  assert(tiers.fallback?.id === "C", "fallback tier C is required");
  assert(Array.isArray(studySets) && studySets.length > 0, "study sets are required");

  const setById = new Map();
  for (const set of studySets) {
    assert(set?.id, "every study set needs an id");
    assert(!setById.has(set.id), `duplicate study set ${set.id}`);
    setById.set(set.id, set);
  }

  const tierBySetId = new Map();
  const tierDefinitionById = new Map();
  for (const tier of tiers.tiers) {
    assert(tier?.id && tier?.label, "every explicit tier needs id and label");
    assert(!tierDefinitionById.has(tier.id), `duplicate tier ${tier.id}`);
    tierDefinitionById.set(tier.id, tier);
    for (const setId of tier.set_ids || []) {
      assert(setById.has(setId), `tier ${tier.id} references unknown study set ${setId}`);
      assert(!tierBySetId.has(setId), `study set ${setId} appears in multiple tiers`);
      tierBySetId.set(setId, tier);
    }
  }

  const fallback = tiers.fallback;
  const starterSet = new Set();
  for (const setId of starterSetIds) {
    assert(setById.has(setId), `starter references unknown study set ${setId}`);
    assert(!starterSet.has(setId), `duplicate starter study set ${setId}`);
    starterSet.add(setId);
    const tier = tierBySetId.get(setId) || fallback;
    assert(STARTER_ELIGIBLE_TIERS.has(tier.id), `starter study set ${setId} is tier ${tier.id}; only A/B may enter reviewed starter discovery`);
  }

  const sets = studySets.map((set) => {
    const tier = tierBySetId.get(set.id) || fallback;
    const starterEligible = STARTER_ELIGIBLE_TIERS.has(tier.id);
    return {
      set,
      set_id: set.id,
      tier: tier.id,
      label: tier.label,
      meaning: tier.meaning,
      recommended_use: [...(tier.recommended_use || [])],
      starter_eligible: starterEligible,
      featured_start: starterSet.has(set.id),
    };
  });

  const bySetId = new Map(sets.map((record) => [record.set_id, record]));
  const starters = starterSetIds.map((id) => bySetId.get(id));

  return {
    reviewedOn: tiers.reviewedOn || null,
    purpose: tiers.purpose || "Editorial readiness describes review state, not learning efficacy.",
    principles: [...(tiers.principles || [])],
    tiers: [
      ...tiers.tiers.map((tier) => ({
        id: tier.id,
        label: tier.label,
        meaning: tier.meaning,
        recommended_use: [...(tier.recommended_use || [])],
      })),
      {
        id: fallback.id,
        label: fallback.label,
        meaning: fallback.meaning,
        recommended_use: [...(fallback.recommended_use || [])],
      },
    ],
    sets,
    starters,
  };
}
