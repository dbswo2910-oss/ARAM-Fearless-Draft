from __future__ import annotations

from collections import defaultdict, deque
from copy import deepcopy


class WinRateState:
    def __init__(self, recent_n: int = 10):
        self.wins = defaultdict(float)
        self.games = defaultdict(int)
        self.recent = defaultdict(lambda: deque(maxlen=recent_n))
        self.recent_n = int(recent_n)

    def clone(self):
        return deepcopy(self)

    def update_match(self, match):
        for pid in match.team_a:
            self.games[pid] += 1
            self.wins[pid] += 1.0 if match.team_a_win else 0.0
            self.recent[pid].append(1.0 if match.team_a_win else 0.0)
        for pid in match.team_b:
            self.games[pid] += 1
            self.wins[pid] += 0.0 if match.team_a_win else 1.0
            self.recent[pid].append(0.0 if match.team_a_win else 1.0)

    def player_rate(self, pid, kind='historical'):
        if kind == 'recent':
            rows = list(self.recent.get(pid) or ())
            # Beta(1,1) smoothing limits unstable first-game extremes.
            return (sum(rows) + 1.0) / (len(rows) + 2.0), len(rows)
        n = self.games.get(pid, 0)
        return (self.wins.get(pid, 0.0) + 1.0) / (n + 2.0), n

    def team_rate(self, team, kind='historical'):
        values = [self.player_rate(pid, kind)[0] for pid in team]
        return sum(values) / max(1, len(values))

    def predict(self, team_a, team_b, kind='historical'):
        a = self.team_rate(team_a, kind)
        b = self.team_rate(team_b, kind)
        # Symmetric 0.5-centered mapping. Difference in smoothed team rates is
        # intentionally conservative and does not use performance statistics.
        p = 0.5 + 0.5 * (a - b)
        return max(1e-9, min(1.0 - 1e-9, p)), a, b


def train_state(matches, recent_n=10):
    state = WinRateState(recent_n=recent_n)
    for m in sorted(matches, key=lambda x: (x.game_datetime, x.match_id)):
        state.update_match(m)
    return state


def predict_baseline(train, test, kind='historical', mode='frozen', recent_n=10):
    if kind not in {'historical', 'recent'}:
        raise ValueError(kind)
    if mode not in {'frozen', 'walk_forward'}:
        raise ValueError(mode)
    state = train_state(train, recent_n=recent_n)
    seen = set(state.games)
    preds = []
    for m in sorted(test, key=lambda x: (x.game_datetime, x.match_id)):
        p, ra, rb = state.predict(m.team_a, m.team_b, kind=kind)
        players = list(m.team_a) + list(m.team_b)
        known = sum(pid in seen for pid in players)
        preds.append({
            'match_id': m.match_id,
            'time': m.game_datetime,
            'patch': m.patch,
            'prob': p,
            'actual': 1 if m.team_a_win else 0,
            'team_a_rating': ra,
            'team_b_rating': rb,
            'rating_diff': (ra - rb) * 400.0,
            'known_players': known,
            'cold_start_players': 10 - known,
        })
        if mode == 'walk_forward':
            state.update_match(m)
            seen.update(players)
    return preds


def constant_predictions(test, probability=0.5):
    p = float(probability)
    return [{
        'match_id': m.match_id,
        'time': m.game_datetime,
        'patch': m.patch,
        'prob': p,
        'actual': 1 if m.team_a_win else 0,
        'team_a_rating': 0.0,
        'team_b_rating': 0.0,
        'rating_diff': 0.0,
        'known_players': 0,
        'cold_start_players': 10,
    } for m in test]
