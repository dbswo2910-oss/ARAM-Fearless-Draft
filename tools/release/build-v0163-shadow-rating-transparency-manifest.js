'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..');
const manifestPath=path.join(ROOT,'update','manifest.json');
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const MIRRORS=Object.freeze([
  ['src/rating/universal/confidence.js','update/v0.16.3/src/rating/universal/confidence.js'],
  ['src/rating/universal/runtime.js','update/v0.16.3/src/rating/universal/runtime.js'],
  ['src/profile/shadow-rating-diagnostics-renderer.js','update/v0.16.3/src/profile/shadow-rating-diagnostics-renderer.js']
]);
const CHANGES=Object.freeze([
  ['package.json','update/v0.16.3/package.json'],
  ['main-v0163-shadow-transparency.js','update/v0.16.3/main-v0163-shadow-transparency.js'],
  ['src/rating/universal/confidence.js','update/v0.16.3/src/rating/universal/confidence.js'],
  ['src/rating/universal/runtime.js','update/v0.16.3/src/rating/universal/runtime.js'],
  ['src/profile/shadow-rating-diagnostics-renderer.js','update/v0.16.3/src/profile/shadow-rating-diagnostics-renderer.js']
]);
function syncMirrors(){
  for(const [source,mirror] of MIRRORS){
    const src=path.join(ROOT,...source.split('/')),dst=path.join(ROOT,...mirror.split('/'));
    if(!fs.existsSync(src))throw new Error(`missing canonical source ${source}`);
    fs.mkdirSync(path.dirname(dst),{recursive:true});
    const next=fs.readFileSync(src);
    if(!fs.existsSync(dst)||!fs.readFileSync(dst).equals(next))fs.writeFileSync(dst,next);
  }
}
function entry(target,source){
  if(!String(source).startsWith('update/'))throw new Error(`unsafe updater source outside update/: ${target} -> ${source}`);
  const sourcePath=path.join(ROOT,...source.split('/'));
  if(!fs.existsSync(sourcePath))throw new Error(`missing release source ${source}`);
  return{path:target,source,sha256:sha256(sourcePath)};
}
function expectedEntries(){return CHANGES.map(([target,source])=>entry(target,source))}
function apply(base){
  if(!base||!Array.isArray(base.files))throw new Error('manifest files missing');
  const out=JSON.parse(JSON.stringify(base));
  out.version='0.16.3';
  out.message='v0.16.3 · SHADOW RATING TRANSPARENCY';
  out.production_rating_active=false;
  out.automatic_rating_promotion=false;
  out.universal_rating_shadow=true;
  out.universal_rating_shadow_diagnostics=true;
  out.universal_rating_shadow_transparency=true;
  const byPath=new Map(out.files.map((f,i)=>[String(f.path),i]));
  for(const e of expectedEntries()){
    if(byPath.has(e.path))out.files[byPath.get(e.path)]=e;
    else{byPath.set(e.path,out.files.length);out.files.push(e)}
  }
  return out;
}
function validate(m){
  if(String(m.version)!=='0.16.3')throw new Error(`expected v0.16.3 manifest, got ${m.version}`);
  if(m.production_rating_active!==false||m.automatic_rating_promotion!==false||m.universal_rating_shadow!==true||m.universal_rating_shadow_diagnostics!==true||m.universal_rating_shadow_transparency!==true)throw new Error('shadow transparency safety metadata invalid');
  for(const row of m.files||[])if(!String(row.source||'').startsWith('update/'))throw new Error(`unsafe manifest source ${row.path} -> ${row.source}`);
  const byPath=new Map((m.files||[]).map(x=>[String(x.path),x]));
  for(const e of expectedEntries()){
    const got=byPath.get(e.path);
    if(!got)throw new Error(`manifest missing ${e.path}`);
    if(got.source!==e.source)throw new Error(`source mismatch ${e.path}`);
    if(String(got.sha256||'').toLowerCase()!==e.sha256)throw new Error(`sha256 mismatch ${e.path}`);
  }
  for(const [source,mirror] of MIRRORS){
    const src=path.join(ROOT,...source.split('/')),dst=path.join(ROOT,...mirror.split('/'));
    if(!fs.readFileSync(src).equals(fs.readFileSync(dst)))throw new Error(`updater mirror mismatch ${mirror} != ${source}`);
  }
  return true;
}
function main(){
  syncMirrors();
  const current=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  if(!['0.16.2','0.16.3'].includes(String(current.version)))throw new Error(`refusing manifest transition from ${current.version}`);
  const out=apply(current);
  validate(out);
  const text=JSON.stringify(out,null,2)+'\n';
  if(fs.readFileSync(manifestPath,'utf8')!==text)fs.writeFileSync(manifestPath,text,'utf8');
  console.log('V0.16.3 SHADOW RATING TRANSPARENCY MANIFEST: VALID',JSON.stringify({version:out.version,changed_entries:CHANGES.length,mirrors:MIRRORS.length,production_rating_active:false,automatic_rating_promotion:false,all_sources_under_update:true}));
}
if(require.main===module)main();
module.exports={MIRRORS,CHANGES,syncMirrors,expectedEntries,apply,validate};
