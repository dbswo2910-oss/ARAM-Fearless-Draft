'use strict';
const storage=require('./storage');
const engine=require('./rating-engine');
const dualShadow=require('./dual-shadow');
const evidenceStore=require('./shadow-evidence-store');
const promotionGate=require('./shadow-promotion-gate');

const IMPLEMENTATION_VERSION='r17-installed-shadow-rc-v1';
const HISTORY_OPTIONS=Object.freeze({limit:30,scan:40});
const CONTRACT=Object.freeze({
  mode:'installed_shadow_rc',
  production_active:false,
  automatic_collection:false,
  blind_bulk_collection:false,
  recurring_polling:false,
  max_history_requests_per_run:1,
  canonical_checkpoint_writes:false,
  production_score_writes:false,
  ui_writes:false,
  raw_identity_persisted:false,
  raw_identity_export:false,
  automatic_promotion:false
});

const arr=x=>Array.isArray(x)?x:[];
function historyRowsFromResponse(x){
  if(Array.isArray(x))return x;
  for(const k of['matches','games','history','items','rows'])if(Array.isArray(x?.[k]))return x[k];
  if(Array.isArray(x?.data))return x.data;
  for(const k of['matches','games','history','items','rows'])if(Array.isArray(x?.data?.[k]))return x.data[k];
  return[];
}
function dedupeMatches(rows){const by=new Map();for(const r of rows||[])if(r?.match_id)by.set(String(r.match_id),r);return[...by.values()].sort((a,b)=>(Number(a.time)||0)-(Number(b.time)||0)||String(a.match_id).localeCompare(String(b.match_id)))}
function createBrowserHistoryProvider(windowRef=globalThis.window){const fn=windowRef?.aramDesktop?.getAramMatchHistory;if(typeof fn!=='function')return null;return opts=>fn.call(windowRef.aramDesktop,opts)}
async function readCanonicalCheckpoint(storageApi,indexedDBRef){let db=null;try{const opened=await storageApi.openExistingDatabase(indexedDBRef,storageApi.DB_NAME);if(opened?.missing||!opened?.db)return{state:'checkpoint_missing',checkpoint:null};db=opened.db;const cp=await storageApi.readKey(db,storageApi.CHECKPOINT_KEY);if(!cp)return{state:'checkpoint_missing',checkpoint:null};if(!arr(cp.matches).length)return{state:'dataset_empty',checkpoint:cp};return{state:'available',checkpoint:cp}}catch(error){return{state:'database_unavailable',checkpoint:null,error}}finally{try{db?.close?.()}catch{}}}
function publicResult({state='available',historyRequests=0,historyError=null,baselineMatches=0,historyValid=0,deltaMatches=0,augmentedMatches=0,snapshotCount=0,snapshot=null,promotion=null}={}){
  return Object.freeze({
    schema:'aram-rating-installed-shadow-rc-v1',state,implementation_version:IMPLEMENTATION_VERSION,
    production_active:false,production_score_changed:false,ui_changed:false,canonical_checkpoint_written:false,automatic_promotion:false,
    history_requests:Number(historyRequests)||0,history_error:historyError?String(historyError?.message||historyError):null,
    baseline_matches:Number(baselineMatches)||0,history_valid_matches:Number(historyValid)||0,stored_delta_matches:Number(deltaMatches)||0,augmented_matches:Number(augmentedMatches)||0,
    evidence_snapshots:Number(snapshotCount)||0,observed_leader:snapshot?.observed_leader||null,observed_runner_up:snapshot?.observed_runner_up||null,selection_status:snapshot?.selection_status||null,
    frozen_log_loss_gap_glicko_minus_elo:Number.isFinite(Number(snapshot?.metrics?.log_loss_gap_glicko_minus_elo?.frozen))?Number(snapshot.metrics.log_loss_gap_glicko_minus_elo.frozen):null,
    walk_forward_log_loss_gap_glicko_minus_elo:Number.isFinite(Number(snapshot?.metrics?.log_loss_gap_glicko_minus_elo?.walk_forward))?Number(snapshot.metrics.log_loss_gap_glicko_minus_elo.walk_forward):null,
    promotion_status:promotion?.status||'hold_shadow',production_activation_authorized:false,
    privacy:Object.freeze({raw_puuid_returned:false,raw_match_id_returned:false,identity_mapping_returned:false})
  });
}

