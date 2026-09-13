'use strict';
const fs=require('fs');
const path=require('path');
const SAFETY_BASELINE_LINEAGE_V015115=Object.freeze({via:'main-v015114.js',root:'main-v01579.js',reason:'single-owner-ui-runtime-consolidation'});
void SAFETY_BASELINE_LINEAGE_V015115;

/* Preserve the latest main-process lineage exactly, changing only the version and
 * runtime-source owner selected by the v0.15.114 successor wrapper. */
const basePath=path.join(__dirname,'main-v015114.js');
let src=fs.readFileSync(basePath,'utf8');
const versionRoute="src=src.replaceAll('0.15.113','0.15.114').replaceAll(stabilityAnchor,'runtime-source-stability-v015114');";
if(!src.includes(versionRoute))throw new Error('v0.15.115 main successor contract mismatch: v0.15.114 route missing');
src=src.replace(versionRoute,"src=src.replaceAll('0.15.113','0.15.115').replaceAll(stabilityAnchor,'runtime-source-stability-v015115');");
src=src.replace("const SAFETY_BASELINE_LINEAGE_V015114=Object.freeze({via:'main-v015113.js',root:'main-v01579.js',reason:'random-pick-integrity-engine-backed-name-and-dna-repair'});","const SAFETY_BASELINE_LINEAGE_V015114=Object.freeze({via:'main-v015113.js',root:'main-v01579.js',reason:'v0.15.115-single-owner-ui-runtime-consolidation'});");
module._compile(src,__filename);
