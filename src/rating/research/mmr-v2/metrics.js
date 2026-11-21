'use strict';

function clipProb(value) {
  const p = Number(value);
  return Math.min(1 - 1e-12, Math.max(1e-12, Number.isFinite(p) ? p : 0.5));
}

function logLossTerm(actual, probability) {
  const y = actual ? 1 : 0;
  const p = clipProb(probability);
  return -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
}

function evaluatePredictions(rows, { bins = 10 } = {}) {
  const predictions = Array.isArray(rows) ? rows : [];
  if (!predictions.length) return Object.freeze({ n: 0, logLoss: null, brier: null, ece: null, accuracy: null });
  let loss = 0, brier = 0, correct = 0;
  const buckets = Array.from({ length: bins }, () => ({ n: 0, probability: 0, actual: 0 }));
  for (const row of predictions) {
    const y = row.actual ? 1 : 0;
    const p = clipProb(row.probability ?? row.prob);
    loss += logLossTerm(y, p);
    brier += (p - y) ** 2;
    correct += ((p >= 0.5) === !!y) ? 1 : 0;
    const index = Math.min(bins - 1, Math.floor(p * bins));
    buckets[index].n += 1;
    buckets[index].probability += p;
    buckets[index].actual += y;
  }
  let ece = 0;
  for (const bucket of buckets) {
    if (!bucket.n) continue;
    const predicted = bucket.probability / bucket.n;
    const observed = bucket.actual / bucket.n;
    ece += (bucket.n / predictions.length) * Math.abs(predicted - observed);
  }
  return Object.freeze({
    n: predictions.length,
    logLoss: loss / predictions.length,
    brier: brier / predictions.length,
    ece,
    accuracy: correct / predictions.length
  });
}

function seededRandom(seed = 0x9e3779b9) {
  let state = (Number(seed) >>> 0) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function quantile(sorted, q) {
  if (!sorted.length) return null;
  const position = (sorted.length - 1) * q;
  const lo = Math.floor(position), hi = Math.ceil(position);
  if (lo === hi) return sorted[lo];
  const weight = position - lo;
  return sorted[lo] * (1 - weight) + sorted[hi] * weight;
}

function metricValue(rows, metric) {
  const result = evaluatePredictions(rows);
  if (metric === 'logLoss' || metric === 'brier' || metric === 'ece' || metric === 'accuracy') return result[metric];
  throw new Error(`unsupported bootstrap metric ${metric}`);
}

function pairedRows(candidateRows, baselineRows) {
  const baseline = new Map((baselineRows || []).map(row => [String(row.matchId ?? row.match_id), row]));
  const out = [];
  for (const candidate of candidateRows || []) {
    const matchId = String(candidate.matchId ?? candidate.match_id);
    const other = baseline.get(matchId);
    if (!other) continue;
    const actual = candidate.actual ? 1 : 0;
    if ((other.actual ? 1 : 0) !== actual) continue;
    out.push({ matchId, actual, candidate, baseline: other });
  }
  return out;
}

function pairedBootstrapDiff(candidateRows, baselineRows, {
  metric = 'logLoss',
  iterations = 2000,
  seed = 0x4152414d,
  confidence = 0.95
} = {}) {
  const pairs = pairedRows(candidateRows, baselineRows);
  if (!pairs.length) return Object.freeze({ n: 0, metric, difference: null, ciLow: null, ciHigh: null, confidence, iterations: 0, clearImprovement: false });
  const candidate = pairs.map(x => ({ matchId: x.matchId, actual: x.actual, probability: x.candidate.probability ?? x.candidate.prob }));
  const baseline = pairs.map(x => ({ matchId: x.matchId, actual: x.actual, probability: x.baseline.probability ?? x.baseline.prob }));
  const observed = metricValue(candidate, metric) - metricValue(baseline, metric);
  const rng = seededRandom(seed);
  const samples = [];
  const rounds = Math.max(100, Math.min(20000, Number(iterations) || 2000));
  for (let round = 0; round < rounds; round++) {
    const candSample = [], baseSample = [];
    for (let i = 0; i < pairs.length; i++) {
      const index = Math.floor(rng() * pairs.length);
      candSample.push(candidate[index]);
      baseSample.push(baseline[index]);
    }
    samples.push(metricValue(candSample, metric) - metricValue(baseSample, metric));
  }
  samples.sort((a, b) => a - b);
  const alpha = (1 - confidence) / 2;
  const ciLow = quantile(samples, alpha);
  const ciHigh = quantile(samples, 1 - alpha);
  const lowerIsBetter = metric !== 'accuracy';
  return Object.freeze({
    n: pairs.length,
    metric,
    difference: observed,
    ciLow,
    ciHigh,
    confidence,
    iterations: rounds,
    clearImprovement: lowerIsBetter ? ciHigh < 0 : ciLow > 0
  });
}

module.exports = {
  clipProb,
  logLossTerm,
  evaluatePredictions,
  pairedBootstrapDiff,
  production_active: false,
  automatic_promotion: false
};
