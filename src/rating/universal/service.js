'use strict';
const {assertConnector,assertEstimator,assertStore}=require('./contracts');
const {normalizeMatch,fingerprint}=require('./normalizer');
const {confidence}=require('./confidence');
class UniversalRatingService{
  constructor({connector,store,estimator,queueId=450}={}){this.connector=assertConnector(connector);this.store=assertStore(store);this.estimator=assertEstimator(estimator);this.queueId=queueId}
  async lookup(query,{limit=30,force=false,reason='SEARCH'}={}){
    const player=await this.connector.resolvePlayer(query);if(!player?.puuid)throw new Error('player_not_resolved');const puuid=String(player.puuid);this.store.putPlayer({...player,puuid});
    const ids=[...new Set((await this.connector.fetchMatchIds(puuid,{limit,queueId:this.queueId}))||[])].map(String).filter(Boolean);
    const fetched=[];for(const id of ids){if(!force&&this.store.getMatch(id))continue;const raw=await this.connector.fetchMatch(id);const match=normalizeMatch(raw,{queueId:this.queueId});if(match)fetched.push(match)}if(fetched.length){if(typeof this.store.putMatches==='function')this.store.putMatches(fetched);else fetched.forEach(m=>this.store.putMatch(m))}
    const allMatches=typeof this.store.getAllMatches==='function'?this.store.getAllMatches():this.store.getMatchesForPlayer(puuid);const ownMatches=this.store.getMatchesForPlayer(puuid);const evidenceFingerprint=fingerprint(allMatches,this.estimator.modelVersion),before=this.store.getRating(this.estimator.modelVersion,puuid);
    if(!force&&before?.evidenceFingerprint===evidenceFingerprint)return{...before,player,cacheHit:true,newMatches:0,totalMatches:ownMatches.length};
    const estimate=await this.estimator.estimate({puuid,matches:allMatches,player});const conf=confidence(estimate);const record={schemaVersion:1,puuid,modelVersion:this.estimator.modelVersion,modelName:estimate.modelName||null,modelStatus:estimate.modelStatus||'SHADOW',status:estimate.status,rating:Number.isFinite(Number(estimate.rating))?Number(estimate.rating):null,uncertainty:Number.isFinite(Number(estimate.uncertainty))?Number(estimate.uncertainty):null,games:Number(estimate.games)||0,confidence:conf,evidenceFingerprint,evidenceMatches:allMatches.length,targetMatches:ownMatches.length,updatedAt:Date.now(),productionActive:false};this.store.putRating(record);this.store.appendAudit({type:'RATING_RECALCULATED',reason,puuid,modelVersion:record.modelVersion,evidenceFingerprint,newMatches:fetched.length,evidenceMatches:record.evidenceMatches,targetMatches:record.targetMatches,previousRating:before?.rating??null,newRating:record.rating,delta:before&&Number.isFinite(before.rating)&&Number.isFinite(record.rating)?record.rating-before.rating:null,productionActive:false});return{...record,player,cacheHit:false,newMatches:fetched.length,totalMatches:ownMatches.length}
  }
}
module.exports={UniversalRatingService,production_active:false,automatic_promotion:false};