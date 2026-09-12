'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('./runtime-source-stability-v015105')}catch{prior=require('../v0.15.105/runtime-source-stability-v015105')}

let cachedUi='';
function uiSourceV015106(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'random-data-ui-hotfix-v015106.js');
  const repo=path.join(__dirname,'..','v0.15.106','random-data-ui-hotfix-v015106.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_RANDOM_DATA_HOTFIX_V015106__'))throw new Error('v0.15.106 UI source contract mismatch');
  return cachedUi;
}

function appendUiV015106(src){
  if(src.includes('__ARAM_RANDOM_DATA_HOTFIX_V015106__'))return src;
  return src+'\n;\n'+uiSourceV015106()+'\n';
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  // v0.15.105 piggy-backed only on random-practice-focus. If that transformed
  // payload errors, the isolated runtime loader intentionally continues and the
  // app opens without the new UI. v0.15.106 adds two independent late-runtime
  // activation routes so the visible UI patch is not owned by one script.
  if(file==='brand-header-v01538.js'||file==='input-interaction-stability-v01539.js')src=appendUiV015106(src);
  return src;
}

module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  random_top5_click_restore_changed:true,
  random_top5_detail_restore_changed:true,
  data_patch_fullwidth_changed:true,
  redundant_ui_activation_changed:true,
  activation_targets:['brand-header-v01538.js','input-interaction-stability-v01539.js'],
  policy_version:'0.15.106'
};
