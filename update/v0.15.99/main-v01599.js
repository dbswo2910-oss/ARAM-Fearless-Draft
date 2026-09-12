'use strict';
const fs=require('fs');
const path=require('path');
const SAFETY_BASELINE_LINEAGE_V01599=Object.freeze({via:'main-v01598.js',root:'main-v01579.js',v80Transition:"replaceAll('0.15.79','0.15.80')"});
void SAFETY_BASELINE_LINEAGE_V01599;
// Incremental packages are assembled into one active version directory. Resolve the
// predecessor from the same package directory instead of assuming an older sibling
// version directory is still present on disk.
const basePath=path.join(__dirname,'main-v01598.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.98';
const hits=src.split(marker).length-1;
if(hits<3)throw new Error('v0.15.99 successor contract mismatch: v0.15.98 markers='+hits);
const oldStability='runtime-source-stability-v01598';
if(src.split(oldStability).length-1<1)throw new Error('v0.15.99 source-stability successor contract mismatch');
src=src.replaceAll('0.15.98','0.15.99').replaceAll(oldStability,'runtime-source-stability-v01599');
module._compile(src,__filename);
