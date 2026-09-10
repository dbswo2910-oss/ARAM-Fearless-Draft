'use strict';
function patch(mod){
  if(!mod||mod.__ARAM_AUTOSYNC_LIVE_RUNTIME_V01571__)return mod;
  const Core=mod.LeagueAutoSyncCore;if(!Core?.prototype)return mod;
  const NOW=()=>Date.now();
  const inGame=core=>core?.state?.phase==='in_game'||/^InProgress$/i.test(String(core?.state?.gameflowPhase||''));

  // The historical core refreshed every 750 ms. In a live game that meant repeated
  // LCU identity/lobby/gameflow traffic plus five Live Client requests per tick.
  // 1200 ms is still fast enough for a one-glance ARAM coach while leaving headroom
  // for the renderer and League itself.
  Core.prototype.start=function(){
    if(this.timer)return;
    this.tick().catch(()=>{});
    this.timer=setInterval(()=>this.tick().catch(()=>{}),1200);
  };

  const oldCapture=Core.prototype.captureIdentityAndParty;
  if(typeof oldCapture==='function'){
    Core.prototype.captureIdentityAndParty=async function(...args){
      if(inGame(this)){
        const t=NOW(),last=Number(this.__aramLiveIdentityAtV01571||0);
        if(last&&t-last<15000)return;
        this.__aramLiveIdentityAtV01571=t;
      }
      return oldCapture.apply(this,args);
    };
  }

  const oldRefresh=Core.prototype.refreshCreds;
  if(typeof oldRefresh==='function'){
    Core.prototype.refreshCreds=async function(...args){
      if(inGame(this)&&this.creds){
        const t=NOW(),last=Number(this.__aramLiveCredsAtV01571||0);
        if(last&&t-last<3000)return true;
        const out=await oldRefresh.apply(this,args);if(out)this.__aramLiveCredsAtV01571=t;return out;
      }
      const out=await oldRefresh.apply(this,args);if(out)this.__aramLiveCredsAtV01571=NOW();return out;
    };
  }

  const oldFlow=Core.prototype.gameflowInfo;
  if(typeof oldFlow==='function'){
    Core.prototype.gameflowInfo=async function(...args){
      const t=NOW();
      if(inGame(this)&&this.__aramLiveFlowCacheV01571&&t-Number(this.__aramLiveFlowAtV01571||0)<3000)return this.__aramLiveFlowCacheV01571;
      const out=await oldFlow.apply(this,args);
      this.__aramLiveFlowCacheV01571=out;this.__aramLiveFlowAtV01571=t;return out;
    };
  }

  // active player name is constant during the match; event history only needs a few-second
  // cadence for coaching. Player list / active player / game stats stay fresh every core tick.
  const oldLiveGet=Core.prototype.liveGet;
  if(typeof oldLiveGet==='function'){
    Core.prototype.liveGet=async function(pathname,...args){
      const p=String(pathname||'');
      const ttl=p.includes('/activeplayername')?15000:p.includes('/eventdata')?3000:0;
      const cache=this.__aramLiveEndpointCacheV01571||(this.__aramLiveEndpointCacheV01571=new Map());
      if(ttl>0){
        const row=cache.get(p),t=NOW();if(row&&t-row.at<ttl)return row.value;
        try{const value=await oldLiveGet.call(this,pathname,...args);cache.set(p,{at:t,value});return value}catch(e){if(row)return row.value;throw e}
      }
      return oldLiveGet.call(this,pathname,...args);
    };
  }

  mod.aramAutosyncLiveRuntimeV01571={version:'0.15.71',coreIntervalMs:1200,identityRefreshMs:15000,gameflowRefreshMs:3000,eventRefreshMs:3000,score_logic_changed:false};
  mod.__ARAM_AUTOSYNC_LIVE_RUNTIME_V01571__=true;
  return mod;
}
module.exports={patch};
