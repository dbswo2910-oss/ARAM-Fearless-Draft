'use strict';
const path=require('path');
const {JsonRatingStore}=require('./store');
const {createEstimator}=require('./estimator');
const {UniversalRatingService,finiteOrNull}=require('./service');

const DEFAULT_MODELS=Object.freeze(['research-v032-elo-shadow','research-v032-glicko-shadow']);
const DB_BASENAME='universal-rating-v1.json';

function publicCandidate(result){
  return{
    modelVersion:result?.modelVersion||null,
    modelName:result?.modelName||null,
    modelStatus:result?.modelStatus||'SHADOW',
    status:result?.status||'UNKNOWN',
    rating:finiteOrNull(result?.rating),
    uncertainty:finiteOrNull(result?.uncertainty),
    games:Number(result?.games)||0,
    confidence:result?.confidence||null,
    evidenceMatches:Number(result?.evidenceMatches)||0,
    targetMatches:Number(result?.targetMatches)||0,
    newMatches:Number(result?.newMatches)||0,
    cacheHit:result?.cacheHit===true,
    updatedAt:Number(result?.updatedAt)||null,
    networkRequests:0,
    productionActive:false
  };
}

function createUniversalRatingRuntime({userDataPath,modelVersions=DEFAULT_MODELS,store=null}={}){
  if(!userDataPath&&!store)throw new Error('userDataPath or store required');
  const ratingStore=store||new JsonRatingStore(path.join(userDataPath,'rating',DB_BASENAME));
  const versions=[...new Set((Array.isArray(modelVersions)?modelVersions:DEFAULT_MODELS).map(String).filter(Boolean))];
  if(!versions.length)throw new Error('at least one shadow model required');
  const services=versions.map(modelVersion=>{
    const estimator=createEstimator(modelVersion);
    return{modelVersion,modelName:estimator.modelName,service:new UniversalRatingService({store:ratingStore,estimator})};
  });

  async function rateResolved({player,matches=[],force=false,reason='PROFILE_HISTORY_IPC'}={}){
    const puuid=String(player?.puuid||'').trim();
    if(!puuid)throw new Error('player.puuid required');
    const candidates={};
    for(const row of services){
      const result=await row.service.rateResolved({player,matches,force,reason,source:'profile-history-ipc'});
      candidates[row.modelName||row.modelVersion]=publicCandidate(result);
    }
    return{
      schemaVersion:1,
      mode:'DUAL_SHADOW',
      status:'RESEARCH_GATE_PENDING',
      productionActive:false,
      automaticPromotion:false,
      productionRating:null,
      modelSelection:'no_clear_winner',
      candidates,
      networkRequests:0,
      updatedAt:Date.now()
    };
  }

  function getStoredCandidates(puuid){
    const id=String(puuid||'').trim();
    if(!id)return{};
    return Object.fromEntries(services.map(row=>[row.modelName||row.modelVersion,publicCandidate(ratingStore.getRating(row.modelVersion,id))]));
  }

  function getShadowDiagnostics(puuid){
    const id=String(puuid||'').trim();
    if(!id)return{schemaVersion:1,status:'NO_TARGET',mode:'DUAL_SHADOW',productionActive:false,automaticPromotion:false,productionRating:null,modelSelection:'no_clear_winner',player:null,candidates:{},networkRequests:0,updatedAt:null};
    const player=ratingStore.getPlayer(id)||null;
    const candidates=getStoredCandidates(id);
    const timestamps=Object.values(candidates).map(x=>Number(x?.updatedAt)||0).filter(Boolean);
    const targetMatches=Math.max(0,...Object.values(candidates).map(x=>Number(x?.targetMatches)||0));
    return{
      schemaVersion:1,
      status:Object.values(candidates).some(x=>Number(x?.games)>0)?'READY':'NO_RATING_YET',
      mode:'DUAL_SHADOW',
      productionActive:false,
      automaticPromotion:false,
      productionRating:null,
      modelSelection:'no_clear_winner',
      player:player?{gameName:String(player.gameName||''),tagLine:String(player.tagLine||''),platformId:String(player.platformId||'KR')}:null,
      candidates,
      targetMatches,
      networkRequests:0,
      updatedAt:timestamps.length?Math.max(...timestamps):null
    };
  }

  return{
    rateResolved,
    getStoredCandidates,
    getShadowDiagnostics,
    modelVersions:Object.freeze([...versions]),
    dbPath:store?null:path.join(userDataPath,'rating',DB_BASENAME),
    store:ratingStore,
    productionActive:false,
    automaticPromotion:false
  };
}

module.exports={DEFAULT_MODELS,DB_BASENAME,publicCandidate,createUniversalRatingRuntime,production_active:false,automatic_promotion:false,mode:'dual-shadow'};