'use strict';
(function(root,factory){
  const b4=(typeof module==='object'&&module.exports)?require('./b4-mature-core'):root?.ARAMRatingB4MatureCoreV032;
  const api=factory(b4);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ARAMRatingB5ClosedNetworkCoreV032=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(B4){
  if(!B4?.networkState||!B4?.participantPuuids||!B4?.matchTime)throw new Error('v032_b4_core_required');
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number(x)||0));
  const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
  function chronologicalSplit(rows,frac=.8){const ms=B4.dedupeMatches(rows||[]).slice().sort((a,b)=>B4.matchTime(a)-B4.matchTime(b)||B4.matchId(a).localeCompare(B4.matchId(b)));const cut=Math.max(1,Math.min(ms.length-1,Math.floor(ms.length*frac)));return{all:ms,train:ms.slice(0,cut),test:ms.slice(cut)}}
  function countMap(rows){const m=new Map();for(const g of rows)for(const p of B4.participantPuuids(g))m.set(p,(m.get(p)||0)+1);return m}
  function currentNoColdCoverage(rows){const s=chronologicalSplit(rows),tc=countMap(s.train),dist={};let noCold=0;for(const g of s.test){const cold=B4.participantPuuids(g).filter(p=>(tc.get(p)||0)===0).length;dist[cold]=(dist[cold]||0)+1;if(cold===0)noCold++}return{matches:s.all.length,train_matches:s.train.length,test_matches:s.test.length,no_cold_test_matches:noCold,no_cold_test_fraction:s.test.length?noCold/s.test.length:0,cold_start_distribution:dist}}
  function closedScoreCandidate(c={},cfg={}){
    const base=B4.matureScoreCandidate(c,cfg),closed=clamp(c.historical_closed_match_ratio),closed5=clamp(c.historical_closed_5plus_match_ratio),trainNeighbor=clamp(c.train_seen_neighbor_ratio),train5=clamp(c.train_5plus_neighbor_ratio),train10=clamp(c.train_10plus_neighbor_ratio),newPenalty=clamp(c.closed_network_new_player_penalty),dup=clamp(base.expected_duplicate_ratio),trainObs=Math.max(0,Number(c.train_observation_count)||0);
    const noColdYield=clamp(.48*closed+.22*closed5+.18*trainNeighbor+.08*train5+.04*train10);
    const stableBonus=Math.min(2.5,trainObs/8);
    const priority=base.b4_priority+8.5*closed+6.0*closed5+4.5*trainNeighbor+3.2*train5+1.8*train10+4.0*noColdYield+stableBonus-8.0*newPenalty-1.25*dup;
    return{...base,b5_priority:priority,closed_network_priority:priority,no_cold_yield_proxy:noColdYield,stable_train_bonus:stableBonus,historical_closed_match_ratio:closed,historical_closed_5plus_match_ratio:closed5,train_seen_neighbor_ratio:trainNeighbor,train_5plus_neighbor_ratio:train5,train_10plus_neighbor_ratio:train10,closed_network_new_player_penalty:newPenalty};
  }
  function buildClosedCandidatePool(checkpoint,cfg={}){
    const split=chronologicalSplit(checkpoint?.matches||[]),trainState=B4.networkState(split.train),fullState=B4.networkState(split.all),trainCounts=trainState.counts,done=new Set(checkpoint?.completed_puuids_b5_v032||[]),minTrain=Math.max(5,Number(cfg.min_train_observations||5)),historyLimit=Math.max(20,Number(cfg.history_limit||50)),rows=[];
    for(const[puuid,obs]of fullState.counts){
      const trainObs=trainCounts.get(puuid)||0;if(done.has(puuid)||trainObs<minTrain)continue;
      const hist=fullState.byPlayer.get(puuid)||[],recent=Math.min(historyLimit,hist.length),head=Math.max(0,historyLimit-recent),neighbors=[...(fullState.adj.get(puuid)||[])];
      const trainSeen=neighbors.filter(x=>(trainCounts.get(x)||0)>=1).length,train5=neighbors.filter(x=>(trainCounts.get(x)||0)>=5).length,train10=neighbors.filter(x=>(trainCounts.get(x)||0)>=10).length;
      const trainSeenRatio=neighbors.length?trainSeen/neighbors.length:0,train5Ratio=neighbors.length?train5/neighbors.length:0,train10Ratio=neighbors.length?train10/neighbors.length:0;
      const closedFlags=hist.map(g=>{const ps=B4.participantPuuids(g);return ps.length===10&&ps.every(p=>(trainCounts.get(p)||0)>=1)?1:0}),closed5Flags=hist.map(g=>{const ps=B4.participantPuuids(g);return ps.length===10&&ps.every(p=>(trainCounts.get(p)||0)>=5)?1:0});
      const closed=mean(closedFlags),closed5=mean(closed5Flags),newPenalty=1-trainSeenRatio,source_pool=trainObs>=20?'closed_train_20_plus':trainObs>=10?'closed_train_10_19':'closed_train_5_9';
      rows.push({puuid,source_pool,current_observation_count:obs,train_observation_count:trainObs,already_observed_recent_matches:recent,history_limit:historyLimit,expected_duplicate_ratio:recent/historyLimit,existing_network_overlap:trainSeenRatio,expected_known_player_reappearances:head*trainSeenRatio,uncertainty:Math.min(1,1/Math.sqrt(Math.max(1,trainObs))),network_connectivity_gain:trainSeenRatio,request_cost:1,expected_new_players:Math.max(0,head*newPenalty*2),density_gain_per_request:head*trainSeenRatio,cold_start_reduction_per_request:closed,repeat_density_ratio:trainSeenRatio,single_neighbor_recovery_ratio:0,mature_neighbor_ratio:train5Ratio,ten_plus_neighbor_ratio:train10Ratio,train_seen_neighbor_ratio:trainSeenRatio,train_5plus_neighbor_ratio:train5Ratio,train_10plus_neighbor_ratio:train10Ratio,historical_closed_match_ratio:closed,historical_closed_5plus_match_ratio:closed5,closed_network_new_player_penalty:newPenalty});
    }
    return rows.map(x=>closedScoreCandidate(x,cfg)).filter(x=>!x.skip).sort((a,b)=>b.b5_priority-a.b5_priority||b.historical_closed_match_ratio-a.historical_closed_match_ratio||b.train_observation_count-a.train_observation_count||String(a.puuid).localeCompare(String(b.puuid)));
  }
  return{...B4,chronologicalSplit,countMap,currentNoColdCoverage,closedScoreCandidate,buildClosedCandidatePool,policy_version:'v0.3.2-b5-closed-network-preview',phase:'B5',automatic_collection:false,live_requests:false};
});
