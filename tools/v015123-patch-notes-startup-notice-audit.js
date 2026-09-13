'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,n,label)=>{if(!String(src).includes(n))throw new Error(`v0.15.123 audit missing ${label}: ${n}`)};
const mustNot=(src,n,label)=>{if(String(src).includes(n))throw new Error(`v0.15.123 audit forbidden ${label}: ${n}`)};
const count=(src,n)=>String(src).split(n).length-1;
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.123 ${label} parse failed: ${e.message}`)}};
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};
const report={version:'0.15.123',score_logic_changed:false,random_scoring_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const dir='update/v0.15.123/';
const notice=read(dir+'patch-notes-startup-notice-v015123.js');
const rt=read(dir+'runtime-source-stability-v015123.js');
const main=read(dir+'main-v015123.js');
const pkg=JSON.parse(read(dir+'package.json'));
for(const [name,src] of [['startup notice',notice],['runtime successor',rt],['main successor',main]])parse(src,name);
if(pkg.version!=='0.15.123'||pkg.main!=='main-v015123.js')throw new Error('v0.15.123 package metadata mismatch');
ok('syntax-package');

for(const [n,l] of [
  ["STORAGE_KEY='aram.patchNotes.notice.dismissedVersion.v1'",'per-patch persistence key'],
  ["window.aramDataHubV01599?.patch?.version",'live patch version source'],
  ["safeGet(STORAGE_KEY)===String(ver||'').trim()",'exact-version dismissal check'],
  ["safeSet(STORAGE_KEY,String(ver||'').trim())",'explicit dismissal persistence'],
  ["패치노트 보러가기",'open Patch Notes action'],
  ["다시 보지 않기",'do-not-show action'],
  ["aramUiStabilityV015115?.syncData?.('patch')",'existing DATA owner routing'],
  ["[data-v115-tab=\"patch\"]",'restored DATA submenu target'],
  ["[data-dh99-tab=\"patch\"]",'legacy Patch Notes target fallback'],
  ["if(frames<12)requestAnimationFrame(settle)",'bounded route settling'],
  ["score_logic_changed:false",'scoring neutrality'],
  ["random_scoring_changed:false",'Random scoring neutrality']
])must(notice,n,l);
for(const [n,l] of [['setInterval(','interval loop'],['MutationObserver','mutation repair loop']])mustNot(notice,n,l);
ok('notice-source-contract');

const storage=new Map();
const attrs={};
const documentStub={
  readyState:'complete',
  querySelector:()=>null,
  querySelectorAll:()=>[],
  createElement:()=>({}),
  body:{appendChild:()=>{}},
  head:{appendChild:()=>{}},
  documentElement:{setAttribute:(k,v)=>{attrs[k]=v}},
  addEventListener:()=>{}
};
const sandbox={
  window:{aramDataHubV01599:{patch:{version:'26.18'}}},
  document:documentStub,
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))},
  requestAnimationFrame:()=>0,
  console
};
sandbox.window.window=sandbox.window;
vm.createContext(sandbox);
vm.runInContext(notice,sandbox,{filename:'patch-notes-startup-notice-v015123.js'});
const api=sandbox.window.aramPatchNotesStartupNoticeV015123;
if(!api||api.patchVersion()!=='26.18')throw new Error('notice API failed to resolve current patch version');
if(api.dismissed('26.18'))throw new Error('fresh patch unexpectedly dismissed');
if(!api.dismiss('26.18')||!api.dismissed('26.18'))throw new Error('current patch dismissal did not persist');
if(api.dismissed('26.19'))throw new Error('dismissal leaked into a future patch version');
ok('per-patch-dismissal-behavior');

for(const [n,l] of [
  ["require('../v0.15.122/runtime-source-stability-v015122')",'v122 predecessor'],
  ["NOTICE_SENTINEL='/* ARAM_PATCH_NOTES_STARTUP_NOTICE_V015123 */'",'single injection marker'],
  ["STATE_SENTINEL='/* ARAM_STATE_INTEGRITY_PAYLOAD_V015117 */'",'state suffix anchor'],
  ["file==='input-interaction-stability-v01539.js'",'single existing runtime target'],
  ["src.slice(0,stateAt)+NOTICE_SENTINEL",'insert before state-integrity suffix'],
  ["patch_notes_route_owner:'ui-stability-v015115'",'DATA owner preserved'],
  ["score_logic_changed:false",'runtime scoring neutrality']
])must(rt,n,l);
ok('runtime-source-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
if(map.size!==(manifest.files||[]).length)throw new Error('manifest duplicate installed path');
for(const f of manifest.files||[])if(!exists(f.source))throw new Error(`manifest source missing: ${f.path} -> ${f.source}`);
const base122=require(path.join(ROOT,'update/v0.15.122/runtime-source-stability-v015122.js'));
const next123=require(path.join(ROOT,'update/v0.15.123/runtime-source-stability-v015123.js'));
const inputSource=map.get('input-interaction-stability-v01539.js');
if(!inputSource||!exists(inputSource))throw new Error('active input-interaction source missing');
const oldInput=base122.patchRuntimeSource('input-interaction-stability-v01539.js',read(inputSource));
const newInput=next123.patchRuntimeSource('input-interaction-stability-v01539.js',read(inputSource));
parse(newInput,'transformed input interaction');
if(count(newInput,'/* ARAM_PATCH_NOTES_STARTUP_NOTICE_V015123 */')!==1)throw new Error('startup notice injection cardinality mismatch');
if(count(newInput,'/* ARAM_STATE_INTEGRITY_PAYLOAD_V015117 */')!==count(oldInput,'/* ARAM_STATE_INTEGRITY_PAYLOAD_V015117 */'))throw new Error('state integrity sentinel cardinality changed');
if(newInput.indexOf('/* ARAM_PATCH_NOTES_STARTUP_NOTICE_V015123 */')>newInput.indexOf('/* ARAM_STATE_INTEGRITY_PAYLOAD_V015117 */'))throw new Error('notice injected after state-integrity suffix');
if(oldInput===newInput)throw new Error('v0.15.123 did not inject startup notice');
ok('single-safe-runtime-injection');

for(const target of ['runtime-random-practice-v01572.js','random-practice-focus-v01549.js','runtime-live-autosync-v01571.js','riot-grade-ui-v01528.js','riot-grade-calibration-history-v01532.js']){
  const source=map.get(target);if(!source||!exists(source))throw new Error(`active source missing for unchanged target ${target}`);
  const a=base122.patchRuntimeSource(target,read(source)),b=next123.patchRuntimeSource(target,read(source));
  if(a!==b)throw new Error(`v0.15.123 unexpectedly changed ${target}`);
}
ok('random-autosync-riot-grade-byte-preserved');

for(const [n,l] of [
  ["path.join(__dirname,'main-v015122.js')",'v122 main predecessor'],
  ["runtime-source-stability-v015123",'v123 runtime route'],
  ["root:'main-v01579.js'",'permanent safety root']
])must(main,n,l);
ok('main-successor-contract');

const activation=read('tools/v015123-activate-patch-notes-startup-notice.js');
for(const [n,l] of [
  ["String(m.version)!=='0.15.122'",'guarded predecessor'],
  ["patch-notes-startup-notice-v015123.js",'notice manifest install'],
  ["runtime-source-stability-v015123.js",'runtime successor activation'],
  ["main-v015123.js",'main successor activation'],
  ["item5.status='code_complete_real_windows_pending'",'backlog item 5 status'],
  ["c.next_planned_work?.theme!=='SAFE MODE / CRASH-LOOP ISOLATION'",'continuity plan preservation']
])must(activation,n,l);
ok('activation-contract');

const active=String(manifest.version||'');
if(active==='0.15.123'){
  const expected={
    'patch-notes-startup-notice-v015123.js':'update/v0.15.123/patch-notes-startup-notice-v015123.js',
    'runtime-source-stability-v015123.js':'update/v0.15.123/runtime-source-stability-v015123.js',
    'main-v015123.js':'update/v0.15.123/main-v015123.js',
    'package.json':'update/v0.15.123/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`active v123 manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-v123-manifest');
}else if(active==='0.15.122')ok('preactivation-v122-manifest');
else if(ge(active,'0.15.123'))ok('newer-successor-manifest');
else throw new Error(`unexpected active manifest during v0.15.123 rollout: ${active}`);

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015123-patch-notes-startup-notice-report.json'),JSON.stringify({...report,status:'success',activeManifestVersion:active},null,2)+'\n');
console.log('v0.15.123 PATCH NOTES STARTUP NOTICE AUDIT: SUCCESS');
