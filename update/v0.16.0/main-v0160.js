'use strict';
const fs=require('fs');
const path=require('path');
const {app}=require('electron');
const {patchSuccessorSource}=require('./successor-route-v0160');
const VERSION='0.16.0';
const STABLE_APP_ID='aram-fearless-draft';
const RENDERER_BUNDLE='canonical-renderer-bundle.js';

function pinStableUserData(){
  const stable=path.join(app.getPath('appData'),STABLE_APP_ID);
  const before=app.getPath('userData');
  if(path.resolve(before)!==path.resolve(stable))app.setPath('userData',stable);
  console.log('[v0.16.0 storage-root]',{before,stable,active:app.getPath('userData')});
  return stable;
}

function installCanonicalRendererBridge(){
  const bundlePath=path.join(__dirname,RENDERER_BUNDLE);
  if(!fs.existsSync(bundlePath))throw new Error(`v0.16.0 renderer bundle missing: ${RENDERER_BUNDLE}`);
  const source=fs.readFileSync(bundlePath,'utf8')+`\n//# sourceURL=${RENDERER_BUNDLE}`;
  app.on('browser-window-created',(_event,win)=>{
    const inject=()=>{
      try{
        if(!win||win.isDestroyed?.()||win.webContents?.isDestroyed?.())return;
        Promise.resolve(win.webContents.executeJavaScript(source,false)).catch(e=>console.warn('[v0.16.0 canonical renderer bridge] inject failed:',e?.message||String(e)));
      }catch(e){console.warn('[v0.16.0 canonical renderer bridge] inject failed:',e?.message||String(e))}
    };
    try{win.webContents.on('did-finish-load',inject)}catch(e){console.warn('[v0.16.0 canonical renderer bridge] hook failed:',e?.message||String(e))}
  });
  return{bundlePath,production_active:false};
}

pinStableUserData();
installCanonicalRendererBridge();
const SAFETY_BASELINE_LINEAGE_V0160=Object.freeze({via:'main-v015122.js',runtimeStability:'runtime-source-stability-v015135',goldenRollback:'0.15.135',reason:'v016-production-candidate-package-scaffold'});
void SAFETY_BASELINE_LINEAGE_V0160;
try{require('./cold-start-promotion-v0160').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.16.0 cold-start promotion] install failed:',e?.message||String(e))}catch{}}
const basePath=path.join(__dirname,'main-v015122.js');
const src=patchSuccessorSource(fs.readFileSync(basePath,'utf8'));
module._compile(src,__filename);
