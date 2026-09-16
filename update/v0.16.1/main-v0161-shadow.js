'use strict';
const fs=require('fs');
const path=require('path');
const basePath=path.join(__dirname,'main-v0160.js');
let src=fs.readFileSync(basePath,'utf8');

const versionOld="const VERSION='0.16.0';";
const versionNew="const VERSION='0.16.1';";
if(!src.includes(versionOld))throw new Error('v0.16.1 successor contract mismatch: v0.16.0 version marker missing');
src=src.replace(versionOld,versionNew);

const pinOld="pinStableUserData();\nconst canonicalRegistry=loadCanonicalRegistry();";
const pinNew="const __universalRatingUserData=pinStableUserData();\nrequire('./src/main/universal-rating-ipc').installUniversalRatingIpc({ipcMain:require('electron').ipcMain,userDataPath:String(process.env.ARAM_UNIVERSAL_RATING_DB_ROOT||__universalRatingUserData)});\nconst canonicalRegistry=loadCanonicalRegistry();";
if(!src.includes(pinOld))throw new Error('v0.16.1 successor contract mismatch: stable userData anchor missing');
src=src.replace(pinOld,pinNew);

const compileOld="const src=patchSuccessorSource(fs.readFileSync(basePath,'utf8'));\nmodule._compile(src,__filename);";
const compileNew="let src=patchSuccessorSource(fs.readFileSync(basePath,'utf8'));\nconst __preloadOld=\"path.join(__dirname,'preload.js')\";\nconst __preloadNew=\"path.join(__dirname,'preload-v0161-shadow.js')\";\nif(!src.includes(__preloadOld))throw new Error('v0.16.1 successor contract mismatch: preload route missing');\nsrc=src.replace(__preloadOld,__preloadNew).replaceAll('0.16.0','0.16.1');\nmodule._compile(src,__filename);";
if(!src.includes(compileOld))throw new Error('v0.16.1 successor contract mismatch: compile anchor missing');
src=src.replace(compileOld,compileNew);
module._compile(src,__filename);
