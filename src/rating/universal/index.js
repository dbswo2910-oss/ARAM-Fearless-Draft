'use strict';
const contracts=require('./contracts');
const normalizer=require('./normalizer');
const store=require('./store');
const {confidence}=require('./confidence');
const estimator=require('./estimator');
const networkBt=require('./network-bt');
const {UniversalRatingService}=require('./service');
module.exports={...contracts,...normalizer,...store,confidence,...estimator,...networkBt,UniversalRatingService,production_active:false,automatic_promotion:false,resolved_history_supported:true};