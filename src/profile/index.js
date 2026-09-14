'use strict';
const contract=require('./contract');
const results=require('./results-normalizer');
const metrics=require('./metrics');
const history=require('./history-service');
const riotGradeLink=require('./riot-grade-link');
module.exports={contract,results,metrics,history,riotGradeLink,production_active:false,score_logic_changed:false,random_scoring_changed:false};
