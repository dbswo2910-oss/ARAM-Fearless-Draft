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
const V0161_BASE_COMMIT='9f46e0aec8544239591ba4d35d95053ed4881f11';
const gitShowJson=rel=>JSON.parse(cp.execFileSync('git',['show',`${V0161_BASE_COMMIT}:${rel}`],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024}).replace(/^\uFEFF/,''));

const current=json('update/manifest.json');
const base=gitShowJson('update/manifest.json');
const checkpoint=json('release/v0.16.2-shadow-rating-diagnostics.json');
assert.strictEqual(base.version,'0.16.1','pinned diagnostics baseline is not v0.16.1');
assert.strictEqual(current.version,'0.16.2','diagnostics successor cutover audit requires v0.16.2');
assert.strictEqual(current.production_rating_active,false,'production Rating must remain disabled');
assert.strictEqual(current.automatic_rating_promotion,false,'automatic Rating promotion must remain disabled');
assert.strictEqual(current.universal_rating_shadow,true,'Universal Rating shadow flag must remain enabled');
assert.strictEqual(current.universal_rating_shadow_diagnostics,true,'Shadow diagnostics flag must be enabled');
assert.strictEqual(checkpoint?.release,'0.16.2','diagnostics checkpoint release mismatch');
assert.strictEqual(checkpoint?.base,'0.16.1','diagnostics checkpoint baseline mismatch');
assert.strictEqual(checkpoint?.safety?.production_rating_active,false,'checkpoint production Rating safety drift');
assert.strictEqual(checkpoint?.safety?.automatic_rating_promotion,false,'checkpoint auto-promotion safety drift');
assert.strictEqual(checkpoint?.safety?.rating_network_owner,false,'checkpoint network ownership safety drift');
assert.strictEqual(checkpoint?.safety?.raw_puuid_exposed_to_renderer,false,'checkpoint renderer privacy safety drift');

const baseMap=new Map((base.files||[]).map(x=>[String(x.path),x]));
const currentMap=new Map((current.files||[]).map(x=>[String(x.path),x]));
assert.strictEqual(baseMap.size,(base.files||[]).length,'v0.16.1 baseline contains duplicate output paths');
assert.strictEqual(currentMap.size,(current.files||[]).length,'v0.16.2 manifest contains duplicate output paths');

const changedExisting=new Map([
  ['package.json','update/v0.16.2/package.json'],
  ['preload.js','update/v0.16.2/preload-v0162-shadow-diagnostics.js'],
  ['src/main/universal-rating-ipc.js','update/v0.16.2/src/main/universal-rating-ipc.js'],
  ['src/preload/universal-rating-history-hook.js','update/v0.16.2/src/preload/universal-rating-history-hook.js'],
  ['src/rating/universal/runtime.js','update/v0.16.2/src/rating/universal/runtime.js']
]);
const expectedNew=new Map([
  ['main-v0162-shadow-diagnostics.js','update/v0.16.2/main-v0162-shadow-diagnostics.js'],
  ['src/profile/shadow-rating-diagnostics-renderer.js','update/v0.16.2/src/profile/shadow-rating-diagnostics-renderer.js']
]);

let preserved=0;
for(const [target,oldEntry] of baseMap){
  const now=currentMap.get(target);
  assert.ok(now,`v0.16.1 payload removed by diagnostics successor: ${target}`);
  if(changedExisting.has(target))continue;
  assert.strictEqual(now.source,oldEntry.source,`v0.16.1 source changed outside approved diagnostics scope: ${target}`);
  assert.strictEqual(String(now.sha256||''),String(oldEntry.sha256||''),`v0.16.1 SHA changed outside approved diagnostics scope: ${target}`);
  preserved++;
}

const additions=[...currentMap.keys()].filter(k=>!baseMap.has(k)).sort();
assert.deepStrictEqual(additions,[...expectedNew.keys()].sort(),'v0.16.2 added unexpected manifest targets or missed required diagnostics targets');

for(const [target,source] of [...changedExisting,...expectedNew]){
  const e=currentMap.get(target);
  assert.ok(e,`missing approved v0.16.2 diagnostics target: ${target}`);
  assert.strictEqual(e.source,source,`approved v0.16.2 source mismatch: ${target}`);
  assert.ok(fs.existsSync(p(source)),`approved v0.16.2 source missing: ${source}`);
  assert.strictEqual(String(e.sha256||'').toLowerCase(),shaFile(source),`approved v0.16.2 SHA mismatch: ${source}`);
}

