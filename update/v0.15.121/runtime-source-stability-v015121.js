'use strict';
let base;
try{base=require('../v0.15.120/runtime-source-stability-v015120')}catch{base=require('./runtime-source-stability-v015120')}

const SENTINEL='/* ARAM_RANDOM_PRACTICE_RESTORE_V015121 */';
function count(src,needle){return String(src).split(needle).length-1}
function exact(src,from,to,label){
  if(src.includes(to))return src;
  const n=count(src,from);
  if(n!==1)throw new Error(`v0.15.121 source contract mismatch ${label} count=${n}`);
  return src.replace(from,to);
}

function patchRandomPractice(src){
  if(src.includes(SENTINEL))return src;

  src=exact(src,
    '  let maintenanceTimer=0,analysisTimer=0,detailTimer=0,comboTimer=0,comboGeneration=0,longTaskObserver=null,disposed=false;',
    '  let maintenanceTimer=0,analysisTimer=0,detailTimer=0,comboTimer=0,comboGeneration=0,longTaskObserver=null,disposed=false,rp121EventsBound=false,rp121EntryActive=false,rp121Handlers=null;',
    'Random Practice restore state');

  const oldEvents=`  document.addEventListener('click',e=>{\n    if(!e.target?.closest?.('#random'))return;\n    const tab=e.target.closest('button[data-rp49]');\n    if(tab&&(tab.dataset.rp49==='analysis'||tab.dataset.rp49==='detail')){setTimeout(()=>{scheduleAnalysis(0);scheduleDetails(20)},0)}\n    else scheduleMaintenance(45);\n  },true);\n  document.addEventListener('change',e=>{if(e.target?.closest?.('#random'))scheduleMaintenance(20)},true);\n  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&randomVisible())scheduleMaintenance(20)},{passive:true});\n  window.addEventListener('focus',()=>{if(randomVisible())scheduleMaintenance(20)},{passive:true});`;

  const newEvents=`  function restoreVisibleRandomPracticeV015121(reason='entry'){\n    if(disposed)return false;\n    const visible=randomVisible();\n    if(!visible){rp121EntryActive=false;return false}\n    const first=!rp121EntryActive;rp121EntryActive=true;\n    if(first){\n      try{if(typeof original.renderInputs==='function')timed(()=>original.renderInputs())}catch(e){console.warn('[v0.15.121] Random input restore failed',e)}\n      try{if(typeof renderRandomComboResults==='function')renderRandomComboResults()}catch(e){console.warn('[v0.15.121] Random TOP5 restore failed',e)}\n      try{if(typeof renderComboDetail==='function')renderComboDetail()}catch(e){console.warn('[v0.15.121] Random detail restore failed',e)}\n      try{if(typeof renderExternalCheck==='function')renderExternalCheck()}catch(e){console.warn('[v0.15.121] Random external-check restore failed',e)}\n      scheduleAnalysis(20);scheduleDetails(30);\n    }\n    scheduleMaintenance(first?0:20);\n    return true;\n  }\n  function bindRandomPracticeEventsV015121(){\n    if(rp121EventsBound||disposed)return false;\n    const onClick=e=>{\n      const inside=!!e.target?.closest?.('#random');\n      const wasVisible=randomVisible();\n      if(inside){\n        const tab=e.target?.closest?.('button[data-rp49]');\n        if(tab&&(tab.dataset.rp49==='analysis'||tab.dataset.rp49==='detail'))setTimeout(()=>{if(!disposed){scheduleAnalysis(0);scheduleDetails(20)}},0);\n        else scheduleMaintenance(45);\n        if(e.target?.closest?.('#randomPickModeBtn,#randomIngameModeBtn'))queueMicrotask(()=>restoreVisibleRandomPracticeV015121('mode-change'));\n        return;\n      }\n      queueMicrotask(()=>{\n        if(disposed)return;\n        if(!wasVisible&&randomVisible())restoreVisibleRandomPracticeV015121('view-entry');\n        else if(wasVisible&&!randomVisible())rp121EntryActive=false;\n      });\n    };\n    const onChange=e=>{if(e.target?.closest?.('#random'))scheduleMaintenance(20)};\n    const onInput=e=>{if(e.target?.closest?.('#randomInputAnchor .searchInput,#randomInputAnchor input,#randomInputAnchor select'))scheduleMaintenance(120)};\n    const onVisibility=()=>{if(document.visibilityState==='visible')restoreVisibleRandomPracticeV015121('visibility');else rp121EntryActive=false};\n    const onFocus=()=>restoreVisibleRandomPracticeV015121('focus');\n    rp121Handlers={onClick,onChange,onInput,onVisibility,onFocus};\n    document.addEventListener('click',onClick,true);\n    document.addEventListener('change',onChange,true);\n    document.addEventListener('input',onInput,true);\n    document.addEventListener('visibilitychange',onVisibility,{passive:true});\n    window.addEventListener('focus',onFocus,{passive:true});\n    rp121EventsBound=true;\n    return true;\n  }\n  function unbindRandomPracticeEventsV015121(){\n    const h=rp121Handlers;if(!h){rp121EventsBound=false;return false}\n    try{document.removeEventListener('click',h.onClick,true)}catch{}\n    try{document.removeEventListener('change',h.onChange,true)}catch{}\n    try{document.removeEventListener('input',h.onInput,true)}catch{}\n    try{document.removeEventListener('visibilitychange',h.onVisibility,{passive:true})}catch{}\n    try{window.removeEventListener('focus',h.onFocus,{passive:true})}catch{}\n    rp121Handlers=null;rp121EventsBound=false;rp121EntryActive=false;\n    return true;\n  }\n\n  ${SENTINEL}\n  bindRandomPracticeEventsV015121();`;
  src=exact(src,oldEvents,newEvents,'single disposable Random event owner');

  src=exact(src,
    "    if(disposed)return false;disposed=true;comboGeneration++;",
    "    if(disposed)return false;disposed=true;comboGeneration++;unbindRandomPracticeEventsV015121();",
    'Random Practice disposer unbind');

  src=exact(src,
    '    version:V,dispose,refresh:()=>{if(!disposed)scheduleMaintenance(0)},onAutoSyncState,',
    "    version:V,dispose,restore:()=>restoreVisibleRandomPracticeV015121('api'),refresh:()=>{if(!disposed)scheduleMaintenance(0)},onAutoSyncState,",
    'Random Practice restore API');

  src=exact(src,
    "    getStats:()=>({version:V,randomVisible:randomVisible(),mode:randomMode(),comboBusy,comboGeneration,scoreCache:scoreCache.size,counters:{...counters}}),",
    "    getStats:()=>({version:V,randomVisible:randomVisible(),mode:randomMode(),comboBusy,comboGeneration,eventsBound:rp121EventsBound,entryActive:rp121EntryActive,scoreCache:scoreCache.size,counters:{...counters}}),",
    'Random Practice diagnostics');

  src=exact(src,
    "    architecture:'single Random Practice maintenance owner + cooperative exhaustive TOP5 calculation + lazy analysis/details',",
    "    architecture:'single Random Practice maintenance owner + deterministic entry restore + cooperative exhaustive TOP5 calculation + lazy analysis/details + disposable event binding',",
    'Random Practice architecture declaration');

  src=exact(src,
    '  window.__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__=true;\n  scheduleMaintenance(0);',
    "  window.__ARAM_RANDOM_PRACTICE_RESTORE_V015121__=true;\n  window.__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__=true;\n  restoreVisibleRandomPracticeV015121('boot');",
    'Random Practice restore readiness');
  return src;
}

function patchRuntimeSource(file,input){
  let src=base.patchRuntimeSource(file,input);
  if(file==='runtime-random-practice-v01572.js')src=patchRandomPractice(src);
  return src;
}

module.exports={
  ...base,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  single_owner_ui_baseline_changed:false,
  random_practice_restore_changed:true,
  random_practice_entry_restore:true,
  random_practice_input_refresh_coalesced:true,
  random_practice_event_owner_disposable:true,
  random_pick_owner:'runtime-v015100',
  random_practice_runtime_owner:'runtime-random-practice-v01572+v015121',
  data_view_owner:'ui-stability-v015115',
  state_integrity_owner:'state-integrity-v015117',
  resource_lifecycle_owner:'resource-lifecycle-v015118',
  autosync_main_owner:'autosync-concurrency-v015119',
  autosync_renderer_owner:'runtime-live-autosync-v01571+v015119',
  activation_targets:[...new Set([...(base.activation_targets||[]),'runtime-random-practice-v01572.js'])],
  policy_version:'0.15.121'
};
