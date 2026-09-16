'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const {resolveCurrentRuntimeSource}=require('./current-runtime-source');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const report={version:'0.15.72-historical',generated_at:new Date().toISOString(),checks:[]};
const ok=(name,pass,detail='')=>report.checks.push({name,pass:!!pass,detail});
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};
const m=JSON.parse(read('update/manifest.json')),byPath=new Map((m.files||[]).map(x=>[x.path,x.source]));
const clean=m.clean_runtime_consolidated===true;
const get=target=>{const p=byPath.get(target);return p&&exists(p)?read(p):''};
const pkg=JSON.parse(get('package.json')||'{}'),entryPath=byPath.get('main.js'),entry=get('main.js'),runtimeMainPath=resolveCurrentRuntimeSource(ROOT,m),runtimeMain=read(runtimeMainPath);
const runtime=get('runtime-random-practice-v01572.js'),v79Entry=get('main-v01579.js');
const historicalEntry=exists('update/v0.15.72/main-v01572.js')?read('update/v0.15.72/main-v01572.js'):'';
const focus=get('random-practice-focus-v01549.js'),density=get('random-pick-density-v01555.js'),party=get('random-party-picks-v01558.js'),perf=get('runtime-performance-v01568.js');
const updater=get('in-app-updater-ui-v01523.js'),sticky=get('player-profile-data-sticky-v01521.js'),live=get('runtime-live-autosync-v01571.js');
for(const [n,s] of [['runtime',runtime],['current entry',entry],['effective runtime',runtimeMain],['v0.15.79 safety lineage',v79Entry],['historical v0.15.72 entry',historicalEntry],['focus',focus],['density',density],['party',party],['perf',perf],['updater',updater],['sticky',sticky],['live',live]]){try{new Function(s);ok(`${n} parses`,true)}catch(e){ok(`${n} parses`,false,e.message)}}
ok('manifest is v0.15.72 or newer',ge(m.version,'0.15.72'),m.version);
ok('package is v0.15.72 or newer',ge(pkg.version,'0.15.72'),pkg.version);
ok('current canonical entry delivered',!!entryPath&&exists(entryPath),entryPath||'missing');
ok('effective runtime delivered',!!runtimeMainPath&&exists(runtimeMainPath),runtimeMainPath||'missing');
ok('historical v0.15.72 entry remains available',!!historicalEntry);
ok('runtime delivered',byPath.get('runtime-random-practice-v01572.js')==='update/v0.15.72/runtime-random-practice-v01572.js');
ok('v0.15.79 safety lineage remains preserved',!!v79Entry);
if(clean){
  ok('clean package uses canonical main.js',pkg.main==='main.js',pkg.main||'missing');
  ok('clean entry records flattened no-wrapper lineage',entry.includes("legacySafetyRoot:'main-v01579.js'")&&entry.includes('flattened:true')&&entry.includes('runtimeSuccessorWrappers:false'));
  ok('clean entry directly preserves v0.15.71 core governor',entry.includes("require('./autosync-live-runtime-v01571').patch(autosyncCore)"));
  ok('flattened runtime directly injects Random v0.15.72 after party pool labels',runtimeMain.includes("'random-party-pool-labels-v01562.js','runtime-random-practice-v01572.js','item-art-hotfix-v01563.js'"));
  ok('flattened runtime readiness directly includes v0.15.72 runtime',runtimeMain.includes('__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__'));
  ok('flattened runtime directly injects v0.15.71 renderer governor',runtimeMain.includes("'runtime-performance-v01568.js','runtime-live-autosync-v01571.js','live-strength-v01513.js'"));
  ok('clean runtime version is current manifest version',runtimeMain.includes(`const VERSION='${m.version}'`),m.version);
  ok('clean entry/runtime do not compile successor source',!entry.includes('module._compile(')&&!runtimeMain.includes('module._compile('));
}else{
  ok('historical v0.15.72 entry injects Random owner',historicalEntry.includes("'random-party-pool-labels-v01562.js','runtime-random-practice-v01572.js','item-art-hotfix-v01563.js'"));
  ok('historical v0.15.72 readiness includes runtime',historicalEntry.includes('__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__'));
}
ok('historical v0.15.79 lineage preserves Random v0.15.72 injection',v79Entry.includes("'random-party-pool-labels-v01562.js','runtime-random-practice-v01572.js'"));
ok('historical v0.15.79 lineage readiness includes v0.15.72 runtime',v79Entry.includes('__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__'));
ok('historical v0.15.79 lineage preserves v0.15.71 core governor',v79Entry.includes("require('./autosync-live-runtime-v01571').patch(autosyncCore)"));

