'use strict';
function patch(coreMod){
  if(!coreMod||coreMod.__ARAM_CC_IMPACT_NORMALIZER_V01525__)return coreMod;
  const oldNormalize=coreMod.normalizeAramHistoryGame;
  if(typeof oldNormalize!=='function')throw new Error('normalizeAramHistoryGame unavailable');
  const num=(v,d=null)=>{const n=Number(v);return Number.isFinite(n)?n:d};
  const str=v=>v==null?'':String(v);
  const arr=v=>Array.isArray(v)?v:[];
  const rawParticipants=g=>arr(g?.info?.participants).length?arr(g.info.participants):arr(g?.participants);
  const read=(p,key)=>{
    const bags=[p,p?.stats,p?.challenges,p?.stats?.challenges,p?.participant?.stats,p?.participant?.challenges];
    for(const b of bags){if(b&&typeof b==='object'&&b[key]!==undefined&&b[key]!==null){const n=num(b[key]);if(n!==null)return n}}
    return null;
  };
  const pid=p=>num(p?.participantId??p?.participant?.participantId);
  const puuid=p=>str(p?.puuid||p?.player?.puuid||p?.participant?.puuid);
  const champ=p=>num(p?.championId??p?.participant?.championId);
  const team=p=>num(p?.teamId??p?.participant?.teamId);
  function findRawMe(game,target,out){
    const ps=rawParticipants(game);if(!ps.length)return null;
    const tp=str(target?.puuid),op=str(out?.me?.puuid);
    if(tp){const x=ps.find(p=>puuid(p)===tp);if(x)return x}
    if(op){const x=ps.find(p=>puuid(p)===op);if(x)return x}
    const ids=arr(game?.participantIdentities),ta=str(target?.accountId||target?.currentAccountId),ts=str(target?.summonerId),tn=str(target?.gameName||target?.displayName||target?.summonerName).toLowerCase();
    const ident=ids.find(x=>{const pl=x?.player||{};return(tp&&str(pl.puuid)===tp)||(ta&&(str(pl.accountId)===ta||str(pl.currentAccountId)===ta))||(ts&&str(pl.summonerId)===ts)||(tn&&str(pl.summonerName).toLowerCase()===tn)});
    const identPid=num(ident?.participantId);if(identPid!==null){const x=ps.find(p=>pid(p)===identPid);if(x)return x}
    const pId=pid(out?.me);if(pId!==null){const x=ps.find(p=>pid(p)===pId);if(x)return x}
    const c=champ(out?.me),t=team(out?.me);if(c!==null){const xs=ps.filter(p=>champ(p)===c&&(t===null||team(p)===t));if(xs.length===1)return xs[0]}
    return null;
  }
  function extract(raw){
    if(!raw)return null;
    const out={
      enemyChampionImmobilizations:read(raw,'enemyChampionImmobilizations'),
      immobilizeAndKillWithAlly:read(raw,'immobilizeAndKillWithAlly'),
      knockEnemyIntoTeamAndKill:read(raw,'knockEnemyIntoTeamAndKill'),
      highestCrowdControlScore:read(raw,'highestCrowdControlScore')
    };
    const keys=Object.keys(out).filter(k=>out[k]!==null);
    return keys.length?{...out,availableKeys:keys,source:'LCU match participant payload'}:null;
  }
  coreMod.normalizeAramHistoryGame=function(game,target,champName){
    const out=oldNormalize.apply(this,arguments);if(!out)return out;
    try{
      const raw=findRawMe(game,target,out),cc=extract(raw);
      if(cc&&out.me&&typeof out.me==='object'){
        out.me.ccImpactRaw=cc;
        for(const k of cc.availableKeys)if(out.me[k]===undefined)out.me[k]=cc[k];
        out.ccImpactRawAvailable=true;
      }else out.ccImpactRawAvailable=false;
    }catch(e){out.ccImpactRawAvailable=false;out.ccImpactRawError=e?.message||String(e)}
    return out;
  };
  coreMod.__ARAM_CC_IMPACT_NORMALIZER_V01525__=true;
  return coreMod;
}
module.exports={patch};
