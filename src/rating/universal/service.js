'use strict';
const {assertConnector,assertEstimator,assertStore}=require('./contracts');
const {normalizeMatch,fingerprint}=require('./normalizer');
const {confidence}=require('./confidence');
const finiteOrNull=v=>v===null||v===undefined||v===''?null:(Number.isFinite(Number(v))?Number(v):null);

class UniversalRatingService{
  constructor({connector=null,store,estimator,queueId=450}={}){
    this.connector=connector?assertConnector(connector):null;
    this.store=assertStore(store);
    this.estimator=assertEstimator(estimator);
    this.queueId=queueId;
  }

  async rateResolved({player,matches=[],force=false,reason='PROFILE_HISTORY_RESOLVED',source='profile-history'}={}){
    const puuid=String(player?.puuid||'').trim();
    if(!puuid)throw new Error('player.puuid required');
    this.store.putPlayer({...player,puuid});

    const accepted=[];
    let rejected=0,targetMismatch=0,duplicates=0;
    for(const raw of Array.isArray(matches)?matches:[]){
      let match=null;
      try{match=normalizeMatch(raw,{queueId:this.queueId})}catch{match=null}
      if(!match){rejected++;continue}
      if(!match.teamA.includes(puuid)&&!match.teamB.includes(puuid)){targetMismatch++;continue}
      if(this.store.getMatch(match.matchId)){duplicates++;continue}
      accepted.push(match);
    }
    const affectedPuuids=[...new Set(accepted.flatMap(m=>[...(m?.teamA||[]),...(m?.teamB||[])]).map(String).filter(Boolean))];
    if(accepted.length){
      if(typeof this.store.putMatches==='function')this.store.putMatches(accepted);
      else accepted.forEach(m=>this.store.putMatch(m));
    }

    const allMatches=typeof this.store.getAllMatches==='function'?this.store.getAllMatches():this.store.getMatchesForPlayer(puuid);
    const ownMatches=this.store.getMatchesForPlayer(puuid);
    const evidenceFingerprint=fingerprint(allMatches,this.estimator.modelVersion);
    const before=this.store.getRating(this.estimator.modelVersion,puuid);
    if(!force&&before?.evidenceFingerprint===evidenceFingerprint){
      return{...before,player:this.store.getPlayer(puuid)||player,cacheHit:true,newMatches:accepted.length,totalMatches:ownMatches.length,rejectedMatches:rejected,targetMismatchMatches:targetMismatch,duplicateMatches:duplicates,affectedPuuids,networkRequests:0,source};
    }

    const estimate=await this.estimator.estimate({puuid,matches:allMatches,player:this.store.getPlayer(puuid)||player});
    const conf=confidence(estimate);
    const record={
      schemaVersion:1,
      puuid,
      modelVersion:this.estimator.modelVersion,
      modelName:estimate.modelName||this.estimator.modelName||null,
      modelStatus:estimate.modelStatus||this.estimator.status||'SHADOW',
      status:estimate.status,
      rating:finiteOrNull(estimate.rating),
      uncertainty:finiteOrNull(estimate.uncertainty),
      uncertaintyKind:String(estimate.uncertaintyKind||''),
      details:estimate.details&&typeof estimate.details==='object'?estimate.details:null,
      games:Number(estimate.games)||0,
      confidence:conf,
      evidenceFingerprint,
      evidenceMatches:allMatches.length,
      targetMatches:ownMatches.length,
      updatedAt:Date.now(),
      productionActive:false
    };
    this.store.putRating(record);
    this.store.appendAudit({
      type:'RATING_RECALCULATED',reason,source,puuid,modelVersion:record.modelVersion,
      evidenceFingerprint,newMatches:accepted.length,evidenceMatches:record.evidenceMatches,
      targetMatches:record.targetMatches,rejectedMatches:rejected,targetMismatchMatches:targetMismatch,
      previousRating:before?.rating??null,newRating:record.rating,
      delta:before&&Number.isFinite(before.rating)&&Number.isFinite(record.rating)?record.rating-before.rating:null,
      networkRequests:0,productionActive:false
    });
    return{...record,player:this.store.getPlayer(puuid)||player,cacheHit:false,newMatches:accepted.length,totalMatches:ownMatches.length,rejectedMatches:rejected,targetMismatchMatches:targetMismatch,duplicateMatches:duplicates,affectedPuuids,networkRequests:0,source};
  }

  async lookup(query,{limit=30,force=false,reason='SEARCH'}={}){
    if(!this.connector)throw new Error('connector required for lookup; use rateResolved for preloaded history');
    let networkRequests=0;
    const player=await this.connector.resolvePlayer(query);networkRequests++;
    if(!player?.puuid)throw new Error('player_not_resolved');
    const puuid=String(player.puuid);
    const ids=[...new Set((await this.connector.fetchMatchIds(puuid,{limit,queueId:this.queueId}))||[])].map(String).filter(Boolean);networkRequests++;
    const fetched=[];
    for(const id of ids){
      if(!force&&this.store.getMatch(id))continue;
      const raw=await this.connector.fetchMatch(id);networkRequests++;
      if(raw)fetched.push(raw);
    }
    const result=await this.rateResolved({player:{...player,puuid},matches:fetched,force,reason,source:'connector-lookup'});
    return{...result,networkRequests,source:'connector-lookup'};
  }
}

module.exports={UniversalRatingService,finiteOrNull,production_active:false,automatic_promotion:false,resolved_history_supported:true};
