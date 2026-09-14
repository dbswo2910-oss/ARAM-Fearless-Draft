'use strict';
const fs=require('fs');
const path=require('path');
const {app}=require('electron');
const {patchSuccessorSource}=require('./successor-route-v015135');
const VERSION='0.15.135';
const STABLE_APP_ID='aram-fearless-draft';
try{
  const stable=path.join(app.getPath('appData'),STABLE_APP_ID);
  const before=app.getPath('userData');
  if(path.resolve(before)!==path.resolve(stable))app.setPath('userData',stable);
  console.log('[v0.15.135 storage-root]',{before,stable,active:app.getPath('userData')});
}catch(e){console.warn('[v0.15.135 storage-root] pin failed:',e?.message||String(e))}
const SAFETY_BASELINE_LINEAGE_V015135=Object.freeze({via:'main-v015134.js',recoveryBase:'main-v015122.js',root:'main-v01579.js',reason:'patchnotes-semantic-shell-real-windows-followup'});
void SAFETY_BASELINE_LINEAGE_V015135;
try{require('./cold-start-promotion-v015135').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.15.135 cold-start promotion] install failed:',e?.message||String(e))}catch{}}
const basePath=path.join(__dirname,'main-v015122.js');
const src=patchSuccessorSource(fs.readFileSync(basePath,'utf8'));
module._compile(src,__filename);
