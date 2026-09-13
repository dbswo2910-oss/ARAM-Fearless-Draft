'use strict';
const fs=require('fs');
const path=require('path');
const os=require('os');
const vm=require('vm');
const {TextEncoder}=require('util');

const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,n,label)=>{if(!String(src).includes(n))throw new Error(`v0.15.117 audit missing ${label}: ${n}`)};
const mustNot=(src,n,label)=>{if(String(src).includes(n))throw new Error(`v0.15.117 audit forbidden ${label}: ${n}`)};
const count=(src,n)=>String(src).split(n).length-1;
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.117 ${label} parse failed: ${e.message}`)}};
const throws=(fn,label)=>{let yes=false;try{fn()}catch{yes=true}if(!yes)throw new Error(`v0.15.117 expected rejection: ${label}`)};
const report={version:'0.15.117',score_logic_changed:false,random_scoring_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

async function main(){
  const dir='update/v0.15.117/';
  const helperSrc=read(dir+'state-integrity-v015117.js');
  const rendererSrc=read(dir+'state-integrity-renderer-v015117.js');
  const preloadSrc=read(dir+'preload.js');
  const collectorSrc=read(dir+'riot-grade-collector-v01532.js');
  const loaderSrc=read(dir+'runtime-loader-v01579.js');
  const runtimeSrc=read(dir+'runtime-source-stability-v015117.js');
  const mainSrc=read(dir+'main-v015117.js');
  const pkg=JSON.parse(read(dir+'package.json'));
  for(const [name,src] of [['state helper',helperSrc],['renderer integrity',rendererSrc],['preload',preloadSrc],['collector wrapper',collectorSrc],['runtime loader',loaderSrc],['runtime source',runtimeSrc],['main successor',mainSrc]])parse(src,name);
  if(pkg.version!=='0.15.117'||pkg.main!=='main-v015117.js')throw new Error('v0.15.117 package metadata mismatch');
  ok('syntax-package');

  for(const [n,l] of [
    ['writeTextAtomic','atomic writer'],['fs.fsyncSync','durable fsync'],['MIRROR_RECOVERED','mirror recovery diagnostic'],['EXTERNAL_RECOVERED','external recovery diagnostic'],['quarantine','corrupt state quarantine'],['watchExternalJson','external LKG watcher'],['safeName','namespace path guard'],['score_logic_changed:false','scoring neutrality']
  ])must(helperSrc,n,l);
  mustNot(helperSrc,'eval(','unsafe evaluation');
  const helper=require(path.join(ROOT,dir+'state-integrity-v015117.js'));
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aram-v117-state-'));
  try{
    helper.writeNamespace('audit-state',{n:1,items:['a']},{root:tmp});
    helper.writeNamespace('audit-state',{n:2,items:['b']},{root:tmp});
    const primary=path.join(tmp,'mirrors','audit-state.json');
    fs.writeFileSync(primary,'{"broken":','utf8');
    const recovered=helper.readNamespace('audit-state',{root:tmp});
    if(!recovered.ok||!recovered.recovered||recovered.source!=='backup'||recovered.payload?.n!==1)throw new Error('namespace backup recovery simulation failed');
    throws(()=>helper.writeNamespace('../escape',{x:1},{root:tmp}),'namespace traversal');
    throws(()=>helper.writeNamespace('too-big',{x:'x'.repeat(2048)},{root:tmp,maxBytes:256}),'payload size cap');
    ok('atomic-mirror-recovery-simulation');

    const ext=path.join(tmp,'riot-grade-v01528.json');
    const validator=x=>!!x&&typeof x==='object'&&Array.isArray(x.records)&&x.records.length<=1000;
    fs.writeFileSync(ext,JSON.stringify({schema:2,records:[{grade:'A',gameId:'1'}]}),'utf8');
    const first=helper.guardExternalJson(ext,{root:tmp,name:'riot-grade-audit',validator});
    if(!first.ok||!first.captured)throw new Error('external LKG capture failed');
    fs.writeFileSync(ext,'{"schema":2,"records":','utf8');
    const repaired=helper.guardExternalJson(ext,{root:tmp,name:'riot-grade-audit',validator});
    if(!repaired.ok||!repaired.recovered)throw new Error('external corrupt-file recovery failed');
    const parsed=JSON.parse(fs.readFileSync(ext,'utf8'));
    if(parsed.records?.[0]?.grade!=='A')throw new Error('external recovered content mismatch');
    fs.rmSync(ext,{force:true});
    const missing=helper.guardExternalJson(ext,{root:tmp,name:'riot-grade-audit',validator});
    if(!missing.ok||!missing.recovered||!fs.existsSync(ext))throw new Error('external missing-file recovery failed');
    ok('external-lkg-recovery-simulation');
  }finally{fs.rmSync(tmp,{recursive:true,force:true})}

  for(const [n,l] of [
    ["PREFIX='aram_'",'app-owned localStorage scope'],['aram_match_lab_favorites_v1','favorites schema'],['aram_cc_queue_v1','calibration queue schema'],['aram_cc_sent_v1','calibration sent schema'],['blockedMalformedWrites','malformed write protection'],['recoveredMalformed','malformed recovery'],['recoveredMissing','missing state recovery'],['queueMicrotask','non-timer persistence coalescing'],['Object.defineProperty(proto,\'setItem\'','Storage setItem guard'],['Object.defineProperty(proto,\'removeItem\'','Storage remove guard'],['Object.defineProperty(proto,\'clear\'','Storage clear tombstones'],['score_logic_changed:false','renderer scoring neutrality']
  ])must(rendererSrc,n,l);
  for(const n of ['setInterval(','setTimeout(','requestAnimationFrame(','MutationObserver','querySelector(','appendChild(','insertAdjacent'])mustNot(rendererSrc,n,'UI/timer ownership');
  ok('renderer-no-ui-owner-contract');

  class MockStorage{
    constructor(){this.m=new Map()}
    get length(){return this.m.size}
    key(i){return [...this.m.keys()][i]??null}
    getItem(k){k=String(k);return this.m.has(k)?this.m.get(k):null}
    setItem(k,v){this.m.set(String(k),String(v))}
    removeItem(k){this.m.delete(String(k))}
    clear(){this.m.clear()}
  }
  const localStorage=new MockStorage();
  localStorage.setItem('aram_match_lab_favorites_v1','{"broken":');
  const goodFav=JSON.stringify([{riotId:'Audit#KR1',puuid:'p1'}]);
  const mirror={schema:1,version:'0.15.117',entries:{
    aram_match_lab_favorites_v1:{value:goodFav,deleted:false,updatedAt:1},
    aram_cc_install_v1:{value:'audit-install-id',deleted:false,updatedAt:1},
    aram_cc_queue_v1:{value:'[]',deleted:true,updatedAt:1}
  }};
  let written=null;const diagnostics=[];
  const window={Storage:MockStorage,localStorage,aramDesktop:{
    readStateMirror:()=>({ok:true,payload:mirror}),
    writeStateMirror:(_ns,payload)=>{written=JSON.parse(JSON.stringify(payload));return{ok:true}},
    traceStateIntegrity:(event,detail)=>{diagnostics.push({event,detail});return true}
  }};
  const ctx={window,localStorage,TextEncoder,queueMicrotask,console,Object,JSON,Date,Map,Set,String,Number,Array,Math,Error};
  vm.runInNewContext(rendererSrc,ctx,{filename:'state-integrity-renderer-v015117.js'});
  await Promise.resolve();await Promise.resolve();
  if(window.__ARAM_STATE_INTEGRITY_V015117__!==true)throw new Error('renderer integrity readiness marker missing');
  if(localStorage.getItem('aram_match_lab_favorites_v1')!==goodFav)throw new Error('renderer did not recover malformed favorites');
  if(localStorage.getItem('aram_cc_install_v1')!=='audit-install-id')throw new Error('renderer did not recover missing app state');
  const before=localStorage.getItem('aram_match_lab_favorites_v1');
  localStorage.setItem('aram_match_lab_favorites_v1','not-json');
  await Promise.resolve();
  if(localStorage.getItem('aram_match_lab_favorites_v1')!==before)throw new Error('renderer did not roll back malformed known-key write');
  const nextFav=JSON.stringify([{riotId:'Next#KR1',puuid:'p2'}]);
  localStorage.setItem('aram_match_lab_favorites_v1',nextFav);await Promise.resolve();await Promise.resolve();
  if(localStorage.getItem('aram_match_lab_favorites_v1')!==nextFav||written?.entries?.aram_match_lab_favorites_v1?.value!==nextFav)throw new Error('renderer valid write/mirror simulation failed');
  localStorage.removeItem('aram_match_lab_favorites_v1');await Promise.resolve();await Promise.resolve();
  if(written?.entries?.aram_match_lab_favorites_v1?.deleted!==true)throw new Error('renderer delete tombstone simulation failed');
  if(!diagnostics.some(x=>x.event==='RENDERER_STATE_RECOVERED'))throw new Error('renderer recovery diagnostic missing');
  ok('renderer-localstorage-recovery-simulation');

  for(const [n,l] of [
    ["require('./state-integrity-v015117')",'preload integrity helper'],['readStateMirror','bounded state read bridge'],['writeStateMirror','bounded state write bridge'],['traceStateIntegrity','state diagnostic bridge'],['boundedDetail','bounded diagnostic serialization']
  ])must(preloadSrc,n,l);
  ok('preload-bridge-contract');

  const collector=require(path.join(ROOT,dir+'riot-grade-collector-v01532.js'));
  if(typeof collector.validStore!=='function'||!collector.validStore({schema:2,records:[]}))throw new Error('collector state validator unavailable');
  if(collector.validStore({schema:2,records:'bad'}))throw new Error('collector accepted invalid record store');
  for(const [n,l] of [["guardExternalJson(file,guardOpts)",'collector pre-load recovery'],['watchExternalJson(file,guardOpts)','collector LKG watcher'],['originalStop','watcher cleanup'],["score_logic_changed:false",'collector scoring neutrality']])must(collectorSrc,n,l);
  ok('riot-grade-persistent-store-contract');

  for(const [n,l] of [
    ['stateIntegrity:Boolean(window.__ARAM_STATE_INTEGRITY_V015117__)','state runtime readiness'],['stateBridge:Boolean(window.aramDesktop?.readStateMirror','state bridge readiness'],["code:'SAFE-RT117'",'v117 safety failure code'],['runtime-readiness-v015117.json','v117 readiness diagnostic'],['score_logic_changed:false','loader scoring neutrality']
  ])must(loaderSrc,n,l);
  ok('runtime-readiness-state-gate');

  const runtime=require(path.join(ROOT,dir+'runtime-source-stability-v015117.js'));
  const manifest=JSON.parse(read('update/manifest.json'));
  const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
  if(map.size!==(manifest.files||[]).length)throw new Error('active manifest has duplicate output paths');
  for(const f of manifest.files||[])if(!exists(f.source))throw new Error(`manifest source missing: ${f.path} -> ${f.source}`);
  const inputSource=map.get('input-interaction-stability-v01539.js');
  if(!inputSource||!exists(inputSource))throw new Error('active input-interaction source missing');
  const inputOut=runtime.patchRuntimeSource('input-interaction-stability-v01539.js',read(inputSource));
  parse(inputOut,'final v117 input interaction payload');
  if(count(inputOut,'/* ARAM_UI_STABILITY_OWNER_PAYLOAD_V015115 */')!==1)throw new Error('v0.15.115 UI owner must remain exactly once');
  if(count(inputOut,'/* ARAM_STATE_INTEGRITY_PAYLOAD_V015117 */')!==1)throw new Error('v0.15.117 state owner must be injected exactly once');
  must(inputOut,'__ARAM_STATE_INTEGRITY_V015117__','final state integrity marker');
  const brandSource=map.get('brand-header-v01538.js');
  if(brandSource&&exists(brandSource))mustNot(runtime.patchRuntimeSource('brand-header-v01538.js',read(brandSource)),'ARAM_STATE_INTEGRITY_PAYLOAD_V015117','duplicate global injection');
  must(runtimeSrc,"require('../v0.15.116/runtime-source-stability-v015116')",'v0.15.116 predecessor');
  must(runtimeSrc,"state_integrity_target:'input-interaction-stability-v01539.js'",'single state injection target');
  must(runtimeSrc,"random_pick_owner:'runtime-v015100'",'Random UI owner preservation');
  must(runtimeSrc,"data_view_owner:'ui-stability-v015115'",'Data UI owner preservation');
  ok('runtime-single-injection-ui-preservation');

  must(mainSrc,"path.join(__dirname,'main-v015116.js')",'v0.15.116 main predecessor');
  must(mainSrc,"runtime-source-stability-v015117",'v0.15.117 runtime route');
  must(mainSrc,"root:'main-v01579.js'",'permanent safety lineage root');
  ok('main-successor-contract');

  const deletes=new Set(manifest.delete||[]);for(const p of map.keys())if(deletes.has(p))throw new Error(`manifest installs and deletes ${p}`);
  if(String(manifest.version)==='0.15.117'){
    const expected={
      'state-integrity-v015117.js':'update/v0.15.117/state-integrity-v015117.js',
      'state-integrity-renderer-v015117.js':'update/v0.15.117/state-integrity-renderer-v015117.js',
      'preload.js':'update/v0.15.117/preload.js',
      'riot-grade-collector-base-v01532.js':'update/v0.15.32/riot-grade-collector-v01532.js',
      'riot-grade-collector-v01532.js':'update/v0.15.117/riot-grade-collector-v01532.js',
      'runtime-loader-v01579.js':'update/v0.15.117/runtime-loader-v01579.js',
      'runtime-source-stability-v015117.js':'update/v0.15.117/runtime-source-stability-v015117.js',
      'main-v015117.js':'update/v0.15.117/main-v015117.js',
      'package.json':'update/v0.15.117/package.json'
    };
    for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.117 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
    if(map.get('ui-stability-baseline-v015115.js')!=='update/v0.15.115/ui-stability-baseline-v015115.js')throw new Error('v0.15.115 UI owner unexpectedly replaced');
    ok('active-v117-manifest');
  }else if(String(manifest.version)==='0.15.116')ok('preactivation-v116-manifest');
  else throw new Error(`unexpected active manifest version during v0.15.117 rollout: ${manifest.version}`);

  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output/v015117-state-integrity-report.json'),JSON.stringify({...report,status:'success',activeManifestVersion:manifest.version},null,2)+'\n');
  console.log('v0.15.117 PERSISTENT STATE INTEGRITY AUDIT: SUCCESS');
}
main().catch(e=>{console.error(e);process.exitCode=1});
