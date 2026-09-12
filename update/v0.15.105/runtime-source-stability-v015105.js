'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('./runtime-source-stability-v015104')}catch{prior=require('../v0.15.104/runtime-source-stability-v015104')}

let cachedUi='';
function uiHotfixSourceV015105(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'random-data-ui-hotfix-v015105.js');
  const repo=path.join(__dirname,'..','v0.15.105','random-data-ui-hotfix-v015105.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_RANDOM_DATA_HOTFIX_V015105__'))throw new Error('v0.15.105 UI hotfix source contract mismatch');
  return cachedUi;
}
function addSyncHookV015105(src){
  if(src.includes('window.__ARAM_V015105_SYNC__?.();'))return src;
  const start=src.indexOf('function refreshPickReferenceV01590(r){');
  if(start<0)return src;
  const end=src.indexOf('\n  function stageHead(',start);
  if(end<0)return src;
  const block=src.slice(start,end);
  const close=block.lastIndexOf('\n  }');
  if(close<0)return src;
  const patched=block.slice(0,close)+"\n    window.__ARAM_V015105_SYNC__?.();"+block.slice(close);
  return src.slice(0,start)+patched+src.slice(end);
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-practice-focus-v01549.js'){
    src=addSyncHookV015105(src);
    if(!src.includes('__ARAM_RANDOM_DATA_HOTFIX_V015105__'))src+='\n;\n'+uiHotfixSourceV015105()+'\n';
  }
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  random_top5_click_restore_changed:true,
  random_top5_detail_restore_changed:true,
  data_patch_fullwidth_changed:true,
  policy_version:'0.15.105'
};
