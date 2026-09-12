'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('./runtime-source-stability-v015100')}catch{prior=require('../v0.15.100/runtime-source-stability-v015100')}
let cachedUi='';
function uiLayoutSourceV015104(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'ui-layout-restore-v015103.js');
  const repo=path.join(__dirname,'..','v0.15.103','ui-layout-restore-v015103.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_UI_LAYOUT_RESTORE_V015103__'))throw new Error('v0.15.104 UI restore source contract mismatch');
  return cachedUi;
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  // random-practice-focus is already rewritten by the v0.15.90-v0.15.100
  // stability lineage. Append the v0.15.103 visual/layout layer to that exact
  // renderer payload instead of editing the main-process script array.
  if(file==='random-practice-focus-v01549.js'&&!src.includes('__ARAM_UI_LAYOUT_RESTORE_V015103__')){
    src+='\n;\n'+uiLayoutSourceV015104()+'\n';
  }
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  startup_hotfix_changed:true,
  ui_layout_restore_preserved:true,
  policy_version:'0.15.104'
};
