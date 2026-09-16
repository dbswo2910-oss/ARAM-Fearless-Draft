'use strict';
(()=>{
  const VERSION='v0.3.2',PHASE='B5.1-R11';
  const DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const ENGINE_COMMIT='b114d21019872326bdb2cf410772fb0c1ad8ce34';
  const ENGINE_URL=`https://raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/${ENGINE_COMMIT}/update/v0.15.129/rating-engine-v01.js`;
  const EXPECTED=Object.freeze({checkpoint_matches:1984,queue_selected:15,completed:4,remaining:11,last_recovery_phase:'B5.1-R10'});
  const CONTRACT=Object.freeze({
    purpose:'read-only quality/model evaluation after successful R10 bounded recovery',
    riot_lcu_requests:0,checkpoint_access:'readonly',checkpoint_written:false,storage_mutation:false,
    production_changed:false,automatic_collection:false,raw_match_export:false,raw_identity_export:false,
    reference_engine_commit:ENGINE_COMMIT,primary_metric:'log_loss',secondary_metrics:['brier','ece','accuracy']
  });

  function openExistingReadonly(){
    return new Promise((resolve,reject)=>{
      const q=indexedDB.open(DB);let upgrading=false;
      q.onupgradeneeded=()=>{upgrading=true;try{q.transaction.abort()}catch{};reject(new Error('research_db_missing_refusing_to_create'))};
      q.onsuccess=()=>{if(upgrading)return;const db=q.result;if(!db.objectStoreNames.contains(STORE)){db.close();return reject(new Error('research_store_missing'))}resolve(db)};
      q.onerror=()=>{if(!upgrading)reject(q.error||new Error('research_db_open_failed'))};
    });
  }
  async function readCp(){
    const db=await openExistingReadonly();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(KEY);
      r.onsuccess=()=>{db.close();resolve(r.result??null)};
      r.onerror=()=>{db.close();reject(r.error||new Error('research_checkpoint_read_failed'))};
    });
  }
  async function engine(){
    if(globalThis.ARAMRatingResearchEngineV01)return globalThis.ARAMRatingResearchEngineV01;
    const src=await fetch(ENGINE_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('reference_engine_fetch_'+r.status);return r.text()});
    if(!src.includes("engine_version:'v0.1-js-port-of-research-models'"))throw new Error('reference_engine_signature_mismatch');
    (0,eval)(src);
    if(!globalThis.ARAMRatingResearchEngineV01?.buildLatestRun)throw new Error('reference_engine_unavailable');
    return globalThis.ARAMRatingResearchEngineV01;
  }
  const metric=m=>({n:m?.n??0,accuracy:m?.accuracy??null,log_loss:m?.log_loss??null,brier:m?.brier??null,ece:m?.ece??null});
  const cold=c=>({match_fraction:c?.match_fraction??null,player_fraction:c?.player_fraction??null,matches_with_cold_start:c?.matches_with_cold_start??0,cold_players:c?.cold_players??0});
  const modelSummary=r=>({frozen:metric(r?.frozen),walk_forward:metric(r?.walk_forward),frozen_cold_start:cold(r?.frozen_cold_start),walk_forward_cold_start:cold(r?.walk_forward_cold_start)});
  function recoverySummary(cp){
    const rows=(Array.isArray(cp?.b51_v032_recovery_history)?cp.b51_v032_recovery_history:[]).filter(x=>x?.phase==='B5.1-R9'||x?.phase==='B5.1-R10');
    const requests=rows.reduce((n,x)=>n+Number(x?.request_count||0),0);
    const returned=rows.reduce((n,x)=>n+Number(x?.returned_valid_matches||0),0);
    const fresh=rows.reduce((n,x)=>n+Number(x?.new_unique_matches||0),0);
    const duplicateEquivalent=Math.max(0,returned-fresh);
    const uniqueRatio=returned?fresh/returned:null;
    return{rows:rows.length,requests,returned_valid_matches:returned,new_unique_matches:fresh,duplicate_equivalent:duplicateEquivalent,unique_yield_ratio:uniqueRatio,new_unique_per_request:requests?fresh/requests:null,marginal_yield_low:returned>=40&&uniqueRatio!==null&&uniqueRatio<=0.05};
  }
  function checkpointState(cp,E){
    if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');
    if(!Array.isArray(cp.matches))throw new Error('checkpoint_matches_missing');
    const normalized=E.normalizeMatches(cp.matches),queue=Array.isArray(cp.b51_v032_queue)?cp.b51_v032_queue:[],completed=Array.isArray(cp.completed_puuids_b51_v032)?cp.completed_puuids_b51_v032:[],skipped=Array.isArray(cp.skipped_puuids_b51_v032)?cp.skipped_puuids_b51_v032:[];
    const done=new Set(completed),skip=new Set(skipped),remaining=queue.filter(x=>!done.has(x.puuid)&&!skip.has(x.puuid));
    const last=cp?.b51_v032_repair_state?.last_recovery_phase||null;
    return{ok:normalized.length===EXPECTED.checkpoint_matches&&queue.length===EXPECTED.queue_selected&&new Set(completed).size===EXPECTED.completed&&remaining.length===EXPECTED.remaining&&last===EXPECTED.last_recovery_phase,matches:normalized.length,queue_selected:queue.length,completed:new Set(completed).size,skipped:new Set(skipped).size,remaining:remaining.length,last_recovery_phase:last,checkpoint_status:cp.status||null};
  }
  function decision(selection,recovery){
    const status=String(selection?.status||'unknown');
    if(status==='candidate_winner'&&recovery.marginal_yield_low)return{classification:'R11_CANDIDATE_GATE_PASSED_COLLECTION_SATURATED',next_step:'FREEZE_BULK_COLLECTION_AND_RUN_PRODUCTION_SHADOW_VALIDATION'};
    if(status==='candidate_winner')return{classification:'R11_CANDIDATE_GATE_PASSED',next_step:'RUN_PRODUCTION_SHADOW_VALIDATION'};
    if(status==='no_clear_winner'&&recovery.marginal_yield_low)return{classification:'R11_NO_CLEAR_WINNER_BULK_COLLECTION_SATURATED',next_step:'TARGETED_INFORMATION_GAIN_COLLECTION_ONLY'};
    if(status==='no_clear_winner')return{classification:'R11_NO_CLEAR_WINNER',next_step:'CONTINUE_BOUNDED_INFORMATION_GAIN_COLLECTION'};
    return{classification:'R11_EVALUATION_INSUFFICIENT_OR_UNRESOLVED',next_step:'INSPECT_SELECTION_GATE'};
  }

  async function evaluate(){
    const cp=await readCp(),E=await engine(),pre=checkpointState(cp,E);
    if(!pre.ok)return{phase:PHASE,version:VERSION,mode:'READ_ONLY_POST_R10_EVALUATION',contract:CONTRACT,ok:false,refused:true,reason:'exact_r10_checkpoint_precondition_not_met',pre,side_effects:{checkpoint_written:false,riot_lcu_requests:0,production_changed:false}};
    const run=E.buildLatestRun(cp.matches,{phase:PHASE,status:cp.status||'b51_v032_recovery_paused',sampling_version:VERSION,source:'local_checkpoint_v032_post_r10'});
    const recovery=recoverySummary(cp),technical=decision(run.selection,recovery);
    const summary={
      phase:PHASE,version:VERSION,mode:'READ_ONLY_POST_R10_EVALUATION',contract:CONTRACT,ok:true,refused:false,
      classification:technical.classification,next_step:technical.next_step,checkpoint:pre,
      dataset:{matches:run.dataset.matches,players:run.dataset.players,train:run.dataset.train,test:run.dataset.test,single_match_fraction:run.dataset.single_match_fraction,players_2_plus:run.dataset.players_2_plus,players_5_plus:run.dataset.players_5_plus,players_10_plus:run.dataset.players_10_plus,component_count:run.dataset.component_count,largest_component_fraction:run.dataset.largest_component_fraction,pair_graph_density:run.dataset.pair_graph_density,fingerprint:run.dataset.fingerprint},
      recovery_efficiency:recovery,
      observed_leader:run.observed_leader,observed_runner_up:run.observed_runner_up,
      models:{elo:modelSummary(run.models.elo),glicko:modelSummary(run.models.glicko),trueskill_family:modelSummary(run.models.trueskill_family)},
      baselines:{constant_50:{frozen:metric(run.baselines?.constant_50?.frozen),walk_forward:metric(run.baselines?.constant_50?.walk_forward)},historical_winrate:{frozen:metric(run.baselines?.historical_winrate?.frozen),walk_forward:metric(run.baselines?.historical_winrate?.walk_forward)},recent_winrate:{frozen:metric(run.baselines?.recent_winrate?.frozen),walk_forward:metric(run.baselines?.recent_winrate?.walk_forward)}},
      selection:run.selection,
      privacy:{raw_matches_returned:false,raw_puuid_returned:false,riot_id_returned:false,identity_mapping_returned:false},
      side_effects:{checkpoint_written:false,riot_lcu_requests:0,automatic_collection:false,production_changed:false}
    };
    console.table(Object.entries(summary.models).map(([model,v])=>({model,frozen_log_loss:v.frozen.log_loss,frozen_brier:v.frozen.brier,frozen_ece:v.frozen.ece,frozen_accuracy:v.frozen.accuracy,walk_forward_log_loss:v.walk_forward.log_loss,walk_forward_brier:v.walk_forward.brier,walk_forward_ece:v.walk_forward.ece,walk_forward_accuracy:v.walk_forward.accuracy,frozen_cold_player_fraction:v.frozen_cold_start.player_fraction,walk_cold_player_fraction:v.walk_forward_cold_start.player_fraction})));
    console.log('[ARAM Rating v0.3.2] B5.1 R11 post-R10 evaluation complete · READ ONLY',summary);
    return summary;
  }

  window.aramRatingB51R11V032=Object.freeze({version:VERSION,phase:PHASE,contract:CONTRACT,evaluate});
  console.log('[ARAM Rating v0.3.2] B5.1 R11 evaluator ready. READ ONLY · ZERO Riot/LCU requests · ZERO checkpoint writes. Run await window.aramRatingB51R11V032.evaluate().');
})();
