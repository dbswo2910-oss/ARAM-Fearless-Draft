'use strict';
const fs=require('fs');
const path=require('path');
const {patchSuccessorSource}=require('./successor-route-v015125');
const VERSION='0.15.125';
void VERSION;
const SAFETY_BASELINE_LINEAGE_V015125=Object.freeze({
  via:'main-v015124.js',
  recoveryBase:'main-v015122.js',
  root:'main-v01579.js',
  reason:'aram-build-stat-cache'
});
void SAFETY_BASELINE_LINEAGE_V015125;
const basePath=path.join(__dirname,'main-v015122.js');
const src=patchSuccessorSource(fs.readFileSync(basePath,'utf8'));
module._compile(src,__filename);
