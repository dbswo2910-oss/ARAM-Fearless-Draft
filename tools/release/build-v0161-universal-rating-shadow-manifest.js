'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..');
const manifestPath=path.join(ROOT,'update','manifest.json');
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const CHANGES=Object.freeze([
  ['package.json','update/v0.16.1/package.json'],
  ['main-v0161-shadow.js','update/v0.16.1/main-v0161-shadow.js'],
  ['preload.js','update/v0.16.1/preload-v0161-shadow.js'],
  ['preload-base-v015117.js','update/v0.15.117/preload.js'],
  ['src/main/universal-rating-ipc.js','src/main/universal-rating-ipc.js'],
  ['src/preload/universal-rating-history-hook.js','src/preload/universal-rating-history-hook.js'],
  ['src/rating/universal/contracts.js','src/rating/universal/contracts.js'],
  ['src/rating/universal/normalizer.js','src/rating/universal/normalizer.js'],
  ['src/rating/universal/confidence.js','src/rating/universal/confidence.js'],
  ['src/rating/universal/estimator.js','src/rating/universal/estimator.js'],
  ['src/rating/universal/store.js','src/rating/universal/store.js'],
  ['src/rating/universal/service.js','src/rating/universal/service.js'],
  ['src/rating/universal/runtime.js','src/rating/universal/runtime.js'],
  ['src/rating/universal/index.js','src/rating/universal/index.js'],
  ['update/v0.15.129/rating-engine-v01.js','update/v0.15.129/rating-engine-v01.js']
]);
function entry(target,source){const sourcePath=path.join(ROOT,...source.split('/'));if(!fs.existsSync(sourcePath))throw new Error(`missing release source ${source}`);return{path:target,source,sha256:sha256(sourcePath)}}
function expectedEntries(){return CHANGES.map(([target,source])=>entry(target,source))}
function apply(base){if(!base||!Array.isArray(base.files))throw new Error('manifest files missing');const out=JSON.parse(JSON.stringify(base));out.version='0.16.1';out.message='v0.16.1 · UNIVERSAL RATING SHADOW';out.production_rating_active=false;out.automatic_rating_promotion=false;out.universal_rating_shadow=true;const byPath=new Map(out.files.map((f,i)=>[String(f.path),i]));for(const e of expectedEntries()){if(byPath.has(e.path))out.files[byPath.get(e.path)]=e;else{byPath.set(e.path,out.files.length);out.files.push(e)}}return out}
function validate(m){if(String(m.version)!=='0.16.1')throw new Error(`expected v0.16.1 manifest, got ${m.version}`);if(m.production_rating_active!==false||m.automatic_rating_promotion!==false||m.universal_rating_shadow!==true)throw new Error('shadow safety metadata invalid');const byPath=new Map((m.files||[]).map(x=>[String(x.path),x]));for(const e of expectedEntries()){const got=byPath.get(e.path);if(!got)throw new Error(`manifest missing ${e.path}`);if(got.source!==e.source)throw new Error(`source mismatch ${e.path}`);if(String(got.sha256||'').toLowerCase()!==e.sha256)throw new Error(`sha256 mismatch ${e.path}`)}return true}
function main(){const current=JSON.parse(fs.readFileSync(manifestPath,'utf8'));let out;if(String(current.version)==='0.16.0')out=apply(current);else if(String(current.version)==='0.16.1'){out=current;validate(out)}else throw new Error(`refusing manifest transition from ${current.version}`);validate(out);const text=JSON.stringify(out,null,2)+'\n';if(fs.readFileSync(manifestPath,'utf8')!==text)fs.writeFileSync(manifestPath,text,'utf8');console.log('V0.16.1 UNIVERSAL RATING SHADOW MANIFEST: VALID',JSON.stringify({version:out.version,changed_entries:CHANGES.length,production_rating_active:false,automatic_rating_promotion:false}));}
if(require.main===module)main();
module.exports={CHANGES,expectedEntries,apply,validate};
