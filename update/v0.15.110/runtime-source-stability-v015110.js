'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('./runtime-source-stability-v015109')}catch{prior=require('../v0.15.109/runtime-source-stability-v015109')}

let cachedUi='';
function uiSourceV015110(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'patch-notes-density-v015110.js');
  const repo=path.join(__dirname,'..','v0.15.110','patch-notes-density-v015110.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_PATCH_NOTES_DENSITY_V015110__'))throw new Error('v0.15.110 UI source contract mismatch');
  return cachedUi;
}
function appendUiV015110(src){
  if(src.includes('__ARAM_PATCH_NOTES_DENSITY_V015110__'))return src;
  return src+'\n;\n'+uiSourceV015110()+'\n';
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='brand-header-v01538.js'||file==='input-interaction-stability-v01539.js')src=appendUiV015110(src);
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  patch_notes_density_changed:true,
  patch_notes_portrait_scope_changed:true,
  data_tier_cards_changed:false,
  activation_targets:['brand-header-v01538.js','input-interaction-stability-v01539.js'],
  policy_version:'0.15.110'
};
