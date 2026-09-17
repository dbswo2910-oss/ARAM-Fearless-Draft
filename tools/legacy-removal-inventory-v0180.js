'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const manifest=JSON.parse(read('update/manifest.json'));
const files=(manifest.files||[]).filter(f=>f&&f.path&&f.source);
const byOutput=new Map(files.map(f=>[String(f.path).replace(/\\/g,'/'),f]));
const byBase=new Map();
for(const f of files){const b=path.posix.basename(String(f.path).replace(/\\/g,'/'));if(!byBase.has(b))byBase.set(b,[]);byBase.get(b).push(f)}
const versioned=/\b(?:main|runtime|autosync|random|item|ui|profile|data|draft|riot|state|resource|patch|preload|history|startup|cold-start|freeze|hang|external|successor)[A-Za-z0-9_-]*-v0?1?5?\d{2,6}\b/gi;
const requireRe=/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const quotedJsRe=/['"]([^'"]+\.js)['"]/g;
const patchSignals=['patchRuntimeSource','patchIndexText','.patch(','executeJavaScript(','module._compile(','replaceAll('];
function normalizeTarget(fromOutput,ref){
  if(!ref||(!ref.startsWith('./')&&!ref.startsWith('../')))return null;
  let p=path.posix.normalize(path.posix.join(path.posix.dirname(fromOutput),ref));
  if(!path.posix.extname(p))p+='.js';
  if(byOutput.has(p))return p;
  const base=path.posix.basename(p);const hits=byBase.get(base)||[];return hits.length===1?hits[0].path:null;
}
function literalTarget(ref){
  const clean=String(ref||'').replace(/\\/g,'/').replace(/^\.\//,'');
  if(byOutput.has(clean))return clean;
  const base=path.posix.basename(clean);const hits=byBase.get(base)||[];return hits.length===1?hits[0].path:null;
}
const rows=[];
for(const f of files){
  if(!/\.js$/i.test(String(f.path))||!exists(f.source))continue;
  const src=read(f.source);
  const requires=[];let m;
  while((m=requireRe.exec(src)))requires.push(m[1]);
  const literals=[];while((m=quotedJsRe.exec(src)))literals.push(m[1]);
  const versionedRefs=[...new Set(src.match(versioned)||[])].sort();
  const signals={};for(const s of patchSignals)signals[s]=(src.split(s).length-1);
  const versionedPath=/-v0?1?5?\d{2,6}(?:\.js)?$/i.test(String(f.path));
  const sourceVersioned=/update\/v0\.15\.|update\/v0\.16\.|update\/v0\.17\.0\/legacy-runtime-v0170\.js/.test(String(f.source));
  const activeRisk=(versionedPath?2:0)+(sourceVersioned?2:0)+versionedRefs.length+signals.patchRuntimeSource*3+signals['.patch(']*2+signals['executeJavaScript(']*2+signals['module._compile(']*5+signals['replaceAll('];
  rows.push({path:f.path,source:f.source,versionedPath,sourceVersioned,requires,literals,versionedRefs,signals,activeRisk});
}
const rowByPath=new Map(rows.map(r=>[r.path,r]));
function walk(mode){
  const seen=new Map();const q=[];
  for(const entry of ['main.js','preload.js'])if(rowByPath.has(entry)){seen.set(entry,{from:null,via:'entry'});q.push(entry)}
  while(q.length){const cur=q.shift(),row=rowByPath.get(cur);if(!row)continue;
    const edges=[];
    for(const ref of row.requires){const to=normalizeTarget(cur,ref);if(to)edges.push({to,via:'require',ref})}
    if(mode==='require+literal')for(const ref of row.literals){const to=literalTarget(ref);if(to&&to!==cur)edges.push({to,via:'literal-js',ref})}
    for(const e of edges)if(rowByPath.has(e.to)&&!seen.has(e.to)){seen.set(e.to,{from:cur,via:e.via,ref:e.ref});q.push(e.to)}
  }
  return seen;
}
const required=walk('require');
const candidates=walk('require+literal');
for(const r of rows){r.reachableByRequire=required.has(r.path);r.reachableCandidate=candidates.has(r.path);r.reach=candidates.get(r.path)||null}
rows.sort((a,b)=>(Number(b.reachableCandidate)-Number(a.reachableCandidate))||(b.activeRisk-a.activeRisk)||a.path.localeCompare(b.path));
const legacyRuntime=rows.find(x=>x.path==='legacy-runtime-v0170.js')||null;
const requiredRows=rows.filter(x=>x.reachableByRequire),candidateRows=rows.filter(x=>x.reachableCandidate);
const summary={
  manifestVersion:String(manifest.version||''),cleanRuntimeConsolidated:manifest.clean_runtime_consolidated===true,
  deliveredJsFiles:rows.length,deliveredVersionedOutputFiles:rows.filter(x=>x.versionedPath).length,deliveredLegacySourcedFiles:rows.filter(x=>x.sourceVersioned).length,
  requireReachableFiles:requiredRows.length,executionCandidateFiles:candidateRows.length,
  executionCandidateVersionedOutputs:candidateRows.filter(x=>x.versionedPath).length,executionCandidateLegacySources:candidateRows.filter(x=>x.sourceVersioned).length,
  candidatePatchRuntimeSource:candidateRows.filter(x=>x.signals.patchRuntimeSource>0).length,candidatePatchMethod:candidateRows.filter(x=>x.signals['.patch(']>0).length,
  candidateExecuteJavaScript:candidateRows.filter(x=>x.signals['executeJavaScript(']>0).length,candidateModuleCompile:candidateRows.filter(x=>x.signals['module._compile(']>0).length,candidateReplaceAll:candidateRows.filter(x=>x.signals['replaceAll(']>0).length,
  legacyRuntimePresent:!!legacyRuntime,legacyRuntimeReachable:!!legacyRuntime?.reachableByRequire,legacyRuntimeSource:legacyRuntime?.source||null
};
const ownerRegistryPath='update/v0.16.0/canonical/src/core/owner-registry.js';let ownerRegistry=null;
if(exists(ownerRegistryPath)){delete require.cache[require.resolve(path.join(ROOT,ownerRegistryPath))];const reg=require(path.join(ROOT,ownerRegistryPath));ownerRegistry={policyVersion:reg.policy_version,productionActive:reg.production_active===true,legacyRemovalAuthorized:reg.legacy_removal_authorized===true,owners:reg.summary?.().rows||[]}}
const report={schemaVersion:2,generatedAt:new Date().toISOString(),goal:'remove active legacy adapters without changing v0.17 behavior',notes:['delivered counts include rollback/audit payloads','requireReachable is conservative direct CommonJS reachability','executionCandidate additionally follows quoted .js references used by runtime injection lists; metadata literals may create false positives and must be reviewed before deletion'],summary,ownerRegistry,executionCandidates:candidateRows,requireReachable:requiredRows,deliveredTopRisk:rows.slice(0,50)};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/legacy-removal-inventory-v0180.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(summary));
if(manifest.clean_runtime_consolidated!==true)throw new Error('v0.18 inventory requires v0.17 clean consolidated baseline');
