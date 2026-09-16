'use strict';
(function(root,factory){
  const adaptive=(typeof module==='object'&&module.exports)?require('./adaptive-sampling'):root?.ARAMRatingAdaptiveSamplingV032;
  const b2=(typeof module==='object'&&module.exports)?require('./b2-manual-core'):root?.ARAMRatingB2ManualCoreV032;
  const api=factory(adaptive,b2);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ARAMRatingB3ManualCoreV032=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Adaptive,B2){
  if(!Adaptive?.scoreCandidate)throw new Error('v032_adaptive_sampling_required');
  if(!B2?.networkState||!B2?.mergeExpansion)throw new Error('v032_b2_manual_core_required');
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number(x)||0));
  function densityScoreCandidate(c={},cfg={}){
    const base=Adaptive.scoreCandidate(c,{history_limit:cfg.history_limit||20,skip_headroom_lte:cfg.skip_headroom_lte??2,skip_duplicate_ratio_gte:cfg.skip_duplicate_ratio_gte??.9});
    const limit=Math.max(1,Number(c.history_limit||cfg.history_limit||20)),obs=Math.max(0,Number(c.current_observation_count)||0),overlap=clamp(c.existing_network_overlap),repeat=clamp((Number(c.expected_known_player_reappearances)||0)/limit),singleRecovery=clamp(c.single_neighbor_recovery_ratio),density=clamp((Number(c.density_gain_per_request)||0)/limit),dup=clamp(base.expected_duplicate_ratio);
    const threshold=obs<5?2.8:obs<10?2.35:obs<15?1.15:.45;
    const b3Priority=base.priority+3.1*overlap+2.4*repeat+1.8*singleRecovery+1.7*density+threshold-2.2*base.new_player_explosion_penalty-1.15*dup;
    return{...base,b3_priority:b3Priority,density_priority:b3Priority,single_neighbor_recovery_ratio:singleRecovery,repeat_density_ratio:repeat,density_ratio:density,threshold_density_bonus:threshold};
  }
  function buildCandidatePool(checkpoint,cfg={}){
    const historyLimit=Math.max(1,Number(cfg.history_limit||20)),minObs=Math.max(1,Number(cfg.min_candidate_observations||2)),cur=B2.networkState(checkpoint?.matches||[]),done=new Set(checkpoint?.completed_puuids_b3_v032||[]),rows=[];
    for(const[puuid,obs]of cur.counts){
      if(done.has(puuid)||obs<minObs)continue;
      const recent=Math.min(historyLimit,(cur.byPlayer.get(puuid)||[]).length),head=Math.max(0,historyLimit-recent),neighbors=[...(cur.adj.get(puuid)||[])],repeatNeighbors=neighbors.filter(x=>(cur.counts.get(x)||0)>=2).length,singleNeighbors=neighbors.filter(x=>(cur.counts.get(x)||0)===1).length,overlap=neighbors.length?repeatNeighbors/neighbors.length:0,singleRatio=neighbors.length?singleNeighbors/neighbors.length:0;
      const source_pool=obs<5?'repeat_2_4':obs<10?'repeat_5_9':'repeat_10_plus';
      rows.push({puuid,source_pool,current_observation_count:obs,already_observed_recent_matches:recent,history_limit:historyLimit,expected_duplicate_ratio:recent/historyLimit,existing_network_overlap:overlap,expected_known_player_reappearances:head*overlap,uncertainty:Math.min(1,1/Math.sqrt(Math.max(1,obs))),network_connectivity_gain:overlap,request_cost:1,expected_new_players:Math.max(0,head*(1-overlap)*2.5),density_gain_per_request:head*overlap,cold_start_reduction_per_request:obs<5?1:obs<10?.7:.3,single_neighbor_recovery_ratio:singleRatio});
    }
    return rows.map(x=>densityScoreCandidate(x,cfg)).filter(x=>!x.skip).sort((a,b)=>b.b3_priority-a.b3_priority||b.current_observation_count-a.current_observation_count||String(a.puuid).localeCompare(String(b.puuid)));
  }
  return{...B2,densityScoreCandidate,buildCandidatePool,policy_version:'v0.3.2-b3-density-first',phase:'B3',target_matches:1000,automatic_collection:false,live_requests:false};
});
