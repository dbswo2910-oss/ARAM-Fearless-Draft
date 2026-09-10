'use strict';
(()=>{
  const V='0.15.72';
  if(window.__ARAM_GLOBAL_PERFORMANCE_V01572__)return;

  const nativeSetInterval=window.setInterval.bind(window);
  const nativeClearInterval=window.clearInterval.bind(window);
  const NativeMutationObserver=window.MutationObserver;
  const nativeDocAdd=document.addEventListener.bind(document);
  const nativeDocRemove=document.removeEventListener.bind(document);
  const nativeWinAdd=window.addEventListener.bind(window);
  const now=()=>globalThis.performance?.now?.()??Date.now();
  const ownerNow=()=>String(window.__ARAM_LOADING_RUNTIME_V01572__||'');
  const managedRandom=new Set([
    'random-practice-focus-v01549.js',
    'random-pick-density-v01555.js',
    'random-party-picks-v01558.js',
    'runtime-performance-v01568.js'
  ]);
  const records=new Map();
  const observers=new Set();
  const listenerMap=new WeakMap();
  let large=false,largeTimer=0,randomTimer=0,randomBeat=0,randomBusy=false,randomSuppressUntil=0,finished=false;
  const counters={
    intervalsCreated:0,intervalCalls:0,intervalHiddenSkips:0,intervalClamped:0,
    observersCreated:0,observerCalls:0,observerHiddenSkips:0,observerCoalesced:0,
    listenersWrapped:0,listenerHiddenSkips:0,
    randomObserversSuppressed:0,randomListenersSuppressed:0,randomIntervalsSuppressed:0,randomRefreshes:0,
    largeModeToggles:0,longTasks:0,longTaskMaxMs:0,longTaskTotalMs:0
  };

  function rec(owner){
    owner=owner||'unknown';
    let x=records.get(owner);if(!x){x={timerCalls:0,timerMaxMs:0,observerCalls:0,observerMaxMs:0,eventCalls:0,eventMaxMs:0};records.set(owner,x)}
    return x;
  }
  function timed(owner,kind,fn,thisArg,args){
    const t=now();
    try{return fn.apply(thisArg,args)}finally{
      const ms=Math.max(0,now()-t),r=rec(owner);
      if(kind==='timer'){r.timerCalls++;r.timerMaxMs=Math.max(r.timerMaxMs,ms)}
      else if(kind==='observer'){r.observerCalls++;r.observerMaxMs=Math.max(r.observerMaxMs,ms)}
      else{r.eventCalls++;r.eventMaxMs=Math.max(r.eventMaxMs,ms)}
    }
  }
  function activeView(){return document.querySelector('.view.active')?.id||''}
  function profileOpen(){return !!document.querySelector('#pp19ov.open,#rmDetailOverlay.open,.profileDetailOverlay.open,.scoreExplainOverlay.open')}
  function scopeFor(owner){
    const o=String(owner||'').toLowerCase();
    if(!o)return null;
    if(o.includes('random-')||o.includes('random_')||o.includes('runtime-performance-v01568'))return new Set(['random']);
    if(o.includes('builder-')||o.includes('draft-')||o.includes('catch-resilience'))return new Set(['online','builder','live','series']);
    if(o.includes('match-lab'))return new Set(['history']);
    if(o.includes('player-profile')||o.includes('role-profile')||o.includes('role-mastery')||o.includes('profile-ux')||o.includes('riot-grade-calibration'))return new Set(['data','history']);
    if(o.includes('riot-grade-ui')||o.includes('riot-grade-autosnapshot'))return new Set(['history']);
    return null;
  }
  function relevant(owner){
    if(profileOpen()&&/player-profile|role-profile|role-mastery|profile-ux|riot-grade-calibration/i.test(owner||''))return true;
    const s=scopeFor(owner);return !s||s.has(activeView());
  }
  function minInterval(owner,requested){
    if(requested<=0)return requested;
    if(/community-calibration|riot-grade|autosync-live-runtime/i.test(owner||''))return requested;
    return requested<1500?1500:requested;
  }

  window.setInterval=function(fn,delay,...args){
    const owner=ownerNow();
    if(managedRandom.has(owner)){
      counters.randomIntervalsSuppressed++;
      return -720000-counters.randomIntervalsSuppressed;
    }
    const requested=Math.max(0,Number(delay)||0),effective=minInterval(owner,requested);
    if(effective!==requested)counters.intervalClamped++;
    counters.intervalsCreated++;
    if(typeof fn!=='function')return nativeSetInterval(fn,effective,...args);
    const wrapped=function(...cbArgs){
      if(!relevant(owner)){counters.intervalHiddenSkips++;return}
      counters.intervalCalls++;return timed(owner,'timer',fn,this,cbArgs);
    };
    return nativeSetInterval(wrapped,effective,...args);
  };
  window.clearInterval=function(id){if(Number(id)<=-720001)return;return nativeClearInterval(id)};

  class GovernedMutationObserver{
    constructor(cb){
      this.cb=cb;this.owner=ownerNow();this.targets=[];this.pending=[];this.timer=0;this.dirty=false;this.suppressed=managedRandom.has(this.owner);
      counters.observersCreated++;observers.add(this);
      if(this.suppressed){counters.randomObserversSuppressed++;this.native=null;return}
      this.native=new NativeMutationObserver((rs)=>this.onRecords(rs));
    }
    observe(target,opts){this.targets.push(target);this.native?.observe(target,opts)}
    disconnect(){if(this.timer)clearTimeout(this.timer);this.timer=0;this.pending=[];this.native?.disconnect();observers.delete(this)}
    takeRecords(){const a=this.native?.takeRecords?.()||[];const b=this.pending.splice(0);return b.concat(a)}
    onRecords(rs){
      if(!relevant(this.owner)){this.pending.length=0;this.dirty=true;counters.observerHiddenSkips++;return}
      if(this.timer){if(this.pending.length<180)this.pending.push(...rs.slice(0,180-this.pending.length));counters.observerCoalesced++;return}
      this.pending=rs.slice(0,180);this.timer=setTimeout(()=>this.flush(),90);
    }
    flush(force=false){
      if(this.timer){clearTimeout(this.timer);this.timer=0}
      if(!force&&!relevant(this.owner)){this.pending.length=0;this.dirty=true;return}
      const rs=this.pending.splice(0);this.dirty=false;counters.observerCalls++;
      if(typeof this.cb==='function')return timed(this.owner,'observer',this.cb,this,[rs,this]);
    }
  }
  if(typeof NativeMutationObserver==='function')window.MutationObserver=GovernedMutationObserver;

  function wrapDocListener(type,listener,options){
    const owner=ownerNow();
    if(typeof listener!=='function'||!['click','input','change','keydown','focusin'].includes(type))return nativeDocAdd(type,listener,options);
    if(managedRandom.has(owner)&&['click','input','change'].includes(type)){
      counters.randomListenersSuppressed++;
      return;
    }
    const wrapped=function(...args){
      if(!relevant(owner)){counters.listenerHiddenSkips++;return}
      return timed(owner,'event',listener,this,args);
    };
    listenerMap.set(listener,wrapped);counters.listenersWrapped++;
    return nativeDocAdd(type,wrapped,options);
  }
  document.addEventListener=function(type,listener,options){return wrapDocListener(type,listener,options)};
  document.removeEventListener=function(type,listener,options){return nativeDocRemove(type,listenerMap.get(listener)||listener,options)};

  function ensureStyle(){
    if(document.getElementById('aramGlobalPerformanceStyleV01572'))return;
    const st=document.createElement('style');st.id='aramGlobalPerformanceStyleV01572';
    st.textContent=`
      body.aramLargeViewportV01572{background:#08111f!important}
      body.aramLargeViewportV01572 *,body.aramLargeViewportV01572 *::before,body.aramLargeViewportV01572 *::after{
        backdrop-filter:none!important;-webkit-backdrop-filter:none!important;transition-duration:0s!important
      }
      body.aramLargeViewportV01572 header,
      body.aramLargeViewportV01572 .panel,
      body.aramLargeViewportV01572 .combo,
      body.aramLargeViewportV01572 .card,
      body.aramLargeViewportV01572 .builderWorkspaceNav,
      body.aramLargeViewportV01572 .draftHubNav,
      body.aramLargeViewportV01572 .randomModeNav,
      body.aramLargeViewportV01572 .profileDetailModal,
      body.aramLargeViewportV01572 .scoreExplainModal,
      body.aramLargeViewportV01572 .dataDetailPanel,
      body.aramLargeViewportV01572 .routeCard{box-shadow:none!important}
      body.aramLargeViewportV01572 header,
      body.aramLargeViewportV01572 .builderWorkspaceNav,
      body.aramLargeViewportV01572 .draftHubNav,
      body.aramLargeViewportV01572 .randomModeNav{background-color:#0a1829!important}
      body.aramLargeViewportV01572 .view:not(.active){display:none!important;content-visibility:hidden!important}
      body.aramLargeViewportV01572 .view.active{contain:style}
    `;
    document.head.appendChild(st);
  }
  function calcLarge(){
    const w=Math.max(0,window.innerWidth||0),h=Math.max(0,window.innerHeight||0);
    return w*h>=1750000 || (w>=1900&&h>=900);
  }
  function syncLarge(){
    ensureStyle();const next=calcLarge();
    if(next!==large){large=next;counters.largeModeToggles++;document.body?.classList?.toggle('aramLargeViewportV01572',large)}
  }
  function scheduleLarge(){clearTimeout(largeTimer);largeTimer=setTimeout(syncLarge,140)}

  function runRandomMaintenance(){
    randomTimer=0;if(randomBusy||activeView()!=='random')return;
    const t=now();if(t<randomSuppressUntil)return;
    randomBusy=true;counters.randomRefreshes++;
    try{
      window.aramRandomPracticeFocusV01549?.refresh?.();
      window.aramRandomPickDensityV01555?.refresh?.();
      window.aramRandomPartyPicksV01558?.refresh?.();
      window.aramRuntimePerformanceV01568?.refresh?.();
    }finally{randomSuppressUntil=now()+130;randomBusy=false}
  }
  function scheduleRandom(delay=90){
    if(activeView()!=='random')return;
    clearTimeout(randomTimer);randomTimer=setTimeout(runRandomMaintenance,delay);
  }
  function installRandomOwner(){
    if(randomBeat)return;
    const root=document.getElementById('random');if(!root){setTimeout(installRandomOwner,180);return}
    const mo=new NativeMutationObserver(()=>{if(now()<randomSuppressUntil||randomBusy)return;scheduleRandom(100)});
    for(const id of ['comboResults','externalCheck','poolInputs','externalInputs','manualPartyInputs']){
      const el=document.getElementById(id);if(el)mo.observe(el,{childList:true,subtree:true,characterData:true,attributes:true});
    }
    nativeDocAdd('input',e=>{if(e.target?.closest?.('#random'))scheduleRandom(80)},true);
    nativeDocAdd('change',e=>{if(e.target?.closest?.('#random'))scheduleRandom(80)},true);
    nativeDocAdd('click',e=>{if(e.target?.closest?.('#random'))scheduleRandom(110)},true);
    randomBeat=nativeSetInterval(()=>{if(activeView()==='random')scheduleRandom(0)},2000);
    scheduleRandom(0);
  }

  function flushActivated(){
    for(const o of observers){if(o.dirty&&relevant(o.owner))o.flush(true)}
    scheduleRandom(30);syncLarge();
  }
  function wrapShowTab(){
    const old=window.showTab;if(typeof old!=='function'||old.__aramGlobalPerfV01572)return;
    const wrapped=function(...a){const r=old.apply(this,a);setTimeout(flushActivated,0);return r};
    wrapped.__aramGlobalPerfV01572=true;window.showTab=wrapped;
  }
  function finishBootstrap(){
    if(finished)return;finished=true;window.__ARAM_LOADING_RUNTIME_V01572__='';
    wrapShowTab();installRandomOwner();syncLarge();
  }

  nativeWinAdd('resize',scheduleLarge,{passive:true});
  nativeDocAdd('visibilitychange',()=>{if(document.visibilityState==='visible')flushActivated()},{passive:true});
  try{
    if(typeof PerformanceObserver==='function'&&PerformanceObserver.supportedEntryTypes?.includes?.('longtask')){
      const po=new PerformanceObserver(list=>{for(const e of list.getEntries()){const d=Number(e.duration)||0;counters.longTasks++;counters.longTaskTotalMs+=d;counters.longTaskMaxMs=Math.max(counters.longTaskMaxMs,d)}});
      po.observe({entryTypes:['longtask']});
    }
  }catch{}
  ensureStyle();syncLarge();

  window.aramGlobalPerformanceV01572={
    version:V,finishBootstrap,syncLarge,refreshRandom:()=>scheduleRandom(0),
    getStats:()=>({version:V,large,activeView:activeView(),counters:{...counters},owners:Object.fromEntries(records),managedRandom:[...managedRandom],score_logic_changed:false}),
    score_logic_changed:false
  };
  window.__ARAM_GLOBAL_PERFORMANCE_V01572__=true;
})();
