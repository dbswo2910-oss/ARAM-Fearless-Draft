'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');

const ROOT=path.resolve(__dirname,'..');
const sourcePath=path.join(__dirname,'v015128-history-latency-audit.js');
const tempPath=path.join(__dirname,'.v015128-history-latency-audit-v016-runtime.js');
let src=fs.readFileSync(sourcePath,'utf8');

const oldLine="    const activeRuntimePath=map.get(`runtime-source-stability-v${String(manifest.version).replace(/\\./g,'')}.js`);";
const newLine="    const activeRuntimeKey=String(manifest.version)==='0.16.0'?'runtime-source-stability-v015135.js':`runtime-source-stability-v${String(manifest.version).replace(/\\./g,'')}.js`;\n    const activeRuntimePath=map.get(activeRuntimeKey);";
if(src.includes(oldLine)) src=src.replace(oldLine,newLine);
else if(!src.includes("const activeRuntimeKey=String(manifest.version)==='0.16.0'?'runtime-source-stability-v015135.js'")) throw new Error('v0.15.128 active successor runtime lookup contract drifted');

fs.writeFileSync(tempPath,src,'utf8');
try{
  const r=cp.spawnSync(process.execPath,[tempPath],{cwd:ROOT,stdio:'inherit',env:process.env});
  if(r.error)throw r.error;
  if(r.status!==0)process.exit(r.status||1);
}finally{
  fs.rmSync(tempPath,{force:true});
}
