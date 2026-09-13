from __future__ import annotations

import json
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
V01 = ROOT / 'research' / 'aram-rating-v01'
V03 = ROOT / 'research' / 'aram-rating-v03'
sys.path.insert(0, str(V01))
sys.path.insert(0, str(V03))

from synthetic import generate_matches
from phase_b import HARD_CAP, _ordered_unique_matches, _snapshot_points, run_phase_b


def main() -> None:
    assert HARD_CAP == 500
    assert _snapshot_points(20, 500) == [20, 100, 250, 500]
    assert _snapshot_points(20, 167) == [20, 100, 167]

    rows = generate_matches(120, 160, 20260914, start_ms=1760000000000)
    for row in rows:
        row['patch'] = '26.18.1'
        row['source'] = 'synthetic_fixture_only'

    payload = {
        'schema': 'aram-rating-phase-b-real-sample-v03',
        'metadata': {
            'source': 'synthetic_fixture_only',
            'fixture_only': True,
            'region': 'KR',
            'queue': 450,
            'phase': 'B1',
            'status': 'phase_complete',
            'seed_matches': 20,
            'accepted_matches': 120,
        },
        'safety_limits': {
            'max_expanded_players': 10,
            'max_matches_per_player': 20,
            'max_total_accepted_matches': 500,
            'max_request_count': 30,
            'retry_limit': 2,
        },
        'capability_probe': {'requested_limit': 30, 'returned_standard_matches': 20, 'pagination_exposed': False},
        'kpis': {
            'before': {'matches': 20, 'single_match_fraction': 0.90, 'players_2_plus': 10, 'players_5_plus': 0, 'players_10_plus': 0},
            'after': {'matches': 120, 'single_match_fraction': 0.60, 'players_2_plus': 50, 'players_5_plus': 12, 'players_10_plus': 2},
        },
        'expansion_logs': [
            {'candidate': 'Player 001', 'requests': 1, 'fetched_matches': 20, 'new_unique_matches': 12, 'duplicates': 8,
             'new_players': 5, 'already_known_player_appearances': 70, 'information_gain': 80.0}
        ],
        'acceptance_order_match_ids': [row['match_id'] for row in rows],
        'matches': rows,
    }

    capped, cap_stats = _ordered_unique_matches({**payload, 'matches': rows * 5,
                                                  'acceptance_order_match_ids': [r['match_id'] for r in rows]})
    assert len(capped) == 120
    assert cap_stats['duplicate_rows_ignored'] == 480

    many = []
    for i in range(520):
        clone = dict(rows[i % len(rows)])
        clone['match_id'] = f'cap-{i:04d}'
        many.append(clone)
    capped2, cap_stats2 = _ordered_unique_matches({'matches': many})
    assert len(capped2) == 500 and cap_stats2['hard_cap_applied'] is True

    with tempfile.TemporaryDirectory(prefix='aram-rating-v03-audit-') as td:
        td = Path(td)
        source = td / 'phase-b-fixture.json'
        out = td / 'result'
        source.write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8')
        result = run_phase_b(source, out, min_test_matches=100)
        report = result['report']
        assert report['real_data'] is False
        assert report['fixture_only'] is True
        assert report['snapshot_points'] == [20, 100, 120]
        assert report['player_facing_rating_enabled'] is False
        assert report['privacy']['aggregate_contains_puuid'] is False
        assert len(report['timeline']) == 3
        assert report['timeline'][1]['matches'] == 100
        assert all(x['evaluation']['selection']['status'] == 'insufficient_for_model_selection' for x in report['timeline'])
        assert set(report['timeline'][1]['evaluation']['models']) == {'elo', 'glicko', 'trueskill_family'}
        assert set(report['timeline'][1]['evaluation']['baselines']) >= {'constant_50', 'historical_winrate', 'recent_winrate'}
        aggregate_text = Path(result['path']).read_text(encoding='utf-8')
        assert 'syn-puuid-' not in aggregate_text

    audit = {
        'status': 'PASS',
        'fixture_only': True,
        'real_performance_claimed': False,
        'snapshot_points_verified': [20, 100, 250, 500],
        'end_to_end_fixture_snapshots': [20, 100, 120],
        'hard_cap': 500,
        'model_selection_under_500': 'insufficient_for_model_selection',
        'player_facing_rating_enabled': False,
    }
    (ROOT / 'audit-output').mkdir(exist_ok=True)
    (ROOT / 'audit-output' / 'aram-rating-v03-report.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(audit, ensure_ascii=False))


if __name__ == '__main__':
    main()
