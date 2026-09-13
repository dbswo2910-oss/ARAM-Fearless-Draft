'use strict';
const fs=require('fs');
const path=require('path');
let base;
try{base=require('../v0.15.117/runtime-source-stability-v015117')}catch{base=require('./runtime-source-stability-v015117')}

const OWNER_SENTINEL='/* ARAM_RESOURCE_LIFECYCLE_OWNER_V015118 */';
const RP_SENTINEL='/* ARAM_RESOURCE_LIFECYCLE_PATCH_V015118_RANDOM_PRACTICE */';
const RI_SENTINEL='/* ARAM_RESOURCE_LIFECYCLE_PATCH_V015118_RANDOM_INGAME */';
const AS_SENTINEL='/* ARAM_RESOURCE_LIFECYCLE_PATCH_V015118_AUTOSYNC */';
let cached='';
function lifecycleSource(){
  if(cached)return cached;
  const local=path.join(__dirname,'resource-lifecycle-v015118.js');
  const repo=path.join(__dirname,'..','v0.15.118','resource-lifecycle-v015118.js');
  const p=fs.existsSync(local)?local:repo;
  cached=fs.readFileSync(p,'utf8');
  if(!cached.includes('__ARAM_RESOURCE_LIFECYCLE_V015118__'))throw new Error('v0.15.118 resource lifecycle source contract mismatch');
  return cached;
}
function count(src,needle){return String(src).split(needle).length-1}
function exact(src,from,to,label){
  if(src.includes(to))return src;
  const n=count(src,from);if(n!==1)throw new Error(`v0.15.118 source contract mismatch ${label} count=${n}`);
  return src.replace(from,to);
}
function appendLifecycleOwner(src){
  if(src.includes(OWNER_SENTINEL))return src;
  return src+'\n;\n'+OWNER_SENTINEL+'\n'+lifecycleSource()+'\n';
}
function patchRandomPractice(src){
  if(src.includes(RP_SENTINEL))return src;
  src=exact(src,
    '  let maintenanceTimer=0,analysisTimer=0,detailTimer=0,comboTimer=0,comboGeneration=0;',
    '  let maintenanceTimer=0,analysisTimer=0,detailTimer=0,comboTimer=0,comboGeneration=0,longTaskObserver=null,disposed=false;',
    'random-practice lifecycle state');
  src=exact(src,
    "      const po=new PerformanceObserver(list=>{for(const e of list.getEntries()){const d=Number(e.duration)||0;counters.longTasks++;counters.maxTaskMs=Math.max(counters.maxTaskMs,d)}});po.observe({entryTypes:['longtask']});",
    "      longTaskObserver=new PerformanceObserver(list=>{for(const e of list.getEntries()){const d=Number(e.duration)||0;counters.longTasks++;counters.maxTaskMs=Math.max(counters.maxTaskMs,d)}});longTaskObserver.observe({entryTypes:['longtask']});",
    'random-practice observer tracking');
  const api='  window.aramRandomPracticeRuntimeV01572={';
  const dispose=`  function dispose(reason='manual'){\n    if(disposed)return false;disposed=true;comboGeneration++;\n    for(const id of [maintenanceTimer,analysisTimer,detailTimer,comboTimer]){try{clearTimeout(id)}catch{}}\n    maintenanceTimer=analysisTimer=detailTimer=comboTimer=0;maintenanceBusy=analysisBusy=detailBusy=comboBusy=false;\n    try{longTaskObserver?.disconnect?.()}catch{}longTaskObserver=null;scoreCache.clear();\n    return true;\n  }\n\n  ${RP_SENTINEL}\n`;
  src=exact(src,api,dispose+api,'random-practice disposer insertion');
  src=exact(src,'    version:V,refresh:()=>scheduleMaintenance(0),onAutoSyncState,','    version:V,dispose,refresh:()=>{if(!disposed)scheduleMaintenance(0)},onAutoSyncState,','random-practice disposer export');
  return src;
}
function patchRandomIngame(src){
  if(src.includes(RI_SENTINEL))return src;
  src=exact(src,
    "  let finished=false,timer=0,bodyObserver=null,postTimer=0,globalIconTimer=0,lastSemanticSig='',lastTickAt=0,lastShopAt=0;",
    "  let finished=false,timer=0,bodyObserver=null,postTimer=0,globalIconTimer=0,tickTimer=0,tickDueAt=0,pendingTickForce=false,disposed=false,lastSemanticSig='',lastTickAt=0,lastShopAt=0;",
    'random-ingame lifecycle state');
  src=exact(src,
    '  function scheduleTick(delay=0,force=false){setTimeout(()=>tick(!!force),Math.max(0,Number(delay)||0))}',
    "  function scheduleTick(delay=0,force=false){\n    if(disposed)return;pendingTickForce=pendingTickForce||!!force;const due=Date.now()+Math.max(0,Number(delay)||0);\n    if(tickTimer&&tickDueAt<=due)return;clearTimeout(tickTimer);tickDueAt=due;\n    tickTimer=setTimeout(()=>{tickTimer=0;tickDueAt=0;if(disposed)return;const f=pendingTickForce;pendingTickForce=false;tick(!!f)},Math.max(0,due-Date.now()));\n  }\n  function scheduleHeartbeat(delay=1000){\n    clearTimeout(timer);if(disposed||!finished){timer=0;return}\n    timer=setTimeout(()=>{timer=0;if(disposed||!finished)return;tick(false);const next=randomActive()?1000:(document.visibilityState==='hidden'?8000:3500);scheduleHeartbeat(next)},Math.max(250,Number(delay)||1000));\n  }",
    'random-ingame tick coalescing');
  src=exact(src,'    if(finished)return;','    if(finished||disposed)return;','random-ingame disposed bootstrap guard');
  src=exact(src,
    '    timer=upstreamSetInterval.call(window,()=>tick(false),1000);',
    '    scheduleHeartbeat(1000);',
    'random-ingame adaptive heartbeat');
  src=exact(src,
    "    if(!randomActive()){counters.inactiveSkips++;if(counters.ticks%3===0)refreshGlobalIcons();return}",
    "    if(!randomActive()){counters.inactiveSkips++;if(randomMode()!=='ingame'||document.visibilityState==='hidden'){try{bodyObserver?.disconnect?.()}catch{}bodyObserver=null}if(counters.ticks%3===0)refreshGlobalIcons();return}",
    'random-ingame inactive observer suspension');
  src=exact(src,
    "    nativeDocAdd.call(document,'visibilitychange',()=>{if(document.visibilityState==='visible'){bindBodyObserver();scheduleTick(0,true);scheduleGlobalIcons()}},{passive:true});",
    "    nativeDocAdd.call(document,'visibilitychange',()=>{if(document.visibilityState==='visible'){bindBodyObserver();scheduleTick(0,true);scheduleGlobalIcons();scheduleHeartbeat(1000)}else{try{bodyObserver?.disconnect?.()}catch{}bodyObserver=null;clearTimeout(postTimer);postTimer=0}},{passive:true});",
    'random-ingame hidden suspension');
  const api='  window.aramRandomIngameRuntimeV01570={';
  const dispose=`  function dispose(reason='manual'){\n    if(disposed)return false;disposed=true;finished=false;pendingTickForce=false;\n    for(const id of [timer,tickTimer,postTimer,globalIconTimer]){try{clearTimeout(id)}catch{}}\n    timer=tickTimer=postTimer=globalIconTimer=0;tickDueAt=0;\n    try{bodyObserver?.disconnect?.()}catch{}bodyObserver=null;\n    return true;\n  }\n\n  ${RI_SENTINEL}\n`;
  src=exact(src,api,dispose+api,'random-ingame disposer insertion');
  src=exact(src,'    version:V,finishBootstrap,','    version:V,dispose,finishBootstrap,','random-ingame disposer export');
  return src;
}
function patchLiveAutosync(src){
  if(src.includes(AS_SENTINEL))return src;
  src=exact(src,
    "  let busy=false,pendingForce=false,lastUiSig='',lastHistorySig='',linkedGameId='';",
    "  let busy=false,pendingForce=false,followupTimer=0,disposed=false,lastUiSig='',lastHistorySig='',linkedGameId='';",
    'autosync lifecycle state');
  src=exact(src,
    '      const wrapped=async function(force=false){',
    "      const wrapped=async function(force=false){\n        if(disposed)return typeof lolAutoSync!=='undefined'?lolAutoSync?.lastState:null;",
    'autosync disposed poll guard');
  src=exact(src,
    '          if(pendingForce){pendingForce=false;counters.forcedFollowups++;setTimeout(()=>wrapped(true),0)}',
    "          if(pendingForce){pendingForce=false;counters.forcedFollowups++;if(!followupTimer)followupTimer=setTimeout(()=>{followupTimer=0;if(!disposed)wrapped(true)},0)}",
    'autosync followup coalescing');
  const api='  window.aramLiveAutosyncRuntimeV01571={';
  const dispose=`  function dispose(reason='manual'){\n    if(disposed)return false;disposed=true;pendingForce=false;clearTimeout(followupTimer);followupTimer=0;\n    try{if(typeof lolAutoSync!=='undefined'&&lolAutoSync?.timer){clearInterval(lolAutoSync.timer);lolAutoSync.timer=null}}catch{}\n    return true;\n  }\n\n  ${AS_SENTINEL}\n`;
  src=exact(src,api,dispose+api,'autosync disposer insertion');
  src=exact(src,'window.aramLiveAutosyncRuntimeV01571={version:V,getStats:','window.aramLiveAutosyncRuntimeV01571={version:V,dispose,getStats:','autosync disposer export');
  return src;
}
function patchRuntimeSource(file,input){
  let src=base.patchRuntimeSource(file,input);
  if(file==='runtime-random-practice-v01572.js')src=patchRandomPractice(src);
  if(file==='runtime-random-ingame-v01570.js')src=patchRandomIngame(src);
  if(file==='runtime-live-autosync-v01571.js')src=patchLiveAutosync(src);
  if(file==='input-interaction-stability-v01539.js')src=appendLifecycleOwner(src);
  return src;
}
module.exports={
  ...base,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  single_owner_ui_baseline_changed:false,
  resource_lifecycle_changed:true,
  resource_lifecycle_owner:'resource-lifecycle-v015118',
  resource_lifecycle_target:'input-interaction-stability-v01539.js',
  random_pick_owner:'runtime-v015100',
  data_view_owner:'ui-stability-v015115',
  state_integrity_owner:'state-integrity-v015117',
  random_ingame_tick_coalesced:true,
  random_ingame_adaptive_heartbeat:true,
  random_practice_observer_disposable:true,
  autosync_followup_coalesced:true,
  activation_targets:[...new Set([...(base.activation_targets||[]),'runtime-random-practice-v01572.js','runtime-random-ingame-v01570.js','runtime-live-autosync-v01571.js','input-interaction-stability-v01539.js'])],
  policy_version:'0.15.118'
};
