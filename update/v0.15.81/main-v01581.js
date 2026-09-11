'use strict';
const fs=require('fs');
const path=require('path');

// v0.15.81 is a narrow successor of v0.15.80.
// It changes only the IN GAME item recommendation policy; v0.15.79 safety remains inherited.
const basePath=path.join(__dirname,'main-v01580.js');
let src=fs.readFileSync(basePath,'utf8');
const marker='0.15.80';
const hits=src.split(marker).length-1;
if(hits<5)throw new Error('v0.15.81 successor contract mismatch: v0.15.80 markers='+hits);
const oldStability='runtime-source-stability-v01580';
if(src.split(oldStability).length-1<1)throw new Error('v0.15.81 source-stability successor contract mismatch');
src=src.replaceAll('0.15.80','0.15.81').replaceAll(oldStability,'runtime-source-stability-v01581');
module._compile(src,__filename);
