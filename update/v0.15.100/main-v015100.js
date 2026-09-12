'use strict';
const fs=require('fs');
const path=require('path');
const SAFETY_BASELINE_LINEAGE_V015100=Object.freeze({via:'main-v01599.js',root:'main-v01579.js',v80Transition:"replaceAll('0.15.79','0.15.80')"});
void SAFETY_BASELINE_LINEAGE_V015100;
// Incremental packages are assembled into one active version directory. Resolve the
// predecessor from the same package directory instead of assuming an older sibling
// version directory is still present on disk.
const basePath=path.join(__dirname,'main-v01599.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.99';
const hits=src.split(marker).length-1;
if(hits<3)throw new Error('v0.15.100 successor contract mismatch: v0.15.99 markers='+hits);
const oldStability='runtime-source-stability-v01599';
if(src.split(oldStability).length-1<1)throw new Error('v0.15.100 source-stability successor contract mismatch');
src=src.replaceAll('0.15.99','0.15.100').replaceAll(oldStability,'runtime-source-stability-v015100');
module._compile(src,__filename);
