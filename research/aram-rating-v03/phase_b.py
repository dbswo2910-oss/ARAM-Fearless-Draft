from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from datetime import datetime
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
V02 = HERE.parent / 'aram-rating-v02'
sys.path.insert(0, str(V02))

from data_audit import AuditConfig, audit_records  # type: ignore
from phase_a import run_phase_a  # type: ignore

HARD_CAP = 500
SNAPSHOT_THRESHOLDS = (100, 250, 500)


def _default_output_dir() -> Path:
    stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    return HERE / 'data' / f'phase-b-eval-{stamp}'


def _match_id(row: dict) -> str:
    for root in (row, row.get('game') or {}, row.get('match') or {}, row.get('data') or {}, row.get('raw') or {}, row.get('info') or {}):
        for key in ('match_id', 'matchId', 'gameId', 'id'):
            value = root.get(key) if isinstance(root, dict) else None
            if value not in (None, ''):
                return str(value)
    return ''


def _ordered_unique_matches(payload: dict) -> tuple[list[dict], dict]:
    rows = [x for x in (payload.get('matches') or []) if isinstance(x, dict)]
    by_id: dict[str, dict] = {}
    duplicates = 0
    for row in rows:
        mid = _match_id(row)
        if not mid:
            continue
        if mid in by_id:
            duplicates += 1
            continue
        by_id[mid] = row

    order = [str(x) for x in (payload.get('acceptance_order_match_ids') or []) if str(x)]
    ordered: list[dict] = []
    used: set[str] = set()
    for mid in order:
        if mid in by_id and mid not in used:
            ordered.append(by_id[mid]); used.add(mid)
    for mid, row in by_id.items():
        if mid not in used:
            ordered.append(row); used.add(mid)

    original_unique = len(ordered)
    ordered = ordered[:HARD_CAP]
    return ordered, {
        'input_rows': len(rows),
        'input_unique_match_ids': original_unique,
        'duplicate_rows_ignored': duplicates,
        'hard_cap': HARD_CAP,
        'hard_cap_applied': original_unique > HARD_CAP,
        'accepted_for_evaluation': len(ordered),
    }


def _snapshot_points(seed_matches: int, total: int) -> list[int]:
    points: list[int] = []
    if seed_matches > 0:
        points.append(min(seed_matches, total))
    for n in SNAPSHOT_THRESHOLDS:
        if n <= total:
            points.append(n)
    if total > 0:
        points.append(total)
    return sorted(set(n for n in points if n > 0))


