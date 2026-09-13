'use strict';
const fs=require('fs');
const path=require('path');
const {patchSuccessorSource}=require('./successor-route-v015131');
const VERSION='0.15.131';
void VERSION;
const SAFETY_BASELINE_LINEAGE_V015131=Object.freeze({via:'main-v015129.js',recoveryBase:'main-v015122.js',root:'main-v01579.js',reason:'cold-boot-old-version-authority-fix'});
void SAFETY_BASELINE_LINEAGE_V015131;
try{require('./update-boot-diagnostic-v015131').install()}catch(e){try{console.warn('[v0.15.131] boot diagnostic unavailable',e)}catch{}}
const basePath=path.join(__dirname,'main-v015122.js');
const src=patchSuccessorSource(fs.readFileSync(basePath,'utf8'));
module._compile(src,__filename);
