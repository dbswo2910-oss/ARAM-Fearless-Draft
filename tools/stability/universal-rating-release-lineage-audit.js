'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const ROOT=process.cwd();
const json=rel=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8').replace(/^\uFEFF/,''));
const manifest=json('update/manifest.json');
const state=json('update/current-state.json');
const version=String(manifest.version||'');
const cleanSuccessor=manifest.clean_runtime_consolidated===true&&manifest.runtime_successor_wrappers===false;
const v016=/^0\.16\.\d+$/.test(version)&&version!=='0.16.0';
assert.ok(v016||cleanSuccessor,`Universal Rating release lineage supports v0.16.1+ or clean-runtime successors, got ${version}`);
assert.strictEqual(manifest.production_rating_active,false,'production Rating must remain disabled');
assert.strictEqual(manifest.automatic_rating_promotion,false,'automatic Rating promotion must remain disabled');
assert.strictEqual(manifest.universal_rating_shadow,true,'Universal Rating shadow flag must remain enabled');
assert.strictEqual(state?.active?.version,version,'current-state active version mismatch');
assert.strictEqual(state?.package?.version,version,'current-state package version mismatch');
for(const e of manifest.files||[])assert.ok(String(e.source||'').startsWith('update/'),`unsafe updater source ${e.path} -> ${e.source}`);
const by=new Map((manifest.files||[]).map(x=>[String(x.path),x]));
const requiredTargets=[
  'update/v0.15.129/rating-engine-v01.js',
  'src/main/universal-rating-ipc.js',
  'src/preload/universal-rating-history-hook.js',
  'src/rating/universal/contracts.js',
  'src/rating/universal/normalizer.js',
  'src/rating/universal/confidence.js',
  'src/rating/universal/estimator.js',
  'src/rating/universal/store.js',
  'src/rating/universal/service.js',
  'src/rating/universal/runtime.js',
  'src/rating/universal/index.js'
];
for(const target of requiredTargets)assert.ok(by.has(target),`Universal Rating base payload missing ${target}`);
if(version==='0.16.1'){
  assert.strictEqual(state?.package?.main,'main-v0161-shadow.js','v0.16.1 package main mismatch');
}else if(cleanSuccessor){
  assert.strictEqual(state?.package?.main,'main.js','clean-runtime successor must use stable main.js');
  assert.strictEqual(manifest.runtime_successor_wrappers,false,'clean-runtime successor re-enabled wrapper chain');
}else{
  const minor=Number(version.split('.')[2]);
  assert.ok(minor>=2,'v0.16 successor patch version must be >= 2');
}
const out={status:'SUCCESS',stage:'UNIVERSAL_RATING_RELEASE_LINEAGE',version,clean_runtime_successor:cleanSuccessor,production_rating_active:false,automatic_rating_promotion:false,universal_rating_shadow:true,required_targets_verified:requiredTargets.length,all_sources_under_update:true,current_state_aligned:true};
fs.mkdirSync(path.join(ROOT,'audit-output','stability'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output','stability','universal-rating-release-lineage-report.json'),JSON.stringify(out,null,2)+'\n','utf8');
console.log(`UNIVERSAL RATING RELEASE LINEAGE ${version}: PASS`);
