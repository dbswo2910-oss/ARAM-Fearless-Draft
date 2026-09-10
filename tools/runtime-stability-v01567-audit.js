'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const j=p=>JSON.parse(read(p));
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};
const manifest=j('update/manifest.json');
const byPath=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const historicalMainPath='update/v0.15.67/main.js',historicalPkgPath='update/v0.15.67/package.json',historicalPerfPath='update/v0.15.67/runtime-performance-v01567.js';
const main=exists(historicalMainPath)?read(historicalMainPath):'',pkg=exists(historicalPkgPath)?j(historicalPkgPath):{},perf=exists(historicalPerfPath)?read(historicalPerfPath):'';
const currentMainPath=byPath.get('main.js'),currentPkgPath=byPath.get('package.json');
const currentMain=currentMainPath&&exists(currentMainPath)?read(currentMainPath):'',currentPkg=currentPkgPath&&exists(currentPkgPath)?j(currentPkgPath):{};
for(const [name,code] of [['historical v0.15.67 main',main],['historical v0.15.67 runtime-performance',perf],['current main',currentMain]]){try{new Function(code);ok(`${name} parses`,true)}catch(e){ok(`${name} parses`,false,e.message)}}
ok('manifest is v0.15.67 or newer',ge(manifest.version,'0.15.67'),manifest.version);
ok('historical v0.15.67 main remains available',exists(historicalMainPath));
ok('historical v0.15.67 package remains available',exists(historicalPkgPath));
ok('historical v0.15.67 performance runtime remains available',exists(historicalPerfPath));
ok('historical package version is v0.15.67',pkg.version==='0.15.67',pkg.version);
ok('historical Windows software-rendering experiment is documented in source',main.includes("app.disableHardwareAcceleration()")&&main.includes("ARAM_ENABLE_HARDWARE_ACCELERATION!=='1'"));
ok('historical v0.15.67 move/resize busy gating existed',main.includes("mainWindow.on('move',pulsePerfBusy)")&&main.includes("mainWindow.on('resize',pulsePerfBusy)"));
ok('historical v0.15.67 runtime preempted v59/v61/v62',perf.includes('__ARAM_RANDOM_PARTY_LABELS_V01559__=true')&&perf.includes('__ARAM_RANDOM_PARTY_LABEL_FIX_V01561__=true')&&perf.includes('__ARAM_RANDOM_PARTY_POOL_LABELS_V01562__=true'));
ok('historical v0.15.67 clamped sub-second maintenance intervals',perf.includes('requested<900?900:requested'));
ok('historical v0.15.67 shop dedupe remains present',perf.includes("this?.id==='riShopPlannerV01553'")&&perf.includes('dedupedShopPaints'));
ok('historical v0.15.67 was score-neutral',perf.includes('score_logic_changed:false'));
ok('current main is delivered',!!currentMainPath&&exists(currentMainPath),currentMainPath||'missing');
ok('current package is delivered',!!currentPkgPath&&exists(currentPkgPath),currentPkgPath||'missing');
const currentVersion=(currentMain.match(/const VERSION='([^']+)'/)||[])[1]||'';
ok('current main is v0.15.67 or newer',ge(currentVersion,'0.15.67'),currentVersion);
ok('current package is v0.15.67 or newer',ge(currentPkg.version,'0.15.67'),currentPkg.version);

// Historical VM simulation remains useful even when newer versions supersede the native strategy.
let observers=0,intervals=0;
const dummyEl=()=>({style:{display:'',removeProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},dataset:{},appendChild(){},remove(){},querySelector(){return null},querySelectorAll(){return[]},closest(){return null},setAttribute(){},parentElement:null,previousElementSibling:null,textContent:'',value:''});
const rootEl=dummyEl(),head=dummyEl(),body=dummyEl();
const document={head,body,documentElement:rootEl,visibilityState:'visible',createElement:()=>dummyEl(),getElementById:id=>id==='random'?rootEl:null,querySelector:s=>s==='#random'?rootEl:null,querySelectorAll:()=>[],addEventListener(){},contains(){return true}};
const context={window:null,document,randomState:{manual:[]},MutationObserver:class{constructor(){observers++}observe(){}disconnect(){}},setTimeout(fn){return 1},clearTimeout(){},setInterval(){intervals++;return intervals},clearInterval(){},performance:{now:()=>0},console,Set,Map,WeakMap,Array,Object,String,Number,Math,Date,JSON,URL};
context.window=context;context.addEventListener=()=>{};context.setInterval=context.setInterval.bind(context);
try{
  vm.runInNewContext(perf,context);
  for(const p of ['update/v0.15.59/random-party-labels-v01559.js','update/v0.15.61/random-party-label-fix-v01561.js','update/v0.15.62/random-party-pool-labels-v01562.js'])vm.runInNewContext(read(p),context);
  ok('historical v0.15.67 VM installs no recurring party-label interval',intervals===0,`intervals=${intervals}`);
  ok('historical v0.15.67 VM keeps at most one scoped party-label observer',observers<=1,`observers=${observers}`);
}catch(e){ok('historical v0.15.67 VM simulation',false,e.stack||e.message)}

const report={version:'0.15.67-historical',generated_at:new Date().toISOString(),pass:checks.every(x=>x.pass),checks,info:{forwardCompatible:true,scope:'Historical v0.15.67 responsiveness experiment remains regression-covered while newer versions may replace its native move/rendering strategy.'}};
fs.mkdirSync(path.join(root,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(root,'audit-output/runtime-stability-v01567-report.json'),JSON.stringify(report,null,2));
for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);
if(!report.pass)process.exit(1);
