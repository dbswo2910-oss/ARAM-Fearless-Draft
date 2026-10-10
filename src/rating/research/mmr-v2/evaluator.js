'use strict';

const crypto = require('crypto');
const researchEngine = require('../../../../update/v0.15.129/rating-engine-v01');
const { normalizeResearchDataset } = require('./dataset');
const { fitGlobalLatent, DAY_MS } = require('./model');
const { evaluatePredictions, pairedBootstrapDiff } = require('./metrics');

const BASELINES = Object.freeze({
  elo: () => new researchEngine.TeamElo(),
  glicko: () => new researchEngine.TeamGlicko(),
  trueskill_family: () => new researchEngine.TrueSkillTeam()
});

const DEFAULT_STATIC_PLAYER_GRID = Object.freeze([
  Object.freeze({ id: 'mmr_v2_p025_static', modelOptions: Object.freeze({ includeChampionEffects: false, playerLambda: 0.25, halfLifeDays: null }) }),
  Object.freeze({ id: 'mmr_v2_p035_static', modelOptions: Object.freeze({ includeChampionEffects: false, playerLambda: 0.35, halfLifeDays: null }) }),
  Object.freeze({ id: 'mmr_v2_p050_static', modelOptions: Object.freeze({ includeChampionEffects: false, playerLambda: 0.50, halfLifeDays: null }) })
]);

const DEFAULT_RECENCY_HALF_LIVES = Object.freeze([120, 240]);
const DEFAULT_CHAMPION_LAMBDAS = Object.freeze([5, 8]);

function sortMatches(matches) {
  return [...(matches || [])].sort((a, b) => a.timestamp - b.timestamp || a.matchId.localeCompare(b.matchId));
}

function temporalSplit(matches, fraction = 0.8) {
  const rows = sortMatches(matches);
  if (rows.length < 2) return Object.freeze({ train: Object.freeze(rows), test: Object.freeze([]), cutoffTimestamp: null });
  const cut = Math.max(1, Math.min(rows.length - 1, Math.floor(rows.length * fraction)));
  return Object.freeze({
    train: Object.freeze(rows.slice(0, cut)),
    test: Object.freeze(rows.slice(cut)),
    cutoffTimestamp: rows[cut]?.timestamp ?? null
  });
}

