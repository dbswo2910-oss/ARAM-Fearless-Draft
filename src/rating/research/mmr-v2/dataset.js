'use strict';

const { normalizeMatch } = require('../../universal/normalizer');

const QUEUE_ID = 450;

const asString = value => String(value == null ? '' : value).trim();
const asNumber = value => Number.isFinite(Number(value)) ? Number(value) : null;

function explicitQueueId(raw) {
  const roots = [raw, raw?.game, raw?.match, raw?.data, raw?.raw, raw?.info].filter(Boolean);
  for (const root of roots) {
    const value = root?.queueId ?? root?.queue_id;
    if (value !== undefined && value !== null && value !== '') return asNumber(value);
  }
  return null;
}

function directNormalizedMatch(raw, queueId) {
  if (!raw || typeof raw !== 'object') return null;
  const matchId = asString(raw.matchId);
  const timestamp = asNumber(raw.timestamp);
  const q = asNumber(raw.queueId);
  const teamA = Array.isArray(raw.teamA) ? raw.teamA.map(asString).filter(Boolean) : [];
  const teamB = Array.isArray(raw.teamB) ? raw.teamB.map(asString).filter(Boolean) : [];
  const participants = Array.isArray(raw.participants) ? raw.participants : [];
  if (!matchId || !timestamp || q !== Number(queueId) || teamA.length !== 5 || teamB.length !== 5 || participants.length !== 10) return null;
  const ids = [...teamA, ...teamB];
  if (new Set(ids).size !== 10) return null;
  const rows = participants.map((p, index) => ({
    puuid: asString(p?.puuid),
    teamId: asNumber(p?.teamId) ?? (index < 5 ? 100 : 200),
    championId: asNumber(p?.championId),
    win: typeof p?.win === 'boolean' ? p.win : null
  }));
  if (rows.some(p => !p.puuid) || new Set(rows.map(p => p.puuid)).size !== 10) return null;
  return {
    schemaVersion: 1,
    matchId,
    timestamp,
    patch: asString(raw.patch) || 'UNKNOWN',
    queueId: q,
    teamA: [...teamA].sort(),
    teamB: [...teamB].sort(),
    teamAWin: !!raw.teamAWin,
    participants: rows.sort((a, b) => a.puuid.localeCompare(b.puuid))
  };
}

function normalizeOne(raw, queueId) {
  const direct = directNormalizedMatch(raw, queueId);
  if (direct) return direct;
  return normalizeMatch(raw, { queueId });
}

function enrichMatch(match) {
  const byId = new Map(match.participants.map(p => [p.puuid, p]));
  const championOf = puuid => {
    const value = byId.get(puuid)?.championId;
    return Number.isFinite(Number(value)) ? String(Number(value)) : null;
  };
  return Object.freeze({
    ...match,
    teamA: Object.freeze([...match.teamA]),
    teamB: Object.freeze([...match.teamB]),
    teamAChampions: Object.freeze(match.teamA.map(championOf)),
    teamBChampions: Object.freeze(match.teamB.map(championOf)),
    participants: Object.freeze(match.participants.map(p => Object.freeze({ ...p })))
  });
}

class UnionFind {
  constructor(ids) {
    this.parent = new Map(ids.map(id => [id, id]));
  }
  find(id) {
    let root = this.parent.get(id);
    if (root == null) return null;
    while (root !== this.parent.get(root)) root = this.parent.get(root);
    let cursor = id;
    while (cursor !== root) {
      const next = this.parent.get(cursor);
      this.parent.set(cursor, root);
      cursor = next;
    }
    return root;
  }
  union(a, b) {
    let ra = this.find(a), rb = this.find(b);
    if (ra == null || rb == null || ra === rb) return;
    if (ra.localeCompare(rb) > 0) [ra, rb] = [rb, ra];
    this.parent.set(rb, ra);
  }
}

