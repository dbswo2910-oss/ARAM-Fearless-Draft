'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const j=p=>JSON.parse(read(p));
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const manifest=j('update/manifest.json');
const main=read('update/v0.15.67/main.js');
const pkg=j('update/v0.15.67/package.json');
const perf=read('update/v0.15.67/runtime-performance-v01567.js');
for(const [name,code] of [['main',main],['runtime-performance',perf]]){try{new Function(code);ok(`${name} parses`,true)}catch(e){ok(`${name} parses`,false,e.message)}}
ok('manifest version 0.15.67',manifest.version==='0.15.67',manifest.version);
ok('package version 0.15.67',pkg.version==='0.15.67',pkg.version);
ok('manifest maps current main',manifest.files.some(x=>x.path==='main.js'&&x.source==='update/v0.15.67/main.js'));
ok('manifest maps performance runtime',manifest.files.some(x=>x.path==='runtime-performance-v01567.js'&&x.source==='update/v0.15.67/runtime-performance-v01567.js'));
const accelAt=main.indexOf("app.disableHardwareAcceleration()");
const readyAt=main.indexOf('app.whenReady()');
ok('Windows hardware acceleration safe mode is synchronous',accelAt>=0&&readyAt>accelAt,`${accelAt}/${readyAt}`);
ok('hardware acceleration opt-in override exists',main.includes("ARAM_ENABLE_HARDWARE_ACCELERATION!=='1'"));
const perfAt=main.indexOf("'runtime-performance-v01567.js'");
const v59At=main.indexOf("'random-party-labels-v01559.js'");
const v61At=main.indexOf("'random-party-label-fix-v01561.js'");
const v62At=main.indexOf("'random-party-pool-labels-v01562.js'");
ok('performance runtime loads before historical party-label layers',perfAt>=0&&perfAt<v59At&&perfAt<v61At&&perfAt<v62At,`${perfAt}/${v59At}/${v61At}/${v62At}`);
ok('main pauses renderer maintenance on move/resize',main.includes("mainWindow.on('move',pulsePerfBusy)")&&main.includes("mainWindow.on('resize',pulsePerfBusy)")&&main.includes('setPerfBusy(true)'));
ok('timer hook is restored after overlay bootstrap',main.includes('restoreTimerHook?.()'));
ok('performance runtime preempts v59/v61/v62',perf.includes('__ARAM_RANDOM_PARTY_LABELS_V01559__=true')&&perf.includes('__ARAM_RANDOM_PARTY_LABEL_FIX_V01561__=true')&&perf.includes('__ARAM_RANDOM_PARTY_POOL_LABELS_V01562__=true'));
ok('performance runtime has no recurring interval',!perf.includes('setInterval(sync')&&!/setInterval\s*\([^)]*,\s*\d+\s*\)/.test(perf));
ok('performance runtime clamps sub-second overlay intervals',perf.includes('requested<900?900:requested'));
ok('performance runtime busy flag gates governed timers',perf.includes("if(busy){counters.busySkips++;return}"));
ok('final pool team-pick contract preserved',perf.includes("badge.textContent='팀원픽'")&&perf.includes("const taken=!!$('.randomPoolTakenBadge',item)")&&perf.includes("visible_location:'remaining-random-pool-slot'"));
ok('exact death-shop identical paints are deduplicated',perf.includes("this?.id==='riShopPlannerV01553'")&&perf.includes('dedupedShopPaints'));
ok('historical death-shop source remains immutable in manifest',manifest.files.some(x=>x.path==='random-ingame-shop-v01553.js'&&x.source==='update/v0.15.53/random-ingame-shop-v01553.js'));
ok('score-neutral metadata preserved',perf.includes('score_logic_changed:false'));

// VM bootstrap simulation: performance runtime first, then historical v59/v61/v62.
let observers=0,intervals=0;
const dummyEl=()=>({style:{display:'',removeProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},dataset:{},appendChild(){},remove(){},querySelector(){return null},querySelectorAll(){return[]},closest(){return null},setAttribute(){},parentElement:null,previousElementSibling:null,textContent:'',value:''});
const rootEl=dummyEl(),head=dummyEl(),body=dummyEl();
const document={head,body,documentElement:rootEl,visibilityState:'visible',createElement:()=>dummyEl(),getElementById:id=>id==='random'?rootEl:null,querySelector:s=>s==='#random'?rootEl:null,querySelectorAll:()=>[],addEventListener(){},contains(){return true}};
const context={window:null,document,randomState:{manual:[]},MutationObserver:class{constructor(){observers++}observe(){}disconnect(){}},setTimeout(fn){return 1},clearTimeout(){},setInterval(){intervals++;return intervals},clearInterval(){},performance:{now:()=>0},console,Set,Map,WeakMap,Array,Object,String,Number,Math,Date,JSON,URL};
context.window=context;context.addEventListener=()=>{};context.setInterval=context.setInterval.bind(context);
try{
  vm.runInNewContext(perf,context);
  vm.runInNewContext(read('update/v0.15.59/random-party-labels-v01559.js'),context);
  vm.runInNewContext(read('update/v0.15.61/random-party-label-fix-v01561.js'),context);
  vm.runInNewContext(read('update/v0.15.62/random-party-pool-labels-v01562.js'),context);
  ok('legacy party-label VM installs no recurring interval',intervals===0,`intervals=${intervals}`);
  ok('legacy party-label VM keeps at most one scoped observer',observers<=1,`observers=${observers}`);
}catch(e){ok('legacy party-label VM simulation',false,e.stack||e.message)}

const report={version:'0.15.67',generated_at:new Date().toISOString(),pass:checks.every(x=>x.pass),checks};
fs.mkdirSync(path.join(root,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(root,'audit-output/runtime-stability-v01567-report.json'),JSON.stringify(report,null,2));
for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);
if(!report.pass)process.exit(1);
