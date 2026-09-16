'use strict';
const contracts=require('./contracts');
const normalizer=require('./normalizer');
const store=require('./store');
const {confidence}=require('./confidence');
const estimator=require('./estimator');
const {UniversalRatingService}=require('./service');
module.exports={...contracts,...normalizer,...store,confidence,...estimator,UniversalRatingService,production_active:false,automatic_promotion:false};