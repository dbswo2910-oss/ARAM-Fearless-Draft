'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeResearchDataset,
  fitGlobalLatent,
  recencyWeight,
  pairedBootstrapDiff,
  temporalSplit,
  temporalThreeWaySplit,
  evaluateMmrV2
} = require('../src/rating/research/mmr-v2');
const productionEstimator = require('../src/rating/universal/estimator');

function makeMatch(id, timestamp, teamA, teamB, teamAWin, {
  queueId = 450,
  championsA = [1, 2, 3, 4, 5],
  championsB = [6, 7, 8, 9, 10]
} = {}) {
  const participants = [
    ...teamA.map((puuid, i) => ({ puuid, teamId: 100, championId: championsA[i], win: !!teamAWin })),
    ...teamB.map((puuid, i) => ({ puuid, teamId: 200, championId: championsB[i], win: !teamAWin }))
  ];
  return {
    schemaVersion: 1,
    matchId: String(id),
    timestamp,
    patch: '26.18',
    queueId,
    teamA,
    teamB,
    teamAWin: !!teamAWin,
    participants
  };
}

function flipOutcome(match) {
  const teamAWin = !match.teamAWin;
  return {
    ...match,
    teamAWin,
    participants: match.participants.map(p => ({ ...p, win: p.teamId === 100 ? teamAWin : !teamAWin }))
  };
}

