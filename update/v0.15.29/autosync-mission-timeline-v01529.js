'use strict';
function patch(coreMod){
  const Core=coreMod?.LeagueAutoSyncCore;
  if(!Core||Core.prototype.__ARAM_MISSION_TIMELINE_V01529__)return coreMod;
  const oldGet=Core.prototype.getAramMatchHistory;
  if(typeof oldGet!=='function')throw new Error('getAramMatchHistory unavailable');
  const num=(v,d=null)=>{const n=Number(v);return Number.isFinite(n)?n:d};
  const str=v=>v==null?'':String(v);
  const arr=v=>Array.isArray(v)?v:[];
  const canon=v=>{const s=str(v).trim();if(!s)return'';const m=s.match(/(?:^|_)(\d{5,})$/);return m?m[1]:s};
  const pid=p=>num(p?.participantId??p?.participant?.participantId);
  const eventType=e=>str(e?.type??e?.eventType??e?.name).toUpperCase();
  const eventTime=e=>num(e?.timestamp??e?.eventTime??e?.time,0)||0;
  const assists=e=>arr(e?.assistingParticipantIds??e?.assistants??e?.assistingParticipants).map(x=>num(x)).filter(x=>x!==null);
  function frames(root){
    if(Array.isArray(root?.frames))return root.frames;
    if(Array.isArray(root?.timeline?.frames))return root.timeline.frames;
    if(Array.isArray(root?.data?.frames))return root.data.frames;
    if(Array.isArray(root))return root;
    return [];
  }
  function allEvents(root){
    const out=[];
    for(const f of frames(root))for(const e of arr(f?.events))out.push(e);
    for(const e of arr(root?.events))out.push(e);
    return out.sort((a,b)=>eventTime(a)-eventTime(b));
  }
  function participantSets(m){
    const our=new Set(arr(m?.ourTeam).map(pid).filter(x=>x!==null));
    const enemy=new Set(arr(m?.enemyTeam).map(pid).filter(x=>x!==null));
    const me=pid(m?.me);
    return{our,enemy,me,complete:me!==null&&our.size>=5&&enemy.size>=5};
  }
  function isOurKill(e,sets){const k=num(e?.killerId);const v=num(e?.victimId);return k!==null&&v!==null&&sets.our.has(k)&&sets.enemy.has(v)}
  function isEnemyKill(e,sets){const k=num(e?.killerId);const v=num(e?.victimId);return k!==null&&v!==null&&sets.enemy.has(k)&&sets.our.has(v)}
  function meTakedown(e,sets){return isOurKill(e,sets)&&(num(e?.killerId)===sets.me||assists(e).includes(sets.me))}
  function summarize(root,m){
    const sets=participantSets(m),ev=allEvents(root),kills=ev.filter(e=>eventType(e)==='CHAMPION_KILL');
    if(!sets.complete)return{available:false,reason:'participant-id-incomplete',eventCount:ev.length,killEventCount:kills.length,source:'LCU game timeline'};
    const deaths=kills.filter(e=>num(e?.victimId)===sets.me),rows=[];
    for(const d of deaths){
      const t=eventTime(d),before=kills.filter(e=>e!==d&&eventTime(e)>=t-8000&&eventTime(e)<=t),after=kills.filter(e=>eventTime(e)>t&&eventTime(e)<=t+10000);
      const mePrior=before.filter(e=>meTakedown(e,sets)).length;
      const allyBefore=before.filter(e=>isOurKill(e,sets)).length;
      const enemyBefore=before.filter(e=>isEnemyKill(e,sets)).length;
      const allyAfter=after.filter(e=>isOurKill(e,sets)).length;
      const enemyAfter=after.filter(e=>isEnemyKill(e,sets)).length;
      const netOther=(allyBefore+allyAfter)-(enemyBefore+enemyAfter),postDeathByMe=after.filter(e=>meTakedown(e,sets)).length;
      const productive=(mePrior>0&&netOther>=0)||(allyAfter>0&&netOther>0)||postDeathByMe>0;
      const strong=(mePrior>0&&allyAfter>0)||(allyAfter>=2&&netOther>=1)||postDeathByMe>0||netOther>=2;
      rows.push({timestamp:t,mePriorTakedowns:mePrior,allyKillsBefore:allyBefore,enemyKillsBefore:enemyBefore,allyKillsAfter:allyAfter,enemyKillsAfter:enemyAfter,netOther,postDeathTakedownsByMe:postDeathByMe,productive,strong});
    }
    const productiveDeaths=rows.filter(x=>x.productive).length,strongDeaths=rows.filter(x=>x.strong).length;
    return{available:true,source:'LCU /lol-match-history/v1/game-timelines/{gameId}',windowMs:{before:8000,after:10000},eventCount:ev.length,killEventCount:kills.length,deathCount:deaths.length,productiveDeaths,strongDeaths,followupAllyKills:rows.reduce((a,x)=>a+x.allyKillsAfter,0),followupEnemyKills:rows.reduce((a,x)=>a+x.enemyKillsAfter,0),meTakedownsBeforeDeaths:rows.reduce((a,x)=>a+x.mePriorTakedowns,0),postDeathTakedownsByMe:rows.reduce((a,x)=>a+x.postDeathTakedownsByMe,0),rows};
  }
  async function getSummary(core,m){
    const gid=canon(m?.gameId);if(!gid)return{available:false,reason:'game-id-missing'};
    const cache=core.__aramMissionTimelineCacheV01529||(core.__aramMissionTimelineCacheV01529=new Map());
    if(cache.has(gid))return cache.get(gid);
    let out;
    try{const payload=await core.lcuGet(`/lol-match-history/v1/game-timelines/${encodeURIComponent(gid)}`,1800);out=summarize(payload,m)}catch(e){out={available:false,reason:'timeline-unavailable',error:e?.message||String(e),source:'LCU game timeline'}}
    cache.set(gid,out);if(cache.size>120){const first=cache.keys().next().value;cache.delete(first)}return out;
  }
  async function enrich(core,matches){
    const xs=arr(matches),max=Math.min(xs.length,40);let cursor=0,serviceFailures=0,circuitOpen=false;
    const workers=Array.from({length:Math.min(6,max)},async()=>{while(true){const i=cursor++;if(i>=max)break;const m=xs[i];if(circuitOpen){m.missionTimelineV01529={available:false,reason:'timeline-circuit-open'};continue}try{const r=await getSummary(core,m);m.missionTimelineV01529=r;if(r?.reason==='timeline-unavailable'&&++serviceFailures>=6)circuitOpen=true}catch(e){m.missionTimelineV01529={available:false,reason:'timeline-error',error:e?.message||String(e)};if(++serviceFailures>=6)circuitOpen=true}}});
    await Promise.all(workers);return xs;
  }
  Core.prototype.getAramMatchHistory=async function(opts={}){
    const out=await oldGet.call(this,opts);if(!out||!Array.isArray(out.matches))return out;
    await enrich(this,out.matches);
    out.timelineCoverage=out.matches.filter(m=>m?.missionTimelineV01529?.available).length;
    out.timelineRequested=Math.min(out.matches.length,40);
    return out;
  };
  Core.prototype.__ARAM_MISSION_TIMELINE_V01529__=true;
  coreMod.summarizeMissionTimelineV01529=summarize;
  coreMod.__ARAM_MISSION_TIMELINE_PATCH_V01529__=true;
  return coreMod;
}
module.exports={patch};
