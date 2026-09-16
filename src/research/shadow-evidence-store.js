'use strict';
const DB_NAME='aram-rating-shadow-evidence-v1';
const DB_VERSION=1;
const STORES=Object.freeze({meta:'meta',matches:'matches',snapshots:'snapshots'});
const MAX_DELTA_MATCHES=500,MAX_SNAPSHOTS=32;
const CONTRACT=Object.freeze({
  mode:'installed_shadow_evidence_only',
  local_only:true,
  canonical_checkpoint_writes:false,
  production_score_writes:false,
  ui_writes:false,
  raw_identity_persisted:false,
  raw_identity_export:false,
  automatic_promotion:false,
  destructive_migration:false,
  production_active:false
});

function fnv32(text,seed){let h=seed>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,'0')}
function hashToken(namespace,value,salt){const s=`${String(salt)}|${String(namespace)}|${String(value)}`;return `${fnv32(s,2166136261)}${fnv32(s,0x9e3779b9)}`}
function pseudonymizeId(value,salt){return`p_${hashToken('player',value,salt)}`}
function pseudonymizeMatchId(value,salt){return`m_${hashToken('match',value,salt)}`}
function randomSalt(cryptoRef=globalThis.crypto){if(!cryptoRef?.getRandomValues)throw new Error('shadow_evidence_crypto_unavailable');const a=new Uint8Array(16);cryptoRef.getRandomValues(a);return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('')}

function pseudonymizeNormalizedMatch(m,salt){
  if(!m?.match_id||!Array.isArray(m.team_a)||!Array.isArray(m.team_b))return null;
  return Object.freeze({
    match_id:pseudonymizeMatchId(m.match_id,salt),
    time:Number(m.time)||0,
    patch:String(m.patch||'UNKNOWN'),
    team_a:Object.freeze(m.team_a.map(x=>pseudonymizeId(x,salt))),
    team_b:Object.freeze(m.team_b.map(x=>pseudonymizeId(x,salt))),
    team_a_win:!!m.team_a_win
  });
}
function toEngineRawMatch(m){
  if(!m)return null;
  const a=(m.team_a||[]).map(puuid=>({puuid,teamId:100,win:!!m.team_a_win}));
  const b=(m.team_b||[]).map(puuid=>({puuid,teamId:200,win:!m.team_a_win}));
  return{gameId:String(m.match_id),gameEndTimestamp:Number(m.time)||0,gameVersion:String(m.patch||'UNKNOWN'),queueId:450,participants:[...a,...b]};
}
function sanitizeSnapshot(s){
  if(!s)return null;
  const metric=x=>({n:Number(x?.n)||0,accuracy:Number.isFinite(Number(x?.accuracy))?Number(x.accuracy):null,log_loss:Number.isFinite(Number(x?.log_loss))?Number(x.log_loss):null,brier:Number.isFinite(Number(x?.brier))?Number(x.brier):null,ece:Number.isFinite(Number(x?.ece))?Number(x.ece):null});
  return{
    schema:'aram-rating-dual-shadow-v1',mode:'shadow_only',observed_leader:s.observed_leader||null,observed_runner_up:s.observed_runner_up||null,
    selection_status:s.selection_status||null,shadow_strategy:s.shadow_strategy||null,
    dataset:{matches:Number(s?.dataset?.matches)||0,players:Number(s?.dataset?.players)||0,fingerprint:String(s?.dataset?.fingerprint||'')||null},
    metrics:{elo:{frozen:metric(s?.metrics?.elo?.frozen),walk_forward:metric(s?.metrics?.elo?.walk_forward)},glicko:{frozen:metric(s?.metrics?.glicko?.frozen),walk_forward:metric(s?.metrics?.glicko?.walk_forward)},log_loss_gap_glicko_minus_elo:{frozen:Number.isFinite(Number(s?.metrics?.log_loss_gap_glicko_minus_elo?.frozen))?Number(s.metrics.log_loss_gap_glicko_minus_elo.frozen):null,walk_forward:Number.isFinite(Number(s?.metrics?.log_loss_gap_glicko_minus_elo?.walk_forward))?Number(s.metrics.log_loss_gap_glicko_minus_elo.walk_forward):null}},
    target:null,privacy:{raw_puuid_returned:false,identity_mapping_returned:false,raw_match_id_returned:false}
  };
}

