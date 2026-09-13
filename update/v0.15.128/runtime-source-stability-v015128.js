'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('../v0.15.127/runtime-source-stability-v015127')}catch{prior=require('./runtime-source-stability-v015127')}
const HISTORY_SENTINEL='/* ARAM_HISTORY_LATENCY_V015128 */';
let cached='';
const count=(s,n)=>String(s).split(n).length-1;
function payloadSource(){
  if(cached)return cached;
  const local=path.join(__dirname,'history-latency-v015128.js');
  const repo=path.join(__dirname,'..','v0.15.128','history-latency-v015128.js');
  const p=fs.existsSync(local)?local:repo;
  cached=fs.readFileSync(p,'utf8');
  if(!cached.includes('__ARAM_HISTORY_LATENCY_V015128__'))throw new Error('v0.15.128 history latency payload contract mismatch');
  if(cached.includes('MutationObserver')||cached.includes('setInterval('))throw new Error('v0.15.128 history latency payload may not add persistent poll/repair loops');
  return cached;
}
function patchHistoryLoader(src){
  src=String(src||'');if(src.includes(HISTORY_SENTINEL))return src;
  if(!src.includes('__ARAM_MATCH_LAB_QUEUE_V01517__'))throw new Error('v0.15.128 Match Lab queue owner marker missing');
  return src+'\n'+HISTORY_SENTINEL+'\n'+payloadSource()+'\n';
}
function patchResultSync(src){
  src=String(src||'');
  if(src.includes('aramHistoryLatencyV015128?.probeLatest'))return src;
  const loader="    try{if(typeof loadAramHistory==='function')return Promise.resolve(loadAramHistory(true))}catch(e){return Promise.reject(e)}";
  const loaderNew="    try{if(globalThis.aramHistoryLatencyV015128?.probeLatest)return Promise.resolve(globalThis.aramHistoryLatencyV015128.probeLatest())}catch(e){return Promise.reject(e)}\n"+loader;
  if(count(src,loader)!==1)throw new Error(`v0.15.128 result loader contract mismatch=${count(src,loader)}`);
  src=src.replace(loader,loaderNew);
  const waits="const waits=[0,1200,2200,3500,5000,8000,12000,15000,15000,15000,15000];";
  const waitsNew="const waits=[0,700,1100,1700,2600,4000,6500,10000,15000,15000,15000];";
  if(count(src,waits)!==1)throw new Error(`v0.15.128 result retry schedule contract mismatch=${count(src,waits)}`);
  return src.replace(waits,waitsNew);
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='match-lab-queue-v01517.js')src=patchHistoryLoader(src);
  if(file==='random-ingame-coach-v01550.js')src=patchResultSync(src);
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  history_latency_changed:true,
  history_progressive_load:true,
  history_cache_first:true,
  history_quick_scan_max:50,
  history_background_deep_scan:true,
  result_latest_probe:true,
  result_latest_probe_scan:12,
  result_retry_schedule_ms:[0,700,1100,1700,2600,4000,6500,10000,15000,15000,15000],
  activation_targets:[...new Set([...(prior.activation_targets||[]),'match-lab-queue-v01517.js','random-ingame-coach-v01550.js'])],
  policy_version:'0.15.128'
};
