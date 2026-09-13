'use strict';
const fs=require('fs');
const path=require('path');
let base;
try{base=require('../v0.15.119/runtime-source-stability-v015119')}catch{base=require('./runtime-source-stability-v015119')}

const OWNER_SENTINEL='/* ARAM_UI_STABILITY_OWNER_PAYLOAD_V015115 */';
let cachedUi='';
function uiSourceV015120(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'ui-stability-baseline-v015115.js');
  const repo=path.join(__dirname,'..','v0.15.120','ui-stability-baseline-v015115.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_DATA_SUBNAV_RESTORE_V015120__'))throw new Error('v0.15.120 Data submenu source contract mismatch');
  if(!cachedUi.includes('__ARAM_UI_STABILITY_BASELINE_V015115__'))throw new Error('v0.15.120 must preserve v0.15.115 owner marker');
  return cachedUi;
}
function replaceUiOwnerPayload(src){
  const i=String(src).indexOf(OWNER_SENTINEL);
  if(i<0)throw new Error('v0.15.120 existing v0.15.115 UI owner payload missing');
  if(String(src).indexOf(OWNER_SENTINEL,i+OWNER_SENTINEL.length)>=0)throw new Error('v0.15.120 duplicate UI owner payload');
  return String(src).slice(0,i+OWNER_SENTINEL.length)+'\n'+uiSourceV015120()+'\n';
}
function patchRuntimeSource(file,input){
  let src=base.patchRuntimeSource(file,input);
  if(file==='input-interaction-stability-v01539.js')src=replaceUiOwnerPayload(src);
  return src;
}

module.exports={
  ...base,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  single_owner_ui_baseline_changed:false,
  data_subnav_restored:true,
  data_view_owner:'ui-stability-v015115',
  data_presentation_revision:'0.15.120',
  random_pick_owner:'runtime-v015100',
  state_integrity_owner:'state-integrity-v015117',
  resource_lifecycle_owner:'resource-lifecycle-v015118',
  autosync_main_owner:'autosync-concurrency-v015119',
  autosync_renderer_owner:'runtime-live-autosync-v01571+v015119',
  activation_targets:[...new Set([...(base.activation_targets||[]),'input-interaction-stability-v01539.js'])],
  policy_version:'0.15.120'
};
