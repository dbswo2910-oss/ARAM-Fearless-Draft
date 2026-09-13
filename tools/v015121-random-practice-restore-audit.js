'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,n,label)=>{if(!String(src).includes(n))throw new Error(`v0.15.121 audit missing ${label}: ${n}`)};
const mustNot=(src,n,label)=>{if(String(src).includes(n))throw new Error(`v0.15.121 audit forbidden ${label}: ${n}`)};
const count=(src,n)=>String(src).split(n).length-1;
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.121 ${label} parse failed: ${e.message}`)}};
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};
const report={version:'0.15.121',score_logic_changed:false,random_scoring_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const dir='update/v0.15.121/';
const rt=read(dir+'runtime-source-stability-v015121.js');
const loader=read(dir+'runtime-loader-v01579.js');
const main=read(dir+'main-v015121.js');
const pkg=JSON.parse(read(dir+'package.json'));
for(const [name,src] of [['runtime successor',rt],['runtime loader',loader],['main successor',main]])parse(src,name);
if(pkg.version!=='0.15.121'||pkg.main!=='main-v015121.js')throw new Error('v0.15.121 package metadata mismatch');
ok('syntax-package');

for(const [n,l] of [
  ["require('../v0.15.120/runtime-source-stability-v015120')",'v120 predecessor'],
  ["file==='runtime-random-practice-v01572.js'",'single Random coordinator target'],
  ['function restoreVisibleRandomPracticeV015121','entry/render restore'],
  ['function bindRandomPracticeEventsV015121','single event owner binder'],
  ['function unbindRandomPracticeEventsV015121','event owner disposer'],
  ["document.addEventListener('input',onInput,true)",'coalesced input refresh route'],
  ["#randomPickModeBtn,#randomIngameModeBtn",'exact Random mode transition route'],
  ["typeof renderRandomComboResults==='function'",'TOP5 result restore'],
  ["typeof renderComboDetail==='function'",'detail restore'],
  ['unbindRandomPracticeEventsV015121();','disposer integration'],
  ['__ARAM_RANDOM_PRACTICE_RESTORE_V015121__','restore readiness marker'],
  ["restore:()=>restoreVisibleRandomPracticeV015121('api')",'manual restore API'],
  ['random_practice_event_owner_disposable:true','lifecycle contract flag'],
  ["random_pick_owner:'runtime-v015100'",'existing PICK owner preserved'],
  ['score_logic_changed:false','score neutrality'],
  ['random_scoring_changed:false','Random score neutrality']
])must(rt,n,l);
mustNot(rt,"file==='random-practice-focus-v01549.js'",'new PICK DOM owner patch');
mustNot(rt,'MutationObserver','new subtree observer');
mustNot(rt,'setInterval(','new interval refresh loop');
ok('runtime-restore-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
if(map.size!==(manifest.files||[]).length)throw new Error('active manifest has duplicate output paths');
for(const f of manifest.files||[])if(!exists(f.source))throw new Error(`manifest source missing: ${f.path} -> ${f.source}`);
const deletes=new Set(manifest.delete||[]);for(const p of map.keys())if(deletes.has(p))throw new Error(`manifest installs and deletes ${p}`);

const base120=require(path.join(ROOT,'update/v0.15.120/runtime-source-stability-v015120.js'));
const next121=require(path.join(ROOT,dir+'runtime-source-stability-v015121.js'));
const randomSource=map.get('runtime-random-practice-v01572.js');
if(!randomSource||!exists(randomSource))throw new Error('active Random Practice runtime source missing');
const oldRandom=base120.patchRuntimeSource('runtime-random-practice-v01572.js',read(randomSource));
const newRandom=next121.patchRuntimeSource('runtime-random-practice-v01572.js',read(randomSource));
parse(oldRandom,'v120 transformed Random coordinator');parse(newRandom,'v121 transformed Random coordinator');
if(oldRandom===newRandom)throw new Error('v0.15.121 did not revise Random Practice coordinator');
if(count(newRandom,'/* ARAM_RANDOM_PRACTICE_RESTORE_V015121 */')!==1)throw new Error('v121 restore sentinel must exist exactly once');
if(count(newRandom,'__ARAM_RANDOM_PRACTICE_RESTORE_V015121__')!==1)throw new Error('v121 restore readiness marker must exist exactly once');
for(const n of [
  'function runCombosCooperative()',
  'function finishCombo(plan,raw,token)',
  'renderRandomComboResults()',
  'renderComboDetail()',
  'function scoreTeam(names,modes)',
  'teamScore(names,modes)',
  '/* ARAM_RESOURCE_LIFECYCLE_PATCH_V015118_RANDOM_PRACTICE */'
])must(newRandom,n,'preserved Random calculation/lifecycle path');
if(count(oldRandom,'function runCombosCooperative()')!==count(newRandom,'function runCombosCooperative()'))throw new Error('cooperative TOP5 calculator cardinality changed');
if(count(oldRandom,'teamScore(names,modes)')!==count(newRandom,'teamScore(names,modes)'))throw new Error('Random scoring call cardinality changed');
if(count(newRandom,"document.addEventListener('click',onClick,true)")!==1)throw new Error('Random click event owner is not singular');
if(count(newRandom,"document.addEventListener('change',onChange,true)")!==1)throw new Error('Random change event owner is not singular');
if(count(newRandom,"document.addEventListener('input',onInput,true)")!==1)throw new Error('Random input event owner is not singular');
mustNot(newRandom,"document.addEventListener('click',e=>{\n    if(!e.target?.closest?.('#random'))return;",'legacy anonymous Random click owner');
mustNot(newRandom,'MutationObserver','Random subtree observer regression');
mustNot(newRandom,'setInterval(','Random interval regression');
ok('transformed-random-runtime');

const focusSource=map.get('random-practice-focus-v01549.js');
if(!focusSource||!exists(focusSource))throw new Error('active Random PICK source missing');
const oldFocus=base120.patchRuntimeSource('random-practice-focus-v01549.js',read(focusSource));
const newFocus=next121.patchRuntimeSource('random-practice-focus-v01549.js',read(focusSource));
if(oldFocus!==newFocus)throw new Error('v0.15.121 unexpectedly changed v0.15.100 PICK DOM/selection owner');
for(const n of ['function applyCandidatePreviewV015100(','function restoreSelectedCandidatePreviewV015100(','function arrangeReferenceLayoutV01590('])must(newFocus,n,'stable PICK lineage');
ok('pick-owner-byte-preserved');

const inputSource=map.get('input-interaction-stability-v01539.js');
if(!inputSource||!exists(inputSource))throw new Error('active input interaction source missing');
const oldInput=base120.patchRuntimeSource('input-interaction-stability-v01539.js',read(inputSource));
const newInput=next121.patchRuntimeSource('input-interaction-stability-v01539.js',read(inputSource));
if(oldInput!==newInput)throw new Error('v0.15.121 unexpectedly changed DATA/UI/state/lifecycle owner payload');
ok('global-owner-payload-unchanged');

const autoSource=map.get('runtime-live-autosync-v01571.js');
if(!autoSource||!exists(autoSource))throw new Error('active AutoSync renderer source missing');
if(base120.patchRuntimeSource('runtime-live-autosync-v01571.js',read(autoSource))!==next121.patchRuntimeSource('runtime-live-autosync-v01571.js',read(autoSource)))throw new Error('v0.15.121 unexpectedly changed AutoSync renderer transform');
ok('autosync-transform-unchanged');

for(const [n,l] of [
  ["require('../v0.15.120/runtime-loader-v01579')",'v120 loader predecessor'],
  ["require('./runtime-loader-v015120')",'installed predecessor loader route'],
  ['randomPracticeRestore:Boolean(window.__ARAM_RANDOM_PRACTICE_RESTORE_V015121__)','restore readiness'],
  ['restoreApi:Boolean(typeof window.aramRandomPracticeRuntimeV01572?.restore','restore API readiness'],
  ["code:'SAFE-RT121'",'v121 safety failure code'],
  ['runtime-readiness-v015121.json','v121 diagnostic'],
  ['score_logic_changed:false','loader score neutrality']
])must(loader,n,l);
ok('runtime-readiness-gate');

for(const [n,l] of [
  ["path.join(__dirname,'main-v015120.js')",'v120 main predecessor'],
  ['runtime-source-stability-v015121','v121 runtime route'],
  ["root:'main-v01579.js'",'permanent safety root']
])must(main,n,l);
ok('main-successor-contract');

const activation=read('tools/v015121-activate-random-practice-restore.js');
for(const [n,l] of [
  ["String(m.version)!=='0.15.120'",'guarded predecessor version'],
  ["runtime-loader-v015120.js','update/v0.15.120/runtime-loader-v01579.js",'installed predecessor loader preservation'],
  ["runtime-source-stability-v015121.js",'v121 runtime activation'],
  ["main-v015121.js",'v121 main activation'],
  ["item2.status='code_complete_real_windows_pending'",'backlog state update'],
  ["c.next_planned_work?.theme!=='SAFE MODE / CRASH-LOOP ISOLATION'",'continuity plan preservation']
])must(activation,n,l);
ok('activation-contract');

const active=String(manifest.version||'');
if(active==='0.15.121'){
  const expected={
    'ui-stability-baseline-v015115.js':'update/v0.15.120/ui-stability-baseline-v015115.js',
    'runtime-loader-v01579.js':'update/v0.15.121/runtime-loader-v01579.js',
    'runtime-loader-v015120.js':'update/v0.15.120/runtime-loader-v01579.js',
    'runtime-source-stability-v015121.js':'update/v0.15.121/runtime-source-stability-v015121.js',
    'main-v015121.js':'update/v0.15.121/main-v015121.js',
    'package.json':'update/v0.15.121/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.121 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-v121-manifest');
}else if(active==='0.15.120')ok('preactivation-v120-manifest');
else if(ge(active,'0.15.121'))ok('newer-successor-manifest');
else throw new Error(`unexpected active manifest version during v0.15.121 rollout: ${active}`);

const retired=['ui-layout-restore-v015103.js','random-data-ui-hotfix-v015105.js','random-data-ui-hotfix-v015106.js','view-boundary-repair-v015107.js','data-random-hardfix-v015108.js','ui-screenshot-polish-v015109.js','patch-notes-density-v015110.js','random-dna-rail-v015111.js','random-workspace-stability-v015112.js','random-workspace-readable-v015113.js','random-pick-integrity-v015114.js'];
for(const p of retired)if(map.has(p))throw new Error(`retired Random/Data overlay reactivated: ${p}`);
ok('retired-overlays-stay-retired');

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015121-random-practice-restore-report.json'),JSON.stringify({...report,status:'success',activeManifestVersion:active},null,2)+'\n');
console.log('v0.15.121 RANDOM PRACTICE RESTORE AUDIT: SUCCESS');
