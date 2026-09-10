'use strict';
(()=>{
  const V='0.15.71';
  if(window.__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__)return;
  const counters={polls:0,overlapSkips:0,forcedFollowups:0,linkedGameWrites:0,linkedGameSkips:0,syncUiPaints:0,syncUiSkips:0,historyUiPaints:0,historyUiSkips:0,maxPollMs:0};
  const now=()=>globalThis.performance?.now?.()||Date.now();
  let busy=false,pendingForce=false,lastUiSig='',lastHistorySig='',linkedGameId='';

  try{
    if(typeof lolAutoSyncPoll==='function'){
      const oldPoll=lolAutoSyncPoll;
      const wrapped=async function(force=false){
        if(busy){counters.overlapSkips++;pendingForce=pendingForce||!!force;return typeof lolAutoSync!=='undefined'?lolAutoSync?.lastState:null}
        busy=true;counters.polls++;const a=now();
        try{
          const out=await oldPoll(!!force);
          try{window.aramRandomPracticeRuntimeV01572?.onAutoSyncState?.(out)}catch{}
          return out;
        }
        finally{
          counters.maxPollMs=Math.max(counters.maxPollMs,Math.max(0,now()-a));busy=false;
          if(pendingForce){pendingForce=false;counters.forcedFollowups++;setTimeout(()=>wrapped(true),0)}
        }
      };
      lolAutoSyncPoll=wrapped;try{window.lolAutoSyncPoll=wrapped}catch{}
      try{
        if(typeof lolAutoSync!=='undefined'){
          if(lolAutoSync.timer)clearInterval(lolAutoSync.timer);
          lolAutoSync.timer=setInterval(()=>wrapped(false),1250);
        }
      }catch{}
    }
  }catch(e){console.error(`[v${V}] poll governor install failed`,e)}

  try{
    if(typeof aramTrackLinkedGame==='function'){
      const oldTrack=aramTrackLinkedGame;
      const wrapped=function(s){
        if(!s||s.phase!=='in_game'||!s.isAram){if(s?.phase!=='in_game')linkedGameId='';return oldTrack(s)}
        const gid=String(s?.game?.gameId||s?.gameId||s?.game?.id||'').trim();
        const ours=s?.inGameOur||s?.ourTeam||s?.team||[],enemy=s?.inGameEnemy||s?.enemyTeam||s?.enemy||[];
        if(!gid||ours.length<5||enemy.length<5){counters.linkedGameSkips++;return}
        if(linkedGameId===gid){counters.linkedGameSkips++;return}
        const out=oldTrack(s);linkedGameId=gid;counters.linkedGameWrites++;return out;
      };
      aramTrackLinkedGame=wrapped;try{window.aramTrackLinkedGame=wrapped}catch{}
    }
  }catch(e){console.error(`[v${V}] game-link throttle install failed`,e)}

  try{
    if(typeof lolAutoSyncRender==='function'){
      const oldRender=lolAutoSyncRender;
      const wrapped=function(){
        let s=null;try{s=typeof lolAutoSync!=='undefined'?lolAutoSync?.lastState:null}catch{}
        let sig='';try{sig=JSON.stringify([!!s?.bridgeConnected,!!s?.clientConnected,s?.phase||'',!!s?.isAram,s?.version||'',s?.partySize||0,(s?.inGameOur||[]).length,(s?.inGameEnemy||[]).length,s?.account?.riotId||s?.account?.gameName||'',typeof lolAutoSync!=='undefined'&&!!lolAutoSync?.enabled])}catch{}
        if(sig&&sig===lastUiSig){counters.syncUiSkips++;return}
        lastUiSig=sig;counters.syncUiPaints++;return oldRender();
      };
      lolAutoSyncRender=wrapped;try{window.lolAutoSyncRender=wrapped}catch{}
    }
  }catch(e){console.error(`[v${V}] sync UI dedupe install failed`,e)}

  try{
    if(typeof aramHistoryRenderAccount==='function'){
      const oldHistory=aramHistoryRenderAccount;
      const wrapped=function(){
        let s=null;try{s=typeof lolAutoSync!=='undefined'?lolAutoSync?.lastState:null}catch{}
        let mode='';try{mode=typeof aramHistoryState!=='undefined'?aramHistoryState?.targetMode||'':''}catch{}
        const sig=JSON.stringify([!!s?.clientConnected,!!s?.account?.connected,s?.account?.riotId||s?.account?.gameName||'',mode]);
        if(sig===lastHistorySig){counters.historyUiSkips++;return}
        lastHistorySig=sig;counters.historyUiPaints++;return oldHistory();
      };
      aramHistoryRenderAccount=wrapped;try{window.aramHistoryRenderAccount=wrapped}catch{}
    }
  }catch(e){console.error(`[v${V}] history UI dedupe install failed`,e)}

  window.aramLiveAutosyncRuntimeV01571={version:V,getStats:()=>({version:V,busy,pendingForce,linkedGameId,counters:{...counters}}),score_logic_changed:false,architecture:'single-flight renderer poll + once-per-game Match Lab persistence + stable AutoSync UI dedupe'};
  window.__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__=true;
})();
