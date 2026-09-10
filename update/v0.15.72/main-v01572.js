'use strict';
const fs=require('fs');
const path=require('path');
const autosyncCore=require('./autosync-core');
require('./autosync-live-runtime-v01571').patch(autosyncCore);
const basePath=path.join(__dirname,'main.js');
let src=fs.readFileSync(basePath,'utf8');
const scriptsOld="'runtime-performance-v01568.js','live-strength-v01513.js'";
const scriptsNew="'runtime-performance-v01568.js','runtime-live-autosync-v01571.js','live-strength-v01513.js'";
const randomOld="'random-party-pool-labels-v01562.js','item-art-hotfix-v01563.js'";
const randomNew="'random-party-pool-labels-v01562.js','runtime-random-practice-v01572.js','item-art-hotfix-v01563.js'";
const readyOld='Boolean(window.__ARAM_RUNTIME_PERFORMANCE_V01568__) && Boolean(window.__ARAM_LIVE_STRENGTH_V01513__)';
const readyNew='Boolean(window.__ARAM_RUNTIME_PERFORMANCE_V01568__) && Boolean(window.__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__) && Boolean(window.__ARAM_LIVE_STRENGTH_V01513__)';
const randomReadyOld='Boolean(window.__ARAM_RANDOM_PARTY_POOL_LABELS_V01562__) && Boolean(window.__ARAM_ITEM_ART_HOTFIX_V01563__)';
const randomReadyNew='Boolean(window.__ARAM_RANDOM_PARTY_POOL_LABELS_V01562__) && Boolean(window.__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__) && Boolean(window.__ARAM_ITEM_ART_HOTFIX_V01563__)';
for(const needle of [scriptsOld,randomOld,readyOld,randomReadyOld,"const VERSION='0.15.70'"]){if(!src.includes(needle))throw new Error('v0.15.72 base main contract mismatch: '+needle.slice(0,80))}
src=src.replace(scriptsOld,scriptsNew).replace(randomOld,randomNew).replace(readyOld,readyNew).replace(randomReadyOld,randomReadyNew).replaceAll('0.15.70','0.15.72');
module._compile(src,__filename);
