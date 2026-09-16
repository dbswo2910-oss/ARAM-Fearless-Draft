'use strict';
const fs=require('fs');
const path=require('path');
const basePath=path.join(__dirname,'main-v0162-shadow-diagnostics.js');
if(!fs.existsSync(basePath))throw new Error('v0.16.3 successor base missing');
let src=fs.readFileSync(basePath,'utf8');
if(!src.includes('0.16.2'))throw new Error('v0.16.3 successor contract mismatch: v0.16.2 marker missing');
src=src.replaceAll('0.16.2','0.16.3');
module._compile(src,__filename);
