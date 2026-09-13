from __future__ import annotations

import json
from pathlib import Path
import sqlite3
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[1]
V01=ROOT/'research'/'aram-rating-v01';V02=ROOT/'research'/'aram-rating-v02'
sys.path.insert(0,str(V01));sys.path.insert(0,str(V02))

from synthetic import generate_matches
from phase_a import run_phase_a


def main():
    rows=generate_matches(84,612,20260914,start_ms=1760000000000)
    for row in rows:
        row['patch']='26.18.1'
        row['source']='local_running_app'
    sample={
        'schema':'aram-rating-real-sample-v02',
        'metadata':{'source':'local_running_app','region':'KR','queue':450,'match_count':84},
        'matches':rows,
    }
    with tempfile.TemporaryDirectory(prefix='aram-phase-a-audit-') as td:
        td=Path(td);sample_path=td/'aram-rating-real-sample-20260914-1200.json';out=td/'result'
        sample_path.write_text(json.dumps(sample,ensure_ascii=False),encoding='utf-8')
        result=run_phase_a(sample_path,out,min_test_matches=100)
        s=result['summary'];r=result['report'];checks=r['phase_a']['pipeline_checks']
        assert s['Exported matches']==84,s
        assert s['Queue 450 accepted']==84,s
        assert s['Invalid queue']==0,s
        assert s['Missing participants']==0,s
        assert s['Missing PUUID']==0,s
        assert s['Duplicate match IDs']==0,s
        assert s['Frozen Test Matches']==17,s
        assert s['Status']=='insufficient_for_model_selection',s
        assert all(checks.values()),checks
        assert r['phase_a']['model_selection_allowed'] is False
        assert r['phase_b_collection_strategy']['riot_match_v5_auto_expansion'] is False
        assert r['phase_b_collection_strategy']['case'] in {'CASE_A_DEEPEN_CURRENT_COMPONENT','CASE_B_REPEAT_EXISTING_PLAYERS','CASE_C_COMPONENT_BRIDGING','CASE_HYBRID'}
        assert set(r['models'])=={'elo','glicko','trueskill_family'}
        assert Path(result['paths']['json']).exists()
        assert Path(result['paths']['markdown']).exists()
        assert (out/'identity-map.local.json').exists()
        assert (out/'accepted-anonymized.jsonl').exists()
        assert (out/'aram-rating-phase-a.db').exists()

        db=sqlite3.connect(out/'aram-rating-phase-a.db')
        players=db.execute('SELECT puuid,riot_id,tag FROM players').fetchall()
        assert players
        assert all(str(p[0]).startswith('player-internal-') for p in players)
        assert all(p[1] is None and p[2] is None for p in players)
        raw=db.execute('SELECT raw_json FROM matches LIMIT 5').fetchall()
        assert all('syn-puuid-' not in (x[0] or '') for x in raw)

        mapping=json.loads((out/'identity-map.local.json').read_text(encoding='utf-8'))
        assert mapping['puuid_to_internal']
        assert all(k.startswith('syn-puuid-') for k in mapping['puuid_to_internal'])

    report={'status':'PASS','phase_a_matches':84,'frozen_test':17,'selection':'insufficient_for_model_selection','privacy':'raw PUUID only in ignored local mapping; DB uses internal IDs','riot_match_v5_auto_expansion':False}
    (ROOT/'audit-output').mkdir(exist_ok=True)
    (ROOT/'audit-output'/'aram-rating-phase-a-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))


if __name__=='__main__':main()
