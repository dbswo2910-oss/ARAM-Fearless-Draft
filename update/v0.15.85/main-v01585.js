'use strict';
const fs=require('fs');
const path=require('path');

// v0.15.85 is a layout-scale successor of v0.15.84.
// It preserves recommendation behavior and only enlarges the bottom fight-status board.
const SAFETY_BASELINE_LINEAGE_V01585=Object.freeze({
  via:'main-v01584.js',
  via84:'main-v01583.js',
  via83:'main-v01582.js',
  via82:'main-v01581.js',
  via81:'main-v01580.js',
  root:'main-v01579.js',
  v80Transition:"replaceAll('0.15.79','0.15.80')"
});
void SAFETY_BASELINE_LINEAGE_V01585;
const basePath=path.join(__dirname,'main-v01584.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.84';
const hits=src.split(marker).length-1;
if(hits<3)throw new Error('v0.15.85 successor contract mismatch: v0.15.84 markers='+hits);
const oldStability='runtime-source-stability-v01584';
if(src.split(oldStability).length-1<1)throw new Error('v0.15.85 source-stability successor contract mismatch');
src=src.replaceAll('0.15.84','0.15.85').replaceAll(oldStability,'runtime-source-stability-v01585');
module._compile(src,__filename);
