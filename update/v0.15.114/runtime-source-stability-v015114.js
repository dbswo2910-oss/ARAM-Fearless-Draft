'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('./runtime-source-stability-v015113')}catch{prior=require('../v0.15.113/runtime-source-stability-v015113')}

let cachedUi='';
function uiSourceV015114(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'random-pick-integrity-v015114.js');
  const repo=path.join(__dirname,'..','v0.15.114','random-pick-integrity-v015114.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_RANDOM_PICK_INTEGRITY_V015114__'))throw new Error('v0.15.114 UI source contract mismatch');
  return cachedUi;
}
function appendIntegrityV015114(src){
  if(src.includes('__ARAM_RANDOM_PICK_INTEGRITY_V015114__'))return src;
  return src+'\n;\n'+uiSourceV015114()+'\n';
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  /* Unlike v0.15.112/113, this is injected directly into the Random Practice
     lifecycle owner. That makes it deterministic after every Random refresh
     instead of depending on unrelated shell scripts being evaluated at the
     right time. */
  if(file==='random-practice-focus-v01549.js')src=appendIntegrityV015114(src);
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  random_pick_integrity_changed:true,
  random_grade_bounds_changed:true,
  random_candidate_name_source_changed:true,
  random_candidate_dna_source_changed:true,
  random_pick_workspace_changed:true,
  data_views_changed:false,
  activation_targets:[...new Set([...(prior.activation_targets||[]),'random-practice-focus-v01549.js'])],
  policy_version:'0.15.114'
};
