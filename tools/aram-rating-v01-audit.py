from __future__ import annotations

import json
import math
from pathlib import Path
import sqlite3
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
V01 = ROOT / 'research' / 'aram-rating-v01'
sys.path.insert(0, str(V01))

from storage import connect, init_db, insert_match, audit_dataset, database_stats, load_matches, Frontier
from synthetic import generate_matches
from evaluation import evaluate_models
from experiment import candidate_decision
from program_import import normalize_current_program_game


def check(name: str, condition: bool, detail=None):
    if not condition:
        raise AssertionError(f'{name}: {detail!r}')
    return {'name': name, 'ok': True, 'detail': detail}


def synthetic_smoke(tmp: Path):
    db_path = tmp / 'synthetic.db'
    db = connect(db_path)
    init_db(db, V01 / 'schema.sql')
    rows = generate_matches(700, 160, 20260914)
    for row in rows:
        insert_match(db, row, source='synthetic-audit')

    checks = []
    stats = database_stats(db)
    checks += [
        check('synthetic matches', stats['matches'] == 700, stats),
        check('synthetic players', stats['players'] == 160, stats),
        check('synthetic participant rows', stats['match_players'] == 7000, stats),
        check('dataset audit', audit_dataset(db)['ok'] is True, audit_dataset(db)),
    ]

    dup = insert_match(db, rows[0], source='synthetic-audit')
    checks.append(check('duplicate match rejected', dup['inserted'] is False, dup))

    bad_queue = dict(rows[0])
    bad_queue['match_id'] = 'KR_SYN_BAD_QUEUE'
    bad_queue['queue_id'] = 2400
    try:
        insert_match(db, bad_queue, source='synthetic-audit')
        raise AssertionError('queue 2400 unexpectedly accepted')
    except ValueError as exc:
        checks.append(check('Mayhem/non-450 rejected', 'not standard ARAM 450' in str(exc), str(exc)))

    missing = json.loads(json.dumps(rows[0]))
    missing['match_id'] = 'KR_SYN_MISSING_PUUID'
    missing['participants'][0].pop('puuid', None)
    try:
        insert_match(db, missing, source='synthetic-audit')
        raise AssertionError('missing PUUID unexpectedly accepted')
    except ValueError as exc:
        checks.append(check('missing PUUID rejected', 'missing puuid' in str(exc), str(exc)))

    matches = load_matches(db)
    report = evaluate_models(matches, 0.8)
    ds = report['dataset']
    checks += [
        check('chronological train count', ds['train'] == 560, ds),
        check('chronological test count', ds['test'] == 140, ds),
        check('train/test overlap false', report['leakage_checks']['train_test_match_overlap'] is False, report['leakage_checks']),
        check('chronological order true', report['leakage_checks']['chronological_order'] is True, report['leakage_checks']),
        check('pre-match prediction contract', report['leakage_checks']['predictions_use_pre_match_state'] is True, report['leakage_checks']),
        check('no current rating for past prediction', report['leakage_checks']['current_rating_used_for_past_prediction'] is False, report['leakage_checks']),
        check('50/50 baseline log loss', abs(report['baseline']['log_loss'] - math.log(2)) < 1e-12, report['baseline']),
        check('50/50 baseline brier', abs(report['baseline']['brier'] - 0.25) < 1e-12, report['baseline']),
    ]

    expected = {
        'elo': 0.651867,
        'glicko': 0.651378,
        'trueskill_family': 0.632297,
    }
    for model, target in expected.items():
        frozen = report['models'][model]['frozen']
        walk = report['models'][model]['walk_forward']
        checks += [
            check(f'{model} frozen n', frozen['n'] == 140, frozen),
            check(f'{model} walk n', walk['n'] == 140, walk),
            check(f'{model} frozen finite log loss', math.isfinite(frozen['log_loss']), frozen),
            check(f'{model} frozen finite brier', math.isfinite(frozen['brier']), frozen),
            check(f'{model} frozen finite ece', math.isfinite(frozen['ece']), frozen),
            check(f'{model} deterministic smoke log loss', abs(frozen['log_loss'] - target) < 5e-7, frozen['log_loss']),
        ]

    checks.append(check('selection remains no_clear_winner', report['selection']['recommendation'] == 'no_clear_winner', report['selection']))
    decision = candidate_decision(report, 'glicko', 'trueskill_family', min_test_matches=100)
    checks.append(check('candidate gate does not over-promote', decision['decision'] == 'reject_or_keep_experimental', decision))

    # Frontier persistence-only smoke: no network I/O is performed.
    f = Frontier(db, max_matches=10000, max_players=50000, max_depth=3, max_calls=100)
    checks.append(check('frontier enqueue', f.enqueue('frontier-puuid-1', 0) is True, f.checkpoint()))
    claimed = f.claim()
    checks.append(check('frontier claim', bool(claimed and claimed['puuid'] == 'frontier-puuid-1'), claimed))
    f.mark_done('frontier-puuid-1', calls_used=1)
    checks.append(check('frontier checkpoint call count', int(f.checkpoint()['calls_used']) >= 1, f.checkpoint()))

    db.close()
    return checks, report


