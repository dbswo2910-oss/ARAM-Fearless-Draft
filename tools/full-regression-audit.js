'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');

const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const result={
  generatedAt:new Date().toISOString(),
  pass:[],warn:[],fail:[],info:{},
  scope:{repositoryRuntime:true,installedBaseUI:false,windowsRiotE2E:false}
};
const pass=(name,detail='')=>result.pass.push({name,detail});
const warn=(name,detail='')=>result.warn.push({name,detail});
const fail=(name,detail='')=>result.fail.push({name,detail});
const assert=(ok,name,detail='')=>ok?pass(name,detail):fail(name,detail);

function nodeCheck(rel){
  try{cp.execFileSync(process.execPath,['--check',path.join(ROOT,rel)],{stdio:'pipe'});return true}catch(e){fail('JS syntax',`${rel}: ${String(e.stderr||e.message).slice(0,500)}`);return false}
}
function walk(dir,out=[]){
  const abs=path.join(ROOT,dir);if(!fs.existsSync(abs))return out;
  for(const n of fs.readdirSync(abs)){const rel=path.join(dir,n).replace(/\\/g,'/'),a=path.join(ROOT,rel),st=fs.statSync(a);st.isDirectory()?walk(rel,out):out.push(rel)}return out;
}
function matchAll(re,s){return [...s.matchAll(re)].map(m=>m[1])}

let manifest;
try{manifest=JSON.parse(read('update/manifest.json'));pass('Manifest JSON parse')}catch(e){fail('Manifest JSON parse',e.message);finish()}
result.info.manifestVersion=manifest.version;
const files=Array.isArray(manifest.files)?manifest.files:[];
const deletes=Array.isArray(manifest.delete)?manifest.delete:[];
assert(files.length>0,'Manifest has files',String(files.length));

const targetMap=new Map(),sourceMap=new Map();
for(const f of files){
  if(targetMap.has(f.path))fail('Manifest duplicate target',f.path); else targetMap.set(f.path,f.source);
  if(sourceMap.has(f.source))warn('Manifest duplicate source',`${f.source} -> ${sourceMap.get(f.source)}, ${f.path}`); else sourceMap.set(f.source,f.path);
  assert(typeof f.path==='string'&&typeof f.source==='string','Manifest entry shape',JSON.stringify(f));
  assert(exists(f.source),'Manifest source exists',f.source);
  assert(!deletes.includes(f.path),'Delete list does not remove active target',f.path);
}
assert(new Set(deletes).size===deletes.length,'Delete list has no duplicates',deletes.join(', '));

