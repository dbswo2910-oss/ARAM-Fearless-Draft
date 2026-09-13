'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const ok=(c,m)=>{if(!c)throw new Error(`v0.15.128 HISTORY LATENCY AUDIT: ${m}`)};
const count=(s,n)=>String(s).split(n).length-1;
const parse=(s,n)=>{try{new Function(s)}catch(e){throw new Error(`${n} parse failed: ${e.message}`)}};
const waitTurn=()=>new Promise(r=>setImmediate(r));
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};

(async()=>{
  const dir='update/v0.15.128/';
  for(const p of ['package.json','main-v015128.js','successor-route-v015128.js','runtime-source-stability-v015128.js','history-latency-v015128.js','autosync-concurrency-v015119.js'])ok(exists(dir+p),`missing ${p}`);
  const pkg=JSON.parse(read(dir+'package.json')),main=read(dir+'main-v015128.js'),routeSrc=read(dir+'successor-route-v015128.js'),runtimeSrc=read(dir+'runtime-source-stability-v015128.js'),renderer=read(dir+'history-latency-v015128.js'),concurrencySrc=read(dir+'autosync-concurrency-v015119.js');
  for(const [n,s] of [['main',main],['route',routeSrc],['runtime',runtimeSrc],['history renderer',renderer],['autosync concurrency',concurrencySrc]])parse(s,n);
  ok(pkg.version==='0.15.128'&&pkg.main==='main-v015128.js','package contract mismatch');
  ok(main.includes("const VERSION='0.15.128'")&&main.includes("main-v015122.js")&&main.includes("root:'main-v01579.js'"),'main recovery/safety contract mismatch');
  ok(!renderer.includes('MutationObserver')&&!renderer.includes('setInterval('),'history renderer added persistent polling/observer');
  for(const n of ['cacheOnly:true',"priority:'interactive'","priority:'background'",'historyProbe:true','scan:12','quickScanFor','deepScanFor','window.__ARAM_HISTORY_LATENCY_V015128__=true','score_logic_changed:false','random_scoring_changed:false'])ok(renderer.includes(n),`renderer contract missing ${n}`);

  const concurrency=require('../update/v0.15.128/autosync-concurrency-v015119');
  let backendCalls=0,lastOpts=null,pendingResolve=null;
  class Core{
    constructor(){this.timer=null;this.creds={port:1,password:'x'};this.mode='normal'}
    getAramMatchHistory(opts){backendCalls++;lastOpts={...opts};if(this.mode==='pending')return new Promise(r=>{pendingResolve=r});if(this.mode==='probe')return Promise.resolve({connected:true,matches:[{gameId:'g4',gameEndTimestamp:400}],scanned:12,queueMode:'standard'});return Promise.resolve({connected:true,matches:[{gameId:'g3',gameEndTimestamp:300},{gameId:'g2',gameEndTimestamp:200},{gameId:'g1',gameEndTimestamp:100}],scanned:Number(opts.scan)||0,queueMode:'standard'})}
    stop(){}
  }
  const mod={LeagueAutoSyncCore:Core};concurrency.patchCore(mod);const c=new Core();
  const miss=await c.getAramMatchHistory({limit:20,scan:0,target:{current:true},queueMode:'standard',cacheOnly:true,priority:'interactive'});
  ok(backendCalls===0&&miss?._historyLatency?.cacheHit===false,'cache miss called backend or lacked telemetry');
  const quick=await c.getAramMatchHistory({limit:20,scan:40,target:{current:true},queueMode:'standard',priority:'interactive'});
  ok(backendCalls===1&&quick.matches.length===3,'interactive quick request failed');
  ok(!('priority' in lastOpts)&&!('cacheOnly' in lastOpts)&&!('historyProbe' in lastOpts),'custom history flags leaked to base autosync-core');
  const hit=await c.getAramMatchHistory({limit:20,scan:0,target:{current:true},queueMode:'standard',cacheOnly:true});
  ok(backendCalls===1&&hit?._historyLatency?.cacheHit===true&&hit.matches.length===3,'session history cache hit failed');

  c.mode='pending';
  const p1=c.getAramMatchHistory({limit:5,scan:20,target:{current:true},queueMode:'standard',priority:'interactive'});
  const p2=c.getAramMatchHistory({limit:5,scan:20,target:{current:true},queueMode:'standard',priority:'interactive'});
  ok(p1===p2,'identical history requests were not coalesced');await waitTurn();ok(backendCalls===2,'coalesced history request still called backend twice');pendingResolve({connected:true,matches:[{gameId:'g3',gameEndTimestamp:300}],scanned:20,queueMode:'standard'});await Promise.all([p1,p2]);

  c.mode='probe';await c.getAramMatchHistory({limit:1,scan:12,target:{current:true},queueMode:'standard',priority:'interactive',historyProbe:true});
  const merged=await c.getAramMatchHistory({limit:20,scan:0,target:{current:true},queueMode:'standard',cacheOnly:true});
  ok(merged.matches.some(x=>String(x.gameId)==='g4')&&merged.matches.some(x=>String(x.gameId)==='g1'),'latest-match probe shrank or replaced cached history');
  const hs=c.getConcurrencyStatsV015119().history;
  ok(hs.requests>=3&&hs.cacheHits>=2&&hs.cacheMisses>=1&&hs.coalesces>=1&&hs.probe>=1,'history telemetry counters incomplete: '+JSON.stringify(hs));
  ok(concurrency.score_logic_changed===false&&concurrency.random_scoring_changed===false&&concurrency.history_latency_changed===true,'autosync scoring/latency flags mismatch');

  const prior=require('../update/v0.15.127/runtime-source-stability-v015127');
  const current=require('../update/v0.15.128/runtime-source-stability-v015128');
  const queueBase=read('update/v0.15.17/match-lab-queue-v01517.js');
  const queueAfter=current.patchRuntimeSource('match-lab-queue-v01517.js',queueBase);
  ok(count(queueAfter,'/* ARAM_HISTORY_LATENCY_V015128 */')===1,'history payload injection count != 1');
  ok(queueAfter.includes('__ARAM_HISTORY_LATENCY_V015128__'),'history readiness marker missing after transform');parse(queueAfter,'transformed match history owner');
  const coachBase=read('update/v0.15.50/random-ingame-coach-v01550.js');
  const coachAfter=current.patchRuntimeSource('random-ingame-coach-v01550.js',coachBase);
  ok(coachAfter.includes('aramHistoryLatencyV015128?.probeLatest'),'Random result sync does not use latest-match probe');
  ok(coachAfter.includes('const waits=[0,700,1100,1700,2600,4000,6500,10000,15000,15000,15000];'),'faster bounded result retry schedule missing');
  ok(!coachAfter.includes('const waits=[0,1200,2200,3500,5000,8000,12000,15000,15000,15000,15000];'),'old slow retry schedule remains');parse(coachAfter,'transformed Random result coach');
  for(const [file,p] of [
    ['runtime-random-practice-v01572.js','update/v0.15.72/runtime-random-practice-v01572.js'],
    ['ui-stability-baseline-v015115.js','update/v0.15.120/ui-stability-baseline-v015115.js'],
    ['input-interaction-stability-v01539.js','update/v0.15.39/input-interaction-stability-v01539.js'],
    ['riot-grade-collector-v01532.js','update/v0.15.122/riot-grade-collector-v01532.js']
  ]){const src=read(p);ok(prior.patchRuntimeSource(file,src)===current.patchRuntimeSource(file,src),`${file} changed outside history latency scope`)}
  ok(current.score_logic_changed===false&&current.random_scoring_changed===false&&current.history_latency_changed===true&&current.result_latest_probe===true,'runtime flags mismatch');

  const route=require('../update/v0.15.128/successor-route-v015128');
  const predecessor=read('update/v0.15.122/main-v015122.js');ok(count(predecessor,route.OLD_ROUTE_FRAGMENT)===1,'v122 route cardinality changed');const routed=route.patchSuccessorSource(predecessor);ok(count(routed,route.NEW_ROUTE_FRAGMENT)===1&&count(routed,route.OLD_ROUTE_FRAGMENT)===0,'v128 successor route failed');parse(routed,'routed v122 predecessor');

  const manifest=JSON.parse(read('update/manifest.json')),map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
  if(String(manifest.version)==='0.15.128'){
    const expected={
      'package.json':'update/v0.15.128/package.json',
      'autosync-concurrency-v015119.js':'update/v0.15.128/autosync-concurrency-v015119.js',
      'history-latency-v015128.js':'update/v0.15.128/history-latency-v015128.js',
      'successor-route-v015128.js':'update/v0.15.128/successor-route-v015128.js',
      'runtime-source-stability-v015128.js':'update/v0.15.128/runtime-source-stability-v015128.js',
      'main-v015128.js':'update/v0.15.128/main-v015128.js'
    };
    for(const [p,s] of Object.entries(expected))ok(map.get(p)===s,`active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
    for(const row of manifest.files||[])ok(String(row.source||'').startsWith('update/'),`unsafe active source ${row.path} -> ${row.source}`);
  }else if(ge(manifest.version,'0.15.129')){
    const preserved={
      'autosync-concurrency-v015119.js':'update/v0.15.128/autosync-concurrency-v015119.js',
      'history-latency-v015128.js':'update/v0.15.128/history-latency-v015128.js',
      'successor-route-v015128.js':'update/v0.15.128/successor-route-v015128.js',
      'runtime-source-stability-v015128.js':'update/v0.15.128/runtime-source-stability-v015128.js',
      'main-v015128.js':'update/v0.15.128/main-v015128.js'
    };
    for(const [p,s] of Object.entries(preserved))ok(map.get(p)===s,`successor failed to preserve v0.15.128 history dependency ${p}: ${map.get(p)||'missing'}`);
    const activeRuntimePath=map.get(`runtime-source-stability-v${String(manifest.version).replace(/\./g,'')}.js`);
    ok(activeRuntimePath&&exists(activeRuntimePath),'successor active runtime source missing');
    const activeRuntime=require(path.join(ROOT,activeRuntimePath));
    ok(activeRuntime.history_latency_changed===true&&activeRuntime.history_cache_first===true&&activeRuntime.history_background_deep_scan===true&&activeRuntime.result_latest_probe===true,'successor runtime did not preserve v0.15.128 history flags');
    const successorQueue=activeRuntime.patchRuntimeSource('match-lab-queue-v01517.js',queueBase);
    ok(successorQueue.includes('__ARAM_HISTORY_LATENCY_V015128__')&&successorQueue.includes('cacheOnly:true')&&successorQueue.includes("priority:'background'"),'successor runtime did not preserve history renderer payload');
  }else ok(String(manifest.version)==='0.15.127','unexpected preactivation manifest '+manifest.version);
  const report={version:'0.15.128',generated_at:new Date().toISOString(),status:'PASS',active_manifest_version:String(manifest.version),score_logic_changed:false,random_scoring_changed:false,contracts:{cache_first:true,quick_scan_max:50,background_deep_backfill:true,latest_game_probe_scan:12,request_coalescing:true,telemetry:true,no_new_recurring_poll:true,successor_preservation:true},simulated_history_stats:hs};
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output/v015128-history-latency-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('v0.15.128 HISTORY LATENCY AUDIT: SUCCESS · cache-first search · quick scan · background deep backfill · bounded latest-game probe');
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
