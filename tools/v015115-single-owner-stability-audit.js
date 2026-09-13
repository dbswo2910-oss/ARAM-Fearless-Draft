'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,n,label)=>{if(!String(src).includes(n))throw new Error(`v0.15.115 audit missing ${label}: ${n}`)};
const mustNot=(src,n,label)=>{if(String(src).includes(n))throw new Error(`v0.15.115 audit forbidden ${label}: ${n}`)};
const count=(src,n)=>String(src).split(n).length-1;
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.115 ${label} parse failed: ${e.message}`)}};
const report={version:'0.15.115',score_logic_changed:false,random_scoring_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const ui=read('update/v0.15.115/ui-stability-baseline-v015115.js');
const rt=read('update/v0.15.115/runtime-source-stability-v015115.js');
const main=read('update/v0.15.115/main-v015115.js');
const pkg=JSON.parse(read('update/v0.15.115/package.json'));
parse(ui,'UI baseline');parse(rt,'runtime baseline');parse(main,'main successor');ok('syntax');

[
  ['__ARAM_UI_STABILITY_BASELINE_V015115__','readiness marker'],
  ["random:'random-focus-v015100'",'Random owner declaration'],
  ["data:'ui-stability-v015115'",'Data owner declaration'],
  ['#random[data-random-mode="ingame"] .randomPickOnly','PICK/INGAME hard boundary'],
  ['#random[data-random-mode="pick"] .randomInGameOnly','INGAME/PICK hard boundary'],
  ['#data.data115View','exact DATA scope'],
  ['#dataPatchNotesV01599 #dh99ChampionGrid','patch-note portrait scope'],
  ['function claimRandom()','Random ownership diagnostics'],
  ['function syncData(requested)','Data single-owner sync'],
  ['function audit()','runtime ownership audit'],
  ['dom_reparent_on_interaction:false','interaction reparent contract'],
  ['score_logic_changed:false','scoring preservation'],
  ['random_scoring_changed:false','Random scoring preservation']
].forEach(([n,l])=>must(ui,n,l));
[
  'setInterval(',
  'setTimeout(',
  'requestAnimationFrame(',
  'MutationObserver',
  'stabilizePick',
  'rp107Right',
  'rp112Right',
  'randomInputAnchor>.rp',
  "e.target?.closest?.('#random')"
].forEach(n=>mustNot(ui,n,'late repair/reparent loop'));
ok('single-owner-ui-contract');

must(rt,"require('../v0.15.100/runtime-source-stability-v015100')",'pre-overlay v0.15.100 baseline');
must(rt,"file==='input-interaction-stability-v01539.js'",'single global owner injection target');
must(rt,"random_pick_owner:'runtime-v015100'",'Random owner declaration');
must(rt,'legacy_ui_overlay_stack_removed:true','legacy overlay reset flag');
must(rt,'interaction_reparent_loops_removed:true','reparent-loop reset flag');
must(rt,'score_logic_changed:false','runtime score preservation');
mustNot(rt,"require('../v0.15.114/runtime-source-stability-v015114')",'v0.15.114 overlay lineage');
mustNot(rt,"file==='brand-header-v01538.js'",'redundant second global injection');
ok('runtime-lineage-contract');

must(main,"path.join(__dirname,'main-v015114.js')",'main-process v0.15.114 predecessor');
must(main,'runtime-source-stability-v015115','v0.15.115 runtime target');
must(main,"root:'main-v01579.js'",'permanent safety baseline lineage');
if(pkg.version!=='0.15.115'||pkg.main!=='main-v015115.js')throw new Error('v0.15.115 package metadata mismatch');
ok('main-package-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
if(map.size!==(manifest.files||[]).length)throw new Error('active manifest has duplicate output paths');
for(const f of manifest.files||[])if(!exists(f.source))throw new Error(`manifest source missing: ${f.path} -> ${f.source}`);
const deletes=new Set(manifest.delete||[]);
for(const p of map.keys())if(deletes.has(p))throw new Error(`manifest both installs and deletes ${p}`);
ok('manifest-integrity');

const runtime=require(path.join(ROOT,'update/v0.15.115/runtime-source-stability-v015115.js'));
const focusSource=map.get('random-practice-focus-v01549.js');
if(!focusSource||!exists(focusSource))throw new Error('active Random Practice focus source missing');
const randomOut=runtime.patchRuntimeSource('random-practice-focus-v01549.js',read(focusSource));
parse(randomOut,'final Random Practice payload');
[
  '__ARAM_RANDOM_PRACTICE_FOCUS_V01549__',
  'function arrangeReferenceLayoutV01590(',
  'function candidateDnaPreviewV01594(',
  'function applyCandidatePreviewV015100(',
  'function restoreSelectedCandidatePreviewV015100('
].forEach(n=>must(randomOut,n,'v0.15.100 stable Random lineage'));

const oldMarkers=[
  '__ARAM_UI_LAYOUT_RESTORE_V015103__',
  '__ARAM_RANDOM_DATA_HOTFIX_V015105__',
  '__ARAM_RANDOM_DATA_HOTFIX_V015106__',
  '__ARAM_VIEW_BOUNDARY_REPAIR_V015107__',
  '__ARAM_DATA_RANDOM_HARDFIX_V015108__',
  '__ARAM_SCREENSHOT_POLISH_V015109__',
  '__ARAM_PATCH_NOTES_DENSITY_V015110__',
  '__ARAM_RANDOM_DNA_RAIL_V015111__',
  '__ARAM_RANDOM_WORKSPACE_STABILITY_V015112__',
  '__ARAM_RANDOM_WORKSPACE_READABLE_V015113__',
  '__ARAM_RANDOM_PICK_INTEGRITY_V015114__'
];
for(const m of oldMarkers)mustNot(randomOut,m,'late Random/Data overlay marker');
ok('random-runtime-overlay-reset');

const inputSource=map.get('input-interaction-stability-v01539.js');
if(!inputSource||!exists(inputSource))throw new Error('input-interaction stability source missing');
const inputOut=runtime.patchRuntimeSource('input-interaction-stability-v01539.js',read(inputSource));
parse(inputOut,'final input interaction payload');
if(count(inputOut,'/* ARAM_UI_STABILITY_OWNER_PAYLOAD_V015115 */')!==1)throw new Error('v0.15.115 UI owner payload must be injected exactly once');
must(inputOut,'__ARAM_UI_STABILITY_BASELINE_V015115__','v0.15.115 UI readiness marker');
for(const m of oldMarkers)mustNot(inputOut,m,'legacy late overlay in final global target');
ok('single-global-injection');

const brandSource=map.get('brand-header-v01538.js');
if(!brandSource||!exists(brandSource))throw new Error('brand header source missing');
const brandOut=runtime.patchRuntimeSource('brand-header-v01538.js',read(brandSource));
mustNot(brandOut,'/* ARAM_UI_STABILITY_OWNER_PAYLOAD_V015115 */','duplicate v0.15.115 owner injection');
ok('no-redundant-injection');

const itemSource=map.get('item-icons-global-v01557.js');
if(!itemSource||!exists(itemSource))throw new Error('item-icons-global source missing');
const itemOut=runtime.patchRuntimeSource('item-icons-global-v01557.js',read(itemSource));
must(itemOut,'__ARAM_DATA_HUB_V01599__','Data Hub baseline preserved through v0.15.100');
parse(itemOut,'final item/data payload');
ok('data-hub-preserved');

const retired=[
  'ui-layout-restore-v015103.js','random-data-ui-hotfix-v015105.js','random-data-ui-hotfix-v015106.js',
  'view-boundary-repair-v015107.js','data-random-hardfix-v015108.js','ui-screenshot-polish-v015109.js',
  'patch-notes-density-v015110.js','random-dna-rail-v015111.js','random-workspace-stability-v015112.js',
  'random-workspace-readable-v015113.js','random-pick-integrity-v015114.js'
];
if(String(manifest.version)==='0.15.115'){
  const expected={
    'ui-stability-baseline-v015115.js':'update/v0.15.115/ui-stability-baseline-v015115.js',
    'runtime-source-stability-v015115.js':'update/v0.15.115/runtime-source-stability-v015115.js',
    'main-v015115.js':'update/v0.15.115/main-v015115.js',
    'package.json':'update/v0.15.115/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.115 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  for(const p of retired){if(map.has(p))throw new Error(`retired UI overlay still active: ${p}`);if(!deletes.has(p))throw new Error(`retired UI overlay not deleted on update: ${p}`)}
  ok('active-single-owner-manifest');
}

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015115-single-owner-stability-report.json'),JSON.stringify({...report,status:'success'},null,2)+'\n');
console.log('v0.15.115 SINGLE-OWNER UI STABILITY AUDIT: SUCCESS');