def import_adapter_smoke():
    participants = []
    identities = []
    for i in range(1, 11):
        team = 100 if i <= 5 else 200
        win = i <= 5
        identities.append({'participantId': i, 'player': {'puuid': f'PUUID-{i}', 'gameName': f'P{i}', 'tagLine': 'KR1'}})
        participants.append({
            'participantId': i,
            'teamId': team,
            'championId': i,
            'stats': {
                'win': win,
                'kills': i,
                'deaths': 11 - i,
                'assists': 10 + i,
                'totalDamageDealtToChampions': 10000 + i,
                'totalDamageTaken': 9000 + i,
                'totalHeal': 100 + i,
                'goldEarned': 8000 + i,
            },
        })
    raw = {
        'gameId': 123456789,
        'queueId': 450,
        'gameCreation': 1760000000000,
        'gameDuration': 1200,
        'gameVersion': '26.18.1',
        'participantIdentities': identities,
        'participants': participants,
    }
    row = normalize_current_program_game(raw)
    checks = [
        check('program adapter match id', row['match_id'] == '123456789', row['match_id']),
        check('program adapter queue', row['queue_id'] == 450, row['queue_id']),
        check('program adapter participant count', len(row['participants']) == 10, len(row['participants'])),
        check('program adapter stable PUUID', all(p.get('puuid') for p in row['participants']), row['participants'][0]),
    ]
    return checks


def isolation_checks():
    manifest = json.loads((ROOT / 'update' / 'manifest.json').read_text(encoding='utf-8'))
    checks = [
        check('active manifest remains v0.15.128', manifest.get('version') == '0.15.128', manifest.get('version')),
        check('research module not shipped in manifest', not any('aram-rating' in str(x).lower() for x in manifest.get('files', [])), None),
        check('research module not player-facing', json.loads((V01 / 'RESEARCH_STATUS.json').read_text(encoding='utf-8'))['runtime_integration']['enabled'] is False, None),
    ]
    return checks


def main():
    all_checks = []
    with tempfile.TemporaryDirectory(prefix='aram-rating-v01-audit-') as td:
        smoke, report = synthetic_smoke(Path(td))
        all_checks.extend(smoke)
    all_checks.extend(import_adapter_smoke())
    all_checks.extend(isolation_checks())

    result = {
        'version': '0.1-research-foundation',
        'status': 'PASS',
        'checks': len(all_checks),
        'synthetic_only': True,
        'real_kr_matches': 0,
        'selection': report['selection'],
        'items': all_checks,
    }
    out = ROOT / 'audit-output' / 'aram-rating-v01-report.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': result['status'], 'checks': result['checks'], 'selection': result['selection']['recommendation']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
