'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const report={version:'0.15.70',generated_at:new Date().toISOString(),checks:[]};
const ok=(name,pass,detail='')=>report.checks.push({name,pass:!!pass,detail});
const m=JSON.parse(read('update/manifest.json'));
const byPath=new Map((m.files||[]).map(x=>[x.path,x.source]));
const mainPath=byPath.get('main.js'),pkgPath=byPath.get('package.json'),ownerPath=byPath.get('runtime-random-ingame-v01570.js');
const main=mainPath&&exists(mainPath)?read(mainPath):'',pkg=pkgPath&&exists(pkgPath)?JSON.parse(read(pkgPath)):{},owner=ownerPath&&exists(ownerPath)?read(ownerPath):'';
for(const [name,src] of [['main',main],['v0.15.70 random in-game owner',owner]]){try{new Function(src);ok(`${name} parses`,true)}catch(e){ok(`${name} parses`,false,e.message)}}
ok('manifest version 0.15.70',m.version==='0.15.70',m.version);
ok('package version 0.15.70',pkg.version==='0.15.70',pkg.version);
ok('manifest maps v0.15.70 main',mainPath==='update/v0.15.70/main.js',mainPath||'missing');
ok('manifest maps v0.15.70 package',pkgPath==='update/v0.15.70/package.json',pkgPath||'missing');
ok('manifest maps v0.15.70 random in-game owner',ownerPath==='update/v0.15.70/runtime-random-ingame-v01570.js',ownerPath||'missing');
const ownerAt=main.indexOf("'runtime-random-ingame-v01570.js'"),coachAt=main.indexOf("'random-ingame-coach-v01550.js'"),globalIconAt=main.indexOf("'item-icons-global-v01557.js'"),itemArtAt=main.indexOf("'item-art-runtime-v01566.js'");
ok('single-owner loads immediately before historical coach stack',ownerAt>=0&&coachAt>ownerAt,`${ownerAt}/${coachAt}`);
ok('historical v0.15.50-v0.15.57 stack remains before item-art owner',globalIconAt>coachAt&&itemArtAt>globalIconAt,`${coachAt}/${globalIconAt}/${itemArtAt}`);
const finishAt=main.indexOf("if(file==='item-icons-global-v01557.js')");
ok('v0.15.70 bootstrap finishes immediately after v0.15.57 injection',finishAt>=0&&main.includes('aramRandomIngameRuntimeV01570?.finishBootstrap?.()'));
ok('v0.15.70 readiness marker is guarded by main',main.includes('Boolean(window.__ARAM_RANDOM_INGAME_RUNTIME_V01570__)'));
ok('v0.15.68 timer hook is restored only after v0.15.70 narrow bootstrap chain',main.indexOf('aramRuntimePerformanceV01568?.restoreTimerHook?.()')>finishAt);
for(const p of ['random-ingame-coach-v01550.js','random-ingame-ux-v01551.js','random-ingame-ux-v01552.js','random-ingame-shop-v01553.js','random-ingame-shop-polish-v01554.js','random-item-icons-v01556.js','item-icons-global-v01557.js']){
  const src=byPath.get(p)||'';ok(`historical ${p} remains mapped to historical source`,!!src&&!src.includes('v0.15.70/'),src);
}
ok('owner suppresses historical interval registration only during bootstrap',owner.includes('window.setInterval=suppressedInterval')&&owner.includes('window.setInterval=upstreamSetInterval'));
ok('owner suppresses historical MutationObserver registration only during bootstrap',owner.includes('AramSuppressedRandomIngameObserver')&&owner.includes('window.MutationObserver=NativeMutationObserver'));
ok('owner suppresses v0.15.50 random-wide capture click scheduler during bootstrap',owner.includes("src.includes('#random,.randomModeNav')")&&owner.includes('bootstrapClicksSuppressed'));
ok('hidden legacy detail renderer is bypassed in in-game mode',owner.includes('legacyDetailRendersSuppressed')&&owner.includes("if(randomMode()==='ingame')"));
ok('hidden legacy analysis renderer is bypassed in in-game mode',owner.includes('legacyAnalysisRendersSuppressed')&&owner.includes('legacyRenderRandomAnalysis'));
ok('one central 1000ms owner heartbeat is installed',owner.includes('upstreamSetInterval.call(window,()=>tick(false),1000)'));
ok('owner gates work on active Random in-game view and page visibility',owner.includes("root.classList.contains('active')")&&owner.includes("randomMode()==='ingame'")&&owner.includes("document.visibilityState!=='hidden'"));
ok('owner respects v0.15.68 native interaction busy flag',owner.includes('__ARAM_PERF_PAUSE_V01568__')&&owner.includes('busySkips'));
ok('semantic refresh uses coarse 30s time bucket',owner.includes('/30)')&&owner.includes('timeBucket'));
ok('semantic refresh preserves respawn <=7s decision boundary',owner.includes("respawn>7?'dead':'respawn'")&&owner.includes('respawnBand'));
ok('clock/respawn/gold use volatile text updates instead of whole body rewrite',owner.includes("$('.riHeroTop em',shell)")&&owner.includes("$('.riRespawnStrip strong',shell)")&&owner.includes("$('.riRespawnStrip b',shell)"));
ok('shop pipeline runs only with Build tab active and is throttled',owner.includes('[data-ri-tab="build"].active')&&owner.includes('t-lastShopAt<1800'));
ok('post-render pipeline owns v51/v52/v53/v54/v56 refreshes',owner.includes('aramRandomIngameUxV01551?.refresh')&&owner.includes('aramRandomIngameUxV01552?.refresh')&&owner.includes('aramRandomIngameShopV01553?.refresh')&&owner.includes('aramRandomIngameShopPolishV01554?.refresh')&&owner.includes('aramRandomItemIconsV01556?.refresh'));
ok('global v57 icon scan is skipped while Random in-game is active',owner.includes('function refreshGlobalIcons(){')&&owner.includes('if(randomActive())return'));
ok('runtime exposes diagnostic counters and timing maxima',owner.includes('getStats:()=>')&&owner.includes('maxLayerMs')&&owner.includes('maxTickMs'));
ok('v0.15.70 remains scoring-neutral',owner.includes('score_logic_changed:false'));

