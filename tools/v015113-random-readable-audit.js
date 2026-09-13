'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,needle,label)=>{if(!String(src).includes(needle))throw new Error(`v0.15.113 audit missing ${label}: ${needle}`)};
const mustNot=(src,needle,label)=>{if(String(src).includes(needle))throw new Error(`v0.15.113 audit forbidden ${label}: ${needle}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.113 ${label} parse failed: ${e.message}`)}};
const report={version:'0.15.113',score_logic_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const ui=read('update/v0.15.113/random-workspace-readable-v015113.js');
const rt=read('update/v0.15.113/runtime-source-stability-v015113.js');
const main=read('update/v0.15.113/main-v015113.js');
const pkg=JSON.parse(read('update/v0.15.113/package.json'));
parse(ui,'readable workspace');parse(rt,'runtime stability');parse(main,'main successor');ok('syntax');

[
  ['__ARAM_RANDOM_WORKSPACE_READABLE_V015113__','UI marker'],
  ["legacy.id='randomDnaRailStyleV015111'",'legacy rail style placeholder'],
  ["legacy.textContent='/* v0.15.113",'legacy rail CSS neutralization'],
  ['grid-template-columns:minmax(320px,360px) minmax(0,1fr)','two-column outer workbench'],
  ['#randomInputAnchor.rp112WorkspaceGrid>.rp112Right.rp107Right{','decision area selector'],
  ['grid-row:2!important','decision area below main column'],
  ['repeat(auto-fit,minmax(360px,1fr))','readable decision cards'],
  ['grid-column:1 / -1!important','decision header spans full width'],
  ['word-break:keep-all','Korean readable wrapping'],
  ['data-random-mode="ingame"','mode isolation preserved'],
  ['score_logic_changed:false','scoring preservation'],
  ['random_scoring_changed:false','RANDOM scoring preservation'],
  ['data_views_changed:false','DATA preservation']
].forEach(([n,l])=>must(ui,n,l));
mustNot(ui,'setInterval(','repeating scheduler');
mustNot(ui,'MutationObserver','subtree observer');
mustNot(ui,'#data','DATA selector leakage');
ok('ui-contract');

must(rt,"require('./runtime-source-stability-v015112')",'v0.15.112 runtime lineage');
must(rt,"file==='brand-header-v01538.js'",'brand-header activation');
must(rt,"file==='input-interaction-stability-v01539.js'",'input-stability activation');
must(rt,'random_right_rail_conflict_removed:true','conflict-removal flag');
must(rt,'random_decision_area_changed:true','decision-area flag');
must(rt,'random_scoring_changed:false','runtime scoring preservation');
ok('runtime-contract');

must(main,"path.join(__dirname,'main-v015112.js')",'v0.15.112 predecessor');
must(main,'runtime-source-stability-v015113','v0.15.113 runtime target');
must(main,"root:'main-v01579.js'",'safety baseline lineage');
if(pkg.version!=='0.15.113'||pkg.main!=='main-v015113.js')throw new Error('v0.15.113 package metadata mismatch');
ok('successor-package-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const runtime=require(path.join(ROOT,'update/v0.15.113/runtime-source-stability-v015113.js'));
for(const file of ['brand-header-v01538.js','input-interaction-stability-v01539.js']){
  const source=map.get(file);if(!source||!exists(source))throw new Error(`v0.15.113 runtime audit missing active source for ${file}`);
  const out=runtime.patchRuntimeSource(file,read(source));
  must(out,'__ARAM_RANDOM_WORKSPACE_STABILITY_V015112__',`${file} preserves v0.15.112 layer`);
  must(out,'__ARAM_RANDOM_WORKSPACE_READABLE_V015113__',`${file} appends v0.15.113 layer`);
  must(out,'randomWorkspaceReadableStyleV015113',`${file} runtime readability effect`);
  parse(out,`${file} final runtime payload`);
}
ok('runtime-effect');

if(String(manifest.version||'')==='0.15.113'){
  const expected={
    'random-workspace-readable-v015113.js':'update/v0.15.113/random-workspace-readable-v015113.js',
    'runtime-source-stability-v015113.js':'update/v0.15.113/runtime-source-stability-v015113.js',
    'main-v015113.js':'update/v0.15.113/main-v015113.js',
    'package.json':'update/v0.15.113/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.113 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-manifest-contract');
}

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015113-random-readable-report.json'),JSON.stringify({...report,status:'success'},null,2)+'\n');
console.log('v0.15.113 RANDOM READABLE WORKSPACE AUDIT: SUCCESS');
