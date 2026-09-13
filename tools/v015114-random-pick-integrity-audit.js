'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(src,needle,label)=>{if(!String(src).includes(needle))throw new Error(`v0.15.114 audit missing ${label}: ${needle}`)};
const mustNot=(src,needle,label)=>{if(String(src).includes(needle))throw new Error(`v0.15.114 audit forbidden ${label}: ${needle}`)};
const parse=(src,label)=>{try{new Function(src)}catch(e){throw new Error(`v0.15.114 ${label} parse failed: ${e.message}`)}};
const report={version:'0.15.114',score_logic_changed:false,random_scoring_changed:false,checks:[]};
const ok=name=>report.checks.push({name,status:'success'});

const ui=read('update/v0.15.114/random-pick-integrity-v015114.js');
const rt=read('update/v0.15.114/runtime-source-stability-v015114.js');
const main=read('update/v0.15.114/main-v015114.js');
const pkg=JSON.parse(read('update/v0.15.114/package.json'));
parse(ui,'integrity UI');parse(rt,'runtime stability');parse(main,'main successor');ok('syntax');

[
  ['__ARAM_RANDOM_PICK_INTEGRITY_V015114__','UI marker'],
  ['grid-template-columns:minmax(300px,360px) minmax(0,1fr)','stable two-column PICK layout'],
  ['#randomInputAnchor>.rp107Right','legacy right wrapper layout ownership'],
  ['grid-row:2!important','decision area below main column'],
  ['rp114GradeOwner','grade owner containment'],
  ['rp114GradeToken','grade token containment'],
  ["randomState?.combos",'engine combo source'],
  ['combo?.sel','engine candidate-name source'],
  ['collapsePollutedName','legacy polluted-name fallback'],
  ['flattenNumbers(combo?.structure)','combo structure DNA source'],
  ['flattenNumbers(combo?.parts)','combo parts DNA source'],
  ['data-rp114-dna','DNA diagnostic contract'],
  ['rp114DnaSig','candidate-specific DNA signature'],
  ['window.aramRandomPracticeFocusV01549','Random Practice lifecycle owner hook'],
  ['score_logic_changed:false','scoring preservation'],
  ['random_scoring_changed:false','RANDOM scoring preservation'],
  ['data_views_changed:false','DATA preservation']
].forEach(([n,l])=>must(ui,n,l));
mustNot(ui,'setInterval(','repeating scheduler');
mustNot(ui,'MutationObserver','subtree observer');
mustNot(ui,'#dataCard','DATA selector leakage');
ok('ui-contract');

must(rt,"require('./runtime-source-stability-v015113')",'v0.15.113 runtime lineage');
must(rt,"file==='random-practice-focus-v01549.js'",'direct Random Practice injection');
must(rt,'random_pick_integrity_changed:true','integrity flag');
must(rt,'random_candidate_name_source_changed:true','candidate name source flag');
must(rt,'random_candidate_dna_source_changed:true','candidate DNA source flag');
must(rt,'random_scoring_changed:false','runtime scoring preservation');
ok('runtime-contract');

must(main,"path.join(__dirname,'main-v015113.js')",'v0.15.113 predecessor');
must(main,'runtime-source-stability-v015114','v0.15.114 runtime target');
must(main,"root:'main-v01579.js'",'safety baseline lineage');
if(pkg.version!=='0.15.114'||pkg.main!=='main-v015114.js')throw new Error('v0.15.114 package metadata mismatch');
ok('successor-package-contract');

const manifest=JSON.parse(read('update/manifest.json'));
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const focusSource=map.get('random-practice-focus-v01549.js');
if(!focusSource||!exists(focusSource))throw new Error('v0.15.114 active Random Practice focus source missing');
const runtime=require(path.join(ROOT,'update/v0.15.114/runtime-source-stability-v015114.js'));
if(!runtime.activation_targets?.includes('random-practice-focus-v01549.js'))throw new Error('v0.15.114 Random Practice activation target missing');
const out=runtime.patchRuntimeSource('random-practice-focus-v01549.js',read(focusSource));
must(out,'__ARAM_RANDOM_PICK_INTEGRITY_V015114__','final Random runtime v0.15.114 layer');
must(out,'candidateDnaPreviewV01594','prior candidate DNA lineage preserved');
must(out,'__ARAM_RANDOM_PRACTICE_FOCUS_V01549__','base Random Practice focus preserved');
parse(out,'final Random Practice runtime payload');
ok('runtime-effect');

/* Regression guard: the repair must use the same engine TOP5 array produced by
   the scoring engine, not a parallel ranking or fabricated candidate list. */
must(ui,'engineCombos()[i]','TOP5 index -> engine combo mapping');
must(ui,"source:found?'engine-combo-structure':fb.source",'engine structure preferred over fallback');
mustNot(ui,'teamScore(','no scoring entrypoint');
mustNot(ui,'runRandomCombos','no combo ranking entrypoint');
ok('no-scoring-mutation');

if(String(manifest.version||'')==='0.15.114'){
  const expected={
    'random-pick-integrity-v015114.js':'update/v0.15.114/random-pick-integrity-v015114.js',
    'runtime-source-stability-v015114.js':'update/v0.15.114/runtime-source-stability-v015114.js',
    'main-v015114.js':'update/v0.15.114/main-v015114.js',
    'package.json':'update/v0.15.114/package.json'
  };
  for(const [p,s] of Object.entries(expected))if(map.get(p)!==s)throw new Error(`v0.15.114 active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  ok('active-manifest-contract');
}

fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015114-random-pick-integrity-report.json'),JSON.stringify({...report,status:'success'},null,2)+'\n');
console.log('v0.15.114 RANDOM PICK INTEGRITY AUDIT: SUCCESS');
