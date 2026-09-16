'use strict';
const SCHEMA_VERSION=1;
const IMPLEMENTATION_VERSION='1.0.0-shadow';
const invariant=(ok,msg)=>{if(!ok)throw new Error(msg)};
function assertConnector(x){invariant(x&&typeof x.resolvePlayer==='function','connector.resolvePlayer required');invariant(typeof x.fetchMatchIds==='function','connector.fetchMatchIds required');invariant(typeof x.fetchMatch==='function','connector.fetchMatch required');return x}
function assertEstimator(x){invariant(x&&typeof x.modelVersion==='string'&&x.modelVersion,'estimator.modelVersion required');invariant(typeof x.estimate==='function','estimator.estimate required');return x}
function assertStore(x){for(const k of ['getPlayer','putPlayer','getMatch','putMatch','getRating','putRating','appendAudit'])invariant(x&&typeof x[k]==='function',`store.${k} required`);return x}
function ratingKey(modelVersion,puuid){invariant(modelVersion&&puuid,'rating key requires modelVersion and puuid');return `${String(modelVersion)}|${String(puuid)}`}
module.exports={SCHEMA_VERSION,IMPLEMENTATION_VERSION,invariant,assertConnector,assertEstimator,assertStore,ratingKey,production_active:false,automatic_promotion:false};