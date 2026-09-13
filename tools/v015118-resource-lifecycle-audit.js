'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const count=(src,re)=>{const m=String(src).match(re);return m?m.length:0};
const must=(src,n,label)=>{if(!String(src).includes(n))throw new Error(`v0.15.118 audit missing ${label}: ${n}`)};
const mustNot=(src,n,label)=>{if(String(src).includes(n))throw new Error(`v0.15.118 audit forbidden ${label}: ${n}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.118 ${label} parse failed: ${e.message}`)}};
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};
const report={version:'0.15.118',score_logic_changed:false,random_scoring_changed:false,checks:[],inventory:[]};
const ok=name=>report.checks.push({name,status:'success'});

const dir='update/v0.15.118/';
const helperSrc=read(dir+'resource-lifecycle-v015118.js');
const runtimeSrc=read(dir+'runtime-source-stability-v015118.js');
const loaderSrc=read(dir+'runtime-loader-v01579.js');
const mainSrc=read(dir+'main-v015118.js');
const pkg=JSON.parse(read(dir+'package.json'));
for(const [name,src] of [['resource lifecycle',helperSrc],['runtime source',runtimeSrc],['runtime loader',loaderSrc],['main successor',mainSrc]])parse(src,name);
if(pkg.version!=='0.15.118'||pkg.main!=='main-v015118.js')throw new Error('v0.15.118 package metadata mismatch');
ok('syntax-package');

