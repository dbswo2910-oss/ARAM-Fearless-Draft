'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const assert=require('assert');

const ROOT=path.resolve(__dirname,'../..');
const BASE='99e65c90d930d2bd2e0b9297518d0657b6c8e399';
const json=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8').replace(/^\uFEFF/,''));
const text=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const gitJson=p=>JSON.parse(cp.execFileSync('git',['show',`${BASE}:${p}`],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024}).replace(/^\uFEFF/,''));

const manifest=json('update/manifest.json');
const base=gitJson('update/manifest.json');
assert.strictEqual(base.version,'0.16.3');
assert.strictEqual(manifest.version,'0.17.0');
assert.strictEqual(manifest.clean_consolidation,true);
assert.strictEqual(manifest.runtime_successor_wrappers,0);
assert.strictEqual(manifest.production_rating_active,false);
assert.strictEqual(manifest.automatic_rating_promotion,false);
assert.strictEqual(manifest.universal_rating_shadow,true);
assert.strictEqual(manifest.universal_rating_shadow_diagnostics,true);
assert.strictEqual(manifest.universal_rating_shadow_transparency,true);

const by=new Map((manifest.files||[]).map(x=>[String(x.path),x]));
const pkgEntry=by.get('package.json');
assert.ok(pkgEntry);
const pkg=json(pkgEntry.source);
assert.strictEqual(pkg.version,'0.17.0');
assert.strictEqual(pkg.main,'src/app/main.js');

const main=text('src/app/main.js');
const safety=text('src/app/legacy-safety-bootstrap.js');
const core=text('legacy-runtime-core.js');
const preload=text('src/app/preload.js');
for(const [name,src] of [['main',main],['core',core],['preload',preload]]){
  assert.ok(!/module\._compile\s*\(/.test(src),`${name} still uses runtime module._compile`);
}
assert.ok(!/main-v0?1[56]/.test(main),'clean main references predecessor main wrapper');
assert.ok(!/replace(All)?\s*\([^\n]*0\.1[56]/.test(main),'clean main patches version strings');
assert.ok(!/readFileSync\([^\n]*main-v/.test(main),'clean main reads predecessor main source');
assert.ok(!/main-v0?1[56]/.test(core),'legacy core references predecessor main wrapper');
assert.ok(!/patchPreloadSource/.test(preload),'clean preload still performs runtime source patching');
assert.ok(/const VERSION=String\(require\('\.\/package\.json'\)\.version\);/.test(core),'legacy core does not use package version source');
assert.ok(/const VERSION=String\(require\(path\.join\(APP_ROOT,'package\.json'\)\)\.version/.test(main),'clean main does not use package version source');

const order=[
  'installShadowDiagnosticsRenderer();',
  'pinStableUserData();',
  'installUniversalRatingIpc',
  'loadCanonicalRegistry();',
  'installCanonicalRendererBridge(canonicalRegistry);',
  'cold-start-promotion-v0160.js',
  'autosync-concurrency-v015119.js',
  "require('./legacy-safety-bootstrap').install",
  "legacy-runtime-core.js"
];
let cursor=-1;
for(const needle of order){const i=main.indexOf(needle);assert.ok(i>cursor,`clean bootstrap ordering missing/drifted: ${needle}`);cursor=i}

for(const needle of ['update-safety-v01579.js','freeze-blackbox-v01577.js','hang-heartbeat-v01579.js','ingame-transition-patch-v01575.js','safe-index-patch-v01578.js','autosync-core.js'])assert.ok(safety.includes(needle),`legacy safety owner missing ${needle}`);

const baseMap=new Map((base.files||[]).map(x=>[String(x.path),x]));
let preserved=0;
for(const [target,old] of baseMap){
  if(target==='package.json'||target==='preload.js')continue;
  const now=by.get(target);
  assert.ok(now,`baseline target removed: ${target}`);
  assert.strictEqual(String(now.source||''),String(old.source||''),`baseline source drift outside clean entry scope: ${target}`);
  assert.strictEqual(String(now.sha256||''),String(old.sha256||''),`baseline sha drift outside clean entry scope: ${target}`);
  preserved++;
}

const expected={
  'package.json':'update/v0.17.0/package.json',
  'preload.js':'update/v0.17.0/preload.js',
  'src/app/main.js':'update/v0.17.0/src/app/main.js',
  'src/app/legacy-safety-bootstrap.js':'update/v0.17.0/src/app/legacy-safety-bootstrap.js',
  'legacy-runtime-core.js':'update/v0.17.0/legacy-runtime-core.js'
};
for(const [target,source] of Object.entries(expected)){
  const row=by.get(target);assert.ok(row,`missing clean target ${target}`);assert.strictEqual(row.source,source);assert.strictEqual(String(row.sha256||'').toLowerCase(),sha(source));
}
assert.strictEqual(text('update/v0.17.0/src/app/main.js'),main,'release main snapshot differs from canonical main');
assert.strictEqual(text('update/v0.17.0/src/app/legacy-safety-bootstrap.js'),safety,'release safety snapshot differs from canonical source');
assert.strictEqual(text('update/v0.17.0/preload.js'),preload,'release preload snapshot differs from canonical source');
assert.strictEqual(text('update/v0.17.0/legacy-runtime-core.js'),core,'release legacy core snapshot differs from canonical core');

const build=json('audit-output/consolidation/v0170-clean-runtime-build.json');
assert.strictEqual(build.status,'SUCCESS');
assert.strictEqual(build.runtimeSuccessorWrappers,0);
assert.strictEqual(build.runtimeModuleCompileRewrites,0);
assert.strictEqual(build.runtimeVersionStringPatching,0);
assert.strictEqual(build.hashes.baselineEffectivePreload,build.hashes.cleanPreload,'preload behavior snapshot drifted');

const report={status:'SUCCESS',stage:'V0170_CLEAN_CONSOLIDATION_AUDIT',release:'0.17.0',base:'0.16.3',activeMain:pkg.main,runtimeSuccessorWrappers:0,runtimeModuleCompileRewrites:0,runtimeVersionStringPatching:0,preservedBaselineEntries:preserved,compatibilityBoundary:'legacy-runtime-core.js',productionRatingActive:false,automaticRatingPromotion:false};
fs.mkdirSync(path.join(ROOT,'audit-output','consolidation'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output','consolidation','v0170-clean-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
