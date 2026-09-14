'use strict';
const fs=require('fs');
const path=require('path');
const {patchSuccessorSource}=require('./successor-route-v015130');
const VERSION='0.15.130';
const SAFETY_BASELINE_LINEAGE_V015130=Object.freeze({
  via:'main-v015129.js',
  recoveryBase:'main-v015122.js',
  root:'main-v01579.js',
  reason:'production-rating-ui-target-puuid-and-cold-start-promotion'
});
void SAFETY_BASELINE_LINEAGE_V015130;
try{require('./cold-start-promotion-v015130').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.15.130 cold-start promotion] install failed:',e?.message||String(e))}catch{}}
const basePath=path.join(__dirname,'main-v015122.js');
const src=patchSuccessorSource(fs.readFileSync(basePath,'utf8'));
module._compile(src,__filename);
