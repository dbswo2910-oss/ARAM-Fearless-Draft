'use strict';
const fs=require('fs');

function read(p){return fs.readFileSync(p,'utf8')}
function must(src,needle,label){if(!src.includes(needle))throw new Error(`v0.15.105 audit missing ${label}: ${needle}`)}
function mustNot(src,needle,label){if(src.includes(needle))throw new Error(`v0.15.105 audit forbidden ${label}: ${needle}`)}

const ui=read('update/v0.15.105/random-data-ui-hotfix-v015105.js');
const rt=read('update/v0.15.105/runtime-source-stability-v015105.js');
const main=read('update/v0.15.105/main-v015105.js');
const pkg=JSON.parse(read('update/v0.15.105/package.json'));

[
  ['__ARAM_RANDOM_DATA_HOTFIX_V015105__','UI marker'],
  ['#comboResults .combo','TOP5 click scope'],
  ['selectedCandidateScore','selected candidate persistence'],
  ['selectedCandidateAd','selected AD persistence'],
  ['selectedCandidateAp','selected AP persistence'],
  ['applyTop5Selection','TOP5 selection handler'],
  ['renderPreview','DNA preview renderer'],
  ['rp105DamageMeta','TOP5 AD/AP detail restore'],
  ['AD ${p.ad}%','TOP5 AD detail'],
  ['AP ${p.ap}%','TOP5 AP detail'],
  ['rp105DataHostPatch','Data patch full-width mode'],
  ['dataPatchNotesV01599','Patch-note surface'],
  ['dh99Layout','Patch-note ratio override']
].forEach(([n,l])=>must(ui,n,l));
mustNot(ui,'setInterval(','new repeating scheduler');
mustNot(ui,'new MutationObserver','new mutation observer');

must(rt,"require('./runtime-source-stability-v015104')",'v0.15.104 runtime lineage');
must(rt,'random-data-ui-hotfix-v015105.js','UI hotfix injection');
must(rt,'window.__ARAM_V015105_SYNC__?.();','existing refresh hook');
must(rt,'score_logic_changed:false','score preservation');

must(main,"path.join(__dirname,'main-v015104.js')",'safe v0.15.104 main predecessor');
must(main,'runtime-source-stability-v015105','v0.15.105 runtime target');
must(main,"root:'main-v01579.js'",'safety baseline lineage');
if(pkg.version!=='0.15.105'||pkg.main!=='main-v015105.js')throw new Error('v0.15.105 package metadata mismatch');

const manifest=JSON.parse(read('update/manifest.json'));
const active=String(manifest.version||'0');
if(active==='0.15.105'){
  const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
  const expected={
    'random-data-ui-hotfix-v015105.js':'update/v0.15.105/random-data-ui-hotfix-v015105.js',
    'runtime-source-stability-v015105.js':'update/v0.15.105/runtime-source-stability-v015105.js',
    'main-v015105.js':'update/v0.15.105/main-v015105.js',
    'package.json':'update/v0.15.105/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.105 active manifest mismatch ${p}`);
}
console.log('v0.15.105 RANDOM TOP5 + DATA PATCH WIDTH AUDIT: SUCCESS');
