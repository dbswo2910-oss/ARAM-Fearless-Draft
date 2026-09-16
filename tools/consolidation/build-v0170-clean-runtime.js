'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');

const ROOT=path.resolve(__dirname,'../..');
const BASE_COMMIT='99e65c90d930d2bd2e0b9297518d0657b6c8e399';
const RELEASE='0.17.0';
const RELEASE_DIR=path.join(ROOT,'update','v0.17.0');
const BUILD_DIR=path.join(ROOT,'audit-output','consolidation','v0170-build');
const APP_DIR=path.join(BUILD_DIR,'v0163-installed-layout');
const CAPTURE=path.join(ROOT,'tools','consolidation','capture-effective-commonjs.js');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(p);
const write=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,b)};
const gitShow=(rel)=>cp.execFileSync('git',['show',`${BASE_COMMIT}:${rel}`],{cwd:ROOT,maxBuffer:128*1024*1024});
const gitShowJson=rel=>JSON.parse(gitShow(rel).toString('utf8').replace(/^\uFEFF/,''));

function materializeBaseline(){
  const manifest=gitShowJson('update/manifest.json');
  if(String(manifest.version)!=='0.16.3')throw new Error(`pinned consolidation baseline must be v0.16.3, got ${manifest.version}`);
  fs.rmSync(APP_DIR,{recursive:true,force:true});
  fs.mkdirSync(APP_DIR,{recursive:true});
  for(const row of manifest.files||[]){
    const target=String(row.path||'');
    const source=String(row.source||'');
    if(!target||!source)continue;
    write(path.join(APP_DIR,...target.split('/')),gitShow(source));
  }
  // index.html is part of the installed base, not the updater manifest. The capture
  // harness stubs the historical index mutators, so a deterministic placeholder is
  // sufficient to let the old safety layer traverse without touching real UI state.
  const indexPath=path.join(APP_DIR,'index.html');
  if(!fs.existsSync(indexPath))write(indexPath,'<!doctype html><html><body></body></html>\n');
  return manifest;
}

function packageFromManifest(manifest){
  const e=(manifest.files||[]).find(x=>x.path==='package.json');
  if(!e)throw new Error('baseline package manifest entry missing');
  return JSON.parse(gitShow(e.source).toString('utf8'));
}

function capture(entry,out){
  const r=cp.spawnSync(process.execPath,[CAPTURE,APP_DIR,entry,out],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024});
  if(r.status!==0)throw new Error(`capture failed for ${entry}:\n${r.stdout||''}\n${r.stderr||''}`);
  return{stdout:r.stdout,source:fs.readFileSync(out,'utf8')};
}

