'use strict';
const path=require('path');
const {JsonRatingStore}=require('./store');
const {createEstimator}=require('./estimator');
const {UniversalRatingService,finiteOrNull}=require('./service');
const {stabilityProgress}=require('./confidence');

const DEFAULT_MODELS=Object.freeze(['research-v032-elo-shadow','research-v032-glicko-shadow']);
const DB_BASENAME='universal-rating-v1.json';

function publicCandidate(result){
  const games=Number(result?.games)||0;
  const uncertainty=finiteOrNull(result?.uncertainty);
  const conf=result?.confidence||null;
  return{
    modelVersion:result?.modelVersion||null,
    modelName:result?.modelName||null,
    modelStatus:result?.modelStatus||'SHADOW',
    status:result?.status||'UNKNOWN',
    rating:finiteOrNull(result?.rating),
    uncertainty,
    games,
    confidence:conf,
    stabilityProgress:stabilityProgress({games,uncertainty,confidence:conf}),
    evidenceMatches:Number(result?.evidenceMatches)||0,
    targetMatches:Number(result?.targetMatches)||0,
    newMatches:Number(result?.newMatches)||0,
    cacheHit:result?.cacheHit===true,
    updatedAt:Number(result?.updatedAt)||null,
    networkRequests:0,
    productionActive:false
  };
}

function safeSnapshot(store){try{return typeof store?.snapshot==='function'?store.snapshot():null}catch{return null}}
function databaseStats(store){
  const state=safeSnapshot(store)||{};
  const matches=Object.values(state.matches||{});
  const graphPlayers=new Set();
  for(const match of matches){for(const id of [...(match?.teamA||[]),...(match?.teamB||[])])if(id)graphPlayers.add(String(id))}
  return{
    uniqueMatches:matches.length,
    graphPlayers:graphPlayers.size,
    searchedPlayers:Object.keys(state.players||{}).length,
    ratingRecords:Object.keys(state.ratings||{}).length
  };
}
function publicIngest(row){
  if(!row)return null;
  return{
    receivedMatches:Number(row.receivedMatches)||0,
    newMatches:Number(row.newMatches)||0,
    duplicateMatches:Number(row.duplicateMatches)||0,
    rejectedMatches:Number(row.rejectedMatches)||0,
    targetMismatchMatches:Number(row.targetMismatchMatches)||0,
    targetMatches:Number(row.targetMatches)||0,
    evidenceMatches:Number(row.evidenceMatches)||0,
    cacheHit:row.cacheHit===true,
    source:String(row.source||''),
    at:Number(row.at)||null
  };
}
function latestIngestSummary(store,puuid){
  const id=String(puuid||'').trim();if(!id)return null;
  const audits=safeSnapshot(store)?.audits||[];
  for(let i=audits.length-1;i>=0;i--){const row=audits[i];if(row?.type==='SHADOW_INGEST_SUMMARY'&&String(row?.puuid||'')===id)return publicIngest(row)}
  return null;
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
    let ingestBasis=null;
    for(const row of services){
      const result=await row.service.rateResolved({player,matches,force,reason,source:'profile-history-ipc'});
      if(!ingestBasis)ingestBasis=result;
      candidates[row.modelName||row.modelVersion]=publicCandidate(result);
    }
    const ingestRow={
      type:'SHADOW_INGEST_SUMMARY',at:Date.now(),reason,source:'profile-history-ipc',puuid,
      receivedMatches:Array.isArray(matches)?matches.length:0,
      newMatches:Number(ingestBasis?.newMatches)||0,
      duplicateMatches:Number(ingestBasis?.duplicateMatches)||0,
      rejectedMatches:Number(ingestBasis?.rejectedMatches)||0,
      targetMismatchMatches:Number(ingestBasis?.targetMismatchMatches)||0,
      targetMatches:Number(ingestBasis?.totalMatches??ingestBasis?.targetMatches)||0,
      evidenceMatches:Number(ingestBasis?.evidenceMatches)||0,
      cacheHit:ingestBasis?.cacheHit===true,
      networkRequests:0,productionActive:false
    };
    ratingStore.appendAudit(ingestRow);
    return{
      schemaVersion:1,
      mode:'DUAL_SHADOW',
      status:'RESEARCH_GATE_PENDING',
      productionActive:false,
      automaticPromotion:false,
      productionRating:null,
      modelSelection:'no_clear_winner',
      candidates,
      ingest:publicIngest(ingestRow),
      database:databaseStats(ratingStore),
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
    if(!id)return{schemaVersion:1,status:'NO_TARGET',mode:'DUAL_SHADOW',productionActive:false,automaticPromotion:false,productionRating:null,modelSelection:'no_clear_winner',player:null,candidates:{},ingest:null,database:databaseStats(ratingStore),modelGapPoints:null,interpretation:{stabilityIsPredictiveAccuracy:false,predictiveAccuracyValidated:false},networkRequests:0,updatedAt:null};
    const player=ratingStore.getPlayer(id)||null;
    const candidates=getStoredCandidates(id);
    const timestamps=Object.values(candidates).map(x=>Number(x?.updatedAt)||0).filter(Boolean);
    const targetMatches=Math.max(0,...Object.values(candidates).map(x=>Number(x?.targetMatches)||0));
    const elo=Object.values(candidates).find(x=>String(x?.modelName||'').toLowerCase()==='elo');
    const glicko=Object.values(candidates).find(x=>String(x?.modelName||'').toLowerCase()==='glicko');
    const er=finiteOrNull(elo?.rating),gr=finiteOrNull(glicko?.rating);
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
      ingest:latestIngestSummary(ratingStore,id),
      database:databaseStats(ratingStore),
      modelGapPoints:er===null||gr===null?null:Math.round(Math.abs(er-gr)),
      interpretation:{stabilityIsPredictiveAccuracy:false,predictiveAccuracyValidated:false,stabilityBasis:'sample_size_plus_model_uncertainty'},
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

module.exports={DEFAULT_MODELS,DB_BASENAME,publicCandidate,publicIngest,databaseStats,latestIngestSummary,createUniversalRatingRuntime,production_active:false,automatic_promotion:false,mode:'dual-shadow'};