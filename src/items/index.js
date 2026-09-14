'use strict';
const contract=require('./contract');
const identity=require('./identity');
const recommendation=require('./recommendation');
const artResolver=require('./art-resolver');
const catalogContract=require('./catalog-contract');
module.exports={contract,identity,recommendation,artResolver,catalogContract,production_active:false,score_logic_changed:false,random_scoring_changed:false};
