'use strict';
const fs=require('fs');
const path=require('path');
const {patchSuccessorSource}=require('./successor-route-v015130');
const VERSION='0.15.130';
void VERSION;
const SAFETY_BASELINE_LINEAGE_V015130=Object.freeze({
  via:'main-v015128.js',
  recoveryBase:'main-v015122.js',
  runtimePolicy:'runtime-source-stability-v015128',
  root:'main-v01579.js',
  reason:'research-ui-static-profile-hotfix'
});
void SAFETY_BASELINE_LINEAGE_V015130;
const basePath=path.join(__dirname,'main-v015122.js');
const src=patchSuccessorSource(fs.readFileSync(basePath,'utf8'));
module._compile(src,__filename);
