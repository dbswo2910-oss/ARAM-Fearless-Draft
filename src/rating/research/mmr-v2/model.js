'use strict';

const { buildGraph } = require('./dataset');

const DISPLAY_BASE = 1500;
const DISPLAY_SCALE = 400 / Math.log(10);
const DAY_MS = 24 * 60 * 60 * 1000;
const EPS = 1e-12;

function stableSigmoid(z) {
  if (z >= 0) {
    const e = Math.exp(-Math.min(40, z));
    return 1 / (1 + e);
  }
  const e = Math.exp(Math.max(-40, z));
  return e / (1 + e);
}

function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}

function mapGet(map, key) {
  return map.get(key) || 0;
}

function recencyWeight(timestamp, latestTimestamp, halfLifeDays) {
  if (!Number.isFinite(halfLifeDays) || halfLifeDays <= 0 || !timestamp || !latestTimestamp) return 1;
  const ageDays = Math.max(0, (latestTimestamp - timestamp) / DAY_MS);
  return Math.pow(0.5, ageDays / halfLifeDays);
}

function matchFeatures(match, includeChampionEffects) {
  const features = [];
  for (const id of match.teamA) features.push(['p', id, 1]);
  for (const id of match.teamB) features.push(['p', id, -1]);
  if (includeChampionEffects) {
    for (const id of match.teamAChampions || []) if (id != null) features.push(['c', String(id), 1]);
    for (const id of match.teamBChampions || []) if (id != null) features.push(['c', String(id), -1]);
  }
  return features;
}

function recenterPlayersByComponent(playerSkill, graph) {
  for (const component of graph.components) {
    if (!component.players.length) continue;
    const mean = component.players.reduce((sum, id) => sum + mapGet(playerSkill, id), 0) / component.players.length;
    for (const id of component.players) playerSkill.set(id, mapGet(playerSkill, id) - mean);
  }
}

function recenterMap(values) {
  if (!values.size) return;
  let sum = 0;
  for (const value of values.values()) sum += value;
  const mean = sum / values.size;
  for (const key of values.keys()) values.set(key, values.get(key) - mean);
}

function scoreMatch(match, state, options) {
  let z = options.includeSideBias ? state.sideBias : 0;
  for (const id of match.teamA) z += mapGet(state.playerSkill, id);
  for (const id of match.teamB) z -= mapGet(state.playerSkill, id);
  if (options.includeChampionEffects) {
    for (const id of match.teamAChampions || []) if (id != null) z += mapGet(state.championSkill, String(id));
    for (const id of match.teamBChampions || []) if (id != null) z -= mapGet(state.championSkill, String(id));
  }
  return z;
}

function objective(matches, state, options, latestTimestamp) {
  let loss = 0;
  for (const match of matches) {
    const y = match.teamAWin ? 1 : 0;
    const p = clamp(stableSigmoid(scoreMatch(match, state, options)), 1e-12, 1 - 1e-12);
    const weight = recencyWeight(match.timestamp, latestTimestamp, options.halfLifeDays);
    loss += weight * (-(y * Math.log(p) + (1 - y) * Math.log(1 - p)));
  }
  for (const value of state.playerSkill.values()) loss += 0.5 * options.playerLambda * value * value;
  if (options.includeChampionEffects) for (const value of state.championSkill.values()) loss += 0.5 * options.championLambda * value * value;
  if (options.includeSideBias) loss += 0.5 * options.sideLambda * state.sideBias * state.sideBias;
  return loss / Math.max(1, matches.length);
}

function connectivityLabel(row) {
  if (!row) return 'NONE';
  if (row.games >= 20 && row.uniqueOpponents >= 30 && row.componentSize >= 100) return 'HIGH';
  if (row.games >= 8 && row.uniqueOpponents >= 12 && row.componentSize >= 30) return 'MEDIUM';
  return 'LOW';
}

