'use strict';
const contract=require('./contract');
const semantic=require('./semantic-signature');
const volatileHud=require('./volatile-hud');
const coordinator=require('./coordinator');
module.exports={contract,semantic,volatileHud,coordinator,production_active:false,score_logic_changed:false,random_scoring_changed:false};
