'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('../v0.15.126/runtime-source-stability-v015126')}catch{prior=require('./runtime-source-stability-v015126')}
const UPDATE_SENTINEL='/* ARAM_STARTUP_UPDATE_NOTICE_V015127 */';
const STATE_SENTINEL='/* ARAM_STATE_INTEGRITY_PAYLOAD_V015117 */';
let cached='';
function payloadSource(){
  if(cached)return cached;
  const local=path.join(__dirname,'startup-update-notice-v015127.js');
  const repo=path.join(__dirname,'..','v0.15.127','startup-update-notice-v015127.js');
  const p=fs.existsSync(local)?local:repo;
  cached=fs.readFileSync(p,'utf8');
  if(!cached.includes('__ARAM_STARTUP_UPDATE_NOTICE_V015127__'))throw new Error('v0.15.127 startup update payload contract mismatch');
  if(cached.includes('MutationObserver')||cached.includes('setInterval('))throw new Error('v0.15.127 startup update notice may not add persistent repair loops');
  return cached;
}
function inject(src){
  src=String(src||'');
  if(src.includes(UPDATE_SENTINEL))return src;
  const stateAt=src.indexOf(STATE_SENTINEL);
  if(stateAt<0)throw new Error('v0.15.127 state-integrity suffix missing');
  return src.slice(0,stateAt)+UPDATE_SENTINEL+'\n'+payloadSource()+'\n;\n'+src.slice(stateAt);
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='input-interaction-stability-v01539.js')src=inject(src);
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  startup_update_check:true,
  startup_update_policy:'check-once-then-prompt-apply-restart',
  activation_targets:[...new Set([...(prior.activation_targets||[]),'input-interaction-stability-v01539.js'])],
  policy_version:'0.15.127'
};
