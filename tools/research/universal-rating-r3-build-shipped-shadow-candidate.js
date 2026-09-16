'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..');
const OUT=path.join(ROOT,'audit-output','universal-rating-r3-shipped-shadow-candidate');
const OVERLAY=path.join(OUT,'overlay');
const ACTIVE_MANIFEST=path.join(ROOT,'update','manifest.json');
const CHANGES=Object.freeze([
  ['package.json','update/v0.16.1/package.json'],
  ['main-v0161-shadow.js','update/v0.16.1/main-v0161-shadow.js'],
  ['preload-v0161-shadow.js','update/v0.16.1/preload-v0161-shadow.js'],
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
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ensure=d=>fs.mkdirSync(d,{recursive:true});
function sourceBytes(rel){return fs.readFileSync(path.join(ROOT,rel));}
function writeFile(rel,bytes){const p=path.join(OVERLAY,...rel.split('/'));ensure(path.dirname(p));fs.writeFileSync(p,bytes);return p;}
function build(){
  const active=JSON.parse(fs.readFileSync(ACTIVE_MANIFEST,'utf8'));
  if(active.version!=='0.16.0')throw new Error(`expected active v0.16.0, got ${active.version}`);
  if(!Array.isArray(active.files))throw new Error('active manifest files missing');
  fs.rmSync(OUT,{recursive:true,force:true});ensure(OVERLAY);
  const candidate=JSON.parse(JSON.stringify(active));
  candidate.version='0.16.1';
  candidate.message='v0.16.1 · UNIVERSAL RATING SHADOW';
  candidate.candidate_only=true;
  candidate.production_rating_active=false;
  candidate.automatic_rating_promotion=false;
  const byPath=new Map(candidate.files.map((x,i)=>[String(x.path),i]));
  const changed=[];
  for(const [target,source] of CHANGES){
    const bytes=sourceBytes(source),entry={path:target,source,sha256:sha(bytes)};
    if(byPath.has(target))candidate.files[byPath.get(target)]=entry;
    else{byPath.set(target,candidate.files.length);candidate.files.push(entry);}
    writeFile(target,bytes);
    changed.push({...entry,bytes:bytes.length});
  }
  const pkg=JSON.parse(sourceBytes('update/v0.16.1/package.json').toString('utf8'));
  if(pkg.version!=='0.16.1'||pkg.main!=='main-v0161-shadow.js')throw new Error('candidate package contract invalid');
  const manifestPath=path.join(OUT,'manifest-candidate.json');
  fs.writeFileSync(manifestPath,JSON.stringify(candidate,null,2)+'\n','utf8');
  const report={
    schema:'aram-universal-rating-shipped-shadow-candidate-v1',
    status:'BUILT',base_version:'0.16.0',candidate_version:'0.16.1',candidate_only:true,
    active_manifest_mutated:false,production_rating_active:false,automatic_rating_promotion:false,
    history_network_owner:'existing_match_history_only',rating_network_owner:false,
    overlay_files:changed.length,changed,manifest_sha256:sha(fs.readFileSync(manifestPath))
  };
  fs.writeFileSync(path.join(OUT,'candidate-kit.json'),JSON.stringify(report,null,2)+'\n','utf8');
  return report;
}
if(require.main===module){const r=build();console.log('UNIVERSAL RATING R3 SHIPPED SHADOW CANDIDATE: BUILT',JSON.stringify({candidate:r.candidate_version,overlay_files:r.overlay_files,active_manifest_mutated:false}))}
module.exports={ROOT,OUT,OVERLAY,CHANGES,build};
