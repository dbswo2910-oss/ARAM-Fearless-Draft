'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const assert=require('assert');

const ROOT=process.cwd();
const p=(...xs)=>path.join(ROOT,...xs);
const json=rel=>JSON.parse(fs.readFileSync(p(rel),'utf8').replace(/^\uFEFF/,''));
const shaBytes=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const shaFile=rel=>shaBytes(fs.readFileSync(p(rel)));
const git=(...args)=>cp.execFileSync('git',args,{cwd:ROOT,encoding:'utf8',windowsHide:true}).trim();

const TESTED_COMMIT='e1c01b994adc09c262c16f1efbfad8530cef379f';
const TESTED_MANIFEST_SHA='4274f22596272514280d89c269f7d09060189f1a743efefce97c36502d050a88';
const TESTED_PAYLOAD_SHA='6aea509133140475952348cef3eaf49db74a36c4e9da03b0aa3bc0d7a608bbd5';
const PHYSICAL_SHA='34f782275d40ca023ccb88624f04286b8e5b2904ef0c0e76ad9c63153f2fa0ec';
const GOLDEN='0.15.135';
const ALLOWED_PAYLOAD_DRIFT=new Set(['update/data/aram-builds/current.json']);
const EXPECTED_MAIN_BLOBS={
  'data/aram-builds/current.json':'4bd02108e9e97a6801ae9c0a336dab8aa4291545',
  'update/data/aram-builds/current.json':'4bd02108e9e97a6801ae9c0a336dab8aa4291545'
};

const prod=json('update/manifest.json');
const approval=json('release/v0.16.0-final-approval.json');
const cutover=json('release/v0.16.0-production-cutover.json');

assert.strictEqual(prod.version,'0.16.0','production manifest must be v0.16.0 on cutover branch');
const payload=JSON.stringify({version:prod.version,min_launcher:prod.min_launcher,files:prod.files,delete:prod.delete});
const payloadSha=shaBytes(Buffer.from(payload,'utf8'));
assert.strictEqual(payloadSha,TESTED_PAYLOAD_SHA,'production payload differs from exact tested candidate payload');
assert.ok(prod.release&&prod.release.production===true,'production release metadata missing');
assert.strictEqual(prod.release.tested_candidate_commit,TESTED_COMMIT,'tested candidate commit mismatch');
assert.strictEqual(prod.release.tested_candidate_manifest_sha256,TESTED_MANIFEST_SHA,'tested manifest hash mismatch in release metadata');
assert.strictEqual(prod.release.physical_evidence_sha256,PHYSICAL_SHA,'physical evidence mismatch in release metadata');
assert.strictEqual(prod.release.golden_rollback_target,GOLDEN,'Golden rollback target mismatch');
assert.strictEqual(prod.release.legacy_removal,false,'legacy removal must remain disabled');
assert.strictEqual(prod.release.owner_mode,'production-adapter','owner mode mismatch');
assert.strictEqual(prod.files.length,323,'unexpected production manifest file count');
assert.strictEqual(prod.files.filter(x=>String(x.path||'').startsWith('canonical/src/')&&/\.js$/i.test(String(x.path||''))).length,82,'canonical source count mismatch');

assert.strictEqual(approval.stage,'V0160_FINAL_PRODUCTION_RELEASE_APPROVAL','final approval stage mismatch');
assert.strictEqual(approval.release,'0.16.0','final approval release mismatch');
assert.strictEqual(approval.physical_evidence_sha256,PHYSICAL_SHA,'final approval physical evidence mismatch');
assert.strictEqual(approval.approval.final_production_release_approved,true,'final production approval missing');
assert.strictEqual(approval.approval.production_candidate_implementation_authorized,true,'candidate implementation authorization missing');
assert.strictEqual(approval.approval.manifest_switch_authorized_only_after_all_post_activation_gates_green,true,'manifest switch authorization contract missing');
assert.strictEqual(approval.approval.main_merge_authorized_only_after_all_post_activation_gates_green,true,'main merge authorization contract missing');
assert.strictEqual(approval.approval.legacy_removal_authorized,false,'legacy removal must remain unauthorized');

assert.strictEqual(cutover.stage,'V0160_PRODUCTION_CUTOVER','cutover record stage mismatch');
assert.strictEqual(cutover.release,'0.16.0','cutover release mismatch');
assert.strictEqual(cutover.user_authorization,'explicit-production-cutover-approved','explicit production cutover approval missing');
assert.strictEqual(cutover.tested_candidate_commit,TESTED_COMMIT,'cutover tested commit mismatch');
assert.strictEqual(cutover.tested_candidate_manifest_sha256,TESTED_MANIFEST_SHA,'cutover tested manifest mismatch');
assert.strictEqual(cutover.tested_candidate_payload_sha256,TESTED_PAYLOAD_SHA,'cutover tested payload mismatch');
assert.strictEqual(cutover.production_manifest_sha256,shaFile('update/manifest.json'),'production manifest digest mismatch');
assert.strictEqual(cutover.production_candidate_gate.status,'SUCCESS','production candidate gate evidence missing');
assert.strictEqual(Number(cutover.production_candidate_gate.run_id),34995131586,'production candidate gate run mismatch');
assert.strictEqual(cutover.post_activation_regression.status,'SUCCESS','post-activation evidence missing');
assert.strictEqual(Number(cutover.post_activation_regression.run_id),34995131695,'post-activation run mismatch');
assert.strictEqual(cutover.physical_acceptance.status,'SUCCESS','physical acceptance evidence missing');
assert.strictEqual(cutover.physical_acceptance.evidence_sha256,PHYSICAL_SHA,'physical evidence digest mismatch');
assert.strictEqual(cutover.safety.golden_rollback_target,GOLDEN,'cutover Golden rollback mismatch');
assert.strictEqual(cutover.safety.legacy_removal_authorized,false,'cutover legacy removal must remain false');
assert.strictEqual(cutover.safety.probation_required,true,'probation must remain required');

