'use strict';
(function(root,factory){
  const b5=(typeof module==='object'&&module.exports)?require('./b5-closed-network-core'):root?.ARAMRatingB5ClosedNetworkCoreV032;
  const api=factory(b5);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ARAMRatingB51MatchLevelClosedCoreV032=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(B5){
  if(!B5?.chronologicalSplit||!B5?.countMap||!B5?.closedScoreCandidate||!B5?.participantPuuids)throw new Error('v032_b5_core_required');
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number(x)||0));
  const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
  function wilsonLower(successes,total,z=1.281551565545){
    const n=Math.max(0,Number(total)||0),s=Math.max(0,Math.min(n,Number(successes)||0));if(!n)return 0;
    const p=s/n,z2=z*z,den=1+z2/n,center=p+z2/(2*n),adj=z*Math.sqrt((p*(1-p)+z2/(4*n))/n);
    return clamp((center-adj)/den);
  }
  function matchKnownProfile(g,trainCounts){
    const ps=B5.participantPuuids(g),counts=ps.map(p=>trainCounts.get(p)||0),known=counts.filter(x=>x>=1).length,known5=counts.filter(x=>x>=5).length,known10=counts.filter(x=>x>=10).length;
    return{known_participants:known,known_5plus_participants:known5,known_10plus_participants:known10,unknown_participants:Math.max(0,10-known),is_10_of_10:ps.length===10&&known===10,is_9_of_10:ps.length===10&&known===9,is_8_of_10:ps.length===10&&known===8,is_9_plus:ps.length===10&&known>=9,is_8_plus:ps.length===10&&known>=8};
  }
  function directMatchLevelStats(testMatches,trainCounts){
    const prof=(testMatches||[]).map(g=>matchKnownProfile(g,trainCounts)),n=prof.length,c10=prof.filter(x=>x.is_10_of_10).length,c9=prof.filter(x=>x.is_9_of_10).length,c8=prof.filter(x=>x.is_8_of_10).length,c9p=prof.filter(x=>x.is_9_plus).length,c8p=prof.filter(x=>x.is_8_plus).length;
    return{heldout_matches:n,closed_10_of_10_matches:c10,exact_9_of_10_matches:c9,exact_8_of_10_matches:c8,closed_10_of_10_ratio:n?c10/n:0,exact_9_of_10_ratio:n?c9/n:0,exact_8_of_10_ratio:n?c8/n:0,nine_plus_ratio:n?c9p/n:0,eight_plus_ratio:n?c8p/n:0,avg_known_participants:mean(prof.map(x=>x.known_participants)),avg_known_5plus_participants:mean(prof.map(x=>x.known_5plus_participants)),avg_known_10plus_participants:mean(prof.map(x=>x.known_10plus_participants)),avg_unknown_participants:mean(prof.map(x=>x.unknown_participants)),closed_10_of_10_wilson_lower:wilsonLower(c10,n)};
  }
  function matchLevelScoreCandidate(c={},cfg={}){
    const base=B5.closedScoreCandidate(c,cfg),n=Math.max(0,Number(c.heldout_matches)||0),r10=clamp(c.closed_10_of_10_ratio),r9=clamp(c.nine_plus_ratio),r8=clamp(c.eight_plus_ratio),known=clamp((Number(c.avg_known_participants)||0)/10),known5=clamp((Number(c.avg_known_5plus_participants)||0)/10),lower=clamp(c.closed_10_of_10_wilson_lower),evidence=clamp(n/Math.max(1,Number(cfg.full_evidence_matches||5))),unknownPenalty=clamp((Number(c.avg_unknown_participants)||0)/10);
    const directRaw=.50*r10+.18*r9+.10*r8+.10*known+.07*known5+.05*lower;
    const directYield=clamp(evidence*directRaw+(1-evidence)*.20*clamp(base.no_cold_yield_proxy));
    const sampleBonus=Math.min(2.5,n*.45),priority=base.b5_priority+12*r10+5.5*r9+2.5*r8+5.0*known+3.0*known5+5.0*lower+7.0*directYield+sampleBonus-8.0*unknownPenalty;
    return{...base,b51_priority:priority,match_level_closed_priority:priority,direct_no_cold_yield_proxy:directYield,heldout_evidence:evidence,heldout_sample_bonus:sampleBonus,avg_unknown_penalty:unknownPenalty};
  }
  function buildMatchLevelCandidatePool(checkpoint,cfg={}){
    const split=B5.chronologicalSplit(checkpoint?.matches||[]),trainCounts=B5.countMap(split.train),fullState=B5.networkState(split.all),testByPlayer=new Map(),minTrain=Math.max(5,Number(cfg.min_train_observations||5)),minHeldout=Math.max(1,Number(cfg.min_heldout_matches||1)),done=new Set(checkpoint?.completed_puuids_b51_v032||[]);
    for(const g of split.test)for(const p of B5.participantPuuids(g)){if(!testByPlayer.has(p))testByPlayer.set(p,[]);testByPlayer.get(p).push(g)}
    const baseByPuuid=new Map(B5.buildClosedCandidatePool(checkpoint,cfg).map(x=>[x.puuid,x])),rows=[];
    for(const[puuid,testMatches]of testByPlayer){
      const trainObs=trainCounts.get(puuid)||0;if(done.has(puuid)||trainObs<minTrain||testMatches.length<minHeldout)continue;
      const base=baseByPuuid.get(puuid);if(!base)continue;
      const direct=directMatchLevelStats(testMatches,trainCounts),obs=fullState.counts.get(puuid)||trainObs;
      rows.push({...base,current_observation_count:obs,train_observation_count:trainObs,...direct});
    }
    return rows.map(x=>matchLevelScoreCandidate(x,cfg)).filter(x=>!x.skip).sort((a,b)=>b.b51_priority-a.b51_priority||b.closed_10_of_10_ratio-a.closed_10_of_10_ratio||b.closed_10_of_10_wilson_lower-a.closed_10_of_10_wilson_lower||b.heldout_matches-a.heldout_matches||String(a.puuid).localeCompare(String(b.puuid)));
  }
  return{...B5,wilsonLower,matchKnownProfile,directMatchLevelStats,matchLevelScoreCandidate,buildMatchLevelCandidatePool,policy_version:'v0.3.2-b5.1-match-level-closed-preview',phase:'B5.1',automatic_collection:false,live_requests:false};
});
