from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path


def _fmt(v, digits=4):
    if v is None: return '-'
    if isinstance(v,float): return f'{v:.{digits}f}'
    return str(v)


def _date(ms):
    if not ms: return '-'
    return datetime.fromtimestamp(ms/1000, tz=timezone.utc).isoformat()


def build_report(evaluation: dict, data_audit: dict, network: dict, db_stats: dict, limitations=None) -> dict:
    limitations=list(limitations or [])
    selection=evaluation.get('selection') or {}
    if selection.get('status')=='insufficient_real_data':
        limitations.append('현재 접근 가능한 실제 KR 일반 ARAM 표본이 모델 승격 판단에 부족함.')
    limitations.extend([
        '파티 여부는 신뢰 가능한 직접 필드가 없으면 추정하지 않으며 repeated teammate cluster는 Rating 입력에 사용하지 않음.',
        'KDA/딜량/피해량/회복/보호막/골드/챔피언/조합/역할은 v0.2 Rating 업데이트에 사용하지 않음.',
        '현재 표본은 KR 전체 유저의 대표 표본이라고 가정하지 않음.',
        'player-facing Rating/MMR/Elo/백분위/랭킹은 이 연구 버전에서 제공하지 않음.',
    ])
    return {
        'title':'ARAM Rating Research v0.2',
        'generated_at':datetime.now(timezone.utc).isoformat(),
        'actual_data':{
            'matches':db_stats.get('matches',0),'players':db_stats.get('players',0),'participants':db_stats.get('match_players',0),
            'date_range':[_date(db_stats.get('min_time')),_date(db_stats.get('max_time'))],
            'patch_range':[x.get('patch') for x in evaluation.get('dataset',{}).get('patch_distribution',[])],
        },
        'data_quality':data_audit,
        'network_quality':network,
        'models':evaluation.get('models',{}),
        'baselines':evaluation.get('baselines',{}),
        'bootstrap':evaluation.get('pairwise_bootstrap',[]),
        'leakage_checks':evaluation.get('leakage_checks',{}),
        'extremes':evaluation.get('extremes',{}),
        'conclusion':selection,
        'limitations':list(dict.fromkeys(limitations)),
        'next_steps':[ 
            '실행 중인 데스크톱 전적검색에서 PUUID 포함 실제 queue 450 export를 더 확보해 Phase A→B→C로 표본을 늘린다.',
            '연결성/cold-start가 병목이면 이미 관측된 플레이어의 추가 전적을 합법적·승인된 데이터 경로에서 반복 확보해 동일 네트워크 내 반복 관측을 늘린다.',
            '충분한 실제 표본 후에도 baseline 개선이 확인될 때만 파티 보정 또는 패치/최근성 같은 새 가설을 별도 후보 모델로 검증한다.'
        ],
        'player_facing_ui_enabled':False,
    }


def markdown(report: dict) -> str:
    a=report['actual_data'];q=report['data_quality'];n=report['network_quality'];c=report['conclusion']
    lines=[
        '# ARAM Rating Research v0.2','',
        '## 실제 데이터','',
        f"Matches: {a['matches']}",f"Players: {a['players']}",f"Participants: {a['participants']}",
        f"Date Range: {a['date_range'][0]} ~ {a['date_range'][1]}",f"Patch Range: {', '.join(a['patch_range']) if a['patch_range'] else '-'}",'',
        '## Data Quality','',
        f"Accepted: {q.get('accepted_count',0)}",f"Rejected: {q.get('rejected_count',0)}",f"Duplicates: {q.get('duplicate_count',0)}",
        f"Invalid queue: {q.get('reject_reasons',{}).get('invalid_queue',0)}",f"Missing PUUID: {q.get('reject_reasons',{}).get('missing_puuid',0)}",'',
        'Reject reasons: '+json.dumps(q.get('reject_reasons',{}),ensure_ascii=False),'',
        '## Network Quality','',
        f"Largest Component: {n.get('largest_component_players',0)} / {n.get('players',0)} ({_fmt(n.get('largest_component_fraction',0)*100,1)}%)",
        f"Single-match Players: {n.get('single_match_players',{}).get('n',0)} ({_fmt(n.get('single_match_players',{}).get('fraction',0)*100,1)}%)",
        f"10+ Match Players: {n.get('ten_plus_match_players',{}).get('n',0)} ({_fmt(n.get('ten_plus_match_players',{}).get('fraction',0)*100,1)}%)",'',
        '## Models','',
        '| Model | Frozen Log Loss | Brier | Accuracy | ECE | Walk Log Loss |',
        '|---|---:|---:|---:|---:|---:|'
    ]
    for name,row in report.get('models',{}).items():
        f=row.get('frozen',{});w=row.get('walk_forward',{})
        lines.append(f"| {name} | {_fmt(f.get('log_loss'))} | {_fmt(f.get('brier'))} | {_fmt(f.get('accuracy'))} | {_fmt(f.get('ece'))} | {_fmt(w.get('log_loss'))} |")
    for name,row in report.get('baselines',{}).items():
        f=row.get('frozen',{});w=row.get('walk_forward',{})
        lines.append(f"| baseline:{name} | {_fmt(f.get('log_loss'))} | {_fmt(f.get('brier'))} | {_fmt(f.get('accuracy'))} | {_fmt(f.get('ece'))} | {_fmt(w.get('log_loss'))} |")
    lines += ['','## Frozen Test','','Cold-start 세부 결과와 calibration은 JSON 보고서에 포함된다.','','## Walk-forward','','Prediction-before-update 원칙으로 별도 계산된다.','','## Bootstrap','']
    for row in report.get('bootstrap',[]):
        d=row.get('a_minus_b') or {};lines.append(f"- {row.get('a')} - {row.get('b')}: Δ={_fmt(d.get('mean_delta'))}, 95% CI={d.get('ci95')}")
    lines += ['','## Rating Difference','']
    for name,row in report.get('models',{}).items():
        lines.append(f'### {name}')
        for b in row.get('frozen',{}).get('diff_bins',[]): lines.append(f"- {b.get('range')}: N={b.get('n')}, 높은 Rating 팀 실제 승률={_fmt(b.get('favorite_actual_win_rate'))}")
    lines += ['','## Calibration','']
    for name,row in report.get('models',{}).items():
        lines.append(f'### {name}')
        for b in row.get('frozen_favorite_calibration',[]): lines.append(f"- {b.get('range')}: predicted={_fmt(b.get('predicted'))}, actual={_fmt(b.get('actual'))}, N={b.get('n')}")
    lines += ['','## 결론','',f"**{c.get('status','pipeline_failure')}**",'',json.dumps(c,ensure_ascii=False,indent=2),'','## 한계','']
    lines += [f'- {x}' for x in report.get('limitations',[])]
    lines += ['','## 다음 단계 추천','']+[f'{i+1}. {x}' for i,x in enumerate(report.get('next_steps',[])[:3])]
    return '\n'.join(lines)+'\n'


def write_report(report: dict, output_dir: str | Path):
    out=Path(output_dir);out.mkdir(parents=True,exist_ok=True)
    (out/'aram-rating-v02-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (out/'aram-rating-v02-report.md').write_text(markdown(report),encoding='utf-8')
    return {'json':str(out/'aram-rating-v02-report.json'),'markdown':str(out/'aram-rating-v02-report.md')}
