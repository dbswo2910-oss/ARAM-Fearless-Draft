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
const V0160_BASE_COMMIT='ce5ddcea65fe3b31e7ff98ec9fc0069e8773227a';
const gitShowJson=rel=>JSON.parse(cp.execFileSync('git',['show',`${V0160_BASE_COMMIT}:${rel}`],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024}).replace(/^\uFEFF/,''));

const current=json('update/manifest.json');
const base=gitShowJson('update/manifest.json');
assert.strictEqual(base.version,'0.16.0','pinned successor baseline is not v0.16.0');
assert.strictEqual(current.version,'0.16.1','successor cutover audit requires v0.16.1');
assert.strictEqual(current.production_rating_active,false,'production Rating must remain disabled');
assert.strictEqual(current.automatic_rating_promotion,false,'automatic Rating promotion must remain disabled');
assert.strictEqual(current.universal_rating_shadow,true,'Universal Rating shadow flag must remain enabled');

const baseMap=new Map((base.files||[]).map(x=>[String(x.path),x]));
const currentMap=new Map((current.files||[]).map(x=>[String(x.path),x]));
assert.strictEqual(baseMap.size,(base.files||[]).length,'v0.16.0 baseline contains duplicate output paths');
assert.strictEqual(currentMap.size,(current.files||[]).length,'v0.16.1 manifest contains duplicate output paths');

const changedExisting=new Set(['package.json','preload.js']);
const expectedNew=new Map([
  ['main-v0161-shadow.js','update/v0.16.1/main-v0161-shadow.js'],
  ['preload-base-v015117.js','update/v0.15.117/preload.js'],
  ['src/main/universal-rating-ipc.js','update/v0.16.1/src/main/universal-rating-ipc.js'],
  ['src/preload/universal-rating-history-hook.js','update/v0.16.1/src/preload/universal-rating-history-hook.js'],
  ['src/rating/universal/contracts.js','update/v0.16.1/src/rating/universal/contracts.js'],
  ['src/rating/universal/normalizer.js','update/v0.16.1/src/rating/universal/normalizer.js'],
  ['src/rating/universal/confidence.js','update/v0.16.1/src/rating/universal/confidence.js'],
  ['src/rating/universal/estimator.js','update/v0.16.1/src/rating/universal/estimator.js'],
  ['src/rating/universal/store.js','update/v0.16.1/src/rating/universal/store.js'],
  ['src/rating/universal/service.js','update/v0.16.1/src/rating/universal/service.js'],
  ['src/rating/universal/runtime.js','update/v0.16.1/src/rating/universal/runtime.js'],
  ['src/rating/universal/index.js','update/v0.16.1/src/rating/universal/index.js'],
  ['update/v0.15.129/rating-engine-v01.js','update/v0.15.129/rating-engine-v01.js']
]);

let preserved=0;
for(const [target,oldEntry] of baseMap){
  const now=currentMap.get(target);
  assert.ok(now,`v0.16.0 payload removed by successor: ${target}`);
  if(changedExisting.has(target))continue;
  assert.strictEqual(now.source,oldEntry.source,`v0.16.0 source changed outside approved successor scope: ${target}`);
  assert.strictEqual(String(now.sha256||''),String(oldEntry.sha256||''),`v0.16.0 SHA changed outside approved successor scope: ${target}`);
  preserved++;
}

const additions=[...currentMap.keys()].filter(k=>!baseMap.has(k)).sort();
const expectedAdditions=[...expectedNew.keys()].sort();
assert.deepStrictEqual(additions,expectedAdditions,'v0.16.1 added unexpected manifest targets or missed required Shadow targets');

const expectedChanged=new Map([
  ['package.json','update/v0.16.1/package.json'],
  ['preload.js','update/v0.16.1/preload-v0161-shadow.js']
]);
for(const [target,source] of [...expectedChanged,...expectedNew]){
  const e=currentMap.get(target);
  assert.ok(e,`missing approved v0.16.1 successor target: ${target}`);
  assert.strictEqual(e.source,source,`approved v0.16.1 source mismatch: ${target}`);
  assert.ok(fs.existsSync(p(source)),`approved v0.16.1 source missing: ${source}`);
  assert.strictEqual(String(e.sha256||'').toLowerCase(),shaFile(source),`approved v0.16.1 SHA mismatch: ${source}`);
}

let shaVerified=0;
for(const e of current.files||[]){
  assert.ok(String(e.source||'').startsWith('update/'),`updater security contract violated by source: ${e.path} -> ${e.source}`);
  assert.ok(fs.existsSync(p(e.source)),`manifest source missing: ${e.source}`);
  if(e.sha256){assert.strictEqual(String(e.sha256).toLowerCase(),shaFile(e.source),`manifest SHA mismatch: ${e.source}`);shaVerified++}
}

const pkg=json('update/v0.16.1/package.json');
assert.strictEqual(pkg.version,'0.16.1','v0.16.1 package version mismatch');
assert.strictEqual(pkg.main,'main-v0161-shadow.js','v0.16.1 package main mismatch');
const main=fs.readFileSync(p('update/v0.16.1/main-v0161-shadow.js'),'utf8');
assert.ok(main.includes("require('./src/main/universal-rating-ipc')"),'v0.16.1 main does not install Universal Rating IPC');
const preload=fs.readFileSync(p('update/v0.16.1/preload-v0161-shadow.js'),'utf8');
assert.ok(preload.includes('universal-rating-history-hook'),'v0.16.1 preload does not install Rating history sidecar');

const legacy=fs.readFileSync(p('update/v0.15.70/main.js'),'utf8');
assert.ok(legacy.includes("if(!source.startsWith('update/'))throw new Error(`허용되지 않은 update source: ${source}`)"),'secure updater source-prefix guard changed');

const out={
  status:'SUCCESS',
  stage:'V0161_UNIVERSAL_RATING_SHADOW_SUCCESSOR_CUTOVER',
  release:'0.16.1',
  v0160_baseline_commit:V0160_BASE_COMMIT,
  baseline_manifest_files:baseMap.size,
  current_manifest_files:currentMap.size,
  preserved_v0160_entries:preserved,
  approved_changed_existing:[...changedExisting],
  approved_new_entries:additions,
  sha_verified_entries:shaVerified,
  all_sources_under_update:true,
  legacy_updater_security_guard_preserved:true,
  production_rating_active:false,
  automatic_rating_promotion:false,
  universal_rating_shadow:true,
  rating_network_owner:false,
  production_score_changed:false
};
fs.mkdirSync(p('audit-output','stability'),{recursive:true});
fs.writeFileSync(p('audit-output','stability','v0161-shadow-successor-cutover-report.json'),JSON.stringify(out,null,2)+'\n','utf8');
console.log('V0.16.1 UNIVERSAL RATING SHADOW SUCCESSOR CUTOVER: SUCCESS',JSON.stringify(out));
