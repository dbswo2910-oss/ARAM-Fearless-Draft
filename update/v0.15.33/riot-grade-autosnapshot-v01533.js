'use strict';
(()=>{
  const V='0.15.33';
  const api=window.aramRiotGradeCalibrationHistoryV01532;
  if(!api?.syncSnapshots)throw new Error('v0.15.32 calibration history missing');
  let busy=false,lastRunAt=0,lastResult=null,timer=null;
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const canon=v=>{const s=String(v??'').trim(),m=s.match(/(?:^|_)(\d{5,})$/);return m?m[1]:s};
  function currentSignature(state){
    const ms=Array.isArray(aramHistoryState?.matches)?aramHistoryState.matches:[];
    const gids=ms.slice(0,40).map(m=>canon(m?.gameId)).filter(Boolean).join(',');
    return `${aramHistoryState?.queueMode||''}|${gids}|${num(state?.records)}|${num(state?.lastCaptureAt)}`;
  }
  let lastSig='';
  async function tick(force=false){
    if(busy||!window.aramDesktop?.getRiotGradeState)return lastResult;
    const ms=Array.isArray(aramHistoryState?.matches)?aramHistoryState.matches:[];
    if(!ms.length)return lastResult;
    busy=true;
    try{
      const state=await window.aramDesktop.getRiotGradeState(),sig=currentSignature(state),now=Date.now();
      if(!force&&sig===lastSig&&now-lastRunAt<60000)return lastResult;
      const res=await api.syncSnapshots(state);lastSig=sig;lastRunAt=now;lastResult={...(res||{}),at:now};
      if(num(res?.updated)>0){try{api.render?.()}catch{}}
      return lastResult;
    }catch(e){lastResult={updated:0,error:e?.message||String(e),at:Date.now()};return lastResult}finally{busy=false}
  }
  function start(){if(timer)return;setTimeout(()=>tick(true),3500);timer=setInterval(()=>tick(false),30000);timer.unref?.()}
  function stop(){if(timer)clearInterval(timer);timer=null}
  try{
    const oldFeedback=typeof renderAramHistoryFeedback==='function'?renderAramHistoryFeedback:null;
    if(oldFeedback)renderAramHistoryFeedback=function(...a){const r=oldFeedback.apply(this,a);setTimeout(()=>tick(true),900);return r};
  }catch{}
  window.addEventListener('focus',()=>setTimeout(()=>tick(false),600),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(()=>tick(false),600)},{passive:true});
  start();
  window.aramRiotGradeAutoSnapshotV01533={tick,start,stop,get lastResult(){return lastResult},get lastRunAt(){return lastRunAt}};
  window.__ARAM_RIOT_GRADE_AUTOSNAPSHOT_V01533__=true;
  if(typeof DATA!=='undefined'){DATA.version=V;DATA.riot_grade_autosnapshot_v01533={version:'v0.15.33 · Riot Grade Auto Snapshot',interval_ms:30000,profile_open_not_required:true,scoring_use:false,requires_loaded_match_history:true}}
  if(typeof syncAppVersionUI==='function')syncAppVersionUI();
})();
