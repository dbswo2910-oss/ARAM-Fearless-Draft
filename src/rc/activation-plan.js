'use strict';
const registry=require('../core/owner-registry');
const RC_VERSION='0.16.0-rc.1';
const GOLDEN_VERSION='0.15.135';
const REQUIRED_OWNERS=Object.freeze(['main','preload','state','lifecycle','updater','autosync','riot','draft','random_pick','random_ingame','data','items','profile','research','diagnostics']);
function assertShadowCheckpoint(){
  registry.assertSingleOwner();
  if(registry.production_active!==false)throw new Error('RC must start from production-inactive canonical registry');
  for(const name of REQUIRED_OWNERS){const owner=registry.getOwner(name);if(!owner||owner.status!=='shadow')throw new Error(`canonical owner ${name} is not shadow-ready`)}
  return true;
}
function activationDescriptor(){
  assertShadowCheckpoint();
  return Object.freeze({version:RC_VERSION,golden:GOLDEN_VERSION,scope:'isolated-non-production',production_manifest_mutation:false,legacy_removal:false,user_data_id:'aram-fearless-draft',research_db:'aram-rating-research-v03',research_checkpoint:'checkpoint-v03',owners:REQUIRED_OWNERS.slice()});
}
module.exports={RC_VERSION,GOLDEN_VERSION,REQUIRED_OWNERS,assertShadowCheckpoint,activationDescriptor};
