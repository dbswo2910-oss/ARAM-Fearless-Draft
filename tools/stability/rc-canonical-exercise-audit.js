'use strict';
const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
const ROOT=process.cwd();
const registry=require(path.join(ROOT,'src/core/owner-registry.js'));
const plan=require(path.join(ROOT,'src/rc/activation-plan.js'));
const exercise=require(path.join(ROOT,'src/rc/exercise-plan.js'));

const p=(x)=>path.join(ROOT,x);
const read=(x)=>fs.readFileSync(p(x),'utf8');
const hash=(x)=>crypto.createHash('sha256').update(fs.readFileSync(p(x))).digest('hex');
const manifestPath='update/manifest.json';
const goldenMainPath='update/v0.15.135/main-v015135.js';
const goldenPackagePath='update/v0.15.135/package.json';

plan.assertShadowCheckpoint();
exercise.assertCompleteCoverage();
assert.strictEqual(registry.production_active,false,'canonical registry must remain production inactive');
assert.strictEqual(exercise.production_active,false,'RC exercise must remain production inactive');
assert.strictEqual(exercise.network_allowed,false,'RC exercise must be offline');

const protectedBefore={
  manifest:hash(manifestPath),
  golden_main:hash(goldenMainPath),
  golden_package:hash(goldenPackagePath)
};
const manifestBefore=JSON.parse(read(manifestPath));
assert.strictEqual(manifestBefore.version,'0.15.135','production manifest must remain Golden v0.15.135');

const guard=p('tools/stability/rc-offline-guard.js');
const priorNodeOptions=String(process.env.NODE_OPTIONS||'').trim();
const childEnv={...process.env,ARAM_V016_RC_EXERCISE:'1',ARAM_RC_OFFLINE:'1',NODE_OPTIONS:`${priorNodeOptions}${priorNodeOptions?' ':''}--require=${guard}`};
const results=[];
const ownerCoverage={};

for(const entry of exercise.EXERCISES){
  const auditPath=p(entry.audit);
  assert.ok(fs.existsSync(auditPath),`RC exercise audit missing: ${entry.audit}`);
  const source=fs.readFileSync(auditPath,'utf8');
  for(const marker of entry.markers)assert.ok(source.includes(marker),`${entry.audit} does not directly reference canonical marker ${marker}`);
  const run=spawnSync(process.execPath,[auditPath],{cwd:ROOT,env:childEnv,encoding:'utf8',maxBuffer:8*1024*1024});
  if(run.error)throw run.error;
  if(run.status!==0){
    process.stderr.write(run.stdout||'');
    process.stderr.write(run.stderr||'');
    throw new Error(`RC canonical exercise failed: ${entry.audit} exit=${run.status}`);
  }
  const stdout=String(run.stdout||'').trim().split(/\r?\n/).filter(Boolean);
  const proof={audit:entry.audit,owners:[...entry.owners],canonical_markers:[...entry.markers],exit_code:run.status,last_line:stdout.at(-1)||'',offline_guard:true};
  results.push(proof);
  for(const owner of entry.owners){
    assert.ok(!ownerCoverage[owner],`canonical owner exercised more than once in RC matrix: ${owner}`);
    ownerCoverage[owner]=entry.audit;
  }
}

assert.deepStrictEqual(Object.keys(ownerCoverage).sort(),[...plan.REQUIRED_OWNERS].sort(),'RC exercise did not cover every required canonical owner');
for(const name of plan.REQUIRED_OWNERS){
  const owner=registry.getOwner(name);
  assert.ok(owner&&owner.status==='shadow',`canonical owner ${name} left shadow state during RC exercise`);
}
assert.strictEqual(registry.production_active,false,'RC exercise activated canonical production registry');

const manifestAfter=JSON.parse(read(manifestPath));
const protectedAfter={
  manifest:hash(manifestPath),
  golden_main:hash(goldenMainPath),
  golden_package:hash(goldenPackagePath)
};
assert.deepStrictEqual(protectedAfter,protectedBefore,'RC exercise mutated Golden production artifacts');
assert.strictEqual(manifestAfter.version,'0.15.135','RC exercise changed production manifest version');

const descriptor=plan.activationDescriptor();
assert.strictEqual(descriptor.production_manifest_mutation,false);
assert.strictEqual(descriptor.legacy_removal,false);
assert.strictEqual(descriptor.user_data_id,'aram-fearless-draft');
assert.strictEqual(descriptor.research_db,'aram-rating-research-v03');
assert.strictEqual(descriptor.research_checkpoint,'checkpoint-v03');

const report={
  status:'SUCCESS',
  stage:'V0160_ISOLATED_RC_CANONICAL_EXERCISE',
  version:descriptor.version,
  golden:descriptor.golden,
  required_owners:plan.REQUIRED_OWNERS,
  exercised_owner_count:Object.keys(ownerCoverage).length,
  owner_coverage:ownerCoverage,
  exercises:results,
  safety:{
    production_active:false,
    production_manifest_mutation:false,
    legacy_removal:false,
    network_allowed:false,
    offline_guard_applied:true,
    user_data_id:descriptor.user_data_id,
    research_db:descriptor.research_db,
    research_checkpoint:descriptor.research_checkpoint,
    golden_artifacts_unchanged:true,
    protected_sha256:protectedAfter
  }
};
const out=p('audit-output/stability/rc-canonical-exercise-report.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log('V0.16 ISOLATED RC CANONICAL EXERCISE: SUCCESS',JSON.stringify({owners:report.exercised_owner_count,exercises:results.length,offline:true,golden:descriptor.golden}));
