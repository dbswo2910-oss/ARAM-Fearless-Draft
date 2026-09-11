'use strict';
const fs=require('fs');
const path=require('path');

// v0.15.87 adds live route-adoption UX and makes completed user purchases a new build anchor.
const SAFETY_BASELINE_LINEAGE_V01587=Object.freeze({
  via:'main-v01586.js',
  via86:'main-v01585.js',
  via85:'main-v01584.js',
  via84:'main-v01583.js',
  via83:'main-v01582.js',
  via82:'main-v01581.js',
  via81:'main-v01580.js',
  root:'main-v01579.js',
  v80Transition:"replaceAll('0.15.79','0.15.80')"
});
void SAFETY_BASELINE_LINEAGE_V01587;
const basePath=path.join(__dirname,'main-v01586.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.86';
const hits=src.split(marker).length-1;
if(hits<3)throw new Error('v0.15.87 successor contract mismatch: v0.15.86 markers='+hits);
const oldStability='runtime-source-stability-v01586';
if(src.split(oldStability).length-1<1)throw new Error('v0.15.87 source-stability successor contract mismatch');
src=src.replaceAll('0.15.86','0.15.87').replaceAll(oldStability,'runtime-source-stability-v01587');
module._compile(src,__filename);
