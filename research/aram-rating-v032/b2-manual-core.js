'use strict';
(function(root,factory){
  const adaptive=(typeof module==='object'&&module.exports)?require('./adaptive-sampling'):root?.ARAMRatingAdaptiveSamplingV032;
  const api=factory(adaptive);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.ARAMRatingB2ManualCoreV032=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Adaptive){
  if(!Adaptive?.rank)throw new Error('v032_adaptive_sampling_required');
  const roots=g=>[g,g?.game,g?.match,g?.data,g?.raw,g?.info].filter(Boolean);
  const pick=(g,keys)=>{for(const r of roots(g))for(const k of keys){const v=r?.[k];if(v!==undefined&&v!==null&&v!=='')return v}return null};
  const matchId=g=>String(pick(g,['gameId','id','matchId','match_id'])??'');
  const matchTime=g=>{const v=pick(g,['gameEndTimestamp','gameEnd','timestamp','ts','createdAt','gameCreation','gameCreationDate','gameStartTimestamp','game_datetime']);if(typeof v==='string'&&!/^\d+(\.\d+)?$/.test(v)){const t=Date.parse(v);return Number.isFinite(t)?t:0}const n=Number(v);return Number.isFinite(n)?n:0};
  function queueId(g){const x=pick(g,['queueId','queue_id']);if(x!==null&&Number.isFinite(Number(x)))return Number(x);for(const r of roots(g)){const n=Number(r?.gameQueueConfig?.id);if(Number.isFinite(n))return n}return null}
  function participants(g){for(const r of roots(g)){if(Array.isArray(r?.participants)&&r.participants.length)return r.participants;const a=Array.isArray(r?.team)?r.team:[],b=Array.isArray(r?.enemy)?r.enemy:[];if(a.length||b.length)return[...a,...b]}return[]}
  function participantPuuids(g){let xs=participants(g).map(p=>String(typeof p==='string'?p:(p?.puuid||p?.player?.puuid||'')).trim()).filter(Boolean);if(xs.length)return[...new Set(xs)];for(const r of roots(g))if(Array.isArray(r?.participantIdentities)){xs=r.participantIdentities.map(x=>String(x?.player?.puuid||x?.puuid||'').trim()).filter(Boolean);if(xs.length)return[...new Set(xs)]}return[]}
  const standardMatches=rows=>(Array.isArray(rows)?rows:[]).filter(g=>queueId(g)===450&&participantPuuids(g).length===10&&matchId(g));
  function dedupeMatches(rows){const out=[],seen=new Set();for(const g of standardMatches(rows)){const id=matchId(g);if(seen.has(id))continue;seen.add(id);out.push(g)}return out.sort((a,b)=>matchTime(b)-matchTime(a)||matchId(a).localeCompare(matchId(b)))}
  function networkState(rows){const matches=dedupeMatches(rows),counts=new Map(),adj=new Map(),byPlayer=new Map(),ensure=p=>{if(!adj.has(p))adj.set(p,new Set());if(!byPlayer.has(p))byPlayer.set(p,[])};for(const g of matches){const ps=participantPuuids(g);for(const p of ps){ensure(p);counts.set(p,(counts.get(p)||0)+1);byPlayer.get(p).push(g)}for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){adj.get(ps[i]).add(ps[j]);adj.get(ps[j]).add(ps[i])}}return{matches,counts,adj,byPlayer}}
  function components(state){const seen=new Set(),out=[],byNode=new Map();for(const p of state.adj.keys()){if(seen.has(p))continue;const nodes=[],stack=[p];seen.add(p);while(stack.length){const u=stack.pop();nodes.push(u);for(const v of state.adj.get(u)||[])if(!seen.has(v)){seen.add(v);stack.push(v)}}const idx=out.length;out.push(nodes);for(const n of nodes)byNode.set(n,idx)}out.sort((a,b)=>b.length-a.length);return{components:out,byNode}}
  function median(xs){const a=[...xs].sort((a,b)=>a-b);if(!a.length)return 0;return a.length%2?a[a.length>>1]:(a[a.length/2-1]+a[a.length/2])/2}
  function kpis(rows){const s=networkState(rows),vals=[...s.counts.values()],players=vals.length,single=vals.filter(x=>x===1).length,c=components(s),giant=Math.max(0,...c.components.map(x=>x.length));return{matches:s.matches.length,players,average_observations:players?vals.reduce((a,b)=>a+b,0)/players:0,median_observations:median(vals),single_match_players:single,single_match_fraction:players?single/players:0,players_2_plus:vals.filter(x=>x>=2).length,players_5_plus:vals.filter(x=>x>=5).length,players_10_plus:vals.filter(x=>x>=10).length,connected_components:c.components.length,giant_component_players:giant,giant_component_ratio:players?giant/players:0}}
  function buildCandidatePool(checkpoint,cfg={}){
    const historyLimit=Math.max(1,Number(cfg.history_limit||20)),cur=networkState(checkpoint?.matches||[]),seed=networkState(checkpoint?.seed_matches||[]),seedSet=new Set(seed.counts.keys()),done=new Set([...(checkpoint?.completed_puuids||[]),...(checkpoint?.completed_puuids_v031||[]),...(checkpoint?.completed_puuids_v032||[])]),comp=components(cur),players=Math.max(1,cur.counts.size),rows=[];
    for(const[puuid,obs]of cur.counts){
      if(done.has(puuid))continue;
      const source_pool=seedSet.has(puuid)?'phase_a_seed':'phase_b_repeat';
      if(source_pool==='phase_a_seed'&&(obs<1||obs>4))continue;
      if(source_pool==='phase_b_repeat'&&obs<2)continue;
      const recent=Math.min(historyLimit,(cur.byPlayer.get(puuid)||[]).length),neighbors=[...(cur.adj.get(puuid)||[])],repeatNeighbors=neighbors.filter(x=>(cur.counts.get(x)||0)>=2).length,overlap=neighbors.length?repeatNeighbors/neighbors.length:0,componentSize=(comp.components[comp.byNode.get(puuid)]||[]).length,componentRatio=componentSize/players,head=Math.max(0,historyLimit-recent);
      rows.push({puuid,source_pool,current_observation_count:obs,already_observed_recent_matches:recent,history_limit:historyLimit,expected_duplicate_ratio:recent/historyLimit,existing_network_overlap:overlap,expected_known_player_reappearances:head*overlap,uncertainty:Math.min(1,1/Math.sqrt(Math.max(1,obs))),network_connectivity_gain:Math.max(0,Math.min(1,.55*(1-componentRatio)+.45*overlap)),request_cost:1,expected_new_players:Math.max(0,head*(1-overlap)*2.5),density_gain_per_request:head*overlap,cold_start_reduction_per_request:(obs<2?1:obs<5?.6:obs<10?.25:0)});
    }
    return Adaptive.rank(rows,{history_limit:historyLimit,skip_headroom_lte:Number(cfg.skip_headroom_lte??2),skip_duplicate_ratio_gte:Number(cfg.skip_duplicate_ratio_gte??.8)});
  }
  function mergeExpansion(existingRows,fetchedRows,targetPuuid){
    const existing=dedupeMatches(existingRows),ids=new Set(existing.map(matchId)),before=networkState(existing),valid=dedupeMatches(fetchedRows),targetHits=valid.filter(g=>participantPuuids(g).includes(targetPuuid)).length,duplicates=valid.filter(g=>ids.has(matchId(g))),fresh=valid.filter(g=>!ids.has(matchId(g))),known=new Set(before.counts.keys()),newPlayers=new Set();let knownApps=0;
    for(const g of fresh)for(const p of participantPuuids(g)){if(known.has(p))knownApps++;else newPlayers.add(p)}
    const afterRows=dedupeMatches([...existing,...fresh]),after=networkState(afterRows),cross={two_plus:0,five_plus:0,ten_plus:0};for(const[p,b]of before.counts){const a=after.counts.get(p)||b;if(b<2&&a>=2)cross.two_plus++;if(b<5&&a>=5)cross.five_plus++;if(b<10&&a>=10)cross.ten_plus++}
    const beforeK=kpis(existing),afterK=kpis(afterRows),density=knownApps+3*cross.two_plus+4*cross.five_plus+5*cross.ten_plus+20*Math.max(0,afterK.giant_component_ratio-beforeK.giant_component_ratio)-.1*newPlayers.size;
    return{valid,target_hits:targetHits,duplicates,new_matches:fresh,after_rows:afterRows,new_players:newPlayers.size,already_known_player_appearances:knownApps,threshold_crossings:cross,density_gain:density,information_gain:density-.5*duplicates.length,before_kpis:beforeK,after_kpis:afterK};
  }
  function delta(before={},after={}){return{matches:(after.matches||0)-(before.matches||0),players:(after.players||0)-(before.players||0),single_match_fraction:(after.single_match_fraction||0)-(before.single_match_fraction||0),players_2_plus:(after.players_2_plus||0)-(before.players_2_plus||0),players_5_plus:(after.players_5_plus||0)-(before.players_5_plus||0),players_10_plus:(after.players_10_plus||0)-(before.players_10_plus||0),giant_component_ratio:(after.giant_component_ratio||0)-(before.giant_component_ratio||0),connected_components:(after.connected_components||0)-(before.connected_components||0)}}
  return{matchId,matchTime,queueId,participants,participantPuuids,standardMatches,dedupeMatches,networkState,kpis,buildCandidatePool,mergeExpansion,delta,policy_version:'v0.3.2',automatic_collection:false,live_requests:false};
});
