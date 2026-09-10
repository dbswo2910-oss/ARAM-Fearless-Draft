'use strict';
const fs=require('fs');
const path=require('path');
const Module=require('module');
const basePath=path.join(__dirname,'main-base-v01562.js');
let src=fs.readFileSync(basePath,'utf8');
const replacements=[
  ["const VERSION='0.15.62';","const VERSION='0.15.63';"],
  ["ARAM-Fearless-Draft-InApp-Updater/0.15.62","ARAM-Fearless-Draft-InApp-Updater/0.15.63"],
  ["'random-party-pool-labels-v01562.js','role-metric-detail-v01518.js'","'random-party-pool-labels-v01562.js','item-art-hotfix-v01563.js','role-metric-detail-v01518.js'"],
  ["Boolean(window.__ARAM_RANDOM_PARTY_POOL_LABELS_V01562__) && Boolean(window.__ARAM_ROLE_METRIC_DETAIL_V01518__)","Boolean(window.__ARAM_RANDOM_PARTY_POOL_LABELS_V01562__) && Boolean(window.__ARAM_ITEM_ART_HOTFIX_V01563__) && Boolean(window.__ARAM_ROLE_METRIC_DETAIL_V01518__)"],
  ["[v0.15.62]","[v0.15.63]"]
];
for(const [from,to] of replacements){
  if(!src.includes(from))throw new Error(`v0.15.63 base-main patch anchor missing: ${from}`);
  src=src.split(from).join(to);
}
const runtime=new Module(__filename,module.parent);
runtime.filename=__filename;
runtime.paths=module.paths;
runtime._compile(src,__filename);
