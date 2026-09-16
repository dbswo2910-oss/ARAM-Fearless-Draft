'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const assert=require('assert');

const ROOT=process.cwd();
const p=(...xs)=>path.join(ROOT,...xs);
const json=rel=>JSON.parse(fs.readFileSync(p(rel),'utf8').replace(/^\uFEFF/,''));
const shaFile=rel=>crypto.createHash('sha256').update(fs.readFileSync(p(rel))).digest('hex');
const V0162_BASE_COMMIT='021a145e002566af8930c66ba25a950e2384807b';
const gitShowJson=rel=>JSON.parse(cp.execFileSync('git',['show',`${V0162_BASE_COMMIT}:${rel}`],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024}).replace(/^\uFEFF/,''));

const current=json('update/manifest.json');
const base=gitShowJson('update/manifest.json');
const checkpoint=json('release/v0.16.3-shadow-rating-transparency.json');
assert.strictEqual(base.version,'0.16.2','pinned transparency baseline is not v0.16.2');
assert.strictEqual(current.version,'0.16.3','transparency successor cutover audit requires v0.16.3');
assert.strictEqual(current.production_rating_active,false,'production Rating must remain disabled');
assert.strictEqual(current.automatic_rating_promotion,false,'automatic Rating promotion must remain disabled');
assert.strictEqual(current.universal_rating_shadow,true,'Universal Rating shadow flag must remain enabled');
assert.strictEqual(current.universal_rating_shadow_diagnostics,true,'Shadow diagnostics flag must remain enabled');
assert.strictEqual(current.universal_rating_shadow_transparency,true,'Shadow transparency flag must be enabled');
assert.strictEqual(checkpoint?.release,'0.16.3','transparency checkpoint release mismatch');
assert.strictEqual(checkpoint?.base,'0.16.2','transparency checkpoint baseline mismatch');
assert.strictEqual(checkpoint?.safety?.production_rating_active,false,'checkpoint production Rating safety drift');
assert.strictEqual(checkpoint?.safety?.automatic_rating_promotion,false,'checkpoint auto-promotion safety drift');
assert.strictEqual(checkpoint?.safety?.rating_network_owner,false,'checkpoint network ownership safety drift');
assert.strictEqual(checkpoint?.safety?.raw_puuid_exposed_to_renderer,false,'checkpoint renderer privacy safety drift');
assert.strictEqual(checkpoint?.safety?.predictive_accuracy_claimed,false,'checkpoint accuracy-claim safety drift');

const baseMap=new Map((base.files||[]).map(x=>[String(x.path),x]));
const currentMap=new Map((current.files||[]).map(x=>[String(x.path),x]));
assert.strictEqual(baseMap.size,(base.files||[]).length,'v0.16.2 baseline contains duplicate output paths');
assert.strictEqual(currentMap.size,(current.files||[]).length,'v0.16.3 manifest contains duplicate output paths');

const changedExisting=new Map([
  ['package.json','update/v0.16.3/package.json'],
  ['src/rating/universal/confidence.js','update/v0.16.3/src/rating/universal/confidence.js'],
  ['src/rating/universal/runtime.js','update/v0.16.3/src/rating/universal/runtime.js'],
  ['src/profile/shadow-rating-diagnostics-renderer.js','update/v0.16.3/src/profile/shadow-rating-diagnostics-renderer.js']
]);
const expectedNew=new Map([
  ['main-v0163-shadow-transparency.js','update/v0.16.3/main-v0163-shadow-transparency.js']
]);

let preserved=0;
for(const [target,oldEntry] of baseMap){
  const now=currentMap.get(target);
  assert.ok(now,`v0.16.2 payload removed by transparency successor: ${target}`);
  if(changedExisting.has(target))continue;
  assert.strictEqual(now.source,oldEntry.source,`v0.16.2 source changed outside approved transparency scope: ${target}`);
  assert.strictEqual(String(now.sha256||''),String(oldEntry.sha256||''),`v0.16.2 SHA changed outside approved transparency scope: ${target}`);
  preserved++;
}

const additions=[...currentMap.keys()].filter(k=>!baseMap.has(k)).sort();
assert.deepStrictEqual(additions,[...expectedNew.keys()].sort(),'v0.16.3 added unexpected manifest targets or missed required transparency target');
for(const [target,source] of [...changedExisting,...expectedNew]){
  const e=currentMap.get(target);
  assert.ok(e,`missing approved v0.16.3 target: ${target}`);
  assert.strictEqual(e.source,source,`approved v0.16.3 source mismatch: ${target}`);
  assert.ok(fs.existsSync(p(source)),`approved v0.16.3 source missing: ${source}`);
  assert.strictEqual(String(e.sha256||'').toLowerCase(),shaFile(source),`approved v0.16.3 SHA mismatch: ${source}`);
}

