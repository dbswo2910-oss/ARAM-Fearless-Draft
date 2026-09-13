'use strict';
const fs=require('fs');
const path=require('path');
let base;
try{base=require('../v0.15.116/runtime-source-stability-v015116')}catch{base=require('./runtime-source-stability-v015116')}

const SENTINEL='/* ARAM_STATE_INTEGRITY_PAYLOAD_V015117 */';
let cached='';
function stateSource(){
  if(cached)return cached;
  const local=path.join(__dirname,'state-integrity-renderer-v015117.js');
  const repo=path.join(__dirname,'..','v0.15.117','state-integrity-renderer-v015117.js');
  const p=fs.existsSync(local)?local:repo;
  cached=fs.readFileSync(p,'utf8');
  if(!cached.includes('__ARAM_STATE_INTEGRITY_V015117__'))throw new Error('v0.15.117 state integrity source contract mismatch');
  return cached;
}
function appendStateIntegrity(src){
  if(src.includes(SENTINEL))return src;
  return src+'\n;\n'+SENTINEL+'\n'+stateSource()+'\n';
}
function patchRuntimeSource(file,input){
  let src=base.patchRuntimeSource(file,input);
  if(file==='input-interaction-stability-v01539.js')src=appendStateIntegrity(src);
  return src;
}
module.exports={
  ...base,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  state_integrity_changed:true,
  state_integrity_owner:'state-integrity-v015117',
  state_integrity_target:'input-interaction-stability-v01539.js',
  single_owner_ui_baseline_changed:false,
  random_pick_owner:'runtime-v015100',
  data_view_owner:'ui-stability-v015115',
  interaction_reparent_loops_removed:true,
  activation_targets:[...new Set([...(base.activation_targets||[]),'input-interaction-stability-v01539.js'])],
  policy_version:'0.15.117'
};
