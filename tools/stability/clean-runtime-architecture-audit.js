'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const ROOT=process.cwd();
const p=(...xs)=>path.join(ROOT,...xs);
const read=rel=>fs.readFileSync(p(rel),'utf8');
const json=rel=>JSON.parse(read(rel).replace(/^\uFEFF/,''));
const manifest=json('update/manifest.json');
const out={schema:1,stage:'CLEAN_RUNTIME_ARCHITECTURE',active_version:String(manifest.version||''),status:'SUCCESS',applicable:manifest.clean_runtime_consolidated===true,checks:[]};
const ok=(name,detail='')=>out.checks.push({name,status:'success',detail});
if(!out.applicable){
  ok('not-applicable','active distribution predates clean-runtime consolidation');
}else{
  assert.strictEqual(manifest.runtime_successor_wrappers,false,'clean runtime cannot enable successor wrappers');
  ok('manifest-clean-runtime-flags');
  const by=new Map((manifest.files||[]).map(x=>[String(x.path),x]));
  assert.strictEqual(by.size,(manifest.files||[]).length,'manifest has duplicate target paths');
  const pkgRow=by.get('package.json');assert.ok(pkgRow&&String(pkgRow.source||'').startsWith('update/'),'active package source missing/unsafe');
  const pkg=json(pkgRow.source);
  assert.strictEqual(pkg.main,'main.js','clean runtime package entry must remain stable main.js');
  assert.strictEqual(String(pkg.version),String(manifest.version),'package/manifest version mismatch');
  ok('stable-package-entry','main.js');
  const mainRow=by.get('main.js'),preloadRow=by.get('preload.js');
  assert.ok(mainRow&&String(mainRow.source||'').startsWith('update/'),'active main.js source missing/unsafe');
  assert.ok(preloadRow&&String(preloadRow.source||'').startsWith('update/'),'active preload.js source missing/unsafe');
  const main=read(mainRow.source),preload=read(preloadRow.source);
  const legacyRows=[...by.values()].filter(x=>/^legacy-runtime-v\d+\.js$/.test(String(x.path||'')));
  assert.ok(legacyRows.length<=1,'clean runtime cannot stack multiple active legacy-runtime snapshots');
  const texts=[['main',main],['preload',preload],...legacyRows.map(x=>[String(x.path),read(x.source)])];
  for(const [name,text] of texts){
    assert.ok(!text.includes('module._compile('),`${name} reintroduced runtime module._compile successor chaining`);
    assert.ok(!/readFileSync\([^\n]*main-v0?1[5-9]/.test(text),`${name} reads a versioned predecessor main at runtime`);
    assert.ok(!/require\(\s*['"][^'"]*main-v0?1[5-9][^'"]*['"]\s*\)/.test(text),`${name} requires a versioned predecessor main at runtime`);
  }
  assert.ok(!/replace(All)?\([^\n]*['"]0\.1[5-9]/.test(main),'main.js reintroduced predecessor version-string patching');
  assert.ok(!preload.includes('patchPreloadSource('),'preload.js reintroduced runtime self-patching');
  ok('no-runtime-successor-chain');
  for(const row of manifest.files||[])assert.ok(String(row.source||'').startsWith('update/'),`unsafe updater source ${row.path} -> ${row.source}`);
  ok('updater-source-prefix-guard');
  if(fs.existsSync(p('src/app/main.js'))){assert.strictEqual(main,read('src/app/main.js'),'active updater main differs from canonical src/app/main.js');ok('canonical-main-snapshot-byte-equal')}
  if(fs.existsSync(p('src/app/preload.js'))){assert.strictEqual(preload,read('src/app/preload.js'),'active updater preload differs from canonical src/app/preload.js');ok('canonical-preload-snapshot-byte-equal')}
  const runtime=require(p('src/rating/universal/runtime.js'));
  const ipc=require(p('src/main/universal-rating-ipc.js'));
  assert.strictEqual(runtime.production_active,false,'Universal Rating production flag activated');
  assert.strictEqual(runtime.automatic_promotion,false,'Universal Rating automatic promotion activated');
  assert.strictEqual(ipc.production_active,false,'Universal Rating IPC production flag activated');
  assert.strictEqual(ipc.network_owner,false,'Universal Rating became network owner');
  ok('rating-shadow-safety');
}
fs.mkdirSync(p('audit-output','stability'),{recursive:true});
fs.writeFileSync(p('audit-output','stability','clean-runtime-architecture-report.json'),JSON.stringify(out,null,2)+'\n','utf8');
console.log('CLEAN RUNTIME ARCHITECTURE AUDIT: SUCCESS',JSON.stringify({active_version:out.active_version,applicable:out.applicable,checks:out.checks.length}));
