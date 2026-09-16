'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const assert=require('assert');
const ROOT=process.cwd();
const BASE='99e65c90d930d2bd2e0b9297518d0657b6c8e399';
const p=(...xs)=>path.join(ROOT,...xs);
const json=rel=>JSON.parse(fs.readFileSync(p(rel),'utf8').replace(/^\uFEFF/,''));
const gitJson=rel=>JSON.parse(cp.execFileSync('git',['show',`${BASE}:${rel}`],{cwd:ROOT,encoding:'utf8',maxBuffer:128*1024*1024}).replace(/^\uFEFF/,''));
const sha=rel=>crypto.createHash('sha256').update(fs.readFileSync(p(rel))).digest('hex');

const current=json('update/manifest.json');
const baseline=gitJson('update/manifest.json');
const contract=json('release/v0.17.0-clean-consolidation.json');
assert.strictEqual(baseline.version,'0.16.3');
assert.strictEqual(current.version,'0.17.0');
assert.strictEqual(contract.release,'0.17.0');
assert.strictEqual(current.production_rating_active,false);
assert.strictEqual(current.automatic_rating_promotion,false);
assert.strictEqual(current.universal_rating_shadow,true);
assert.strictEqual(current.clean_runtime_consolidated,true);
assert.strictEqual(current.runtime_successor_wrappers,false);

const baseMap=new Map((baseline.files||[]).map(x=>[String(x.path),x]));
const nowMap=new Map((current.files||[]).map(x=>[String(x.path),x]));
assert.strictEqual(baseMap.size,(baseline.files||[]).length,'baseline manifest has duplicate targets');
assert.strictEqual(nowMap.size,(current.files||[]).length,'current manifest has duplicate targets');
const changedExisting=new Map([
  ['package.json','update/v0.17.0/package.json'],
  ['main.js','update/v0.17.0/main.js'],
  ['preload.js','update/v0.17.0/preload.js']
]);
const expectedNew=new Map([['legacy-runtime-v0170.js','update/v0.17.0/legacy-runtime-v0170.js']]);
let preserved=0;
for(const [target,old] of baseMap){
  const now=nowMap.get(target);assert.ok(now,`baseline target removed: ${target}`);
  if(changedExisting.has(target))continue;
  assert.strictEqual(now.source,old.source,`unexpected source drift: ${target}`);
  assert.strictEqual(String(now.sha256||''),String(old.sha256||''),`unexpected sha drift: ${target}`);
  preserved++;
}
const additions=[...nowMap.keys()].filter(x=>!baseMap.has(x)).sort();
assert.deepStrictEqual(additions,[...expectedNew.keys()].sort(),'unexpected new manifest targets');
for(const [target,source] of [...changedExisting,...expectedNew]){
  const row=nowMap.get(target);assert.ok(row,`missing clean-runtime target ${target}`);assert.strictEqual(row.source,source);assert.ok(fs.existsSync(p(source)),`missing release source ${source}`);assert.strictEqual(String(row.sha256||'').toLowerCase(),sha(source),`sha mismatch ${source}`);
}
for(const row of current.files||[]){assert.ok(String(row.source||'').startsWith('update/'),`unsafe updater source: ${row.path} -> ${row.source}`)}

const pkg=json('update/v0.17.0/package.json');
assert.strictEqual(pkg.version,'0.17.0');
assert.strictEqual(pkg.main,'main.js','package main must be stable canonical main.js');
const main=fs.readFileSync(p('update/v0.17.0/main.js'),'utf8');
const legacy=fs.readFileSync(p('update/v0.17.0/legacy-runtime-v0170.js'),'utf8');
const preload=fs.readFileSync(p('update/v0.17.0/preload.js'),'utf8');
const canonicalMain=fs.readFileSync(p('src/app/main.js'),'utf8');
const canonicalLegacy=fs.readFileSync(p('src/app/legacy-runtime-v0170.js'),'utf8');
const canonicalPreload=fs.readFileSync(p('src/app/preload.js'),'utf8');
assert.strictEqual(main,canonicalMain,'main release snapshot differs from canonical src/app/main.js');
assert.strictEqual(legacy,canonicalLegacy,'legacy runtime release snapshot differs from canonical source');
assert.strictEqual(preload,canonicalPreload,'preload release snapshot differs from canonical source');
for(const [name,text] of [['main',main],['legacy',legacy],['preload',preload]]){
  assert.ok(!text.includes('module._compile('),`${name} still contains runtime module._compile chain`);
  assert.ok(!/readFileSync\([^\n]*main-v0?1[56]/.test(text),`${name} still reads a versioned successor main at runtime`);
}
assert.ok(!main.includes("replaceAll('0.16"),'active main still performs version string successor patching');
assert.ok(!main.includes('main-v0163-shadow-transparency.js'),'active main still depends on v0.16.3 wrapper');
assert.ok(main.includes("require('./legacy-runtime-v0170.js')"),'active main missing direct flattened legacy runtime import');
assert.ok(main.includes('installUniversalRatingIpc'),'active main missing direct Rating IPC install');
assert.ok(main.includes('installCanonicalRendererBridge'),'active main missing canonical renderer bridge');
assert.ok(main.includes('installShadowDiagnostics'),'active main missing diagnostics install');
assert.ok(main.includes("legacySafetyRoot:'main-v01579.js'"),'clean runtime lineage marker missing');
assert.ok(!legacy.includes('main-v015122.js')&&!legacy.includes('main-v015121.js'),'legacy runtime still contains successor wrapper chain');
assert.ok(!preload.includes('patchPreloadSource('),'preload still patches itself at runtime');
assert.ok(preload.includes('getUniversalRatingShadowDiagnostics'),'flattened preload missing rating diagnostics bridge');

const runtime=require(p('src/rating/universal/runtime.js'));
const ipc=require(p('src/main/universal-rating-ipc.js'));
assert.strictEqual(runtime.production_active,false);
assert.strictEqual(runtime.automatic_promotion,false);
assert.strictEqual(ipc.production_active,false);
assert.strictEqual(ipc.automatic_promotion,false);
assert.strictEqual(ipc.network_owner,false);

const out={status:'SUCCESS',stage:'V0170_CLEAN_CONSOLIDATION',baseline:'0.16.3',release:'0.17.0',baseline_commit:BASE,preserved_manifest_entries:preserved,approved_changed_existing:[...changedExisting.keys()],approved_new_entries:additions,package_main:'main.js',runtime_module_compile_chain:false,runtime_successor_wrappers:false,runtime_version_string_patching:false,canonical_release_snapshots_byte_equal:true,production_rating_active:false,automatic_rating_promotion:false,rating_network_owner:false};
fs.mkdirSync(p('audit-output','stability'),{recursive:true});
fs.writeFileSync(p('audit-output','stability','v0170-clean-consolidation-report.json'),JSON.stringify(out,null,2)+'\n','utf8');
console.log('V0.17 CLEAN CONSOLIDATION AUDIT: SUCCESS',JSON.stringify(out));
