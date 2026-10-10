from __future__ import annotations
import argparse
import json
from pathlib import Path
import sys

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))

from storage import connect,init_db,insert_match,import_jsonl,load_matches,audit_dataset,database_stats
from evaluation import evaluate_models,report_json
from synthetic import generate_matches
from program_import import convert_file


def cmd_init(args):
    db=connect(args.db);init_db(db,HERE/'schema.sql')
    print(json.dumps({'ok':True,'db':args.db,'stats':database_stats(db)},ensure_ascii=False,indent=2))


def cmd_import(args):
    db=connect(args.db);init_db(db,HERE/'schema.sql')
    r=import_jsonl(db,args.input,source=args.source)
    print(json.dumps({**r,'stats':database_stats(db)},ensure_ascii=False,indent=2))


def cmd_synthetic(args):
    db=connect(args.db);init_db(db,HERE/'schema.sql')
    inserted=duplicates=0
    for row in generate_matches(args.matches,args.players,args.seed):
        r=insert_match(db,row,source='synthetic')
        inserted+=bool(r['inserted']);duplicates+=not bool(r['inserted'])
    print(json.dumps({'ok':True,'inserted':inserted,'duplicates':duplicates,'stats':database_stats(db)},indent=2))


def cmd_audit(args):
    db=connect(args.db);print(json.dumps(audit_dataset(db),ensure_ascii=False,indent=2))


def cmd_convert_program(args):
    n=convert_file(args.input,args.output)
    print(json.dumps({'ok':True,'converted':n,'input':args.input,'output':args.output},ensure_ascii=False,indent=2))


def cmd_evaluate(args):
    db=connect(args.db);matches=load_matches(db)
    report=evaluate_models(matches,args.train_fraction);text=report_json(report)
    if args.output: Path(args.output).write_text(text+'\n',encoding='utf-8')
    print(text)


def build():
    p=argparse.ArgumentParser(description='ARAM Rating v0.1 research-only benchmark')
    sp=p.add_subparsers(dest='cmd',required=True)
    x=sp.add_parser('init-db');x.add_argument('--db',required=True);x.set_defaults(fn=cmd_init)
    x=sp.add_parser('import-jsonl');x.add_argument('--db',required=True);x.add_argument('--input',required=True);x.add_argument('--source',default='existing-program-import');x.set_defaults(fn=cmd_import)
    x=sp.add_parser('synthetic');x.add_argument('--db',required=True);x.add_argument('--matches',type=int,default=1200);x.add_argument('--players',type=int,default=240);x.add_argument('--seed',type=int,default=20260914);x.set_defaults(fn=cmd_synthetic)
    x=sp.add_parser('convert-current-program');x.add_argument('--input',required=True);x.add_argument('--output',required=True);x.set_defaults(fn=cmd_convert_program)
    x=sp.add_parser('audit-data');x.add_argument('--db',required=True);x.set_defaults(fn=cmd_audit)
    x=sp.add_parser('evaluate');x.add_argument('--db',required=True);x.add_argument('--train-fraction',type=float,default=.8);x.add_argument('--output');x.set_defaults(fn=cmd_evaluate)
    return p

if __name__=='__main__':
    a=build().parse_args();a.fn(a)