const pkg=json('update/v0.16.0/package.json');
assert.strictEqual(pkg.name,'aram-fearless-draft','v0.16 package identity mismatch');
assert.strictEqual(pkg.version,'0.16.0','v0.16 package version mismatch');
assert.strictEqual(pkg.main,'main-v0160.js','v0.16 package main mismatch');
assert.ok(fs.existsSync(p('update/v0.16.0',pkg.main)),'v0.16 package main missing');
for(const rel of ['update/v0.15.135/package.json','update/v0.15.135/main-v015135.js','update/v0.15.135/runtime-source-stability-v015135.js']){
  assert.ok(fs.existsSync(p(rel)),`Golden rollback source missing: ${rel}`);
}

const registry=require(p('src/core/owner-registry.js'));
registry.assertSingleOwner?.();
const owners=Object.entries(registry.owners||{});
assert.strictEqual(registry.production_active,true,'canonical registry must be production-active');
assert.strictEqual(owners.length,15,'expected exactly 15 canonical owners');
assert.ok(owners.every(([,v])=>v&&v.status==='production'),'every canonical owner must be production');

const targetPaths=new Set();
for(const f of prod.files){
  assert.ok(f&&typeof f.path==='string'&&typeof f.source==='string','manifest file entry invalid');
  assert.ok(!targetPaths.has(f.path),`duplicate manifest target: ${f.path}`);
  targetPaths.add(f.path);
  assert.ok(fs.existsSync(p(f.source)),`manifest source missing: ${f.source}`);
  if(f.sha256){
    assert.strictEqual(shaFile(f.source),String(f.sha256).toLowerCase(),`manifest SHA mismatch: ${f.source}`);
  }
}

let payloadDrift=[];
if(process.env.CUTOVER_MERGE_TREE==='1'){
  for(const [rel,expected] of Object.entries(EXPECTED_MAIN_BLOBS)){
    const blob=git('rev-parse',`HEAD:${rel}`);
    assert.strictEqual(blob,expected,`main carry-forward blob drift: ${rel}`);
  }
  const seen=new Set();
  for(const f of prod.files){
    const source=f.source;
    if(seen.has(source))continue;
    seen.add(source);
    let oldBlob=null;
    try{oldBlob=git('rev-parse',`${TESTED_COMMIT}:${source}`)}catch{}
    if(!oldBlob)continue;
    const nowBlob=git('rev-parse',`HEAD:${source}`);
    if(oldBlob!==nowBlob){
      payloadDrift.push({source,oldBlob,nowBlob,allowed:ALLOWED_PAYLOAD_DRIFT.has(source)});
      assert.ok(ALLOWED_PAYLOAD_DRIFT.has(source),`unexpected tested payload source drift after main merge: ${source}`);
    }
  }
  assert.deepStrictEqual(payloadDrift.map(x=>x.source).sort(),[...ALLOWED_PAYLOAD_DRIFT].sort(),'expected main payload carry-forward set changed');
}

const result={
  status:'SUCCESS',
  stage:'V0160_FINAL_PRODUCTION_CUTOVER_PREFLIGHT',
  release:'0.16.0',
  tested_candidate_commit:TESTED_COMMIT,
  tested_candidate_manifest_sha256:TESTED_MANIFEST_SHA,
  tested_candidate_payload_sha256:TESTED_PAYLOAD_SHA,
  production_manifest_sha256:shaFile('update/manifest.json'),
  production_manifest_files:prod.files.length,
  canonical_source_count:82,
  canonical_owner_count:owners.length,
  canonical_production_active:true,
  golden_rollback_target:GOLDEN,
  legacy_removal_authorized:false,
  merge_tree_checked:process.env.CUTOVER_MERGE_TREE==='1',
  allowed_main_payload_carry_forward:[...ALLOWED_PAYLOAD_DRIFT],
  payload_drift:payloadDrift,
  next:process.env.CUTOVER_MERGE_TREE==='1'?'merge-to-main':'open-pr-and-validate-merge-tree'
};
const out=p('audit-output','stability','final-production-cutover-report.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n','utf8');
console.log('V0.16 FINAL PRODUCTION CUTOVER PREFLIGHT: SUCCESS',JSON.stringify({mergeTree:result.merge_tree_checked,files:result.production_manifest_files,owners:result.canonical_owner_count,payloadDrift:result.payload_drift.map(x=>x.source)}));
