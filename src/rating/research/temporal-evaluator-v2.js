'use strict';

const researchEngine=require('../../../update/v0.15.129/rating-engine-v01');
const {NetworkBradleyTerry}=require('../universal/network-bt');

const EPS=1e-15;
const clip=p=>Math.max(EPS,Math.min(1-EPS,Number(p)));
const sorted=rows=>(Array.isArray(rows)?rows:[]).filter(m=>Array.isArray(m?.teamA)&&m.teamA.length===5&&Array.isArray(m?.teamB)&&m.teamB.length===5).slice().sort((a,b)=>(Number(a.timestamp)||0)-(Number(b.timestamp)||0)||String(a.matchId||'').localeCompare(String(b.matchId||'')));

function logLoss(y,p){p=clip(p);return-(y*Math.log(p)+(1-y)*Math.log(1-p))}
function metrics(preds){
  if(!preds.length)return{n:0,accuracy:null,logLoss:null,brier:null,ece:null};
  const n=preds.length;
  const accuracy=preds.filter(x=>(x.prob>=.5)===!!x.actual).length/n;
  const ll=preds.reduce((s,x)=>s+logLoss(x.actual?1:0,x.prob),0)/n;
  const brier=preds.reduce((s,x)=>s+(x.prob-(x.actual?1:0))**2,0)/n;
  let ece=0;
  for(let i=0;i<10;i++){
    const lo=i/10,hi=(i+1)/10;
    const bin=preds.filter(x=>(x.prob>=lo&&x.prob<hi)||(i===9&&x.prob===1));
    if(!bin.length)continue;
    const p=bin.reduce((s,x)=>s+x.prob,0)/bin.length;
    const a=bin.reduce((s,x)=>s+(x.actual?1:0),0)/bin.length;
    ece+=(bin.length/n)*Math.abs(p-a);
  }
  return{n,accuracy,logLoss:ll,brier,ece};
}

function sequentialFactory(name){
  if(name==='elo')return()=>new researchEngine.TeamElo();
  if(name==='glicko')return()=>new researchEngine.TeamGlicko();
  if(name==='trueskill_family')return()=>new researchEngine.TrueSkillTeam();
  throw new Error(`unknown sequential model ${name}`);
}

function trainSequential(name,rows){const model=sequentialFactory(name)();for(const m of rows)model.update(m.teamA,m.teamB,!!m.teamAWin);return model}
function predictionRow(model,m){return{matchId:String(m.matchId||''),timestamp:Number(m.timestamp)||0,prob:clip(model.predict(m.teamA,m.teamB,m)),actual:!!m.teamAWin}}

function frozenSequential(name,train,test){const model=trainSequential(name,train);return test.map(m=>predictionRow(model,m))}
function walkSequential(name,train,test){const model=trainSequential(name,train),out=[];for(const m of test){out.push(predictionRow(model,m));model.update(m.teamA,m.teamB,!!m.teamAWin)}return out}

function frozenNetwork(config,train,test){const model=new NetworkBradleyTerry(config).fit(train);return test.map(m=>predictionRow(model,m))}
function walkNetwork(config,train,test){
  const history=[...train],out=[];
  for(const m of test){const model=new NetworkBradleyTerry(config).fit(history);out.push(predictionRow(model,m));history.push(m)}
  return out;
}

function candidateConfigs(){
  return[
    {id:'network_bt_p300_c0_static',config:{playerPriorSd:300,championWeight:0,halfLifeDays:null,iterations:100}},
    {id:'network_bt_p300_c80_static',config:{playerPriorSd:300,championPriorSd:80,championWeight:1,halfLifeDays:null,iterations:100}},
    {id:'network_bt_p250_c80_static',config:{playerPriorSd:250,championPriorSd:80,championWeight:1,halfLifeDays:null,iterations:100}},
    {id:'network_bt_p350_c80_static',config:{playerPriorSd:350,championPriorSd:80,championWeight:1,halfLifeDays:null,iterations:100}},
    {id:'network_bt_p300_c80_h120',config:{playerPriorSd:300,championPriorSd:80,championWeight:1,halfLifeDays:120,iterations:100}},
    {id:'network_bt_p300_c80_h240',config:{playerPriorSd:300,championPriorSd:80,championWeight:1,halfLifeDays:240,iterations:100}}
  ];
}