try{
  let realIntervals=0,detailCalls=0,analysisCalls=0;
  const queued=[];
  const realSetInterval=function(){realIntervals++;return 9000+realIntervals};
  const timers={setTimeout(fn){queued.push(fn);return queued.length},clearTimeout(){},setInterval:realSetInterval,clearInterval(){}};
  const listeners=[];
  const root={classList:{contains(){return false}},getAttribute(){return'pick'},querySelector(){return null},querySelectorAll(){return[]}};
  const document={visibilityState:'visible',querySelector(s){return s==='#random'?root:null},addEventListener(type,fn,opts){listeners.push([type,fn,opts])}};
  class NativeMO{constructor(){this.native=true}observe(){}disconnect(){}}
  const context={window:null,document,MutationObserver:NativeMO,performance:{now:()=>0},Date,JSON,Math,Number,String,Array,Object,Set,Map,WeakMap,console,...timers,randomViewMode:'ingame',renderRandomDetails(){detailCalls++},renderRandomAnalysis(){analysisCalls++},randomState:{ourModes:{},enemyModes:{}},lolAutoSync:{lastState:null}};
  context.window=context;context.addEventListener=function(type,fn,opts){listeners.push([`window:${type}`,fn,opts])};
  vm.runInNewContext(owner,context);
  context.setInterval(()=>{},320);
  new context.MutationObserver(()=>{});
  vm.runInNewContext("document.addEventListener('click',function(){return '#random,.randomModeNav'},true)",context);
  context.renderRandomDetails();context.renderRandomAnalysis();
  const before=context.aramRandomIngameRuntimeV01570.getStats();
  ok('VM bootstrap suppresses historical recurring interval',before.counters.bootstrapIntervalsSuppressed===1,JSON.stringify(before.counters));
  ok('VM bootstrap suppresses historical subtree observer',before.counters.bootstrapObserversSuppressed===1,JSON.stringify(before.counters));
  ok('VM bootstrap suppresses historical random-wide click scheduler',before.counters.bootstrapClicksSuppressed===1,JSON.stringify(before.counters));
  ok('VM wrappers suppress hidden legacy in-game detail/analysis renderers',detailCalls===0&&analysisCalls===0&&before.counters.legacyDetailRendersSuppressed===1&&before.counters.legacyAnalysisRendersSuppressed===1,`${detailCalls}/${analysisCalls}`);
  context.aramRandomIngameRuntimeV01570.finishBootstrap();
  const after=context.aramRandomIngameRuntimeV01570.getStats();
  ok('VM finish installs exactly one real owner interval',realIntervals===1&&after.timer===true,`realIntervals=${realIntervals}`);
  ok('VM restores native interval and observer constructors after bootstrap',context.setInterval===realSetInterval&&context.MutationObserver===NativeMO);
  context.randomViewMode='pick';context.renderRandomDetails();context.renderRandomAnalysis();
  ok('VM preserves legacy renderers outside in-game mode',detailCalls===1&&analysisCalls===1,`${detailCalls}/${analysisCalls}`);
}catch(e){ok('v0.15.70 VM bootstrap simulation',false,e.stack||e.message)}

report.pass=report.checks.every(x=>x.pass);
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/runtime-stability-v01570-report.json'),JSON.stringify(report,null,2));
for(const c of report.checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);
if(!report.pass)process.exit(1);