async function runOnce(opts={}){
  const storageApi=opts.storageApi||storage,engineApi=opts.engineApi||engine,dualShadowApi=opts.dualShadowApi||dualShadow,evidenceApi=opts.evidenceApi||evidenceStore,promotionApi=opts.promotionApi||promotionGate;
  const indexedDBRef=opts.indexedDBRef||globalThis.indexedDB,cryptoRef=opts.cryptoRef||globalThis.crypto;
  const canonical=await readCanonicalCheckpoint(storageApi,indexedDBRef);
  if(canonical.state!=='available')return publicResult({state:canonical.state});
  const cp=canonical.checkpoint,baselineNormalized=engineApi.normalizeMatches(arr(cp.matches));
  if(!baselineNormalized.length)return publicResult({state:'dataset_empty'});
  const repository=opts.evidenceRepository||evidenceApi.createIndexedDbRepository({indexedDBRef});
  const salt=await evidenceApi.getOrCreateSalt(repository,cryptoRef);
  const baselinePseudo=baselineNormalized.map(x=>evidenceApi.pseudonymizeNormalizedMatch(x,salt)).filter(Boolean);
  const baselineIds=new Set(baselinePseudo.map(x=>x.match_id));
  let historyRequests=0,historyError=null,historyNormalized=[];
  const historyProvider=opts.historyProvider===undefined?createBrowserHistoryProvider(opts.windowRef||globalThis.window):opts.historyProvider;
  if(typeof historyProvider==='function'){
    historyRequests=1;
    try{const response=await historyProvider({...HISTORY_OPTIONS,...(opts.historyOptions||{})});historyNormalized=engineApi.normalizeMatches(historyRowsFromResponse(response))}catch(e){historyError=e}
  }
  const historyPseudo=historyNormalized.map(x=>evidenceApi.pseudonymizeNormalizedMatch(x,salt)).filter(Boolean);
  const newDelta=historyPseudo.filter(x=>!baselineIds.has(x.match_id));
  await evidenceApi.recordDeltaMatches(repository,newDelta,opts.maxDeltaMatches||evidenceApi.MAX_DELTA_MATCHES);
  const storedDelta=(await repository.listMatches()).filter(x=>!baselineIds.has(x.match_id));
  const combined=dedupeMatches([...baselinePseudo,...storedDelta]);
  const raw=combined.map(evidenceApi.toEngineRawMatch).filter(Boolean);
  const run=engineApi.buildLatestRun(raw,{phase:'R17_PASSIVE_INSTALLED_SHADOW_RC',status:'passive_history_observation',sampling_version:'v0.3.2',source:'canonical_checkpoint_plus_privacy_safe_passive_delta'});
  const snapshot=dualShadowApi.buildSnapshot(run);
  const snapshotHistory=await evidenceApi.recordSnapshot(repository,snapshot,opts.maxSnapshots||evidenceApi.MAX_SNAPSHOTS);
  const promotion=promotionApi.evaluatePromotion(snapshotHistory);
  return publicResult({state:'available',historyRequests,historyError,baselineMatches:baselinePseudo.length,historyValid:historyNormalized.length,deltaMatches:storedDelta.length,augmentedMatches:combined.length,snapshotCount:snapshotHistory.length,snapshot,promotion});
}

module.exports={IMPLEMENTATION_VERSION,HISTORY_OPTIONS,CONTRACT,historyRowsFromResponse,dedupeMatches,createBrowserHistoryProvider,readCanonicalCheckpoint,publicResult,runOnce,production_active:false,automatic_collection:false,blind_bulk_collection:false,recurring_polling:false,automatic_promotion:false,score_logic_changed:false,profile_scoring_changed:false};
