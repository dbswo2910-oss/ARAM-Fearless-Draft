'use strict';
const fs=require('fs');
const path=require('path');
const {buildCandidateManifest}=require('./v0160-candidate-manifest');

const ROOT=process.cwd();
const p=(...xs)=>path.join(ROOT,...xs);
const exists=(...xs)=>fs.existsSync(p(...xs));
const read=(...xs)=>fs.readFileSync(p(...xs),'utf8');
const json=(...xs)=>JSON.parse(read(...xs));
const blockers=[];
const passes=[];
const block=(id,detail)=>blockers.push({id,detail});
const pass=(id,detail)=>passes.push({id,detail});

const approval=json('release','v0.16.0-final-approval.json');
if(approval?.approval?.final_production_release_approved===true)pass('explicit-final-approval','final production approval is recorded');
else block('explicit-final-approval','final production approval is missing');

const manifest=json('update','manifest.json');
if(String(manifest.version)==='0.15.135')pass('golden-manifest-still-safe','production manifest remains v0.15.135 while candidate is isolated');
else block('golden-manifest-still-safe',`candidate work must not mutate production manifest before post-activation gates are green; found ${manifest.version}`);

let candidate=null;
try{
  candidate=buildCandidateManifest();
  if(String(candidate.version)==='0.16.0'&&candidate?.candidate?.isolated===true&&candidate?.candidate?.production_manifest_mutated===false)pass('candidate-manifest','isolated v0.16.0 candidate manifest builds from untouched Golden v0.15.135');
  else block('candidate-manifest','candidate manifest isolation contract invalid');
}catch(e){block('candidate-manifest',e?.message||String(e))}

const registry=require(p('src','core','owner-registry.js'));
const rows=Object.entries(registry.owners||{}).map(([name,x])=>({name,status:x?.status,mode:x?.mode,canonical:x?.canonical}));
if(registry.production_active===true&&rows.length===15&&rows.every(x=>x.status==='production'&&/production-adapter/.test(String(x.mode))))pass('canonical-registry-active','all 15 canonical routing owners are production adapters');
else block('canonical-registry-active',`registry production_active=${registry.production_active}; production owners=${rows.filter(x=>x.status==='production').length}/${rows.length}`);

const v16PkgPath=p('update','v0.16.0','package.json');
let pkg=null;
if(exists('update','v0.16.0','package.json')){
  pkg=JSON.parse(fs.readFileSync(v16PkgPath,'utf8'));
  if(String(pkg.version)==='0.16.0')pass('v016-package','dedicated v0.16.0 package exists');
  else block('v016-package',`update/v0.16.0/package.json version is ${pkg.version}`);
  const main=String(pkg.main||'');
  if(main&&exists('update','v0.16.0',main))pass('v016-main-entry',`v0.16 main entry exists: ${main}`);
  else block('v016-main-entry',`v0.16 package main entry missing: ${main||'(empty)'}`);
}else{
  block('v016-package','update/v0.16.0/package.json does not exist');
  block('v016-main-entry','no v0.16 production main entry exists');
}

const candidateSources=(candidate?.files||[]).map(x=>String(x.source||''));
const candidateTargets=(candidate?.files||[]).map(x=>String(x.path||''));
const requiredCandidateSources=[
  'update/v0.16.0/package.json',
  'update/v0.16.0/main-v0160.js',
  'update/v0.16.0/successor-route-v0160.js',
  'update/v0.16.0/cold-start-promotion-v0160.js',
  'update/v0.16.0/canonical-owner-bundler-v0160.js',
  'update/v0.16.0/canonical-renderer-bundle.js',
  'src/core/owner-registry.js',
  'src/draft/production-adapter.js',
  'src/random/pick/production-adapter.js',
  'src/data/production-adapter.js'
];
const missingCandidateSources=requiredCandidateSources.filter(x=>!candidateSources.includes(x));
const canonicalTargets=candidateTargets.filter(x=>x.startsWith('canonical/src/'));
if(candidate&&missingCandidateSources.length===0&&canonicalTargets.length>=15)pass('canonical-package-materialization',`${canonicalTargets.length} canonical source files are materialized into the isolated v0.16 candidate`);
else block('canonical-package-materialization',`candidate missing ${missingCandidateSources.join(', ')||'canonical source materialization'}`);

