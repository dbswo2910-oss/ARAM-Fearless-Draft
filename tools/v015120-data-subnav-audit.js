'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,n,label)=>{if(!String(src).includes(n))throw new Error(`v0.15.120 audit missing ${label}: ${n}`)};
const mustNot=(src,n,label)=>{if(String(src).includes(n))throw new Error(`v0.15.120 audit forbidden ${label}: ${n}`)};
const count=(src,n)=>String(src).split(n).length-1;
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.120 ${label} parse failed: ${e.message}`)}};
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};
const report={version:'0.15.120',score_logic_changed:false,random_scoring_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const dir='update/v0.15.120/';
const ui=read(dir+'ui-stability-baseline-v015115.js');
const rt=read(dir+'runtime-source-stability-v015120.js');
const loader=read(dir+'runtime-loader-v01579.js');
const main=read(dir+'main-v015120.js');
const pkg=JSON.parse(read(dir+'package.json'));
for(const [name,src] of [['maintained DATA owner',ui],['runtime successor',rt],['runtime loader',loader],['main successor',main]])parse(src,name);
if(pkg.version!=='0.15.120'||pkg.main!=='main-v015120.js')throw new Error('v0.15.120 package metadata mismatch');
ok('syntax-package');

for(const [n,l] of [
  ['__ARAM_UI_STABILITY_BASELINE_V015115__','single-owner marker preserved'],
  ['__ARAM_DATA_SUBNAV_RESTORE_V015120__','v120 presentation marker'],
  ["data:'ui-stability-v015115'",'DATA owner unchanged'],
  ["const view=$('#data'),card=$('#dataCard')",'exact DATA roots'],
  ["$$('.panel',view)",'view-scoped tier browser discovery'],
  ['function nearestCommonWithin(view,a,b)','shared DATA host resolver'],
  ['const host=nearestCommonWithin(view,tierPanel,card)','tier/detail common host selection'],
  ['if(!tierBranch||!detailBranch||tierBranch===detailBranch)return null','sibling branch contract'],
  ['p.host.insertBefore(nav,p.host.firstChild)','submenu inserted in common host'],
  ['grid-column:1/-1!important;display:flex','submenu spans both DATA columns'],
  ['data115PatchMode .data115TierBranch{display:none!important}','tier branch hidden in Patch Notes'],
  ['data115PatchMode .data115DetailBranch{grid-column:1/-1!important','Patch Notes detail branch full width'],
  ['data115PatchMode .data115DataHost{grid-template-columns:minmax(0,1fr)!important}','Patch Notes owns workspace'],
  ['presentationRevision:PRESENTATION','diagnostic presentation revision'],
  ['dom_reparent_on_interaction:false','no interaction reparent loop'],
  ['score_logic_changed:false','scoring neutrality'],
  ['random_scoring_changed:false','Random scoring neutrality']
])must(ui,n,l);
for(const [n,l] of [
  ["card.closest('.grid2')",'old right-column-only host discovery'],
  ["$$('.panel').find",'document-wide panel discovery'],
  ['setInterval(','timer repair loop'],['setTimeout(','timer repair loop'],['MutationObserver','mutation repair loop'],['requestAnimationFrame(','frame repair loop'],
  ['__ARAM_UI_LAYOUT_RESTORE_V015103__','retired v103 overlay'],['__ARAM_DATA_RANDOM_HARDFIX_V015108__','retired v108 overlay']
])mustNot(ui,n,l);
ok('data-submenu-owner-contract');

function functionText(src,name){
  const start=src.indexOf(`function ${name}(`);if(start<0)throw new Error(`function missing: ${name}`);
  const brace=src.indexOf('{',start);let depth=0;
  for(let i=brace;i<src.length;i++){
    if(src[i]==='{')depth++;
    else if(src[i]==='}'&&--depth===0)return src.slice(start,i+1);
  }
  throw new Error(`unterminated function: ${name}`);
}
const oldUi=read('update/v0.15.115/ui-stability-baseline-v015115.js');
if(functionText(ui,'claimRandom')!==functionText(oldUi,'claimRandom'))throw new Error('v0.15.120 changed RANDOM ownership code while repairing DATA');
ok('random-owner-byte-preserved');

must(rt,"require('../v0.15.119/runtime-source-stability-v015119')",'v119 predecessor');
must(rt,'replaceUiOwnerPayload(src)','existing-owner payload replacement');
must(rt,"file==='input-interaction-stability-v01539.js'",'single owner injection target');
must(rt,"data_view_owner:'ui-stability-v015115'",'DATA owner identity preserved');
must(rt,"data_presentation_revision:'0.15.120'",'v120 presentation revision');
must(rt,"random_pick_owner:'runtime-v015100'",'Random owner preserved');
must(rt,"autosync_main_owner:'autosync-concurrency-v015119'",'AutoSync owner preserved');
must(rt,'score_logic_changed:false','runtime scoring neutrality');
mustNot(rt,"file==='brand-header-v01538.js'",'second global UI injection');
ok('runtime-owner-lineage');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
if(map.size!==(manifest.files||[]).length)throw new Error('active manifest has duplicate output paths');
for(const f of manifest.files||[])if(!exists(f.source))throw new Error(`manifest source missing: ${f.path} -> ${f.source}`);
const deletes=new Set(manifest.delete||[]);for(const p of map.keys())if(deletes.has(p))throw new Error(`manifest installs and deletes ${p}`);
const base119=require(path.join(ROOT,'update/v0.15.119/runtime-source-stability-v015119.js'));
const next120=require(path.join(ROOT,dir+'runtime-source-stability-v015120.js'));
const inputSource=map.get('input-interaction-stability-v01539.js');
if(!inputSource||!exists(inputSource))throw new Error('active input-interaction source missing');
const oldInput=base119.patchRuntimeSource('input-interaction-stability-v01539.js',read(inputSource));
const newInput=next120.patchRuntimeSource('input-interaction-stability-v01539.js',read(inputSource));
parse(newInput,'transformed input interaction');
if(count(newInput,'/* ARAM_UI_STABILITY_OWNER_PAYLOAD_V015115 */')!==1)throw new Error('v120 must retain exactly one DATA/UI owner payload');
if(count(newInput,'__ARAM_UI_STABILITY_BASELINE_V015115__')!==1)throw new Error('v115 owner marker must occur exactly once in transformed target');
if(count(newInput,'__ARAM_DATA_SUBNAV_RESTORE_V015120__')<1)throw new Error('v120 submenu marker missing from transformed target');
if(oldInput===newInput)throw new Error('v120 did not replace the DATA owner presentation payload');
ok('single-owner-transformed-payload');

const focusSource=map.get('random-practice-focus-v01549.js');
if(!focusSource||!exists(focusSource))throw new Error('active Random Practice source missing');
const oldRandom=base119.patchRuntimeSource('random-practice-focus-v01549.js',read(focusSource));
const newRandom=next120.patchRuntimeSource('random-practice-focus-v01549.js',read(focusSource));
if(oldRandom!==newRandom)throw new Error('v0.15.120 unexpectedly changed Random Practice transformed runtime');
ok('random-runtime-unchanged');

const autoSource=map.get('runtime-live-autosync-v01571.js');
if(!autoSource||!exists(autoSource))throw new Error('active renderer AutoSync source missing');
const oldAuto=base119.patchRuntimeSource('runtime-live-autosync-v01571.js',read(autoSource));
const newAuto=next120.patchRuntimeSource('runtime-live-autosync-v01571.js',read(autoSource));
if(oldAuto!==newAuto)throw new Error('v0.15.120 unexpectedly changed AutoSync renderer transform');
ok('autosync-transform-unchanged');

for(const [n,l] of [
  ['dataSubnav:Boolean(window.__ARAM_DATA_SUBNAV_RESTORE_V015120__)','v120 submenu readiness'],
  ["code:'SAFE-RT120'",'v120 safety failure code'],
  ['runtime-readiness-v015120.json','v120 readiness diagnostic'],
  ['autoSyncConcurrency:Boolean(window.__ARAM_AUTOSYNC_CONCURRENCY_V015119__)','v119 concurrency preservation'],
  ['resourceLifecycle:Boolean(window.__ARAM_RESOURCE_LIFECYCLE_V015118__)','v118 lifecycle preservation'],
  ['score_logic_changed:false','loader scoring neutrality']
])must(loader,n,l);
ok('runtime-readiness-gate');

must(main,"path.join(__dirname,'main-v015119.js')",'v119 main predecessor');
must(main,'runtime-source-stability-v015120','v120 runtime target');
must(main,"root:'main-v01579.js'",'permanent safety lineage');
ok('main-successor-contract');

const activation=read('.github/workflows/v015120-activate-data-subnav.yml');
must(activation,'node tools/sync-current-state.js','v120 continuity snapshot sync');
must(activation,'node tools/ai-continuity-audit.js','v120 continuity audit');
must(activation,"replace('ui-stability-baseline-v015115.js','update/v0.15.120/ui-stability-baseline-v015115.js')",'active owner source replacement');
ok('activation-continuity-contract');

const active=String(manifest.version||'');
if(active==='0.15.120'){
  const expected={
    'ui-stability-baseline-v015115.js':'update/v0.15.120/ui-stability-baseline-v015115.js',
    'runtime-loader-v01579.js':'update/v0.15.120/runtime-loader-v01579.js',
    'runtime-source-stability-v015120.js':'update/v0.15.120/runtime-source-stability-v015120.js',
    'main-v015120.js':'update/v0.15.120/main-v015120.js',
    'package.json':'update/v0.15.120/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.120 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-v120-manifest');
}else if(active==='0.15.119')ok('preactivation-v119-manifest');
else if(ge(active,'0.15.120'))ok('newer-successor-manifest');
else throw new Error(`unexpected active manifest version during v0.15.120 rollout: ${active}`);

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015120-data-subnav-report.json'),JSON.stringify({...report,status:'success',activeManifestVersion:active},null,2)+'\n');
console.log('v0.15.120 DATA SUBNAV AUDIT: SUCCESS');
