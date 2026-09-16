'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const planner=require('../../src/research/final-evidence-plan');

function parseArgs(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    const a=argv[i];
    if(a==='--input')out.input=argv[++i];
    else if(a==='--output')out.output=argv[++i];
    else if(a==='--self-test')out.selfTest=true;
  }
  return out;
}

function buildEnvelope(report){
  const gate=report&&report.selection_gate;
  if(!gate||gate.state!=='available')throw new Error('R29 requires an available R27 selection_gate report');
  const plan=planner.buildFinalEvidencePlan(gate);
  return {
    status:'SUCCESS',
    stage:'R29_ONE_SHOT_EVIDENCE_FINALIZE',
    schema:'aram-rating-r29-one-shot-evidence-v1',
    read_only:true,
    source_stage:report.stage||'R27_SELECTION_GATE_INSPECT',
    observed_leader:gate.observed_leader||null,
    observed_runner_up:gate.observed_runner_up||null,
    selection_status:gate.selection_status||null,
    baseline_matches:Number(gate.baseline_matches)||0,
    delta_matches:Number(gate.delta_matches)||0,
    augmented_matches:Number(gate.augmented_matches)||0,
    final_evidence_plan:plan,
    production_activation_authorized:false,
    automatic_promotion:false
  };
}

function selfTest(){
  const sample={stage:'R27_SELECTION_GATE_INSPECT',selection_gate:{
    state:'available',observed_leader:'elo',observed_runner_up:'glicko',selection_status:'no_clear_winner',
    baseline_matches:2020,delta_matches:16,augmented_matches:2036,
    conditions:{beats_50_log_loss:true,beats_50_brier:true,calibration_not_materially_worse:true,no_cold_start_improves:false,paired_bootstrap_clear_vs_runner:true,test_sample_sufficient:true,multi_patch_robustness:false},
    no_cold_start:{n:3,log_loss:0.728924357494196},
    no_cold_start_constant_50:{n:3,log_loss:0.6931471805599453},
    patch_robustness:{eligible_patches:1,improved_patches:1,passes:false}
  }};
  const x=buildEnvelope(sample);
  assert.equal(x.final_evidence_plan.classification,'WAIT_FOR_STRUCTURAL_EVIDENCE');
  assert.equal(x.final_evidence_plan.structural_blockers[0].minimum_additional,27);
  assert.equal(x.final_evidence_plan.production_activation_authorized,false);
  assert.equal(x.automatic_promotion,false);
  console.log('R29 FINALIZER SELF TEST: SUCCESS');
}

function main(){
  const args=parseArgs(process.argv.slice(2));
  if(args.selfTest)return selfTest();
  if(!args.input||!args.output)throw new Error('usage: node aram-rating-v032-r29-finalize-evidence.js --input <r27.json> --output <r29.json>');
  const input=JSON.parse(fs.readFileSync(path.resolve(args.input),'utf8').replace(/^\uFEFF/,''));
  const envelope=buildEnvelope(input);
  const out=path.resolve(args.output);
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify(envelope,null,2)+'\n','utf8');
  const p=envelope.final_evidence_plan;
  console.log(`R29 FINAL EVIDENCE: ${p.classification} / selection=${envelope.selection_status} / leader=${envelope.observed_leader} / next=${p.next_trigger} -> ${out}`);
}

if(require.main===module){
  try{main()}catch(err){console.error('R29 FINALIZER: FAILURE',err&&err.stack||err);process.exit(1)}
}
module.exports={parseArgs,buildEnvelope,selfTest};
