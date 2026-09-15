'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {buildCandidateManifest}=require('./v0160-candidate-manifest');

const ROOT=path.resolve(__dirname,'../..');
const p=(...xs)=>path.join(ROOT,...xs);
function arg(name,def=''){const i=process.argv.indexOf(name);return i>=0&&process.argv[i+1]?process.argv[i+1]:def}
function sha(b){return crypto.createHash('sha256').update(b).digest('hex')}
function ensure(x){fs.mkdirSync(x,{recursive:true})}

function materialize(outDir){
  const candidate=buildCandidateManifest();
  const state=JSON.parse(fs.readFileSync(p('update','current-state.json'),'utf8'));
  const golden=JSON.parse(fs.readFileSync(p('update','manifest.json'),'utf8'));
  if(String(golden.version)!=='0.15.135')throw new Error(`production manifest drift before candidate materialization: ${golden.version}`);
  const runtimePath=state.owners?.random_pick?.active_runtime_source||'update/v0.15.135/runtime-source-stability-v015135.js';
  const runtime=require(p(runtimePath));
  if(typeof runtime.patchRuntimeSource!=='function')throw new Error(`runtime patcher missing: ${runtimePath}`);
  fs.rmSync(outDir,{recursive:true,force:true});ensure(outDir);
  const rows=[];
  for(const f of candidate.files||[]){
    if(!f.path||!f.source)throw new Error(`invalid candidate manifest row: ${JSON.stringify(f)}`);
    const sourcePath=p(f.source);if(!fs.existsSync(sourcePath))throw new Error(`candidate source missing: ${f.source}`);
    const raw=fs.readFileSync(sourcePath);if(f.sha256&&sha(raw)!==String(f.sha256).toLowerCase())throw new Error(`candidate source hash mismatch: ${f.source}`);
    let body=raw,patched=false;
    if(/\.js$/i.test(f.path)){
      const src=raw.toString('utf8');
      const next=runtime.patchRuntimeSource(f.path,src);
      new Function(next);
      patched=next!==src;body=Buffer.from(next,'utf8');
    }else if(/\.json$/i.test(f.path)){JSON.parse(raw.toString('utf8'))}
    const dst=path.join(outDir,f.path);ensure(path.dirname(dst));fs.writeFileSync(dst,body);
    rows.push({path:f.path,source:f.source,patched,sha256:sha(body),bytes:body.length});
  }
  const pkg=JSON.parse(fs.readFileSync(path.join(outDir,'package.json'),'utf8'));
  if(pkg.name!=='aram-fearless-draft'||pkg.version!=='0.16.0')throw new Error(`materialized package identity/version drift: ${pkg.name} ${pkg.version}`);
  if(!fs.existsSync(path.join(outDir,pkg.main)))throw new Error(`materialized v0.16 main missing: ${pkg.main}`);
  const registryPath=path.join(outDir,'canonical','src','core','owner-registry.js');
  if(!fs.existsSync(registryPath))throw new Error('materialized canonical owner registry missing');
  delete require.cache[require.resolve(registryPath)];
  const registry=require(registryPath),owners=Object.values(registry.owners||{});
  if(registry.production_active!==true||owners.length!==15||owners.some(x=>x.status!=='production'))throw new Error('materialized canonical registry is not 15/15 production');
  const report={status:'SUCCESS',stage:'V0160_CANDIDATE_MATERIALIZATION',version:'0.16.0',production_manifest_version:golden.version,production_manifest_mutated:false,runtime_patch_module:runtimePath,files:rows.length,patched_files:rows.filter(x=>x.patched).length,canonical_files:rows.filter(x=>x.path.startsWith('canonical/src/')).length,package:{name:pkg.name,version:pkg.version,main:pkg.main},canonical_owners:owners.length,legacy_removal:false,out_dir:path.resolve(outDir),rows};
  return report;
}

if(require.main===module){
  const out=path.resolve(arg('--out',p('audit-output','stability','post-activation','candidate-app')));
  const report=materialize(out);ensure(p('audit-output','stability','post-activation'));
  fs.writeFileSync(p('audit-output','stability','post-activation','materialization-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
  console.log('V0.16 CANDIDATE MATERIALIZATION: SUCCESS',JSON.stringify({files:report.files,canonical:report.canonical_files,patched:report.patched_files,out}));
}
module.exports={materialize};
