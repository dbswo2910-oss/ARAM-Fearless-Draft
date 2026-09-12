'use strict';
const fs=require('fs');
const path=require('path');
const SAFETY_BASELINE_LINEAGE_V015104=Object.freeze({via:'main-v015100.js',root:'main-v01579.js',reason:'startup-hotfix-for-v015103-anchor-mismatch-while-preserving-v015103-ui'});
void SAFETY_BASELINE_LINEAGE_V015104;

// v0.15.103 attempted to find a renderer-script anchor in main-v015102.js.
// That predecessor is only a thin successor wrapper, so the renderer anchor can
// never exist there and startup fails before Electron can create the window.
// v0.15.104 deliberately resumes from the last behavior-bearing main wrapper
// (v0.15.100), then redirects its runtime-source-stability target to v0.15.104.
// Packaging-only v0.15.101/v0.15.102 behavior is preserved by the active manifest,
// while the v0.15.103 UI layer is injected by runtime-source-stability-v015104.
const basePath=path.join(__dirname,'main-v015100.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.100';
const hits=src.split(marker).length-1;
if(hits<3)throw new Error('v0.15.104 successor contract mismatch: v0.15.100 markers='+hits);
const stabilityAnchor='runtime-source-stability-v015100';
if(src.split(stabilityAnchor).length-1<1)throw new Error('v0.15.104 source-stability anchor mismatch');
src=src.replaceAll('0.15.100','0.15.104').replaceAll(stabilityAnchor,'runtime-source-stability-v015104');
module._compile(src,__filename);
