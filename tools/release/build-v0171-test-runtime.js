'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..');
const hook=require(path.join(ROOT,'src','preload','universal-rating-history-hook.js'));
function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null}
const appDir=path.resolve(arg('--app')||'');
if(!appDir||!fs.existsSync(appDir))throw new Error('usage: node tools/release/build-v0171-test-runtime.js --app <materialized-app-dir>');
const copy=(rel)=>{const src=path.join(ROOT,rel),dst=path.join(appDir,rel);if(!fs.existsSync(src))throw new Error(`missing source ${rel}`);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst)};
for(const rel of [
  'src/preload/universal-rating-auto-sync.js',
  'src/preload/universal-rating-history-hook.js',
  'src/preload/ipc-contract.js',
  'src/rating/universal/runtime.js',
  'src/rating/universal/service.js'
])copy(rel);
const preloadPath=path.join(appDir,'preload.js');
const preloadBefore=fs.readFileSync(preloadPath,'utf8');
const patched=hook.patchPreloadSource(preloadBefore);
if(!patched.source.includes('__ARAM_UNIVERSAL_RATING_HISTORY_HOOK_V3__'))throw new Error('history hook marker missing after patch');
if(!patched.source.includes('__ARAM_UNIVERSAL_RATING_AUTO_SYNC_V1__'))throw new Error('auto-sync marker missing after patch');
if(!patched.source.includes('getUniversalRatingAutoSyncState:'))throw new Error('auto-sync state bridge missing after patch');
fs.writeFileSync(preloadPath,patched.source,'utf8');
const mainPath=path.join(appDir,'main.js');
let main=fs.readFileSync(mainPath,'utf8');
if(!main.includes("const VERSION='0.17.0';")&&!main.includes("const VERSION='0.17.1';"))throw new Error('unexpected main VERSION contract');
main=main.replace("const VERSION='0.17.0';","const VERSION='0.17.1';");
main=main.replace(/\[v0\.17\.0 storage-root\]/g,'[v0.17.1-test storage-root]');
fs.writeFileSync(mainPath,main,'utf8');
const pkgPath=path.join(appDir,'package.json');
const pkg=JSON.parse(fs.readFileSync(pkgPath,'utf8'));
pkg.version='0.17.1';
pkg.description='v0.17.1 TEST · Universal Rating automatic post-game sync';
pkg.aram_test_build={kind:'physical-acceptance',feature:'universal-rating-auto-sync',production_manifest_activated:false};
fs.writeFileSync(pkgPath,JSON.stringify(pkg,null,2)+'\n','utf8');
for(const rel of ['main.js','preload.js','src/preload/universal-rating-auto-sync.js','src/preload/universal-rating-history-hook.js','src/rating/universal/runtime.js','src/rating/universal/service.js']){
  cp.execFileSync(process.execPath,['--check',path.join(appDir,rel)],{stdio:'inherit'});
}
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const marker={
  version:'0.17.1',
  test_build:true,
  feature:'Universal Rating automatic post-game sync',
  production_manifest_activated:false,
  source_branch:process.env.GITHUB_HEAD_REF||process.env.GITHUB_REF_NAME||'feature/v0171-rating-auto-sync',
  source_sha:process.env.GITHUB_SHA||null,
  preload_sha256:sha(preloadPath),
  main_sha256:sha(mainPath),
  physical_acceptance:[
    'Play one normal ARAM (queue 450).',
    'After game end wait for one Rating auto-sync.',
    'Verify the new match is stored exactly once.',
    'Verify no repeated request storm occurs.',
    'Verify reconnect/disconnect does not false-trigger.',
    'Verify Profile/History/AutoSync/RANDOM/DATA/IN GAME remain normal.'
  ]
};
fs.writeFileSync(path.join(appDir,'V0171_TEST_BUILD.json'),JSON.stringify(marker,null,2)+'\n','utf8');
console.log('V0.17.1 TEST RUNTIME: READY',JSON.stringify(marker));