function players(prefix, count = 10) {
  return Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`);
}

function rotate(values, shift) {
  const n = values.length;
  const s = ((shift % n) + n) % n;
  return values.slice(s).concat(values.slice(0, s));
}

function balancedSynthetic(count = 80) {
  const pool = players('p', 20);
  const out = [];
  for (let i = 0; i < count; i++) {
    const order = rotate(pool, i * 3);
    const teamA = [order[0], order[2], order[4], order[6], order[8]];
    const teamB = [order[1], order[3], order[5], order[7], order[9]];
    out.push(makeMatch(`balanced-${i}`, 1000 + i, teamA, teamB, i % 3 !== 0));
  }
  return out;
}

test('queue 450 only, matchId dedupe is idempotent', () => {
  const p = players('dedupe');
  const one = makeMatch('same-match', 1000, p.slice(0, 5), p.slice(5), true);
  const mayhem = makeMatch('wrong-queue', 1001, p.slice(0, 5), p.slice(5), false, { queueId: 1700 });
  const dataset = normalizeResearchDataset([one, one, mayhem]);
  assert.equal(dataset.acceptedCount, 1);
  assert.equal(dataset.duplicateCount, 1);
  assert.equal(dataset.rejectedCount, 1);
  assert.equal(dataset.rejected[0].reason, 'NON_STANDARD_ARAM');
  assert.equal(dataset.matches[0].queueId, 450);
});

test('global latent fit is deterministic for identical evidence', () => {
  const dataset = normalizeResearchDataset(balancedSynthetic(60));
  const a = fitGlobalLatent(dataset.matches, { graph: dataset.graph, maxIterations: 120 });
  const b = fitGlobalLatent(dataset.matches, { graph: dataset.graph, maxIterations: 120 });
  assert.equal(a.modelVersion, b.modelVersion);
  assert.equal(a.iterations, b.iterations);
  for (const id of Object.keys(a.players)) {
    assert.equal(a.players[id].rating, b.players[id].rating);
    assert.equal(a.players[id].uncertainty, b.players[id].uncertainty);
  }
});

test('disconnected match graphs stay explicitly incomparable by component', () => {
  const a = players('component-a');
  const b = players('component-b');
  const dataset = normalizeResearchDataset([
    makeMatch('a-1', 1000, a.slice(0, 5), a.slice(5), true),
    makeMatch('b-1', 1001, b.slice(0, 5), b.slice(5), false)
  ]);
  const model = fitGlobalLatent(dataset.matches, { graph: dataset.graph, maxIterations: 60 });
  assert.equal(model.componentCount, 2);
  assert.notEqual(model.viewPlayer(a[0]).componentId, model.viewPlayer(b[0]).componentId);
  assert.equal(model.viewPlayer(a[0]).componentSize, 10);
  assert.equal(model.viewPlayer(b[0]).componentSize, 10);
  assert.ok(model.viewPlayer(a[0]).uncertainty >= 35);
  assert.match(model.viewPlayer(a[0]).uncertaintyKind, /network_inflated/);
});

test('unobserved player is unmeasured, never fake-1500', () => {
  const dataset = normalizeResearchDataset(balancedSynthetic(10));
  const model = fitGlobalLatent(dataset.matches, { graph: dataset.graph, maxIterations: 60 });
  const view = model.viewPlayer('never-seen-puuid');
  assert.equal(view.measured, false);
  assert.equal(view.rating, null);
  assert.equal(view.uncertainty, null);
  assert.equal(view.games, 0);
});

test('recency weighting is optional and monotonically downweights older evidence', () => {
  const latest = 200 * 24 * 60 * 60 * 1000;
  const now = recencyWeight(latest, latest, 120);
  const sixtyDaysOld = recencyWeight(latest - 60 * 24 * 60 * 60 * 1000, latest, 120);
  const oneTwentyDaysOld = recencyWeight(latest - 120 * 24 * 60 * 60 * 1000, latest, 120);
  assert.equal(now, 1);
  assert.ok(now > sixtyDaysOld);
  assert.ok(sixtyDaysOld > oneTwentyDaysOld);
  assert.ok(Math.abs(oneTwentyDaysOld - 0.5) < 1e-12);
  assert.equal(recencyWeight(latest - 999999, latest, null), 1);
});

test('champion-confounding fixture is separable from rotating player identities', () => {
  const pool = players('champ', 20);
  const matches = [];
  for (let i = 0; i < 100; i++) {
    const order = rotate(pool, i * 7);
    const teamA = [order[0], order[2], order[4], order[6], order[8]];
    const teamB = [order[1], order[3], order[5], order[7], order[9]];
    const specialOnA = i % 2 === 0;
    matches.push(makeMatch(`champ-${i}`, 2000 + i, teamA, teamB, specialOnA, {
      championsA: specialOnA ? [999, 1, 1, 1, 1] : [1, 1, 1, 1, 1],
      championsB: specialOnA ? [1, 1, 1, 1, 1] : [999, 1, 1, 1, 1]
    }));
  }
  const dataset = normalizeResearchDataset(matches);
  const model = fitGlobalLatent(dataset.matches, {
    graph: dataset.graph,
    includeChampionEffects: true,
    championLambda: 4,
    maxIterations: 250
  });
  assert.ok(model.championEffects['999'].latentEffect > model.championEffects['1'].latentEffect);
  assert.ok(model.championEffects['999'].displayEquivalent > 0);
});

test('simple temporal split never leaks a future row into train', () => {
  const rows = normalizeResearchDataset([
    ...balancedSynthetic(12).reverse(),
    ...balancedSynthetic(3).map((m, i) => ({ ...m, matchId: `late-${i}`, timestamp: 5000 + i }))
  ]).matches;
  const split = temporalSplit(rows, 0.8);
  assert.ok(split.train.length > 0 && split.test.length > 0);
  assert.ok(split.train.at(-1).timestamp <= split.test[0].timestamp);
  const trainIds = new Set(split.train.map(m => m.matchId));
  assert.equal(split.test.some(m => trainIds.has(m.matchId)), false);
});

test('nested temporal split isolates train, validation and untouched final future', () => {
  const rows = normalizeResearchDataset(balancedSynthetic(50)).matches;
  const split = temporalThreeWaySplit(rows);
  assert.equal(split.train.length, 30);
  assert.equal(split.validation.length, 10);
  assert.equal(split.test.length, 10);
  assert.ok(split.train.at(-1).timestamp <= split.validation[0].timestamp);
  assert.ok(split.validation.at(-1).timestamp <= split.test[0].timestamp);
  const earlier = new Set([...split.train, ...split.validation].map(m => m.matchId));
  assert.equal(split.test.some(m => earlier.has(m.matchId)), false);
});

test('paired bootstrap keeps no clear improvement when predictions are identical', () => {
  const rows = Array.from({ length: 120 }, (_, i) => ({ matchId: `x-${i}`, actual: i % 2, probability: i % 2 ? 0.6 : 0.4 }));
  const result = pairedBootstrapDiff(rows, rows, { iterations: 300, seed: 123 });
  assert.equal(result.difference, 0);
  assert.equal(result.ciLow, 0);
  assert.equal(result.ciHigh, 0);
  assert.equal(result.clearImprovement, false);
});

test('untouched final outcomes cannot change model or baseline selection', () => {
  const original = balancedSynthetic(180);
  const split = temporalThreeWaySplit(original);
  const finalIds = new Set(split.test.map(m => m.matchId));
  const altered = original.map(match => finalIds.has(match.matchId) ? flipOutcome(match) : match);
  const options = {
    skipWalkForward: true,
    bootstrapIterations: 100,
    minMatches: 9999,
    commonModelOptions: { maxIterations: 45, minIterations: 10 },
    staticPlayerGrid: [
      { id: 'test_p025', modelOptions: { playerLambda: 0.25 } },
      { id: 'test_p050', modelOptions: { playerLambda: 0.50 } }
    ],
    recencyHalfLives: [],
    championLambdas: []
  };
  const a = evaluateMmrV2(original, options);
  const b = evaluateMmrV2(altered, options);
  assert.equal(a.selection.selectionSource, 'validation_only');
  assert.equal(a.selection.finalTestUsedForSelection, false);
  assert.equal(a.selection.selectedBaseline, b.selection.selectedBaseline);
  assert.equal(a.selection.selectedV2, b.selection.selectedV2);
  assert.deepEqual(a.selection.selectedV2Options, b.selection.selectedV2Options);
  assert.equal(a.temporal.trainFingerprint, b.temporal.trainFingerprint);
  assert.equal(a.temporal.validationFingerprint, b.temporal.validationFingerprint);
  assert.notEqual(a.temporal.testFingerprint, b.temporal.testFingerprint);
});

test('small real dataset cannot force a model winner', () => {
  const report = evaluateMmrV2(balancedSynthetic(120), {
    skipWalkForward: true,
    bootstrapIterations: 100,
    commonModelOptions: { maxIterations: 60, minIterations: 10 },
    recencyHalfLives: [],
    championLambdas: []
  });
  assert.equal(report.temporal.leakageSafe, true);
  assert.equal(report.temporal.scheme, 'nested_temporal_60_20_20_default');
  assert.equal(report.selection.finalTestUsedForSelection, false);
  assert.equal(report.promotionGate.dataGatePassed, false);
  assert.equal(report.promotionGate.decision, 'insufficient_real_data');
  assert.equal(report.productionRatingActive, false);
  assert.equal(report.automaticPromotion, false);
});

test('production Universal Rating remains shadow-only and does not include MMR v2', () => {
  assert.equal(productionEstimator.production_active, false);
  assert.equal(productionEstimator.automatic_promotion, false);
  assert.equal(Object.keys(productionEstimator.MODELS).some(key => key.includes('mmr-v2') || key.includes('global-latent')), false);
});
