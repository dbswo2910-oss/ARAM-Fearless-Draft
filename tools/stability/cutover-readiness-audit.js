'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const ROOT=process.cwd();
const p=(...xs)=>path.join(ROOT,...xs);
const json=f=>JSON.parse(fs.readFileSync(p(f),'utf8').replace(/^\uFEFF/,''));
const text=f=>fs.readFileSync(p(f),'utf8');
const manifest=json('update/manifest.json');
const owners=require(p('src/core/owner-registry.js'));
const preparation=json('release/v0.16.0-cutover-preparation.json');
const finalApproval=json('release/v0.16.0-final-approval.json');
const productionCutover=json('release/v0.16.0-production-cutover.json');
const stateAudit=text('tools/stability/state-compat-audit.js');
const persistenceWorkflow=text('.github/workflows/v0160-installed-persistence-acceptance.yml');
const windowsWorkflow=text('.github/workflows/v0160-installed-windows-acceptance.yml');

function semver(v){const m=String(v||'').match(/^(\d+)\.(\d+)\.(\d+)$/);return m?m.slice(1).map(Number):null}
function atLeast(v,min){const a=semver(v),b=semver(min);if(!a||!b)return false;for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i]}return true}
const preCutover=manifest.version==='0.15.135';
const postCutover=atLeast(manifest.version,'0.16.0');
assert.ok(preCutover||postCutover,`unsupported cutover lifecycle manifest version: ${manifest.version}`);

const registry=owners.owners||owners.registry||owners.subsystems||owners;
const ownerRows=[];
for(const [name,value] of Object.entries(registry)){
  if(name==='production_active')continue;
  const status=typeof value==='string'?value:value?.status;
  if(status)ownerRows.push({owner:name,status,mode:value?.mode||'',canonical:value?.canonical||'',legacy:value?.legacy||'',production_active:!!value?.production_active});
}
assert.strictEqual(ownerRows.length,15,'expected 15 canonical owners');
assert.strictEqual(owners.assertSingleOwner(),true,'canonical registry must remain single-owner');

assert.strictEqual(preparation?.physical_acceptance?.status,'SUCCESS','real physical Windows acceptance must be recorded as SUCCESS');
assert.match(String(preparation?.physical_acceptance?.evidence_sha256||''),/^[a-f0-9]{64}$/,'real physical evidence hash missing');
assert.strictEqual(Number(preparation?.physical_acceptance?.real_lcu_http_status),200,'real League/LCU acceptance must record HTTP 200');
assert.strictEqual(Number(preparation?.physical_acceptance?.research_matches_before),159,'real Research before count mismatch');
assert.strictEqual(Number(preparation?.physical_acceptance?.research_matches_after),159,'real Research after count mismatch');
assert.strictEqual(preparation?.approval?.cutover_preparation_approved,true,'cutover preparation approval missing');

