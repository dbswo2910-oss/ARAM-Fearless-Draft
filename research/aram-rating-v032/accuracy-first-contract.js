'use strict';
const DB_NAME='aram-rating-research-v03';
const CHECKPOINT_KEY='checkpoint-v03';
const WINNER_GATE=Object.freeze({real_matches_min:500,frozen_test_matches_min:100});
const POLICY=Object.freeze({
  identity_key:'puuid',
  zero_observation_score:null,
  primary_metric:'log_loss',
  secondary_metrics:['brier','ece','accuracy'],
  uncertainty_is_first_class:true,
  automatic_collection:false,
  b2_manual_only:true,
  production_activation:false,
  destructive_reset:false,
  winner_gate:WINNER_GATE
});
function canPublishEstimate({observations=0,estimate}={}){return Number(observations)>0&&Number.isFinite(Number(estimate))}
function assertResolvedIdentity({puuid,currentUserPuuid}={}){const id=String(puuid||'').trim();if(!id)throw new Error('target_puuid_required');if(currentUserPuuid&&id!==String(puuid||''))throw new Error('searched_identity_must_not_fallback');return id}
module.exports={DB_NAME,CHECKPOINT_KEY,WINNER_GATE,POLICY,canPublishEstimate,assertResolvedIdentity,production_active:false,automatic_collection:false};
