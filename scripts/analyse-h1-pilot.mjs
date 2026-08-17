import fs from 'node:fs';
import path from 'node:path';

const STUDY_ID = 'H1-CUE-UTILITY-V1';
const STUDY_VERSION = '1.0.0';

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function mean(values) {
  const usable = values.filter(Number.isFinite);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : null;
}

function pct(value) {
  return value === null ? null : Number((value * 100).toFixed(2));
}

function participantMetrics(record) {
  const responses = Array.isArray(record.responses) ? record.responses : [];
  const correct = responses.filter((item) => item.correct === true);
  const comprehension = responses.filter((item) => item.comprehension_correct === true);
  return {
    session_id: record.session_id,
    condition: record.condition,
    cefr: record.cefr,
    completed_trials: responses.length,
    role_accuracy: responses.length ? correct.length / responses.length : null,
    median_correct_rt_ms: median(correct.map((item) => Number(item.response_time_ms))),
    comprehension_accuracy: responses.length ? comprehension.length / responses.length : null,
    mean_confidence: mean(responses.map((item) => Number(item.confidence))),
    visual_load: Number(record.visual_load),
    roles: Object.fromEntries(['subject', 'main_verb', 'helper'].map((role) => {
      const roleResponses = responses.filter((item) => item.target_role === role);
      return [role, roleResponses.length ? roleResponses.filter((item) => item.correct === true).length / roleResponses.length : null];
    }))
  };
}

function eligibility(record, metrics) {
  const reasons = [];
  if (record.study_id !== STUDY_ID) reasons.push('wrong-study-id');
  if (record.study_version !== STUDY_VERSION) reasons.push('wrong-study-version');
  if (!['B1', 'B2'].includes(record.cefr)) reasons.push('outside-target-cefr');
  if (!record.completed_at) reasons.push('incomplete-session');
  if (metrics.completed_trials < 6) reasons.push('fewer-than-6-trials');
  const allRt = (record.responses || []).map((item) => Number(item.response_time_ms)).filter(Number.isFinite);
  if (allRt.length && median(allRt) < 250) reasons.push('median-rt-below-250ms');
  if (!['clean', 'tagged'].includes(record.condition)) reasons.push('invalid-condition');
  return { eligible: reasons.length === 0, reasons };
}

function groupSummary(items) {
  return {
    n: items.length,
    mean_role_accuracy_pct: pct(mean(items.map((item) => item.role_accuracy))),
    median_role_accuracy_pct: pct(median(items.map((item) => item.role_accuracy))),
    median_of_participant_median_correct_rt_ms: median(items.map((item) => item.median_correct_rt_ms)),
    mean_comprehension_accuracy_pct: pct(mean(items.map((item) => item.comprehension_accuracy))),
    median_confidence: median(items.map((item) => item.mean_confidence)),
    median_visual_load: median(items.map((item) => item.visual_load)),
    role_accuracy_pct: Object.fromEntries(['subject', 'main_verb', 'helper'].map((role) => [role, pct(mean(items.map((item) => item.roles[role])))]))
  };
}

function seededRandom(seed = 0x4d65746b) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleWithReplacement(items, random) {
  return Array.from({ length: items.length }, () => items[Math.floor(random() * items.length)]);
}

function percentile(values, q) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * q;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function bootstrapDifference(clean, tagged, accessor, iterations = 5000) {
  if (!clean.length || !tagged.length) return null;
  const random = seededRandom();
  const differences = [];
  for (let index = 0; index < iterations; index += 1) {
    const cleanSample = sampleWithReplacement(clean, random);
    const taggedSample = sampleWithReplacement(tagged, random);
    const cleanValue = accessor(cleanSample);
    const taggedValue = accessor(taggedSample);
    if (Number.isFinite(cleanValue) && Number.isFinite(taggedValue)) differences.push(taggedValue - cleanValue);
  }
  return {
    estimate: accessor(tagged) - accessor(clean),
    bootstrap_95_interval: [percentile(differences, 0.025), percentile(differences, 0.975)],
    iterations
  };
}

function collectJson(inputPath) {
  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    return fs.readdirSync(inputPath).sort().flatMap((name) => {
      const target = path.join(inputPath, name);
      return fs.statSync(target).isDirectory() || name.endsWith('.json') ? collectJson(target) : [];
    });
  }
  if (!inputPath.endsWith('.json')) return [];
  return [{ file: inputPath, record: JSON.parse(fs.readFileSync(inputPath, 'utf8')) }];
}

const inputs = process.argv.slice(2);
if (!inputs.length) {
  console.error('Usage: node scripts/analyse-h1-pilot.mjs <export.json|directory> [...]');
  process.exit(1);
}

const records = inputs.flatMap((item) => collectJson(path.resolve(item)));
const reviewed = records.map(({ file, record }) => {
  const metrics = participantMetrics(record);
  const decision = eligibility(record, metrics);
  return { file, record, metrics, ...decision };
});
const eligible = reviewed.filter((item) => item.eligible).map((item) => item.metrics);
const clean = eligible.filter((item) => item.condition === 'clean');
const tagged = eligible.filter((item) => item.condition === 'tagged');

const accuracyDiff = bootstrapDifference(clean, tagged, (items) => mean(items.map((item) => item.role_accuracy)));
const rtDiff = bootstrapDifference(clean, tagged, (items) => median(items.map((item) => item.median_correct_rt_ms)));
const comprehensionDiff = bootstrapDifference(clean, tagged, (items) => mean(items.map((item) => item.comprehension_accuracy)));

const report = {
  study_id: STUDY_ID,
  study_version: STUDY_VERSION,
  analysis_status: 'exploratory-pilot-descriptive',
  files_read: records.length,
  eligible_sessions: eligible.length,
  excluded_sessions: reviewed.filter((item) => !item.eligible).map((item) => ({ file: item.file, session_id: item.record.session_id || null, reasons: item.reasons })),
  groups: { clean: groupSummary(clean), tagged: groupSummary(tagged) },
  tagged_minus_clean: {
    role_accuracy_percentage_points: accuracyDiff ? {
      estimate: Number((accuracyDiff.estimate * 100).toFixed(2)),
      bootstrap_95_interval: accuracyDiff.bootstrap_95_interval.map((value) => Number((value * 100).toFixed(2)))
    } : null,
    median_correct_response_time_ms: rtDiff,
    comprehension_percentage_points: comprehensionDiff ? {
      estimate: Number((comprehensionDiff.estimate * 100).toFixed(2)),
      bootstrap_95_interval: comprehensionDiff.bootstrap_95_interval.map((value) => Number((value * 100).toFixed(2)))
    } : null
  },
  note: 'Participant-level bootstrap intervals are descriptive uncertainty estimates for this exploratory pilot, not confirmatory efficacy evidence.'
};

console.log(JSON.stringify(report, null, 2));