let shaVerified=0;
for(const e of current.files||[]){
  assert.ok(String(e.source||'').startsWith('update/'),`updater security contract violated by source: ${e.path} -> ${e.source}`);
  assert.ok(fs.existsSync(p(e.source)),`manifest source missing: ${e.source}`);
  if(e.sha256){assert.strictEqual(String(e.sha256).toLowerCase(),shaFile(e.source),`manifest SHA mismatch: ${e.source}`);shaVerified++}
}

const pkg=json('update/v0.16.3/package.json');
assert.strictEqual(pkg.version,'0.16.3','v0.16.3 package version mismatch');
assert.strictEqual(pkg.main,'main-v0163-shadow-transparency.js','v0.16.3 package main mismatch');
const main=fs.readFileSync(p('update/v0.16.3/main-v0163-shadow-transparency.js'),'utf8');
assert.ok(main.includes('main-v0162-shadow-diagnostics.js'),'v0.16.3 main does not inherit v0.16.2 diagnostics successor');
const runtime=require(p('src/rating/universal/runtime.js'));
const confidence=require(p('src/rating/universal/confidence.js'));
const view=require(p('src/profile/shadow-rating-diagnostics-renderer.js'));
assert.strictEqual(runtime.production_active,false,'Rating runtime must remain shadow');
assert.strictEqual(runtime.automatic_promotion,false,'Rating runtime auto-promotion must remain disabled');
assert.strictEqual(confidence.production_active,false,'confidence module production flag activated');
assert.strictEqual(view.production_active,false,'view production flag activated');
assert.strictEqual(view.automatic_promotion,false,'view automatic promotion activated');
assert.strictEqual(view.network_owner,false,'view acquired network ownership');
assert.strictEqual(typeof runtime.databaseStats,'function','database transparency helper missing');
assert.strictEqual(typeof runtime.latestIngestSummary,'function','ingest transparency helper missing');
assert.strictEqual(typeof confidence.stabilityProgress,'function','stability progress helper missing');
assert.strictEqual(typeof view.renderIngest,'function','ingest renderer missing');
assert.strictEqual(typeof view.renderDatabase,'function','database renderer missing');
const viewSource=fs.readFileSync(p('src/profile/shadow-rating-diagnostics-renderer.js'),'utf8');
assert.ok(!viewSource.includes('MutationObserver'),'diagnostics renderer reintroduced document-wide observer');
assert.ok(viewSource.includes('계산 안정도 · 정확도 아님'),'stability/accuracy distinction missing');
assert.ok(viewSource.includes('Predictive accuracy: NOT VALIDATED'),'predictive accuracy disclaimer missing');

const legacy=fs.readFileSync(p('update/v0.15.70/main.js'),'utf8');
assert.ok(legacy.includes("if(!source.startsWith('update/'))throw new Error(`허용되지 않은 update source: ${source}`)"),'secure updater source-prefix guard changed');

const out={status:'SUCCESS',stage:'V0163_SHADOW_RATING_TRANSPARENCY_SUCCESSOR_CUTOVER',release:'0.16.3',base_release:'0.16.2',v0162_baseline_commit:V0162_BASE_COMMIT,baseline_manifest_files:baseMap.size,current_manifest_files:currentMap.size,preserved_v0162_entries:preserved,approved_changed_existing:[...changedExisting.keys()],approved_new_entries:additions,sha_verified_entries:shaVerified,all_sources_under_update:true,legacy_updater_security_guard_preserved:true,production_rating_active:false,automatic_rating_promotion:false,universal_rating_shadow:true,universal_rating_shadow_diagnostics:true,universal_rating_shadow_transparency:true,rating_network_owner:false,raw_puuid_exposed_to_renderer:false,predictive_accuracy_claimed:false,production_score_changed:false};
fs.mkdirSync(p('audit-output','stability'),{recursive:true});
fs.writeFileSync(p('audit-output','stability','v0163-shadow-transparency-successor-cutover-report.json'),JSON.stringify(out,null,2)+'\n','utf8');
console.log('V0.16.3 SHADOW RATING TRANSPARENCY SUCCESSOR CUTOVER: SUCCESS',JSON.stringify(out));
