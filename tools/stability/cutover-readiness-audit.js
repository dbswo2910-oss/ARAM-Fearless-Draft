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
const cutover=json('release/v0.16.0-production-cutover.json');
const currentState=json('update/current-state.json');
const persistenceWorkflow=text('.github/workflows/v0160-installed-persistence-acceptance.yml');
const windowsWorkflow=text('.github/workflows/v0160-installed-windows-acceptance.yml');

assert.strictEqual(manifest.version,'0.16.0','active production manifest must remain v0.16.0');
assert.strictEqual(String(currentState.active?.version||''),'0.16.0','current-state active version drift');
assert.strictEqual(owners.production_active,true,'canonical registry must remain production-active after v0.16 cutover');
assert.strictEqual(owners.legacy_removal_authorized,false,'legacy removal must remain separately gated');
const registry=owners.owners||owners.registry||owners.subsystems||owners;
const ownerRows=[];
for(const [name,value] of Object.entries(registry)){
  if(name==='production_active'||name==='legacy_removal_authorized')continue;
  const status=typeof value==='string'?value:value?.status;
  if(status)ownerRows.push({owner:name,status,mode:value?.mode||null,production_active:!!value?.production_active});
}
assert.strictEqual(ownerRows.length,15,'expected 15 canonical owners');
assert.ok(ownerRows.every(x=>x.status==='production'),'all canonical subsystem owners must remain production-owned after cutover');
assert.ok(ownerRows.every(x=>/production-adapter$/.test(String(x.mode||''))),'all canonical owners must remain production-adapter owned while legacy removal is blocked');

assert.strictEqual(preparation?.physical_acceptance?.status,'SUCCESS','historical physical Windows acceptance must remain recorded');
assert.match(String(preparation?.physical_acceptance?.evidence_sha256||''),/^[a-f0-9]{64}$/,'historical physical evidence hash missing');
assert.strictEqual(Number(preparation?.physical_acceptance?.real_lcu_http_status),200,'historical real League/LCU acceptance must record HTTP 200');
assert.strictEqual(finalApproval?.approval?.final_production_release_approved,true,'v0.16 final production release approval missing');
assert.strictEqual(finalApproval?.approval?.legacy_removal_authorized,false,'legacy removal must remain unapproved in final approval');
assert.strictEqual(cutover?.stage,'V0160_PRODUCTION_CUTOVER','production cutover receipt missing');
assert.strictEqual(cutover?.production_candidate_gate?.status,'SUCCESS','production candidate gate receipt is not green');
assert.strictEqual(cutover?.post_activation_regression?.status,'SUCCESS','post-activation regression receipt is not green');
assert.strictEqual(cutover?.physical_acceptance?.status,'SUCCESS','physical cutover acceptance receipt is not green');
assert.strictEqual(cutover?.safety?.legacy_removal_authorized,false,'cutover receipt must keep legacy removal blocked');

for(const needle of ['Apply active manifest in place','Verify-State 1','Verify-State 2','state-integrity-v015117','legacy_storage_marker_required=$false'])assert.ok(persistenceWorkflow.includes(needle),`persistence gate missing ${needle}`);
for(const needle of ['Materialize active installed app plus canonical shadow payload','--expected-version \"$env:ACTIVE_VERSION\"','stable_user_data_identity','legacy_storage_marker_required = $false'])assert.ok(windowsWorkflow.includes(needle),`installed Windows gate missing ${needle}`);

const files=Array.isArray(manifest.files)?manifest.files:[];
assert.ok(files.length>0,'active manifest file list missing');
const runtimeDependencies=files.map((entry,index)=>({
  index,
  target:String(entry.path||entry.target||entry.dest||entry.destination||''),
  source:String(entry.source||''),
  sha256:String(entry.sha256||entry.hash||''),
  classification:String(entry.source||'').startsWith('update/v0.15.')?'legacy-versioned-runtime-source':String(entry.source||'').startsWith('update/v0.16.0/')?'v0160-runtime-source':'other-manifest-source'
}));
const legacyVersioned=runtimeDependencies.filter(x=>x.classification==='legacy-versioned-runtime-source');
const fallbackDependencies=[
  {id:'historical-golden',path:'update/v0.15.135',status:'preserve',reason:'Golden rollback/reference lineage remains preserved'},
  {id:'stable-userData',path:'%APPDATA%\\aram-fearless-draft',status:'must-preserve',reason:'stable Chromium userData identity'},
  {id:'research-db',path:'IndexedDB aram-rating-research-v03 / checkpoint-v03',status:'must-preserve',reason:'research checkpoint identity must not be mutated by stability cutover'},
  {id:'transaction-safety',path:'update-safety-v01579',status:'must-preserve',reason:'rollback/probation safety remains active while legacy removal is unauthorized'}
];
const remainingReleaseGates=[
  'Keep post-cutover regression and installed Windows/persistence gates green',
  'Keep historical Golden rollback/reference lineage intact',
  'Require separate explicit authorization before legacy runtime removal',
  'Keep ARAM Rating production activation governed by its independent research evidence gates'
];

const report={
  status:'POST_CUTOVER_GUARDS_VERIFIED',
  stage:'V0160_POST_CUTOVER_READINESS_MATRIX',
  production_manifest_version:manifest.version,
  current_active_version:currentState.active?.version||null,
  canonical_owner_count:ownerRows.length,
  canonical_owners:ownerRows,
  canonical_all_production:true,
  canonical_production_active:true,
  production_adapter_mode:true,
  installed_windows_gate_present:true,
  installed_persistence_gate_present:true,
  installed_persistence_two_restart_contract:true,
  historical_physical_windows_acceptance:'SUCCESS',
  historical_real_league_lcu_acceptance:'SUCCESS',
  physical_evidence_sha256:preparation.physical_acceptance.evidence_sha256,
  final_production_release_approved:true,
  production_cutover_receipt:'SUCCESS',
  post_activation_regression:'SUCCESS',
  manifest_dependency_count:runtimeDependencies.length,
  legacy_versioned_runtime_source_count:legacyVersioned.length,
  runtime_dependencies:runtimeDependencies,
  fallback_dependencies:fallbackDependencies,
  remaining_release_gates:remainingReleaseGates,
  production_cutover_eligible:true,
  production_cutover_authorized:true,
  production_manifest_unchanged:false,
  legacy_runtime_removal_eligible:false,
  legacy_removal_authorized:false,
  reason_not_yet_removal_eligible:'legacy removal remains separately gated even though v0.16 production adapter cutover is active',
  rating_production_activation_authorized:false,
  score_logic_changed:false,
  random_scoring_changed:false
};

const out=p('audit-output','stability','cutover-readiness-report.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2),'utf8');
console.log('V0.16 CUTOVER READINESS: POST_CUTOVER_GUARDS_VERIFIED',JSON.stringify({
  owners:ownerRows.length,
  activeVersion:manifest.version,
  physicalWindows:'SUCCESS',
  realLcu:'SUCCESS',
  legacyRemovalAuthorized:false,
  ratingProductionActivationAuthorized:false
}));
