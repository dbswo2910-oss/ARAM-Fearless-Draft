'use strict';
let base;
try{base=require('../v0.15.115/runtime-source-stability-v015115')}catch{base=require('./runtime-source-stability-v015115')}
module.exports={
  ...base,
  patchRuntimeSource:base.patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  single_owner_ui_baseline_changed:false,
  legacy_ui_overlay_stack_removed:true,
  random_pick_owner:'runtime-v015100',
  data_view_owner:'ui-stability-v015115',
  interaction_reparent_loops_removed:true,
  runtime_update_integrity_changed:true,
  policy_version:'0.15.116'
};
