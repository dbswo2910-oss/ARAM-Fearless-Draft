'use strict';

const POLICY=Object.freeze({
  min_no_cold_start_matches:30,
  min_eligible_patches:2,
  min_matches_per_patch:30,
  production_active:false,
  automatic_promotion:false
});

function finite(x){return Number.isFinite(Number(x))?Number(x):null}
function bool(x){return x===true}

function buildFinalEvidencePlan(input={}){
  const conditions=input.conditions||{};
  const noCold=input.no_cold_start||{};
  const noColdBase=input.no_cold_start_constant_50||{};
  const patch=input.patch_robustness||{};
  const leader=input.observed_leader||null;
  const runner=input.observed_runner_up||null;
  const selection=input.selection_status||null;
  const noColdN=Number(noCold.n)||0;
  const eligiblePatches=Number(patch.eligible_patches)||0;
  const noColdEnough=noColdN>=POLICY.min_no_cold_start_matches;
  const noColdBetter=noColdEnough&&finite(noCold.log_loss)!==null&&finite(noColdBase.log_loss)!==null&&Number(noCold.log_loss)<Number(noColdBase.log_loss);
  const multiPatchEnough=eligiblePatches>=POLICY.min_eligible_patches;

  const structural=[];
  if(!noColdEnough)structural.push({
    code:'NEED_MORE_NO_COLD_START_TEST_MATCHES',
    current:noColdN,
    required:POLICY.min_no_cold_start_matches,
    minimum_additional:Math.max(0,POLICY.min_no_cold_start_matches-noColdN)
  });
  if(!multiPatchEnough)structural.push({
    code:'NEED_SECOND_ELIGIBLE_PATCH',
    current_eligible_patches:eligiblePatches,
    required_eligible_patches:POLICY.min_eligible_patches,
    minimum_test_matches_per_patch:POLICY.min_matches_per_patch
  });

  const modelEvidence=[];
  if(noColdEnough&&!noColdBetter)modelEvidence.push({code:'NO_COLD_START_PERFORMANCE_NOT_BETTER_THAN_50'});
  if(conditions.paired_bootstrap_clear_vs_runner===false)modelEvidence.push({code:'BOOTSTRAP_NOT_CLEAR_VS_RUNNER'});
  if(conditions.beats_50_log_loss===false)modelEvidence.push({code:'DOES_NOT_BEAT_50_LOG_LOSS'});
  if(conditions.beats_50_brier===false)modelEvidence.push({code:'DOES_NOT_BEAT_50_BRIER'});
  if(conditions.calibration_not_materially_worse===false)modelEvidence.push({code:'CALIBRATION_TOO_WEAK'});
  if(conditions.test_sample_sufficient===false)modelEvidence.push({code:'TEST_SAMPLE_INSUFFICIENT'});
  if(multiPatchEnough&&conditions.multi_patch_robustness===false)modelEvidence.push({code:'MULTI_PATCH_PERFORMANCE_NOT_ROBUST'});

  let classification='READY_FOR_MANUAL_REVIEW';
  let rerunNowRecommended=false;
  let nextTrigger='MANUAL_REVIEW';
  if(selection==='candidate_winner'&&Object.values(conditions).every(bool)){
    classification='READY_FOR_MANUAL_REVIEW';
  }else if(structural.length&&modelEvidence.length===0){
    classification='WAIT_FOR_STRUCTURAL_EVIDENCE';
    nextTrigger='RECHECK_ONLY_AFTER_STRUCTURAL_EVIDENCE_CHANGES';
  }else if(modelEvidence.length){
    classification='MODEL_EVIDENCE_REVIEW_REQUIRED';
    nextTrigger='TUNE_OR_REJECT_MODEL_BEFORE_MORE_BLIND_COLLECTION';
  }else{
    classification='HOLD_SHADOW';
    nextTrigger='RECHECK_AFTER_MEANINGFUL_NEW_EVIDENCE';
  }

  return Object.freeze({
    schema:'aram-rating-final-evidence-plan-v1',
    classification,
    rerun_now_recommended:rerunNowRecommended,
    observed_leader:leader,
    observed_runner_up:runner,
    selection_status:selection,
    structural_blockers:Object.freeze(structural),
    model_evidence_blockers:Object.freeze(modelEvidence),
    next_trigger:nextTrigger,
    production_activation_authorized:false,
    automatic_promotion:false,
    policy:POLICY
  });
}

module.exports={POLICY,buildFinalEvidencePlan,production_active:false,automatic_promotion:false};
