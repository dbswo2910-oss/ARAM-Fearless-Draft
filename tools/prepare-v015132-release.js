'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const p=x=>path.join(ROOT,x);
const readJson=x=>JSON.parse(fs.readFileSync(p(x),'utf8'));
const sha=x=>crypto.createHash('sha256').update(fs.readFileSync(p(x))).digest('hex');
const manifest=readJson('update/manifest.json');
manifest.version='0.15.132';
manifest.message='v0.15.132 · RESTORE RESEARCH STORAGE ROOT + PATCH NOTES RUNTIME FIX';
manifest.min_launcher='2.0.2';
const replacements=[
  ['package.json','update/v0.15.132/package.json'],
  ['main-v015132.js','update/v0.15.132/main-v015132.js'],
  ['successor-route-v015132.js','update/v0.15.132/successor-route-v015132.js'],
  ['runtime-source-stability-v015132.js','update/v0.15.132/runtime-source-stability-v015132.js'],
  ['research-storage-v015131.js','update/v0.15.132/research-storage-v015131.js'],
  ['cold-start-promotion-v015132.js','update/v0.15.132/cold-start-promotion-v015132.js']
];
const files=Array.isArray(manifest.files)?manifest.files:[];
for(const [out,source] of replacements){
  if(!fs.existsSync(p(source)))throw new Error('missing release source '+source);
  const next={path:out,source,sha256:sha(source)};
  const i=files.findIndex(x=>x.path===out);
  if(i>=0)files[i]={...files[i],...next};else files.push(next);
}
manifest.files=files;
fs.writeFileSync(p('update/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
require('./sync-current-state').sync();
console.log('v0.15.132 release metadata prepared', {version:manifest.version,files:manifest.files.length});
