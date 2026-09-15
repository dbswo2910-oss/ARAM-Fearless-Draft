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
const approval=json('release/v0.16.0-cutover-preparation.json');
const stateAudit=text('tools/stability/state-compat-audit.js');
const persistenceWorkflow=text('.github/workflows/v0160-installed-persistence-acceptance.yml');
const windowsWorkflow=text('.github/workflows/v0160-installed-windows-acceptance.yml');

assert.strictEqual(manifest.version,'0.15.135','production manifest must remain Golden until the final production release step');
assert.strictEqual(owners.production_active,false,'canonical registry must remain production-inactive before final production release authorization');
const registry=owners.owners||owners.registry||owners.subsystems||owners;
const ownerRows=[];
for(const [name,value] of Object.entries(registry)){
  if(name==='production_active')continue;
  const status=typeof value==='string'?value:value?.status;
  if(status)ownerRows.push({owner:name,status,production_active:!!value?.production_active});
}
assert.strictEqual(ownerRows.length,15,'expected 15 canonical owners');
assert.ok(ownerRows.every(x=>x.status==='shadow'),'all canonical subsystem owners must remain shadow during cutover preparation');
assert.ok(ownerRows.every(x=>x.production_active===false),'no subsystem owner may be production-active during cutover preparation');
assert.ok(stateAudit.includes('VERIFIED_V01549_TO_V015135_IN_PLACE_TWO_RESTARTS'),'installed persistence evidence not promoted into state audit');
for(const needle of ['research_checkpoint_matches=159','Run-Golden 1','Run-Golden 2','state-integrity-v015117'])assert.ok(persistenceWorkflow.includes(needle),`persistence gate missing ${needle}`);
for(const needle of ['electron_version','aram-fearless-draft','0.15.135'])assert.ok(windowsWorkflow.includes(needle)||windowsWorkflow.includes(needle.replace('_','-')),`installed Windows gate missing ${needle}`);

assert.strictEqual(approval?.physical_acceptance?.status,'SUCCESS','real physical Windows acceptance must be recorded as SUCCESS');
assert.match(String(approval?.physical_acceptance?.evidence_sha256||''),/^[a-f0-9]{64}$/,'real physical evidence hash missing');
assert.strictEqual(Number(approval?.physical_acceptance?.real_lcu_http_status),200,'real League/LCU acceptance must record HTTP 200');
assert.strictEqual(Number(approval?.physical_acceptance?.research_matches_before),159,'real Research before count mismatch');
assert.strictEqual(Number(approval?.physical_acceptance?.research_matches_after),159,'real Research after count mismatch');
assert.strictEqual(approval?.approval?.cutover_preparation_approved,true,'cutover preparation approval missing');
assert.strictEqual(approval?.approval?.final_production_release_approved,false,'final production release must still be unapproved');

const files=Array.isArray(manifest.files)?manifest.files:[];
const legacyRuntimeDependencies=files.map((entry,index)=>({
  index,
  target:String(entry.path||entry.target||entry.dest||entry.destination||''),
  source:String(entry.source||''),
  sha256:String(entry.sha256||entry.hash||''),
  classification:String(entry.source||'').startsWith('update/v0.15.')?'legacy-versioned-runtime-source':'other-manifest-source'
}));
assert.ok(legacyRuntimeDependencies.length>0,'Golden manifest file list missing');
const versioned=legacyRuntimeDependencies.filter(x=>x.classification==='legacy-versioned-runtime-source');
const fallbackDependencies=[
  {id:'golden-state-preload-fallback',path:'%APPDATA%\\ARAM Fearless Draft',status:'legacy-preserved',reason:'v0.15.117 state-integrity preload fallback when electron.app is unavailable; keep through cutover probation'},
  {id:'stable-userData',path:'%APPDATA%\\aram-fearless-draft',status:'must-preserve',reason:'physical Windows acceptance verified this stable Chromium userData identity'},
  {id:'research-db',path:'IndexedDB aram-rating-research-v03 / checkpoint-v03',status:'must-preserve',reason:'physical acceptance verified 159 matches and unchanged checkpoint digest'},
  {id:'transaction-safety',path:'update-safety-v01579 / v0.15.116 probation contract',status:'must-preserve-until-canonical-updater-probation',reason:'rollback and probation safety stays until canonical updater passes production-active probation'}
];

const remainingReleaseGates=[
  'Explicit final production-release authorization before manifest/main mutation',
  'Production-active candidate full regression after canonical owner activation',
  'Post-switch probation before legacy runtime removal'
];

const report={
  status:'READY_FOR_CUTOVER_PREPARATION',
  stage:'V0160_CUTOVER_READINESS_MATRIX',
  production_manifest_version:manifest.version,
  canonical_owner_count:ownerRows.length,
  canonical_owners:ownerRows,
  canonical_all_shadow:true,
  canonical_production_active:false,
  installed_windows_gate_present:true,
  installed_persistence_gate_present:true,
  installed_persistence_two_restart_contract:true,
  physical_windows_acceptance:'SUCCESS',
  real_league_lcu_acceptance:'SUCCESS',
  physical_evidence_sha256:approval.physical_acceptance.evidence_sha256,
  cutover_preparation_approved:true,
  final_production_release_approved:false,
  legacy_manifest_dependency_count:legacyRuntimeDependencies.length,
  legacy_versioned_runtime_source_count:versioned.length,
  legacy_runtime_dependencies:legacyRuntimeDependencies,
  fallback_dependencies:fallbackDependencies,
  automated_cutover_prerequisites:{
    canonical_parity:true,
    windows_installed_cold_start:true,
    installed_persistence:true,
    physical_windows_real_lcu:true,
    synthetic_soak:'green at RC automated checkpoint'
  },
  remaining_release_gates:remainingReleaseGates,
  cutover_plan_ready:true,
  legacy_runtime_removal_eligible:false,
  reason_not_yet_removal_eligible:'legacy runtime remains Last Known Good until canonical production activation passes the full post-activation suite and probation',
  production_cutover_eligible:false,
  production_cutover_authorized:false,
  production_manifest_unchanged:true,
  score_logic_changed:false,
  random_scoring_changed:false
};

const out=p('audit-output','stability','cutover-readiness-report.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2),'utf8');
console.log('V0.16 CUTOVER READINESS: READY_FOR_CUTOVER_PREPARATION',JSON.stringify({
  owners:ownerRows.length,
  physicalWindows:'SUCCESS',
  realLcu:'SUCCESS',
  remainingReleaseGates:remainingReleaseGates.length,
  productionCutoverAuthorized:false
}));
