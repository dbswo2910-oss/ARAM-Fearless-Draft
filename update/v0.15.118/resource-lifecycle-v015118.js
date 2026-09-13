'use strict';
(()=>{
  const V='0.15.118';
  if(window.__ARAM_RESOURCE_LIFECYCLE_V015118__)return;
  let disposed=false;
  const stats={snapshots:0,disposeCalls:0,disposeErrors:0,lastDisposeReason:''};
  const readStats=(obj)=>{try{return typeof obj?.getStats==='function'?obj.getStats():null}catch(e){return{error:e?.message||String(e)}}};
  function snapshot(){
    stats.snapshots++;
    return{
      version:V,
      disposed,
      randomPractice:{ready:!!window.__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__,disposable:typeof window.aramRandomPracticeRuntimeV01572?.dispose==='function',stats:readStats(window.aramRandomPracticeRuntimeV01572)},
      randomIngame:{ready:!!window.__ARAM_RANDOM_INGAME_RUNTIME_V01570__,disposable:typeof window.aramRandomIngameRuntimeV01570?.dispose==='function',stats:readStats(window.aramRandomIngameRuntimeV01570)},
      liveAutoSync:{ready:!!window.__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__,disposable:typeof window.aramLiveAutosyncRuntimeV01571?.dispose==='function',stats:readStats(window.aramLiveAutosyncRuntimeV01571)},
      uiOwner:!!window.__ARAM_UI_STABILITY_BASELINE_V015115__,
      stateIntegrity:!!window.__ARAM_STATE_INTEGRITY_V015117__,
      counters:{...stats}
    };
  }
  function dispose(reason='manual'){
    stats.disposeCalls++;stats.lastDisposeReason=String(reason||'manual');
    if(disposed)return false;disposed=true;
    for(const owner of [window.aramRandomPracticeRuntimeV01572,window.aramRandomIngameRuntimeV01570,window.aramLiveAutosyncRuntimeV01571]){
      try{owner?.dispose?.(stats.lastDisposeReason)}catch(e){stats.disposeErrors++}
    }
    return true;
  }
  window.aramResourceLifecycleV015118={version:V,snapshot,dispose,getStats:()=>({...stats,disposed}),score_logic_changed:false,random_scoring_changed:false,ui_owner_changed:false};
  window.__ARAM_RESOURCE_LIFECYCLE_V015118__=true;
  window.addEventListener('beforeunload',()=>dispose('beforeunload'),{once:true});
})();
