'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,n,label)=>{if(!String(src).includes(n))throw new Error(`v0.15.119 audit missing ${label}: ${n}`)};
const mustNot=(src,n,label)=>{if(String(src).includes(n))throw new Error(`v0.15.119 audit forbidden ${label}: ${n}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.119 ${label} parse failed: ${e.message}`)}};
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};
const waitTurn=()=>new Promise(r=>setImmediate(r));
const report={version:'0.15.119',score_logic_changed:false,random_scoring_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

(async()=>{
  const dir='update/v0.15.119/';
  const coreSrc=read(dir+'autosync-concurrency-v015119.js');
  const runtimeSrc=read(dir+'runtime-source-stability-v015119.js');
  const loaderSrc=read(dir+'runtime-loader-v01579.js');
  const mainSrc=read(dir+'main-v015119.js');
  const pkg=JSON.parse(read(dir+'package.json'));
  for(const [name,src] of [['AutoSync main-process concurrency',coreSrc],['runtime source',runtimeSrc],['runtime loader',loaderSrc],['main successor',mainSrc]])parse(src,name);
  if(pkg.version!=='0.15.119'||pkg.main!=='main-v015119.js')throw new Error('v0.15.119 package metadata mismatch');
  ok('syntax-package');

  for(const [n,l] of [
    ["if(s.inflight){s.overlapSkips++;s.pending=true;return s.inflight}",'single-flight core tick'],
    ['function singleFlight(core,key,fn)','endpoint request coalescing'],
    ["singleFlight(this,'credentials'",'credential single-flight'],
    ["singleFlight(this,'gameflow'",'gameflow single-flight'],
    ["key='live:'+p",'per-endpoint Live Client single-flight'],
    ['credentialEpoch','connection epoch'],
    ['staleEndpointRetries','old-epoch retry counter'],
    ['invalidateConnectionCaches(this)','credential-rotation cache invalidation'],
    ['BACKOFF=[0,2000,3500,6000,10000,15000]','bounded failure backoff'],
    ['if(s.running||this.timer)return','idempotent start'],
    ["mod.__ARAM_AUTOSYNC_CONCURRENCY_V015119__=true",'main-process readiness marker'],
    ['score_logic_changed:false','scoring neutrality']
  ])must(coreSrc,n,l);
  mustNot(coreSrc,'setInterval(()=>this.tick()','overlapping fixed-interval tick loop');
  ok('main-process-concurrency-contract');

  const baseline=require(path.join(ROOT,'update/v0.15.71/autosync-live-runtime-v01571.js'));
  const concurrency=require(path.join(ROOT,dir+'autosync-concurrency-v015119.js'));
  let baseTickCalls=0,liveCalls=0,resolveTick=null,resolveLive=null;
  class Core{
    constructor(){this.state={phase:'in_game',gameflowPhase:'InProgress'};this.creds={port:1,password:'a'};this.timer=null;this._tickImpl=()=>Promise.resolve({ok:true});this._liveImpl=()=>Promise.resolve({});this._refreshImpl=()=>Promise.resolve(true)}
    tick(...a){baseTickCalls++;return this._tickImpl(...a)}
    captureIdentityAndParty(){return Promise.resolve({party:[1]})}
    refreshCreds(...a){return this._refreshImpl(...a)}
    gameflowInfo(){return Promise.resolve({phase:'InProgress',queueId:450,gameId:1})}
    liveGet(pathname,...a){liveCalls++;return this._liveImpl(pathname,...a)}
    stop(){if(this.timer){clearInterval(this.timer);this.timer=null}}
  }
  const livePatch={patch:baseline.patch};
  concurrency.install(livePatch);
  const mod={LeagueAutoSyncCore:Core};livePatch.patch(mod);
  if(!mod.__ARAM_AUTOSYNC_LIVE_RUNTIME_V01571__||!mod.__ARAM_AUTOSYNC_CONCURRENCY_V015119__)throw new Error('v0.15.71 baseline or v0.15.119 main-process marker missing');
  const c=new Core();
  c._tickImpl=()=>new Promise(r=>{resolveTick=r});
  const p1=c.tick(),p2=c.tick();
  if(p1!==p2)throw new Error('overlapping core ticks did not share the same in-flight promise');
  await waitTurn();
  if(baseTickCalls!==1)throw new Error(`overlapping core tick executed base ${baseTickCalls} times`);
  resolveTick({ok:true});await Promise.all([p1,p2]);
  const tickStats=c.getConcurrencyStatsV015119();
  if(tickStats.overlapSkips!==1||tickStats.generation!==1||tickStats.acceptedGeneration!==1)throw new Error('core single-flight counters mismatch: '+JSON.stringify(tickStats));
  ok('core-tick-single-flight-simulation');

  c._liveImpl=()=>{liveCalls++;return new Promise(r=>{resolveLive=r})};
  const beforeLiveCalls=liveCalls;
  const lp1=c.liveGet('/playerlist'),lp2=c.liveGet('/playerlist');
  if(lp1!==lp2)throw new Error('duplicate Live Client endpoint calls were not coalesced');
  await waitTurn();
  if(liveCalls-beforeLiveCalls!==1)throw new Error('coalesced Live Client endpoint still issued duplicate network calls');
  resolveLive({same:true});await Promise.all([lp1,lp2]);
  ok('endpoint-single-flight-simulation');

  let firstResolve=null;liveCalls=0;
  c.creds={port:1,password:'a'};
  c._liveImpl=()=>{liveCalls++;if(liveCalls===1)return new Promise(r=>{firstResolve=r});return Promise.resolve({fresh:true})};
  c._refreshImpl=()=>{c.creds={port:2,password:'b'};return Promise.resolve(true)};
  const stalePromise=c.liveGet('/playerlist');await waitTurn();
  await c.refreshCreds();
  firstResolve({stale:true});
  const fresh=await stalePromise;
  const rotationStats=c.getConcurrencyStatsV015119();
  if(!fresh?.fresh||liveCalls!==2||rotationStats.credentialRotations<1||rotationStats.staleEndpointRetries<1)throw new Error('credential-epoch stale endpoint retry failed: '+JSON.stringify({fresh,liveCalls,rotationStats}));
  ok('credential-epoch-stale-retry-simulation');

  const manifest=JSON.parse(read('update/manifest.json'));
  const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
  if(map.size!==(manifest.files||[]).length)throw new Error('active manifest has duplicate output paths');
  for(const f of manifest.files||[])if(!exists(f.source))throw new Error(`manifest source missing: ${f.path} -> ${f.source}`);
  const runtime=require(path.join(ROOT,dir+'runtime-source-stability-v015119.js'));
  const rendererSource=map.get('runtime-live-autosync-v01571.js');
  if(!rendererSource||!exists(rendererSource))throw new Error('active renderer AutoSync source missing');
  const transformed=runtime.patchRuntimeSource('runtime-live-autosync-v01571.js',read(rendererSource));
  parse(transformed,'transformed renderer AutoSync');
  for(const [n,l] of [
    ['ARAM_RESOURCE_LIFECYCLE_PATCH_V015118_AUTOSYNC','v0.15.118 lifecycle predecessor'],
    ['ARAM_AUTOSYNC_CONCURRENCY_PATCH_V015119','v0.15.119 renderer concurrency patch'],
    ['pollSeq','poll request sequence'],['acceptedPollSeq','accepted poll sequence'],['lifecycleEpoch','renderer lifecycle epoch'],
    ['stalePollDrops','stale completion counter'],['seq<acceptedPollSeq','out-of-order drop guard'],['epoch!==lifecycleEpoch','post-dispose completion drop guard'],
    ['__ARAM_AUTOSYNC_CONCURRENCY_V015119__','renderer readiness marker'],['score_logic_changed:false','renderer scoring neutrality']
  ])must(transformed,n,l);
  ok('renderer-stale-completion-contract');

  let intervalDelay=0,fanout=0,resolvePoll=null;
  const state={phase:'in_game',isAram:true,gameId:7,inGameOur:[1,2,3,4,5],inGameEnemy:[6,7,8,9,10],clientConnected:true,bridgeConnected:true,account:{connected:true,riotId:'x#1'}};
  const context={window:null,console,performance:{now:()=>0},Date,JSON,Promise,setInterval:(fn,ms)=>{intervalDelay=ms;return 7},clearInterval:()=>{},setTimeout:(fn)=>{return 9},clearTimeout:()=>{},lolAutoSync:{timer:3,lastState:state,enabled:true},lolAutoSyncPoll(){return new Promise(r=>{resolvePoll=r})},aramTrackLinkedGame(){},lolAutoSyncRender(){},aramHistoryRenderAccount(){},aramHistoryState:{targetMode:'current'},aramRandomPracticeRuntimeV01572:{onAutoSyncState(){fanout++}}};context.window=context;
  vm.runInNewContext(transformed,context,{filename:'runtime-live-autosync-v01571.js'});
  if(intervalDelay!==1250||!context.__ARAM_AUTOSYNC_CONCURRENCY_V015119__)throw new Error('renderer concurrency runtime failed to initialize');
  const poll=context.lolAutoSyncPoll(false);await waitTurn();
  context.aramLiveAutosyncRuntimeV01571.dispose('audit');
  resolvePoll(state);await poll;
  const rendererStats=context.aramLiveAutosyncRuntimeV01571.getStats();
  if(fanout!==0||rendererStats.counters.stalePollDrops!==1)throw new Error('post-dispose renderer completion was not dropped: '+JSON.stringify({fanout,rendererStats}));
  ok('renderer-post-dispose-drop-simulation');

  for(const [n,l] of [
    ['autoSyncConcurrency:Boolean(window.__ARAM_AUTOSYNC_CONCURRENCY_V015119__)','renderer concurrency readiness'],
    ["code:'SAFE-RT119'",'v119 safety failure code'],['runtime-readiness-v015119.json','v119 readiness diagnostic'],
    ['resourceLifecycle:Boolean(window.__ARAM_RESOURCE_LIFECYCLE_V015118__)','v118 lifecycle preservation'],['score_logic_changed:false','loader scoring neutrality']
  ])must(loaderSrc,n,l);
  ok('runtime-readiness-concurrency-gate');

  must(mainSrc,"require('./autosync-concurrency-v015119').install(livePatch)",'pre-compile AutoSync patch wrapper');
  if(mainSrc.indexOf("install(livePatch)")>mainSrc.indexOf('module._compile(src,__filename)'))throw new Error('AutoSync concurrency wrapper installs too late');
  must(mainSrc,"path.join(__dirname,'main-v015118.js')",'v0.15.118 predecessor');
  must(mainSrc,'runtime-source-stability-v015119','v0.15.119 runtime route');
  must(mainSrc,"root:'main-v01579.js'",'permanent safety lineage');
  ok('main-successor-ordering');

  const v118Audit=read('tools/v015118-resource-lifecycle-audit.js');
  must(v118Audit,"ge(active,'0.15.119')",'v0.15.118 successor compatibility');
  ok('historical-v118-audit-forward-compatible');

  const deletes=new Set(manifest.delete||[]);for(const p of map.keys())if(deletes.has(p))throw new Error(`manifest installs and deletes ${p}`);
  const active=String(manifest.version||'');
  if(active==='0.15.119'){
    const expected={
      'autosync-concurrency-v015119.js':'update/v0.15.119/autosync-concurrency-v015119.js',
      'runtime-loader-v01579.js':'update/v0.15.119/runtime-loader-v01579.js',
      'runtime-source-stability-v015119.js':'update/v0.15.119/runtime-source-stability-v015119.js',
      'main-v015119.js':'update/v0.15.119/main-v015119.js',
      'package.json':'update/v0.15.119/package.json'
    };
    for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.119 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
    if(map.get('autosync-live-runtime-v01571.js')!=='update/v0.15.71/autosync-live-runtime-v01571.js')throw new Error('historical v0.15.71 main-process AutoSync baseline was replaced instead of wrapped');
    for(const [p,s] of Object.entries({
      'ui-stability-baseline-v015115.js':'update/v0.15.115/ui-stability-baseline-v015115.js',
      'state-integrity-v015117.js':'update/v0.15.117/state-integrity-v015117.js',
      'resource-lifecycle-v015118.js':'update/v0.15.118/resource-lifecycle-v015118.js'
    }))if(map.get(p)!==s)throw new Error(`v0.15.119 failed to preserve ${p}`);
    ok('active-v119-manifest');
  }else if(active==='0.15.118')ok('preactivation-v118-manifest');
  else if(ge(active,'0.15.119'))ok('newer-successor-manifest');
  else throw new Error(`unexpected active manifest version during v0.15.119 rollout: ${active}`);

  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output/v015119-autosync-concurrency-report.json'),JSON.stringify({...report,status:'success',activeManifestVersion:active},null,2)+'\n');
  console.log('v0.15.119 AUTOSYNC CONCURRENCY AUDIT: SUCCESS');
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
