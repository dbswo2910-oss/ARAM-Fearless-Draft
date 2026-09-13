'use strict';
const fs=require('fs');
const path=require('path');

/*
 * SINGLE-OWNER RESET
 *
 * v0.15.103-v0.15.114 accumulated independent late UI repair layers. Several
 * of them listened to the same RANDOM click/change/input events and reparented
 * the same nodes on different timers. For UI-sensitive renderer targets this
 * baseline intentionally branches from the last pre-overlay runtime (v0.15.100)
 * and adds one final, non-reparenting stability layer.
 *
 * Main-process successor lineage still comes through main-v015114, so unrelated
 * main-process safety/update work is preserved. Recommendation/scoring math is
 * unchanged.
 */
let base;
try{base=require('../v0.15.100/runtime-source-stability-v015100')}catch{base=require('./runtime-source-stability-v015100')}

let cachedUi='';
function uiSourceV015115(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'ui-stability-baseline-v015115.js');
  const repo=path.join(__dirname,'..','v0.15.115','ui-stability-baseline-v015115.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_UI_STABILITY_BASELINE_V015115__'))throw new Error('v0.15.115 UI stability source contract mismatch');
  return cachedUi;
}
function appendUiV015115(src){
  if(src.includes('__ARAM_UI_STABILITY_BASELINE_V015115__'))return src;
  return src+'\n;\n'+uiSourceV015115()+'\n';
}
function patchRuntimeSource(file,input){
  let src=base.patchRuntimeSource(file,input);
  // One global owner injection, evaluated last in the installed renderer stack.
  if(file==='input-interaction-stability-v01539.js')src=appendUiV015115(src);
  return src;
}

module.exports={
  ...base,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  item_recommendation_logic_changed:base.item_recommendation_logic_changed===true,
  single_owner_ui_baseline_changed:true,
  legacy_ui_overlay_stack_removed:true,
  random_pick_owner:'runtime-v015100',
  random_pick_reference_layout_preserved:true,
  random_candidate_preview_preserved:true,
  data_view_owner:'ui-stability-v015115',
  random_ingame_owner_preserved:true,
  interaction_reparent_loops_removed:true,
  activation_targets:[...new Set([...(base.activation_targets||[]),'input-interaction-stability-v01539.js','random-practice-focus-v01549.js'])],
  policy_version:'0.15.115'
};