const rendererPath=['update','v0.16.0','canonical-renderer-bundle.js'];
const bundlerPath=['update','v0.16.0','canonical-owner-bundler-v0160.js'];
const mainPath=['update','v0.16.0','main-v0160.js'];
if(exists(...rendererPath)&&exists(...bundlerPath)){
  const renderer=read(...rendererPath),bundler=read(...bundlerPath);
  const rendererOk=/stage:'production-owner-layer'/.test(renderer)&&/production_active:true/.test(renderer)&&/draft\/production-adapter\.js/.test(bundler)&&/random\/pick\/production-adapter\.js/.test(bundler)&&/data\/production-adapter\.js/.test(bundler);
  if(rendererOk)pass('canonical-renderer-entry','context-isolation-safe renderer owner layer executes canonical registry + Draft/RANDOM PICK/DATA adapters');
  else block('canonical-renderer-entry','renderer owner layer exists but does not execute required production adapters');
}else block('canonical-renderer-entry','v0.16 renderer owner layer/bundler missing');

if(exists(...mainPath)){
  const main=read(...mainPath);
  const required=[/buildRendererSource/,/path\.join\(__dirname,'canonical','src'/,/owner-registry\.js/,/production_active!==true/,/patchSuccessorSource/,/main-v015122\.js/,/runtime-source-stability-v015135/,/aram-fearless-draft/];
  if(required.every(x=>x.test(main)))pass('canonical-main-entry','v0.16 main requires the installed canonical registry, injects the owner bundle, and preserves Golden runtime safety/userData');
  else block('canonical-main-entry','v0.16 main entry does not satisfy production-owner + Golden bridge contract');
}else block('canonical-main-entry','no v0.16 production main integration entry exists');

let ownerRuntime=null;
try{ownerRuntime=json('audit-output','stability','canonical-production-owner-report.json')}catch{}
if(ownerRuntime?.status==='SUCCESS'&&ownerRuntime?.bridge?.production_active===true&&ownerRuntime?.bridge?.owners_active===15)pass('canonical-owner-runtime','synthetic context-isolation runtime executed all 15 routing owners and three renderer adapters');
else block('canonical-owner-runtime','canonical production owner runtime audit missing or failed');

for(const [id,rel] of [
  ['draft-production-owner','src/draft/production-adapter.js'],
  ['random-pick-production-owner','src/random/pick/production-adapter.js'],
  ['data-production-owner','src/data/production-adapter.js']
]){
  const src=read(...rel.split('/'));
  if(/owner_status\s*:\s*['"]production['"]/.test(src)&&/production_active\s*:\s*true/.test(src)&&/implementation_mode\s*:\s*['"]production-adapter['"]/.test(src))pass(id,`${rel} is a production adapter`);
  else block(id,`${rel} production adapter contract invalid`);
}

const ready=blockers.length===0;
const report={
  status:ready?'READY':'BLOCKED',
  stage:'V0160_PRODUCTION_RUNTIME_INTEGRATION',
  release:'0.16.0',
  production_manifest_version:String(manifest.version),
  candidate_manifest_version:String(candidate?.version||''),
  canonical_source_count:Number(candidate?.candidate?.canonical_source_count||0),
  explicit_final_approval:approval?.approval?.final_production_release_approved===true,
  runtime_integration_ready:ready,
  production_cutover_authorized:false,
  main_merge_authorized:false,
  legacy_removal_authorized:false,
  next_gate:ready?'post-activation-full-regression':'fix-runtime-integration-blockers',
  passes,
  blockers,
  safety:{on_block:'STOP_BEFORE_MAIN_OR_MANIFEST_MUTATION',golden_rollback_target:'0.15.135'}
};
fs.mkdirSync(p('audit-output','stability'),{recursive:true});
fs.writeFileSync(p('audit-output','stability','production-runtime-integration-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log(`V0.16 PRODUCTION RUNTIME INTEGRATION: ${report.status}`,JSON.stringify({passes:passes.length,blockers:blockers.length,manifest:manifest.version,candidate:candidate?.version||null,canonical:report.canonical_source_count,next:report.next_gate}));
for(const x of blockers)console.error(`BLOCKER ${x.id}: ${x.detail}`);
if(!ready)process.exit(1);
