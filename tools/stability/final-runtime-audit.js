'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const L=require('./lib');
const manifest=L.json('update/manifest.json');
const state=L.json('update/current-state.json');
const outRoot=L.p('audit-output/stability/final-runtime');
fs.rmSync(outRoot,{recursive:true,force:true});fs.mkdirSync(outRoot,{recursive:true});
const runtimePath=state.owners?.random_pick?.active_runtime_source||`update/v${manifest.version}/runtime-source-stability-v${String(manifest.version).replace(/\D/g,'')}.js`;
L.must(runtimePath&&L.exists(runtimePath),`active runtime patch module missing: ${runtimePath}`);
const runtime=require(L.p(runtimePath));
L.must(typeof runtime.patchRuntimeSource==='function','active runtime module has no patchRuntimeSource');
const rows=[];let patchedCount=0,jsCount=0,jsonCount=0;
for(const f of manifest.files||[]){
  L.must(f.path&&f.source,`invalid manifest file entry: ${JSON.stringify(f)}`);
  L.must(L.exists(f.source),`manifest source missing: ${f.source}`);
  const raw=fs.readFileSync(L.p(f.source));
  if(f.sha256){const h=crypto.createHash('sha256').update(raw).digest('hex');L.must(h.toLowerCase()===String(f.sha256).toLowerCase(),`manifest sha mismatch ${f.path}`)}
  const dst=path.join(outRoot,f.path);fs.mkdirSync(path.dirname(dst),{recursive:true});
  let body=raw,patched=false,syntax='n/a';
  if(/\.js$/i.test(f.path)){
    jsCount++;const src=raw.toString('utf8');let next=src;
    try{next=runtime.patchRuntimeSource(f.path,src)}catch(e){throw new Error(`patchRuntimeSource failed for ${f.path} <- ${f.source}: ${e.message}`)}
    patched=next!==src;if(patched)patchedCount++;
    try{new Function(next);syntax='ok'}catch(e){throw new Error(`final runtime JS syntax failed for ${f.path}: ${e.message}`)}
    body=Buffer.from(next,'utf8');
  }else if(/\.json$/i.test(f.path)){
    jsonCount++;try{JSON.parse(raw.toString('utf8'));syntax='ok'}catch(e){throw new Error(`final runtime JSON parse failed for ${f.path}: ${e.message}`)}
  }
  fs.writeFileSync(dst,body);
  rows.push({path:f.path,source:f.source,patched,syntax,sha256:crypto.createHash('sha256').update(body).digest('hex'),bytes:body.length});
}
L.must(rows.some(x=>x.path==='package.json'),'assembled runtime missing package.json');
const pkg=JSON.parse(fs.readFileSync(path.join(outRoot,'package.json'),'utf8'));
L.must(pkg.name==='aram-fearless-draft','assembled package app identity drift');
L.must(pkg.version===manifest.version,`assembled package version ${pkg.version} != manifest ${manifest.version}`);
L.must(fs.existsSync(path.join(outRoot,pkg.main)),`assembled package main missing: ${pkg.main}`);
const report={status:'SUCCESS',version:manifest.version,runtime_patch_module:runtimePath,manifest_files:rows.length,js_files:jsCount,json_files:jsonCount,patched_files:patchedCount,package:{name:pkg.name,version:pkg.version,main:pkg.main},scoring_flags:{score_logic_changed:runtime.score_logic_changed===true,random_scoring_changed:runtime.random_scoring_changed===true,item_recommendation_logic_changed:runtime.item_recommendation_logic_changed===true},files:rows};
L.must(report.scoring_flags.score_logic_changed===false,'structural stabilization detected score_logic_changed=true');
L.must(report.scoring_flags.random_scoring_changed===false,'structural stabilization detected random_scoring_changed=true');
L.write('audit-output/stability/final-runtime-report.json',report);
console.log('FINAL ASSEMBLED RUNTIME AUDIT: SUCCESS',manifest.version,'files',rows.length,'patched',patchedCount);
