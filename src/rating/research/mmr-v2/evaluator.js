'use strict';

const crypto = require('crypto');
const researchEngine = require('../../../../update/v0.15.129/rating-engine-v01');
const { normalizeResearchDataset } = require('./dataset');
const { fitGlobalLatent } = require('./model');
const { evaluatePredictions, pairedBootstrapDiff } = require('./metrics');

const BASELINES = Object.freeze({
  elo: () => new researchEngine.TeamElo(),
  glicko: () => new researchEngine.TeamGlicko(),
  trueskill_family: () => new researchEngine.TrueSkillTeam()
});

function temporalSplit(matches, fraction = 0.8) {
  const rows = [...(matches || [])].sort((a, b) => a.timestamp - b.timestamp || a.matchId.localeCompare(b.matchId));
  if (rows.length < 2) return Object.freeze({ train: Object.freeze(rows), test: Object.freeze([]), cutoffTimestamp: null });
  const cut = Math.max(1, Math.min(rows.length - 1, Math.floor(rows.length * fraction)));
  return Object.freeze({
    train: Object.freeze(rows.slice(0, cut)),
    test: Object.freeze(rows.slice(cut)),
    cutoffTimestamp: rows[cut]?.timestamp ?? null
  });
}

function evidenceFingerprint(matches) {
  const payload = (matches || []).map(m => [m.matchId, m.timestamp, !!m.teamAWin]);
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function observationCounts(matches) {
  const counts = new Map();
  for (const match of matches || []) for (const id of [...match.teamA, ...match.teamB]) counts.set(id, (counts.get(id) || 0) + 1);
  return counts;
}

function cohortFor(match, counts) {
  const observations = [...match.teamA, ...match.teamB].map(id => counts.get(id) || 0);
  if (observations.some(n => n === 0)) return 'cold_start';
  if (observations.some(n => n < 5)) return 'developing';
  return 'mature';
}

function predictionRow(match, probability, counts) {
  const players = [...match.teamA, ...match.teamB];
  const knownPlayers = players.filter(id => (counts.get(id) || 0) > 0).length;
  return Object.freeze({
    matchId: match.matchId,
    timestamp: match.timestamp,
    actual: match.teamAWin ? 1 : 0,
    probability,
    knownPlayers,
    coldStartPlayers: 10 - knownPlayers,
    cohort: cohortFor(match, counts)
  });
}

function trainSequential(factory, train) {
  const model = factory();
  for (const match of train) model.update(match.teamA, match.teamB, !!match.teamAWin);
  return model;
}

function sequentialPredictions(factory, train, test, { walkForward = false } = {}) {
  const model = trainSequential(factory, train);
  const counts = observationCounts(train);
  const rows = [];
  for (const match of test) {
    rows.push(predictionRow(match, model.predict(match.teamA, match.teamB), counts));
    if (walkForward) {
      model.update(match.teamA, match.teamB, !!match.teamAWin);
      for (const id of [...match.teamA, ...match.teamB]) counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  return Object.freeze(rows);
}

function latentPredictions(train, test, modelOptions, { walkForward = false } = {}) {
  let observed = [...train];
  let model = fitGlobalLatent(observed, modelOptions);
  const counts = observationCounts(observed);
  const rows = [];
  for (const match of test) {
    rows.push(predictionRow(match, model.predict(match), counts));
    if (walkForward) {
      observed.push(match);
      for (const id of [...match.teamA, ...match.teamB]) counts.set(id, (counts.get(id) || 0) + 1);
      model = fitGlobalLatent(observed, modelOptions);
    }
  }
  return Object.freeze({ rows: Object.freeze(rows), model });
}

function cohortMetrics(rows) {
  const result = {};
  for (const name of ['cold_start', 'developing', 'mature']) result[name] = evaluatePredictions((rows || []).filter(row => row.cohort === name));
  return Object.freeze(result);
}

function summarizeModel(rows, walkForwardRows) {
  return Object.freeze({
    frozen: evaluatePredictions(rows),
    frozenCohorts: cohortMetrics(rows),
    walkForward: evaluatePredictions(walkForwardRows),
    walkForwardCohorts: cohortMetrics(walkForwardRows),
    predictions: rows,
    walkForwardPredictions: walkForwardRows
  });
}

function nonRegression(candidate, baseline, { brierTolerance = 0.002, eceTolerance = 0.01 } = {}) {
  return Object.freeze({
    brier: candidate.brier != null && baseline.brier != null && candidate.brier <= baseline.brier + brierTolerance,
    ece: candidate.ece != null && baseline.ece != null && candidate.ece <= baseline.ece + eceTolerance,
    brierTolerance,
    eceTolerance
  });
}

function pickLowestLogLoss(names, reports) {
  return [...names].filter(name => reports[name]?.frozen?.logLoss != null).sort((a, b) => {
    const delta = reports[a].frozen.logLoss - reports[b].frozen.logLoss;
    return delta || a.localeCompare(b);
  })[0] || null;
}

function evaluateMmrV2(rawMatches, options = {}) {
  const dataset = normalizeResearchDataset(rawMatches, { queueId: 450 });
  const split = temporalSplit(dataset.matches, Number.isFinite(options.trainFraction) ? options.trainFraction : 0.8);
  const reports = {};

  for (const [name, factory] of Object.entries(BASELINES)) {
    const frozen = sequentialPredictions(factory, split.train, split.test, { walkForward: false });
    const walk = options.skipWalkForward ? Object.freeze([]) : sequentialPredictions(factory, split.train, split.test, { walkForward: true });
    reports[name] = summarizeModel(frozen, walk);
  }

  const playerOnlyOptions = { includeChampionEffects: false, ...(options.playerOnlyModel || {}) };
  const playerChampionOptions = { includeChampionEffects: true, ...(options.playerChampionModel || {}) };
  const playerOnly = latentPredictions(split.train, split.test, playerOnlyOptions, { walkForward: false });
  const playerOnlyWalk = options.skipWalkForward ? { rows: Object.freeze([]) } : latentPredictions(split.train, split.test, playerOnlyOptions, { walkForward: true });
  const playerChampion = latentPredictions(split.train, split.test, playerChampionOptions, { walkForward: false });
  const playerChampionWalk = options.skipWalkForward ? { rows: Object.freeze([]) } : latentPredictions(split.train, split.test, playerChampionOptions, { walkForward: true });
  reports.mmr_v2_player_only = summarizeModel(playerOnly.rows, playerOnlyWalk.rows);
  reports.mmr_v2_player_champion = summarizeModel(playerChampion.rows, playerChampionWalk.rows);

  const bootstrapIterations = Number.isInteger(options.bootstrapIterations) ? options.bootstrapIterations : 2000;
  const championBootstrap = pairedBootstrapDiff(
    reports.mmr_v2_player_champion.predictions,
    reports.mmr_v2_player_only.predictions,
    { metric: 'logLoss', iterations: bootstrapIterations, seed: 0x4348414d }
  );
  const championNonRegression = nonRegression(reports.mmr_v2_player_champion.frozen, reports.mmr_v2_player_only.frozen, options.nonRegression);
  const championEffectGate = Object.freeze({
    eligible: split.test.length >= 100,
    bootstrap: championBootstrap,
    nonRegression: championNonRegression,
    accepted: split.test.length >= 100 && championBootstrap.clearImprovement && championNonRegression.brier && championNonRegression.ece
  });
  const selectedV2 = championEffectGate.accepted ? 'mmr_v2_player_champion' : 'mmr_v2_player_only';
  const bestBaseline = pickLowestLogLoss(Object.keys(BASELINES), reports);
  const v2VsBaseline = bestBaseline ? pairedBootstrapDiff(
    reports[selectedV2].predictions,
    reports[bestBaseline].predictions,
    { metric: 'logLoss', iterations: bootstrapIterations, seed: 0x56324241 }
  ) : null;
  const v2NonRegression = bestBaseline ? nonRegression(reports[selectedV2].frozen, reports[bestBaseline].frozen, options.nonRegression) : null;

  const minMatches = Number.isInteger(options.minMatches) ? options.minMatches : 500;
  const minFrozenTest = Number.isInteger(options.minFrozenTest) ? options.minFrozenTest : 100;
  const dataGatePassed = dataset.acceptedCount >= minMatches && split.test.length >= minFrozenTest;
  let decision = 'no_clear_winner';
  let reason = 'predictive_advantage_not_established';
  if (!dataGatePassed) {
    decision = 'insufficient_real_data';
    reason = `requires_at_least_${minMatches}_matches_and_${minFrozenTest}_frozen_test_matches`;
  } else if (bestBaseline && v2VsBaseline?.clearImprovement && v2NonRegression?.brier && v2NonRegression?.ece) {
    decision = 'candidate_model';
    reason = 'log_loss_bootstrap_clear_with_brier_ece_non_regression';
  }

  const trainEnd = split.train.at(-1)?.timestamp ?? null;
  const testStart = split.test[0]?.timestamp ?? null;
  const leakageSafe = trainEnd == null || testStart == null || trainEnd <= testStart;
  return Object.freeze({
    researchOnly: true,
    productionRatingActive: false,
    automaticPromotion: false,
    queueId: 450,
    dataset: Object.freeze({
      acceptedMatches: dataset.acceptedCount,
      duplicates: dataset.duplicateCount,
      rejected: dataset.rejectedCount,
      players: Object.keys(dataset.graph.players).length,
      components: dataset.graph.components.length
    }),
    temporal: Object.freeze({
      trainMatches: split.train.length,
      frozenTestMatches: split.test.length,
      trainEnd,
      testStart,
      leakageSafe,
      trainFingerprint: evidenceFingerprint(split.train),
      testFingerprint: evidenceFingerprint(split.test)
    }),
    reports: Object.freeze(reports),
    championEffectGate,
    selectedV2,
    bestBaseline,
    v2VsBaseline,
    v2NonRegression,
    promotionGate: Object.freeze({
      minMatches,
      minFrozenTest,
      dataGatePassed,
      decision,
      reason,
      candidate: decision === 'candidate_model' ? selectedV2 : null,
      automaticPromotion: false
    })
  });
}

module.exports = {
  BASELINES,
  temporalSplit,
  evidenceFingerprint,
  evaluateMmrV2,
  production_active: false,
  automatic_promotion: false
};
