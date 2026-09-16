'use strict';
const fs=require('fs');
const path=require('path');
const {patchPreloadSource}=require('./src/preload/universal-rating-history-hook');
const basePath=path.join(__dirname,'preload.js');
let src=fs.readFileSync(basePath,'utf8');
const patched=patchPreloadSource(src);
if(!patched.changed&&!patched.alreadyPatched)throw new Error('v0.16.1 preload shadow hook was not applied');
module._compile(patched.source,__filename);
