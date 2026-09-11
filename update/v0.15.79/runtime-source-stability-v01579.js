'use strict';
let prior;try{prior=require('./runtime-source-stability-v01578')}catch{prior=require('../v0.15.78/runtime-source-stability-v01578')}
function patchRuntimeSource(file,code){return prior.patchRuntimeSource(file,code)}
module.exports={patchRuntimeSource,score_logic_changed:false};
