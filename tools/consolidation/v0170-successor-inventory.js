'use strict';
const fs=require('fs');
const path=require('path');

const ROOT=path.resolve(__dirname,'../..');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'update','manifest.json'),'utf8'));
const pkgEntry=(manifest.files||[]).find(x=>x.path==='package.json');
if(!pkgEntry)throw new Error('package.json manifest entry missing');
const pkg=JSON.parse(fs.readFileSync(path.join(ROOT,...String(pkgEntry.source).split('/')),'utf8'));

const sourceByTarget=new Map((manifest.files||[]).map(x=>[String(x.path),String(x.source||'')]));
function resolveTarget(target){
  const source=sourceByTarget.get(target);
  if(!source)throw new Error(`manifest target not found: ${target}`);
  const abs=path.join(ROOT,...source.split('/'));
  if(!fs.existsSync(abs))throw new Error(`manifest source missing: ${source}`);
  return{target,source,abs};
}
function strCount(text,re){return (String(text).match(re)||[]).length}
function inspectFile(target){
  const row=resolveTarget(target);
  const text=fs.readFileSync(row.abs,'utf8');
  const base=(text.match(/basePath\s*=\s*path\.join\(__dirname,\s*['"]([^'"]+)['"]\)/)||[])[1]||null;
  const requires=[...text.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(x=>x[1]);
  const installs=[...text.matchAll(/require\(['"]([^'"]+)['"]\)\.install\s*\(/g)].map(x=>x[1]);
  const directInstall=[...text.matchAll(/([A-Za-z_$][\w$]*)\.install\s*\(/g)].map(x=>x[1]);
  return{
    target:row.target,
    source:row.source,
    bytes:Buffer.byteLength(text),
    baseTarget:base,
    moduleCompileCount:strCount(text,/module\._compile\s*\(/g),
    replaceCount:strCount(text,/\.replace(All)?\s*\(/g),
    fsReadCount:strCount(text,/fs\.readFileSync\s*\(/g),
    fsWriteCount:strCount(text,/fs\.(writeFileSync|copyFileSync|renameSync|unlinkSync)\s*\(/g),
    electronHooks:strCount(text,/app\.on\s*\(|browser-window-created|webContents\.on\s*\(/g),
    envRefs:[...new Set([...text.matchAll(/process\.env\.([A-Z0-9_]+)/g)].map(x=>x[1]))],
    requires:[...new Set(requires)],
    explicitRequireInstalls:[...new Set(installs)],
    directInstallSymbols:[...new Set(directInstall)],
    hasBootGuard:/installBootGuard/.test(text),
    hasBlackboxInstall:/blackbox\.install/.test(text),
    hasHeartbeatInstall:/heartbeat|hang-heartbeat/i.test(text),
    hasIndexMutation:/index\.html|patchInstalledIndex/.test(text),
    hasVersionReplace:/replace(All)?\([^\n]*0\.\d+/.test(text)
  };
}

const chain=[];
const seen=new Set();
let target=String(pkg.main||'');
while(target){
  if(seen.has(target))throw new Error(`successor cycle: ${target}`);
  seen.add(target);
  const row=inspectFile(target);
  chain.push(row);
  target=row.baseTarget;
  if(target&&!sourceByTarget.has(target))break;
}

const totals={
  depth:chain.length,
  moduleCompileCount:chain.reduce((n,x)=>n+x.moduleCompileCount,0),
  replaceCount:chain.reduce((n,x)=>n+x.replaceCount,0),
  fsWriteCount:chain.reduce((n,x)=>n+x.fsWriteCount,0),
  electronHooks:chain.reduce((n,x)=>n+x.electronHooks,0),
  sideEffectLayers:chain.filter(x=>x.explicitRequireInstalls.length||x.directInstallSymbols.length||x.fsWriteCount||x.electronHooks||x.hasBootGuard||x.hasBlackboxInstall).map(x=>x.target)
};
const report={
  status:'SUCCESS',
  stage:'V0170_SUCCESSOR_INVENTORY',
  activeVersion:String(manifest.version),
  packageMain:String(pkg.main),
  chain,
  totals,
  consolidationRules:{
    runtimeSuccessorWrappersAllowedAfterV0170:0,
    runtimeModuleCompileRewritesAllowedAfterV0170:0,
    runtimeVersionStringPatchingAllowedAfterV0170:0,
    releaseSnapshotsMayCopyCanonicalSources:true,
    legacyCompatibilityMustHaveSingleExplicitBoundary:true
  }
};
const outDir=path.join(ROOT,'audit-output','consolidation');
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'v0170-successor-inventory.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
