'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const report={version:'0.15.72',generated_at:new Date().toISOString(),checks:[],inventory:{}};
const ok=(name,pass,detail='')=>report.checks.push({name,pass:!!pass,detail});
const m=JSON.parse(read('update/manifest.json'));
const byPath=new Map((m.files||[]).map(x=>[x.path,x.source]));
const runtimePath=byPath.get('runtime-global-performance-v01572.js');
const entryPath=byPath.get('main-v01572.js');
const pkgPath=byPath.get('package.json');
const runtime=runtimePath&&exists(runtimePath)?read(runtimePath):'';
const entry=entryPath&&exists(entryPath)?read(entryPath):'';
const pkg=pkgPath&&exists(pkgPath)?JSON.parse(read(pkgPath)):{};
for(const [name,src] of [['global runtime',runtime],['v0.15.72 entry',entry]]){try{new Function(src);ok(`${name} parses`,true)}catch(e){ok(`${name} parses`,false,e.message)}}
ok('manifest version 0.15.72',m.version==='0.15.72',m.version);
ok('package version 0.15.72',pkg.version==='0.15.72',pkg.version);
ok('package enters main-v01572.js',pkg.main==='main-v01572.js',pkg.main||'');
ok('manifest maps v0.15.72 runtime',runtimePath==='update/v0.15.72/runtime-global-performance-v01572.js',runtimePath||'missing');
ok('manifest maps v0.15.72 entry',entryPath==='update/v0.15.72/main-v01572.js',entryPath||'missing');
ok('v0.15.71 live AutoSync core patch preserved',entry.includes("require('./autosync-live-runtime-v01571').patch(autosyncCore)"));
ok('global runtime injected before v0.15.68 governor',entry.includes("'runtime-global-performance-v01572.js','runtime-performance-v01568.js','runtime-live-autosync-v01571.js'"));
ok('each overlay execution is tagged with runtime filename',entry.includes('__ARAM_LOADING_RUNTIME_V01572__=${JSON.stringify(file)}'));
ok('global bootstrap finishes before v0.15.68 hook restore',entry.includes("const restoreNew=\"chain.then(()=>mainWindow.webContents.executeJavaScript('window.aramGlobalPerformanceV01572?.finishBootstrap?.(); true',false)).then(()=>mainWindow.webContents.executeJavaScript('window.aramRuntimePerformanceV01568?.restoreTimerHook?.(); true',false))\""));
ok('readiness guard includes global runtime',entry.includes('__ARAM_GLOBAL_PERFORMANCE_V01572__'));
ok('base v0.15.70 main remains immutable compile source',entry.includes("const basePath=path.join(__dirname,'main.js')")&&entry.includes("const VERSION='0.15.70'"));
ok('large viewport threshold is area-aware',runtime.includes('w*h>=1750000')&&runtime.includes('aramLargeViewportV01572'));
ok('large viewport disables backdrop filters',runtime.includes('backdrop-filter:none!important')&&runtime.includes('-webkit-backdrop-filter:none!important'));
ok('large viewport removes broad container shadows',runtime.includes('.panel,')&&runtime.includes('box-shadow:none!important'));
ok('large viewport removes transitions',runtime.includes('transition-duration:0s!important'));
ok('hidden views stay paint-hidden',runtime.includes('.view:not(.active)')&&runtime.includes('content-visibility:hidden!important'));
ok('observer callbacks are active-view gated',runtime.includes('observerHiddenSkips')&&runtime.includes('if(!relevant(this.owner))'));
ok('observer callbacks are coalesced',runtime.includes('observerCoalesced')&&runtime.includes('setTimeout(()=>this.flush(),90)'));
ok('document interaction callbacks are active-view gated',runtime.includes('listenerHiddenSkips')&&runtime.includes("['click','input','change','keydown','focusin']"));
ok('frequent overlay intervals are clamped to >=1500ms',runtime.includes('requested<1500?1500:requested'));
ok('random v49/v55/v58/v68 recurring watchers are consolidated',runtime.includes("'random-practice-focus-v01549.js'")&&runtime.includes("'random-pick-density-v01555.js'")&&runtime.includes("'random-party-picks-v01558.js'")&&runtime.includes("'runtime-performance-v01568.js'"));
ok('single Random maintenance pipeline calls all compatibility refreshers',runtime.includes('aramRandomPracticeFocusV01549?.refresh')&&runtime.includes('aramRandomPickDensityV01555?.refresh')&&runtime.includes('aramRandomPartyPicksV01558?.refresh')&&runtime.includes('aramRuntimePerformanceV01568?.refresh'));
ok('Random heartbeat only runs on Random active view',runtime.includes("if(activeView()==='random')scheduleRandom(0)")&&runtime.includes('2000'));
ok('global runtime exposes long-task diagnostics',runtime.includes('longTaskMaxMs')&&runtime.includes("entryTypes:['longtask']")&&runtime.includes('getStats:()=>'));
ok('v0.15.72 remains scoring-neutral',runtime.includes('score_logic_changed:false'));
let timers=0,observers=0,docEvents=0,innerHTML=0,jsFiles=0;
for(const f of m.files||[]){if(!f.source.endsWith('.js')||!exists(f.source))continue;jsFiles++;const s=read(f.source);timers+=(s.match(/\bsetInterval\s*\(/g)||[]).length;observers+=(s.match(/\bMutationObserver\b/g)||[]).length;docEvents+=(s.match(/document\.addEventListener\s*\(/g)||[]).length;innerHTML+=(s.match(/\.innerHTML\s*=/g)||[]).length}
report.inventory={jsFiles,timers,observers,docEvents,innerHTML};
ok('global governor present despite large historical overlay inventory',jsFiles>=60&&runtime.length>0,JSON.stringify(report.inventory));
try{
  let seq=1;const intervals=new Map(),timeouts=[];let nativeObs=0;
  const classes=new Set(),classList={contains:x=>classes.has(x),toggle:(x,v)=>{v===undefined&&(v=!classes.has(x));v?classes.add(x):classes.delete(x)},add:x=>classes.add(x),remove:x=>classes.delete(x)};
  const body={classList},head={appendChild(){}},active={id:'online'},random={id:'random'};const nodes={random};
  class NMO{constructor(cb){this.cb=cb;nativeObs++}observe(){}disconnect(){}takeRecords(){return[]}}
  const document={body,head,visibilityState:'visible',createElement(){return{id:'',textContent:'',classList:{toggle(){},add(){},remove(){}}}},getElementById(id){return id==='aramGlobalPerformanceStyleV01572'?null:(nodes[id]||null)},querySelector(sel){if(sel==='.view.active')return active;if(sel.includes('.open'))return null;return null},addEventListener(){},removeEventListener(){}};
  function si(fn,ms){const id=seq++;intervals.set(id,{fn,ms});return id}function ci(id){intervals.delete(id)}function st(fn,ms){timeouts.push({fn,ms});return timeouts.length}function ct(){}
  const win={innerWidth:1480,innerHeight:940,MutationObserver:NMO,setInterval:si,clearInterval:ci,setTimeout:st,clearTimeout:ct,addEventListener(){},showTab(){}};
  const ctx={window:win,document,MutationObserver:NMO,PerformanceObserver:undefined,performance:{now:()=>Date.now()},setInterval:si,clearInterval:ci,setTimeout:st,clearTimeout:ct,Date,Math,Set,Map,WeakMap,Object,String,Number,Array,JSON,console};Object.assign(win,ctx);win.window=win;win.document=document;
  vm.runInNewContext(runtime,ctx);
  win.__ARAM_LOADING_RUNTIME_V01572__='random-pick-density-v01555.js';const o=new win.MutationObserver(()=>{});o.observe(random,{});win.setInterval(()=>{},650);document.addEventListener('click',()=>{},true);
  win.__ARAM_LOADING_RUNTIME_V01572__='multi-user-isolation-v01516.js';const iid=win.setInterval(()=>{},320);
  ok('VM clamps frequent non-random interval to 1500ms',intervals.get(iid)?.ms===1500,String(intervals.get(iid)?.ms));
  win.innerWidth=2560;win.innerHeight=1400;win.aramGlobalPerformanceV01572.syncLarge();ok('VM enables large viewport class at maximized-size area',classes.has('aramLargeViewportV01572'));
  win.aramGlobalPerformanceV01572.finishBootstrap();const stats=win.aramGlobalPerformanceV01572.getStats();
  ok('VM suppresses historical Random observer',stats.counters.randomObserversSuppressed===1,JSON.stringify(stats.counters));
  ok('VM suppresses historical Random interval',stats.counters.randomIntervalsSuppressed===1,JSON.stringify(stats.counters));
  ok('VM suppresses historical Random document listener',stats.counters.randomListenersSuppressed===1,JSON.stringify(stats.counters));
  ok('VM installs one native Random owner observer/heartbeat',nativeObs===1&&[...intervals.values()].some(x=>x.ms===2000),`nativeObs=${nativeObs}`);
}catch(e){ok('v0.15.72 VM governor simulation',false,e.stack||e.message)}
report.pass=report.checks.every(x=>x.pass);fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/runtime-stability-v01572-report.json'),JSON.stringify(report,null,2));for(const c of report.checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exit(1);
