function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

function patternScore(pattern) {
  let score = 0;
  if (pattern?.reasoning?.move) score += 8;
  if (pattern?.gen?.status === "curated") score += 4;
  if (pattern?.practice?.mode) score += 2;
  if (pattern?.langs?.some((item) => item.lang === "en")) score += 1;
  return score;
}

function chooseRepresentativePatterns(patterns, setIds, limit = 6) {
  const setOrder = new Map(setIds.map((id, index) => [id, index]));
  const candidates = patterns
    .filter((pattern) => setOrder.has(pattern.set_id))
    .sort((a, b) => {
      const setDelta = setOrder.get(a.set_id) - setOrder.get(b.set_id);
      if (setDelta !== 0) return setDelta;
      const scoreDelta = patternScore(b) - patternScore(a);
      if (scoreDelta !== 0) return scoreDelta;
      return String(a.id).localeCompare(String(b.id));
    });

  const selected = [];
  const seenSets = new Set();
  for (const pattern of candidates) {
    if (seenSets.has(pattern.set_id)) continue;
    selected.push(pattern.id);
    seenSets.add(pattern.set_id);
    if (selected.length >= limit) return selected;
  }
  for (const pattern of candidates) {
    if (selected.includes(pattern.id)) continue;
    selected.push(pattern.id);
    if (selected.length >= limit) break;
  }
  return selected;
}

export function buildSearchOpportunityIndex(source, topics, studySets, patterns) {
  if (source?.schemaVersion !== 1 || source.status !== "editorial-pilot") {
    throw new Error("search opportunity map must be editorial-pilot schemaVersion 1");
  }
  if (!Array.isArray(source.clusters) || source.clusters.length < 10) {
    throw new Error("search opportunity map requires at least 10 editorial clusters");
  }
  requiredText(source.evidenceBoundary, "evidenceBoundary");

  const topicMap = new Map((topics || []).map((topic) => [topic.id, topic]));
  const setMap = new Map((studySets || []).map((set) => [set.id, set]));
  const patternMap = new Map((patterns || []).map((pattern) => [pattern.id, pattern]));
  const ids = new Set();

  const clusters = source.clusters.map((cluster) => {
    const id = requiredText(cluster.id, "cluster.id");
    if (ids.has(id)) throw new Error(`duplicate search opportunity cluster id: ${id}`);
    ids.add(id);
    if (cluster.review_status !== "editorial") throw new Error(`${id} must have editorial review_status`);
    requiredText(cluster.label_en, `${id}.label_en`);
    requiredText(cluster.learner_job_en, `${id}.learner_job_en`);
    requiredText(cluster.provenance, `${id}.provenance`);

    const topic = topicMap.get(cluster.topic_id);
    if (!topic) throw new Error(`${id} references unknown Atlas topic ${cluster.topic_id}`);
    if (!Array.isArray(cluster.set_ids) || !cluster.set_ids.length) throw new Error(`${id} requires set_ids`);

    for (const setId of cluster.set_ids) {
      if (!setMap.has(setId)) throw new Error(`${id} references unknown study set ${setId}`);
      if (!topic.set_ids?.includes(setId)) throw new Error(`${id} maps ${setId} outside Atlas topic ${topic.id}`);
    }

    const representativePatternIds = chooseRepresentativePatterns(patterns || [], cluster.set_ids);
    if (!representativePatternIds.length) throw new Error(`${id} has no canonical Pattern candidates in its mapped study sets`);
    for (const patternId of representativePatternIds) {
      if (!patternMap.has(patternId)) throw new Error(`${id} derived missing pattern ${patternId}`);
    }

    return {
      id,
      label_en: cluster.label_en,
      learner_job_en: cluster.learner_job_en,
      topic_id: topic.id,
      topic_slug: topic.slug,
      set_ids: [...cluster.set_ids],
      representative_pattern_ids: representativePatternIds,
      review_status: cluster.review_status,
      provenance: cluster.provenance
    };
  });

  return {
    schemaVersion: 1,
    status: source.status,
    evidenceBoundary: source.evidenceBoundary,
    clusters,
    byId: new Map(clusters.map((cluster) => [cluster.id, cluster]))
  };
}

export function normalizeOpportunityMetricRow(row, opportunityIndex) {
  if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("each cluster metric row must be an object");
  for (const key of Object.keys(row)) {
    if (/quer(y|ies)/i.test(key)) throw new Error(`raw query fields are not allowed in cluster metrics: ${key}`);
  }
  const clusterId = requiredText(row.cluster_id, "cluster_id");
  if (!opportunityIndex?.byId?.has(clusterId)) throw new Error(`unknown search opportunity cluster: ${clusterId}`);

  const finite = (value, field) => {
    const number = Number(value ?? 0);
    if (!Number.isFinite(number) || number < 0) throw new Error(`${field} must be a finite number >= 0`);
    return number;
  };
  const clicks = finite(row.clicks, `${clusterId}.clicks`);
  const impressions = finite(row.impressions, `${clusterId}.impressions`);
  const ctr = row.ctr === undefined || row.ctr === null ? (impressions ? clicks / impressions : 0) : finite(row.ctr, `${clusterId}.ctr`);
  if (ctr > 1) throw new Error(`${clusterId}.ctr must be a decimal ratio between 0 and 1`);
  const position = row.position === undefined || row.position === null ? null : finite(row.position, `${clusterId}.position`);
  const helpfulYes = finite(row.helpful_yes, `${clusterId}.helpful_yes`);
  const helpfulNo = finite(row.helpful_no, `${clusterId}.helpful_no`);
  const helpfulTotal = helpfulYes + helpfulNo;

  return {
    cluster_id: clusterId,
    clicks,
    impressions,
    ctr,
    position,
    helpful_yes: helpfulYes,
    helpful_no: helpfulNo,
    helpfulness_rate: helpfulTotal ? helpfulYes / helpfulTotal : null
  };
}

export function joinOpportunityMetrics(clusterRows, opportunityIndex) {
  if (!opportunityIndex) return [];
  if (!Array.isArray(clusterRows)) throw new Error("cluster_rows must be an array when provided");
  const metrics = new Map();
  for (const row of clusterRows) {
    const normalized = normalizeOpportunityMetricRow(row, opportunityIndex);
    if (metrics.has(normalized.cluster_id)) throw new Error(`duplicate cluster metric row: ${normalized.cluster_id}`);
    metrics.set(normalized.cluster_id, normalized);
  }

  return opportunityIndex.clusters.map((cluster) => ({
    ...cluster,
    metrics: metrics.get(cluster.id) || null
  }));
}
