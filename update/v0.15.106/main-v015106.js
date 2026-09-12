'use strict';
const fs=require('fs');
const path=require('path');
const SAFETY_BASELINE_LINEAGE_V015106=Object.freeze({via:'main-v015105.js',root:'main-v01579.js',reason:'redundant-runtime-activation-plus-functional-readiness-guard'});
void SAFETY_BASELINE_LINEAGE_V015106;

// Extend the v0.15.79 rollback baseline without rewriting the historical file.
// main-v01579 later requires the same cached module object, so replacing only
// installBootGuard here makes current-boot functional failures rollback-capable.
let safetyBase,safety106;
try{safetyBase=require('./update-safety-v01579')}catch{safetyBase=require('../v0.15.79/update-safety-v01579')}
try{safety106=require('./update-safety-v015106')}catch{safety106=require('../v0.15.106/update-safety-v015106')}
safetyBase.installBootGuard=safety106.installBootGuard;

// The historical runtime loader intentionally catches per-script renderer errors
// and continues. That is good for availability but can make a broken UI update
// look healthy. Add a release-specific post-stack readiness contract.
let loader;
try{loader=require('./runtime-loader-v01579')}catch{loader=require('../v0.15.79/runtime-loader-v01579')}
if(!loader.__aramActivationGuardV015106){
  const priorInject=loader.injectRuntimeStack;
  loader.injectRuntimeStack=async function injectRuntimeStackV015106(opts={}){
    const results=await priorInject(opts);
    const wc=opts.mainWindow?.webContents;
    let state={marker:false,style:false,attr:'',random:false,combo:false};
    try{
      await new Promise(r=>setTimeout(r,220));
      if(wc)state=await wc.executeJavaScript(`(()=>({marker:window.__ARAM_RANDOM_DATA_HOTFIX_V015106__===true,style:!!document.getElementById('randomDataHotfixStyleV015106'),attr:document.documentElement?.getAttribute('data-aram-ui-patch')||'',random:!!document.getElementById('random'),combo:!!document.getElementById('comboResults')}))()`,false);
    }catch(e){state.error=e?.message||String(e)}
    const healthy=!!(state?.marker&&state?.style&&state?.attr==='0.15.106'&&state?.random&&state?.combo);
    if(!healthy){
      try{safety106.markSafetyFailure({code:'SAFE-UI106',detail:{version:'0.15.106',state,failed:(results||[]).filter(x=>!x.ok).map(x=>x.file)}})}catch{}
      try{opts.blackbox?.record?.('SAFE-UI106','required-ui-readiness-failed',{state,failed:(results||[]).filter(x=>!x.ok).map(x=>x.file)})}catch{}
      throw new Error('v0.15.106 required UI readiness failed: '+JSON.stringify(state));
    }
    try{opts.blackbox?.record?.('SAFE-UI106-OK','required-ui-readiness-ok',{state})}catch{}
    return results;
  };
  Object.defineProperty(loader,'__aramActivationGuardV015106',{value:true,configurable:false});
}

const basePath=path.join(__dirname,'main-v015105.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.105';
const hits=src.split(marker).length-1;
if(hits<3)throw new Error('v0.15.106 successor contract mismatch: v0.15.105 markers='+hits);
const stabilityAnchor='runtime-source-stability-v015105';
if(src.split(stabilityAnchor).length-1<1)throw new Error('v0.15.106 source-stability anchor mismatch');
src=src.replaceAll('0.15.105','0.15.106').replaceAll(stabilityAnchor,'runtime-source-stability-v015106');
module._compile(src,__filename);
