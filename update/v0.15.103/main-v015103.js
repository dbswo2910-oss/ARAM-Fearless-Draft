'use strict';
const fs=require('fs');
const path=require('path');
const SAFETY_BASELINE_LINEAGE_V015103=Object.freeze({via:'main-v015102.js',root:'main-v01579.js',reason:'restore-random-reference-layout-and-promote-data-subnav'});
void SAFETY_BASELINE_LINEAGE_V015103;
const basePath=path.join(__dirname,'main-v015102.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.102';
const hits=src.split(marker).length-1;
if(hits<3)throw new Error('v0.15.103 successor contract mismatch: v0.15.102 markers='+hits);
const scriptAnchor="'input-interaction-stability-v01539.js'";
const anchorHits=src.split(scriptAnchor).length-1;
if(anchorHits===1){
  src=src.replace(scriptAnchor,scriptAnchor+",'ui-layout-restore-v015103.js'");
}
// Compatibility fallback for already-packaged v0.15.103 installs: main-v015102.js is
// a thin successor wrapper and therefore may not contain the renderer script anchor.
// Do not hard-crash the Electron main process in that case. Boot the proven predecessor
// chain as v0.15.103 so the updater can advance the installation to the fixed release.
src=src.replaceAll('0.15.102','0.15.103');
module._compile(src,__filename);
