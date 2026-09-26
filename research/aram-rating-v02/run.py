from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
import tempfile

HERE=Path(__file__).resolve().parent
V01=HERE.parent/'aram-rating-v01'
sys.path.insert(0,str(V01));sys.path.insert(0,str(HERE))

from storage import connect,init_db,import_jsonl,load_matches,database_stats,audit_dataset
from data_audit import AuditConfig,audit_file
from network import analyze_network
from evaluation_v02 import evaluate_v02
from report import build_report,write_report


def _reject_synthetic(db):
    n=int(db.execute("SELECT COUNT(*) n FROM matches WHERE lower(source) LIKE '%synthetic%' OR lower(source) LIKE '%fixture%'").fetchone()['n'])
    if n:
        raise ValueError(f'real-data evaluation refuses {n} synthetic/fixture matches')


def cmd_audit_export(args):
    cfg=AuditConfig(min_duration_seconds=args.min_duration,future_grace_seconds=args.future_grace,require_patch=not args.allow_missing_patch)
    r=audit_file(args.input,args.accepted,args.audit,config=cfg)
    print(json.dumps(r,ensure_ascii=False,indent=2))


def cmd_import_real(args):
    db=connect(args.db);init_db(db,V01/'schema.sql')
    r=import_jsonl(db,args.input,source='existing-program-real-export')
    _reject_synthetic(db)
    out={**r,'database':database_stats(db),'integrity':audit_dataset(db)}
    print(json.dumps(out,ensure_ascii=False,indent=2))


def evaluate_db(db_path,output_dir,data_audit=None,real_data=True,min_test_matches=100):
    db=connect(db_path);init_db(db,V01/'schema.sql')
    if real_data:_reject_synthetic(db)
    stats=database_stats(db);matches=load_matches(db)
    ev=evaluate_v02(matches,real_data=real_data,min_test_matches=min_test_matches)
    net=analyze_network(db)
    dq=data_audit or {'raw_count':stats['matches'],'accepted_count':stats['matches'],'rejected_count':0,'duplicate_count':0,'reject_reasons':{},'warning_reasons':{},'note':'DB-only evaluation; source audit file not supplied'}
    limits=[]
    if stats['matches']==0:limits.append('GitHub/CI 환경에는 실행 중인 데스크톱 세션의 실제 전적 데이터가 없음.')
    report=build_report(ev,dq,net,stats,limitations=limits)
    paths=write_report(report,output_dir)
    return report,paths


def cmd_evaluate(args):
    audit=None
    if args.audit and Path(args.audit).exists():audit=json.loads(Path(args.audit).read_text(encoding='utf-8'))
    report,paths=evaluate_db(args.db,args.output_dir,audit,real_data=True,min_test_matches=args.min_test_matches)
    print(json.dumps({'conclusion':report['conclusion'],'actual_data':report['actual_data'],'files':paths},ensure_ascii=False,indent=2))


def cmd_run_all(args):
    out=Path(args.output_dir);out.mkdir(parents=True,exist_ok=True)
    accepted=out/'accepted-real.jsonl';audit_path=out/'data-audit.json';db_path=out/'aram-rating-real.db'
    cfg=AuditConfig(min_duration_seconds=args.min_duration,future_grace_seconds=args.future_grace,require_patch=not args.allow_missing_patch)
    audit=audit_file(args.input,accepted,audit_path,config=cfg)
    db=connect(db_path);init_db(db,V01/'schema.sql');imp=import_jsonl(db,accepted,source='existing-program-real-export');db.close()
    report,paths=evaluate_db(db_path,out,audit,real_data=True,min_test_matches=args.min_test_matches)
    print(json.dumps({'audit':audit,'import':imp,'conclusion':report['conclusion'],'files':paths},ensure_ascii=False,indent=2))


def build():
    p=argparse.ArgumentParser(description='ARAM Rating Research v0.2 — real-data-only validation')
    sp=p.add_subparsers(dest='cmd',required=True)
    a=sp.add_parser('audit-export');a.add_argument('--input',required=True);a.add_argument('--accepted',required=True);a.add_argument('--audit',required=True);a.add_argument('--min-duration',type=int,default=180);a.add_argument('--future-grace',type=int,default=300);a.add_argument('--allow-missing-patch',action='store_true');a.set_defaults(fn=cmd_audit_export)
    a=sp.add_parser('import-real');a.add_argument('--db',required=True);a.add_argument('--input',required=True);a.set_defaults(fn=cmd_import_real)
    a=sp.add_parser('evaluate-real');a.add_argument('--db',required=True);a.add_argument('--output-dir',required=True);a.add_argument('--audit');a.add_argument('--min-test-matches',type=int,default=100);a.set_defaults(fn=cmd_evaluate)
    a=sp.add_parser('run-all');a.add_argument('--input',required=True);a.add_argument('--output-dir',required=True);a.add_argument('--min-duration',type=int,default=180);a.add_argument('--future-grace',type=int,default=300);a.add_argument('--allow-missing-patch',action='store_true');a.add_argument('--min-test-matches',type=int,default=100);a.set_defaults(fn=cmd_run_all)
    return p


if __name__=='__main__':
    args=build().parse_args();args.fn(args)
