from __future__ import annotations

from collections import Counter, defaultdict
from itertools import combinations
import sqlite3


class UnionFind:
    def __init__(self):
        self.parent = {}
        self.size = {}

    def add(self, x):
        if x not in self.parent:
            self.parent[x] = x
            self.size[x] = 1

    def find(self, x):
        self.add(x)
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]


def analyze_network(db: sqlite3.Connection, repeated_limit: int = 30) -> dict:
    rows = db.execute(
        """SELECT mp.match_id,mp.player_id,mp.team_id,m.game_datetime
           FROM match_players mp JOIN matches m ON m.match_id=mp.match_id
           WHERE m.queue_id=450
           ORDER BY m.game_datetime,m.match_id,mp.team_id,mp.player_id"""
    ).fetchall()

    by_match = defaultdict(list)
    player_games = Counter()
    teammate_pairs = Counter()
    uf = UnionFind()
    for r in rows:
        mid = str(r['match_id'])
        pid = int(r['player_id'])
        team = int(r['team_id'])
        by_match[mid].append((pid, team))
        player_games[pid] += 1
        uf.add(pid)

    for participants in by_match.values():
        pids = [p for p, _ in participants]
        if pids:
            anchor = pids[0]
            for pid in pids[1:]:
                uf.union(anchor, pid)
        teams = defaultdict(list)
        for pid, tid in participants:
            teams[tid].append(pid)
        for ids in teams.values():
            for a, b in combinations(sorted(ids), 2):
                teammate_pairs[(a, b)] += 1

    components = Counter()
    for pid in player_games:
        components[uf.find(pid)] += 1
    comp_sizes = sorted(components.values(), reverse=True)
    total_players = len(player_games)
    counts = list(player_games.values())

    def pct(n):
        return n / total_players if total_players else 0.0

    one = sum(n == 1 for n in counts)
    two_five = sum(2 <= n <= 5 for n in counts)
    ten_plus = sum(n >= 10 for n in counts)
    repeated = [
        {'player_a': a, 'player_b': b, 'same_team_matches': n,
         'label': 'repeated teammate cluster (not confirmed party)'}
        for (a, b), n in teammate_pairs.most_common(repeated_limit) if n >= 2
    ]

    return {
        'matches': len(by_match),
        'players': total_players,
        'participant_rows': len(rows),
        'avg_matches_per_player': (sum(counts) / total_players) if total_players else 0.0,
        'median_matches_per_player': _median(counts),
        'single_match_players': {'n': one, 'fraction': pct(one)},
        'two_to_five_match_players': {'n': two_five, 'fraction': pct(two_five)},
        'ten_plus_match_players': {'n': ten_plus, 'fraction': pct(ten_plus)},
        'component_count': len(comp_sizes),
        'largest_component_players': comp_sizes[0] if comp_sizes else 0,
        'largest_component_fraction': (comp_sizes[0] / total_players) if comp_sizes and total_players else 0.0,
        'component_sizes_top20': comp_sizes[:20],
        'repeated_teammate_clusters': repeated,
        'party_inference_used_for_rating': False,
    }


def _median(values):
    xs = sorted(values)
    if not xs:
        return 0.0
    n = len(xs)
    if n % 2:
        return float(xs[n // 2])
    return (xs[n // 2 - 1] + xs[n // 2]) / 2.0
