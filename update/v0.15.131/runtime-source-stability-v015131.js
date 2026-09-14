'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('../v0.15.128/runtime-source-stability-v015128')}catch{prior=require('./runtime-source-stability-v015128')}
const SENTINEL='/* ARAM_RATING_RESEARCH_UI_V015131 */';
let cached='';
function readLocal(name){
  const local=path.join(__dirname,name);
  const repo=path.join(__dirname,'..','v0.15.131',name);
  const p=fs.existsSync(local)?local:repo;
  return fs.readFileSync(p,'utf8');
}
function payloadSource(){
  if(cached)return cached;
  const engine=readLocal('rating-engine-v01.js');
  const core=readLocal('research-ui-core.js');
  const storage=readLocal('research-storage-v015131.js');
  const ui=readLocal('research-ui-devtools.js');
  if(!engine.includes('ARAMRatingResearchEngineV01'))throw new Error('v0.15.131 rating engine contract mismatch');
  if(!core.includes('ARAMRatingResearchUICoreV01'))throw new Error('v0.15.131 research UI core contract mismatch');
  if(!storage.includes('ARAMRatingResearchStorageV015131'))throw new Error('v0.15.131 research storage contract mismatch');
  if(!ui.includes('aramRatingResearchUIV01'))throw new Error('v0.15.131 research UI runtime contract mismatch');
  cached=[engine,core,storage,ui].join('\n;\n');
  return cached;
}
function injectResearchUI(src){
  src=String(src||'');
  if(src.includes(SENTINEL))return src;
  if(!src.includes('__ARAM_PLAYER_PROFILE_V01519__'))throw new Error('v0.15.131 player profile owner marker missing');
  return src+'\n'+SENTINEL+'\n'+payloadSource()+'\n';
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='ui-stability-baseline-v015115.js')src=readLocal('ui-stability-baseline-v015115.js');
  if(file==='player-profile-v01519.js')src=injectResearchUI(src);
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  aram_rating_research_ui:true,
  aram_rating_research_ui_mode:'local-personal-research',
  aram_rating_research_ui_default_enabled:true,
  aram_rating_research_ui_network_collection:false,
  aram_rating_research_ui_target:'player-profile-v01519.js',
  aram_rating_resolved_puuid_join:true,
  aram_rating_search_target_rerender:true,
  aram_rating_storage_read_only_recovery:true,
  aram_rating_checkpoint_preserved:true,
  patch_notes_detail_header_removed:true,
  active_sampling_in_production:false,
  b2_collector_in_production:false,
  research_evaluator_in_production:false,
  activation_targets:[...new Set([...(prior.activation_targets||[]),'player-profile-v01519.js'])],
  policy_version:'0.15.131'
};
