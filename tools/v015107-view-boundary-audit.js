'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,needle,label)=>{if(!String(src).includes(needle))throw new Error(`v0.15.107 audit missing ${label}: ${needle}`)};
const mustNot=(src,needle,label)=>{if(String(src).includes(needle))throw new Error(`v0.15.107 audit forbidden ${label}: ${needle}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.107 ${label} parse failed: ${e.message}`)}};
const report={version:'0.15.107',score_logic_changed:false,checks:[]};
const ok=(name)=>report.checks.push({name,status:'success'});

const ui=read('update/v0.15.107/view-boundary-repair-v015107.js');
const rt=read('update/v0.15.107/runtime-source-stability-v015107.js');
const main=read('update/v0.15.107/main-v015107.js');
const pkg=JSON.parse(read('update/v0.15.107/package.json'));
parse(ui,'view-boundary UI');parse(rt,'runtime stability');parse(main,'main successor');ok('syntax');

[
  ['__ARAM_VIEW_BOUNDARY_REPAIR_V015107__','runtime UI marker'],
  ["document.getElementById('data')",'exact Data view preference'],
  ["card.closest('.view')",'Data view fallback boundary'],
  ["const panels=$$('.panel',dataView)",'Data-scoped panel discovery'],
  ["directTitle(p)==='역할별 티어 브라우저'",'scoped tier-title fallback'],
  ['rp107DataHost','Data host owner'],
  ['rp107PatchMode','Patch Notes full-workspace mode'],
  ['#dataPatchNotesV01599','exact Patch Notes surface'],
  ["const root=$('#random'),input=$('#randomInputAnchor')",'exact Random root'],
  ["$('#externalInputs',root)",'exact external input panel'],
  ["$('#poolInputs',root)",'exact pool panel'],
  ["$('#comboResults',root)",'exact TOP5 panel'],
  ["$('#comboDetail',root)",'exact detail panel'],
  ['rp107ForeignDataPanel','Random foreign-Data quarantine'],
  ['rp107RandomGrid','responsive Random pick grid'],
  ['score_logic_changed:false','scoring preservation'],
  ['data-aram-ui-patch','installed-effect marker']
].forEach(([n,l])=>must(ui,n,l));
mustNot(ui,"$$('.panel').find",'global panel heuristic');
mustNot(ui,'setInterval(','new repeating scheduler');
mustNot(ui,'new MutationObserver','new mutation observer');
ok('view-boundary-contract');

must(rt,"require('./runtime-source-stability-v015106')",'v0.15.106 runtime lineage');
must(rt,"file==='brand-header-v01538.js'",'brand-header late activation');
must(rt,"file==='input-interaction-stability-v01539.js'",'input-stability late activation');
must(rt,'data_view_boundary_changed:true','Data boundary flag');
must(rt,'random_pick_layout_repair_changed:true','Random repair flag');
must(rt,'score_logic_changed:false','runtime scoring preservation');
ok('runtime-contract');

must(main,"path.join(__dirname,'main-v015106.js')",'v0.15.106 predecessor');
must(main,'runtime-source-stability-v015107','v0.15.107 runtime target');
must(main,"root:'main-v01579.js'",'safety baseline lineage');
if(pkg.version!=='0.15.107'||pkg.main!=='main-v015107.js')throw new Error('v0.15.107 package metadata mismatch');
ok('successor-package-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const runtime=require(path.join(ROOT,'update/v0.15.107/runtime-source-stability-v015107.js'));
for(const file of ['brand-header-v01538.js','input-interaction-stability-v01539.js']){
  const source=map.get(file);if(!source||!exists(source))throw new Error(`v0.15.107 runtime audit missing active source for ${file}`);
  const out=runtime.patchRuntimeSource(file,read(source));
  must(out,'__ARAM_RANDOM_DATA_HOTFIX_V015106__',`${file} preserves v0.15.106 UI layer`);
  must(out,'__ARAM_VIEW_BOUNDARY_REPAIR_V015107__',`${file} final v0.15.107 UI marker`);
  must(out,'data-aram-data-boundary',`${file} Data boundary marker`);
  must(out,'data-aram-random-boundary',`${file} Random boundary marker`);
  parse(out,`${file} final runtime payload`);
}
ok('runtime-effect');

if(String(manifest.version||'')==='0.15.107'){
  const expected={
    'view-boundary-repair-v015107.js':'update/v0.15.107/view-boundary-repair-v015107.js',
    'runtime-source-stability-v015107.js':'update/v0.15.107/runtime-source-stability-v015107.js',
    'main-v015107.js':'update/v0.15.107/main-v015107.js',
    'package.json':'update/v0.15.107/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.107 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-manifest-contract');
}

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015107-view-boundary-report.json'),JSON.stringify({...report,status:'success'},null,2)+'\n');
console.log('v0.15.107 VIEW BOUNDARY AUDIT: SUCCESS');