let shaVerified=0;
for(const e of current.files||[]){
  assert.ok(String(e.source||'').startsWith('update/'),`updater security contract violated by source: ${e.path} -> ${e.source}`);
  assert.ok(fs.existsSync(p(e.source)),`manifest source missing: ${e.source}`);
  if(e.sha256){assert.strictEqual(String(e.sha256).toLowerCase(),shaFile(e.source),`manifest SHA mismatch: ${e.source}`);shaVerified++}
}

const pkg=json('update/v0.16.2/package.json');
assert.strictEqual(pkg.version,'0.16.2','v0.16.2 package version mismatch');
assert.strictEqual(pkg.main,'main-v0162-shadow-diagnostics.js','v0.16.2 package main mismatch');
const main=fs.readFileSync(p('update/v0.16.2/main-v0162-shadow-diagnostics.js'),'utf8');
assert.ok(main.includes("main-v0161-shadow.js"),'v0.16.2 main does not inherit the validated v0.16.1 successor');
assert.ok(main.includes('shadow-rating-diagnostics-renderer.js'),'v0.16.2 main does not inject diagnostics renderer');
const preload=fs.readFileSync(p('update/v0.16.2/preload-v0162-shadow-diagnostics.js'),'utf8');
assert.ok(preload.includes('universal-rating-history-hook'),'v0.16.2 preload does not install Rating diagnostics hook');
const runtime=require(p('src/rating/universal/runtime.js'));
const ipc=require(p('src/main/universal-rating-ipc.js'));
const hook=require(p('src/preload/universal-rating-history-hook.js'));
const view=require(p('src/profile/shadow-rating-diagnostics-renderer.js'));
assert.strictEqual(runtime.production_active,false,'Rating runtime must remain shadow');
assert.strictEqual(runtime.automatic_promotion,false,'Rating runtime auto-promotion must remain disabled');
for(const [name,mod] of [['ipc',ipc],['hook',hook],['view',view]]){
  assert.strictEqual(mod.production_active,false,`${name} production flag activated`);
  assert.strictEqual(mod.automatic_promotion,false,`${name} automatic promotion activated`);
  assert.strictEqual(mod.network_owner,false,`${name} acquired network ownership`);
}
assert.ok(String(ipc.DIAGNOSTICS_CHANNEL||'').includes('shadow-diagnostics'),'read-only diagnostics IPC channel missing');
assert.ok(String(hook.DIAGNOSTICS_CHANNEL||'').includes('shadow-diagnostics'),'preload diagnostics bridge missing');

const legacy=fs.readFileSync(p('update/v0.15.70/main.js'),'utf8');
assert.ok(legacy.includes("if(!source.startsWith('update/'))throw new Error(`허용되지 않은 update source: ${source}`)"),'secure updater source-prefix guard changed');

const out={
  status:'SUCCESS',
  stage:'V0162_SHADOW_RATING_DIAGNOSTICS_SUCCESSOR_CUTOVER',
  release:'0.16.2',
  base_release:'0.16.1',
  v0161_baseline_commit:V0161_BASE_COMMIT,
  baseline_manifest_files:baseMap.size,
  current_manifest_files:currentMap.size,
  preserved_v0161_entries:preserved,
  approved_changed_existing:[...changedExisting.keys()],
  approved_new_entries:additions,
  sha_verified_entries:shaVerified,
  all_sources_under_update:true,
  legacy_updater_security_guard_preserved:true,
  production_rating_active:false,
  automatic_rating_promotion:false,
  universal_rating_shadow:true,
  universal_rating_shadow_diagnostics:true,
  rating_network_owner:false,
  raw_puuid_exposed_to_renderer:false,
  production_score_changed:false
};
fs.mkdirSync(p('audit-output','stability'),{recursive:true});
fs.writeFileSync(p('audit-output','stability','v0162-shadow-diagnostics-successor-cutover-report.json'),JSON.stringify(out,null,2)+'\n','utf8');
console.log('V0.16.2 SHADOW RATING DIAGNOSTICS SUCCESSOR CUTOVER: SUCCESS',JSON.stringify(out));
