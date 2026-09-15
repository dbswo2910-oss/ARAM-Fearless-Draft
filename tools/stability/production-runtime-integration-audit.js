'use strict';
const fs=require('fs');
const path=require('path');

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
if(String(manifest.version)==='0.15.135')pass('golden-manifest-still-safe','production manifest remains v0.15.135 while candidate is incomplete');
else block('golden-manifest-still-safe',`candidate work must not mutate production manifest before all gates are green; found ${manifest.version}`);

const registry=require(p('src','core','owner-registry.js'));
const rows=Object.entries(registry.owners||{}).map(([name,x])=>({name,status:x?.status,canonical:x?.canonical}));
if(registry.production_active===true&&rows.length===15&&rows.every(x=>x.status==='production'))pass('canonical-registry-active','all 15 canonical owners are production-active');
else block('canonical-registry-active',`registry production_active=${registry.production_active}; production owners=${rows.filter(x=>x.status==='production').length}/${rows.length}`);

const v16PkgPath=p('update','v0.16.0','package.json');
if(exists('update','v0.16.0','package.json')){
  const pkg=JSON.parse(fs.readFileSync(v16PkgPath,'utf8'));
  if(String(pkg.version)==='0.16.0')pass('v016-package','dedicated v0.16.0 package exists');
  else block('v016-package',`update/v0.16.0/package.json version is ${pkg.version}`);
  const main=String(pkg.main||'');
  if(main&&exists('update','v0.16.0',main))pass('v016-main-entry',`v0.16 main entry exists: ${main}`);
  else block('v016-main-entry',`v0.16 package main entry missing: ${main||'(empty)'}`);
}else{
  block('v016-package','update/v0.16.0/package.json does not exist');
  block('v016-main-entry','no v0.16 production main entry exists');
}

const manifestSources=(manifest.files||[]).map(x=>String(x.source||''));
const canonicalManifestSources=manifestSources.filter(x=>x.startsWith('src/')||x.startsWith('update/v0.16.0/'));
if(canonicalManifestSources.length>0)pass('canonical-package-materialization',`${canonicalManifestSources.length} canonical/v0.16 sources are materialized by the manifest`);
else block('canonical-package-materialization','production manifest materializes zero src/ or update/v0.16.0 canonical sources');

// Renderer integration must be explicit because the Golden BrowserWindow runs with
// contextIsolation:true and nodeIntegration:false. Shipping CommonJS source alone is not execution.
const rendererBundleCandidates=[
  ['update','v0.16.0','canonical-renderer-bundle.js'],
  ['update','v0.16.0','renderer-v0160.js'],
  ['src','runtime','production-renderer-entry.js']
];
const rendererIntegration=rendererBundleCandidates.find(parts=>exists(...parts));
if(rendererIntegration)pass('canonical-renderer-entry',rendererIntegration.join('/'));
else block('canonical-renderer-entry','no production renderer bundle/entry exists to execute canonical CommonJS owners under nodeIntegration:false');

const mainIntegrationCandidates=[
  ['update','v0.16.0','main-v0160.js'],
  ['src','runtime','production-main-entry.js']
];
const mainIntegration=mainIntegrationCandidates.find(parts=>exists(...parts));
if(mainIntegration)pass('canonical-main-entry',mainIntegration.join('/'));
else block('canonical-main-entry','no v0.16 production main integration entry exists');

const draftIndex=read('src','draft','index.js');
if(/production_active\s*:\s*true/.test(draftIndex)&&!/0\.16-shadow/.test(draftIndex))pass('draft-production-owner','Draft canonical export is production-marked');
else block('draft-production-owner','Draft canonical index is still a shadow risk-engine export, not a production Draft owner');

const randomOwner=read('src','random','pick','owner.js');
if(/owner_status\s*:\s*['"]production['"]/.test(randomOwner)&&/production_active\s*:\s*true/.test(randomOwner))pass('random-pick-production-owner','RANDOM PICK owner is production-marked');
else block('random-pick-production-owner','RANDOM PICK owner is still 0.16-shadow / production_active:false');

const dataOwner=read('src','data','owner.js');
if(/owner_status\s*:\s*['"]production['"]/.test(dataOwner)&&/production_active\s*:\s*true/.test(dataOwner))pass('data-production-owner','DATA owner is production-marked');
else block('data-production-owner','DATA owner is still 0.16-shadow / production_active:false');

const ready=blockers.length===0;
const report={
  status:ready?'READY':'BLOCKED',
  stage:'V0160_PRODUCTION_RUNTIME_INTEGRATION',
  release:'0.16.0',
  production_manifest_version:String(manifest.version),
  explicit_final_approval:approval?.approval?.final_production_release_approved===true,
  production_cutover_authorized:ready,
  main_merge_authorized:ready,
  legacy_removal_authorized:false,
  passes,
  blockers,
  safety:{
    on_block:'STOP_BEFORE_MAIN_OR_MANIFEST_MUTATION',
    golden_rollback_target:'0.15.135'
  }
};
fs.mkdirSync(p('audit-output','stability'),{recursive:true});
fs.writeFileSync(p('audit-output','stability','production-runtime-integration-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log(`V0.16 PRODUCTION RUNTIME INTEGRATION: ${report.status}`,JSON.stringify({passes:passes.length,blockers:blockers.length,manifest:manifest.version}));
for(const x of blockers)console.error(`BLOCKER ${x.id}: ${x.detail}`);
if(!ready)process.exit(1);
