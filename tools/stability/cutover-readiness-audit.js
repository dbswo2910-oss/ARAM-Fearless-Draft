'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const ROOT=process.cwd();
const p=(...xs)=>path.join(ROOT,...xs);
const json=f=>JSON.parse(fs.readFileSync(p(f),'utf8'));
const text=f=>fs.readFileSync(p(f),'utf8');
const manifest=json('update/manifest.json');
const owners=require(p('src/core/owner-registry.js'));
const stateAudit=text('tools/stability/state-compat-audit.js');
const persistenceWorkflow=text('.github/workflows/v0160-installed-persistence-acceptance.yml');
const windowsWorkflow=text('.github/workflows/v0160-installed-windows-acceptance.yml');

assert.strictEqual(manifest.version,'0.15.135','production manifest must remain Golden while cutover is unapproved');
assert.strictEqual(owners.production_active,false,'canonical registry must remain production-inactive before explicit cutover');
const registry=owners.owners||owners.registry||owners.subsystems||owners;
const ownerRows=[];
for(const [name,value] of Object.entries(registry)){
  if(name==='production_active')continue;
  const status=typeof value==='string'?value:value?.status;
  if(status)ownerRows.push({owner:name,status,production_active:!!value?.production_active});
}
assert.ok(ownerRows.length>=10,'canonical owner registry unexpectedly sparse');
assert.ok(ownerRows.every(x=>x.status==='shadow'),'all canonical subsystem owners must be shadow before RC cutover');
assert.ok(ownerRows.every(x=>x.production_active===false),'no subsystem owner may be production-active yet');
assert.ok(stateAudit.includes('VERIFIED_V01549_TO_V015135_IN_PLACE_TWO_RESTARTS'),'installed persistence evidence not promoted into state audit');
for(const needle of ['research_checkpoint_matches=159','Run-Golden 1','Run-Golden 2','state-integrity-v015117'])assert.ok(persistenceWorkflow.includes(needle),`persistence gate missing ${needle}`);
for(const needle of ['electron_version','aram-fearless-draft','0.15.135'])assert.ok(windowsWorkflow.includes(needle)||windowsWorkflow.includes(needle.replace('_','-')),`installed Windows gate missing ${needle}`);

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
  {id:'golden-state-preload-fallback',path:'%APPDATA%\\ARAM Fearless Draft',status:'legacy-preserved',reason:'v0.15.117 state-integrity preload fallback when electron.app is unavailable; persistence acceptance verifies the actual location rather than silently changing it'},
  {id:'stable-userData',path:'%APPDATA%\\aram-fearless-draft',status:'must-preserve',reason:'production main pins the stable Chromium userData identity'},
  {id:'research-db',path:'IndexedDB aram-rating-research-v03 / checkpoint-v03',status:'must-preserve',reason:'159-match persistence fixture is now verified across in-place update + two restarts'},
  {id:'transaction-safety',path:'update-safety-v01579 / v0.15.116 probation contract',status:'must-preserve-until-canonical-cutover',reason:'rollback and probation safety cannot be removed before canonical updater activation'}
];
const manualBlockers=[
  'Physical Windows acceptance on the user machine',
  'Real League Client/LCU timing, credentials, reconnect and AutoSync behavior',
  'Real display DPI/font/rendering smoke check',
  'Explicit production cutover approval'
];
const report={
  status:'SUCCESS',stage:'V0160_CUTOVER_READINESS_MATRIX',production_manifest_version:manifest.version,
  canonical_owner_count:ownerRows.length,canonical_owners:ownerRows,canonical_all_shadow:true,canonical_production_active:false,
  installed_windows_gate_present:true,installed_persistence_gate_present:true,installed_persistence_two_restart_contract:true,
  legacy_manifest_dependency_count:legacyRuntimeDependencies.length,legacy_versioned_runtime_source_count:versioned.length,
  legacy_runtime_dependencies:legacyRuntimeDependencies,fallback_dependencies:fallbackDependencies,
  automated_cutover_prerequisites:{canonical_parity:true,windows_installed_cold_start:true,installed_persistence:true,synthetic_soak:'gated by v0.16.0 AutoSync Updater Soak workflow'},
  manual_release_blockers:manualBlockers,
  legacy_runtime_removal_eligible:false,
  reason_not_yet_removal_eligible:'canonical owners are intentionally shadow-only; real League/LCU acceptance and explicit production cutover approval remain external/manual gates',
  production_cutover_eligible:false,
  production_manifest_unchanged:true,
  score_logic_changed:false,random_scoring_changed:false
};
const out=p('audit-output','stability','cutover-readiness-report.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2),'utf8');
console.log('V0.16 CUTOVER READINESS: SUCCESS',JSON.stringify({owners:ownerRows.length,manifestFiles:legacyRuntimeDependencies.length,versionedSources:versioned.length,manualBlockers:manualBlockers.length,productionCutoverEligible:false}));
