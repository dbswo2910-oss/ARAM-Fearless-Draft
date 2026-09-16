'use strict';
const fs=require('fs');
const path=require('path');
const {app,BrowserWindow}=require('electron');
const {patchSuccessorSource}=require('./successor-route-v0160');
const {buildRendererSource}=require('./canonical-owner-bundler-v0160');
const VERSION='0.16.0';
const STABLE_APP_ID='aram-fearless-draft';

function pinStableUserData(){
  const stable=path.join(app.getPath('appData'),STABLE_APP_ID);
  const before=app.getPath('userData');
  if(path.resolve(before)!==path.resolve(stable))app.setPath('userData',stable);
  console.log('[v0.16.0 storage-root]',{before,stable,active:app.getPath('userData')});
  return stable;
}

function loadCanonicalRegistry(){
  const registryPath=path.join(__dirname,'canonical','src','core','owner-registry.js');
  if(!fs.existsSync(registryPath))throw new Error('v0.16 canonical owner registry missing from installed candidate');
  const registry=require(registryPath);
  registry.assertSingleOwner?.();
  const rows=Object.values(registry.owners||{});
  if(registry.production_active!==true||rows.length!==15||!rows.every(x=>x?.status==='production'))throw new Error(`v0.16 canonical owner registry inactive: ${rows.filter(x=>x?.status==='production').length}/${rows.length}`);
  return registry;
}

function installCanonicalRendererBridge(registry){
  const built=buildRendererSource({appDir:__dirname});
  app.on('browser-window-created',(_event,win)=>{
    const inject=()=>{
      try{
        if(!win||win.isDestroyed?.()||win.webContents?.isDestroyed?.())return;
        Promise.resolve(win.webContents.executeJavaScript(built.source,false)).then(result=>{
          if(!result?.production_active||Number(result?.owners_active)!==15)console.warn('[v0.16.0 canonical renderer bridge] owner layer did not report full activation');
        }).catch(e=>console.warn('[v0.16.0 canonical renderer bridge] inject failed:',e?.message||String(e)));
      }catch(e){console.warn('[v0.16.0 canonical renderer bridge] inject failed:',e?.message||String(e))}
    };
    try{win.webContents.on('did-finish-load',inject)}catch(e){console.warn('[v0.16.0 canonical renderer bridge] hook failed:',e?.message||String(e))}
  });
  return{production_active:true,owners_active:Object.keys(registry.owners||{}).length,modules:built.modules};
}

function installProbationReadinessReconciler(){
  let safety=null,loader=null;
  try{safety=require('./update-safety-v01579')}catch{}
  try{loader=require('./runtime-loader-v01579')}catch{}
  const original=safety?.markSafetyFailure;
  const readinessExpr=loader?._test?.READINESS_EXPR;
  if(typeof original!=='function'||!readinessExpr){
    console.warn('[v0.16.0 probation] SAFE-RT121 reconciler unavailable');
    return{installed:false,reason:'dependency-unavailable'};
  }

  let pending=null,timer=null,attempts=0,closed=false;
  const MAX_ATTEMPTS=5;
  const RETRY_MS=1000;

  const schedule=()=>{
    if(closed||!pending||timer)return;
    timer=setTimeout(()=>{timer=null;void recheck()},RETRY_MS);
    timer.unref?.();
  };

  const recheck=async()=>{
    if(closed||!pending)return;
    attempts++;
    let readiness={ok:false,missing:['renderer-unavailable'],error:''};
    try{
      const wins=BrowserWindow.getAllWindows().filter(w=>w&&!w.isDestroyed?.()&&!w.webContents?.isDestroyed?.());
      const win=wins.find(w=>!w.webContents?.isLoading?.())||wins[0];
      if(win)readiness=await win.webContents.executeJavaScript(readinessExpr,false);
    }catch(e){readiness={ok:false,missing:['readiness-recheck-error'],error:e?.message||String(e)}}

    if(readiness?.ok){
      console.log('[v0.16.0 probation] transient SAFE-RT121 resolved',{attempts});
      pending=null;
      return;
    }

    if(attempts<MAX_ATTEMPTS){schedule();return}
    const held=pending;pending=null;
    console.warn('[v0.16.0 probation] SAFE-RT121 persisted after retries',{attempts,missing:readiness?.missing||[]});
    original.call(safety,{
      code:'SAFE-RT121',
      detail:{
        ...(held?.detail||{}),
        v0160_recheck:{attempts,missing:Array.isArray(readiness?.missing)?readiness.missing:[],error:readiness?.error||''}
      }
    });
  };

  safety.markSafetyFailure=function(opts={}){
    if(String(opts?.code||'')!=='SAFE-RT121')return original.call(safety,opts);
    pending={code:'SAFE-RT121',detail:opts?.detail||{},deferredAt:Date.now()};
    attempts=0;
    console.warn('[v0.16.0 probation] deferring SAFE-RT121 for renderer readiness reconciliation');
    schedule();
    return{deferred:true,code:'SAFE-RT121'};
  };

  app.on('before-quit',()=>{
    closed=true;
    if(timer){clearTimeout(timer);timer=null}
  });
  return{installed:true,max_attempts:MAX_ATTEMPTS,retry_ms:RETRY_MS};
}

pinStableUserData();
const canonicalRegistry=loadCanonicalRegistry();
installCanonicalRendererBridge(canonicalRegistry);
const probationReadiness=installProbationReadinessReconciler();
console.log('[v0.16.0 probation readiness]',probationReadiness);
const SAFETY_BASELINE_LINEAGE_V0160=Object.freeze({via:'main-v015122.js',runtimeStability:'runtime-source-stability-v015135',goldenRollback:'0.15.135',reason:'v016-production-owner-adapter-layer'});
void SAFETY_BASELINE_LINEAGE_V0160;
if(process.env.ARAM_R19_DISABLE_COLD_START_PROMOTION!=='1'){
  try{require('./cold-start-promotion-v0160').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.16.0 cold-start promotion] install failed:',e?.message||String(e))}catch{}}
}
const basePath=path.join(__dirname,'main-v015122.js');
const src=patchSuccessorSource(fs.readFileSync(basePath,'utf8'));
module._compile(src,__filename);
