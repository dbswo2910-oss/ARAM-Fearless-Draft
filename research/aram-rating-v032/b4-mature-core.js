'use strict';
(function(root,factory){
  const b3=(typeof module==='object'&&module.exports)?require('./b3-manual-core'):root?.ARAMRatingB3ManualCoreV032;
  const api=factory(b3);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ARAMRatingB4MatureCoreV032=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(B3){
  if(!B3?.networkState||!B3?.densityScoreCandidate)throw new Error('v032_b3_core_required');
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number(x)||0));
  function matureScoreCandidate(c={},cfg={}){
    const base=B3.densityScoreCandidate(c,{history_limit:cfg.history_limit||50,skip_headroom_lte:cfg.skip_headroom_lte??3,skip_duplicate_ratio_gte:cfg.skip_duplicate_ratio_gte??.94});
    const obs=Math.max(0,Number(c.current_observation_count)||0),mature=clamp(c.mature_neighbor_ratio),ten=clamp(c.ten_plus_neighbor_ratio),repeat=clamp(c.repeat_density_ratio??base.repeat_density_ratio),single=clamp(c.single_neighbor_recovery_ratio),newPenalty=clamp(base.new_player_explosion_penalty),dup=clamp(base.expected_duplicate_ratio);
    const tenPromotion=obs<10?3.25:obs<20?1.4:.45;
    const stableTarget=obs>=10?1.15:.55;
    const noColdStartPotential=clamp(.58*mature+.42*ten);
    const priority=base.b3_priority+4.8*mature+4.2*ten+2.7*noColdStartPotential+1.4*repeat+.8*single+tenPromotion+stableTarget-3.8*newPenalty-1.35*dup;
    return{...base,b4_priority:priority,mature_priority:priority,mature_neighbor_ratio:mature,ten_plus_neighbor_ratio:ten,no_cold_start_potential:noColdStartPotential,ten_plus_promotion_bonus:tenPromotion,stable_target_bonus:stableTarget};
  }
  function buildMatureCandidatePool(checkpoint,cfg={}){
    const historyLimit=Math.max(20,Number(cfg.history_limit||50)),minObs=Math.max(5,Number(cfg.min_candidate_observations||5)),cur=B3.networkState(checkpoint?.matches||[]),done=new Set(checkpoint?.completed_puuids_b4_v032||[]),rows=[];
    for(const[puuid,obs]of cur.counts){
      if(done.has(puuid)||obs<minObs)continue;
      const recent=Math.min(historyLimit,(cur.byPlayer.get(puuid)||[]).length),head=Math.max(0,historyLimit-recent),neighbors=[...(cur.adj.get(puuid)||[])];
      const repeatNeighbors=neighbors.filter(x=>(cur.counts.get(x)||0)>=2).length;
      const matureNeighbors=neighbors.filter(x=>(cur.counts.get(x)||0)>=5).length;
      const tenPlusNeighbors=neighbors.filter(x=>(cur.counts.get(x)||0)>=10).length;
      const singleNeighbors=neighbors.filter(x=>(cur.counts.get(x)||0)===1).length;
      const overlap=neighbors.length?repeatNeighbors/neighbors.length:0,mature=neighbors.length?matureNeighbors/neighbors.length:0,ten=neighbors.length?tenPlusNeighbors/neighbors.length:0,single=neighbors.length?singleNeighbors/neighbors.length:0;
      const source_pool=obs<10?'mature_5_9':obs<20?'mature_10_19':'mature_20_plus';
      rows.push({puuid,source_pool,current_observation_count:obs,already_observed_recent_matches:recent,history_limit:historyLimit,expected_duplicate_ratio:recent/historyLimit,existing_network_overlap:overlap,expected_known_player_reappearances:head*overlap,uncertainty:Math.min(1,1/Math.sqrt(Math.max(1,obs))),network_connectivity_gain:overlap,request_cost:1,expected_new_players:Math.max(0,head*(1-overlap)*3),density_gain_per_request:head*overlap,cold_start_reduction_per_request:Math.max(.2,1.4-mature),single_neighbor_recovery_ratio:single,repeat_density_ratio:overlap,mature_neighbor_ratio:mature,ten_plus_neighbor_ratio:ten});
    }
    return rows.map(x=>matureScoreCandidate(x,cfg)).filter(x=>!x.skip).sort((a,b)=>b.b4_priority-a.b4_priority||b.ten_plus_neighbor_ratio-a.ten_plus_neighbor_ratio||b.mature_neighbor_ratio-a.mature_neighbor_ratio||b.current_observation_count-a.current_observation_count||String(a.puuid).localeCompare(String(b.puuid)));
  }
  return{...B3,matureScoreCandidate,buildMatureCandidatePool,policy_version:'v0.3.2-b4-mature-network',phase:'B4',target_matches:2000,min_candidate_observations:5,automatic_collection:false,live_requests:false};
});
