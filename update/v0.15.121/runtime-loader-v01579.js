'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('../v0.15.120/runtime-loader-v01579')}catch{prior=require('./runtime-loader-v015120')}

const READINESS_EXPR=`(()=>{const required={
  randomPracticeRuntime:Boolean(window.__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__),
  randomPracticeRestore:Boolean(window.__ARAM_RANDOM_PRACTICE_RESTORE_V015121__),
  randomPick:Boolean(window.__ARAM_RANDOM_PRACTICE_FOCUS_V01549__),
  randomOwner:Boolean(window.__ARAM_UI_STABILITY_BASELINE_V015115__),
  resourceLifecycle:Boolean(window.__ARAM_RESOURCE_LIFECYCLE_V015118__),
  disposableEvents:Boolean(typeof window.aramRandomPracticeRuntimeV01572?.dispose==='function'),
  restoreApi:Boolean(typeof window.aramRandomPracticeRuntimeV01572?.restore==='function')
};const missing=Object.entries(required).filter(([,v])=>!v).map(([k])=>k);let random=null,lifecycle=null;try{random=window.aramRandomPracticeRuntimeV01572?.getStats?.()||null}catch(e){random={error:e?.message||String(e)}}try{lifecycle=window.aramResourceLifecycleV015118?.snapshot?.()||null}catch(e){lifecycle={error:e?.message||String(e)}}return{ok:missing.length===0,missing,required,random,lifecycle};})()`;
const READINESS_MAX_ATTEMPTS=5;
const READINESS_RETRY_MS=750;
function diagnosticDir(){try{const {app}=require('electron');return path.join(app.getPath('userData'),'diagnostics')}catch{return path.join(process.cwd(),'diagnostics')}}
function writeDiagnostic(payload){try{const dir=diagnosticDir();fs.mkdirSync(dir,{recursive:true});const dst=path.join(dir,'runtime-readiness-v015121.json'),tmp=dst+'.tmp-'+process.pid;fs.writeFileSync(tmp,JSON.stringify(payload,null,2),'utf8');try{fs.renameSync(tmp,dst)}catch{try{fs.rmSync(dst,{force:true})}catch{}fs.renameSync(tmp,dst)}}catch{}}
function markFailure(detail,blackbox){try{require('./update-safety-v01579').markSafetyFailure({code:'SAFE-RT121',detail})}catch(e){try{require('../v0.15.116/update-safety-v01579').markSafetyFailure({code:'SAFE-RT121',detail})}catch{}blackbox?.record?.('RTI-E121','random-practice-restore-readiness-mark-failed',{message:e?.message||String(e)})}}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function evaluateReadiness(wc){
  if(!wc)return{ok:false,missing:['renderer-unavailable'],required:{},random:null,lifecycle:null,error:''};
  try{return await wc.executeJavaScript(READINESS_EXPR,false)}catch(e){return{ok:false,missing:['readiness-eval-error'],required:{},random:null,lifecycle:null,error:e?.message||String(e)}}
}
async function reconcileReadiness(wc,blackbox){
  let readiness={ok:false,missing:['renderer-unavailable'],required:{},random:null,lifecycle:null,error:''};
  let attempts=0;
  const snapshots=[];
  for(let i=1;i<=READINESS_MAX_ATTEMPTS;i++){
    attempts=i;
    readiness=await evaluateReadiness(wc);
    snapshots.push({attempt:i,ok:!!readiness?.ok,missing:Array.isArray(readiness?.missing)?readiness.missing:[],error:readiness?.error||''});
    if(readiness?.ok)break;
    if(i<READINESS_MAX_ATTEMPTS)await sleep(READINESS_RETRY_MS);
  }
  if(attempts>1)blackbox?.record?.('RTI-RETRY121','random-practice-restore-readiness-reconciled',{attempts,ok:!!readiness?.ok,missing:readiness?.missing||[]});
  return{readiness,attempts,snapshots};
}
async function injectRuntimeStack(opts={}){
  const result=await prior.injectRuntimeStack(opts);const wc=opts.mainWindow?.webContents,blackbox=opts.blackbox;
  if(wc)try{await wc.executeJavaScript('window.aramSafetyNetV01579?.finalize?.(); true',false);blackbox?.record?.('SAFE-FIN','safety-finalize-end',{wrapped:true,policy:'0.15.121'})}catch(e){blackbox?.record?.('SAFE-FIN','safety-finalize-error',{message:e?.message||String(e),policy:'0.15.121'})}
  const reconciled=await reconcileReadiness(wc,blackbox),readiness=reconciled.readiness;
  const payload={at:new Date().toISOString(),version:'0.15.121',ok:!!readiness?.ok,attempts:reconciled.attempts,retry_ms:READINESS_RETRY_MS,missing:Array.isArray(readiness?.missing)?readiness.missing:[],required:readiness?.required||{},random:readiness?.random||null,lifecycle:readiness?.lifecycle||null,error:readiness?.error||'',snapshots:reconciled.snapshots};
  writeDiagnostic(payload);
  if(!payload.ok){markFailure(payload,blackbox);blackbox?.record?.('RTI-R121','random-practice-restore-readiness-failed',payload)}
  else blackbox?.record?.('RTI-OK121','random-practice-restore-readiness-ok',{version:'0.15.121',attempts:payload.attempts,random:payload.random});
  return result;
}
module.exports={injectRuntimeStack,_test:{READINESS_EXPR,READINESS_MAX_ATTEMPTS,READINESS_RETRY_MS,evaluateReadiness,reconcileReadiness},score_logic_changed:false,random_scoring_changed:false,critical_runtime_readiness_gate:true,random_practice_restore_readiness_gate:true,transient_readiness_retry:true,policy_version:'0.15.121'};
