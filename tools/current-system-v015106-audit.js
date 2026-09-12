'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const readBuf=p=>fs.readFileSync(path.join(ROOT,p));
const exists=p=>fs.existsSync(path.join(ROOT,p));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const safeRel=p=>{p=String(p||'').replace(/\\/g,'/').replace(/^\.\//,'');return !!p&&!p.startsWith('/')&&!p.includes('\0')&&!p.split('/').includes('..')&&!/^[A-Za-z]:/.test(p)};
const parts=v=>String(v||'0').split('.').map(x=>Number(x)||0);
const atLeast=(a,b)=>{const A=parts(a),B=parts(b),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return (A[i]||0)>(B[i]||0)}return true};
const checks=[],warnings=[];
function ok(name,pass,detail=''){checks.push({name,pass:!!pass,detail:String(detail||'')})}
function warn(name,detail=''){warnings.push({name,detail:String(detail||'')})}
function parse(src,label){try{new Function(src);ok(label+' parses',true)}catch(e){ok(label+' parses',false,e.message)}}

const manifest=JSON.parse(read('update/manifest.json'));
const files=Array.isArray(manifest.files)?manifest.files:[];
const deletes=Array.isArray(manifest.delete)?manifest.delete:[];
const byTarget=new Map(files.map(x=>[x.path,x]));
ok('manifest version at least v0.15.105',atLeast(manifest.version,'0.15.105'),manifest.version);
ok('manifest has files',files.length>0,files.length);
ok('manifest target paths unique',new Set(files.map(x=>x.path)).size===files.length);
ok('manifest source paths unique',new Set(files.map(x=>x.source)).size===files.length);
ok('delete list does not overlap delivered targets',!deletes.some(x=>byTarget.has(x)));
ok('all update targets are safe relative paths',files.every(x=>safeRel(x.path)));
ok('all update sources are safe update/ paths',files.every(x=>safeRel(x.source)&&String(x.source).startsWith('update/')));
ok('all manifest sources exist',files.every(x=>exists(x.source)),files.filter(x=>!exists(x.source)).map(x=>x.source).join(','));

let hashCount=0,hashMismatch=[];
for(const f of files){if(f.sha256){hashCount++;if(exists(f.source)&&sha(readBuf(f.source))!==String(f.sha256).toLowerCase())hashMismatch.push(f.path)}}
ok('manifest hashes that exist match source bytes',hashMismatch.length===0,hashMismatch.join(','));
if(hashCount!==files.length)warn('manifest SHA-256 coverage incomplete',`${hashCount}/${files.length}; updater supports hashes but unhashed files are not atomic against mutable main`);
else ok('manifest SHA-256 coverage complete',true,`${hashCount}/${files.length}`);

const pkgEntry=byTarget.get('package.json');
ok('active package target delivered',!!pkgEntry,pkgEntry?.source||'');
let pkg={};try{pkg=JSON.parse(read(pkgEntry.source));ok('active package parses',true)}catch(e){ok('active package parses',false,e.message)}
ok('active package version equals manifest',pkg.version===manifest.version,`${pkg.version||''} / ${manifest.version}`);
ok('active package main target delivered',!!pkg.main&&byTarget.has(pkg.main),pkg.main||'');
if(pkg.main&&byTarget.has(pkg.main))parse(read(byTarget.get(pkg.main).source),'active package main');

const baseMainEntry=byTarget.get('main.js');
ok('behavior-bearing main.js delivered',!!baseMainEntry,baseMainEntry?.source||'');
let baseMain='';if(baseMainEntry){baseMain=read(baseMainEntry.source);parse(baseMain,'behavior-bearing main.js')}
const scriptsMatch=baseMain.match(/const\s+scripts\s*=\s*\[([\s\S]*?)\];/);
const scripts=scriptsMatch?[...scriptsMatch[1].matchAll(/['\"]([^'\"]+\.js)['\"]/g)].map(x=>x[1]):[];
ok('renderer runtime stack discovered',scripts.length>=50,scripts.length);
ok('all renderer runtime targets delivered',scripts.every(x=>byTarget.has(x)),scripts.filter(x=>!byTarget.has(x)).join(','));

const activeDigits='v'+String(manifest.version||'').replace(/\D/g,'');
const stabilityTarget=`runtime-source-stability-${activeDigits}.js`;
const stabilityEntry=byTarget.get(stabilityTarget);
ok('active runtime stability target delivered',!!stabilityEntry,stabilityTarget);
let stability=null,transformedFailures=[],activationOwners=[];
try{if(stabilityEntry)stability=require(path.join(ROOT,stabilityEntry.source));ok('active runtime stability loads',!!stability)}catch(e){ok('active runtime stability loads',false,e.stack||e.message)}
if(stability&&typeof stability.patchRuntimeSource==='function'){
  for(const file of scripts){
    try{
      const entry=byTarget.get(file);if(!entry)continue;
      const out=stability.patchRuntimeSource(file,read(entry.source));
      new Function(out);
      if(out.includes('__ARAM_RANDOM_DATA_HOTFIX_V015105__'))activationOwners.push(file+':105');
      if(out.includes('__ARAM_RANDOM_DATA_HOTFIX_V015106__'))activationOwners.push(file+':106');
    }catch(e){transformedFailures.push({file,error:e.message})}
  }
}
ok('all active transformed renderer payloads parse',transformedFailures.length===0,JSON.stringify(transformedFailures));
ok('score/recommendation policy remains explicitly unchanged',stability?.score_logic_changed===false,String(stability?.score_logic_changed));
if(String(manifest.version)==='0.15.105'){
  ok('v0.15.105 visible UI patch reaches runtime',activationOwners.some(x=>x.endsWith(':105')),activationOwners.join(','));
  warn('v0.15.105 UI activation has a single owner',activationOwners.filter(x=>x.endsWith(':105')).join(',')||'none; v0.15.106 must be the next release before more feature work');
}
if(atLeast(manifest.version,'0.15.106'))ok('v0.15.106 visible UI has redundant runtime owners',new Set(activationOwners.filter(x=>x.endsWith(':106')).map(x=>x.split(':')[0])).size>=2,activationOwners.join(','));

// Safety/update lineage checks.
for(const t of ['main-v01579.js','update-safety-v01579.js','runtime-loader-v01579.js','runtime-safety-net-v01579.js','preload.js'])ok('safety target delivered: '+t,byTarget.has(t),byTarget.get(t)?.source||'');
if(byTarget.has('update-safety-v01579.js')){
  const s=read(byTarget.get('update-safety-v01579.js').source);
  ok('update safety snapshots touched files',s.includes('prepareUpdateTransaction')&&s.includes('snapshotDir'));
  ok('update safety can mark functional failures',s.includes('markSafetyFailure'));
  if(!s.includes('functional_failure_watch'))warn('active safety commits liveness, not feature readiness','renderer heartbeat can be healthy while a new UI patch failed; v0.15.106 draft adds a functional readiness watch');
}

// Historical startup chain that is intentionally bypassed after v0.15.103.
for(const p of ['update/v0.15.104/main-v015104.js','update/v0.15.105/main-v015105.js'])ok('required successor source exists: '+p,exists(p));
if(exists('update/v0.15.104/main-v015104.js')){
  const s=read('update/v0.15.104/main-v015104.js');
  ok('v0.15.104 bypasses broken v0.15.103 startup wrapper',s.includes("main-v015100.js")&&!s.includes("main-v015103.js"));
  ok('v0.15.104 keeps v0.15.79 safety lineage',s.includes("root:'main-v01579.js'"));
}

// Draft v0.15.106 must prove the known v0.15.105 failure mode is closed before activation.
for(const p of ['update/v0.15.106/random-data-ui-hotfix-v015106.js','update/v0.15.106/runtime-source-stability-v015106.js','update/v0.15.106/update-safety-v015106.js','update/v0.15.106/main-v015106.js','update/v0.15.106/package.json'])ok('v0.15.106 draft source exists: '+p,exists(p));
try{
  const rt106=require(path.join(ROOT,'update/v0.15.106/runtime-source-stability-v015106.js'));
  const owners=[];
  for(const f of ['brand-header-v01538.js','input-interaction-stability-v01539.js']){
    const entry=byTarget.get(f);if(!entry)throw new Error('active source missing '+f);
    const out=rt106.patchRuntimeSource(f,read(entry.source));new Function(out);if(out.includes('__ARAM_RANDOM_DATA_HOTFIX_V015106__'))owners.push(f);
  }
  ok('v0.15.106 draft has two independent UI activation routes',owners.length===2,owners.join(','));
  ok('v0.15.106 draft preserves scoring policy',rt106.score_logic_changed===false,String(rt106.score_logic_changed));
}catch(e){ok('v0.15.106 draft runtime transform',false,e.stack||e.message)}
if(exists('update/v0.15.106/main-v015106.js')){
  const s=read('update/v0.15.106/main-v015106.js');
  ok('v0.15.106 checks actual renderer readiness after injection',s.includes('__aramActivationGuardV015106')&&s.includes('randomDataHotfixStyleV015106')&&s.includes("attr==='0.15.106'"));
  ok('v0.15.106 marks safety failure if UI readiness fails',s.includes('SAFE-UI106')&&s.includes('markSafetyFailure'));
}
if(exists('update/v0.15.106/update-safety-v015106.js')){
  const s=read('update/v0.15.106/update-safety-v015106.js');
  ok('v0.15.106 watches same-boot functional failures',s.includes('bootStartedAt')&&s.includes('safety-failure.json')&&s.includes('restoreSnapshot'));
}

// Repo limitation: full installed UI/core are release-bundle assets, not repository files.
if(!exists('index.html'))warn('installed base index.html unavailable in repo','cannot prove final DOM geometry/selectors in GitHub-only CI');
if(!exists('autosync-core.js'))warn('installed autosync-core.js unavailable in repo','cannot execute end-to-end Riot/LCU engine in GitHub-only CI');

const fail=checks.filter(x=>!x.pass);
const status=fail.length?'FAIL':warnings.length?'PASS_WITH_LIMITATIONS':'PASS';
const report={version:'0.15.106-system-audit',generated_at:new Date().toISOString(),activeVersion:manifest.version,status,pass:checks.length-fail.length,fail:fail.length,warn:warnings.length,checks,warnings,info:{runtimeScripts:scripts.length,activationOwners,scope:'manifest/package/update chain, transformed renderer runtime stack, safety baseline, v0.15.103 startup bypass, v0.15.106 preactivation readiness; installed base DOM/LCU E2E remains external'}};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/current-system-v015106-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({status,pass:report.pass,fail:report.fail,warn:report.warn,activeVersion:manifest.version}));
for(const x of fail)console.error('FAIL',x.name,x.detail||'');
for(const x of warnings)console.warn('WARN',x.name,x.detail||'');
if(fail.length)process.exit(1);
