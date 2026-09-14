'use strict';
const contract=require('./contract');
const storage=require('./storage');
const sampling=require('./sampling-v031');
const ratingEngine=require('./rating-engine');
const uiCore=require('./ui-core');
const owner=require('./owner');
module.exports={contract,storage,sampling,ratingEngine,uiCore,owner,production_active:false,automatic_collection:false,b2_manual_only:true,destructive_migration:false,score_logic_changed:false,random_scoring_changed:false};
