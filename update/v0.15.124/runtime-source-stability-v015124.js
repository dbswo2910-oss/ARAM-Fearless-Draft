'use strict';
let base;
try{base=require('../v0.15.123/runtime-source-stability-v015123')}catch{base=require('./runtime-source-stability-v015123')}
module.exports={
  ...base,
  score_logic_changed:false,
  random_scoring_changed:false,
  startup_successor_route_hotfix:true,
  startup_successor_recovery_base:'main-v015122.js',
  policy_version:'0.15.124'
};
