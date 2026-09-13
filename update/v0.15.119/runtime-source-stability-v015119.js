'use strict';
let base;
try{base=require('../v0.15.118/runtime-source-stability-v015118')}catch{base=require('./runtime-source-stability-v015118')}
const SENTINEL='/* ARAM_AUTOSYNC_CONCURRENCY_PATCH_V015119 */';
function count(src,needle){return String(src).split(needle).length-1}
function exact(src,from,to,label){if(src.includes(to))return src;const n=count(src,from);if(n!==1)throw new Error(`v0.15.119 source contract mismatch ${label} count=${n}`);return src.replace(from,to)}
function patchRendererAutosync(src){
  if(src.includes(SENTINEL))return src;
  src=exact(src,
    "  const counters={polls:0,overlapSkips:0,forcedFollowups:0,linkedGameWrites:0,linkedGameSkips:0,syncUiPaints:0,syncUiSkips:0,historyUiPaints:0,historyUiSkips:0,maxPollMs:0};",
    "  const counters={polls:0,overlapSkips:0,forcedFollowups:0,linkedGameWrites:0,linkedGameSkips:0,syncUiPaints:0,syncUiSkips:0,historyUiPaints:0,historyUiSkips:0,maxPollMs:0,completedPolls:0,stalePollDrops:0};",
    'renderer counters');
  src=exact(src,
    "  let busy=false,pendingForce=false,followupTimer=0,disposed=false,lastUiSig='',lastHistorySig='',linkedGameId='';",
    "  let busy=false,pendingForce=false,followupTimer=0,disposed=false,pollSeq=0,acceptedPollSeq=0,lifecycleEpoch=1,lastUiSig='',lastHistorySig='',linkedGameId='';",
    'renderer concurrency state');
  src=exact(src,
    '        busy=true;counters.polls++;const a=now();',
    '        const seq=++pollSeq,epoch=lifecycleEpoch;busy=true;counters.polls++;const a=now();',
    'renderer poll sequence');
  src=exact(src,
    "          const out=await oldPoll(!!force);\n          try{window.aramRandomPracticeRuntimeV01572?.onAutoSyncState?.(out)}catch{}\n          return out;",
    "          const out=await oldPoll(!!force);\n          if(disposed||epoch!==lifecycleEpoch||seq<acceptedPollSeq){counters.stalePollDrops++;return typeof lolAutoSync!=='undefined'?lolAutoSync?.lastState:null}\n          acceptedPollSeq=seq;counters.completedPolls++;\n          try{window.aramRandomPracticeRuntimeV01572?.onAutoSyncState?.(out)}catch{}\n          return out;",
    'renderer stale completion guard');
  src=exact(src,
    "    if(disposed)return false;disposed=true;pendingForce=false;clearTimeout(followupTimer);followupTimer=0;",
    "    if(disposed)return false;disposed=true;lifecycleEpoch++;pendingForce=false;clearTimeout(followupTimer);followupTimer=0;",
    'renderer lifecycle epoch');
  src=exact(src,
    "window.aramLiveAutosyncRuntimeV01571={version:V,dispose,getStats:()=>({version:V,busy,pendingForce,linkedGameId,counters:{...counters}}),score_logic_changed:false,architecture:'single-flight renderer poll + once-per-game Match Lab persistence + stable AutoSync UI dedupe'};",
    "window.aramLiveAutosyncRuntimeV01571={version:V,dispose,getStats:()=>({version:V,busy,pendingForce,pollSeq,acceptedPollSeq,lifecycleEpoch,linkedGameId,counters:{...counters}}),score_logic_changed:false,architecture:'single-flight renderer poll + lifecycle epoch stale-drop + once-per-game Match Lab persistence + stable AutoSync UI dedupe'};",
    'renderer diagnostics');
  src=exact(src,
    '  window.__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__=true;',
    `  ${SENTINEL}\n  window.__ARAM_AUTOSYNC_CONCURRENCY_V015119__=true;\n  window.__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__=true;`,
    'renderer readiness marker');
  return src;
}
function patchRuntimeSource(file,input){let src=base.patchRuntimeSource(file,input);if(file==='runtime-live-autosync-v01571.js')src=patchRendererAutosync(src);return src}
module.exports={...base,patchRuntimeSource,score_logic_changed:false,random_scoring_changed:false,single_owner_ui_baseline_changed:false,resource_lifecycle_changed:false,autosync_concurrency_changed:true,autosync_main_owner:'autosync-concurrency-v015119',autosync_renderer_owner:'runtime-live-autosync-v01571+v015119',random_pick_owner:'runtime-v015100',data_view_owner:'ui-stability-v015115',state_integrity_owner:'state-integrity-v015117',resource_lifecycle_owner:'resource-lifecycle-v015118',activation_targets:[...new Set([...(base.activation_targets||[]),'runtime-live-autosync-v01571.js'])],policy_version:'0.15.119'};
