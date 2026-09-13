'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,needle,label)=>{if(!String(src).includes(needle))throw new Error(`v0.15.108 audit missing ${label}: ${needle}`)};
const mustNot=(src,needle,label)=>{if(String(src).includes(needle))throw new Error(`v0.15.108 audit forbidden ${label}: ${needle}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.108 ${label} parse failed: ${e.message}`)}};
const report={version:'0.15.108',score_logic_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const ui=read('update/v0.15.108/data-random-hardfix-v015108.js');
const rt=read('update/v0.15.108/runtime-source-stability-v015108.js');
const main=read('update/v0.15.108/main-v015108.js');
const pkg=JSON.parse(read('update/v0.15.108/package.json'));
parse(ui,'UI hardfix');parse(rt,'runtime stability');parse(main,'main successor');ok('syntax');

[
  ['__ARAM_DATA_RANDOM_HARDFIX_V015108__','UI marker'],
  ['dataHubPatchModeV01599','v0.15.99 patch-mode signal'],
  ['[data-v103-tab="patch"]','visible Patch Notes tab signal'],
  ['[data-dh99-tab="patch"]','hidden Patch Notes tab signal'],
  ["getComputedStyle(notes).display!=='none'",'actual Patch Notes visibility fallback'],
  ['rp108RequestedMode','explicit tab intent'],
  ['rp108TierBranch','tier branch marker'],
  ['rp108DetailBranch','detail branch marker'],
  ['rp108TierPanel','tier panel fallback marker'],
  ['.rp108DataHost.rp108PatchMode .rp108TierBranch','descendant-safe tier hide'],
  ['.rp108DataHost.rp108PatchMode #dataCard','full-width Data card'],
  ['rp108ForeignDataBranch','Random foreign branch quarantine'],
  ["const root=$('#random')",'exact Random boundary'],
  ['score_logic_changed:false','scoring preservation']
].forEach(([n,l])=>must(ui,n,l));
mustNot(ui,'setInterval(','new repeating scheduler');
mustNot(ui,'MutationObserver','new mutation observer');
ok('hardfix-contract');

must(rt,"require('./runtime-source-stability-v015107')",'v0.15.107 runtime lineage');
must(rt,"file==='brand-header-v01538.js'",'brand-header late activation');
must(rt,"file==='input-interaction-stability-v01539.js'",'input-stability late activation');
must(rt,'data_patchmode_detection_hardfix_changed:true','patch-mode hardfix flag');
must(rt,'random_foreign_data_branch_quarantine_changed:true','Random quarantine flag');
must(rt,'score_logic_changed:false','runtime scoring preservation');
ok('runtime-contract');

must(main,"path.join(__dirname,'main-v015107.js')",'v0.15.107 predecessor');
must(main,'runtime-source-stability-v015108','v0.15.108 runtime target');
must(main,"root:'main-v01579.js'",'safety baseline lineage');
if(pkg.version!=='0.15.108'||pkg.main!=='main-v015108.js')throw new Error('v0.15.108 package metadata mismatch');
ok('successor-package-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const runtime=require(path.join(ROOT,'update/v0.15.108/runtime-source-stability-v015108.js'));
for(const file of ['brand-header-v01538.js','input-interaction-stability-v01539.js']){
  const source=map.get(file);if(!source||!exists(source))throw new Error(`v0.15.108 runtime audit missing active source for ${file}`);
  const out=runtime.patchRuntimeSource(file,read(source));
  must(out,'__ARAM_VIEW_BOUNDARY_REPAIR_V015107__',`${file} preserves v0.15.107 layer`);
  must(out,'__ARAM_DATA_RANDOM_HARDFIX_V015108__',`${file} final v0.15.108 layer`);
  must(out,'data-aram-data-hardfix',`${file} Data hardfix effect`);
  must(out,'data-aram-random-hardfix',`${file} Random hardfix effect`);
  parse(out,`${file} final runtime payload`);
}
ok('runtime-effect');

if(String(manifest.version||'')==='0.15.108'){
  const expected={
    'data-random-hardfix-v015108.js':'update/v0.15.108/data-random-hardfix-v015108.js',
    'runtime-source-stability-v015108.js':'update/v0.15.108/runtime-source-stability-v015108.js',
    'main-v015108.js':'update/v0.15.108/main-v015108.js',
    'package.json':'update/v0.15.108/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.108 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-manifest-contract');
}

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015108-data-random-hardfix-report.json'),JSON.stringify({...report,status:'success'},null,2)+'\n');
console.log('v0.15.108 DATA/RANDOM HARD FIX AUDIT: SUCCESS');
