'use strict';
const fs=require('fs');
const path=require('path');
const SAFETY_BASELINE_LINEAGE_V015102=Object.freeze({via:'main-v015101.js',root:'main-v01579.js',reason:'full-package-restore-after-manual-startup-repair'});
void SAFETY_BASELINE_LINEAGE_V015102;

// v0.15.102 intentionally forces a normal manifest update after the emergency
// v0.15.101 manual startup repair. The manual repair only restored startup files,
// so some PCs could report 0.15.101 while still carrying older renderer modules.
// Resolve the predecessor from the assembled appfiles directory and bump only the
// app version; renderer/scoring behavior remains the v0.15.100/101 lineage.
const basePath=path.join(__dirname,'main-v015101.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.101';
const hits=src.split(marker).length-1;
if(hits<3)throw new Error('v0.15.102 successor contract mismatch: v0.15.101 markers='+hits);
src=src.replaceAll('0.15.101','0.15.102');
module._compile(src,__filename);