// Current app metadata consistency. The package.json `main` field is the actual Electron entry.
// Since v0.15.71 it may be a narrow wrapper over a previously validated main.js runtime base.
const pkgEntry=files.find(x=>x.path==='package.json');
const mainEntry=files.find(x=>x.path==='main.js');
const preloadEntry=files.find(x=>x.path==='preload.js');
assert(!!pkgEntry,'Manifest includes package.json');
assert(!!mainEntry,'Manifest includes main.js');
assert(!!preloadEntry,'Manifest includes preload.js');
let pkg={};
if(pkgEntry&&exists(pkgEntry.source)){
  try{pkg=JSON.parse(read(pkgEntry.source));pass('Current package JSON parse')}catch(e){fail('Current package JSON parse',e.message)}
  assert(String(pkg.version)===String(manifest.version),'Package version matches manifest',`${pkg.version} vs ${manifest.version}`);
}
const packageMainTarget=String(pkg.main||'main.js');
const packageMainSource=targetMap.get(packageMainTarget)||'';
result.info.packageMainTarget=packageMainTarget;result.info.packageMainSource=packageMainSource;
assert(!!packageMainSource&&exists(packageMainSource),'Package main entry is delivered by manifest',`${packageMainTarget} -> ${packageMainSource||'missing'}`);
let packageMain='';
if(packageMainSource&&exists(packageMainSource)){
  packageMain=read(packageMainSource);nodeCheck(packageMainSource);
  if(packageMainTarget==='main.js'){
    const vm=packageMain.match(/const\s+VERSION\s*=\s*['"]([^'"]+)['"]/);
    assert(vm&&vm[1]===manifest.version,'Main VERSION matches manifest',vm?vm[1]:'missing');
  }else{
    assert(packageMain.includes(String(manifest.version)),'Package entry declares current manifest version',manifest.version);
    assert(/module\._compile\(|require\(['"]\.\/main/.test(packageMain),'Package entry delegates to a versioned/base main runtime',packageMainTarget);
    pass('Package entry wrapper accepted',`${packageMainTarget} -> ${packageMainSource}`);
  }
}
let main='';
if(mainEntry&&exists(mainEntry.source)){
  main=read(mainEntry.source);nodeCheck(mainEntry.source);
  if(packageMainTarget!=='main.js')pass('Historical main runtime base retained',mainEntry.source);
}
if(preloadEntry&&exists(preloadEntry.source))nodeCheck(preloadEntry.source);

// Syntax-check every JS that participates in current update payload.
let currentJs=0;
for(const f of files.filter(x=>x.source.endsWith('.js'))){if(exists(f.source)){currentJs++;nodeCheck(f.source)}}
pass('Current manifest JS syntax sweep',`${currentJs} files checked`);

// Syntax/JSON sweep across historical update sources to catch accidental breakage in referenced legacy files.
let allJs=0,allJson=0;
for(const rel of walk('update')){
  if(rel.endsWith('.js')){allJs++;nodeCheck(rel)}
  else if(rel.endsWith('.json')){allJson++;try{JSON.parse(read(rel))}catch(e){fail('JSON parse',`${rel}: ${e.message}`)}}
}
pass('Repository update JS syntax sweep',`${allJs} JS files checked`);
pass('Repository update JSON parse sweep',`${allJson} JSON files checked`);

// Runtime injection chain integrity. A package entry wrapper may transform this validated base;
// version-specific audits cover the wrapper's exact injected additions.
if(main){
  const scriptBlock=main.match(/const\s+scripts\s*=\s*\[([\s\S]*?)\];/);
  const scripts=scriptBlock?matchAll(/['"]([^'"]+\.js)['"]/g,scriptBlock[1]):[];
  result.info.runtimeScripts=scripts;
  assert(scripts.length>0,'Runtime injection list detected',String(scripts.length));
  assert(new Set(scripts).size===scripts.length,'Runtime injection list has no duplicates',scripts.join(', '));
  for(const s of scripts){assert(targetMap.has(s),'Injected runtime file is delivered by manifest',s)}
  const obsolete=['live-strength-v01510.js','live-strength-v01511.js','live-strength-v01512.js','time-power-v01524.js','time-power-fix-v01526.js','item-catalog-v01526.js'];
  for(const o of obsolete)assert(!scripts.includes(o),'Obsolete runtime not injected',o);

  const markerExpr=(main.match(/executeJavaScript\('([^']*__ARAM_[^']*)',false\)/)||[])[1]||'';
  const requiredMarkers=matchAll(/window\.(__ARAM_[A-Z0-9_]+__)/g,markerExpr);
  result.info.requiredMarkers=requiredMarkers;
  assert(requiredMarkers.length>0,'Runtime marker guard detected',String(requiredMarkers.length));
  for(const s of scripts){
    const src=targetMap.get(s);if(!src||!exists(src))continue;
    const body=read(src),markers=matchAll(/window\.(__ARAM_[A-Z0-9_]+__)\s*=\s*true/g,body);
    assert(markers.length>0,'Runtime script exposes readiness marker',`${s}: ${markers.join(',')||'none'}`);
    if(markers.length)assert(markers.some(m=>requiredMarkers.includes(m)),'Runtime marker included in main guard',`${s}: ${markers.join(',')}`);
  }

  // IPC bridge contract. Some handlers are registered by current main-process modules (e.g. itemCatalog.register).
  // Successor package wrappers can inherit those requires through a delivered versioned main wrapper,
  // so include directly referenced delivered JS wrappers in the static wiring view.
  const preload=preloadEntry&&exists(preloadEntry.source)?read(preloadEntry.source):'';
  const invokes=matchAll(/ipcRenderer\.invoke\(['"]([^'"]+)['"]/g,preload);
  const defs=[];
  for(const f of files.filter(x=>x.source.endsWith('.js')&&exists(x.source))){
    const body=read(f.source);
    for(const ch of matchAll(/ipcMain\.handle\(['"]([^'"]+)['"]/g,body))defs.push({channel:ch,source:f.source,target:f.path});
  }
  const byChannel=new Map();
  for(const d of defs){const a=byChannel.get(d.channel)||[];a.push(d);byChannel.set(d.channel,a)}
  const duplicateChannels=[...byChannel.entries()].filter(([,xs])=>new Set(xs.map(x=>x.source)).size>1).map(([ch])=>ch);
  result.info.preloadInvokes=invokes;result.info.ipcDefinitions=defs;
  assert(!duplicateChannels.length,'Current IPC channel definitions have no cross-module duplicates',duplicateChannels.join(', '));
  const wiringTexts=[main,packageMain];
  for(const target of matchAll(/['"]([^'"]+\.js)['"]/g,packageMain)){
    const source=targetMap.get(target);if(source&&exists(source))wiringTexts.push(read(source));
  }
  const wiringText=wiringTexts.join('\n');
  for(const ch of invokes){
    const matches=defs.filter(x=>x.channel===ch);
    assert(matches.length>0,'Preload IPC has matching current handler',ch);
    if(matches.length&&matches.every(x=>x.source!==mainEntry.source)){
      const moduleTargets=matches.map(x=>x.target.replace(/\.js$/,''));
      const wired=moduleTargets.some(t=>wiringText.includes(`require('./${t}')`)||wiringText.includes(`require("./${t}")`));
      assert(wired,'Modular IPC handler module is required by current main',`${ch}: ${matches.map(x=>x.target).join(', ')}`);
    }
  }
}

// Product invariants that must never regress.
const queueSources=files.filter(x=>/queue|autosync-queue/.test(x.path)).map(x=>x.source).filter(exists);
const queueText=queueSources.map(read).join('\n');
assert(/450/.test(queueText),'Standard ARAM queue 450 invariant present');
assert(/2400/.test(queueText),'Mayhem queue 2400 invariant present');

const gradeSources=files.filter(x=>/riot-grade/.test(x.path)).map(x=>x.source).filter(exists);
const gradeText=gradeSources.map(read).join('\n');
assert(/scoringUse\s*:\s*false|scoring_use\s*:\s*false/.test(gradeText),'Riot Grade scoring isolation flag present');
assert(!/roleScore\s*\+=|score\s*\+=\s*.*grade|grade.*\+.*roleScore/i.test(gradeText),'No obvious Riot Grade direct score addition');

const missionEntry=files.find(x=>x.path==='mission-death-fairness-v01529.js');
if(missionEntry&&exists(missionEntry.source)){
  const s=read(missionEntry.source);
  assert(/refund|환급|penalty/i.test(s),'Mission/death fairness remains refund-oriented');
}

// Static hygiene.
for(const f of files.filter(x=>x.source.endsWith('.js')&&exists(x.source))){
  const s=read(f.source);
  assert(!/<<<<<<<|=======|>>>>>>>/.test(s),'No merge-conflict markers',f.source);
  if(/\bNaN\b/.test(s))warn('Literal NaN usage found',f.source);
  if(/\bInfinity\b/.test(s))warn('Literal Infinity usage found',f.source);
}

// Installed base UI/core are prerequisites but not stored in this update repository.
const baseUiInRepo=exists('index.html')||walk('update').some(x=>/\/index\.html$/.test(x));
const baseCoreInRepo=exists('autosync-core.js')||walk('update').some(x=>/\/autosync-core\.js$/.test(x));
result.info.baseUiInRepo=baseUiInRepo;result.info.baseCoreInRepo=baseCoreInRepo;
if(!baseUiInRepo)warn('Installed base UI cannot be fully menu-click tested from repository','index.html is not present in repository update sources');
if(!baseCoreInRepo)warn('Installed autosync-core cannot be fully source-audited from repository','autosync-core.js is required by main but not present in repository update sources');

finish();
function finish(){
  result.summary={pass:result.pass.length,warn:result.warn.length,fail:result.fail.length,status:result.fail.length?'FAIL':'PASS_WITH_LIMITATIONS'};
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output','full-regression-report.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result.summary));
  for(const x of result.fail)console.error('FAIL',x.name,x.detail||'');
  for(const x of result.warn)console.warn('WARN',x.name,x.detail||'');
  process.exitCode=result.fail.length?1:0;
}
