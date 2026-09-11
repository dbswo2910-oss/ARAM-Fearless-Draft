'use strict';
const fs=require('fs');
const path=require('path');

// v0.15.83 is a visual-only successor of v0.15.82.
// It keeps the v0.15.81 item recommendation engine and v0.15.79 safety ownership intact.
const SAFETY_BASELINE_LINEAGE_V01583=Object.freeze({
  via:'main-v01582.js',
  via82:'main-v01581.js',
  via81:'main-v01580.js',
  root:'main-v01579.js',
  v80Transition:"replaceAll('0.15.79','0.15.80')"
});
void SAFETY_BASELINE_LINEAGE_V01583;
const basePath=path.join(__dirname,'main-v01582.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.82';
const hits=src.split(marker).length-1;
if(hits<3)throw new Error('v0.15.83 successor contract mismatch: v0.15.82 markers='+hits);
const oldStability='runtime-source-stability-v01582';
if(src.split(oldStability).length-1<1)throw new Error('v0.15.83 source-stability successor contract mismatch');
src=src.replaceAll('0.15.82','0.15.83').replaceAll(oldStability,'runtime-source-stability-v01583');
module._compile(src,__filename);
