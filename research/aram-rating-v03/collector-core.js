'use strict';
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.ARAMRatingPhaseBCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const roots=g=>[g,g?.game,g?.match,g?.data,g?.raw,g?.info].filter(Boolean);
  const pick=(g,keys)=>{for(const r of roots(g))for(const k of keys){const v=r?.[k];if(v!==undefined&&v!==null&&v!=='')return v}return null};
  const matchId=g=>{const v=pick(g,['gameId','id','matchId','match_id']);return v===null?'':String(v)};
  const matchTime=g=>{const v=pick(g,['gameEndTimestamp','gameEnd','timestamp','ts','createdAt','gameCreation','gameCreationDate','gameStartTimestamp','game_datetime']);const n=Number(v);return Number.isFinite(n)?n:0};
  function queueId(g){const direct=pick(g,['queueId','queue_id']);if(direct!==null){const n=Number(direct);return Number.isFinite(n)?n:null}for(const r of roots(g)){const n=Number(r?.gameQueueConfig?.id);if(Number.isFinite(n)&&n>0)return n}return null}
  function participants(g){for(const r of roots(g)){if(Array.isArray(r?.participants)&&r.participants.length)return r.participants;const a=Array.isArray(r?.team)?r.team:[],b=Array.isArray(r?.enemy)?r.enemy:[];if(a.length||b.length)return [...a,...b]}return []}
  function participantPuuids(g){const ps=participants(g);let xs=ps.map(p=>String(p?.puuid||p?.player?.puuid||'').trim()).filter(Boolean);if(xs.length)return xs;for(const r of roots(g))if(Array.isArray(r?.participantIdentities)){xs=r.participantIdentities.map(x=>String(x?.player?.puuid||x?.puuid||'').trim()).filter(Boolean);if(xs.length)return xs}return []}
  function standardMatches(rows){return (Array.isArray(rows)?rows:[]).filter(g=>queueId(g)===450&&participantPuuids(g).length===10&&matchId(g));}
  function dedupeMatches(rows){const out=[],seen=new Set();for(const g of rows||[]){const id=matchId(g);if(!id||seen.has(id))continue;seen.add(id);out.push(g)}return out.sort((a,b)=>matchTime(b)-matchTime(a));}
  function seedFingerprint(rows){return dedupeMatches(standardMatches(rows)).map(matchId).sort().join('|')}
  function median(xs){const a=xs.slice().sort((a,b)=>a-b);if(!a.length)return 0;const n=a.length;return n%2?a[n>>1]:(a[n/2-1]+a[n/2])/2}
  function networkState(rows){
    const matches=dedupeMatches(standardMatches(rows)),counts=new Map(),adj=new Map();
    const ensure=p=>{if(!adj.has(p))adj.set(p,new Set());return adj.get(p)};
    for(const g of matches){const ps=[...new Set(participantPuuids(g))];for(const p of ps){counts.set(p,(counts.get(p)||0)+1);ensure(p)}for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){ensure(ps[i]).add(ps[j]);ensure(ps[j]).add(ps[i])}}
    return {matches,counts,adj};
  }
  function articulationPoints(adj){
    let time=0;const disc=new Map(),low=new Map(),parent=new Map(),out=new Set();
    function dfs(u){disc.set(u,++time);low.set(u,time);let children=0;for(const v of (adj.get(u)||[])){if(!disc.has(v)){parent.set(v,u);children++;dfs(v);low.set(u,Math.min(low.get(u),low.get(v)));if(!parent.has(u)&&children>1)out.add(u);if(parent.has(u)&&low.get(v)>=disc.get(u))out.add(u)}else if(parent.get(u)!==v)low.set(u,Math.min(low.get(u),disc.get(v)))}}
    for(const u of adj.keys())if(!disc.has(u))dfs(u);return out;
  }
  function kpis(rows){
    const {matches,counts,adj}=networkState(rows),vals=[...counts.values()],players=vals.length;const singles=vals.filter(x=>x===1).length,two=vals.filter(x=>x>=2).length,five=vals.filter(x=>x>=5).length,ten=vals.filter(x=>x>=10).length;
    const seen=new Set();let giant=0,components=0;for(const p of adj.keys()){if(seen.has(p))continue;components++;let n=0,stack=[p];seen.add(p);while(stack.length){const u=stack.pop();n++;for(const v of adj.get(u)||[])if(!seen.has(v)){seen.add(v);stack.push(v)}}giant=Math.max(giant,n)}
    return {matches:matches.length,players,avg_matches_per_player:players?vals.reduce((a,b)=>a+b,0)/players:0,median_matches_per_player:median(vals),single_match_players:singles,single_match_fraction:players?singles/players:0,players_2_plus:two,players_5_plus:five,players_10_plus:ten,component_count:components,largest_component_players:giant,largest_component_fraction:players?giant/players:0};
  }
  function phaseASeedFromEnvelope(envelope,opts={}){
    if(!envelope||typeof envelope!=='object')throw new Error('phase_a_seed_invalid_json');
    if(envelope.schema!=='aram-rating-real-sample-v02')throw new Error('phase_a_seed_wrong_schema');
    const raw=Array.isArray(envelope.matches)?envelope.matches:[];
    if(!raw.length)throw new Error('phase_a_seed_empty');
    const matches=dedupeMatches(standardMatches(raw));
    if(matches.length!==raw.length)throw new Error('phase_a_seed_contains_invalid_or_duplicate_matches');
    const stats=kpis(matches),declared=Number(envelope?.metadata?.match_count);
    if(Number.isFinite(declared)&&declared>0&&declared!==stats.matches)throw new Error('phase_a_seed_metadata_match_count_mismatch');
    const expectedMatches=opts.expectedMatches===undefined?20:Number(opts.expectedMatches),expectedPlayers=opts.expectedPlayers===undefined?160:Number(opts.expectedPlayers);
    if(Number.isFinite(expectedMatches)&&expectedMatches>0&&stats.matches!==expectedMatches)throw new Error(`phase_a_seed_expected_${expectedMatches}_matches_got_${stats.matches}`);
    if(Number.isFinite(expectedPlayers)&&expectedPlayers>0&&stats.players!==expectedPlayers)throw new Error(`phase_a_seed_expected_${expectedPlayers}_players_got_${stats.players}`);
    return {schema:'aram-rating-phase-a-import-v03',source_schema:envelope.schema,source_exported_at:envelope?.metadata?.exported_at||null,matches,kpis:stats,fingerprint:seedFingerprint(matches)};
  }
  function scoreCandidates(seedRows,historyStats={}){
    const {counts,adj}=networkState(seedRows),arts=articulationPoints(adj),maxDeg=Math.max(1,...[...adj.values()].map(s=>s.size));const rows=[];const cohort=historyStats.__cohort||{},cohortDup=Math.max(0,Math.min(1,Number(cohort.duplicate_rate)||0)),cohortRetry=Math.max(0,Math.min(1,Number(cohort.retry_rate)||0));
    for(const [puuid,obs] of counts){
      const degree=(adj.get(puuid)||new Set()).size,stat=historyStats[puuid]||{},dupRate=Number(stat.duplicate_rate)||0,retries=Number(stat.retries)||0;
      const repeat_connection_value=(obs>=2?2.75+Math.min(2.25,(obs-2)*0.35):0.15)+1.25*Math.log1p(degree)/Math.log1p(maxDeg);
      const uncertainty_reduction_value=(2/Math.sqrt(Math.max(1,obs)))*(obs>=2?1.25:0.45);
      const bridgeBonus=arts.has(puuid)?1.25:0;
      const component_density_value=1.5*(degree/maxDeg)+bridgeBonus;
      const duplicate_cost=2.25*dupRate+Math.max(0,obs-5)*0.13+0.8*cohortDup*Math.min(1,obs/4);
      const request_cost=0.2+Math.min(1,retries)*0.2+0.2*cohortRetry;
      const priority=repeat_connection_value+uncertainty_reduction_value+component_density_value-duplicate_cost-request_cost;
      rows.push({puuid,appearances:obs,known_degree:degree,is_articulation:arts.has(puuid),priority,components:{repeat_connection_value,uncertainty_reduction_value,component_density_value,duplicate_cost,request_cost}});
    }
    return rows.sort((a,b)=>b.priority-a.priority||b.appearances-a.appearances||b.known_degree-a.known_degree||a.puuid.localeCompare(b.puuid));
  }
  function mergeExpansion(existingRows,fetchedRows,targetPuuid){
    const existing=dedupeMatches(standardMatches(existingRows)),existingIds=new Set(existing.map(matchId)),knownBefore=new Map(networkState(existing).counts),valid=dedupeMatches(standardMatches(fetchedRows));
    const targetHits=valid.filter(g=>participantPuuids(g).includes(targetPuuid)).length;const duplicates=valid.filter(g=>existingIds.has(matchId(g))),fresh=valid.filter(g=>!existingIds.has(matchId(g)));
    const knownSet=new Set(knownBefore.keys());let newPlayers=0,knownAppearances=0;const allNewPlayers=new Set();for(const g of fresh)for(const p of participantPuuids(g)){if(knownSet.has(p))knownAppearances++;else allNewPlayers.add(p)}newPlayers=allNewPlayers.size;
    const afterRows=dedupeMatches([...existing,...fresh]),knownAfter=networkState(afterRows).counts;let crossed2=0,crossed5=0,crossed10=0;for(const [p,before] of knownBefore){const after=knownAfter.get(p)||before;if(before<2&&after>=2)crossed2++;if(before<5&&after>=5)crossed5++;if(before<10&&after>=10)crossed10++}
    const information_gain=knownAppearances+3*crossed2+4*crossed5+5*crossed10-0.5*duplicates.length-0.1*newPlayers;
    return {valid,target_hits:targetHits,duplicates,new_matches:fresh,after_rows:afterRows,new_players:newPlayers,already_known_player_appearances:knownAppearances,threshold_crossings:{two_plus:crossed2,five_plus:crossed5,ten_plus:crossed10},information_gain};
  }
  return {matchId,matchTime,queueId,participants,participantPuuids,standardMatches,dedupeMatches,seedFingerprint,networkState,articulationPoints,kpis,phaseASeedFromEnvelope,scoreCandidates,mergeExpansion};
});
