'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,needle,label)=>{if(!String(src).includes(needle))throw new Error(`v0.15.109 audit missing ${label}: ${needle}`)};
const mustNot=(src,needle,label)=>{if(String(src).includes(needle))throw new Error(`v0.15.109 audit forbidden ${label}: ${needle}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.109 ${label} parse failed: ${e.message}`)}};
const report={version:'0.15.109',score_logic_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const ui=read('update/v0.15.109/ui-screenshot-polish-v015109.js');
const rt=read('update/v0.15.109/runtime-source-stability-v015109.js');
const main=read('update/v0.15.109/main-v015109.js');
const pkg=JSON.parse(read('update/v0.15.109/package.json'));
parse(ui,'UI polish');parse(rt,'runtime stability');parse(main,'main successor');ok('syntax');

[
  ['__ARAM_SCREENSHOT_POLISH_V015109__','UI marker'],
  ["title.textContent=mode?'패치노트':title.dataset.rp109OriginalTitle",'Patch Notes outer title repair'],
  ['ARAM PATCH COMPANION · 26.18','visible patch companion label'],
  ['#random #rpPickIntelV01589 .rp90DnaMetric','candidate DNA selector'],
  ['#random #rpPickIntelV01589 .rp90DnaBar','candidate DNA bar selector'],
  ['#random #rpPickIntelV01589 .rp90DnaSplit','AD/AP split selector'],
  ['#random #rpPickIntelV01589 .rp89Top1','candidate summary selector'],
  ['data-aram-intel-polish','RANDOM intel effect marker'],
  ['score_logic_changed:false','scoring preservation']
].forEach(([n,l])=>must(ui,n,l));
mustNot(ui,'setInterval(','new repeating scheduler');
mustNot(ui,'MutationObserver','new mutation observer');
ok('visual-contract');

must(rt,"require('./runtime-source-stability-v015108')",'v0.15.108 runtime lineage');
must(rt,"file==='brand-header-v01538.js'",'brand-header late activation');
must(rt,"file==='input-interaction-stability-v01539.js'",'input-stability late activation');
must(rt,'random_dna_visual_restore_changed:true','DNA visual restore flag');
must(rt,'score_logic_changed:false','runtime scoring preservation');
ok('runtime-contract');

must(main,"path.join(__dirname,'main-v015108.js')",'v0.15.108 predecessor');
must(main,'runtime-source-stability-v015109','v0.15.109 runtime target');
must(main,"root:'main-v01579.js'",'safety baseline lineage');
if(pkg.version!=='0.15.109'||pkg.main!=='main-v015109.js')throw new Error('v0.15.109 package metadata mismatch');
ok('successor-package-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const runtime=require(path.join(ROOT,'update/v0.15.109/runtime-source-stability-v015109.js'));
for(const file of ['brand-header-v01538.js','input-interaction-stability-v01539.js']){
  const source=map.get(file);if(!source||!exists(source))throw new Error(`v0.15.109 runtime audit missing active source for ${file}`);
  const out=runtime.patchRuntimeSource(file,read(source));
  must(out,'__ARAM_DATA_RANDOM_HARDFIX_V015108__',`${file} preserves v0.15.108 layer`);
  must(out,'__ARAM_SCREENSHOT_POLISH_V015109__',`${file} final v0.15.109 layer`);
  must(out,'data-aram-screenshot-polish',`${file} polish effect`);
  parse(out,`${file} final runtime payload`);
}
ok('runtime-effect');

if(String(manifest.version||'')==='0.15.109'){
  const expected={
    'ui-screenshot-polish-v015109.js':'update/v0.15.109/ui-screenshot-polish-v015109.js',
    'runtime-source-stability-v015109.js':'update/v0.15.109/runtime-source-stability-v015109.js',
    'main-v015109.js':'update/v0.15.109/main-v015109.js',
    'package.json':'update/v0.15.109/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.109 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-manifest-contract');
}

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015109-screenshot-polish-report.json'),JSON.stringify({...report,status:'success'},null,2)+'\n');
console.log('v0.15.109 SCREENSHOT UI POLISH AUDIT: SUCCESS');