for(const [n,l] of [
  ['__ARAM_RESOURCE_LIFECYCLE_V015118__','resource readiness marker'],['function snapshot()','resource snapshot'],["function dispose(reason='manual')",'aggregate disposer'],['randomPractice','Random Practice owner'],['randomIngame','Random IN GAME owner'],['liveAutoSync','AutoSync owner'],['beforeunload','single unload cleanup'],['score_logic_changed:false','scoring neutrality']
])must(helperSrc,n,l);
for(const n of ['setInterval(','setTimeout(','MutationObserver','PerformanceObserver','querySelector(','appendChild(','insertAdjacentHTML(','requestAnimationFrame('])mustNot(helperSrc,n,'aggregate owner must not create recurring/UI work');
if(count(helperSrc,/addEventListener\s*\(/g)!==1)throw new Error('resource lifecycle aggregate must own exactly one event listener');
ok('aggregate-owner-no-polling-ui');

let unload=null,rpDispose=0,riDispose=0,asDispose=0;
const fakeWindow={
  __ARAM_RANDOM_PRACTICE_RUNTIME_V01572__:true,__ARAM_RANDOM_INGAME_RUNTIME_V01570__:true,__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__:true,
  __ARAM_UI_STABILITY_BASELINE_V015115__:true,__ARAM_STATE_INTEGRITY_V015117__:true,
  aramRandomPracticeRuntimeV01572:{dispose:()=>{rpDispose++},getStats:()=>({ok:true})},
  aramRandomIngameRuntimeV01570:{dispose:()=>{riDispose++},getStats:()=>({ok:true})},
  aramLiveAutosyncRuntimeV01571:{dispose:()=>{asDispose++},getStats:()=>({ok:true})},
  addEventListener:(type,fn)=>{if(type==='beforeunload')unload=fn}
};
vm.runInNewContext(helperSrc,{window:fakeWindow,console,Object,String,Date,Array,Map,Set,Error},{filename:'resource-lifecycle-v015118.js'});
const snap=fakeWindow.aramResourceLifecycleV015118?.snapshot?.();
if(!snap||!snap.randomPractice?.disposable||!snap.randomIngame?.disposable||!snap.liveAutoSync?.disposable)throw new Error('resource lifecycle snapshot simulation failed');
if(fakeWindow.aramResourceLifecycleV015118.dispose('audit')!==true)throw new Error('first aggregate dispose failed');
if(fakeWindow.aramResourceLifecycleV015118.dispose('audit-again')!==false)throw new Error('aggregate dispose is not idempotent');
if(rpDispose!==1||riDispose!==1||asDispose!==1)throw new Error('aggregate disposer did not call each runtime owner exactly once');
if(typeof unload!=='function')throw new Error('beforeunload cleanup hook missing');
ok('aggregate-dispose-simulation');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
if(map.size!==(manifest.files||[]).length)throw new Error('active manifest has duplicate output paths');
for(const f of manifest.files||[])if(!exists(f.source))throw new Error(`manifest source missing: ${f.path} -> ${f.source}`);
const runtime=require(path.join(ROOT,dir+'runtime-source-stability-v015118.js'));
const sourceFor=p=>{const s=map.get(p);if(!s||!exists(s))throw new Error(`active source missing for ${p}`);return read(s)};
const transformed={
  randomPractice:runtime.patchRuntimeSource('runtime-random-practice-v01572.js',sourceFor('runtime-random-practice-v01572.js')),
  randomIngame:runtime.patchRuntimeSource('runtime-random-ingame-v01570.js',sourceFor('runtime-random-ingame-v01570.js')),
  liveAutoSync:runtime.patchRuntimeSource('runtime-live-autosync-v01571.js',sourceFor('runtime-live-autosync-v01571.js')),
  input:runtime.patchRuntimeSource('input-interaction-stability-v01539.js',sourceFor('input-interaction-stability-v01539.js'))
};
for(const [name,src] of Object.entries(transformed))parse(src,`transformed ${name}`);

for(const [n,l] of [
  ['ARAM_RESOURCE_LIFECYCLE_PATCH_V015118_RANDOM_PRACTICE','Random Practice lifecycle patch'],['longTaskObserver','owned longtask observer'],["function dispose(reason='manual')",'Random Practice disposer'],['longTaskObserver?.disconnect','Random Practice observer disconnect'],['comboGeneration++','cooperative combo cancellation']
])must(transformed.randomPractice,n,l);
if(count(transformed.randomPractice,/setInterval\s*\(/g)!==0)throw new Error('Random Practice unexpectedly owns a recurring interval after v0.15.118');
ok('random-practice-lifecycle-bounded');

for(const [n,l] of [
  ['ARAM_RESOURCE_LIFECYCLE_PATCH_V015118_RANDOM_INGAME','Random IN GAME lifecycle patch'],['tickDueAt','coalesced one-shot tick'],['pendingTickForce','merged force intent'],['function scheduleHeartbeat','adaptive heartbeat'],["document.visibilityState==='hidden'?8000:3500",'inactive/hidden cadence'],['bodyObserver?.disconnect','observer suspension'],["function dispose(reason='manual')",'Random IN GAME disposer']
])must(transformed.randomIngame,n,l);
mustNot(transformed.randomIngame,'timer=upstreamSetInterval.call(window,()=>tick(false),1000)','permanent one-second in-game interval');
if(count(transformed.randomIngame,/upstreamSetInterval\.call\s*\(/g)!==0)throw new Error('Random IN GAME recurring owner interval remains active');
ok('random-ingame-adaptive-heartbeat-coalescing');

for(const [n,l] of [
  ['ARAM_RESOURCE_LIFECYCLE_PATCH_V015118_AUTOSYNC','AutoSync lifecycle patch'],['followupTimer','single follow-up timeout'],['if(!followupTimer)','follow-up coalescing'],["function dispose(reason='manual')",'AutoSync disposer'],['clearInterval(lolAutoSync.timer)','AutoSync poll cleanup']
])must(transformed.liveAutoSync,n,l);
if(count(transformed.liveAutoSync,/setInterval\s*\(/g)>1)throw new Error('renderer AutoSync owns more than one interval');
ok('autosync-followup-bounded');

if(count(transformed.input,/\/\* ARAM_UI_STABILITY_OWNER_PAYLOAD_V015115 \*\//g)!==1)throw new Error('v0.15.115 UI owner must remain exactly once');
if(count(transformed.input,/\/\* ARAM_STATE_INTEGRITY_PAYLOAD_V015117 \*\//g)!==1)throw new Error('v0.15.117 state owner must remain exactly once');
if(count(transformed.input,/\/\* ARAM_RESOURCE_LIFECYCLE_OWNER_V015118 \*\//g)!==1)throw new Error('v0.15.118 lifecycle owner must be injected exactly once');
must(transformed.input,'__ARAM_RESOURCE_LIFECYCLE_V015118__','final lifecycle readiness marker');
ok('single-owner-layering-preserved');

for(const f of manifest.files||[]){
  if(!/\.js$/i.test(f.path)||!exists(f.source))continue;
  const src=read(f.source);
  const row={path:f.path,source:f.source,setInterval:count(src,/setInterval\s*\(/g),setTimeout:count(src,/setTimeout\s*\(/g),listeners:count(src,/addEventListener\s*\(/g),mutationObservers:count(src,/new\s+MutationObserver\s*\(/g),performanceObservers:count(src,/new\s+PerformanceObserver\s*\(/g)};
  row.risk=row.setInterval*5+row.mutationObservers*4+row.performanceObservers*2+Math.min(row.listeners,10)+Math.min(row.setTimeout,10);
  report.inventory.push(row);
}
report.inventory.sort((a,b)=>b.risk-a.risk||a.path.localeCompare(b.path));
const pathological=report.inventory.filter(x=>x.setInterval>8||x.mutationObservers>5);
if(pathological.length)throw new Error('active runtime resource budget has pathological owners: '+pathological.map(x=>`${x.path}[i=${x.setInterval},mo=${x.mutationObservers}]`).join(', '));
ok('whole-manifest-resource-inventory');

for(const [n,l] of [
  ['resourceLifecycle:Boolean(window.__ARAM_RESOURCE_LIFECYCLE_V015118__)','lifecycle readiness'],['lifecycleDisposers:Boolean(','critical disposer readiness'],["code:'SAFE-RT118'",'v118 safety failure code'],['runtime-readiness-v015118.json','v118 readiness diagnostic'],['score_logic_changed:false','loader scoring neutrality']
])must(loaderSrc,n,l);
ok('runtime-readiness-lifecycle-gate');

must(runtimeSrc,"require('../v0.15.117/runtime-source-stability-v015117')",'v0.15.117 predecessor');
must(runtimeSrc,"resource_lifecycle_target:'input-interaction-stability-v01539.js'",'single lifecycle injection target');
must(runtimeSrc,"random_pick_owner:'runtime-v015100'",'Random UI owner preservation');
must(runtimeSrc,"data_view_owner:'ui-stability-v015115'",'Data UI owner preservation');
must(runtimeSrc,"state_integrity_owner:'state-integrity-v015117'",'state owner preservation');
ok('runtime-lineage-preservation');

must(mainSrc,"path.join(__dirname,'main-v015117.js')",'v0.15.117 main predecessor');
must(mainSrc,'runtime-source-stability-v015118','v0.15.118 runtime route');
must(mainSrc,"root:'main-v01579.js'",'permanent safety lineage root');
ok('main-successor-contract');

const deletes=new Set(manifest.delete||[]);for(const p of map.keys())if(deletes.has(p))throw new Error(`manifest installs and deletes ${p}`);
const active=String(manifest.version||'');
if(active==='0.15.118'){
  const expected={
    'resource-lifecycle-v015118.js':'update/v0.15.118/resource-lifecycle-v015118.js',
    'runtime-loader-v01579.js':'update/v0.15.118/runtime-loader-v01579.js',
    'runtime-source-stability-v015118.js':'update/v0.15.118/runtime-source-stability-v015118.js',
    'main-v015118.js':'update/v0.15.118/main-v015118.js',
    'package.json':'update/v0.15.118/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.118 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  for(const [p,s] of Object.entries({
    'ui-stability-baseline-v015115.js':'update/v0.15.115/ui-stability-baseline-v015115.js',
    'state-integrity-v015117.js':'update/v0.15.117/state-integrity-v015117.js',
    'state-integrity-renderer-v015117.js':'update/v0.15.117/state-integrity-renderer-v015117.js',
    'preload.js':'update/v0.15.117/preload.js',
    'riot-grade-collector-v01532.js':'update/v0.15.117/riot-grade-collector-v01532.js'
  }))if(map.get(p)!==s)throw new Error(`v0.15.118 successor failed to preserve ${p}`);
  ok('active-v118-manifest');
}else if(active==='0.15.117')ok('preactivation-v117-manifest');
else if(ge(active,'0.15.119')){
  const preserved={
    'resource-lifecycle-v015118.js':'update/v0.15.118/resource-lifecycle-v015118.js',
    'ui-stability-baseline-v015115.js':'update/v0.15.115/ui-stability-baseline-v015115.js',
    'state-integrity-v015117.js':'update/v0.15.117/state-integrity-v015117.js',
    'state-integrity-renderer-v015117.js':'update/v0.15.117/state-integrity-renderer-v015117.js',
    'preload.js':'update/v0.15.117/preload.js',
    'riot-grade-collector-v01532.js':'update/v0.15.117/riot-grade-collector-v01532.js'
  };
  for(const [p,s] of Object.entries(preserved))if(map.get(p)!==s)throw new Error(`newer successor failed to preserve v0.15.118 baseline dependency ${p}`);
  ok('successor-preserves-v118-baseline');
}else throw new Error(`unexpected active manifest version during v0.15.118 rollout: ${active}`);

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015118-resource-lifecycle-report.json'),JSON.stringify({...report,status:'success',activeManifestVersion:active,inventory:report.inventory.slice(0,40)},null,2)+'\n');
console.log('v0.15.118 RESOURCE LIFECYCLE AUDIT: SUCCESS');