if(preCutover){
  assert.strictEqual(owners.production_active,false,'canonical registry must remain production-inactive before final production release authorization');
  assert.ok(ownerRows.every(x=>x.status==='shadow'),'all canonical subsystem owners must remain shadow during cutover preparation');
  assert.ok(ownerRows.every(x=>x.production_active===false),'no subsystem owner may be production-active during cutover preparation');
  assert.strictEqual(preparation?.approval?.final_production_release_approved,false,'final production release must still be unapproved during preparation');
  assert.ok(stateAudit.includes('VERIFIED_V01549_TO_V015135_IN_PLACE_TWO_RESTARTS')||stateAudit.includes('VERIFIED_SUCCESSOR_IN_PLACE_TWO_RESTARTS'),'installed persistence evidence not promoted into state audit');
}else{
  assert.strictEqual(owners.production_active,true,'canonical registry must remain production-active after v0.16 cutover');
  assert.strictEqual(owners.legacy_removal_authorized,false,'legacy runtime removal must remain unauthorized');
  assert.ok(ownerRows.every(x=>x.status==='production'),'all canonical subsystem registry owners must remain production after v0.16 cutover');
  assert.ok(ownerRows.every(x=>String(x.mode).includes('production-adapter')),'all canonical subsystem registry owners must remain explicit production adapters');
  assert.ok(ownerRows.every(x=>x.canonical&&x.legacy),'every production adapter must preserve canonical and legacy delegate paths');
  assert.strictEqual(finalApproval?.stage,'V0160_FINAL_PRODUCTION_RELEASE_APPROVAL','final approval record stage mismatch');
  assert.strictEqual(finalApproval?.release,'0.16.0','final approval release mismatch');
  assert.strictEqual(finalApproval?.approval?.final_production_release_approved,true,'final production release approval missing');
  assert.strictEqual(finalApproval?.approval?.production_candidate_implementation_authorized,true,'production candidate implementation authorization missing');
  assert.strictEqual(finalApproval?.approval?.legacy_removal_authorized,false,'final approval must keep legacy removal unauthorized');
  assert.strictEqual(productionCutover?.stage,'V0160_PRODUCTION_CUTOVER','production cutover record stage mismatch');
  assert.strictEqual(productionCutover?.release,'0.16.0','production cutover release mismatch');
  assert.strictEqual(productionCutover?.user_authorization,'explicit-production-cutover-approved','production cutover user authorization missing');
  assert.strictEqual(productionCutover?.production_candidate_gate?.status,'SUCCESS','production candidate gate evidence must be SUCCESS');
  assert.strictEqual(productionCutover?.post_activation_regression?.status,'SUCCESS','post-activation regression evidence must be SUCCESS');
  assert.strictEqual(productionCutover?.physical_acceptance?.status,'SUCCESS','production cutover physical acceptance must be SUCCESS');
  assert.match(String(productionCutover?.physical_acceptance?.evidence_sha256||''),/^[a-f0-9]{64}$/,'production cutover physical evidence hash missing');
  assert.strictEqual(Number(productionCutover?.physical_acceptance?.lcu_http_status),200,'production cutover LCU acceptance must record HTTP 200');
  assert.strictEqual(productionCutover?.physical_acceptance?.research_matches,'159->159','production cutover Research preservation evidence mismatch');
  assert.strictEqual(productionCutover?.safety?.golden_rollback_target,'0.15.135','Golden rollback target drift');
  assert.strictEqual(productionCutover?.safety?.legacy_removal_authorized,false,'production cutover must keep legacy removal unauthorized');
  assert.strictEqual(productionCutover?.safety?.probation_required,true,'post-cutover probation requirement missing');
  assert.ok(stateAudit.includes('VERIFIED_SUCCESSOR_IN_PLACE_TWO_RESTARTS'),'successor installed persistence evidence not promoted into state audit');
}

for(const needle of ['research_checkpoint_matches=159','Run-Golden 1','Run-Golden 2','state-integrity-v015117'])assert.ok(persistenceWorkflow.includes(needle),`persistence gate missing ${needle}`);
if(preCutover){
  for(const needle of ['electron_version','aram-fearless-draft','0.15.135'])assert.ok(windowsWorkflow.includes(needle)||windowsWorkflow.includes(needle.replace('_','-')),`installed Windows gate missing ${needle}`);
}else{
  for(const needle of ['electron_version','aram-fearless-draft','update\\manifest.json','expectedVersion'])assert.ok(windowsWorkflow.includes(needle)||windowsWorkflow.includes(needle.replace('_','-')),`successor installed Windows gate missing ${needle}`);
}

