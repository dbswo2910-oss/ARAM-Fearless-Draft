'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('./runtime-source-stability-v015108')}catch{prior=require('../v0.15.108/runtime-source-stability-v015108')}

let cachedUi='';
function uiSourceV015109(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'ui-screenshot-polish-v015109.js');
  const repo=path.join(__dirname,'..','v0.15.109','ui-screenshot-polish-v015109.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_SCREENSHOT_POLISH_V015109__'))throw new Error('v0.15.109 UI source contract mismatch');
  return cachedUi;
}
function appendUiV015109(src){
  if(src.includes('__ARAM_SCREENSHOT_POLISH_V015109__'))return src;
  return src+'\n;\n'+uiSourceV015109()+'\n';
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='brand-header-v01538.js'||file==='input-interaction-stability-v01539.js')src=appendUiV015109(src);
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  screenshot_polish_changed:true,
  data_patch_title_polish_changed:true,
  patch_companion_label_polish_changed:true,
  random_dna_visual_restore_changed:true,
  random_intel_readability_changed:true,
  activation_targets:['brand-header-v01538.js','input-interaction-stability-v01539.js'],
  policy_version:'0.15.109'
};
