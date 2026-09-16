'use strict';
const contract=require('./accuracy-first-contract');
const legacyContract=require('../../src/research/contract');
const v031=require('../../src/research/sampling-v031');
function audit(){const checks={database:legacyContract.database===contract.DB_NAME,checkpoint:legacyContract.checkpoint===contract.CHECKPOINT_KEY,v031_policy:v031.policy_version==='v0.3.1',manual_only:v031.b2_manual_only===true,automatic_collection:v031.automatic_collection===false,production_inactive:v031.production_active===false};return{ok:Object.values(checks).every(Boolean),checks}}
function adaptCandidate(c={}){return{puuid:c.puuid,current_observation_count:Number(c.current_observation_count)||0,already_observed_recent_matches:Number(c.already_observed_recent_matches)||0,expected_duplicate_ratio:Number(c.expected_duplicate_ratio)||0,existing_network_overlap:Number(c.components?.existing_network_overlap??c.existing_network_overlap)||0,expected_known_player_reappearances:Number(c.components?.expected_known_player_reappearances??c.expected_known_player_reappearances)||0,uncertainty:Number(c.uncertainty??1),network_connectivity_gain:Number(c.network_connectivity_gain)||0,request_cost:Number(c.components?.request_cost??c.request_cost??1),expected_new_players:Number(c.expected_new_players)||0}}
module.exports={audit,adaptCandidate};
