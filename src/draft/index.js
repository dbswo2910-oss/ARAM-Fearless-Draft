'use strict';
const risk=require('./risk-engine');
const productionAdapter=require('./production-adapter');
module.exports={risk,productionAdapter,production_active:true,owner_status:'production',implementation_mode:'production-adapter',score_logic_changed:false,random_scoring_changed:false,legacy_removal_authorized:false};
