'use strict';
const IMPLEMENTATION_VERSION='0.16-universal-rating-shadow-v1';

const text=v=>String(v??'').trim();
const finiteOrNull=v=>v===null||v===undefined||v===''?null:(Number.isFinite(Number(v))?Number(v):null);
function resolvePlayerFromState(state){
  const s=state||{};
  const searched=s.targetMode==='searched';
  const target=searched?(s.target||{}):(s.localAccount||s.account||{});
  const account=s.account||{};
  const local=s.localAccount||{};
  const puuid=text(
    searched
      ? (target.puuid||account.puuid)
      : (local.puuid||target.puuid||account.puuid)
  );
  if(!puuid)return null;
  return{
    puuid,
    gameName:text(target.gameName||account.gameName||local.gameName||target.name||account.displayName),
    tagLine:text(target.tagLine||account.tagLine||local.tagLine),
    platformId:text(target.platformId||account.platformId||local.platformId||'KR'),
    targetMode:searched?'searched':'current'
  };
}

function safeView(result,player){
  if(!result)return null;
  return{
    schemaVersion:1,
    mode:'SHADOW',
    productionActive:false,
    targetMode:player?.targetMode||'unknown',
    modelVersion:result.modelVersion||null,
    modelName:result.modelName||null,
    modelStatus:result.modelStatus||'SHADOW',
    status:result.status||'UNKNOWN',
    rating:finiteOrNull(result.rating),
    uncertainty:finiteOrNull(result.uncertainty),
    games:Number(result.games)||0,
    confidence:result.confidence||null,
    evidenceMatches:Number(result.evidenceMatches)||0,
    targetMatches:Number(result.targetMatches)||0,
    newMatches:Number(result.newMatches)||0,
    cacheHit:result.cacheHit===true,
    networkRequests:Number(result.networkRequests)||0,
    source:result.source||'profile-history',
    updatedAt:Number(result.updatedAt)||Date.now()
  };
}

function createUniversalRatingProfileAdapter({ratingService,getState,onResult=(()=>{})}={}){
  if(!ratingService||typeof ratingService.rateResolved!=='function')throw new Error('ratingService.rateResolved required');
  if(typeof getState!=='function')throw new Error('getState required');
  let lastResult=null;

  async function rateLoadedHistory({force=false,reason='PROFILE_HISTORY_APPLIED'}={}){
    const state=getState()||{};
    const player=resolvePlayerFromState(state);
    if(!player){
      lastResult={schemaVersion:1,mode:'SHADOW',productionActive:false,status:'PLAYER_NOT_RESOLVED',rating:null,games:0,networkRequests:0};
      onResult(lastResult);
      return lastResult;
    }
    const matches=Array.isArray(state.matches)?state.matches:[];
    const result=await ratingService.rateResolved({player,matches,force,reason,source:'profile-history'});
    lastResult=safeView(result,player);
    onResult(lastResult);
    return lastResult;
  }

  function getLastResult(){return lastResult?{...lastResult}:null}
  return{rateLoadedHistory,getLastResult,resolvePlayer:()=>resolvePlayerFromState(getState())};
}

module.exports={IMPLEMENTATION_VERSION,finiteOrNull,resolvePlayerFromState,safeView,createUniversalRatingProfileAdapter,production_active:false,automatic_promotion:false,network_owner:false,owner_status:'shadow'};