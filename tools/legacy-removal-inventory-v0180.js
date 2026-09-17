'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const manifest=JSON.parse(read('update/manifest.json'));
const rows=[];
const versioned=/\b(?:main|runtime|autosync|random|item|ui|profile|data|draft|riot|state|resource|patch|preload|history|startup|cold-start|freeze|hang|external|successor)[A-Za-z0-9_-]*-v0?1?5?\d{2,6}\b/gi;
const requireRe=/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const patchSignals=['patchRuntimeSource','patchIndexText','.patch(','executeJavaScript(','module._compile(','replaceAll('];
for(const f of manifest.files||[]){
  if(!/\.js$/i.test(String(f.path||''))||!f.source||!exists(f.source))continue;
  const src=read(f.source);
  const requires=[]; let m;
  while((m=requireRe.exec(src)))requires.push(m[1]);
  const versionedRefs=[...new Set(src.match(versioned)||[])].sort();
  const signals={};
  for(const s of patchSignals)signals[s]=(src.split(s).length-1);
  const versionedPath=/-v0?1?5?\d{2,6}(?:\.js)?$/i.test(String(f.path||''));
  const sourceVersioned=/update\/v0\.15\.|update\/v0\.16\.|update\/v0\.17\.0\/legacy-runtime-v0170\.js/.test(String(f.source||''));
  const activeRisk=(versionedPath?2:0)+(sourceVersioned?2:0)+versionedRefs.length+
    signals['patchRuntimeSource']*3+signals['.patch(']*2+signals['executeJavaScript(']*2+signals['module._compile(']*5+signals['replaceAll('];
  rows.push({path:f.path,source:f.source,versionedPath,sourceVersioned,requires,versionedRefs,signals,activeRisk});
}
rows.sort((a,b)=>b.activeRisk-a.activeRisk||a.path.localeCompare(b.path));
const legacyRuntime=rows.find(x=>x.path==='legacy-runtime-v0170.js')||null;
const summary={
  manifestVersion:String(manifest.version||''),
  cleanRuntimeConsolidated:manifest.clean_runtime_consolidated===true,
  activeJsFiles:rows.length,
  versionedOutputFiles:rows.filter(x=>x.versionedPath).length,
  legacySourcedFiles:rows.filter(x=>x.sourceVersioned).length,
  filesUsingPatchRuntimeSource:rows.filter(x=>x.signals.patchRuntimeSource>0).length,
  filesUsingPatchMethod:rows.filter(x=>x.signals['.patch(']>0).length,
  filesUsingExecuteJavaScript:rows.filter(x=>x.signals['executeJavaScript(']>0).length,
  filesUsingModuleCompile:rows.filter(x=>x.signals['module._compile(']>0).length,
  filesUsingReplaceAll:rows.filter(x=>x.signals['replaceAll(']>0).length,
  legacyRuntimePresent:!!legacyRuntime,
  legacyRuntimeSource:legacyRuntime?.source||null
};
const ownerRegistryPath='update/v0.16.0/canonical/src/core/owner-registry.js';
let ownerRegistry=null;
if(exists(ownerRegistryPath)){
  delete require.cache[require.resolve(path.join(ROOT,ownerRegistryPath))];
  const reg=require(path.join(ROOT,ownerRegistryPath));
  ownerRegistry={policyVersion:reg.policy_version,productionActive:reg.production_active===true,legacyRemovalAuthorized:reg.legacy_removal_authorized===true,owners:reg.summary?.().rows||[]};
}
const report={schemaVersion:1,generatedAt:new Date().toISOString(),goal:'remove active legacy adapters without changing v0.17 behavior',summary,ownerRegistry,topRisk:rows.slice(0,40),all:rows};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/legacy-removal-inventory-v0180.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(summary));
if(manifest.clean_runtime_consolidated!==true)throw new Error('v0.18 inventory requires v0.17 clean consolidated baseline');
