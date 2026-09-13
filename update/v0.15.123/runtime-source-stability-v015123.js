'use strict';
const fs=require('fs');
const path=require('path');
let base;
try{base=require('../v0.15.122/runtime-source-stability-v015122')}catch{base=require('./runtime-source-stability-v015122')}

const NOTICE_SENTINEL='/* ARAM_PATCH_NOTES_STARTUP_NOTICE_V015123 */';
const STATE_SENTINEL='/* ARAM_STATE_INTEGRITY_PAYLOAD_V015117 */';
let cachedNotice='';
function noticeSource(){
  if(cachedNotice)return cachedNotice;
  const local=path.join(__dirname,'patch-notes-startup-notice-v015123.js');
  const repo=path.join(__dirname,'..','v0.15.123','patch-notes-startup-notice-v015123.js');
  const p=fs.existsSync(local)?local:repo;
  cachedNotice=fs.readFileSync(p,'utf8');
  if(!cachedNotice.includes('__ARAM_PATCH_NOTES_STARTUP_NOTICE_V015123__'))throw new Error('v0.15.123 startup notice source contract mismatch');
  if(!cachedNotice.includes("aramUiStabilityV015115?.syncData?.('patch')"))throw new Error('v0.15.123 must route through existing DATA owner');
  return cachedNotice;
}
function injectNotice(src){
  src=String(src);
  if(src.includes(NOTICE_SENTINEL))return src;
  const stateAt=src.indexOf(STATE_SENTINEL);
  if(stateAt<0)throw new Error('v0.15.123 state-integrity suffix missing');
  return src.slice(0,stateAt)+NOTICE_SENTINEL+'\n'+noticeSource()+'\n;\n'+src.slice(stateAt);
}
function patchRuntimeSource(file,input){
  let src=base.patchRuntimeSource(file,input);
  if(file==='input-interaction-stability-v01539.js')src=injectNotice(src);
  return src;
}
module.exports={
  ...base,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  patch_notes_startup_notice:true,
  patch_notes_notice_persistence:'per-patch-version',
  patch_notes_route_owner:'ui-stability-v015115',
  random_pick_owner:'runtime-v015100',
  data_view_owner:'ui-stability-v015115',
  state_integrity_owner:'state-integrity-v015117',
  resource_lifecycle_owner:'resource-lifecycle-v015118',
  autosync_main_owner:'autosync-concurrency-v015119',
  autosync_renderer_owner:'runtime-live-autosync-v01571+v015119',
  activation_targets:[...new Set([...(base.activation_targets||[]),'input-interaction-stability-v01539.js'])],
  policy_version:'0.15.123'
};
