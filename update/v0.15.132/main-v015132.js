'use strict';
const fs=require('fs');
const path=require('path');
const {app}=require('electron');
const {patchSuccessorSource}=require('./successor-route-v015132');
const VERSION='0.15.132';
const STABLE_APP_ID='aram-fearless-draft';
/*
 * v0.15.129 and earlier used package name `aram-fearless-draft`.
 * v0.15.130/131 accidentally changed it to `aram-fearless-draft-update`, which
 * changes Electron's default userData/session storage root. Pin the original
 * root before any BrowserWindow/session/IndexedDB activity so the existing
 * Research checkpoint becomes visible again and future package metadata cannot
 * silently move persistent storage.
 */
try{
  const stable=path.join(app.getPath('appData'),STABLE_APP_ID);
  const before=app.getPath('userData');
  if(path.resolve(before)!==path.resolve(stable))app.setPath('userData',stable);
  console.log('[v0.15.132 storage-root]',{before,stable,active:app.getPath('userData')});
}catch(e){console.warn('[v0.15.132 storage-root] pin failed:',e?.message||String(e))}
const SAFETY_BASELINE_LINEAGE_V015132=Object.freeze({via:'main-v015131.js',recoveryBase:'main-v015122.js',root:'main-v01579.js',reason:'restore-v129-userdata-and-fix-patchnotes-runtime-target'});
void SAFETY_BASELINE_LINEAGE_V015132;
try{require('./cold-start-promotion-v015132').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.15.132 cold-start promotion] install failed:',e?.message||String(e))}catch{}}
const basePath=path.join(__dirname,'main-v015122.js');
const src=patchSuccessorSource(fs.readFileSync(basePath,'utf8'));
module._compile(src,__filename);
