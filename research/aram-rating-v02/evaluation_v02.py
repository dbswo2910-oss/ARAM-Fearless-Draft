from __future__ import annotations

from collections import Counter, defaultdict
import math
from pathlib import Path
import sys
from typing import Sequence

HERE = Path(__file__).resolve().parent
V01 = HERE.parent / 'aram-rating-v01'
sys.path.insert(0, str(V01))

from models import make_model
from evaluation import chronological_split, train_model, predict_set, metrics, bootstrap_logloss_delta
from storage import Match
from baselines import constant_predictions, predict_baseline

MODEL_NAMES = ('elo', 'glicko', 'trueskill_family')


def _attach_patch(preds, match_by_id):
    out = []
    for p in preds:
        row = dict(p)
        row['patch'] = match_by_id[row['match_id']].patch
        out.append(row)
    return out


def favorite_calibration(preds):
    bins = [(0.50,0.55),(0.55,0.60),(0.60,0.65),(0.65,0.70),(0.70,0.80),(0.80,1.0000001)]
    out = []
    for lo, hi in bins:
        rows = []
        for p in preds:
            prob = float(p['prob'])
            fav_prob = max(prob, 1.0-prob)
            if lo <= fav_prob < hi:
                favorite_a = prob >= 0.5
                actual_a = bool(p['actual'])
                rows.append((fav_prob, 1.0 if favorite_a == actual_a else 0.0))
        out.append({
            'range': f'{int(lo*100)}-{int(min(100,hi*100))}%',
            'n': len(rows),
            'predicted': sum(x[0] for x in rows)/len(rows) if rows else None,
            'actual': sum(x[1] for x in rows)/len(rows) if rows else None,
        })
    return out


def cold_start_metrics(preds):
    groups = [('no_cold_start', lambda n:n==0), ('one_to_two_cold', lambda n:1<=n<=2), ('three_plus_cold', lambda n:n>=3)]
    out = {}
    for name, fn in groups:
        rows = [p for p in preds if fn(int(p.get('cold_start_players') or 0))]
        out[name] = metrics(rows)
    return out


def patch_metrics(preds):
    by = defaultdict(list)
    for p in preds:
        by[str(p.get('patch') or 'UNKNOWN')].append(p)
    return {k: metrics(v) for k,v in sorted(by.items())}


def patch_distribution(matches: Sequence[Match]):
    c = Counter(str(m.patch or 'UNKNOWN') for m in matches)
    n = max(1, len(matches))
    return [{'patch':k,'n':v,'fraction':v/n} for k,v in sorted(c.items())]


def _constant_for_rows(rows):
    return metrics([{**p,'prob':0.5,'rating_diff':0.0} for p in rows])


def pairwise_bootstrap(predictions):
    out = []
    names = list(MODEL_NAMES)
    for i in range(len(names)):
        for j in range(i+1,len(names)):
            a,b = names[i], names[j]
            out.append({'a':a,'b':b,'metric':'log_loss','a_minus_b':bootstrap_logloss_delta(predictions[a], predictions[b])})
    return out


def uncertainty_by_games(model, player_ids, thresholds=(1,5,10,25,50)):
    rows = [model.view(pid) for pid in player_ids]
    result = []
    for threshold in thresholds:
        xs = [x for x in rows if x.games >= threshold]
        result.append({
            'games_at_least': threshold,
            'players': len(xs),
            'mean_uncertainty': sum(x.uncertainty for x in xs)/len(xs) if xs else None,
            'median_uncertainty': _median([x.uncertainty for x in xs]),
        })
    return result


