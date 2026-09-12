'use strict';
const fs=require('fs');
const path=require('path');
const SAFETY_BASELINE_LINEAGE_V015101=Object.freeze({via:'main-v015100.js',root:'main-v01579.js',v80Transition:"replaceAll('0.15.79','0.15.80')"});
void SAFETY_BASELINE_LINEAGE_V015101;

// Packaging hotfix: every manifest source is copied into one active overlay directory.
// Never require a previous update/vX.Y.Z directory to still exist on the user's PC.
const basePath=path.join(__dirname,'main-v015100.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.100';
const hits=src.split(marker).length-1;
if(hits<3)throw new Error('v0.15.101 successor contract mismatch: v0.15.100 markers='+hits);
// v0.15.101 intentionally reuses the v0.15.100 runtime-source-stability module;
// this release changes startup packaging only, not renderer behavior or scoring.
src=src.replaceAll('0.15.100','0.15.101');
module._compile(src,__filename);
