from __future__ import annotations
import json
import math
import random
from typing import Dict, Sequence

from models import make_model, BaseTeamModel
from storage import Match, dataset_fingerprint


def chronological_split(matches: Sequence[Match], train_fraction: float=0.8):
    if not 0.5 <= train_fraction < 1.0:
        raise ValueError('train_fraction must be in [0.5, 1.0)')
    xs=sorted(matches,key=lambda m:(m.game_datetime,m.match_id))
    if len(xs)<10: raise ValueError('need at least 10 matches')
    cut=max(1,min(len(xs)-1,int(len(xs)*train_fraction)))
    train=xs[:cut];test=xs[cut:]
    if train[-1].game_datetime > test[0].game_datetime:
        raise AssertionError('time split order violation')
    ids1={m.match_id for m in train};ids2={m.match_id for m in test}
    if ids1 & ids2: raise AssertionError('same match in train and test')
    return train,test


def _logloss(y,p):
    p=min(1-1e-15,max(1e-15,p))
    return -(y*math.log(p)+(1-y)*math.log(1-p))


def metrics(preds: Sequence[dict]):
    if not preds:
        return {'n':0,'accuracy':None,'log_loss':None,'brier':None,'ece':None,'calibration':[],'diff_bins':[]}
    ys=[int(x['actual']) for x in preds];ps=[float(x['prob']) for x in preds]
    accuracy=sum((p>=0.5)==bool(y) for p,y in zip(ps,ys))/len(ys)
    ll=sum(_logloss(y,p) for y,p in zip(ys,ps))/len(ys)
    brier=sum((p-y)**2 for p,y in zip(ps,ys))/len(ys)
    cal=[]
    for i in range(10):
        lo=i/10;hi=(i+1)/10
        rows=[x for x in preds if (lo <= x['prob'] < hi) or (i==9 and x['prob']==1)]
        if rows:
            cal.append({'bin':f'{lo:.1f}-{hi:.1f}','n':len(rows),
                        'predicted':sum(r['prob'] for r in rows)/len(rows),
                        'actual':sum(r['actual'] for r in rows)/len(rows)})
    ece=sum((r['n']/len(preds))*abs(r['predicted']-r['actual']) for r in cal)
    diff=[]
    for lo,hi in [(0,50),(50,100),(100,200),(200,300),(300,float('inf'))]:
        rows=[x for x in preds if lo <= abs(x['rating_diff']) < hi]
        label=f'{lo}-{int(hi) if math.isfinite(hi) else "inf"}'
        if rows:
            favwins=sum((r['actual']==1) if r['rating_diff']>=0 else (r['actual']==0) for r in rows)
            diff.append({'range':label,'n':len(rows),'favorite_actual_win_rate':favwins/len(rows),
                         'avg_abs_diff':sum(abs(r['rating_diff']) for r in rows)/len(rows)})
        else:
            diff.append({'range':label,'n':0,'favorite_actual_win_rate':None,'avg_abs_diff':None})
    return {'n':len(preds),'accuracy':accuracy,'log_loss':ll,'brier':brier,'ece':ece,
            'calibration':cal,'diff_bins':diff}


def train_model(model: BaseTeamModel, matches: Sequence[Match]):
    seen=set()
    for m in matches:
        model.update(m.team_a,m.team_b,m.team_a_win)
        seen.update(m.team_a);seen.update(m.team_b)
    return seen


def predict_set(model: BaseTeamModel, test: Sequence[Match], mode='frozen', train_seen=None):
    if mode not in {'frozen','walk_forward'}: raise ValueError(mode)
    mdl=model.clone();seen=set(train_seen or ());preds=[]
    for m in sorted(test,key=lambda x:(x.game_datetime,x.match_id)):
        p=mdl.predict(m.team_a,m.team_b)
        ra=mdl.team_rating(m.team_a);rb=mdl.team_rating(m.team_b)
        known=sum(1 for pid in list(m.team_a)+list(m.team_b) if pid in seen)
        preds.append({'match_id':m.match_id,'time':m.game_datetime,'prob':p,'actual':1 if m.team_a_win else 0,
                      'team_a_rating':ra,'team_b_rating':rb,'rating_diff':ra-rb,
                      'known_players':known,'cold_start_players':10-known})
        if mode=='walk_forward':
            mdl.update(m.team_a,m.team_b,m.team_a_win)
            seen.update(m.team_a);seen.update(m.team_b)
    return preds,mdl


