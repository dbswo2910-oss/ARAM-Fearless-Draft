'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const crypto=require('crypto');

const ROOT=process.cwd();
const p=(...xs)=>path.join(ROOT,...xs);
const json=f=>JSON.parse(fs.readFileSync(p(f),'utf8').replace(/^\uFEFF/,''));
const manifest=json('update/manifest.json');
const approval=json('release/v0.16.0-cutover-preparation.json');
const registry=require(p('src/core/owner-registry.js'));

assert.strictEqual(manifest.version,'0.15.135','production manifest must remain Golden during cutover preparation');
assert.strictEqual(approval.stage,'V0160_CUTOVER_PREPARATION_APPROVAL','cutover preparation approval stage mismatch');
assert.strictEqual(approval.release,'0.16.0','release version mismatch');
assert.strictEqual(approval.golden_version,'0.15.135','golden version mismatch');
assert.strictEqual(approval.rc_branch,'rc/v0160-canonical-activation','RC branch mismatch');
assert.match(String(approval.validated_rc_head||''),/^[a-f0-9]{40}$/,'validated RC head must be a commit SHA');

const physical=approval.physical_acceptance||{};
assert.strictEqual(physical.status,'SUCCESS','physical acceptance must be SUCCESS');
assert.match(String(physical.evidence_sha256||''),/^[a-f0-9]{64}$/,'physical evidence SHA-256 missing');
assert.strictEqual(physical.candidate_version,'0.15.135','physical evidence candidate mismatch');
assert.strictEqual(physical.stable_user_data_identity,'aram-fearless-draft','userData identity mismatch');
assert.strictEqual(physical.research_database,'aram-rating-research-v03','Research DB identity mismatch');
assert.strictEqual(physical.research_checkpoint,'checkpoint-v03','Research checkpoint identity mismatch');
assert.strictEqual(Number(physical.research_matches_before),159,'Research before count mismatch');
assert.strictEqual(Number(physical.research_matches_after),159,'Research after count mismatch');
assert.match(String(physical.checkpoint_digest||''),/^[a-f0-9]{64}$/,'Research checkpoint digest invalid');
assert.strictEqual(Number(physical.real_lcu_http_status),200,'real LCU HTTP status mismatch');

const a=approval.approval||{};
assert.strictEqual(a.cutover_preparation_approved,true,'cutover preparation approval missing');
assert.strictEqual(a.approval_scope,'prepare-and-validate-production-cutover-plan','approval scope mismatch');
assert.strictEqual(a.final_production_release_approved,false,'final production release must remain unapproved in this stage');
assert.strictEqual(a.production_cutover_authorized,false,'production cutover must remain unauthorized in this stage');
assert.strictEqual(a.legacy_removal_authorized,false,'legacy removal must remain unauthorized in this stage');

const safety=approval.safety||{};
for(const key of [
  'main_mutation_allowed_in_this_stage',
  'manifest_mutation_allowed_in_this_stage',
  'canonical_activation_allowed_in_this_stage',
  'legacy_runtime_deletion_allowed_in_this_stage'
]) assert.strictEqual(safety[key],false,`${key} must remain false`);

assert.strictEqual(registry.production_active,false,'canonical registry must remain production-inactive during preparation');
registry.assertSingleOwner();
const owners=registry.owners||{};
const rows=Object.entries(owners).map(([name,value])=>({name,status:value&&value.status,canonical:value&&value.canonical}));
assert.strictEqual(rows.length,15,'expected exactly 15 canonical owners');
assert.ok(rows.every(x=>x.status==='shadow'),'every canonical owner must remain shadow before final release approval');

const planPath=p('docs/V0160_PRODUCTION_CUTOVER_PLAN.md');
assert.ok(fs.existsSync(planPath),'production cutover plan missing');
const plan=fs.readFileSync(planPath,'utf8');
for(const needle of [
  'Phase 0 — immutable preflight',
  'Phase 1 — build a dedicated v0.16 release package',
  'Phase 2 — activate canonical ownership in the release candidate',
  'Phase 3 — full post-activation regression',
  'Phase 4 — manifest switch',
  'Phase 5 — probation and rollback',
  'Phase 6 — legacy runtime removal',
  'final production release approved: **NO**'
]) assert.ok(plan.includes(needle),`cutover plan missing: ${needle}`);

const approvalBytes=fs.readFileSync(p('release/v0.16.0-cutover-preparation.json'));
const approvalSha256=crypto.createHash('sha256').update(approvalBytes).digest('hex');

const result={
  status:'READY_FOR_CUTOVER',
  stage:'V0160_PRODUCTION_CUTOVER_PREFLIGHT',
  release:'0.16.0',
  golden_manifest_version:manifest.version,
  validated_rc_head:approval.validated_rc_head,
  physical_acceptance_status:physical.status,
  physical_evidence_sha256:physical.evidence_sha256,
  approval_record_sha256:approvalSha256,
  canonical_owner_count:rows.length,
  canonical_all_shadow:true,
  canonical_production_active:false,
  cutover_preparation_approved:true,
  cutover_plan_ready:true,
  final_production_release_approved:false,
  production_cutover_authorized:false,
  manifest_switch_authorized:false,
  legacy_removal_authorized:false,
  next_gate:'explicit-final-production-release-authorization'
};

const out=p('audit-output','stability','production-cutover-preflight-report.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2),'utf8');
console.log('V0.16 PRODUCTION CUTOVER PREFLIGHT: READY_FOR_CUTOVER',JSON.stringify({
  release:result.release,
  owners:result.canonical_owner_count,
  finalProductionReleaseApproved:false,
  productionCutoverAuthorized:false
}));
