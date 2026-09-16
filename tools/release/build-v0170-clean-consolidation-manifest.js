'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const materializer=require('../refactor/materialize-v0170-clean-runtime');
const {BASELINE_COMMIT,VERSION}=materializer;
const ROOT=path.resolve(__dirname,'../..');
const manifestPath=path.join(ROOT,'update','manifest.json');
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const gitShowJson=rel=>JSON.parse(cp.execFileSync('git',['show',`${BASELINE_COMMIT}:${rel}`],{cwd:ROOT,encoding:'utf8',maxBuffer:128*1024*1024}).replace(/^\uFEFF/,''));
const CHANGES=Object.freeze([
  ['package.json','update/v0.17.0/package.json'],
  ['main.js','update/v0.17.0/main.js'],
  ['preload.js','update/v0.17.0/preload.js'],
  ['legacy-runtime-v0170.js','update/v0.17.0/legacy-runtime-v0170.js']
]);
function entry(target,source){
  if(!String(source).startsWith('update/'))throw new Error(`unsafe updater source outside update/: ${target} -> ${source}`);
  const p=path.join(ROOT,...source.split('/'));
  if(!fs.existsSync(p))throw new Error(`missing release source ${source}`);
  return{path:target,source,sha256:sha256(p)};
}
function apply(base){
  if(String(base?.version)!=='0.16.3')throw new Error(`v0.17 baseline must be 0.16.3, got ${base?.version}`);
  const out=JSON.parse(JSON.stringify(base));
  out.version=VERSION;
  out.message='v0.17.0 · CLEAN CONSOLIDATED RUNTIME';
  out.production_rating_active=false;
  out.automatic_rating_promotion=false;
  out.universal_rating_shadow=true;
  out.universal_rating_shadow_diagnostics=true;
  out.universal_rating_shadow_transparency=true;
  out.clean_runtime_consolidated=true;
  out.runtime_successor_wrappers=false;
  const by=new Map((out.files||[]).map((x,i)=>[String(x.path),i]));
  for(const [target,source] of CHANGES){const e=entry(target,source);if(by.has(target))out.files[by.get(target)]=e;else{by.set(target,out.files.length);out.files.push(e)}}
  return out;
}
function validate(m){
  if(String(m.version)!==VERSION)throw new Error(`expected ${VERSION}, got ${m.version}`);
  if(m.production_rating_active!==false||m.automatic_rating_promotion!==false||m.clean_runtime_consolidated!==true||m.runtime_successor_wrappers!==false)throw new Error('v0.17 clean-runtime safety metadata invalid');
  for(const row of m.files||[])if(!String(row.source||'').startsWith('update/'))throw new Error(`unsafe manifest source ${row.path} -> ${row.source}`);
  const by=new Map((m.files||[]).map(x=>[String(x.path),x]));
  for(const [target,source] of CHANGES){const got=by.get(target),want=entry(target,source);if(!got)throw new Error(`manifest missing ${target}`);if(got.source!==source)throw new Error(`source mismatch ${target}`);if(String(got.sha256||'').toLowerCase()!==want.sha256)throw new Error(`sha mismatch ${target}`)}
  return true;
}
function main(){
  materializer.main();
  const base=gitShowJson('update/manifest.json');
  const out=apply(base);validate(out);
  fs.writeFileSync(manifestPath,JSON.stringify(out,null,2)+'\n','utf8');
  console.log('V0.17 CLEAN CONSOLIDATION MANIFEST: VALID',JSON.stringify({version:VERSION,baseline:BASELINE_COMMIT,changed_entries:CHANGES.length,clean_runtime_consolidated:true,runtime_successor_wrappers:false}));
}
if(require.main===module)main();
module.exports={CHANGES,apply,validate,entry,main};
