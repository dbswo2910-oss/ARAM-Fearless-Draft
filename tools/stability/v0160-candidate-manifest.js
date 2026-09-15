'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../..');
const p=(...xs)=>path.join(ROOT,...xs);
const sha256=rel=>crypto.createHash('sha256').update(fs.readFileSync(p(rel))).digest('hex');
const clone=x=>JSON.parse(JSON.stringify(x));

const REQUIRED=[
  ['package.json','update/v0.16.0/package.json'],
  ['main-v0160.js','update/v0.16.0/main-v0160.js'],
  ['successor-route-v0160.js','update/v0.16.0/successor-route-v0160.js'],
  ['cold-start-promotion-v0160.js','update/v0.16.0/cold-start-promotion-v0160.js'],
  ['canonical-owner-bundler-v0160.js','update/v0.16.0/canonical-owner-bundler-v0160.js'],
  ['canonical-renderer-bundle.js','update/v0.16.0/canonical-renderer-bundle.js']
];

function collectCanonicalSources(){
  const out=[];
  function walk(abs,rel){
    for(const e of fs.readdirSync(abs,{withFileTypes:true})){
      const nextAbs=path.join(abs,e.name),nextRel=path.posix.join(rel,e.name);
      if(e.isDirectory())walk(nextAbs,nextRel);
      else if(e.isFile()&&/\.js$/i.test(e.name))out.push([`canonical/${nextRel}`,nextRel]);
    }
  }
  walk(p('src'),'src');
  return out;
}

function upsert(files,target,source){
  if(!fs.existsSync(p(source)))throw new Error(`missing v0.16 candidate source: ${source}`);
  const next={path:target,source,sha256:sha256(source)};
  const i=files.findIndex(x=>x.path===target);
  if(i>=0)files[i]={...files[i],...next};else files.push(next);
}

function buildCandidateManifest(){
  const production=JSON.parse(fs.readFileSync(p('update','manifest.json'),'utf8'));
  if(String(production.version)!=='0.15.135')throw new Error(`candidate builder requires untouched Golden manifest v0.15.135; found ${production.version}`);
  const candidate=clone(production);
  candidate.version='0.16.0';
  candidate.message='v0.16.0 · CLEAN BASELINE production candidate';
  candidate.min_launcher=production.min_launcher||'2.0.2';
  candidate.files=Array.isArray(candidate.files)?candidate.files:[];
  for(const [target,source] of REQUIRED)upsert(candidate.files,target,source);
  const canonicalSources=collectCanonicalSources();
  for(const [target,source] of canonicalSources)upsert(candidate.files,target,source);
  candidate.candidate={
    schema:1,
    isolated:true,
    production_manifest_mutated:false,
    golden_rollback_target:'0.15.135',
    legacy_removal:false,
    canonical_source_materialized:true,
    canonical_source_count:canonicalSources.length,
    owner_mode:'production-adapter'
  };
  return candidate;
}

function writeCandidateManifest(out='audit-output/stability/v0160-candidate-manifest.json'){
  const candidate=buildCandidateManifest();
  const abs=p(out);
  fs.mkdirSync(path.dirname(abs),{recursive:true});
  fs.writeFileSync(abs,JSON.stringify(candidate,null,2)+'\n','utf8');
  return{candidate,out,absolute:abs};
}

if(require.main===module){
  const {candidate,out}=writeCandidateManifest();
  console.log('V0.16 CANDIDATE MANIFEST: BUILT',JSON.stringify({version:candidate.version,files:candidate.files.length,canonical_source_count:candidate.candidate.canonical_source_count,out,production_manifest_mutated:false}));
}
module.exports={REQUIRED,collectCanonicalSources,buildCandidateManifest,writeCandidateManifest};
