'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('../v0.15.125/runtime-source-stability-v015125')}catch{prior=require('./runtime-source-stability-v015125')}

const LABEL_SENTINEL='/* ARAM_MATCH_SEARCH_LABELS_V015126 */';
const STATE_SENTINEL='/* ARAM_STATE_INTEGRITY_PAYLOAD_V015117 */';
let cached='';
function labelSource(){
  if(cached)return cached;
  const local=path.join(__dirname,'match-search-labels-v015126.js');
  const repo=path.join(__dirname,'..','v0.15.126','match-search-labels-v015126.js');
  const p=fs.existsSync(local)?local:repo;
  cached=fs.readFileSync(p,'utf8');
  if(!cached.includes('__ARAM_MATCH_SEARCH_LABELS_V015126__'))throw new Error('v0.15.126 label payload contract mismatch');
  if(!cached.includes("document.getElementById('history')"))throw new Error('v0.15.126 history scope contract missing');
  if(cached.includes('MutationObserver')||cached.includes('setInterval('))throw new Error('v0.15.126 label payload may not add persistent repair loops');
  return cached;
}
function injectLabels(src){
  src=String(src||'');
  if(src.includes(LABEL_SENTINEL))return src;
  const stateAt=src.indexOf(STATE_SENTINEL);
  if(stateAt<0)throw new Error('v0.15.126 state-integrity suffix missing');
  return src.slice(0,stateAt)+LABEL_SENTINEL+'\n'+labelSource()+'\n;\n'+src.slice(stateAt);
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='input-interaction-stability-v01539.js')src=injectLabels(src);
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  match_search_visible_label:'전적검색',
  internal_match_lab_identifiers_preserved:true,
  activation_targets:[...new Set([...(prior.activation_targets||[]),'input-interaction-stability-v01539.js'])],
  policy_version:'0.15.126'
};
