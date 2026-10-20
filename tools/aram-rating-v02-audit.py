from __future__ import annotations

import copy
import json
from pathlib import Path
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[1]
V01=ROOT/'research'/'aram-rating-v01';V02=ROOT/'research'/'aram-rating-v02'
sys.path.insert(0,str(V01));sys.path.insert(0,str(V02))

from synthetic import generate_matches
from storage import connect,init_db,insert_match,load_matches,database_stats
from data_audit import AuditConfig,audit_records
from network import analyze_network
from baselines import constant_predictions,predict_baseline
from evaluation_v02 import evaluate_v02,favorite_calibration,cold_start_metrics
from report import build_report,write_report


def ok(name,condition,detail=None):
    if not condition:raise AssertionError(f'{name}: {detail!r}')
    return {'name':name,'ok':True,'detail':detail}


def fixture_rows(n=120,players=80):
    rows=generate_matches(n,players,20260914,start_ms=1760000000000)
    for row in rows:
        row['patch']='26.18'
        row['source']='ci-fixture-not-real-data'
    return rows


def main():
    checks=[]
    rows=fixture_rows()
    accepted,audit=audit_records(rows,AuditConfig(min_duration_seconds=180),now_ms=1800000000000)
    checks += [
        ok('fixture raw count',audit['raw_count']==120,audit),
        ok('fixture accepted',audit['accepted_count']==120,audit),
        ok('fixture has 1200 participant rows',audit['participant_rows_accepted']==1200,audit),
    ]

    bad_queue=copy.deepcopy(rows[0]);bad_queue['match_id']='BAD_QUEUE';bad_queue['queue_id']=2400
    missing_puuid=copy.deepcopy(rows[1]);missing_puuid['match_id']='BAD_PUUID';missing_puuid['participants'][0]['puuid']=''
    duplicate_puuid=copy.deepcopy(rows[2]);duplicate_puuid['match_id']='BAD_DUP_PUUID';duplicate_puuid['participants'][1]['puuid']=duplicate_puuid['participants'][0]['puuid']
    short=copy.deepcopy(rows[3]);short['match_id']='BAD_SHORT';short['duration']=90
    future=copy.deepcopy(rows[4]);future['match_id']='BAD_FUTURE';future['game_datetime']=1800009999999
    patch=copy.deepcopy(rows[5]);patch['match_id']='BAD_PATCH';patch['patch']='not-a-patch'
    champ=copy.deepcopy(rows[6]);champ['match_id']='BAD_CHAMP';champ['participants'][0]['champion_id']=-1
    exact_dup=copy.deepcopy(rows[7])
    conflict=copy.deepcopy(rows[8]);conflict2=copy.deepcopy(conflict);conflict2['participants'][0]['kills']+=1
    bads=[bad_queue,missing_puuid,duplicate_puuid,short,future,patch,champ,exact_dup,copy.deepcopy(exact_dup),conflict,conflict2]
    _,bad_audit=audit_records(bads,AuditConfig(min_duration_seconds=180),now_ms=1800000000000)
    rr=bad_audit['reject_reasons']
    for reason in ['invalid_queue','missing_puuid','duplicate_puuid_in_match','remake_or_too_short','future_timestamp','unparseable_patch','invalid_champion_id','duplicate_match_id','conflicting_match_version']:
        checks.append(ok(f'audit reason {reason}',rr.get(reason,0)>=1,rr))

    with tempfile.TemporaryDirectory(prefix='aram-rating-v02-') as td:
        td=Path(td);db=connect(td/'fixture.db');init_db(db,V01/'schema.sql')
        for row in accepted:insert_match(db,row,source='ci-fixture-not-real-data')
        stats=database_stats(db);net=analyze_network(db);matches=load_matches(db)
        checks += [
            ok('fixture db matches',stats['matches']==120,stats),
            ok('network player count',net['players']==80,net),
            ok('network largest component',net['largest_component_players']>0,net),
            ok('network repeated teammate clusters labelled',all(x['label'].startswith('repeated teammate cluster') for x in net['repeated_teammate_clusters']),net['repeated_teammate_clusters'][:3]),
            ok('party inference disabled',net['party_inference_used_for_rating'] is False,net),
        ]
        ev=evaluate_v02(matches,real_data=False,min_test_matches=20)
        checks.append(ok('fixture never becomes real result',ev['selection']['status']=='fixture_only',ev['selection']))
        checks.append(ok('three rating models',set(ev['models'])=={'elo','glicko','trueskill_family'},list(ev['models'])))
        checks.append(ok('required baselines',set(ev['baselines'])=={'constant_50','historical_winrate','recent_winrate'},list(ev['baselines'])))
        checks.append(ok('all pairwise bootstraps',len(ev['pairwise_bootstrap'])==3,ev['pairwise_bootstrap']))
        for name,row in ev['models'].items():
            frozen=row['frozen'];walk=row['walk_forward']
            checks += [
                ok(f'{name} frozen test exists',frozen['n']==24,frozen),
                ok(f'{name} walk test exists',walk['n']==24,walk),
                ok(f'{name} rating buckets total',sum(x['n'] for x in frozen['diff_bins'])==24,frozen['diff_bins']),
                ok(f'{name} favorite calibration total',sum(x['n'] for x in row['frozen_favorite_calibration'])==24,row['frozen_favorite_calibration']),
                ok(f'{name} cold groups total',sum(x['n'] for x in row['frozen_cold_start'].values())==24,row['frozen_cold_start']),
                ok(f'{name} uncertainty thresholds', [x['games_at_least'] for x in row['uncertainty_by_games']]==[1,5,10,25,50],row['uncertainty_by_games']),
            ]
        report=build_report(ev,audit,net,stats,limitations=['CI fixture only'])
        paths=write_report(report,td/'report')
        checks += [ok('markdown report exists',Path(paths['markdown']).exists(),paths),ok('json report exists',Path(paths['json']).exists(),paths)]

        empty=connect(td/'empty.db');init_db(empty,V01/'schema.sql');empty_ev=evaluate_v02(load_matches(empty),real_data=True)
        checks.append(ok('empty real dataset is insufficient_real_data',empty_ev['selection']['status']=='insufficient_real_data',empty_ev['selection']))

    manifest=json.loads((ROOT/'update'/'manifest.json').read_text(encoding='utf-8'))
    baseline=json.loads((V02/'V01_BASELINE.json').read_text(encoding='utf-8'))
    checks += [
        ok('active manifest unchanged',manifest.get('version')=='0.15.128',manifest.get('version')),
        ok('v02 not shipped in manifest',not any('aram-rating' in json.dumps(x).lower() for x in manifest.get('files',[])),None),
        ok('v01 baseline commit pinned',baseline.get('commit')=='fb4c23da9f5584fcfc82bc3982c47854a3c27f4b',baseline),
        ok('v01 full regression recorded green',baseline.get('full_regression')=='success',baseline),
    ]
    out={'version':'0.2-research','status':'PASS','checks':len(checks),'real_kr_matches_in_ci':0,'real_data_conclusion':'insufficient_real_data','items':checks}
    (ROOT/'audit-output').mkdir(exist_ok=True)
    (ROOT/'audit-output'/'aram-rating-v02-report.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':'PASS','checks':len(checks),'real_data_conclusion':'insufficient_real_data'},ensure_ascii=False))


if __name__=='__main__':main()
