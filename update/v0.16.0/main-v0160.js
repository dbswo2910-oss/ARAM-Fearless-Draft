'use strict';
const fs=require('fs');
const path=require('path');
const {app}=require('electron');
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

pinStableUserData();
const canonicalRegistry=loadCanonicalRegistry();
installCanonicalRendererBridge(canonicalRegistry);
const SAFETY_BASELINE_LINEAGE_V0160=Object.freeze({via:'main-v015122.js',runtimeStability:'runtime-source-stability-v015135',goldenRollback:'0.15.135',reason:'v016-production-owner-adapter-layer'});
void SAFETY_BASELINE_LINEAGE_V0160;
try{require('./cold-start-promotion-v0160').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.16.0 cold-start promotion] install failed:',e?.message||String(e))}catch{}}
const basePath=path.join(__dirname,'main-v015122.js');
const src=patchSuccessorSource(fs.readFileSync(basePath,'utf8'));
module._compile(src,__filename);
