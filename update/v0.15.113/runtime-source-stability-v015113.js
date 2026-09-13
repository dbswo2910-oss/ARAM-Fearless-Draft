'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('./runtime-source-stability-v015112')}catch{prior=require('../v0.15.112/runtime-source-stability-v015112')}

let cachedUi='';
function uiSourceV015113(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'random-workspace-readable-v015113.js');
  const repo=path.join(__dirname,'..','v0.15.113','random-workspace-readable-v015113.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_RANDOM_WORKSPACE_READABLE_V015113__'))throw new Error('v0.15.113 UI source contract mismatch');
  return cachedUi;
}
function appendUiV015113(src){
  if(src.includes('__ARAM_RANDOM_WORKSPACE_READABLE_V015113__'))return src;
  return src+'\n;\n'+uiSourceV015113()+'\n';
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='brand-header-v01538.js'||file==='input-interaction-stability-v01539.js')src=appendUiV015113(src);
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  random_pick_workspace_changed:true,
  random_right_rail_conflict_removed:true,
  random_decision_area_changed:true,
  data_views_changed:false,
  activation_targets:['brand-header-v01538.js','input-interaction-stability-v01539.js'],
  policy_version:'0.15.113'
};
