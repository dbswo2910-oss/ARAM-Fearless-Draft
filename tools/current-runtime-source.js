'use strict';

const fs=require('fs');
const path=require('path');

function exists(root,rel){
  return typeof rel==='string'&&rel.length>0&&fs.existsSync(path.join(root,rel));
}

function resolveCurrentRuntimeSource(root,manifest){
  const files=Array.isArray(manifest?.files)?manifest.files:[];
  const byPath=new Map(files.map(x=>[String(x.path||''),String(x.source||'')]));
  const mainSource=byPath.get('main.js');
  if(!exists(root,mainSource))throw new Error(`current main.js source is not delivered: ${mainSource||'missing'}`);

  if(manifest?.clean_runtime_consolidated!==true)return mainSource;

  const main=fs.readFileSync(path.join(root,mainSource),'utf8');
  const required=[...main.matchAll(/require\(['"]\.\/([^'"]+\.js)['"]\)/g)].map(m=>m[1]);
  const flattened=required.filter(target=>/^legacy-runtime-v\d+\.js$/.test(target));
  if(flattened.length!==1)throw new Error(`clean runtime must reference exactly one flattened legacy runtime; found ${flattened.length}`);

  const source=byPath.get(flattened[0]);
  if(!exists(root,source))throw new Error(`flattened runtime is not delivered: ${flattened[0]} -> ${source||'missing'}`);
  return source;
}

module.exports={resolveCurrentRuntimeSource};