function normalizeLegacyCore(source){
  source=String(source);
  const versionRe=/const VERSION=['"]0\.16\.3['"];/;
  if(!versionRe.test(source))throw new Error('effective v0.16.3 main VERSION anchor missing');
  source=source.replace(versionRe,"const VERSION=String(require('./package.json').version);");
  if(/module\._compile\s*\(/.test(source))throw new Error('captured legacy core still contains runtime module._compile');
  return source;
}

function buildStaticRuntime(){
  const baseManifest=materializeBaseline();
  const basePkg=packageFromManifest(baseManifest);
  const mainCapturePath=path.join(BUILD_DIR,'effective-main-v0163.js');
  const preloadCapturePath=path.join(BUILD_DIR,'effective-preload-v0163.js');
  const mainCapture=capture(String(basePkg.main),mainCapturePath);
  const preloadCapture=capture('preload.js',preloadCapturePath);
  const legacyCore=normalizeLegacyCore(mainCapture.source);
  const preload=String(preloadCapture.source);
  if(/module\._compile\s*\(/.test(preload))throw new Error('captured preload still contains runtime module._compile');
  write(path.join(ROOT,'legacy-runtime-core.js'),legacyCore);
  write(path.join(ROOT,'src','app','preload.js'),preload);
  return{
    baseManifest,
    basePkg,
    mainCapture,
    preloadCapture,
    hashes:{
      baselineEffectiveMain:sha256(Buffer.from(mainCapture.source)),
      cleanLegacyCore:sha256(Buffer.from(legacyCore)),
      baselineEffectivePreload:sha256(Buffer.from(preload)),
      cleanPreload:sha256(Buffer.from(preload))
    }
  };
}

function copyReleasePayload(){
  fs.mkdirSync(RELEASE_DIR,{recursive:true});
  const pkg={name:'aram-fearless-draft',version:RELEASE,description:'v0.17.0 clean consolidated runtime',main:'src/app/main.js',engines:{electron:'>=28',node:'>=18'}};
  write(path.join(RELEASE_DIR,'package.json'),JSON.stringify(pkg,null,2)+'\n');
  const copies=[
    ['src/app/main.js','src/app/main.js'],
    ['src/app/legacy-safety-bootstrap.js','src/app/legacy-safety-bootstrap.js'],
    ['src/app/preload.js','preload.js'],
    ['legacy-runtime-core.js','legacy-runtime-core.js']
  ];
  for(const [from,to] of copies)write(path.join(RELEASE_DIR,...to.split('/')),read(path.join(ROOT,...from.split('/'))));
  return{pkg,copies};
}

function manifestEntry(target,source){
  const abs=path.join(ROOT,...source.split('/'));
  if(!fs.existsSync(abs))throw new Error(`release source missing: ${source}`);
  return{path:target,source,sha256:sha256(read(abs))};
}

function buildManifest(baseManifest){
  const out=JSON.parse(JSON.stringify(baseManifest));
  out.version=RELEASE;
  out.message='v0.17.0 · CLEAN CONSOLIDATION';
  out.production_rating_active=false;
  out.automatic_rating_promotion=false;
  out.universal_rating_shadow=true;
  out.universal_rating_shadow_diagnostics=true;
  out.universal_rating_shadow_transparency=true;
  out.clean_consolidation=true;
  out.runtime_successor_wrappers=0;
  const changes=[
    manifestEntry('package.json','update/v0.17.0/package.json'),
    manifestEntry('preload.js','update/v0.17.0/preload.js'),
    manifestEntry('src/app/main.js','update/v0.17.0/src/app/main.js'),
    manifestEntry('src/app/legacy-safety-bootstrap.js','update/v0.17.0/src/app/legacy-safety-bootstrap.js'),
    manifestEntry('legacy-runtime-core.js','update/v0.17.0/legacy-runtime-core.js')
  ];
  const by=new Map((out.files||[]).map((x,i)=>[String(x.path),i]));
  for(const e of changes){if(by.has(e.path))out.files[by.get(e.path)]=e;else{by.set(e.path,out.files.length);out.files.push(e)}}
  write(path.join(ROOT,'update','manifest.json'),JSON.stringify(out,null,2)+'\n');
  return{out,changes};
}

function main(){
  fs.mkdirSync(BUILD_DIR,{recursive:true});
  const built=buildStaticRuntime();
  const release=copyReleasePayload();
  const manifest=buildManifest(built.baseManifest);
  const report={
    status:'SUCCESS',stage:'V0170_CLEAN_RUNTIME_BUILD',release:RELEASE,baseRelease:'0.16.3',baseCommit:BASE_COMMIT,
    packageMain:release.pkg.main,
    runtimeSuccessorWrappers:0,
    runtimeModuleCompileRewrites:0,
    runtimeVersionStringPatching:0,
    explicitCompatibilityBoundary:'legacy-runtime-core.js',
    hashes:built.hashes,
    changedManifestTargets:manifest.changes.map(x=>x.path),
    preservedBaselineTargets:(built.baseManifest.files||[]).length,
    productionRatingActive:false,automaticRatingPromotion:false
  };
  write(path.join(ROOT,'audit-output','consolidation','v0170-clean-runtime-build.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
if(require.main===module)main();
module.exports={BASE_COMMIT,RELEASE,buildStaticRuntime,copyReleasePayload,buildManifest};
