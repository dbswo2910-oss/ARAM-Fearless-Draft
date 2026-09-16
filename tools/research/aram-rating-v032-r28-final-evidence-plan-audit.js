'use strict';
const assert=require('assert');
const planner=require('../../src/research/final-evidence-plan');

const current=planner.buildFinalEvidencePlan({
  observed_leader:'elo',
  observed_runner_up:'glicko',
  selection_status:'no_clear_winner',
  conditions:{
    beats_50_log_loss:true,
    beats_50_brier:true,
    calibration_not_materially_worse:true,
    no_cold_start_improves:false,
    paired_bootstrap_clear_vs_runner:true,
    test_sample_sufficient:true,
    multi_patch_robustness:false
  },
  no_cold_start:{n:3,log_loss:0.728924357494196},
  no_cold_start_constant_50:{n:3,log_loss:0.6931471805599453},
  patch_robustness:{eligible_patches:1,improved_patches:1,passes:false}
});
assert.equal(current.classification,'WAIT_FOR_STRUCTURAL_EVIDENCE');
assert.equal(current.rerun_now_recommended,false);
assert.equal(current.structural_blockers.length,2);
assert.equal(current.structural_blockers[0].minimum_additional,27);
assert.equal(current.structural_blockers[1].required_eligible_patches,2);
assert.equal(current.production_activation_authorized,false);

const enoughButBad=planner.buildFinalEvidencePlan({
  observed_leader:'elo',observed_runner_up:'glicko',selection_status:'no_clear_winner',
  conditions:{beats_50_log_loss:true,beats_50_brier:true,calibration_not_materially_worse:true,no_cold_start_improves:false,paired_bootstrap_clear_vs_runner:true,test_sample_sufficient:true,multi_patch_robustness:true},
  no_cold_start:{n:40,log_loss:0.71},no_cold_start_constant_50:{n:40,log_loss:0.6931471805599453},
  patch_robustness:{eligible_patches:2,improved_patches:2,passes:true}
});
assert.equal(enoughButBad.classification,'MODEL_EVIDENCE_REVIEW_REQUIRED');

const ready=planner.buildFinalEvidencePlan({
  observed_leader:'elo',observed_runner_up:'glicko',selection_status:'candidate_winner',
  conditions:{beats_50_log_loss:true,beats_50_brier:true,calibration_not_materially_worse:true,no_cold_start_improves:true,paired_bootstrap_clear_vs_runner:true,test_sample_sufficient:true,multi_patch_robustness:true},
  no_cold_start:{n:40,log_loss:0.68},no_cold_start_constant_50:{n:40,log_loss:0.6931471805599453},
  patch_robustness:{eligible_patches:2,improved_patches:2,passes:true}
});
assert.equal(ready.classification,'READY_FOR_MANUAL_REVIEW');
assert.equal(ready.production_activation_authorized,false);
assert.equal(ready.automatic_promotion,false);

console.log('R28 FINAL EVIDENCE PLAN AUDIT: SUCCESS',JSON.stringify(current));
