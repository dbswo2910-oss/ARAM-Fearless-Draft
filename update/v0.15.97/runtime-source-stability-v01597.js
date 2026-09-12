'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01596')}catch{prior=require('../v0.15.96/runtime-source-stability-v01596')}

function countOf(src,needle){return String(src).split(needle).length-1}
function replaceSectionV01597(src,start,end,replacement,label){
  const n=countOf(src,start);if(n!==1)throw new Error(`v0.15.97 ${label} start contract mismatch=${n}`);
  const a=src.indexOf(start),b=src.indexOf(end,a+start.length);if(a<0||b<0)throw new Error(`v0.15.97 ${label} end contract mismatch`);
  return src.slice(0,a)+replacement+src.slice(b);
}

function patchCoachV01597(src){
  if(src.includes('function resultObjectsV01597('))return src;

  const normalizeStart='  function normalizeResultGameV01595(g){';
  const normalizeEnd='  function kdaV01595(x){';
  const compat=`  function resultObjectsV01597(g){
    const out=[],seen=new Set(),push=x=>{if(!x||typeof x!=='object'||seen.has(x))return;seen.add(x);out.push(x)};
    push(g);push(g?.game);push(g?.match);push(g?.data);push(g?.raw);push(g?.info);push(g?.gameData);
    return out;
  }
  function resultStatsV01597(p){
    const xs=[p?.stats,p?.statistics,p?.playerStats,p?.gameStats,p?.scores,p?.score,p?.combatStats,p];
    for(const x of xs){if(!x||typeof x!=='object')continue;if(['kills','deaths','assists','item0','totalDamageDealtToChampions','totalDamageTaken','win'].some(k=>Object.prototype.hasOwnProperty.call(x,k)))return x}
    return (xs.find(x=>x&&typeof x==='object')||{});
  }
  function resultIdentityValuesV01597(x){
    if(!x||typeof x!=='object')return[];const p=x.player&&typeof x.player==='object'?x.player:x;
    const riot=[p.riotId,p.gameName&&p.tagLine?String(p.gameName)+'#'+String(p.tagLine):'',p.gameName,p.summonerName,p.displayName];
    return [p.puuid,p.summonerId,p.accountId,...riot].filter(v=>v!==undefined&&v!==null&&String(v).trim()).map(v=>String(v).trim().toLowerCase());
  }
  function resultAccountHintsV01597(){
    const h=historyStateV01595()||{},xs=[h.account,h.localAccount];
    try{if(typeof lolAutoSync!=='undefined')xs.push(lolAutoSync?.lastState?.account)}catch{}
    const set=new Set();for(const x of xs)for(const v of resultIdentityValuesV01597(x))set.add(v);return set;
  }
  function resultParticipantV01597(g){
    const roots=resultObjectsV01597(g),arrays=[];for(const r of roots){for(const xs of [r?.participants,r?.playerParticipants,r?.participantStats,r?.info?.participants])if(Array.isArray(xs))arrays.push(xs)}
    const participants=arrays.flat().filter(x=>x&&typeof x==='object');
    let resolved=null;try{if(typeof aramHistoryResolveParticipant==='function')resolved=aramHistoryResolveParticipant(g)}catch{}
    const resolvedId=(typeof resolved==='number'||typeof resolved==='string')?String(resolved):'';
    if(resolved&&typeof resolved==='object'){
      if(resolved.participant&&typeof resolved.participant==='object')return Object.assign({},resolved.participant,resolved,{stats:resolved.stats||resolved.participant.stats});
      return resolved;
    }
    const directs=[];for(const r of roots)directs.push(r?.me,r?.participant,r?.player,r?.localParticipant,r?.self,r?.localPlayer,r?.myParticipant);
    for(const x of directs){if(x&&typeof x==='object'){if(x.participant&&typeof x.participant==='object')return Object.assign({},x.participant,x,{stats:x.stats||x.participant.stats});return x}}
    const targetIds=new Set([resolvedId,...roots.flatMap(r=>[r?.meParticipantId,r?.localParticipantId,r?.participantId,r?.playerParticipantId])].filter(Boolean).map(String));
    const hints=resultAccountHintsV01597();
    for(const r of roots){
      const ids=Array.isArray(r?.participantIdentities)?r.participantIdentities:Array.isArray(r?.identities)?r.identities:[];
      for(const ident of ids){const vals=resultIdentityValuesV01597(ident);if(vals.some(v=>hints.has(v))&&ident?.participantId!==undefined)targetIds.add(String(ident.participantId))}
    }
    for(const p of participants){if(p?.isMe||p?.isLocal||p?.localPlayer)return p;const vals=resultIdentityValuesV01597(p);if(vals.some(v=>hints.has(v)))return p;if(targetIds.size&&targetIds.has(String(p?.participantId??p?.id??'')))return p}
    return {};
  }
  function resultItemsV01597(g,p,s){
    const roots=resultObjectsV01597(g),lists=[p?.items,p?.inventory,s?.items,s?.inventory];for(const r of roots)lists.push(r?.items,r?.inventory,r?.stats?.items);
    for(const xs of lists){if(Array.isArray(xs)&&xs.length)return xs.map(x=>x&&typeof x==='object'?(x.itemId??x.id??x.item??x):x).filter(x=>x!==undefined&&x!==null&&Number(x)!==0).slice(0,7)}
    const vals=[];for(let i=0;i<=6;i++){let v=s?.['item'+i]??p?.['item'+i];if(v===undefined)for(const r of roots){v=r?.['item'+i]??r?.stats?.['item'+i];if(v!==undefined)break}if(v!==undefined&&v!==null&&Number(v)!==0)vals.push(v)}return vals.slice(0,7);
  }
  function resultChampionV01597(g,p,s){
    const roots=resultObjectsV01597(g),names=[p?.championName,p?.champion?.name,p?.champion?.displayName,s?.championName];for(const r of roots)names.push(r?.championName,r?.champion?.name,r?.champion,r?.champ,r?.actualChampion);
    for(const v of names){if(typeof v==='string'&&v.trim()&&!/^\\d+$/.test(v.trim()))return norm(v)}
    let id=resultNumV01595(p?.championId,p?.champion?.id,p?.champion?.key,s?.championId);if(id===null)for(const r of roots){id=resultNumV01595(r?.championId,r?.champion?.id,r?.stats?.championId);if(id!==null)break}
    if(id!==null){
      const tries=[];try{if(typeof aramHistoryChampionName==='function')tries.push(()=>aramHistoryChampionName(id))}catch{};try{if(typeof lolAutoSyncResolveChamp==='function'){tries.push(()=>lolAutoSyncResolveChamp({championId:id,id}));tries.push(()=>lolAutoSyncResolveChamp(id))}}catch{};
      for(const f of tries){try{const v=f();if(typeof v==='string'&&v.trim()&&!/^\\d+$/.test(v.trim()))return norm(v)}catch{}}
      try{if(typeof byName!=='undefined'&&byName&&typeof byName==='object'){for(const [name,m] of Object.entries(byName)){if(Number(m?.id??m?.key??m?.championId)===Number(id))return norm(m?.name||name)}}}catch{}
      return '챔피언 #'+String(id);
    }
    return '챔피언 미확인';
  }
  function resultWinV01597(g,p,s){
    const roots=resultObjectsV01597(g);let v=s?.win??p?.win;for(const r of roots){if(v!==undefined&&v!==null)break;v=r?.win??r?.victory??r?.result??r?.outcome??r?.stats?.win}
    if(typeof v==='boolean')return v?'WIN':'LOSS';const z=String(v??'').toUpperCase();if(/WIN|VICTORY|승/.test(z))return'WIN';if(/LOSS|DEFEAT|패/.test(z))return'LOSS';return'UNKNOWN';
  }
  function resultCompatTimeV01597(g){
    for(const r of resultObjectsV01597(g)){const n=resultNumV01595(r?.gameEndTimestamp,r?.gameEnd,r?.timestamp,r?.ts,r?.createdAt,r?.gameCreation,r?.gameCreationDate,r?.gameStartTimestamp);if(n!==null)return n}return 0;
  }
  function resultCompatNumV01597(g,p,s,keys){
    for(const k of keys){const n=resultNumV01595(s?.[k],p?.[k]);if(n!==null)return n;for(const r of resultObjectsV01597(g)){const z=resultNumV01595(r?.[k],r?.stats?.[k]);if(z!==null)return z}}return null;
  }
  function normalizeResultGameV01595(g){
    const p=resultParticipantV01597(g)||{},s=resultStatsV01597(p)||{};
    const kills=resultCompatNumV01597(g,p,s,['kills']),deaths=resultCompatNumV01597(g,p,s,['deaths']),assists=resultCompatNumV01597(g,p,s,['assists']);
    const damage=resultCompatNumV01597(g,p,s,['totalDamageDealtToChampions','damageDealtToChampions','damageDealt']);
    const taken=resultCompatNumV01597(g,p,s,['totalDamageTaken','damageTaken']);
    const cc=resultCompatNumV01597(g,p,s,['timeCCingOthers','totalTimeCCDealt','totalTimeCrowdControlDealt','ccTime','cc']);
    const vision=resultCompatNumV01597(g,p,s,['visionScore','vision']);
    let duration=null;for(const r of resultObjectsV01597(g)){duration=resultNumV01595(r?.gameDuration,r?.duration,r?.gameTime);if(duration!==null)break}
    const role=norm(p?.role||p?.teamPosition||p?.individualPosition||p?.timeline?.role||p?.timeline?.lane||s?.role||g?.role||g?.position||'');
    return{raw:g,p,result:resultWinV01597(g,p,s),champ:resultChampionV01597(g,p,s),kills,deaths,assists,damage,taken,cc,vision,items:resultItemsV01597(g,p,s),duration,time:resultCompatTimeV01597(g),role};
  }
`;
  src=replaceSectionV01597(src,normalizeStart,normalizeEnd,compat,'result-normalizer');

  const timeStart='  function resultTimeV01595(g){';
  const timeEnd='  function resultParticipantV01595(g){';
  const timeNew=`  function resultTimeV01595(g){return resultCompatTimeV01597(g)}\n`;
  src=replaceSectionV01597(src,timeStart,timeEnd,timeNew,'result-time');

  const keyStart='  function resultGameKeyV01596(g){';
  const keyEnd='  function newestResultKeyV01596(){';
  const keyNew=`  function resultGameKeyV01596(g){for(const r of resultObjectsV01597(g)){const v=r?.gameId??r?.id??r?.metadata?.matchId??r?.matchId;if(v!==undefined&&v!==null&&String(v))return String(v)}return ''}\n`;
  src=replaceSectionV01597(src,keyStart,keyEnd,keyNew,'result-game-key');
  return src;
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-ingame-coach-v01550.js')src=patchCoachV01597(src);
  return src;
}

module.exports={
  patchRuntimeSource,
  score_logic_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  route_adoption_changed:prior.route_adoption_changed===true,
  ingame_hud_changed:true,
  poro_snax_filtered:prior.poro_snax_filtered===true,
  random_pick_candidate_full_dna_preview_changed:prior.random_pick_candidate_full_dna_preview_changed===true,
  ingame_results_changed:true,
  ingame_results_auto_transition:true,
  ingame_results_history_autorefresh:true,
  ingame_results_nested_lcu_parser:true,
  ingame_results_existing_history_backfill:true,
  ingame_results_supported_stats_shapes:['participant.stats','participant.statistics','participant.playerStats','raw participantIdentities'],
  policy_version:'0.15.97'
};