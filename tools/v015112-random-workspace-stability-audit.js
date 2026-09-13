'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,needle,label)=>{if(!String(src).includes(needle))throw new Error(`v0.15.112 audit missing ${label}: ${needle}`)};
const mustNot=(src,needle,label)=>{if(String(src).includes(needle))throw new Error(`v0.15.112 audit forbidden ${label}: ${needle}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.112 ${label} parse failed: ${e.message}`)}};
const report={version:'0.15.112',score_logic_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const ui=read('update/v0.15.112/random-workspace-stability-v015112.js');
const rt=read('update/v0.15.112/runtime-source-stability-v015112.js');
const main=read('update/v0.15.112/main-v015112.js');
const pkg=JSON.parse(read('update/v0.15.112/package.json'));
parse(ui,'RANDOM workspace stability');parse(rt,'runtime stability');parse(main,'main successor');ok('syntax');

[
  ['__ARAM_RANDOM_WORKSPACE_STABILITY_V015112__','UI marker'],
  ['#random[data-random-mode="ingame"] .randomPickOnly','PICK-vs-IN-GAME hard isolation'],
  ['#randomIngameShell.randomInGameOnly','IN GAME shell exact selector'],
  ['#randomInputAnchor','verified pick anchor'],
  ["directPanel(root,'externalInputs')",'exact external panel ownership'],
  ["directPanel(root,'poolInputs')",'exact pool panel ownership'],
  ["directPanel(root,'comboResults')",'exact result panel ownership'],
  ["directPanel(root,'comboDetail')",'exact detail panel ownership'],
  ['rpPickIntelV01589','DNA exact host'],
  ["grid-template-columns:minmax(300px,.72fr) minmax(680px,1.55fr) minmax(330px,.72fr)",'desktop three-zone layout'],
  ['grid-template-columns:minmax(0,1fr)!important','single-column decision rail'],
  ["intel=document.createElement('aside')",'prepaint DNA host creation'],
  ["el.classList.add(primary,legacy)",'v0.15.107 wrapper compatibility'],
  ["attributeFilter:['data-random-mode']",'mode-only observer'],
  ["scope:'random-exact-id-workspace-only'",'scope declaration'],
  ['score_logic_changed:false','scoring preservation'],
  ['random_scoring_changed:false','random scoring preservation']
].forEach(([n,l])=>must(ui,n,l));
mustNot(ui,'setInterval(','repeating scheduler');
mustNot(ui,"querySelectorAll('.panel')",'broad panel discovery');
mustNot(ui,'역할별 티어 브라우저','DATA-title heuristic leakage');
mustNot(ui,'#data','DATA selector leakage');
ok('ui-exact-id-scope-contract');

must(rt,"require('./runtime-source-stability-v015111')",'v0.15.111 runtime lineage');
must(rt,"file==='brand-header-v01538.js'",'brand-header activation');
must(rt,"file==='input-interaction-stability-v01539.js'",'input-stability activation');
must(rt,'random_mode_isolation_changed:true','mode isolation flag');
must(rt,'random_pick_workspace_changed:true','pick workspace flag');
must(rt,'random_initial_layout_flash_changed:true','first-paint flag');
must(rt,'random_scoring_changed:false','random scoring preservation');
must(rt,'data_views_changed:false','DATA preservation');
ok('runtime-contract');

must(main,"path.join(__dirname,'main-v015111.js')",'v0.15.111 predecessor');
must(main,'runtime-source-stability-v015112','v0.15.112 runtime target');
must(main,"root:'main-v01579.js'",'safety baseline lineage');
if(pkg.version!=='0.15.112'||pkg.main!=='main-v015112.js')throw new Error('v0.15.112 package metadata mismatch');
ok('successor-package-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const runtime=require(path.join(ROOT,'update/v0.15.112/runtime-source-stability-v015112.js'));
for(const file of ['brand-header-v01538.js','input-interaction-stability-v01539.js']){
  const source=map.get(file);if(!source||!exists(source))throw new Error(`v0.15.112 runtime audit missing active source for ${file}`);
  const out=runtime.patchRuntimeSource(file,read(source));
  must(out,'__ARAM_RANDOM_DNA_RAIL_V015111__',`${file} preserves v0.15.111 layer`);
  must(out,'__ARAM_RANDOM_WORKSPACE_STABILITY_V015112__',`${file} appends v0.15.112 layer`);
  must(out,'data-aram-random-mode-isolation',`${file} runtime mode isolation marker`);
  must(out,'data-aram-random-workspace',`${file} runtime workspace marker`);
  parse(out,`${file} final runtime payload`);
}
ok('runtime-effect');

if(String(manifest.version||'')==='0.15.112'){
  const expected={
    'random-workspace-stability-v015112.js':'update/v0.15.112/random-workspace-stability-v015112.js',
    'runtime-source-stability-v015112.js':'update/v0.15.112/runtime-source-stability-v015112.js',
    'main-v015112.js':'update/v0.15.112/main-v015112.js',
    'package.json':'update/v0.15.112/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.112 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-manifest-contract');
}

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015112-random-workspace-stability-report.json'),JSON.stringify({...report,status:'success'},null,2)+'\n');
console.log('v0.15.112 RANDOM WORKSPACE STABILITY AUDIT: SUCCESS');
