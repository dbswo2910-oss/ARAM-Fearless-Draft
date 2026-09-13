'use strict';
let prior;
try{prior=require('../v0.15.129/runtime-source-stability-v015129')}catch{prior=require('./runtime-source-stability-v015129')}
module.exports={
  ...prior,
  patchRuntimeSource:prior.patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  startup_cold_boot_fix:true,
  launcher_min_version:'2.0.3',
  launcher_boot_authority:'highest-valid-installed-appfiles',
  policy_version:'0.15.131'
};