function seeded(seed){let x=(Number(seed)||1)>>>0;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296}}
function bootstrapLogLossDelta(candidate,baseline,{samples=1000,seed=1729}={}){
  const n=Math.min(candidate.length,baseline.length);
  if(!n)return{mean:null,low:null,high:null,samples:0};
  const rand=seeded(seed),deltas=[];
  for(let b=0;b<samples;b++){
    let c=0,r=0;
    for(let i=0;i<n;i++){const j=Math.floor(rand()*n);c+=logLoss(candidate[j].actual?1:0,candidate[j].prob);r+=logLoss(baseline[j].actual?1:0,baseline[j].prob)}
    deltas.push((c-r)/n);
  }
  deltas.sort((a,b)=>a-b);
  const q=p=>deltas[Math.min(deltas.length-1,Math.max(0,Math.floor((deltas.length-1)*p)))];
  const mean=deltas.reduce((s,x)=>s+x,0)/deltas.length;
  return{mean,low:q(.025),high:q(.975),samples:deltas.length};
}

function evaluateCandidates(matches,{splitFraction=.8,minRealMatches=500,minFrozenMatches=100,bootstrapSamples=1000}={}){
  const rows=sorted(matches);
  if(rows.length<2)return{status:'INSUFFICIENT_DATA',matches:rows.length,train:0,test:0,baselines:{},candidates:{},gate:{passed:false,reason:'need_more_matches',winner:null}};
  const cut=Math.max(1,Math.min(rows.length-1,Math.floor(rows.length*splitFraction))),train=rows.slice(0,cut),test=rows.slice(cut);
  const baselines={};
  for(const name of ['elo','glicko','trueskill_family']){
    const frozen=frozenSequential(name,train,test),walk=walkSequential(name,train,test);
    baselines[name]={frozen:metrics(frozen),walkForward:metrics(walk),_frozenPreds:frozen};
  }
  const candidates={};
  for(const spec of candidateConfigs()){
    const frozen=frozenNetwork(spec.config,train,test),walk=walkNetwork(spec.config,train,test);
    candidates[spec.id]={config:spec.config,frozen:metrics(frozen),walkForward:metrics(walk),_frozenPreds:frozen};
  }
  const bestBaselineName=Object.keys(baselines).sort((a,b)=>baselines[a].frozen.logLoss-baselines[b].frozen.logLoss)[0];
  const bestCandidateName=Object.keys(candidates).sort((a,b)=>candidates[a].frozen.logLoss-candidates[b].frozen.logLoss)[0];
  const delta=bootstrapLogLossDelta(candidates[bestCandidateName]._frozenPreds,baselines[bestBaselineName]._frozenPreds,{samples:bootstrapSamples});
  const enough=rows.length>=minRealMatches&&test.length>=minFrozenMatches;
  const statisticallyBetter=enough&&delta.high!==null&&delta.high<0;
  const calibratedBetter=enough&&candidates[bestCandidateName].frozen.brier<=baselines[bestBaselineName].frozen.brier&&candidates[bestCandidateName].frozen.ece<=baselines[bestBaselineName].frozen.ece;
  const winner=statisticallyBetter&&calibratedBetter?bestCandidateName:null;
  const clean=x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).filter(([kk])=>!kk.startsWith('_')))]));
  return{
    status:winner?'CANDIDATE_WINNER':'NO_CLEAR_WINNER',
    matches:rows.length,train:train.length,test:test.length,
    baselines:clean(baselines),candidates:clean(candidates),
    gate:{
      passed:!!winner,
      winner,
      bestBaseline:bestBaselineName,
      bestCandidate:bestCandidateName,
      primaryMetric:'frozen_log_loss',
      secondaryMetrics:['frozen_brier','frozen_ece','walk_forward_log_loss'],
      bootstrapLogLossDelta:delta,
      requirements:{minRealMatches,minFrozenMatches,bootstrapHighMustBeBelowZero:true,brierNotWorse:true,eceNotWorse:true},
      reason:!enough?'need_more_real_data':!statisticallyBetter?'no_statistically_clear_log_loss_gain':!calibratedBetter?'calibration_not_better':'passed'
    }
  };
}

module.exports={logLoss,metrics,candidateConfigs,bootstrapLogLossDelta,evaluateCandidates,production_active:false,automatic_promotion:false,no_future_leakage:true};