def _median(xs):
    xs = sorted(xs)
    if not xs: return None
    n=len(xs)
    return xs[n//2] if n%2 else (xs[n//2-1]+xs[n//2])/2.0


def extreme_diagnostics(matches: Sequence[Match], model_name: str):
    model = make_model(model_name)
    movement = defaultdict(lambda:[float('inf'), float('-inf')])
    last_time = {}
    players = set()
    for m in sorted(matches,key=lambda x:(x.game_datetime,x.match_id)):
        participants = set(m.team_a)|set(m.team_b)
        for pid in participants:
            v=model.view(pid).rating
            movement[pid][0]=min(movement[pid][0],v);movement[pid][1]=max(movement[pid][1],v)
        model.update(m.team_a,m.team_b,m.team_a_win)
        for pid in participants:
            v=model.view(pid).rating
            movement[pid][0]=min(movement[pid][0],v);movement[pid][1]=max(movement[pid][1],v)
            last_time[pid]=m.game_datetime;players.add(pid)
    rows=[]
    for pid in players:
        v=model.view(pid);lo,hi=movement[pid]
        rows.append({'player_id':pid,'rating':v.rating,'uncertainty':v.uncertainty,'games_played':v.games,
                     'last_match_datetime':last_time.get(pid),'rating_range':max(0.0,hi-lo)})
    return {
        'rating_top20':sorted(rows,key=lambda x:(-x['rating'],x['player_id']))[:20],
        'rating_bottom20':sorted(rows,key=lambda x:(x['rating'],x['player_id']))[:20],
        'uncertainty_top20':sorted(rows,key=lambda x:(-x['uncertainty'],x['player_id']))[:20],
        'rating_range_top20':sorted(rows,key=lambda x:(-x['rating_range'],x['player_id']))[:20],
        'riot_ids_included':False,
    }


def _multi_patch_robust(best_frozen, min_patch_n=30):
    per = patch_metrics(best_frozen)
    eligible = {k:v for k,v in per.items() if int(v.get('n') or 0) >= min_patch_n}
    improved = {k:(v['log_loss'] < math.log(2)) for k,v in eligible.items() if v.get('log_loss') is not None}
    return {
        'eligible_patches': len(eligible),
        'min_patch_n': min_patch_n,
        'improved_patches': sum(bool(x) for x in improved.values()),
        'details': eligible,
        'passes': len(eligible) >= 2 and sum(bool(x) for x in improved.values()) >= math.ceil(len(eligible)/2),
    }


def _candidate_gate(report, fixed_predictions, min_test_matches=100):
    total_matches = int(report['dataset']['matches'])
    test_n = int(report['dataset']['test'])
    if total_matches < 500 or test_n < min_test_matches:
        return {
            'status':'insufficient_real_data',
            'reason':f'need at least 500 real matches and {min_test_matches} frozen-test matches',
            'matches':total_matches,'test_matches':test_n,
        }

    ranked = sorted(MODEL_NAMES,key=lambda n:report['models'][n]['frozen']['log_loss'])
    best,runner = ranked[0],ranked[1]
    bm=report['models'][best]['frozen'];base=report['baselines']['constant_50']['frozen']
    cmp=bootstrap_logloss_delta(fixed_predictions[best],fixed_predictions[runner])
    no_cold_rows=[x for x in fixed_predictions[best] if int(x.get('cold_start_players') or 0)==0]
    no_cold=metrics(no_cold_rows);no_cold_base=_constant_for_rows(no_cold_rows)
    patch_check=_multi_patch_robust(fixed_predictions[best])
    conditions={
        'beats_50_log_loss':bm['log_loss'] < base['log_loss'],
        'beats_50_brier':bm['brier'] < base['brier'],
        'calibration_not_materially_worse':bm['ece'] <= max(0.05,base['ece']+0.03),
        'no_cold_start_improves':bool(no_cold['n']>=30 and no_cold['log_loss'] < no_cold_base['log_loss']),
        'paired_bootstrap_clear_vs_runner':bool(cmp and cmp['ci95'][1] < 0),
        'test_sample_sufficient':test_n >= min_test_matches,
        'multi_patch_robustness':patch_check['passes'],
    }
    passed=all(conditions.values())
    return {
        'status':'candidate_winner' if passed else 'no_clear_winner',
        'best_observed':best,'runner_up':runner,'conditions':conditions,
        'best_minus_runner_bootstrap':cmp,'no_cold_start':no_cold,
        'no_cold_start_constant_50':no_cold_base,'patch_robustness':patch_check,
    }


def evaluate_v02(matches: Sequence[Match], train_fraction=0.8, real_data=True, min_test_matches=100):
    xs=sorted(matches,key=lambda x:(x.game_datetime,x.match_id))
    if len(xs)<10:
        return {
            'schema':'aram-rating-research-v02','real_data':bool(real_data),
            'dataset':{'matches':len(xs),'train':0,'test':0},
            'models':{},'baselines':{},'pairwise_bootstrap':[],
            'selection':{'status':'insufficient_real_data' if real_data else 'fixture_only','reason':'need at least 10 matches to split'},
            'leakage_checks':{'train_test_match_overlap':False,'chronological_order':True,'predictions_use_pre_match_state':True},
        }
    train,test=chronological_split(xs,train_fraction)
    match_by_id={m.match_id:m for m in xs}
    train_ids={m.match_id for m in train};test_ids={m.match_id for m in test}
    fixed_predictions={}
    report={
        'schema':'aram-rating-research-v02','real_data':bool(real_data),
        'dataset':{'matches':len(xs),'train':len(train),'test':len(test),'train_start':train[0].game_datetime,
                   'train_end':train[-1].game_datetime,'test_start':test[0].game_datetime,'test_end':test[-1].game_datetime,
                   'patch_distribution':patch_distribution(xs)},
        'models':{},'baselines':{},'pairwise_bootstrap':[],
        'leakage_checks':{
            'train_test_match_overlap':bool(train_ids & test_ids),
            'chronological_order':train[-1].game_datetime<=test[0].game_datetime,
            'predictions_use_pre_match_state':True,
            'walk_forward_updates_after_prediction':True,
        },
    }

    for name in MODEL_NAMES:
        model=make_model(name);seen=train_model(model,train)
        frozen,_=predict_set(model,test,'frozen',seen);walk,_=predict_set(model,test,'walk_forward',seen)
        frozen=_attach_patch(frozen,match_by_id);walk=_attach_patch(walk,match_by_id)
        fixed_predictions[name]=frozen
        all_model=make_model(name);train_model(all_model,xs)
        player_ids=set()
        for m in xs: player_ids.update(m.team_a);player_ids.update(m.team_b)
        report['models'][name]={
            'frozen':metrics(frozen),'walk_forward':metrics(walk),
            'frozen_cold_start':cold_start_metrics(frozen),'walk_forward_cold_start':cold_start_metrics(walk),
            'frozen_favorite_calibration':favorite_calibration(frozen),
            'walk_forward_favorite_calibration':favorite_calibration(walk),
            'frozen_by_patch':patch_metrics(frozen),'walk_forward_by_patch':patch_metrics(walk),
            'uncertainty_by_games':uncertainty_by_games(all_model,player_ids),
        }

    const=constant_predictions(test)
    for p in const:p['patch']=match_by_id[p['match_id']].patch
    for kind in ('historical','recent'):
        f=predict_baseline(train,test,kind=kind,mode='frozen');w=predict_baseline(train,test,kind=kind,mode='walk_forward')
        report['baselines'][f'{kind}_winrate']={
            'frozen':metrics(f),'walk_forward':metrics(w),
            'frozen_cold_start':cold_start_metrics(f),'walk_forward_cold_start':cold_start_metrics(w),
            'frozen_favorite_calibration':favorite_calibration(f),
        }
    report['baselines']['constant_50']={'frozen':metrics(const),'walk_forward':metrics(const),'frozen_favorite_calibration':favorite_calibration(const)}
    report['pairwise_bootstrap']=pairwise_bootstrap(fixed_predictions)

    selection=_candidate_gate(report,fixed_predictions,min_test_matches=min_test_matches)
    if not real_data:
        selection={**selection,'status':'fixture_only','real_result_must_not_use_fixture':True}
    report['selection']=selection
    selected=selection.get('best_observed') or min(MODEL_NAMES,key=lambda n:report['models'][n]['frozen']['log_loss'])
    report['extremes']=extreme_diagnostics(xs,selected)
    return report
