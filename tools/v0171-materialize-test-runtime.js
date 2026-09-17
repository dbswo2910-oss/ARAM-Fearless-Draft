'use strict';
const fs=require('fs');
const path=require('path');

const appDir=path.resolve(process.argv[2]||'');
if(!appDir||!fs.existsSync(appDir))throw new Error('usage: node tools/v0171-materialize-test-runtime.js <materialized-app-dir>');
const root=path.resolve('.');

function copy(rel){
  const src=path.join(root,rel);
  const dst=path.join(appDir,rel);
  if(!fs.existsSync(src))throw new Error(`source missing: ${rel}`);
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.copyFileSync(src,dst);
}

const overlay=[
  'src/preload/ipc-contract.js',
  'src/preload/universal-rating-auto-sync.js',
  'src/preload/universal-rating-history-hook.js',
  'src/rating/universal/runtime.js',
  'src/rating/universal/service.js'
];
for(const rel of overlay)copy(rel);

const hook=require(path.join(root,'src','preload','universal-rating-history-hook.js'));
const preloadPath=path.join(appDir,'preload.js');
if(!fs.existsSync(preloadPath))throw new Error('materialized app preload.js missing');
const before=fs.readFileSync(preloadPath,'utf8');
const patched=hook.patchPreloadSource(before);
fs.writeFileSync(preloadPath,patched.source,'utf8');

const after=fs.readFileSync(preloadPath,'utf8');
for(const marker of ['__ARAM_UNIVERSAL_RATING_HISTORY_HOOK_V3__','__ARAM_UNIVERSAL_RATING_AUTO_SYNC_V1__','getUniversalRatingAutoSyncState','onUniversalRatingAutoSync']){
  if(!after.includes(marker))throw new Error(`v0.17.1 test preload marker missing: ${marker}`);
}

const pkgPath=path.join(appDir,'package.json');
const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));
const main=String(pkg.main||'main.js');
if(!fs.existsSync(path.join(appDir,main)))throw new Error(`materialized app main missing: ${main}`);

const report={
  status:'SUCCESS',
  testBundle:'v0.17.1 Rating Auto Sync',
  baseRuntimeVersion:String(pkg.version||''),
  productionManifestChanged:false,
  productionUpdaterChanged:false,
  isolatedUserDataRequired:true,
  preloadPatched:patched.changed||patched.alreadyPatched,
  markers:{historyHook:'V3',autoSync:'V1'},
  overlay
};
fs.writeFileSync(path.join(appDir,'V0171_TEST_BUNDLE.json'),JSON.stringify(report,null,2),'utf8');
console.log('V0.17.1 TEST RUNTIME MATERIALIZATION: SUCCESS',JSON.stringify(report));