function buildGraph(matches) {
  const playerIds = [...new Set(matches.flatMap(m => [...m.teamA, ...m.teamB]))].sort();
  const uf = new UnionFind(playerIds);
  const stats = new Map(playerIds.map(id => [id, {
    puuid: id,
    games: 0,
    wins: 0,
    teammates: new Set(),
    opponents: new Set(),
    components: null
  }]));

  for (const match of matches) {
    const all = [...match.teamA, ...match.teamB];
    for (let i = 1; i < all.length; i++) uf.union(all[0], all[i]);
    for (const [team, opponents, won] of [
      [match.teamA, match.teamB, match.teamAWin],
      [match.teamB, match.teamA, !match.teamAWin]
    ]) {
      for (const id of team) {
        const row = stats.get(id);
        row.games += 1;
        if (won) row.wins += 1;
        for (const mate of team) if (mate !== id) row.teammates.add(mate);
        for (const enemy of opponents) row.opponents.add(enemy);
      }
    }
  }

  const grouped = new Map();
  for (const id of playerIds) {
    const root = uf.find(id);
    if (!grouped.has(root)) grouped.set(root, []);
    grouped.get(root).push(id);
  }
  const components = [...grouped.values()]
    .map(ids => ids.sort())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map((ids, index) => Object.freeze({ id: `component-${index + 1}`, anchor: ids[0], size: ids.length, players: Object.freeze(ids) }));
  const componentByPlayer = new Map();
  for (const component of components) for (const id of component.players) componentByPlayer.set(id, component);

  const playerStats = {};
  for (const id of playerIds) {
    const row = stats.get(id);
    const component = componentByPlayer.get(id);
    playerStats[id] = Object.freeze({
      puuid: id,
      games: row.games,
      wins: row.wins,
      uniqueTeammates: row.teammates.size,
      uniqueOpponents: row.opponents.size,
      componentId: component?.id || null,
      componentSize: component?.size || 0
    });
  }
  return Object.freeze({
    players: Object.freeze(playerStats),
    components: Object.freeze(components),
    componentByPlayer
  });
}

function normalizeResearchDataset(rawMatches, { queueId = QUEUE_ID } = {}) {
  const accepted = [];
  const rejected = [];
  const seen = new Set();
  let duplicateCount = 0;

  for (const raw of Array.isArray(rawMatches) ? rawMatches : []) {
    const explicitQueue = explicitQueueId(raw);
    if (explicitQueue !== null && explicitQueue !== Number(queueId)) {
      rejected.push(Object.freeze({ reason: 'NON_STANDARD_ARAM', queueId: explicitQueue, matchId: asString(raw?.matchId ?? raw?.gameId ?? raw?.id) || null }));
      continue;
    }
    const normalized = normalizeOne(raw, queueId);
    if (!normalized) {
      rejected.push(Object.freeze({ reason: 'INVALID_MATCH', queueId: explicitQueue, matchId: asString(raw?.matchId ?? raw?.gameId ?? raw?.id) || null }));
      continue;
    }
    if (normalized.queueId !== Number(queueId)) {
      rejected.push(Object.freeze({ reason: 'NON_STANDARD_ARAM', queueId: normalized.queueId, matchId: normalized.matchId }));
      continue;
    }
    if (seen.has(normalized.matchId)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(normalized.matchId);
    accepted.push(enrichMatch(normalized));
  }

  accepted.sort((a, b) => a.timestamp - b.timestamp || a.matchId.localeCompare(b.matchId));
  const graph = buildGraph(accepted);
  return Object.freeze({
    queueId: Number(queueId),
    matches: Object.freeze(accepted),
    acceptedCount: accepted.length,
    duplicateCount,
    rejected: Object.freeze(rejected),
    rejectedCount: rejected.length,
    graph
  });
}

module.exports = {
  QUEUE_ID,
  normalizeResearchDataset,
  buildGraph,
  production_active: false,
  automatic_promotion: false
};
