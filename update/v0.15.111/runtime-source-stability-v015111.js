'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('./runtime-source-stability-v015110')}catch{prior=require('../v0.15.110/runtime-source-stability-v015110')}

let cachedUi='';
function uiSourceV015111(){
  if(cachedUi)return cachedUi;
  const local=path.join(__dirname,'random-dna-rail-v015111.js');
  const repo=path.join(__dirname,'..','v0.15.111','random-dna-rail-v015111.js');
  const p=fs.existsSync(local)?local:repo;
  cachedUi=fs.readFileSync(p,'utf8');
  if(!cachedUi.includes('__ARAM_RANDOM_DNA_RAIL_V015111__'))throw new Error('v0.15.111 UI source contract mismatch');
  return cachedUi;
}
function appendUiV015111(src){
  if(src.includes('__ARAM_RANDOM_DNA_RAIL_V015111__'))return src;
  return src+'\n;\n'+uiSourceV015111()+'\n';
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='brand-header-v01538.js'||file==='input-interaction-stability-v01539.js')src=appendUiV015111(src);
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  random_dna_rail_changed:true,
  random_detail_readability_changed:true,
  random_scoring_changed:false,
  data_views_changed:false,
  activation_targets:['brand-header-v01538.js','input-interaction-stability-v01539.js'],
  policy_version:'0.15.111'
};
