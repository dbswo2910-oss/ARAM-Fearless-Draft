'use strict';
let prior;
try{prior=require('./runtime-source-stability-v015124')}catch{prior=require('../v0.15.124/runtime-source-stability-v015124')}
const stats=require('./aram-build-stat-runtime-v015125');

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-ingame-coach-v01550.js')src=stats.patchCoach(src);
  return src;
}

module.exports={patchRuntimeSource,score_logic_changed:false,random_scoring_changed:false,item_recommendation_logic_changed:true,policy_version:'0.15.125',aram_build_cache:true};
