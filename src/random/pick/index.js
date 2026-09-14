'use strict';
const contract=require('./contract');
const dna=require('./dna');
const selection=require('./selection-state');
const top5=require('./top5');
module.exports={contract,dna,selection,top5,production_active:false,score_logic_changed:false,random_scoring_changed:false};
