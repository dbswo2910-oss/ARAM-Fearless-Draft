'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');

const ROOT=path.resolve(__dirname,'..');
const sourcePath=path.join(__dirname,'v015117-state-integrity-audit.js');
const tempPath=path.join(__dirname,'.v015117-state-integrity-audit-v016-runtime.js');
let src=fs.readFileSync(sourcePath,'utf8');

const oldDecl="const m=active.match(/^0\\.15\\.(\\d+)$/),successor=m&&Number(m[1])>117;";
const newDecl="const m=active.match(/^0\\.15\\.(\\d+)$/),patch=m?Number(m[1]):null,successor=(patch!==null&&patch>117)||/^0\\.16\\.\\d+$/.test(active),successorRank=patch===null?Number.MAX_SAFE_INTEGER:patch;";
if(src.includes(oldDecl)) src=src.replace(oldDecl,newDecl);
else if(!src.includes('successorRank=patch===null?Number.MAX_SAFE_INTEGER:patch')) throw new Error('v0.15.117 successor declaration contract drifted');

const replacements=[
  ["Number(m[1])>=122",'successorRank>=122'],
  ["Number(m[1])>=120",'successorRank>=120']
];
for(const [from,to] of replacements){
  if(src.includes(from)) src=src.split(from).join(to);
  else if(!src.includes(to)) throw new Error(`v0.15.117 successor threshold contract drifted: ${from}`);
}

// v0.16+ may wrap the historical preload instead of mapping preload.js directly to v0.15.117.
// Keep the historical base audit immutable and teach only this compatibility shim to verify the
// effective successor chain: current preload wrapper -> frozen v0.15.117 preload base.
const preloadLine="      'preload.js':'update/v0.15.117/preload.js',\n";
const lastPreloadLine=src.lastIndexOf(preloadLine);
if(lastPreloadLine<0)throw new Error('v0.15.117 successor preload expectation contract drifted');
src=src.slice(0,lastPreloadLine)+src.slice(lastPreloadLine+preloadLine.length);

const successorLoop="    for(const [p,s] of Object.entries(preserved))if(map.get(p)!==s)throw new Error(`v0.15.117 state baseline not preserved by successor ${p}: ${map.get(p)||'missing'}`);\n";
const successorPreloadCheck=[
  "    const successorPreloadSource=map.get('preload.js');",
  "    if(successorPreloadSource!=='update/v0.15.117/preload.js'){",
  "      const frozenBaseTarget='preload-base-v015117.js';",
  "      const frozenBaseSource=map.get(frozenBaseTarget);",
  "      if(frozenBaseSource!=='update/v0.15.117/preload.js')throw new Error(`v0.15.117 state baseline preload base missing: ${frozenBaseSource||'missing'}`);",
  "      if(!successorPreloadSource||!exists(successorPreloadSource))throw new Error(`v0.15.117 successor preload source missing: ${successorPreloadSource||'missing'}`);",
  "      const successorPreloadText=read(successorPreloadSource);",
  "      if(!successorPreloadText.includes(frozenBaseTarget)||!successorPreloadText.includes('patchPreloadSource'))throw new Error(`v0.15.117 successor preload does not inherit frozen state bridge: ${successorPreloadSource}`);",
  "    }",
  "    ok('successor-preserves-v117-preload-lineage');"
].join('\n')+'\n';
if(src.includes(successorLoop))src=src.replace(successorLoop,successorLoop+successorPreloadCheck);
else if(!src.includes("ok('successor-preserves-v117-preload-lineage')"))throw new Error('v0.15.117 successor preserved-loop contract drifted');

fs.writeFileSync(tempPath,src,'utf8');
try{
  const r=cp.spawnSync(process.execPath,[tempPath],{cwd:ROOT,stdio:'inherit',env:process.env});
  if(r.error)throw r.error;
  if(r.status!==0)process.exit(r.status||1);
}finally{
  fs.rmSync(tempPath,{force:true});
}