def _median(xs: list[int]) -> float:
    if not xs:
        return 0.0
    ys = sorted(xs); n = len(ys)
    return float(ys[n // 2]) if n % 2 else (ys[n // 2 - 1] + ys[n // 2]) / 2.0


def _network_kpis(accepted: list[dict]) -> dict:
    counts: Counter[str] = Counter()
    adj: dict[str, set[str]] = defaultdict(set)
    for match in accepted:
        puuids = [str(p.get('puuid') or '').strip() for p in (match.get('participants') or [])]
        puuids = list(dict.fromkeys(x for x in puuids if x))
        for p in puuids:
            counts[p] += 1; adj.setdefault(p, set())
        for i, a in enumerate(puuids):
            for b in puuids[i + 1:]:
                adj[a].add(b); adj[b].add(a)
    vals = list(counts.values()); players = len(vals)
    seen: set[str] = set(); giant = 0; components = 0
    for p in adj:
        if p in seen:
            continue
        components += 1; size = 0; stack = [p]; seen.add(p)
        while stack:
            cur = stack.pop(); size += 1
            for nxt in adj[cur]:
                if nxt not in seen:
                    seen.add(nxt); stack.append(nxt)
        giant = max(giant, size)
    singles = sum(v == 1 for v in vals)
    return {
        'matches': len(accepted),
        'players': players,
        'average_matches_per_player': (sum(vals) / players) if players else 0.0,
        'median_matches_per_player': _median(vals),
        'single_match_players': singles,
        'single_match_player_fraction': (singles / players) if players else 0.0,
        'players_2_plus': sum(v >= 2 for v in vals),
        'players_5_plus': sum(v >= 5 for v in vals),
        'players_10_plus': sum(v >= 10 for v in vals),
        'component_count': components,
        'largest_component_players': giant,
        'largest_component_fraction': (giant / players) if players else 0.0,
    }


def _cold_start_fraction(groups: dict | None) -> float | None:
    groups = groups or {}
    total = sum(int((v or {}).get('n') or 0) for v in groups.values())
    if not total:
        return None
    no_cold = int((groups.get('no_cold_start') or {}).get('n') or 0)
    return (total - no_cold) / total


def _metric_view(row: dict | None) -> dict:
    row = row or {}
    return {k: row.get(k) for k in ('n', 'accuracy', 'log_loss', 'brier', 'ece')}


def _evaluation_summary(report: dict) -> dict:
    models = report.get('models') or {}
    baselines = report.get('baselines') or {}
    first_model = next(iter(models.values()), {})
    model_out = {}
    for name, row in models.items():
        model_out[name] = {
            'frozen': _metric_view(row.get('frozen')),
            'walk_forward': _metric_view(row.get('walk_forward')),
            'uncertainty_by_games': row.get('uncertainty_by_games') or [],
        }
    baseline_out = {}
    for name, row in baselines.items():
        baseline_out[name] = {
            'frozen': _metric_view(row.get('frozen')),
            'walk_forward': _metric_view(row.get('walk_forward')),
        }
    return {
        'sample_size': (report.get('actual_data') or {}).get('matches', 0),
        'frozen_cold_start_fraction': _cold_start_fraction(first_model.get('frozen_cold_start')),
        'walk_forward_cold_start_fraction': _cold_start_fraction(first_model.get('walk_forward_cold_start')),
        'models': model_out,
        'baselines': baseline_out,
        'selection': report.get('conclusion') or {},
    }


def _is_fixture(metadata: dict) -> bool:
    source = str(metadata.get('source') or '').lower()
    return bool(metadata.get('fixture_only') is True or 'synthetic' in source or 'fixture' in source)


def _write_snapshot_input(rows: list[dict], path: Path, source_metadata: dict) -> None:
    fixture_only = _is_fixture(source_metadata)
    envelope = {
        'schema': 'aram-rating-phase-b-snapshot-input-v03',
        'metadata': {
            'source': 'synthetic_fixture_only' if fixture_only else 'phase_b_local_collector_snapshot',
            'fixture_only': fixture_only,
            'region': 'KR',
            'queue': 450,
            'match_count': len(rows),
            'collector_status': source_metadata.get('status'),
        },
        'matches': rows,
    }
    path.write_text(json.dumps(envelope, ensure_ascii=False), encoding='utf-8')


def run_phase_b(input_path: str | Path, output_dir: str | Path | None = None,
                min_duration: int = 180, min_test_matches: int = 100) -> dict:
    input_path = Path(input_path)
    payload = json.loads(input_path.read_text(encoding='utf-8'))
    if not isinstance(payload, dict):
        raise ValueError('Phase B input must be a JSON object')
    schema = str(payload.get('schema') or '')
    if not schema.startswith('aram-rating-phase-b-'):
        raise ValueError(f'unrecognized Phase B schema: {schema!r}')

    ordered, input_stats = _ordered_unique_matches(payload)
    if not ordered:
        raise ValueError('no matches available for Phase B evaluation')

    metadata = payload.get('metadata') or {}
    fixture_only = _is_fixture(metadata)
    seed_matches = int(metadata.get('seed_matches') or ((payload.get('kpis') or {}).get('before') or {}).get('matches') or 20)
    out = Path(output_dir) if output_dir else _default_output_dir()
    out.mkdir(parents=True, exist_ok=True)

    points = _snapshot_points(seed_matches, len(ordered))
    timeline = []
    for n in points:
        snapshot_dir = out / f'snapshot-{n:03d}'
        snapshot_dir.mkdir(parents=True, exist_ok=True)
        snapshot_input = snapshot_dir / 'phase-b-snapshot.local.json'
        _write_snapshot_input(ordered[:n], snapshot_input, metadata)
        result = run_phase_a(snapshot_input, snapshot_dir / 'phase-a', min_duration=min_duration, min_test_matches=min_test_matches)
        report = result['report']
        accepted, audit = audit_records(ordered[:n], AuditConfig(min_duration_seconds=min_duration, future_grace_seconds=300, require_patch=True))
        timeline.append({
            'matches': n,
            'formal_gate': n in SNAPSHOT_THRESHOLDS,
            'network': _network_kpis(accepted),
            'evaluation': _evaluation_summary(report),
            'data_quality': {
                'accepted': audit.get('accepted_count', 0),
                'rejected': audit.get('rejected_count', 0),
                'duplicates': audit.get('duplicate_count', 0),
                'reject_reasons': audit.get('reject_reasons') or {},
            },
        })

    before = (payload.get('kpis') or {}).get('before') or (timeline[0]['network'] if timeline else {})
    after = (payload.get('kpis') or {}).get('after') or (timeline[-1]['network'] if timeline else {})
    direction = {
        'single_match_fraction_down': float(after.get('single_match_fraction', after.get('single_match_player_fraction', 1)) or 0) < float(before.get('single_match_fraction', before.get('single_match_player_fraction', 1)) or 0),
        'players_2_plus_up': int(after.get('players_2_plus') or 0) > int(before.get('players_2_plus') or 0),
        'players_5_plus_up': int(after.get('players_5_plus') or 0) > int(before.get('players_5_plus') or 0),
        'players_10_plus_up': int(after.get('players_10_plus') or 0) > int(before.get('players_10_plus') or 0),
    }

    aggregate = {
        'schema': 'aram-rating-phase-b-evaluation-v03',
        'source_file': input_path.name,
        'collector_status': metadata.get('status'),
        'real_data': not fixture_only,
        'fixture_only': fixture_only,
        'input': input_stats,
        'snapshot_points': points,
        'timeline': timeline,
        'repeat_observation_direction': direction,
        'expansion_efficiency': payload.get('expansion_logs') or [],
        'capability_probe': payload.get('capability_probe') or {},
        'safety_limits': payload.get('safety_limits') or {},
        'privacy': {
            'aggregate_contains_puuid': False,
            'aggregate_contains_riot_id': False,
            'raw_collector_file_and_snapshot_outputs_are_local_sensitive_data': True,
        },
        'player_facing_rating_enabled': False,
        'selection_policy': 'Preserve v0.2 candidate gate. 500 matches does not force a winner.',
    }
    aggregate_path = out / 'phase-b-snapshots.json'
    aggregate_path.write_text(json.dumps(aggregate, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({
        'collector_status': metadata.get('status'),
        'real_data': not fixture_only,
        'fixture_only': fixture_only,
        'accepted_for_evaluation': input_stats['accepted_for_evaluation'],
        'snapshots': points,
        'repeat_observation_direction': direction,
        'report': str(aggregate_path),
    }, ensure_ascii=False, indent=2))
    return {'report': aggregate, 'path': str(aggregate_path), 'output_dir': str(out)}


def main() -> None:
    p = argparse.ArgumentParser(description='ARAM Rating v0.3 Phase B — bounded real-network snapshot evaluation')
    p.add_argument('phase_b_json', help='Local JSON exported by phase-b-expansion-devtools.js')
    p.add_argument('--output-dir', help='Ignored local output directory under research/aram-rating-v03/data by default')
    p.add_argument('--min-duration', type=int, default=180)
    p.add_argument('--min-test-matches', type=int, default=100)
    args = p.parse_args()
    run_phase_b(args.phase_b_json, args.output_dir, args.min_duration, args.min_test_matches)


if __name__ == '__main__':
    main()
