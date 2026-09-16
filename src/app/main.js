'use strict';
const fs=require('fs');
const path=require('path');
const {app,ipcMain}=require('electron');

const APP_ROOT=path.resolve(__dirname,'../..');
const STABLE_APP_ID='aram-fearless-draft';
const VERSION=String(require(path.join(APP_ROOT,'package.json')).version||'').trim();
if(!VERSION)throw new Error('package version missing');

function pinStableUserData(){
  const stable=String(process.env.ARAM_UNIVERSAL_SHADOW_USER_DATA_ROOT||'').trim()||path.join(app.getPath('appData'),STABLE_APP_ID);
  const before=app.getPath('userData');
  if(path.resolve(before)!==path.resolve(stable))app.setPath('userData',stable);
  console.log('[clean storage-root]',{version:VERSION,before,stable,active:app.getPath('userData')});
  return stable;
}

function installShadowDiagnosticsRenderer(){
  const diagnosticsPath=path.join(APP_ROOT,'src','profile','shadow-rating-diagnostics-renderer.js');
  if(!fs.existsSync(diagnosticsPath))throw new Error('shadow diagnostics renderer missing');
  const diagnosticsSource=fs.readFileSync(diagnosticsPath,'utf8')+'\n//# sourceURL=shadow-rating-diagnostics-clean.js';
  app.on('browser-window-created',(_event,win)=>{
    const inject=()=>{
      try{
        if(!win||win.isDestroyed?.()||win.webContents?.isDestroyed?.())return;
        Promise.resolve(win.webContents.executeJavaScript(diagnosticsSource,false)).catch(e=>console.warn('[clean shadow diagnostics] inject failed:',e?.message||String(e)));
      }catch(e){console.warn('[clean shadow diagnostics] inject failed:',e?.message||String(e))}
    };
    try{win.webContents.on('did-finish-load',inject)}catch(e){console.warn('[clean shadow diagnostics] hook failed:',e?.message||String(e))}
  });
}

function loadCanonicalRegistry(){
  const registryPath=path.join(APP_ROOT,'canonical','src','core','owner-registry.js');
  if(!fs.existsSync(registryPath))throw new Error('canonical owner registry missing from installed app');
  const registry=require(registryPath);
  registry.assertSingleOwner?.();
  const rows=Object.values(registry.owners||{});
  if(registry.production_active!==true||rows.length!==15||!rows.every(x=>x?.status==='production'))throw new Error(`canonical owner registry inactive: ${rows.filter(x=>x?.status==='production').length}/${rows.length}`);
  return registry;
}

function installCanonicalRendererBridge(registry){
  const {buildRendererSource}=require(path.join(APP_ROOT,'canonical-owner-bundler-v0160.js'));
  const built=buildRendererSource({appDir:APP_ROOT});
  app.on('browser-window-created',(_event,win)=>{
    const inject=()=>{
      try{
        if(!win||win.isDestroyed?.()||win.webContents?.isDestroyed?.())return;
        Promise.resolve(win.webContents.executeJavaScript(built.source,false)).then(result=>{
          if(!result?.production_active||Number(result?.owners_active)!==15)console.warn('[clean canonical renderer] owner layer did not report full activation');
        }).catch(e=>console.warn('[clean canonical renderer] inject failed:',e?.message||String(e)));
      }catch(e){console.warn('[clean canonical renderer] inject failed:',e?.message||String(e))}
    };
    try{win.webContents.on('did-finish-load',inject)}catch(e){console.warn('[clean canonical renderer] hook failed:',e?.message||String(e))}
  });
  return{production_active:true,owners_active:Object.keys(registry.owners||{}).length,modules:built.modules};
}

function bootstrap(){
  installShadowDiagnosticsRenderer();

  const stableUserData=pinStableUserData();
  require('../main/universal-rating-ipc').installUniversalRatingIpc({
    ipcMain,
    userDataPath:String(process.env.ARAM_UNIVERSAL_RATING_DB_ROOT||stableUserData)
  });

  const canonicalRegistry=loadCanonicalRegistry();
  installCanonicalRendererBridge(canonicalRegistry);
  try{require(path.join(APP_ROOT,'cold-start-promotion-v0160.js')).install({appDir:APP_ROOT,version:VERSION})}catch(e){try{console.warn('[clean cold-start promotion] install failed:',e?.message||String(e))}catch{}}

  const livePatch=require(path.join(APP_ROOT,'autosync-live-runtime-v01571.js'));
  require(path.join(APP_ROOT,'autosync-concurrency-v015119.js')).install(livePatch);
  const safety=require('./legacy-safety-bootstrap').install({appRoot:APP_ROOT,version:VERSION,livePatch});
  if(safety.rollbackScheduled)return{rollbackScheduled:true,version:VERSION};

  require(path.join(APP_ROOT,'legacy-runtime-core.js'));
  return{rollbackScheduled:false,version:VERSION,cleanConsolidation:true};
}

module.exports=bootstrap();
