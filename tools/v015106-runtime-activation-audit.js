'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,needle,label)=>{if(!String(src).includes(needle))throw new Error(`v0.15.106 audit missing ${label}: ${needle}`)};
const mustNot=(src,needle,label)=>{if(String(src).includes(needle))throw new Error(`v0.15.106 audit forbidden ${label}: ${needle}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.106 ${label} parse failed: ${e.message}`)}};

const ui=read('update/v0.15.106/random-data-ui-hotfix-v015106.js');
const rt=read('update/v0.15.106/runtime-source-stability-v015106.js');
const main=read('update/v0.15.106/main-v015106.js');
const pkg=JSON.parse(read('update/v0.15.106/package.json'));
parse(ui,'UI hotfix');parse(rt,'runtime stability');parse(main,'main successor');

[
  ['__ARAM_RANDOM_DATA_HOTFIX_V015106__','runtime UI marker'],
  ['data-aram-ui-patch','installed-effect marker'],
  ['#comboResults .combo','TOP5 whole-card scope'],
  ['fallbackSelect','TOP5 fallback selection'],
  ['selectedCandidateAd','selected AD persistence'],
  ['selectedCandidateAp','selected AP persistence'],
  ['rp106DamageNumbers','visible TOP5 AD/AP numbers'],
  ['rp106PatchWide','Patch Notes wide mode'],
  ['dataHubTierPaneV015103','tier pane hide contract'],
  ['dh99Layout','patch-note column ratio']
].forEach(([n,l])=>must(ui,n,l));
mustNot(ui,'setInterval(','new repeating scheduler');
mustNot(ui,'new MutationObserver','new mutation observer');

must(rt,"require('./runtime-source-stability-v015105')",'v0.15.105 runtime lineage');
must(rt,"file==='brand-header-v01538.js'",'independent brand-header activation');
must(rt,"file==='input-interaction-stability-v01539.js'",'independent input-stability activation');
must(rt,'redundant_ui_activation_changed:true','redundant activation contract');
must(rt,'score_logic_changed:false','score preservation');

must(main,"path.join(__dirname,'main-v015105.js')",'v0.15.105 predecessor');
must(main,'runtime-source-stability-v015106','v0.15.106 runtime target');
must(main,"root:'main-v01579.js'",'safety baseline lineage');
if(pkg.version!=='0.15.106'||pkg.main!=='main-v015106.js')throw new Error('v0.15.106 package metadata mismatch');

// Runtime-effect audit: do not only inspect source strings. Run the actual
// patchRuntimeSource chain against two independently loaded renderer payloads,
// assert the v106 UI is present in both final payloads, and parse both outputs.
const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const runtime=require(path.join(ROOT,'update/v0.15.106/runtime-source-stability-v015106.js'));
for(const file of ['brand-header-v01538.js','input-interaction-stability-v01539.js']){
  const source=map.get(file);if(!source||!exists(source))throw new Error(`v0.15.106 runtime audit missing active source for ${file}`);
  const out=runtime.patchRuntimeSource(file,read(source));
  must(out,'__ARAM_RANDOM_DATA_HOTFIX_V015106__',`${file} final injected UI marker`);
  must(out,'data-aram-ui-patch',`${file} final installed-effect marker`);
  parse(out,`${file} final runtime payload`);
}

if(String(manifest.version||'')==='0.15.106'){
  const expected={
    'random-data-ui-hotfix-v015106.js':'update/v0.15.106/random-data-ui-hotfix-v015106.js',
    'runtime-source-stability-v015106.js':'update/v0.15.106/runtime-source-stability-v015106.js',
    'main-v015106.js':'update/v0.15.106/main-v015106.js',
    'package.json':'update/v0.15.106/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.106 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
}
console.log('v0.15.106 RUNTIME ACTIVATION AUDIT: SUCCESS');
