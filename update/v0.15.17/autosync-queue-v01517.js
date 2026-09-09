'use strict';
function patch(coreMod){
  const Core=coreMod?.LeagueAutoSyncCore;if(!Core||Core.prototype.__ARAM_QUEUE_SPLIT_V01517__)return coreMod;
  const num=(v,d=0)=>{const n=Number(v);return Number.isFinite(n)?n:d};
  const str=v=>v==null?'':String(v);
  const arr=v=>Array.isArray(v)?v:[];
  const clone=v=>JSON.parse(JSON.stringify(v));
  const unwrap=p=>{
    if(!p||typeof p!=='object')return p;
    if(Array.isArray(p?.participants)||Array.isArray(p?.info?.participants))return p;
    if(p?.game&&typeof p.game==='object')return unwrap(p.game);
    if(Array.isArray(p?.games?.games)&&p.games.games[0])return unwrap(p.games.games[0]);
    if(Array.isArray(p?.games)&&p.games[0])return unwrap(p.games[0]);
    if(Array.isArray(p?.matches)&&p.matches[0])return unwrap(p.matches[0]);
    return p;
  };
  const classify=g=>{
    const q=num(g?.queueId||g?.info?.queueId),mode=str(g?.gameMode||g?.info?.gameMode).toUpperCase();
    if(q===450)return 'standard';
    if(q===2400)return 'mayhem';
    if(q>0)return '';
    if(mode==='KIWI'||mode.includes('MAYHEM'))return 'mayhem';
    if(mode==='ARAM')return 'standard';
    return '';
  };
  const runtimeStandard=(q,mode='',mapId=0)=>{
    q=num(q);mode=str(mode).toUpperCase();
    if(q>0)return q===450;
    if(mode==='KIWI'||mode.includes('MAYHEM'))return false;
    if(mode)return mode==='ARAM';
    return num(mapId)===12;
  };
  Core.prototype.aramFromContext=function(flow={},sess=null){
    const q=num(flow?.queueId),mode=str(flow?.gameMode).toUpperCase();
    if(q>0)return q===450?{isAram:true,source:'queue-450'}:{isAram:false,source:q===2400?'queue-2400-mayhem':'non-aram-queue'};
    if(mode==='KIWI'||mode.includes('MAYHEM'))return {isAram:false,source:'gameMode-MAYHEM'};
    if(mode==='ARAM')return {isAram:true,source:'gameMode-ARAM'};
    if(num(flow?.mapId)===12)return {isAram:true,source:'map-12-fallback'};
    if(sess?.benchEnabled===true&&(sess?.allowRerolling===true||Number(sess?.rerollsRemaining)>=0))return {isAram:true,source:'champ-select-bench-fallback'};
    return {isAram:false,source:'none'};
  };
  const oldBuildInGame=Core.prototype.buildInGame;
  Core.prototype.buildInGame=async function(phase,queueId,gameId){
    const out=await oldBuildInGame.call(this,phase,queueId,gameId);if(!out)return out;
    out.isAram=runtimeStandard(queueId,out.gameMode,out.mapId);
    if(!out.isAram&&num(queueId)===2400)out.aramSource='queue-2400-mayhem';
    return out;
  };
  Core.prototype.getAramMatchHistory=async function({limit=20,scan=80,target=null,queueMode='standard'}={}){
    limit=Math.max(1,Math.min(40,num(limit,20)));scan=Math.max(limit,Math.min(160,num(scan,80)));
    queueMode=str(queueMode).toLowerCase()==='mayhem'?'mayhem':'standard';const wantedQueueId=queueMode==='mayhem'?2400:450;
    if(!await this.refreshCreds())throw new Error('League Client가 연결되어 있지 않습니다.');
    await this.ensureChampionMap();await this.captureIdentityAndParty();
    if(!this.account?.connected)throw new Error('League Client 로그인 계정을 찾지 못했습니다.');
    const historyAccount=await this.resolveAramHistoryTarget(target);if(!historyAccount?.puuid)throw new Error('조회 대상의 PUUID를 확인하지 못했습니다.');
    const endIndex=Math.max(1,scan-1),isCurrent=!!(this.account?.puuid&&str(historyAccount.puuid)===str(this.account.puuid));
    let payload=null,source=isCurrent?'/lol-match-history/v1/products/lol/current-summoner/matches':`/lol-match-history/v1/products/lol/${encodeURIComponent(historyAccount.puuid)}/matches`;
    try{payload=await this.lcuGet(`${source}?begIndex=0&endIndex=${endIndex}`,7000)}catch(e){source=`/lol-match-history/v1/products/lol/${encodeURIComponent(historyAccount.puuid)}/matches`;payload=await this.lcuGet(`${source}?begIndex=0&endIndex=${endIndex}`,7000)}
    const rows=coreMod.extractHistoryGames(payload),out=[],errors=[];let skippedOtherAram=0,unknownAram=0;
    for(const row0 of rows){
      if(out.length>=limit)break;const row=unwrap(row0)||row0;let rowClass=classify(row);
      if(rowClass&&rowClass!==queueMode){skippedOtherAram++;continue}const q=num(row?.queueId||row?.info?.queueId);if(q>0&&!rowClass)continue;
      let game=row;const rp=arr(game?.participants).length?arr(game.participants):arr(game?.info?.participants),ri=arr(game?.participantIdentities);
      if(rp.length<10||(ri.length>0&&ri.length<rp.length)||!rowClass){const gid=str(row?.gameId||row?.metadata?.matchId);if(!gid)continue;try{game=unwrap(await this.lcuGet(`/lol-match-history/v1/games/${encodeURIComponent(gid)}`,6000))}catch(e){errors.push(`${gid}: ${e?.message||e}`);game=row}}
      const gameClass=classify(game);if(gameClass!==queueMode){if(gameClass)skippedOtherAram++;else unknownAram++;continue}
      let normalized=coreMod.normalizeAramHistoryGame(game,historyAccount,id=>this.champ(id));
      if(!normalized&&row?.gameId&&game!==row)normalized=coreMod.normalizeAramHistoryGame(row,historyAccount,id=>this.champ(id));
      if(normalized){normalized.aramQueueMode=gameClass;normalized.aramQueueLabel=gameClass==='mayhem'?'아수라장':'일반 칼바람';if(!normalized.teamContextComplete)errors.push(`${normalized.gameId}: partial ${normalized.participantCount}/10 participants`);out.push(normalized)}
    }
    out.sort((a,b)=>num(b?.gameCreation)-num(a?.gameCreation));const fullTeamCount=out.filter(x=>x?.teamContextComplete).length;
    return{connected:true,account:clone(historyAccount),localAccount:clone(this.account),targetMode:isCurrent?'current':'searched',queueMode,queueId:wantedQueueId,queueLabel:queueMode==='mayhem'?'아수라장':'일반 칼바람',sourceEndpoint:source,scanned:rows.length,count:out.length,fullTeamCount,skippedOtherAram,unknownAram,matches:out,errors:errors.slice(0,8),loadedAt:Date.now()};
  };
  Core.prototype.__ARAM_QUEUE_SPLIT_V01517__=true;
  coreMod.classifyAramQueue=classify;coreMod.runtimeStandardAramV01517=runtimeStandard;
  return coreMod;
}
module.exports={patch};
