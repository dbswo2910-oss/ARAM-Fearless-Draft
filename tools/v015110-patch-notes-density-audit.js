'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,needle,label)=>{if(!String(src).includes(needle))throw new Error(`v0.15.110 audit missing ${label}: ${needle}`)};
const mustNot=(src,needle,label)=>{if(String(src).includes(needle))throw new Error(`v0.15.110 audit forbidden ${label}: ${needle}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.110 ${label} parse failed: ${e.message}`)}};
const report={version:'0.15.110',score_logic_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const ui=read('update/v0.15.110/patch-notes-density-v015110.js');
const rt=read('update/v0.15.110/runtime-source-stability-v015110.js');
const main=read('update/v0.15.110/main-v015110.js');
const pkg=JSON.parse(read('update/v0.15.110/package.json'));
parse(ui,'density UI');parse(rt,'runtime stability');parse(main,'main successor');ok('syntax');

[
  ['__ARAM_PATCH_NOTES_DENSITY_V015110__','UI marker'],
  ['#dataPatchNotesV01599 #dh99ChampionGrid.dh99ChampionGrid','strict Patch Notes grid scope'],
  ['#dataPatchNotesV01599 #dh99ChampionGrid .dh99Champ .dh99Portrait','strict portrait scope'],
  ["'46px','important'",'runtime portrait size lock'],
  ["scope:'patch-notes-only'",'scope declaration'],
  ['score_logic_changed:false','scoring preservation']
].forEach(([n,l])=>must(ui,n,l));
mustNot(ui,'#data .dh99Portrait','broad DATA portrait selector');
mustNot(ui,'.champion-card','generic champion card selector');
mustNot(ui,'setInterval(','repeating scheduler');
mustNot(ui,'MutationObserver','mutation observer');
ok('scope-contract');

must(rt,"require('./runtime-source-stability-v015109')",'v0.15.109 runtime lineage');
must(rt,"file==='brand-header-v01538.js'",'brand-header late activation');
must(rt,"file==='input-interaction-stability-v01539.js'",'input-stability late activation');
must(rt,'patch_notes_density_changed:true','density flag');
must(rt,'data_tier_cards_changed:false','tier-card preservation flag');
must(rt,'score_logic_changed:false','runtime scoring preservation');
ok('runtime-contract');

must(main,"path.join(__dirname,'main-v015109.js')",'v0.15.109 predecessor');
must(main,'runtime-source-stability-v015110','v0.15.110 runtime target');
must(main,"root:'main-v01579.js'",'safety baseline lineage');
if(pkg.version!=='0.15.110'||pkg.main!=='main-v015110.js')throw new Error('v0.15.110 package metadata mismatch');
ok('successor-package-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const runtime=require(path.join(ROOT,'update/v0.15.110/runtime-source-stability-v015110.js'));
for(const file of ['brand-header-v01538.js','input-interaction-stability-v01539.js']){
  const source=map.get(file);if(!source||!exists(source))throw new Error(`v0.15.110 runtime audit missing active source for ${file}`);
  const out=runtime.patchRuntimeSource(file,read(source));
  must(out,'__ARAM_SCREENSHOT_POLISH_V015109__',`${file} preserves v0.15.109 layer`);
  must(out,'__ARAM_PATCH_NOTES_DENSITY_V015110__',`${file} appends v0.15.110 layer`);
  must(out,'data-aram-patch-density',`${file} density effect`);
  parse(out,`${file} final runtime payload`);
}
ok('runtime-effect');

if(String(manifest.version||'')==='0.15.110'){
  const expected={
    'patch-notes-density-v015110.js':'update/v0.15.110/patch-notes-density-v015110.js',
    'runtime-source-stability-v015110.js':'update/v0.15.110/runtime-source-stability-v015110.js',
    'main-v015110.js':'update/v0.15.110/main-v015110.js',
    'package.json':'update/v0.15.110/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.110 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-manifest-contract');
}

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015110-patch-notes-density-report.json'),JSON.stringify({...report,status:'success'},null,2)+'\n');
console.log('v0.15.110 PATCH NOTES DENSITY AUDIT: SUCCESS');
