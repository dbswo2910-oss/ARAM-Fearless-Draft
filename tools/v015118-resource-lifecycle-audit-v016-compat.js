'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');

const ROOT=path.resolve(__dirname,'..');
const sourcePath=path.join(__dirname,'v015118-resource-lifecycle-audit.js');
const tempPath=path.join(__dirname,'.v015118-resource-lifecycle-audit-v016-runtime.js');
let src=fs.readFileSync(sourcePath,'utf8');

// Keep the historical v0.15.118 audit unchanged for its own active release. Newer releases may
// either wrap the frozen v0.15.117 preload or materialize that state bridge directly (clean v0.17).
const preloadLine="    'preload.js':'update/v0.15.117/preload.js',\n";
const lastPreloadLine=src.lastIndexOf(preloadLine);
if(lastPreloadLine<0)throw new Error('v0.15.118 successor preload expectation contract drifted');
src=src.slice(0,lastPreloadLine)+src.slice(lastPreloadLine+preloadLine.length);

const successorLoop="  for(const [p,s] of Object.entries(preserved))if(map.get(p)!==s)throw new Error(`newer successor failed to preserve v0.15.118 baseline dependency ${p}`);\n";
const preloadCheck=[
  "  const successorPreloadSource=map.get('preload.js');",
  "  const cleanSuccessor=active==='0.17.0'&&manifest.clean_runtime_consolidated===true;",
  "  if(cleanSuccessor){",
  "    if(!successorPreloadSource||!exists(successorPreloadSource))throw new Error(`v0.15.118 clean successor preload source missing: ${successorPreloadSource||'missing'}`);",
  "    const successorPreloadText=read(successorPreloadSource);",
  "    const directStateBridge=[\"require('./state-integrity-v015117')\",'readStateMirror: namespace => stateRead(namespace)','writeStateMirror: (namespace,payload) => stateWrite(namespace,payload)','traceStateIntegrity: (event,detail) => stateDiagnostic(event,detail)'];",
  "    for(const needle of directStateBridge)if(!successorPreloadText.includes(needle))throw new Error(`v0.15.118 clean successor preload lost direct v0.15.117 state bridge: ${needle}`);",
  "  }else if(successorPreloadSource!=='update/v0.15.117/preload.js'){",
  "    const frozenBaseTarget='preload-base-v015117.js';",
  "    const frozenBaseSource=map.get(frozenBaseTarget);",
  "    if(frozenBaseSource!=='update/v0.15.117/preload.js')throw new Error(`newer successor failed to preserve frozen v0.15.117 preload base: ${frozenBaseSource||'missing'}`);",
  "    if(!successorPreloadSource||!exists(successorPreloadSource))throw new Error(`newer successor preload source missing: ${successorPreloadSource||'missing'}`);",
  "    const successorPreloadText=read(successorPreloadSource);",
  "    if(!successorPreloadText.includes(frozenBaseTarget)||!successorPreloadText.includes('patchPreloadSource'))throw new Error(`newer successor preload does not inherit frozen state bridge: ${successorPreloadSource}`);",
  "  }",
  "  ok('successor-preserves-v118-preload-lineage');"
].join('\n')+'\n';
if(src.includes(successorLoop))src=src.replace(successorLoop,successorLoop+preloadCheck);
else throw new Error('v0.15.118 successor preserved-loop contract drifted');

fs.writeFileSync(tempPath,src,'utf8');
try{
  const r=cp.spawnSync(process.execPath,[tempPath],{cwd:ROOT,stdio:'inherit',env:process.env});
  if(r.error)throw r.error;
  if(r.status!==0)process.exit(r.status||1);
}finally{
  fs.rmSync(tempPath,{force:true});
}
