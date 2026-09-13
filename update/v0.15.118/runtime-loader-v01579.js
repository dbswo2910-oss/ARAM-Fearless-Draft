'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('../v0.15.77/runtime-loader-v01577')}catch{prior=require('./runtime-loader-v01577')}
const CRITICAL_SCRIPT_FILES=new Set([
  'runtime-safety-net-v01579.js',
  'runtime-performance-v01568.js',
  'runtime-live-autosync-v01571.js',
  'random-practice-focus-v01549.js',
  'runtime-random-practice-v01572.js',
  'runtime-random-ingame-v01570.js',
  'input-interaction-stability-v01539.js'
]);
const READINESS_EXPR=`(()=>{const required={
  safety:Boolean(window.__ARAM_SAFETY_NET_V01579__),
  performance:Boolean(window.__ARAM_RUNTIME_PERFORMANCE_V01568__),
  liveAutoSync:Boolean(window.__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__),
  randomPick:Boolean(window.__ARAM_RANDOM_PRACTICE_FOCUS_V01549__),
  randomPracticeRuntime:Boolean(window.__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__),
  randomIngame:Boolean(window.__ARAM_RANDOM_INGAME_RUNTIME_V01570__),
  interaction:Boolean(window.__ARAM_INPUT_INTERACTION_STABILITY_V01539__),
  uiOwner:Boolean(window.__ARAM_UI_STABILITY_BASELINE_V015115__),
  stateIntegrity:Boolean(window.__ARAM_STATE_INTEGRITY_V015117__),
  stateBridge:Boolean(window.aramDesktop?.readStateMirror&&window.aramDesktop?.writeStateMirror&&window.aramDesktop?.traceStateIntegrity),
  resourceLifecycle:Boolean(window.__ARAM_RESOURCE_LIFECYCLE_V015118__),
  lifecycleDisposers:Boolean(typeof window.aramRandomPracticeRuntimeV01572?.dispose==='function'&&typeof window.aramRandomIngameRuntimeV01570?.dispose==='function'&&typeof window.aramLiveAutosyncRuntimeV01571?.dispose==='function')
};const missing=Object.entries(required).filter(([,v])=>!v).map(([k])=>k);let lifecycle=null;try{lifecycle=window.aramResourceLifecycleV015118?.snapshot?.()||null}catch(e){lifecycle={error:e?.message||String(e)}}return{ok:missing.length===0,missing,required,lifecycle};})()`;
function diagnosticDir(){try{const {app}=require('electron');return path.join(app.getPath('userData'),'diagnostics')}catch{return path.join(process.cwd(),'diagnostics')}}
function writeDiagnostic(payload){try{const dir=diagnosticDir();fs.mkdirSync(dir,{recursive:true});const dst=path.join(dir,'runtime-readiness-v015118.json'),tmp=dst+'.tmp-'+process.pid;fs.writeFileSync(tmp,JSON.stringify(payload,null,2),'utf8');try{fs.renameSync(tmp,dst)}catch{try{fs.rmSync(dst,{force:true})}catch{}fs.renameSync(tmp,dst)}}catch{}}
function markFailure(detail,blackbox){try{require('./update-safety-v01579').markSafetyFailure({code:'SAFE-RT118',detail})}catch(e){blackbox?.record?.('RTI-E118','resource-lifecycle-readiness-mark-failed',{message:e?.message||String(e)})}}
async function injectRuntimeStack(opts={}){
  const result=await prior.injectRuntimeStack(opts);const wc=opts.mainWindow?.webContents,blackbox=opts.blackbox;
  if(wc)try{await wc.executeJavaScript('window.aramSafetyNetV01579?.finalize?.(); true',false);blackbox?.record?.('SAFE-FIN','safety-finalize-end',{wrapped:true,policy:'0.15.118'})}catch(e){blackbox?.record?.('SAFE-FIN','safety-finalize-error',{message:e?.message||String(e)})}
  const failedCritical=(Array.isArray(result)?result:[]).filter(x=>!x.ok&&CRITICAL_SCRIPT_FILES.has(x.file)).map(x=>x.file);
  let readiness={ok:false,missing:['renderer-unavailable'],required:{},lifecycle:null};
  if(wc)try{readiness=await wc.executeJavaScript(READINESS_EXPR,false)}catch(e){readiness={ok:false,missing:['readiness-eval-error'],required:{},lifecycle:null,error:e?.message||String(e)}}
  const ok=!!readiness?.ok&&failedCritical.length===0;
  const payload={at:new Date().toISOString(),version:'0.15.118',ok,missing:Array.isArray(readiness?.missing)?readiness.missing:[],failedCritical,required:readiness?.required||{},lifecycle:readiness?.lifecycle||null,error:readiness?.error||''};
  writeDiagnostic(payload);
  if(!ok){markFailure(payload,blackbox);blackbox?.record?.('RTI-R118','resource-lifecycle-readiness-failed',payload)}
  else blackbox?.record?.('RTI-OK118','resource-lifecycle-readiness-ok',{version:'0.15.118',lifecycle:payload.lifecycle});
  return result;
}
module.exports={injectRuntimeStack,_test:{CRITICAL_SCRIPT_FILES,READINESS_EXPR},score_logic_changed:false,random_scoring_changed:false,critical_runtime_readiness_gate:true,state_integrity_readiness_gate:true,resource_lifecycle_readiness_gate:true,policy_version:'0.15.118'};
