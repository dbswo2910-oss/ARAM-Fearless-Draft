'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('./runtime-source-stability-v015106')}catch{prior=require('../v0.15.106/runtime-source-stability-v015106')}

let cachedUi='';
function uiSourceV015107(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'view-boundary-repair-v015107.js');
  const repo=path.join(__dirname,'..','v0.15.107','view-boundary-repair-v015107.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_VIEW_BOUNDARY_REPAIR_V015107__'))throw new Error('v0.15.107 UI source contract mismatch');
  return cachedUi;
}

function appendUiV015107(src){
  if(src.includes('__ARAM_VIEW_BOUNDARY_REPAIR_V015107__'))return src;
  return src+'\n;\n'+uiSourceV015107()+'\n';
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  // Keep the v0.15.106 independent late-runtime activation strategy, then run
  // the exact-view boundary repair last so older heuristic layout layers cannot
  // own DATA or leak DATA surfaces into RANDOM Practice.
  if(file==='brand-header-v01538.js'||file==='input-interaction-stability-v01539.js')src=appendUiV015107(src);
  return src;
}

module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  data_view_boundary_changed:true,
  patch_notes_isolation_changed:true,
  random_pick_layout_repair_changed:true,
  random_foreign_data_quarantine_changed:true,
  activation_targets:['brand-header-v01538.js','input-interaction-stability-v01539.js'],
  policy_version:'0.15.107'
};