function request(q,stage){return new Promise((resolve,reject)=>{q.onsuccess=()=>resolve(q.result??null);q.onerror=()=>reject(Object.assign(q.error||new Error(`indexeddb_${stage}_failed`),{stage}))})}
function transactionDone(tx,stage){return new Promise((resolve,reject)=>{tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(Object.assign(tx.error||new Error(`indexeddb_${stage}_failed`),{stage}));tx.onabort=()=>reject(Object.assign(tx.error||new Error(`indexeddb_${stage}_aborted`),{stage}))})}
async function openEvidenceDatabase(indexedDBRef=globalThis.indexedDB){
  if(!indexedDBRef?.open)throw new Error('shadow_evidence_indexeddb_unavailable');
  return new Promise((resolve,reject)=>{const q=indexedDBRef.open(DB_NAME,DB_VERSION);q.onupgradeneeded=()=>{const db=q.result;if(!db.objectStoreNames.contains(STORES.meta))db.createObjectStore(STORES.meta,{keyPath:'key'});if(!db.objectStoreNames.contains(STORES.matches))db.createObjectStore(STORES.matches,{keyPath:'match_id'});if(!db.objectStoreNames.contains(STORES.snapshots))db.createObjectStore(STORES.snapshots,{keyPath:'fingerprint'})};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error||new Error('shadow_evidence_open_failed'));q.onblocked=()=>reject(new Error('shadow_evidence_open_blocked'))});
}
function createIndexedDbRepository({indexedDBRef=globalThis.indexedDB}={}){
  async function withDb(fn){const db=await openEvidenceDatabase(indexedDBRef);try{return await fn(db)}finally{try{db.close()}catch{}}}
  return Object.freeze({
    async getMeta(key){return withDb(async db=>{const tx=db.transaction(STORES.meta,'readonly');const row=await request(tx.objectStore(STORES.meta).get(String(key)),'meta_read');return row?.value??null})},
    async putMeta(key,value){return withDb(async db=>{const tx=db.transaction(STORES.meta,'readwrite');tx.objectStore(STORES.meta).put({key:String(key),value});await transactionDone(tx,'meta_write');return true})},
    async listMatches(){return withDb(async db=>{const tx=db.transaction(STORES.matches,'readonly');return(await request(tx.objectStore(STORES.matches).getAll(),'matches_read')||[]).sort((a,b)=>(Number(a.time)||0)-(Number(b.time)||0)||String(a.match_id).localeCompare(String(b.match_id)))})},
    async putMatches(rows){return withDb(async db=>{const tx=db.transaction(STORES.matches,'readwrite'),s=tx.objectStore(STORES.matches);for(const r of rows||[])s.put(r);await transactionDone(tx,'matches_write');return true})},
    async deleteMatches(ids){return withDb(async db=>{const tx=db.transaction(STORES.matches,'readwrite'),s=tx.objectStore(STORES.matches);for(const id of ids||[])s.delete(id);await transactionDone(tx,'matches_prune');return true})},
    async listSnapshots(){return withDb(async db=>{const tx=db.transaction(STORES.snapshots,'readonly');return(await request(tx.objectStore(STORES.snapshots).getAll(),'snapshots_read')||[]).sort((a,b)=>(Number(a?.dataset?.matches)||0)-(Number(b?.dataset?.matches)||0))})},
    async putSnapshot(row){return withDb(async db=>{const tx=db.transaction(STORES.snapshots,'readwrite');tx.objectStore(STORES.snapshots).put({...row,fingerprint:String(row?.dataset?.fingerprint||row?.fingerprint||'')});await transactionDone(tx,'snapshot_write');return true})},
    async deleteSnapshots(fps){return withDb(async db=>{const tx=db.transaction(STORES.snapshots,'readwrite'),s=tx.objectStore(STORES.snapshots);for(const fp of fps||[])s.delete(fp);await transactionDone(tx,'snapshots_prune');return true})}
  });
}
async function getOrCreateSalt(repository,cryptoRef=globalThis.crypto){let salt=await repository.getMeta('identity_salt_v1');if(salt)return String(salt);salt=randomSalt(cryptoRef);await repository.putMeta('identity_salt_v1',salt);return salt}
async function recordDeltaMatches(repository,rows,max=MAX_DELTA_MATCHES){const current=await repository.listMatches(),by=new Map(current.map(x=>[x.match_id,x]));for(const r of rows||[])if(r?.match_id)by.set(r.match_id,r);const all=[...by.values()].sort((a,b)=>(Number(a.time)||0)-(Number(b.time)||0)||String(a.match_id).localeCompare(String(b.match_id))),kept=all.slice(-Math.max(1,Number(max)||MAX_DELTA_MATCHES)),drop=all.slice(0,Math.max(0,all.length-kept.length)).map(x=>x.match_id);if(rows?.length)await repository.putMatches(rows);if(drop.length)await repository.deleteMatches(drop);return kept}
async function recordSnapshot(repository,snapshot,max=MAX_SNAPSHOTS){const clean=sanitizeSnapshot(snapshot);if(!clean?.dataset?.fingerprint)return repository.listSnapshots();await repository.putSnapshot(clean);const all=await repository.listSnapshots();if(all.length<=max)return all;const drop=all.slice(0,all.length-max).map(x=>x.dataset.fingerprint);await repository.deleteSnapshots(drop);return repository.listSnapshots()}

module.exports={DB_NAME,DB_VERSION,STORES,MAX_DELTA_MATCHES,MAX_SNAPSHOTS,CONTRACT,fnv32,hashToken,pseudonymizeId,pseudonymizeMatchId,randomSalt,pseudonymizeNormalizedMatch,toEngineRawMatch,sanitizeSnapshot,openEvidenceDatabase,createIndexedDbRepository,getOrCreateSalt,recordDeltaMatches,recordSnapshot,production_active:false,automatic_promotion:false,destructive_migration:false};