def bootstrap_logloss_delta(a: Sequence[dict], b: Sequence[dict], iterations=1000, seed=1701):
    if len(a)!=len(b) or not a:return None
    by_a={x['match_id']:x for x in a};by_b={x['match_id']:x for x in b}
    ids=sorted(set(by_a)&set(by_b))
    if len(ids)<20:return None
    rng=random.Random(seed);ds=[]
    for _ in range(iterations):
        sample=[ids[rng.randrange(len(ids))] for __ in range(len(ids))]
        la=sum(_logloss(by_a[i]['actual'],by_a[i]['prob']) for i in sample)/len(sample)
        lb=sum(_logloss(by_b[i]['actual'],by_b[i]['prob']) for i in sample)/len(sample)
        ds.append(la-lb)
    ds.sort()
    return {'mean_delta':sum(ds)/len(ds),'ci95':[ds[int(.025*(len(ds)-1))],ds[int(.975*(len(ds)-1))]]}


def evaluate_models(matches: Sequence[Match], train_fraction=0.8, model_names=('elo','glicko','trueskill_family')):
    train,test=chronological_split(matches,train_fraction)
    train_ids={m.match_id for m in train};test_ids={m.match_id for m in test}
    if train_ids & test_ids: raise AssertionError('train/test overlap')
    report={'dataset':{'matches':len(matches),'train':len(train),'test':len(test),
                       'train_start':train[0].game_datetime,'train_end':train[-1].game_datetime,
                       'test_start':test[0].game_datetime,'test_end':test[-1].game_datetime,
                       'fingerprint':dataset_fingerprint(matches)},
            'baseline':{'accuracy':0.5,'log_loss':math.log(2),'brier':0.25},
            'models':{},'comparisons':[],'selection':None,'leakage_checks':{
                'train_test_match_overlap':False,
                'chronological_order':train[-1].game_datetime<=test[0].game_datetime,
                'predictions_use_pre_match_state':True,
                'current_rating_used_for_past_prediction':False}}
    fixed_preds={}
    for name in model_names:
        model=make_model(name);train_seen=train_model(model,train)
        fixed,_=predict_set(model,test,'frozen',train_seen)
        walk,_=predict_set(model,test,'walk_forward',train_seen)
        fixed_preds[name]=fixed
        cold=sum(x['cold_start_players'] for x in fixed)/(10*len(fixed)) if fixed else 0.0
        final_ids=set()
        for m in train: final_ids.update(m.team_a);final_ids.update(m.team_b)
        states=model.states(final_ids)
        report['models'][name]={
            'frozen':metrics(fixed),'walk_forward':metrics(walk),
            'cold_start_player_fraction':cold,'train_player_count':len(train_seen),
            'rating_distribution':_rating_distribution(states),'uncertainty_note':_uncertainty_note(name)}
    ranked=sorted(model_names,key=lambda n: report['models'][n]['frozen']['log_loss'])
    for i in range(len(ranked)):
        for j in range(i+1,len(ranked)):
            a,b=ranked[i],ranked[j]
            report['comparisons'].append({'a':a,'b':b,'metric':'log_loss',
                                          'a_minus_b':bootstrap_logloss_delta(fixed_preds[a],fixed_preds[b])})
    if ranked:
        best=ranked[0];runner=ranked[1] if len(ranked)>1 else None;decisive=False;ci=None
        if runner:
            cmp=bootstrap_logloss_delta(fixed_preds[best],fixed_preds[runner])
            if cmp: ci=cmp['ci95'];decisive=ci[1] < 0
        beats_random=report['models'][best]['frozen']['log_loss'] < report['baseline']['log_loss']
        report['selection']={'best_observed':best,'runner_up':runner,
                             'statistically_clear_vs_runner_up':decisive,
                             'bootstrap_ci95_best_minus_runner':ci,
                             'beats_random_50_50_logloss':beats_random,
                             'recommendation':best if decisive and beats_random else 'no_clear_winner'}
    return report


def _rating_distribution(states: Dict[int,object]):
    if not states:return {'n':0}
    rs=[v.rating for v in states.values()];us=[v.uncertainty for v in states.values()];srs=sorted(rs)
    def q(p): return srs[min(len(srs)-1,max(0,int(round((len(srs)-1)*p))))]
    return {'n':len(rs),'mean':sum(rs)/len(rs),'p10':q(.1),'median':q(.5),'p90':q(.9),
            'mean_uncertainty':sum(us)/len(us)}


def _uncertainty_note(name):
    if name=='elo': return 'sample-size heuristic; Elo has no native posterior uncertainty'
    if name=='glicko': return 'Glicko-family RD'
    return 'Gaussian skill sigma converted to the common display scale'


def report_json(report):
    return json.dumps(report,ensure_ascii=False,indent=2,sort_keys=False)
