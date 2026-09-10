'use strict';
(()=>{
  const V='0.15.70';
  if(window.__ARAM_RANDOM_INGAME_RUNTIME_V01570__)return;

  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const now=()=>globalThis.performance?.now?.()||Date.now();
  const counters={
    bootstrapIntervalsSuppressed:0,
    bootstrapObserversSuppressed:0,
    bootstrapClicksSuppressed:0,
    legacyDetailRendersSuppressed:0,
    legacyAnalysisRendersSuppressed:0,
    ticks:0,
    inactiveSkips:0,
    busySkips:0,
    semanticRefreshes:0,
    volatileRefreshes:0,
    postRenders:0,
    shopRefreshes:0,
    globalIconRefreshes:0,
    longTasks:0,
    maxTickMs:0
  };
  const layerMs=Object.create(null);
  let finished=false,timer=0,bodyObserver=null,postTimer=0,globalIconTimer=0,lastSemanticSig='',lastTickAt=0,lastShopAt=0;

  // The legacy v0.15.50-v0.15.57 stack grew one interval per patch and v0.15.51
  // also installed a subtree observer. During this narrow bootstrap window we let the
  // historical scripts create their UI/APIs, but suppress their recurring schedulers.
  const upstreamSetInterval=window.setInterval;
  const NativeMutationObserver=window.MutationObserver;
  const nativeDocAdd=document.addEventListener;

  function suppressedInterval(){counters.bootstrapIntervalsSuppressed++;return 0}
  try{window.setInterval=suppressedInterval}catch{}
  try{
    if(typeof NativeMutationObserver==='function'){
      window.MutationObserver=class AramSuppressedRandomIngameObserver{
        constructor(){counters.bootstrapObserversSuppressed++}
        observe(){} disconnect(){} takeRecords(){return[]}
      };
    }
  }catch{}
  try{
    document.addEventListener=function(type,listener,options){
      if(!finished&&type==='click'&&options===true){
        let src='';try{src=Function.prototype.toString.call(listener)}catch{}
        if(src.includes('#random,.randomModeNav')){counters.bootstrapClicksSuppressed++;return}
      }
      return nativeDocAdd.call(this,type,listener,options);
    };
  }catch{}

  function randomMode(){
    try{if(typeof randomViewMode!=='undefined')return randomViewMode}catch{}
    return $('#random')?.getAttribute?.('data-random-mode')||'';
  }
  function randomActive(){const root=$('#random');return !!root&&root.classList.contains('active')&&randomMode()==='ingame'&&document.visibilityState!=='hidden'}
  function perfBusy(){return !!window.__ARAM_PERF_PAUSE_V01568__}
  function liveState(){try{return typeof lolAutoSync!=='undefined'?lolAutoSync?.lastState:null}catch{return null}}

  // v0.15.50 hides #randomIngameShell, but the base renderer was still rebuilding that
  // hidden legacy UI every ~2 seconds. Keep the legacy renderer available in pick mode,
  // but stop duplicate hidden rendering while the new in-game coach owns the screen.
  let legacyRenderRandomDetails=null,legacyRenderRandomAnalysis=null;
  try{
    if(typeof renderRandomDetails==='function'){
      legacyRenderRandomDetails=renderRandomDetails;
      const wrappedDetails=function(...args){
        if(randomMode()==='ingame'){
          counters.legacyDetailRendersSuppressed++;
          scheduleTick(0,false);
          return;
        }
        return legacyRenderRandomDetails.apply(this,args);
      };
      renderRandomDetails=wrappedDetails;
      try{window.renderRandomDetails=wrappedDetails}catch{}
    }
    if(typeof renderRandomAnalysis==='function'){
      legacyRenderRandomAnalysis=renderRandomAnalysis;
      const wrappedAnalysis=function(...args){
        if(randomMode()==='ingame'){
          counters.legacyAnalysisRendersSuppressed++;
          scheduleTick(0,true);
          return;
        }
        return legacyRenderRandomAnalysis.apply(this,args);
      };
      renderRandomAnalysis=wrappedAnalysis;
      try{window.renderRandomAnalysis=wrappedAnalysis}catch{}
    }
  }catch{}

  function timed(name,fn){
    if(typeof fn!=='function')return;
    const a=now();
    try{return fn()}catch(e){console.error(`[v${V}] ${name} failed`,e)}finally{
      const ms=Math.max(0,now()-a);layerMs[name]=Math.max(layerMs[name]||0,ms);
      if(ms>=120)counters.longTasks++;
    }
  }
  function coachRender(force=false){
    const fn=window.aramRandomIngamePreviewV01550?.render;
    if(typeof fn==='function')return timed('coach',()=>fn(!!force));
  }
  function postRender(){
    if(!randomActive()||perfBusy())return;
    counters.postRenders++;
    timed('ux51',()=>window.aramRandomIngameUxV01551?.refresh?.());
    timed('ux52',()=>window.aramRandomIngameUxV01552?.refresh?.());
    const shell=$('#riCoachShellV01550');
    if(shell&&$('[data-ri-tab="build"].active',shell))refreshShopPipeline(true);
    else timed('icons56',()=>window.aramRandomItemIconsV01556?.refresh?.());
  }
  function schedulePost(){
    clearTimeout(postTimer);
    postTimer=setTimeout(()=>{postTimer=0;postRender()},0);
  }
  function bindBodyObserver(){
    try{bodyObserver?.disconnect?.()}catch{}
    bodyObserver=null;
    const body=$('#riCoachBodyV01550');
    if(!body||typeof NativeMutationObserver!=='function')return;
    bodyObserver=new NativeMutationObserver(()=>schedulePost());
    bodyObserver.observe(body,{childList:true});
  }

  function semanticSignature(){
    const s=liveState();
    if(!s||s.phase!=='in_game'||!s.isAram)return JSON.stringify([s?.phase||'offline',!!s?.isAram,randomMode()]);
    const rows=[...(s.inGameOurDetail||[]),...(s.inGameEnemyDetail||[])].map(p=>[
      p?.championName||'',Number(p?.level)||0,
      Number(p?.scores?.kills)||0,Number(p?.scores?.deaths)||0,Number(p?.scores?.assists)||0,Number(p?.scores?.creepScore)||0,
      !!p?.isDead,(p?.items||[]).map(x=>`${x?.itemID||''}:${x?.count||1}`).join(',')
    ]);
    const ev=(s.recentEvents||[]).slice(-1)[0]||{};
    let modes='';try{if(typeof randomState!=='undefined')modes=JSON.stringify([randomState?.ourModes||{},randomState?.enemyModes||{}])}catch{}
    // Do not key on exact seconds/gold: those are volatile. Keep only a coarse timing bucket
    // plus the respawn decision boundary so AUTO can still switch at <=7 seconds.
    const local=localLivePlayer(s),respawn=Math.max(0,Math.ceil(Number(local?.respawnTimer)||0));
    const respawnBand=!local?.isDead&&respawn<=0?'alive':respawn>7?'dead':'respawn';
    const timeBucket=Math.floor(Math.max(0,Number(s.gameTime)||0)/30);
    return JSON.stringify([s.phase,!!s.isAram,rows,ev.eventName||'',ev.killerName||'',ev.victimName||'',modes,respawnBand,timeBucket]);
  }

  function localLivePlayer(s){
    const ours=s?.inGameOurDetail||[];
    const direct=ours.find(x=>x?.isLocal);if(direct)return direct;
    const localName=s?.localChampion?.name||s?.localChampion?.championName||'';
    return localName?ours.find(x=>x?.championName===localName):null;
  }
  function updateVolatile(){
    const shell=$('#riCoachShellV01550'),s=liveState();if(!shell||!s||s.phase!=='in_game'||!s.isAram||shell.classList.contains('preview'))return;
    counters.volatileRefreshes++;
    const sec=Math.max(0,Math.floor(Number(s.gameTime)||0)),clock=`LIVE ${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
    const em=$('.riHeroTop em',shell);if(em&&/^LIVE\s+\d{2}:\d{2}/.test(em.textContent||''))em.textContent=String(em.textContent).replace(/^LIVE\s+\d{2}:\d{2}/,clock);
    const local=localLivePlayer(s),respawn=Math.max(0,Math.ceil(Number(local?.respawnTimer)||0));
    const rs=$('.riRespawnStrip strong',shell);if(rs&&respawn>0&&rs.textContent!==`${respawn}초`)rs.textContent=`${respawn}초`;
    const gold=$('.riRespawnStrip b',shell),goldText=`보유 골드 ${Math.max(0,Math.floor(Number(s.currentGold)||0)).toLocaleString('ko-KR')}`;
    if(gold&&gold.textContent!==goldText)gold.textContent=goldText;
  }
  function refreshShopPipeline(force=false){
    const shell=$('#riCoachShellV01550');if(!shell)return;
    const buildActive=!!$('[data-ri-tab="build"].active',shell);
    if(!buildActive)return;
    const t=Date.now();if(!force&&t-lastShopAt<1800)return;lastShopAt=t;
    counters.shopRefreshes++;
    timed('shop53',()=>window.aramRandomIngameShopV01553?.refresh?.());
    timed('shop54',()=>window.aramRandomIngameShopPolishV01554?.refresh?.());
    timed('icons56',()=>window.aramRandomItemIconsV01556?.refresh?.());
  }
  function refreshGlobalIcons(){
    if(randomActive())return;
    counters.globalIconRefreshes++;
    timed('icons57',()=>window.aramItemIconsGlobalV01557?.refresh?.());
  }
  function scheduleGlobalIcons(){
    clearTimeout(globalIconTimer);
    globalIconTimer=setTimeout(()=>{globalIconTimer=0;refreshGlobalIcons()},140);
  }

  function tick(force=false){
    const a=now();lastTickAt=Date.now();counters.ticks++;
    if(perfBusy()){counters.busySkips++;return}
    if(!randomActive()){counters.inactiveSkips++;if(counters.ticks%3===0)refreshGlobalIcons();return}
    const sig=semanticSignature();
    if(force||sig!==lastSemanticSig){
      lastSemanticSig=sig;counters.semanticRefreshes++;coachRender(force);schedulePost();
    }
    updateVolatile();
    refreshShopPipeline();
    const ms=Math.max(0,now()-a);counters.maxTickMs=Math.max(counters.maxTickMs,ms);if(ms>=180)counters.longTasks++;
  }
  function scheduleTick(delay=0,force=false){setTimeout(()=>tick(!!force),Math.max(0,Number(delay)||0))}

  function finishBootstrap(){
    if(finished)return;
    finished=true;
    try{window.setInterval=upstreamSetInterval}catch{}
    try{if(NativeMutationObserver)window.MutationObserver=NativeMutationObserver}catch{}
    try{document.addEventListener=nativeDocAdd}catch{}
    bindBodyObserver();
    // One owner heartbeat replaces the five historical random in-game polling loops.
    timer=upstreamSetInterval.call(window,()=>tick(false),1000);
    nativeDocAdd.call(document,'click',e=>{
      const modeBtn=e.target?.closest?.('#randomPickModeBtn,#randomIngameModeBtn');
      if(modeBtn){
        setTimeout(()=>{
          timed('ux51',()=>window.aramRandomIngameUxV01551?.refresh?.());
          if(randomMode()==='ingame')scheduleTick(0,true);else scheduleGlobalIcons();
        },0);
        return;
      }
      if(e.target?.closest?.('#nav .randomTab'))scheduleTick(0,true);
      else if(e.target?.closest?.('#nav .tab'))scheduleGlobalIcons();
    },true);
    nativeDocAdd.call(document,'visibilitychange',()=>{if(document.visibilityState==='visible'){bindBodyObserver();scheduleTick(0,true);scheduleGlobalIcons()}},{passive:true});
    window.addEventListener?.('focus',()=>{bindBodyObserver();scheduleTick(0,true)},{passive:true});
    scheduleTick(0,true);
  }

  window.aramRandomIngameRuntimeV01570={
    version:V,finishBootstrap,tick:()=>tick(true),refresh:()=>tick(true),getStats:()=>({version:V,finished,active:randomActive(),lastTickAt,timer:!!timer,observer:!!bodyObserver,counters:{...counters},maxLayerMs:{...layerMs}}),
    score_logic_changed:false,
    architecture:'single-heartbeat + semantic render gate + hidden legacy renderer suppression'
  };
  window.__ARAM_RANDOM_INGAME_RUNTIME_V01570__=true;
  // Fail-safe: never leave bootstrap hooks installed if a later historical layer throws.
  setTimeout(()=>{if(!finished)finishBootstrap()},10000);
})();
