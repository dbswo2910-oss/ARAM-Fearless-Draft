'use strict';
const assert=require('node:assert/strict');
const {NetworkBradleyTerry,cacheKey}=require('../src/rating/universal/network-bt');
const {createEstimator}=require('../src/rating/universal/estimator');
const evaluator=require('../src/rating/research/temporal-evaluator-v2');

function mkMatch(i,a,b,aWin=true){
  const participants=[...a.map((puuid,j)=>({puuid,championId:1+(j%5),teamId:100,win:aWin})),...b.map((puuid,j)=>({puuid,championId:11+(j%5),teamId:200,win:!aWin}))];
  return{schemaVersion:1,matchId:`M${String(i).padStart(4,'0')}`,timestamp:1700000000000+i*60000,patch:'26.18',queueId:450,teamA:[...a].sort(),teamB:[...b].sort(),teamAWin:aWin,participants};
}

(async()=>{
  const strong=Array.from({length:10},(_,i)=>`S${i}`),weak=Array.from({length:10},(_,i)=>`W${i}`);
  const rows=[];
  for(let i=0;i<60;i++){
    const a=[strong[i%10],strong[(i+1)%10],strong[(i+2)%10],weak[(i+3)%10],weak[(i+4)%10]];
    const b=[weak[i%10],weak[(i+1)%10],weak[(i+2)%10],strong[(i+3)%10],strong[(i+4)%10]];
    // Team A has one more strong player and wins most of the time.
    rows.push(mkMatch(i,a,b,i%5!==0));
  }

  const model=new NetworkBradleyTerry({championWeight:0,iterations:100}).fit(rows);
  const strongAvg=strong.reduce((s,id)=>s+model.view(id).rating,0)/strong.length;
  const weakAvg=weak.reduce((s,id)=>s+model.view(id).rating,0)/weak.length;
  assert.ok(strongAvg>weakAvg+20,`expected strong network rating > weak (${strongAvg} vs ${weakAvg})`);
  assert.ok(model.view('S0').uncertainty<405,'repeated observations should reduce conservative prior-scale uncertainty');
  assert.ok(model.view('S0').raw.componentSize>=20,'network diagnostics should expose connected component size');
  assert.equal(model.view('S0').uncertainty_kind,'network_bt_hessian');

  const model2=new NetworkBradleyTerry({championWeight:1,iterations:100}).fit(rows);
  assert.ok(Number.isFinite(model2.view('S0').rating));
  assert.equal(model2.view('S0').raw.championControl,true);
  assert.equal(cacheKey(rows,model2.config()),cacheKey(rows,model2.config()),'cache key must be deterministic');

  const estimator=createEstimator('research-v2-network-bt-shadow');
  const estimate=await estimator.estimate({puuid:'S0',matches:rows});
  assert.equal(estimate.status,'ESTIMATED_SHADOW');
  assert.equal(estimate.modelName,'network_bt');
  assert.ok(Number.isFinite(estimate.rating));
  assert.ok(Number.isFinite(estimate.uncertainty));
  assert.equal(estimate.details.networkModel,'regularized_bradley_terry');

  const report=evaluator.evaluateCandidates(rows,{minRealMatches:500,minFrozenMatches:100,bootstrapSamples:100});
  assert.equal(report.status,'NO_CLEAR_WINNER');
  assert.equal(report.gate.passed,false);
  assert.equal(report.gate.reason,'need_more_real_data');
  assert.ok(report.baselines.elo.frozen.n>0);
  assert.ok(report.candidates.network_bt_p300_c80_static.frozen.n>0);
  assert.equal(evaluator.production_active,false);
  assert.equal(evaluator.automatic_promotion,false);
  assert.equal(evaluator.no_future_leakage,true);

  console.log('UNIVERSAL RATING NETWORK BT V2: PASS');
})().catch(err=>{console.error(err);process.exit(1)});
