'use strict';
const fs=require('fs');
const path=require('path');

// v0.15.82 is a UI-only successor of v0.15.81.
// It keeps the v0.15.81 item recommendation engine and all v0.15.79 safety ownership intact.
const SAFETY_BASELINE_LINEAGE_V01582=Object.freeze({
  via:'main-v01581.js',
  via81:'main-v01580.js',
  root:'main-v01579.js',
  v80Transition:"replaceAll('0.15.79','0.15.80')"
});
void SAFETY_BASELINE_LINEAGE_V01582;
const basePath=path.join(__dirname,'main-v01581.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.81';
const hits=src.split(marker).length-1;
if(hits<5)throw new Error('v0.15.82 successor contract mismatch: v0.15.81 markers='+hits);
const oldStability='runtime-source-stability-v01581';
if(src.split(oldStability).length-1<1)throw new Error('v0.15.82 source-stability successor contract mismatch');
src=src.replaceAll('0.15.81','0.15.82').replaceAll(oldStability,'runtime-source-stability-v01582');
module._compile(src,__filename);