function fitGlobalLatent(matches, opts = {}) {
  const rows = Array.isArray(matches) ? [...matches].sort((a, b) => a.timestamp - b.timestamp || a.matchId.localeCompare(b.matchId)) : [];
  const options = Object.freeze({
    includeChampionEffects: !!opts.includeChampionEffects,
    includeSideBias: opts.includeSideBias !== false,
    playerLambda: Number.isFinite(opts.playerLambda) ? Math.max(EPS, opts.playerLambda) : 0.35,
    championLambda: Number.isFinite(opts.championLambda) ? Math.max(EPS, opts.championLambda) : 5.0,
    sideLambda: Number.isFinite(opts.sideLambda) ? Math.max(EPS, opts.sideLambda) : 8.0,
    halfLifeDays: Number.isFinite(opts.halfLifeDays) && opts.halfLifeDays > 0 ? Number(opts.halfLifeDays) : null,
    uncertaintyInflation: Number.isFinite(opts.uncertaintyInflation) ? clamp(opts.uncertaintyInflation, 1, 3) : 1.35,
    learningRate: Number.isFinite(opts.learningRate) ? clamp(opts.learningRate, 0.01, 1) : 0.5,
    maxStep: Number.isFinite(opts.maxStep) ? clamp(opts.maxStep, 0.01, 2) : 0.35,
    maxIterations: Number.isInteger(opts.maxIterations) ? clamp(opts.maxIterations, 10, 2000) : 350,
    minIterations: Number.isInteger(opts.minIterations) ? clamp(opts.minIterations, 1, 500) : 25,
    tolerance: Number.isFinite(opts.tolerance) ? Math.max(1e-8, opts.tolerance) : 1e-5
  });

  const graph = opts.graph || buildGraph(rows);
  const latestTimestamp = rows.reduce((max, row) => Math.max(max, Number(row.timestamp) || 0), 0);
  const players = [...new Set(rows.flatMap(m => [...m.teamA, ...m.teamB]))].sort();
  const champions = options.includeChampionEffects
    ? [...new Set(rows.flatMap(m => [...(m.teamAChampions || []), ...(m.teamBChampions || [])]).filter(x => x != null).map(String))].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b))
    : [];

  const state = {
    playerSkill: new Map(players.map(id => [id, 0])),
    championSkill: new Map(champions.map(id => [id, 0])),
    sideBias: 0
  };
  const fisherPlayer = new Map(players.map(id => [id, options.playerLambda]));
  const fisherChampion = new Map(champions.map(id => [id, options.championLambda]));
  let fisherSide = options.sideLambda;
  let converged = rows.length === 0;
  let iterations = 0;
  let maxAbsStep = 0;

  for (let iteration = 0; iteration < options.maxIterations && rows.length; iteration++) {
    const gradPlayer = new Map(players.map(id => [id, -options.playerLambda * mapGet(state.playerSkill, id)]));
    const diagPlayer = new Map(players.map(id => [id, options.playerLambda]));
    const gradChampion = new Map(champions.map(id => [id, -options.championLambda * mapGet(state.championSkill, id)]));
    const diagChampion = new Map(champions.map(id => [id, options.championLambda]));
    let gradSide = options.includeSideBias ? -options.sideLambda * state.sideBias : 0;
    let diagSide = options.sideLambda;

    for (const match of rows) {
      const y = match.teamAWin ? 1 : 0;
      const p = stableSigmoid(scoreMatch(match, state, options));
      const weight = recencyWeight(match.timestamp, latestTimestamp, options.halfLifeDays);
      const residual = (y - p) * weight;
      const curvature = Math.max(1e-8, p * (1 - p) * weight);
      for (const [kind, id, sign] of matchFeatures(match, options.includeChampionEffects)) {
        const gradients = kind === 'p' ? gradPlayer : gradChampion;
        const diagonal = kind === 'p' ? diagPlayer : diagChampion;
        gradients.set(id, mapGet(gradients, id) + sign * residual);
        diagonal.set(id, mapGet(diagonal, id) + curvature);
      }
      if (options.includeSideBias) {
        gradSide += residual;
        diagSide += curvature;
      }
    }

    maxAbsStep = 0;
    for (const id of players) {
      const rawStep = options.learningRate * mapGet(gradPlayer, id) / Math.max(EPS, mapGet(diagPlayer, id));
      const step = clamp(rawStep, -options.maxStep, options.maxStep);
      state.playerSkill.set(id, mapGet(state.playerSkill, id) + step);
      maxAbsStep = Math.max(maxAbsStep, Math.abs(step));
    }
    if (options.includeChampionEffects) {
      for (const id of champions) {
        const rawStep = options.learningRate * mapGet(gradChampion, id) / Math.max(EPS, mapGet(diagChampion, id));
        const step = clamp(rawStep, -options.maxStep, options.maxStep);
        state.championSkill.set(id, mapGet(state.championSkill, id) + step);
        maxAbsStep = Math.max(maxAbsStep, Math.abs(step));
      }
    }
    if (options.includeSideBias) {
      const step = clamp(options.learningRate * gradSide / Math.max(EPS, diagSide), -options.maxStep, options.maxStep);
      state.sideBias += step;
      maxAbsStep = Math.max(maxAbsStep, Math.abs(step));
    }

    recenterPlayersByComponent(state.playerSkill, graph);
    if (options.includeChampionEffects) recenterMap(state.championSkill);
    iterations = iteration + 1;
    if (iterations >= options.minIterations && maxAbsStep < options.tolerance) {
      converged = true;
      break;
    }
  }

  // Final diagonal Fisher approximation at the fitted point. This is deliberately
  // labelled approximate; it is not a full posterior covariance matrix.
  for (const id of players) fisherPlayer.set(id, options.playerLambda);
  for (const id of champions) fisherChampion.set(id, options.championLambda);
  fisherSide = options.sideLambda;
  for (const match of rows) {
    const p = stableSigmoid(scoreMatch(match, state, options));
    const weight = recencyWeight(match.timestamp, latestTimestamp, options.halfLifeDays);
    const curvature = Math.max(1e-8, p * (1 - p) * weight);
    for (const [kind, id] of matchFeatures(match, options.includeChampionEffects)) {
      const target = kind === 'p' ? fisherPlayer : fisherChampion;
      target.set(id, mapGet(target, id) + curvature);
    }
    if (options.includeSideBias) fisherSide += curvature;
  }

  const componentMatches = new Map();
  for (const match of rows) {
    const componentId = graph.players[match.teamA[0]]?.componentId;
    if (componentId) componentMatches.set(componentId, (componentMatches.get(componentId) || 0) + 1);
  }

  const views = {};
  for (const id of players) {
    const stats = graph.players[id];
    const latent = mapGet(state.playerSkill, id);
    const sigma = 1 / Math.sqrt(Math.max(EPS, mapGet(fisherPlayer, id)));
    const componentMatchCount = componentMatches.get(stats?.componentId) || 0;
    const networkPenalty = (stats?.componentSize || 0) < 20 ? 1.35 : (stats?.componentSize || 0) < 50 ? 1.2 : componentMatchCount < 20 ? 1.15 : 1;
    const uncertainty = clamp(sigma * DISPLAY_SCALE * options.uncertaintyInflation * networkPenalty, 35, 500);
    const rating = DISPLAY_BASE + latent * DISPLAY_SCALE;
    views[id] = Object.freeze({
      puuid: id,
      measured: true,
      rating,
      latentSkill: latent,
      uncertainty,
      uncertainty95: 1.96 * uncertainty,
      uncertaintyKind: 'diagonal_fisher_network_inflated_approximation',
      games: stats?.games || 0,
      wins: stats?.wins || 0,
      uniqueTeammates: stats?.uniqueTeammates || 0,
      uniqueOpponents: stats?.uniqueOpponents || 0,
      componentId: stats?.componentId || null,
      componentSize: stats?.componentSize || 0,
      componentMatches: componentMatchCount,
      connectivity: connectivityLabel(stats),
      provisional: (stats?.games || 0) < 20 || uncertainty > 120
    });
  }

  const championEffects = {};
  for (const id of champions) {
    const latent = mapGet(state.championSkill, id);
    championEffects[id] = Object.freeze({
      championId: Number(id),
      latentEffect: latent,
      displayEquivalent: latent * DISPLAY_SCALE,
      uncertainty: clamp((1 / Math.sqrt(Math.max(EPS, mapGet(fisherChampion, id)))) * DISPLAY_SCALE * options.uncertaintyInflation, 20, 500)
    });
  }

  const api = {
    modelVersion: options.includeChampionEffects ? 'mmr-v2-global-latent-player-champion-shadow' : 'mmr-v2-global-latent-player-only-shadow',
    status: 'SHADOW',
    productionActive: false,
    automaticPromotion: false,
    options,
    converged,
    iterations,
    maxAbsStep,
    objective: objective(rows, state, options, latestTimestamp),
    matchCount: rows.length,
    playerCount: players.length,
    componentCount: graph.components.length,
    sideBias: options.includeSideBias ? state.sideBias : 0,
    sideBiasDisplayEquivalent: options.includeSideBias ? state.sideBias * DISPLAY_SCALE : 0,
    sideBiasUncertainty: options.includeSideBias ? clamp((1 / Math.sqrt(Math.max(EPS, fisherSide))) * DISPLAY_SCALE * options.uncertaintyInflation, 20, 500) : null,
    championEffects: Object.freeze(championEffects),
    players: Object.freeze(views),
    predict(match) {
      return clamp(stableSigmoid(scoreMatch(match, state, options)), 1e-9, 1 - 1e-9);
    },
    viewPlayer(puuid) {
      const id = String(puuid || '');
      return views[id] || Object.freeze({
        puuid: id,
        measured: false,
        rating: null,
        latentSkill: null,
        uncertainty: null,
        uncertainty95: null,
        uncertaintyKind: 'unmeasured',
        games: 0,
        wins: 0,
        uniqueTeammates: 0,
        uniqueOpponents: 0,
        componentId: null,
        componentSize: 0,
        componentMatches: 0,
        connectivity: 'NONE',
        provisional: true
      });
    }
  };
  return Object.freeze(api);
}

module.exports = {
  DISPLAY_BASE,
  DISPLAY_SCALE,
  DAY_MS,
  stableSigmoid,
  recencyWeight,
  fitGlobalLatent,
  production_active: false,
  automatic_promotion: false
};
