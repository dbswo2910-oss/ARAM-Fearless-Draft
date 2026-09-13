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
  'runtime-random-ingame-v01570.js',
  'input-interaction-stability-v01539.js'
]);
const READINESS_EXPR=`(()=>{const required={
  safety:Boolean(window.__ARAM_SAFETY_NET_V01579__),
  performance:Boolean(window.__ARAM_RUNTIME_PERFORMANCE_V01568__),
  liveAutoSync:Boolean(window.__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__),
  randomPick:Boolean(window.__ARAM_RANDOM_PRACTICE_FOCUS_V01549__),
  randomIngame:Boolean(window.__ARAM_RANDOM_INGAME_RUNTIME_V01570__),
  interaction:Boolean(window.__ARAM_INPUT_INTERACTION_STABILITY_V01539__),
  uiOwner:Boolean(window.__ARAM_UI_STABILITY_BASELINE_V015115__)
};const missing=Object.entries(required).filter(([,v])=>!v).map(([k])=>k);return{ok:missing.length===0,missing,required};})()`;
function diagnosticDir(){try{const {app}=require('electron');return path.join(app.getPath('userData'),'diagnostics')}catch{return path.join(process.cwd(),'diagnostics')}}
function writeDiagnostic(payload){try{const dir=diagnosticDir();fs.mkdirSync(dir,{recursive:true});const dst=path.join(dir,'runtime-readiness-v015116.json'),tmp=dst+'.tmp-'+process.pid;fs.writeFileSync(tmp,JSON.stringify(payload,null,2),'utf8');try{fs.renameSync(tmp,dst)}catch{try{fs.rmSync(dst,{force:true})}catch{}fs.renameSync(tmp,dst)}}catch{}}
function markFailure(detail,blackbox){try{require('./update-safety-v01579').markSafetyFailure({code:'SAFE-RT116',detail})}catch(e){blackbox?.record?.('RTI-E116','runtime-readiness-mark-failed',{message:e?.message||String(e)})}}
async function injectRuntimeStack(opts={}){
  const result=await prior.injectRuntimeStack(opts);const wc=opts.mainWindow?.webContents,blackbox=opts.blackbox;
  if(wc)try{await wc.executeJavaScript('window.aramSafetyNetV01579?.finalize?.(); true',false);blackbox?.record?.('SAFE-FIN','safety-finalize-end',{wrapped:true,policy:'0.15.116'})}catch(e){blackbox?.record?.('SAFE-FIN','safety-finalize-error',{message:e?.message||String(e)})}
  const failedCritical=(Array.isArray(result)?result:[]).filter(x=>!x.ok&&CRITICAL_SCRIPT_FILES.has(x.file)).map(x=>x.file);
  let readiness={ok:false,missing:['renderer-unavailable'],required:{}};
  if(wc)try{readiness=await wc.executeJavaScript(READINESS_EXPR,false)}catch(e){readiness={ok:false,missing:['readiness-eval-error'],required:{},error:e?.message||String(e)}}
  const ok=!!readiness?.ok&&failedCritical.length===0;
  const payload={at:new Date().toISOString(),version:'0.15.116',ok,missing:Array.isArray(readiness?.missing)?readiness.missing:[],failedCritical,required:readiness?.required||{},error:readiness?.error||''};
  writeDiagnostic(payload);
  if(!ok){markFailure(payload,blackbox);blackbox?.record?.('RTI-R116','critical-runtime-readiness-failed',payload)}
  else blackbox?.record?.('RTI-OK116','critical-runtime-readiness-ok',{version:'0.15.116'});
  return result;
}
module.exports={injectRuntimeStack,_test:{CRITICAL_SCRIPT_FILES,READINESS_EXPR},score_logic_changed:false,critical_runtime_readiness_gate:true,policy_version:'0.15.116'};
