'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01577')}catch{prior=require('../v0.15.77/runtime-source-stability-v01577')}
const APPLY_OLD="function applyUserState(){\n    try{\n      const loaded=loadAppState();state=loaded.state;randomState=loaded.randomState;\n      clearHistoryRuntime();\n      if(typeof renderAll==='function')renderAll();\n      window.aramHistoryFavoritesV01514?.render?.();\n    }catch(e){console.error('[v0.15.16] user state restore failed',e)}\n  }";
const APPLY_NEW="function applyUserState(){\n    let loaded=null;\n    try{loaded=loadAppState();state=loaded.state;randomState=loaded.randomState;clearHistoryRuntime()}catch(e){try{window.aramDesktop?.traceDiagnostic?.({code:'USR-E001',kind:'user-state-load-error',detail:{message:e?.message||String(e),stack:String(e?.stack||'').slice(0,1800)}})}catch{};console.error('[v0.15.78] user state load failed',e);return false}\n    const jobs=[\n      ['USR-R01',()=>{if(typeof renderBuilder==='function')renderBuilder()}],\n      ['USR-R02',()=>{if(typeof renderLive==='function')renderLive()}],\n      ['USR-R03',()=>{if(typeof renderSeries==='function')renderSeries()}],\n      ['USR-R04',()=>{if(typeof renderRandomInputs==='function')renderRandomInputs()}],\n      ['USR-R05',()=>{if(typeof renderOnline==='function')renderOnline()}],\n      ['USR-R06',()=>window.aramHistoryFavoritesV01514?.render?.()],\n      ['USR-R07',()=>{if(document.getElementById('history')?.classList.contains('active')&&typeof renderAramHistoryFeedback==='function')renderAramHistoryFeedback()}],\n      ['USR-R08',()=>{if(document.getElementById('data')?.classList.contains('active')&&typeof renderDataExplorer==='function')renderDataExplorer()}],\n      ['USR-R09',()=>{try{persist?.()}catch{}}]\n    ];\n    let i=0;const step=()=>{if(i>=jobs.length){try{window.aramRandomPracticeRuntimeV01572?.refresh?.()}catch{};return}const [code,fn]=jobs[i++];const t0=performance?.now?.()||Date.now();try{fn()}catch(e){try{window.aramDesktop?.traceDiagnostic?.({code:'USR-E002',kind:'user-state-render-error',detail:{stage:code,message:e?.message||String(e),stack:String(e?.stack||'').slice(0,1800)}})}catch{};console.error('[v0.15.78] staged user render failed',code,e)}finally{const ms=(performance?.now?.()||Date.now())-t0;if(ms>=120)try{window.aramDesktop?.traceDiagnostic?.({code:'USR-SLOW',kind:'user-state-stage-slow',detail:{stage:code,ms:Number(ms.toFixed(1))}})}catch{}};setTimeout(step,0)};\n    setTimeout(step,0);return true\n  }";
const TRACK_OLD="aramTrackLinkedGame=function(s){\n      const p=puuidOf(s?.account);if(p&&!activeOwner)activateOwner(p,s.account);if(!activeOwner||!p||p!==activeOwner)return;\n      return oldTrack(s)\n    };";
const TRACK_NEW="aramTrackLinkedGame=function(s){\n      const p=puuidOf(s?.account);if(p&&!activeOwner){try{window.aramDesktop?.traceDiagnostic?.({code:'USR-110',kind:'owner-activation-deferred',detail:{phase:String(s?.phase||''),gameId:String(s?.gameId||'')}})}catch{};setTimeout(()=>{try{activateOwner(p,s.account)}catch(e){try{window.aramDesktop?.traceDiagnostic?.({code:'USR-E003',kind:'owner-activation-error',detail:{message:e?.message||String(e),stack:String(e?.stack||'').slice(0,1800)}})}catch{}}},0);return}if(!activeOwner||!p||p!==activeOwner)return;\n      return oldTrack(s)\n    };";
function replaceExact(src,oldText,newText,label){
  const n=src.split(oldText).length-1;
  if(n===0&&src.includes(newText))return src;
  if(n!==1)throw new Error('v0.15.78 source contract mismatch '+label+' count='+n);
  return src.replace(oldText,newText);
}
function patchRuntimeSource(file,code){
  let src=prior.patchRuntimeSource(file,code);
  if(file==='multi-user-isolation-v01516.js'){
    src=replaceExact(src,APPLY_OLD,APPLY_NEW,'multi-user applyUserState');
    src=replaceExact(src,TRACK_OLD,TRACK_NEW,'multi-user linked-game owner activation');
    src=src.replace('const timer=setInterval(syncOwner,320);setTimeout(syncOwner,0);','const timer=setInterval(syncOwner,1500);setTimeout(syncOwner,0);');
  }
  return src;
}
module.exports={patchRuntimeSource,score_logic_changed:false};
