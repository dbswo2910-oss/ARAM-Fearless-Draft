'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('./runtime-source-stability-v015111')}catch{prior=require('../v0.15.111/runtime-source-stability-v015111')}

let cachedUi='';
function uiSourceV015112(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'random-workspace-stability-v015112.js');
  const repo=path.join(__dirname,'..','v0.15.112','random-workspace-stability-v015112.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_RANDOM_WORKSPACE_STABILITY_V015112__'))throw new Error('v0.15.112 UI source contract mismatch');
  return cachedUi;
}
function appendUiV015112(src){
  if(src.includes('__ARAM_RANDOM_WORKSPACE_STABILITY_V015112__'))return src;
  return src+'\n;\n'+uiSourceV015112()+'\n';
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='brand-header-v01538.js'||file==='input-interaction-stability-v01539.js')src=appendUiV015112(src);
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  random_mode_isolation_changed:true,
  random_pick_workspace_changed:true,
  random_initial_layout_flash_changed:true,
  random_dna_rail_changed:true,
  data_views_changed:false,
  activation_targets:['brand-header-v01538.js','input-interaction-stability-v01539.js'],
  policy_version:'0.15.112'
};
