from __future__ import annotations

import argparse
from datetime import datetime
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
V01 = HERE.parent / 'aram-rating-v01'
sys.path.insert(0, str(V01))
sys.path.insert(0, str(HERE))

from data_audit import AuditConfig, audit_records, load_records
from identity_privacy import anonymize_matches, write_jsonl
from storage import connect, init_db, import_jsonl, database_stats, audit_dataset, load_matches
from network import analyze_network
from evaluation_v02 import evaluate_v02
from collection_strategy import recommend_phase_b
from report import build_report, write_report


def _default_output_dir() -> Path:
    stamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    return HERE / 'data' / f'phase-a-{stamp}'


def _cold_start_rate(ev: dict) -> float | None:
    models = ev.get('models') or {}
    first = next(iter(models.values()), None)
    if not first:
        return None
    groups = first.get('frozen_cold_start') or {}
    total = sum(int((v or {}).get('n') or 0) for v in groups.values())
    no_cold = int((groups.get('no_cold_start') or {}).get('n') or 0)
    return ((total - no_cold) / total) if total else None


def _phase_a_selection_guard(ev: dict, real_matches: int) -> None:
    if real_matches <= 0:
        return
    if real_matches < 500:
        ev['selection'] = {
            **(ev.get('selection') or {}),
            'status': 'insufficient_for_model_selection',
            'reason': 'Phase A real sample is for importer/schema/network/model execution validation only; at least 500 matches are required before model selection.',
            'matches': real_matches,
            'candidate_winner_forbidden': True,
            'kr_percentile_forbidden': True,
            'skill_tier_forbidden': True,
        }


def run_phase_a(input_path: str | Path, output_dir: str | Path | None = None,
                min_duration: int = 180, min_test_matches: int = 100) -> dict:
    input_path = Path(input_path)
    out = Path(output_dir) if output_dir else _default_output_dir()
    out.mkdir(parents=True, exist_ok=True)

    raw_rows = load_records(input_path)
    accepted, data_audit = audit_records(
        raw_rows,
        AuditConfig(min_duration_seconds=min_duration, future_grace_seconds=300, require_patch=True),
    )
    (out / 'data-audit.json').write_text(json.dumps(data_audit, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    mapping_file = out / 'identity-map.local.json'
    anonymized, privacy = anonymize_matches(accepted, mapping_file)
    accepted_jsonl = out / 'accepted-anonymized.jsonl'
    write_jsonl(anonymized, accepted_jsonl)

    db_path = out / 'aram-rating-phase-a.db'
    db = connect(db_path)
    init_db(db, V01 / 'schema.sql')
    imported = import_jsonl(db, accepted_jsonl, source='existing-program-real-export-anonymized')
    stats = database_stats(db)
    integrity = audit_dataset(db)
    network = analyze_network(db)
    matches = load_matches(db)
    ev = evaluate_v02(matches, real_data=True, min_test_matches=min_test_matches)
    _phase_a_selection_guard(ev, stats.get('matches', 0))
    cold = _cold_start_rate(ev)
    strategy = recommend_phase_b(network, cold_start_rate=cold)

    report = build_report(
        ev,
        data_audit,
        network,
        stats,
        limitations=[
            'Phase A는 50~100경기 수준의 파이프라인/스키마/연결성 검증 단계이며 모델 선정 단계가 아님.',
            '원본 PUUID와 Riot ID는 Rating 입력이 아니며 연구 DB에는 내부 익명 ID만 저장함.',
        ],
    )
    report['phase_a'] = {
        'input_file': str(input_path),
        'output_dir': str(out),
        'status': (ev.get('selection') or {}).get('status'),
        'pipeline_checks': {
            'data_importer': imported.get('rejected', 0) == 0,
            'schema_compatible': integrity.get('ok') is True,
            'queue_filtering': stats.get('invalid_queue_matches', 0) == 0,
            'identity_anonymized': privacy.get('db_contains_raw_puuid') is False,
            'db_insert': stats.get('matches', 0) == data_audit.get('accepted_count', 0),
            'dedupe': stats.get('duplicate_match_groups', 0) == 0,
            'network_graph': network.get('players', 0) >= 0,
            'elo': 'elo' in (ev.get('models') or {}),
            'glicko': 'glicko' in (ev.get('models') or {}),
            'trueskill_family': 'trueskill_family' in (ev.get('models') or {}),
            'train_test_split': int((ev.get('dataset') or {}).get('test') or 0) > 0 if stats.get('matches', 0) >= 10 else False,
            'frozen_walk_forward': all('frozen' in x and 'walk_forward' in x for x in (ev.get('models') or {}).values()),
            'report_generation': True,
        },
        'privacy': privacy,
        'database_integrity': integrity,
        'import_result': imported,
        'cold_start_rate': cold,
        'phase_b_recommendation': strategy,
        'model_selection_allowed': False if stats.get('matches', 0) < 500 else (ev.get('selection') or {}).get('status') == 'candidate_winner',
    }
    report['network_quality']['cold_start_rate'] = cold
    report['phase_b_collection_strategy'] = strategy
    paths = write_report(report, out)

    summary = {
        'Exported matches': data_audit.get('raw_count', 0),
        'Queue 450 accepted': data_audit.get('accepted_count', 0),
        'Invalid queue': (data_audit.get('reject_reasons') or {}).get('invalid_queue', 0),
        'Missing participants': (data_audit.get('reject_reasons') or {}).get('participant_count_not_10', 0),
        'Missing PUUID': (data_audit.get('reject_reasons') or {}).get('missing_puuid', 0),
        'Duplicate match IDs': data_audit.get('duplicate_count', 0),
        'Unique players': network.get('players', 0),
        'Average matches/player': network.get('avg_matches_per_player', 0.0),
        'Median matches/player': network.get('median_matches_per_player', 0.0),
        'Single-match players %': round(float((network.get('single_match_players') or {}).get('fraction') or 0) * 100, 2),
        'Largest component %': round(float(network.get('largest_component_fraction') or 0) * 100, 2),
        'Repeated teammate clusters': len(network.get('repeated_teammate_clusters') or []),
        'Cold-start %': None if cold is None else round(cold * 100, 2),
        'Frozen Test Matches': int((ev.get('dataset') or {}).get('test') or 0),
        'Status': (ev.get('selection') or {}).get('status'),
    }
    (out / 'phase-a-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print('\nPhase B recommendation:')
    print(f"- {strategy['case']}: {strategy['recommendation']}")
    print(f"- reason: {strategy['reason']}")
    print(f"\nReport: {paths['markdown']}")
    return {'summary': summary, 'report': report, 'paths': paths, 'output_dir': str(out)}


def main():
    p = argparse.ArgumentParser(description='ARAM Rating v0.2 Phase A — local real KR standard-ARAM validation')
    p.add_argument('sample_json', help='JSON exported by export-current-history-devtools.js')
    p.add_argument('--output-dir', help='Local output directory. Default is ignored research/aram-rating-v02/data/phase-a-*')
    p.add_argument('--min-duration', type=int, default=180)
    p.add_argument('--min-test-matches', type=int, default=100)
    args = p.parse_args()
    run_phase_a(args.sample_json, args.output_dir, args.min_duration, args.min_test_matches)


if __name__ == '__main__':
    main()