function temporalThreeWaySplit(matches, { trainFraction = 0.6, validationFraction = 0.2 } = {}) {
  const rows = sortMatches(matches);
  if (rows.length < 3) {
    return Object.freeze({
      train: Object.freeze(rows), validation: Object.freeze([]), test: Object.freeze([]),
      trainEnd: rows.at(-1)?.timestamp ?? null, validationStart: null, validationEnd: null, testStart: null
    });
  }
  const trainFrac = Math.max(0.2, Math.min(0.8, Number(trainFraction) || 0.6));
  const validationFrac = Math.max(0.1, Math.min(0.5, Number(validationFraction) || 0.2));
  let trainCut = Math.floor(rows.length * trainFrac);
  let validationCut = Math.floor(rows.length * (trainFrac + validationFrac));
  trainCut = Math.max(1, Math.min(rows.length - 2, trainCut));
  validationCut = Math.max(trainCut + 1, Math.min(rows.length - 1, validationCut));
  const train = rows.slice(0, trainCut), validation = rows.slice(trainCut, validationCut), test = rows.slice(validationCut);
  return Object.freeze({
    train: Object.freeze(train), validation: Object.freeze(validation), test: Object.freeze(test),
    trainEnd: train.at(-1)?.timestamp ?? null,
    validationStart: validation[0]?.timestamp ?? null,
    validationEnd: validation.at(-1)?.timestamp ?? null,
    testStart: test[0]?.timestamp ?? null
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
    matchId: match.matchId, timestamp: match.timestamp, actual: match.teamAWin ? 1 : 0,
    probability, knownPlayers, coldStartPlayers: 10 - knownPlayers, cohort: cohortFor(match, counts)
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

function summarizeModel(rows, walkForwardRows = Object.freeze([])) {
  return Object.freeze({
    frozen: evaluatePredictions(rows), frozenCohorts: cohortMetrics(rows),
    walkForward: evaluatePredictions(walkForwardRows), walkForwardCohorts: cohortMetrics(walkForwardRows),
    predictions: rows, walkForwardPredictions: walkForwardRows
  });
}

function metricsOnly(summary) {
  return Object.freeze({
    frozen: summary.frozen, frozenCohorts: summary.frozenCohorts,
    walkForward: summary.walkForward, walkForwardCohorts: summary.walkForwardCohorts
  });
}

function nonRegression(candidate, baseline, { brierTolerance = 0.002, eceTolerance = 0.01 } = {}) {
  return Object.freeze({
    brier: candidate.brier != null && baseline.brier != null && candidate.brier <= baseline.brier + brierTolerance,
    ece: candidate.ece != null && baseline.ece != null && candidate.ece <= baseline.ece + eceTolerance,
    brierTolerance, eceTolerance
  });
}

function compareMetricRows(a, b) {
  const am = a?.frozen || a, bm = b?.frozen || b;
  for (const key of ['logLoss', 'brier', 'ece']) {
    const av = am?.[key], bv = bm?.[key];
    if (av == null && bv == null) continue;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function bestByValidation(entries) {
  return [...entries].sort((a, b) => compareMetricRows(a.summary, b.summary) || a.id.localeCompare(b.id))[0] || null;
}

function normalizeGrid(rawGrid, fallback, commonModelOptions = {}) {
  const source = Array.isArray(rawGrid) && rawGrid.length ? rawGrid : fallback;
  return source.map((spec, index) => Object.freeze({
    id: String(spec?.id || `candidate-${index + 1}`),
    modelOptions: Object.freeze({ ...commonModelOptions, ...(spec?.modelOptions || {}) })
  }));
}

function championCoverage(matches) {
  let known = 0, total = 0;
  for (const match of matches || []) for (const id of [...(match.teamAChampions || []), ...(match.teamBChampions || [])]) {
    total += 1;
    if (id != null) known += 1;
  }
  return total ? known / total : 0;
}

function datasetDiagnostics(dataset) {
  const rows = Object.values(dataset?.graph?.players || {});
  const games = rows.map(row => Number(row.games) || 0).sort((a, b) => a - b);
  const total = rows.length;
  const countAtLeast = threshold => games.filter(n => n >= threshold).length;
  const median = total ? (total % 2 ? games[(total - 1) / 2] : (games[total / 2 - 1] + games[total / 2]) / 2) : 0;
  const largestComponent = Math.max(0, ...(dataset?.graph?.components || []).map(c => Number(c.size) || 0));
  const players2Plus = countAtLeast(2);
  return Object.freeze({
    uniquePlayers: total,
    averageObservations: total ? (dataset.acceptedCount * 10) / total : 0,
    medianObservations: median,
    singletonPlayers: games.filter(n => n === 1).length,
    players2Plus,
    players5Plus: countAtLeast(5),
    players10Plus: countAtLeast(10),
    players20Plus: countAtLeast(20),
    repeatObservationRate: total ? players2Plus / total : 0,
    largestComponentPlayers: largestComponent,
    largestComponentShare: total ? largestComponent / total : 0
  });
}

function validationGate(candidateSummary, referenceSummary, validationLength, bootstrapIterations, seed, options = {}) {
  const minValidationMatches = Number.isInteger(options.minValidationMatches) ? options.minValidationMatches : 100;
  const bootstrap = pairedBootstrapDiff(candidateSummary.predictions, referenceSummary.predictions, {
    metric: 'logLoss', iterations: bootstrapIterations, seed
  });
  const regression = nonRegression(candidateSummary.frozen, referenceSummary.frozen, options.nonRegression);
  return Object.freeze({
    eligible: validationLength >= minValidationMatches,
    minValidationMatches, bootstrap, nonRegression: regression,
    accepted: validationLength >= minValidationMatches && bootstrap.clearImprovement && regression.brier && regression.ece
  });
}

function selectModelsOnValidation(split, options, bootstrapIterations) {
  const baselineValidation = {}, baselineEntries = [];
  for (const [name, factory] of Object.entries(BASELINES)) {
    const rows = sequentialPredictions(factory, split.train, split.validation, { walkForward: false });
    const summary = summarizeModel(rows);
    baselineValidation[name] = metricsOnly(summary);
    baselineEntries.push({ id: name, summary });
  }
  const selectedBaseline = bestByValidation(baselineEntries)?.id || null;

  const commonModelOptions = options.commonModelOptions || {};
  const staticGrid = normalizeGrid(options.staticPlayerGrid, DEFAULT_STATIC_PLAYER_GRID, commonModelOptions);
  const candidateValidation = {}, staticEntries = [];
  for (const spec of staticGrid) {
    const result = latentPredictions(split.train, split.validation, { ...spec.modelOptions, includeChampionEffects: false }, { walkForward: false });
    const summary = summarizeModel(result.rows);
    candidateValidation[spec.id] = Object.freeze({ modelOptions: spec.modelOptions, ...metricsOnly(summary) });
    staticEntries.push({ ...spec, summary });
  }
  let selected = bestByValidation(staticEntries);
  if (!selected) throw new Error('MMR v2 validation selection has no static player-only candidate');

  const featureGates = {};
  const recencyHalfLives = Array.isArray(options.recencyHalfLives) ? options.recencyHalfLives : DEFAULT_RECENCY_HALF_LIVES;
  const recencyEntries = [];
  for (const halfLife of recencyHalfLives) {
    if (!Number.isFinite(Number(halfLife)) || Number(halfLife) <= 0) continue;
    const id = `${selected.id}_h${Math.round(Number(halfLife))}`;
    const modelOptions = { ...selected.modelOptions, includeChampionEffects: false, halfLifeDays: Number(halfLife) };
    const result = latentPredictions(split.train, split.validation, modelOptions, { walkForward: false });
    const summary = summarizeModel(result.rows);
    candidateValidation[id] = Object.freeze({ modelOptions: Object.freeze(modelOptions), ...metricsOnly(summary) });
    recencyEntries.push({ id, modelOptions: Object.freeze(modelOptions), summary });
  }
  const bestRecency = bestByValidation(recencyEntries);
  if (bestRecency) {
    const gate = validationGate(bestRecency.summary, selected.summary, split.validation.length, bootstrapIterations, 0x52454345, options);
    featureGates.recency = Object.freeze({ candidate: bestRecency.id, reference: selected.id, ...gate });
    if (gate.accepted) selected = bestRecency;
  } else featureGates.recency = Object.freeze({ candidate: null, reference: selected.id, eligible: false, accepted: false, reason: 'no_recency_candidates' });

  const coverage = championCoverage([...split.train, ...split.validation]);
  const minChampionCoverage = Number.isFinite(options.minChampionCoverage) ? Math.max(0, Math.min(1, options.minChampionCoverage)) : 0.95;
  const championLambdas = Array.isArray(options.championLambdas) ? options.championLambdas : DEFAULT_CHAMPION_LAMBDAS;
  const championEntries = [];
  for (const lambda of championLambdas) {
    if (!Number.isFinite(Number(lambda)) || Number(lambda) <= 0) continue;
    const id = `${selected.id}_champ${Number(lambda)}`;
    const modelOptions = { ...selected.modelOptions, includeChampionEffects: true, championLambda: Number(lambda) };
    const result = latentPredictions(split.train, split.validation, modelOptions, { walkForward: false });
    const summary = summarizeModel(result.rows);
    candidateValidation[id] = Object.freeze({ modelOptions: Object.freeze(modelOptions), ...metricsOnly(summary) });
    championEntries.push({ id, modelOptions: Object.freeze(modelOptions), summary });
  }
  const bestChampion = bestByValidation(championEntries);
  if (bestChampion) {
    const gate = validationGate(bestChampion.summary, selected.summary, split.validation.length, bootstrapIterations, 0x4348414d, options);
    const coverageEligible = coverage >= minChampionCoverage;
    featureGates.champion = Object.freeze({
      candidate: bestChampion.id, reference: selected.id, championCoverage: coverage, minChampionCoverage,
      ...gate, eligible: gate.eligible && coverageEligible, accepted: gate.accepted && coverageEligible
    });
    if (gate.accepted && coverageEligible) selected = bestChampion;
  } else featureGates.champion = Object.freeze({ candidate: null, reference: selected.id, championCoverage: coverage, minChampionCoverage, eligible: false, accepted: false, reason: 'no_champion_candidates' });

  return Object.freeze({
    selectionSource: 'validation_only', finalTestUsedForSelection: false,
    selectedBaseline, selectedV2: selected.id, selectedV2Options: Object.freeze({ ...selected.modelOptions }),
    validation: Object.freeze({ baselines: Object.freeze(baselineValidation), candidates: Object.freeze(candidateValidation) }),
    featureGates: Object.freeze(featureGates)
  });
}

function finalEvaluation(split, selection, options, bootstrapIterations) {
  const history = [...split.train, ...split.validation];
  const baselineFactory = BASELINES[selection.selectedBaseline];
  if (!baselineFactory) throw new Error(`unknown selected baseline ${selection.selectedBaseline}`);
  const baselineFrozenRows = sequentialPredictions(baselineFactory, history, split.test, { walkForward: false });
  const v2Frozen = latentPredictions(history, split.test, selection.selectedV2Options, { walkForward: false });
  const baselineWalkRows = options.skipWalkForward ? Object.freeze([]) : sequentialPredictions(baselineFactory, history, split.test, { walkForward: true });
  const v2Walk = options.skipWalkForward ? { rows: Object.freeze([]) } : latentPredictions(history, split.test, selection.selectedV2Options, { walkForward: true });
  const baseline = summarizeModel(baselineFrozenRows, baselineWalkRows), candidate = summarizeModel(v2Frozen.rows, v2Walk.rows);
  const bootstrap = pairedBootstrapDiff(candidate.predictions, baseline.predictions, { metric: 'logLoss', iterations: bootstrapIterations, seed: 0x56324241 });
  const regression = nonRegression(candidate.frozen, baseline.frozen, options.nonRegression);
  return Object.freeze({
    selectedBaseline: selection.selectedBaseline, selectedV2: selection.selectedV2,
    baseline: metricsOnly(baseline), candidate: metricsOnly(candidate),
    v2VsBaseline: bootstrap, v2NonRegression: regression
  });
}

function evaluateMmrV2(rawMatches, options = {}) {
  const dataset = normalizeResearchDataset(rawMatches, { queueId: 450 });
  const diagnostics = datasetDiagnostics(dataset);
  const split = temporalThreeWaySplit(dataset.matches, {
    trainFraction: Number.isFinite(options.trainFraction) ? options.trainFraction : 0.6,
    validationFraction: Number.isFinite(options.validationFraction) ? options.validationFraction : 0.2
  });
  const bootstrapIterations = Number.isInteger(options.bootstrapIterations) ? options.bootstrapIterations : 2000;
  const selection = split.validation.length ? selectModelsOnValidation(split, options, bootstrapIterations) : Object.freeze({
    selectionSource: 'validation_only', finalTestUsedForSelection: false, selectedBaseline: null, selectedV2: null, selectedV2Options: null,
    validation: Object.freeze({ baselines: Object.freeze({}), candidates: Object.freeze({}) }), featureGates: Object.freeze({})
  });
  const finalTest = selection.selectedBaseline && selection.selectedV2 && split.test.length ? finalEvaluation(split, selection, options, bootstrapIterations) : null;

  const minMatches = Number.isInteger(options.minMatches) ? options.minMatches : 500;
  const minFrozenTest = Number.isInteger(options.minFrozenTest) ? options.minFrozenTest : 100;
  const minValidationMatches = Number.isInteger(options.minValidationMatches) ? options.minValidationMatches : 100;
  const minMatureFrozenTest = Number.isInteger(options.minMatureFrozenTest) ? options.minMatureFrozenTest : 50;
  const matureFrozenTest = Number(finalTest?.candidate?.frozenCohorts?.mature?.n) || 0;
  const dataGatePassed = dataset.acceptedCount >= minMatches && split.validation.length >= minValidationMatches && split.test.length >= minFrozenTest && matureFrozenTest >= minMatureFrozenTest;
  let decision = 'no_clear_winner', reason = 'predictive_advantage_not_established';
  if (!dataGatePassed) {
    decision = 'insufficient_real_data';
    reason = `requires_${minMatches}_matches_${minValidationMatches}_validation_${minFrozenTest}_untouched_test_${minMatureFrozenTest}_mature_test`;
  } else if (finalTest?.v2VsBaseline?.clearImprovement && finalTest?.v2NonRegression?.brier && finalTest?.v2NonRegression?.ece) {
    decision = 'candidate_model';
    reason = 'untouched_future_log_loss_bootstrap_clear_with_brier_ece_non_regression';
  }

  const leakageSafe = (
    (split.trainEnd == null || split.validationStart == null || split.trainEnd <= split.validationStart) &&
    (split.validationEnd == null || split.testStart == null || split.validationEnd <= split.testStart) &&
    selection.finalTestUsedForSelection === false
  );
  const firstTimestamp = dataset.matches[0]?.timestamp ?? null, lastTimestamp = dataset.matches.at(-1)?.timestamp ?? null;
  const spanDays = firstTimestamp != null && lastTimestamp != null ? (lastTimestamp - firstTimestamp) / DAY_MS : 0;

  return Object.freeze({
    researchOnly: true, productionRatingActive: false, automaticPromotion: false, queueId: 450,
    dataset: Object.freeze({
      acceptedMatches: dataset.acceptedCount, duplicates: dataset.duplicateCount, rejected: dataset.rejectedCount,
      players: diagnostics.uniquePlayers, components: dataset.graph.components.length, spanDays, density: diagnostics
    }),
    temporal: Object.freeze({
      scheme: 'nested_temporal_60_20_20_default', trainMatches: split.train.length,
      validationMatches: split.validation.length, frozenTestMatches: split.test.length, finalTestMatches: split.test.length,
      trainEnd: split.trainEnd, validationStart: split.validationStart, validationEnd: split.validationEnd, testStart: split.testStart,
      leakageSafe, trainFingerprint: evidenceFingerprint(split.train), validationFingerprint: evidenceFingerprint(split.validation), testFingerprint: evidenceFingerprint(split.test)
    }),
    selection, finalTest, selectedV2: selection.selectedV2, bestBaseline: selection.selectedBaseline,
    v2VsBaseline: finalTest?.v2VsBaseline || null, v2NonRegression: finalTest?.v2NonRegression || null,
    promotionGate: Object.freeze({
      minMatches, minValidationMatches, minFrozenTest, minMatureFrozenTest, matureFrozenTest,
      dataGatePassed, decision, reason, candidate: decision === 'candidate_model' ? selection.selectedV2 : null, automaticPromotion: false
    })
  });
}

module.exports = {
  BASELINES, DEFAULT_STATIC_PLAYER_GRID, DEFAULT_RECENCY_HALF_LIVES, DEFAULT_CHAMPION_LAMBDAS,
  temporalSplit, temporalThreeWaySplit, evidenceFingerprint, datasetDiagnostics, evaluateMmrV2,
  production_active: false, automatic_promotion: false
};