ok('v49 recurring subtree observer removed',!focus.includes('new MutationObserver('));
ok('v55 observer removed',!density.includes('new MutationObserver('));
ok('v55 broad document click/input refresh removed',!density.includes("document.addEventListener('click'")&&!density.includes("document.addEventListener('input'"));
ok('v58 observer removed',!party.includes('new MutationObserver('));
ok('v58 interval removed',!party.includes('setInterval('));
ok('v58 broad document click/input refresh removed',!party.includes("document.addEventListener('click'")&&!party.includes("document.addEventListener('input'"));
ok('v58 has team-minus-external fallback',party.includes('for(const n of unique(s.team||[]))')&&party.includes('external.has(n)'));
ok('v68 Random observer removed',!perf.includes('new MutationObserver('));
ok('v68 broad Random document listeners removed',!perf.includes("document.addEventListener('input'")&&!perf.includes("document.addEventListener('change'")&&!perf.includes("document.addEventListener('click'"));
ok('updater exact badge binding',updater.includes("document.getElementById('topUpdateBadge')"));
ok('updater no whole-document MutationObserver',!updater.includes('new MutationObserver('));
ok('updater no layout-wide getBoundingClientRect scan',!updater.includes('getBoundingClientRect'));
ok('Data sticky exits outside active Data view',sticky.includes("if(!dataView?.classList?.contains('active'))return false"));
ok('Data sticky observer scoped to dataView',sticky.includes("obs.observe(dataView,{childList:true,subtree:true})"));
ok('Data sticky click listener scoped to #data',sticky.includes("#data [class*=\"champ\"]"));
ok('Data sticky no body observer',!sticky.includes('obs.observe(document.body'));
ok('Random runtime has no MutationObserver',!runtime.includes('MutationObserver'));
ok('Random runtime has no recurring interval',!runtime.includes('setInterval('));
ok('Random runtime coalesces compatibility refresh',runtime.includes('scheduleMaintenance')&&runtime.includes('aramRandomPracticeFocusV01549?.refresh')&&runtime.includes('aramRandomPartyPicksV01558?.refresh'));
ok('TOP5 computation is cooperative',runtime.includes('function* comboIter')&&runtime.includes('setTimeout(step,0)')&&runtime.includes('now()-a<11'));
ok('TOP5 keeps only five rows during exhaustive enumeration',runtime.includes('if(top.length>5)top.pop()'));
ok('TOP5 tie order preserved',runtime.includes("localeCompare(b.party.join('|'),'ko')"));
ok('heavy Random analysis/details are deferred in pick view',runtime.includes('scheduleAnalysis')&&runtime.includes('scheduleDetails')&&runtime.includes('pickVisible()'));
ok('score logic unchanged flag',runtime.includes('score_logic_changed:false'));
ok('live AutoSync forwards state without extra polling',live.includes('aramRandomPracticeRuntimeV01572?.onAutoSyncState?.(out)')&&!live.includes('setInterval(()=>window.aramRandomPracticeRuntimeV01572'));

async function vmTest(){
  const listeners={};
  const result={innerHTML:'',firstChild:{textContent:''}},detail={innerHTML:''},random={classList:{contains:x=>x==='active'},getAttribute:()=> 'pick'};
  const document={visibilityState:'visible',querySelector(sel){if(sel==='#random.active')return random;if(sel==='#random')return random;if(sel==='#comboResults')return result;if(sel==='#comboDetail')return detail;if(sel==='[data-rp72-progress]')return null;return null},addEventListener(t,fn){(listeners[t]??=[]).push(fn)}};
  const names=['A','B','C','D','E'];const randomState={ourModes:{},combos:[],selectedCombo:0,shortlist:[],lastComboCount:0};const score=xs=>xs.reduce((a,x)=>a+x.charCodeAt(0),0);
  const ctx={window:null,document,performance:{now:()=>Date.now()},PerformanceObserver:undefined,setTimeout,clearTimeout,Date,Math,Set,Map,Object,String,Number,Array,JSON,console,randomViewMode:'pick',randomState,randomDraftPlan:()=>({queue:2,external:['X','Y','Z'],locked:[],needed:2,pool:names,duplicates:[],provisional:false,totalCombos:10}),teamScore:xs=>({s:score(xs),direction:'d',reason:'r',warning:'w',structure:'s',parts:{},pair:{}}),renderRandomInputs(){},renderRandomAnalysis(){},renderRandomDetails(){},runRandomCombos(){},renderRandomComboResults(){},renderComboDetail(){},renderExternalCheck(){},persist(){}};
  ctx.window=ctx;ctx.window.addEventListener=()=>{};ctx.window.aramRandomPracticeFocusV01549={refresh(){}};ctx.window.aramRandomPickDensityV01555={refresh(){}};ctx.window.aramRandomPartyPicksV01558={refresh(){}};ctx.window.aramRuntimePerformanceV01568={refresh(){}};
  vm.runInNewContext(runtime,ctx);ctx.window.runRandomCombos();await new Promise(r=>setTimeout(r,120));
  const brute=[];for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){const party=[names[i],names[j]],xs=['X','Y','Z',...party];brute.push({party,score:score(xs)})}brute.sort((a,b)=>b.score-a.score||a.party.join('|').localeCompare(b.party.join('|'),'ko'));
  ok('VM cooperative TOP5 produces exact exhaustive ranking',JSON.stringify(randomState.combos.map(x=>[x.party,x.score]))===JSON.stringify(brute.slice(0,5).map(x=>[x.party,x.score])),JSON.stringify(randomState.combos.map(x=>[x.party,x.score])));
  ok('VM reports all ten combinations processed',ctx.window.aramRandomPracticeRuntimeV01572.getStats().counters.comboTeams===10,String(ctx.window.aramRandomPracticeRuntimeV01572.getStats().counters.comboTeams));
}
(async()=>{try{await vmTest()}catch(e){ok('VM cooperative calculation test',false,e.stack||e.message)}report.pass=report.checks.every(x=>x.pass);fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output','runtime-stability-v01572-report.json'),JSON.stringify(report,null,2));for(const c of report.checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exit(1)})();
