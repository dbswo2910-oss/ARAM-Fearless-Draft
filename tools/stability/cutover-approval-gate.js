'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');

function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null}
const physicalReport=arg('--physical-report');
const assertBlocked=process.argv.includes('--assert-blocked');
const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,'update','manifest.json'),'utf8'));
const registry=require(path.join(root,'src','core','owner-registry.js'));
const reasons=[];
if(manifest.version!=='0.15.135')reasons.push(`production manifest is not Golden v0.15.135: ${manifest.version}`);
if(registry.production_active!==false)reasons.push('canonical registry is already production-active');
const owners=registry.owners||registry.registry||registry.subsystems||{};
for(const [name,value] of Object.entries(owners)){
  if(name==='production_active')continue;
  const status=typeof value==='string'?value:value?.status;
  if(status&&status!=='shadow')reasons.push(`canonical owner ${name} is not shadow: ${status}`);
  if(value&&typeof value==='object'&&value.production_active===true)reasons.push(`canonical owner ${name} is production-active`);
}
let physical=null;
if(!physicalReport){
  reasons.push('physical Windows + real League/LCU acceptance evidence is missing');
}else{
  const ingest=path.join(root,'tools','stability','physical-acceptance-ingest-audit.js');
  const child=cp.spawnSync(process.execPath,[ingest,'--report',path.resolve(physicalReport)],{cwd:root,encoding:'utf8'});
  if(child.status!==0){
    reasons.push('physical acceptance evidence failed ingest validation');
  }else{
    const ingestOut=path.join(root,'audit-output','stability','physical-acceptance-ingest-report.json');
    physical=JSON.parse(fs.readFileSync(ingestOut,'utf8'));
    if(physical.release_evidence!==true)reasons.push('physical acceptance input is not real release evidence');
  }
}
const readinessEligible=reasons.length===0;
const result={
  status:readinessEligible?'READY_FOR_EXPLICIT_APPROVAL':'BLOCKED',
  stage:'V0160_CUTOVER_APPROVAL_GATE',
  production_manifest_version:manifest.version,
  canonical_registry_production_active:registry.production_active,
  physical_acceptance_release_evidence:physical?.release_evidence===true,
  physical_acceptance_input_sha256:physical?.input_sha256||null,
  readiness_eligible:readinessEligible,
  explicit_production_approval_present:false,
  production_cutover_authorized:false,
  legacy_removal_authorized:false,
  blockers:reasons
};
const out=path.join(root,'audit-output','stability','cutover-approval-gate.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(result,null,2),'utf8');
console.log(`V0.16 CUTOVER APPROVAL GATE: ${result.status}`,JSON.stringify({readinessEligible,blockers:reasons.length,physicalReleaseEvidence:result.physical_acceptance_release_evidence}));
if(assertBlocked){
  if(readinessEligible){console.error('expected cutover gate to be BLOCKED but it became eligible');process.exit(1)}
  process.exit(0);
}
if(!readinessEligible)process.exit(2);
