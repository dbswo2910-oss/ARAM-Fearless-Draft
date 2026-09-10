'use strict';
const fs=require('fs');
const path=require('path');
require('./freeze-watchdog-v01574').install({version:'0.15.74'});
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
for(const needle of [scriptsOld,randomOld,readyOld,randomReadyOld,"const VERSION='0.15.70'"]){if(!src.includes(needle))throw new Error('v0.15.74 base main contract mismatch: '+needle.slice(0,80))}
src=src.replace(scriptsOld,scriptsNew).replace(randomOld,randomNew).replace(readyOld,readyNew).replace(randomReadyOld,randomReadyNew).replaceAll('0.15.70','0.15.74');

const readOld="const code=fs.readFileSync(path.join(__dirname,file),'utf8')+`\\n//# sourceURL=${file}`;";
const readNew="let code=fs.readFileSync(path.join(__dirname,file),'utf8');"+
"if(file==='random-ingame-shop-v01553.js'){code=code.replace(\"if(!catalog?.ok){box.innerHTML='<div class=\\\"riShopWait\\\">아이템 조합표 확인 중…</div>';loadCatalog().then(()=>sync());return}\",\"if(!catalog?.ok){box.innerHTML='<div class=\\\"riShopWait\\\">아이템 조합표 확인 중…</div>';if(!catalog||Date.now()-Number(catalog.loadedAt||0)>15000)loadCatalog().then(x=>{if(x?.ok)sync()});return}\").replace(\"ensureStyles();loadCatalog().then(()=>sync());sync();timer=setInterval(sync,360);\",\"ensureStyles();loadCatalog().then(x=>{if(x?.ok)sync()});sync();timer=setInterval(sync,360);\");}"+
"if(file==='item-icons-global-v01557.js'){code=code.replace(\"pending=Promise.resolve().then(()=>api()).then(x=>{if(x?.ok)setCatalog(x);return x||null})\",\"pending=Promise.resolve().then(()=>api()).then(x=>{if(x?.ok)setCatalog(x);else catalog=x||null;return x||null})\").replace(\"ensureStyles();if(!catalog?.ok){loadCatalog().then(()=>{if(catalog?.ok)sync()});return}\",\"ensureStyles();if(!catalog?.ok){if(!catalog||Date.now()-Number(catalog.loadedAt||0)>15000)loadCatalog().then(()=>{if(catalog?.ok)sync()});return}\").replace(\"loadCatalog().then(()=>sync());sync();timer=setInterval(sync,700);\",\"loadCatalog().then(x=>{if(x?.ok)sync()});sync();timer=setInterval(sync,700);\");}"+
"if(file==='item-art-runtime-v01566.js'){code=code.replace(\"pending=Promise.resolve().then(()=>api()).then(x=>{if(x?.ok)setCatalog(x);return x||null})\",\"pending=Promise.resolve().then(()=>api()).then(x=>{if(x?.ok)setCatalog(x);else catalog=x||null;return x||null})\").replace(\"if(!catalog?.ok){loadCatalog().then(x=>{if(x?.ok)scan(root)});return}\",\"if(!catalog?.ok){if(!catalog||Date.now()-Number(catalog.loadedAt||0)>15000)loadCatalog().then(x=>{if(x?.ok)scan(root)});return}\").replace(\"if(!catalog?.ok){loadCatalog().then(x=>{if(x?.ok)scan()});return}\",\"if(!catalog?.ok){if(!catalog||Date.now()-Number(catalog.loadedAt||0)>15000)loadCatalog().then(x=>{if(x?.ok)scan()});return}\");}"+
"code+=`\\n//# sourceURL=${file}`;";
if(!src.includes(readOld))throw new Error('v0.15.74 script loader contract mismatch');
src=src.replace(readOld,readNew);

module._compile(src,__filename);