const files=Array.isArray(manifest.files)?manifest.files:[];
assert.ok(files.length>0,'active manifest file list missing');
for(const entry of files){
  assert.ok(String(entry.path||''),'manifest target path missing');
  assert.ok(String(entry.source||'').startsWith('update/'),`manifest source escaped updater root: ${entry.path} -> ${entry.source}`);
}
const legacyRuntimeDependencies=files.map((entry,index)=>({
  index,
  target:String(entry.path||entry.target||entry.dest||entry.destination||''),
  source:String(entry.source||''),
  sha256:String(entry.sha256||entry.hash||''),
  classification:String(entry.source||'').startsWith('update/v0.15.')?'legacy-versioned-runtime-source':'successor-or-other-manifest-source'
}));
const versioned=legacyRuntimeDependencies.filter(x=>x.classification==='legacy-versioned-runtime-source');
const fallbackDependencies=[
  {id:'golden-state-preload-fallback',path:'%APPDATA%\\ARAM Fearless Draft',status:'legacy-preserved',reason:'v0.15.117 state-integrity preload fallback when electron.app is unavailable; keep through cutover probation'},
  {id:'stable-userData',path:'%APPDATA%\\aram-fearless-draft',status:'must-preserve',reason:'physical Windows acceptance verified this stable Chromium userData identity'},
  {id:'research-db',path:'IndexedDB aram-rating-research-v03 / checkpoint-v03',status:'must-preserve',reason:'physical acceptance verified 159 matches and unchanged checkpoint digest'},
  {id:'transaction-safety',path:'update-safety-v01579 / v0.15.116 probation contract',status:'must-preserve-until-canonical-updater-probation',reason:'rollback and probation safety stays until canonical updater passes production-active probation'}
];

const remainingReleaseGates=preCutover?[
  'Explicit final production-release authorization before manifest/main mutation',
  'Production-active candidate full regression after canonical owner activation',
  'Post-switch probation before legacy runtime removal'
]:[
  'Current successor full CI must be green before merge',
  'Post-switch probation must remain satisfied before any legacy runtime removal'
];

const report={
  status:preCutover?'READY_FOR_CUTOVER_PREPARATION':'SUCCESSOR_CUTOVER_GUARDS_READY',
  stage:'V0160_CUTOVER_READINESS_MATRIX',
  lifecycle_mode:preCutover?'pre-cutover-preparation':'post-cutover-successor',
  production_manifest_version:manifest.version,
  canonical_owner_count:ownerRows.length,
  canonical_owners:ownerRows,
  canonical_all_shadow:preCutover,
  canonical_all_production_adapters:postCutover,
  canonical_production_active:owners.production_active,
  legacy_removal_authorized:owners.legacy_removal_authorized===true,
  installed_windows_gate_present:true,
  installed_persistence_gate_present:true,
  installed_persistence_two_restart_contract:true,
  physical_windows_acceptance:'SUCCESS',
  real_league_lcu_acceptance:'SUCCESS',
  physical_evidence_sha256:postCutover?productionCutover.physical_acceptance.evidence_sha256:preparation.physical_acceptance.evidence_sha256,
  cutover_preparation_approved:true,
  final_production_release_approved:postCutover,
  production_cutover_recorded:postCutover,
  legacy_manifest_dependency_count:legacyRuntimeDependencies.length,
  legacy_versioned_runtime_source_count:versioned.length,
  legacy_runtime_dependencies:legacyRuntimeDependencies,
  fallback_dependencies:fallbackDependencies,
  automated_cutover_prerequisites:{canonical_parity:true,windows_installed_cold_start:true,installed_persistence:true,physical_windows_real_lcu:true,synthetic_soak:'green at RC automated checkpoint'},
  remaining_release_gates:remainingReleaseGates,
  cutover_plan_ready:true,
  legacy_runtime_removal_eligible:false,
  reason_not_yet_removal_eligible:'legacy runtime remains Last Known Good until separately authorized removal gates and probation are satisfied',
  production_cutover_eligible:postCutover,
  production_cutover_authorized:postCutover,
  production_manifest_unchanged:preCutover,
  score_logic_changed:false,
  random_scoring_changed:false
};

const out=p('audit-output','stability','cutover-readiness-report.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2),'utf8');
console.log('V0.16 CUTOVER READINESS:',report.status,JSON.stringify({owners:ownerRows.length,manifest:manifest.version,physicalWindows:'SUCCESS',realLcu:'SUCCESS',remainingReleaseGates:remainingReleaseGates.length,productionCutoverAuthorized:report.production_cutover_authorized,legacyRemovalAuthorized:report.legacy_removal_authorized}));
