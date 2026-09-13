'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('./runtime-source-stability-v015107')}catch{prior=require('../v0.15.107/runtime-source-stability-v015107')}

let cachedUi='';
function uiSourceV015108(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'data-random-hardfix-v015108.js');
  const repo=path.join(__dirname,'..','v0.15.108','data-random-hardfix-v015108.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_DATA_RANDOM_HARDFIX_V015108__'))throw new Error('v0.15.108 UI source contract mismatch');
  return cachedUi;
}
function appendUiV015108(src){
  if(src.includes('__ARAM_DATA_RANDOM_HARDFIX_V015108__'))return src;
  return src+'\n;\n'+uiSourceV015108()+'\n';
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='brand-header-v01538.js'||file==='input-interaction-stability-v01539.js')src=appendUiV015108(src);
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  data_patchmode_detection_hardfix_changed:true,
  data_tier_branch_hard_hide_changed:true,
  random_foreign_data_branch_quarantine_changed:true,
  activation_targets:['brand-header-v01538.js','input-interaction-stability-v01539.js'],
  policy_version:'0.15.108'
};
