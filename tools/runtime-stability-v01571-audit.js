'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const report={version:'0.15.71',generated_at:new Date().toISOString(),checks:[]};
const ok=(name,pass,detail='')=>report.checks.push({name,pass:!!pass,detail});
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};
const m=JSON.parse(read('update/manifest.json'));
const byPath=new Map((m.files||[]).map(x=>[x.path,x.source]));
const pkgPath=byPath.get('package.json'),baseMainPath=byPath.get('main.js'),nodePath=byPath.get('autosync-live-runtime-v01571.js'),rendererPath=byPath.get('runtime-live-autosync-v01571.js'),v70Path=byPath.get('runtime-random-ingame-v01570.js'),v79Path=byPath.get('main-v01579.js');
const pkg=pkgPath&&exists(pkgPath)?JSON.parse(read(pkgPath)):{},entryTarget=String(pkg.main||'main.js'),entryPath=byPath.get(entryTarget);
const entry=entryPath&&exists(entryPath)?read(entryPath):'',baseMain=baseMainPath&&exists(baseMainPath)?read(baseMainPath):'',node=nodePath&&exists(nodePath)?read(nodePath):'',renderer=rendererPath&&exists(rendererPath)?read(rendererPath):'',v79Entry=v79Path&&exists(v79Path)?read(v79Path):'';
function collectMainChain(startTarget){
  const out=[],seen=new Set();let target=startTarget;
  while(target&&byPath.get(target)&&!seen.has(target)&&out.length<32){
    seen.add(target);const source=byPath.get(target);if(!source||!exists(source))break;const text=read(source);out.push({target,source,text});
    const refs=[...text.matchAll(/['"](main-v\d+\.js)['"]/g)].map(x=>x[1]);target=refs.find(x=>byPath.has(x)&&!seen.has(x))||'';
  }
  return out;
}
const entryChain=collectMainChain(entryTarget),entryChainTargets=entryChain.map(x=>x.target),entryChainText=entryChain.map(x=>x.text).join('\n');
const versionEdges=[];
for(const row of entryChain){for(const x of row.text.matchAll(/replaceAll\('([0-9.]+)','([0-9.]+)'\)/g))versionEdges.push([x[1],x[2]])}
function versionReachable(from,to){const q=[String(from)],seen=new Set(q);while(q.length){const a=q.shift();if(a===String(to))return true;for(const [x,y] of versionEdges)if(x===a&&!seen.has(y)){seen.add(y);q.push(y)}}return false}
report.entry_chain=entryChainTargets;report.version_edges=versionEdges;
for(const [name,src] of [['current Electron entry',entry],['v0.15.79 safety successor base',v79Entry],['historical v0.15.70 main',baseMain],['main-process live runtime',node],['renderer live runtime',renderer]]){try{new Function(src);ok(`${name} parses`,true)}catch(e){ok(`${name} parses`,false,e.message)}}
ok('manifest is v0.15.71 or newer',ge(m.version,'0.15.71'),m.version);
ok('package is v0.15.71 or newer',ge(pkg.version,'0.15.71'),pkg.version);
ok('package current entry is delivered',!!entryPath&&exists(entryPath),`${entryTarget} -> ${entryPath||'missing'}`);
ok('historical v0.15.70 main remains immutable runtime base',baseMainPath==='update/v0.15.70/main.js',baseMainPath||'missing');
ok('main-process live runtime is delivered',nodePath==='update/v0.15.71/autosync-live-runtime-v01571.js',nodePath||'missing');
ok('renderer live runtime target is delivered',!!rendererPath&&exists(rendererPath),rendererPath||'missing');
ok('v0.15.70 Random In-game owner remains active',v70Path==='update/v0.15.70/runtime-random-ingame-v01570.js',v70Path||'missing');
ok('v0.15.79 safety successor base is delivered',!!v79Path&&exists(v79Path),v79Path||'missing');
ok('current entry inherits v0.15.79 safety successor',entryChainTargets.includes('main-v01579.js'),entryChainTargets.join(' -> '));
ok('inherited entry patches cached AutoSync Core before compiling historical main',v79Entry.indexOf("require('./autosync-live-runtime-v01571').patch(autosyncCore)")>=0&&v79Entry.indexOf('module._compile(src,__filename)')>v79Entry.indexOf("patch(autosyncCore)"));
ok('inherited entry requires exact v0.15.70 base contract',v79Entry.includes("const VERSION='0.15.70'")&&v79Entry.includes('base main contract mismatch'));
ok('successor chain promotes runtime version to current manifest',v79Entry.includes("replaceAll('0.15.70','0.15.79')")&&versionReachable('0.15.70',m.version),`${m.version} · ${versionEdges.map(x=>x.join('→')).join(', ')}`);
ok('inherited entry injects renderer live governor after performance owner',v79Entry.includes("'runtime-performance-v01568.js','runtime-live-autosync-v01571.js','live-strength-v01513.js'"));
ok('inherited entry preserves v0.15.71 renderer readiness marker',v79Entry.includes('__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__'));
ok('historical base still contains v0.15.70 Random In-game owner',baseMain.includes("'runtime-random-ingame-v01570.js'")&&baseMain.includes('aramRandomIngameRuntimeV01570?.finishBootstrap'));
ok('core cadence is reduced from 750ms to 1200ms',node.includes("setInterval(()=>this.tick().catch(()=>{}),1200)"));
ok('identity/lobby refresh is throttled during live game',node.includes('t-last<15000')&&node.includes('__aramLiveIdentityAtV01571'));
ok('credential and gameflow checks are throttled during live game',node.includes('t-last<3000')&&node.includes('__aramLiveCredsAtV01571')&&node.includes('__aramLiveFlowCacheV01571'));
ok('event history is cached for 3 seconds and active player name for 15 seconds',node.includes("p.includes('/activeplayername')?15000:p.includes('/eventdata')?3000:0"));
ok('main-process live patch is score-neutral',node.includes('score_logic_changed:false'));
ok('renderer uses single-flight polling guard',renderer.includes('if(busy){counters.overlapSkips++')&&renderer.includes('pendingForce'));
ok('renderer replaces base poll cadence with 1250ms non-overlapping loop',renderer.includes('lolAutoSync.timer=setInterval(()=>wrapped(false),1250)'));
ok('Match Lab live-link persistence requires complete 5v5 and writes once per game',renderer.includes('ours.length<5||enemy.length<5')&&renderer.includes('if(linkedGameId===gid)')&&renderer.includes('linkedGameWrites'));
ok('AutoSync status UI is deduped by stable signature',renderer.includes('syncUiSkips')&&renderer.includes('lastUiSig'));
ok('Match Lab account chrome is deduped by stable signature',renderer.includes('historyUiSkips')&&renderer.includes('lastHistorySig'));
ok('renderer exposes live diagnostic counters',renderer.includes('aramLiveAutosyncRuntimeV01571')&&renderer.includes('maxPollMs'));
ok('renderer live patch is score-neutral',renderer.includes('score_logic_changed:false'));
try{
  const scriptsOld="'runtime-performance-v01568.js','live-strength-v01513.js'",scriptsNew="'runtime-performance-v01568.js','runtime-live-autosync-v01571.js','live-strength-v01513.js'";
  const readyOld='Boolean(window.__ARAM_RUNTIME_PERFORMANCE_V01568__) && Boolean(window.__ARAM_LIVE_STRENGTH_V01513__)',readyNew='Boolean(window.__ARAM_RUNTIME_PERFORMANCE_V01568__) && Boolean(window.__ARAM_LIVE_AUTOSYNC_RUNTIME_V01571__) && Boolean(window.__ARAM_LIVE_STRENGTH_V01513__)';
  const current=baseMain.replace(scriptsOld,scriptsNew).replace(readyOld,readyNew).replaceAll('0.15.70',m.version);
  new Function(current);ok('v0.15.71 live transform remains syntactically valid',current.includes(`const VERSION='${m.version}'`)&&current.includes("'runtime-live-autosync-v01571.js'"));
}catch(e){ok('v0.15.71 live transform remains syntactically valid',false,e.message)}
try{
  let intervalDelay=0;
  class Core{constructor(){this.state={phase:'in_game',gameflowPhase:'InProgress'};this.creds={};this.timer=null}tick(){return Promise.resolve()}captureIdentityAndParty(){return Promise.resolve()}refreshCreds(){return Promise.resolve(true)}gameflowInfo(){return Promise.resolve({phase:'InProgress',queueId:450,gameId:1})}liveGet(){return Promise.resolve({})}}
  const mod={LeagueAutoSyncCore:Core};const context={module:{exports:{}},exports:{},require,console,setInterval:(fn,ms)=>{intervalDelay=ms;return 1},clearInterval,Date,Map,String,Number,Promise};context.exports=context.module.exports;
  vm.runInNewContext(node,context);context.module.exports.patch(mod);const c=new Core();c.start();ok('VM core installs 1200ms timer',intervalDelay===1200,`delay=${intervalDelay}`);
}catch(e){ok('v0.15.71 main-process VM simulation',false,e.stack||e.message)}
try{
  let nextId=1,intervalDelay=0,clears=0,trackCalls=0,uiCalls=0,histCalls=0,resolvePoll;const pollPromise=new Promise(r=>{resolvePoll=r});
  const timers={setInterval(fn,ms){intervalDelay=ms;return ++nextId},clearInterval(){clears++},setTimeout(fn){fn();return ++nextId}};
  const state={phase:'in_game',isAram:true,gameId:77,inGameOur:[1,2,3,4,5],inGameEnemy:[6,7,8,9,10],clientConnected:true,bridgeConnected:true,account:{connected:true,riotId:'x#1'}};
  const context={window:null,console,performance:{now:()=>0},Date,JSON,Promise,...timers,lolAutoSync:{timer:123,lastState:state,enabled:true},lolAutoSyncPoll(){return pollPromise},aramTrackLinkedGame(){trackCalls++},lolAutoSyncRender(){uiCalls++},aramHistoryRenderAccount(){histCalls++},aramHistoryState:{targetMode:'current'}};context.window=context;
  vm.runInNewContext(renderer,context);ok('VM renderer replaces existing poll timer',clears===1&&intervalDelay===1250,`clears=${clears},delay=${intervalDelay}`);
  context.aramTrackLinkedGame(state);context.aramTrackLinkedGame(state);ok('VM renderer persists a complete live game once',trackCalls===1,`trackCalls=${trackCalls}`);
  context.lolAutoSyncRender();context.lolAutoSyncRender();context.aramHistoryRenderAccount();context.aramHistoryRenderAccount();ok('VM renderer dedupes stable status/account paints',uiCalls===1&&histCalls===1,`ui=${uiCalls},history=${histCalls}`);
  const p1=context.lolAutoSyncPoll(false),p2=context.lolAutoSyncPoll(false),st=context.aramLiveAutosyncRuntimeV01571.getStats();ok('VM overlapping renderer poll is skipped',st.counters.overlapSkips===1,JSON.stringify(st.counters));resolvePoll(state);void p1;void p2;
}catch(e){ok('v0.15.71 renderer VM simulation',false,e.stack||e.message)}
report.pass=report.checks.every(x=>x.pass);fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/runtime-stability-v01571-report.json'),JSON.stringify(report,null,2));
for(const c of report.checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exit(1);