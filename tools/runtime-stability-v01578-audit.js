'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8'),exists=p=>fs.existsSync(path.join(ROOT,p));
const checks=[];const ok=(n,p,d='')=>checks.push({name:n,pass:!!p,detail:d});
const m=JSON.parse(read('update/manifest.json')),by=new Map((m.files||[]).map(x=>[x.path,x.source]));
const src=t=>by.get(t)&&exists(by.get(t))?read(by.get(t)):'';
const pkg=JSON.parse(src('package.json')||'{}'),entry=src(pkg.main||''),preload=src('preload.js');
const stab=src('runtime-source-stability-v01578.js'),idx=src('safe-index-patch-v01578.js'),hb=src('hang-heartbeat-v01578.js'),ext=src('external-watchdog-v01578.js');
for(const [n,s] of [['entry',entry],['preload',preload],['v78 source stability',stab],['v78 index patch',idx],['main heartbeat',hb],['external watchdog',ext]]){try{new Function(s);ok(n+' parses',true)}catch(e){ok(n+' parses',false,e.message)}}
ok('manifest version',m.version==='0.15.78',m.version);
ok('package version',pkg.version==='0.15.78',pkg.version||'');
ok('package entry',pkg.main==='main-v01578.js',pkg.main||'');
for(const [t,s] of [['main-v01578.js','update/v0.15.78/main-v01578.js'],['preload.js','update/v0.15.78/preload.js'],['safe-index-patch-v01578.js','update/v0.15.78/safe-index-patch-v01578.js'],['runtime-source-stability-v01578.js','update/v0.15.78/runtime-source-stability-v01578.js'],['hang-heartbeat-v01578.js','update/v0.15.78/hang-heartbeat-v01578.js'],['external-watchdog-v01578.js','update/v0.15.78/external-watchdog-v01578.js']])ok('delivered '+t,by.get(t)===s,by.get(t)||'');
ok('entry installs blackbox and external heartbeat before core',entry.indexOf("blackbox.install({version:'0.15.78'})")>0&&entry.indexOf("hang-heartbeat-v01578').install")>0&&entry.indexOf("hang-heartbeat-v01578').install")<entry.indexOf("const autosyncCore=require('./autosync-core')"));
ok('entry applies v75 in-game patch plus v78 renderAll patch before base compile',entry.includes('patchInGame(before)')&&entry.includes('patchRenderAll(a.text)')&&entry.indexOf('patchInstalledIndex()')<entry.indexOf("const autosyncCore=require('./autosync-core')"));
ok('entry uses v78 source hardening in isolated loader',entry.includes("runtime-loader-v01577').injectRuntimeStack")&&entry.includes("runtime-source-stability-v01578').patchRuntimeSource"));
ok('renderer heartbeat bypasses main IPC',preload.includes('heartbeat-renderer-v01578.json')&&preload.includes('fs.writeFile(file')&&preload.includes('setInterval(write,500)'));
ok('main heartbeat is independent file writer',hb.includes('heartbeat-main-v01578.json')&&hb.includes('setInterval(write,500)'));
ok('external watchdog runs as independent Electron-as-Node process',hb.includes("ELECTRON_RUN_AS_NODE:'1'")&&hb.includes('detached:true')&&hb.includes('external-watchdog-v01578.js'));
ok('external watchdog distinguishes main renderer and both hangs',ext.includes("'HNG-M001'")&&ext.includes("'HNG-R001'")&&ext.includes("'HNG-B001'"));
ok('external watchdog has launch grace and stale threshold',ext.includes('Date.now()-started<8000')&&ext.includes('mainAge>2600')&&ext.includes('rendererAge>2600'));
let patcher=null,indexPatch=null;
try{patcher=require(path.join(ROOT,by.get('runtime-source-stability-v01578.js'))).patchRuntimeSource;ok('v78 source patch module loads',typeof patcher==='function')}catch(e){ok('v78 source patch module loads',false,e.message)}
try{indexPatch=require(path.join(ROOT,by.get('safe-index-patch-v01578.js')));ok('v78 index patch module loads',typeof indexPatch.patchIndexText==='function')}catch(e){ok('v78 index patch module loads',false,e.message)}
if(indexPatch){
  const one=indexPatch.patchIndexText(indexPatch.OLD),two=indexPatch.patchIndexText(one.text);
  ok('renderAll fixture patches exactly once',one.ok&&one.changed&&one.text.includes(indexPatch.MARK));
  ok('renderAll patch idempotent',two.ok&&!two.changed&&two.status==='already-patched');
  ok('obsolete counters become null-safe',one.text.includes("const cc=document.getElementById('champCount');if(cc)")&&one.text.includes("const ac=document.getElementById('aliasCount');if(ac)")&&one.text.includes("const rc=document.getElementById('routeCount');if(rc)")&&one.text.includes("const sc=document.getElementById('sapaCount');if(sc)"));
}
let patchedMulti='';
if(patcher){
  try{
    const raw=src('multi-user-isolation-v01516.js');patchedMulti=patcher('multi-user-isolation-v01516.js',raw);const twice=patcher('multi-user-isolation-v01516.js',patchedMulti);
    ok('multi-user patch is idempotent',!!raw&&patchedMulti===twice);
    ok('owner restore no longer calls monolithic renderAll',!patchedMulti.includes("if(typeof renderAll==='function')renderAll()")&&patchedMulti.includes("['USR-R01'")&&patchedMulti.includes("['USR-R09'"));
    ok('owner activation is deferred out of linked-game stack',patchedMulti.includes("code:'USR-110'")&&patchedMulti.includes('setTimeout(()=>{try{activateOwner(p,s.account)'));
    ok('owner sync timer reduced from 320ms polling',patchedMulti.includes('setInterval(syncOwner,1500)')&&!patchedMulti.includes('setInterval(syncOwner,320)'));
    ok('user-state stages emit targeted errors and slow codes',patchedMulti.includes("code:'USR-E001'")&&patchedMulti.includes("code:'USR-E002'")&&patchedMulti.includes("code:'USR-E003'")&&patchedMulti.includes("code:'USR-SLOW'"));
    new Function(patchedMulti);ok('patched multi-user source parses',true);
  }catch(e){ok('patched multi-user source parses',false,e.message)}
}
if(patchedMulti){
  try{
    const timers=[],calls=[];let renderAllCalls=0,comboCalls=0;const store=new Map();
    const ls={getItem:k=>store.has(String(k))?store.get(String(k)):null,setItem:(k,v)=>store.set(String(k),String(v)),removeItem:k=>store.delete(String(k))};
    const ctx={console,window:null,document:{getElementById:()=>null,querySelector:()=>null},localStorage:ls,Storage:undefined,BigInt,Date,JSON,Object,String,Number,Array,Set,Map,Math,
      setInterval:(fn,ms)=>({fn,ms}),clearInterval:()=>{},setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},clearTimeout:()=>{},performance:{now:()=>0},
      lolAutoSync:{lastState:{account:null}},aramHistoryState:{},loadAppState:()=>({state:{x:1},randomState:{queue:1}}),state:{},randomState:{},
      renderAll:()=>renderAllCalls++,runRandomCombos:()=>comboCalls++,renderBuilder:()=>calls.push('builder'),renderLive:()=>calls.push('live'),renderSeries:()=>calls.push('series'),renderRandomInputs:()=>calls.push('randomInputs'),renderOnline:()=>calls.push('online'),renderDataExplorer:()=>calls.push('data'),persist:()=>calls.push('persist'),
      onlineRestoreSavedSession:()=>{},onlinePersistSession:()=>{},onlineRole:'',onlineCleanup:()=>{},aramMatchLabSaveSession:v=>v,aramHistorySaveTracked:v=>v,aramTrackLinkedGame:()=>{},
      aramHistoryPickReplayHtml:()=>'',aramHistoryFiltered:()=>[],aramHistoryOverall:()=>({}),aramHistoryMatchRowHtml:()=>'',aramHistorySummaryTab:()=>'',renderAramHistoryFeedback:()=>calls.push('history'),aramHistoryAccountLabel:()=>'',aramHistorySetDetailTab:()=>{}};
    ctx.window=ctx;ctx.window.localStorage=ls;ctx.window.addEventListener=()=>{};ctx.window.aramHistoryFavoritesV01514={render:()=>calls.push('favorites')};ctx.window.aramDesktop={traceDiagnostic:x=>calls.push('diag:'+x.code)};
    vm.runInNewContext(patchedMulti,ctx);ctx.window.aramMultiUserIsolationV01516.activateOwner('AUDIT-PUUID',{puuid:'AUDIT-PUUID',riotId:'Audit#1'});
    let guard=0;while(timers.length&&guard++<50){const t=timers.shift();if(t.ms===1500)continue;t.fn()}
    ok('VM owner activation never invokes renderAll',renderAllCalls===0,`renderAll=${renderAllCalls}`);
    ok('VM owner activation never starts TOP5 combos',comboCalls===0,`runRandomCombos=${comboCalls}`);
    ok('VM owner UI restore is staged and survives missing optional DOM',calls.includes('builder')&&calls.includes('randomInputs')&&calls.includes('favorites')&&calls.includes('persist'),JSON.stringify(calls));
  }catch(e){ok('VM owner activation never invokes renderAll',false,e.stack||e.message);ok('VM owner activation never starts TOP5 combos',false,e.message);ok('VM owner UI restore is staged and survives missing optional DOM',false,e.message)}
}
ok('score logic untouched by v78 stability layer',!entry.includes('teamScore(')&&!entry.includes('recommendPicks(')&&!entry.includes('recommendBans(')&&stab.includes('score_logic_changed:false')&&idx.includes('score_logic_changed:false'));
const report={version:'0.15.78',checks,pass:checks.every(x=>x.pass),score_logic_changed:false,info:{evidence:'v0.15.77 BLACKBOX captured JS-E002: lolAutoSyncPoll -> aramTrackLinkedGame -> activateOwner -> applyUserState -> renderAll -> missing #champCount',fix:'defer owner activation; staged user-state restore; null-safe base renderAll; independent main/renderer heartbeat classifier'}};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/runtime-stability-v01578-report.json'),JSON.stringify(report,null,2));
for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exit(1);
