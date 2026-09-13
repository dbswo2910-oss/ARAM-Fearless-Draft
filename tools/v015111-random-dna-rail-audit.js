'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,needle,label)=>{if(!String(src).includes(needle))throw new Error(`v0.15.111 audit missing ${label}: ${needle}`)};
const mustNot=(src,needle,label)=>{if(String(src).includes(needle))throw new Error(`v0.15.111 audit forbidden ${label}: ${needle}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.111 ${label} parse failed: ${e.message}`)}};
const report={version:'0.15.111',score_logic_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const ui=read('update/v0.15.111/random-dna-rail-v015111.js');
const rt=read('update/v0.15.111/runtime-source-stability-v015111.js');
const main=read('update/v0.15.111/main-v015111.js');
const pkg=JSON.parse(read('update/v0.15.111/package.json'));
parse(ui,'RANDOM DNA rail');parse(rt,'runtime stability');parse(main,'main successor');ok('syntax');

[
  ['__ARAM_RANDOM_DNA_RAIL_V015111__','UI marker'],
  ['repeat(auto-fit,minmax(260px,1fr))','width-aware right-rail grid'],
  ['rp111DetailPanel','selected-composition detail marker'],
  ['rp111DnaPanel','DNA panel marker'],
  ['word-break:keep-all','Korean readable wrapping'],
  ["scope:'random-right-rail-only'",'scope declaration'],
  ['score_logic_changed:false','scoring preservation']
].forEach(([n,l])=>must(ui,n,l));
mustNot(ui,'#data','DATA selector leakage');
mustNot(ui,'setInterval(','repeating scheduler');
mustNot(ui,'MutationObserver','mutation observer');
ok('ui-scope-contract');

must(rt,"require('./runtime-source-stability-v015110')",'v0.15.110 runtime lineage');
must(rt,"file==='brand-header-v01538.js'",'brand-header activation');
must(rt,"file==='input-interaction-stability-v01539.js'",'input-stability activation');
must(rt,'random_dna_rail_changed:true','DNA rail flag');
must(rt,'random_scoring_changed:false','random scoring preservation');
must(rt,'data_views_changed:false','DATA preservation');
ok('runtime-contract');

must(main,"path.join(__dirname,'main-v015110.js')",'v0.15.110 predecessor');
must(main,'runtime-source-stability-v015111','v0.15.111 runtime target');
must(main,"root:'main-v01579.js'",'safety baseline lineage');
if(pkg.version!=='0.15.111'||pkg.main!=='main-v015111.js')throw new Error('v0.15.111 package metadata mismatch');
ok('successor-package-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const runtime=require(path.join(ROOT,'update/v0.15.111/runtime-source-stability-v015111.js'));
for(const file of ['brand-header-v01538.js','input-interaction-stability-v01539.js']){
  const source=map.get(file);if(!source||!exists(source))throw new Error(`v0.15.111 runtime audit missing active source for ${file}`);
  const out=runtime.patchRuntimeSource(file,read(source));
  must(out,'__ARAM_PATCH_NOTES_DENSITY_V015110__',`${file} preserves v0.15.110 layer`);
  must(out,'__ARAM_RANDOM_DNA_RAIL_V015111__',`${file} appends v0.15.111 layer`);
  must(out,'data-aram-random-dna-rail',`${file} runtime effect marker`);
  parse(out,`${file} final runtime payload`);
}
ok('runtime-effect');

if(String(manifest.version||'')==='0.15.111'){
  const expected={
    'random-dna-rail-v015111.js':'update/v0.15.111/random-dna-rail-v015111.js',
    'runtime-source-stability-v015111.js':'update/v0.15.111/runtime-source-stability-v015111.js',
    'main-v015111.js':'update/v0.15.111/main-v015111.js',
    'package.json':'update/v0.15.111/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.111 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-manifest-contract');
}

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015111-random-dna-rail-report.json'),JSON.stringify({...report,status:'success'},null,2)+'\n');
console.log('v0.15.111 RANDOM DNA RAIL AUDIT: SUCCESS');
