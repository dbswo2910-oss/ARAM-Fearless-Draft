'use strict';
const contract=require('./contract');
const identity=require('./identity');
const recommendation=require('./recommendation');
const artResolver=require('./art-resolver');
const artRuntime=require('./art-runtime');
const catalogContract=require('./catalog-contract');
const catalogService=require('./catalog-service');
module.exports={contract,identity,recommendation,artResolver,artRuntime,catalogContract,catalogService,production_active:false,score_logic_changed:false,random_scoring_changed:false};
