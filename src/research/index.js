'use strict';
const contract=require('./contract');
const storage=require('./storage');
const sampling=require('./sampling-v031');
module.exports={contract,storage,sampling,production_active:false,score_logic_changed:false,random_scoring_changed:false};
