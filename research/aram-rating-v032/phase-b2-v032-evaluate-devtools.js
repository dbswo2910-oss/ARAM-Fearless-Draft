'use strict';
/* ARAM Rating v0.3.2 B2 aggregate evaluator. Read-only: never writes checkpoint and never starts Riot/LCU collection. */
(()=>{
  const VERSION='v0.3.2',DB='aram-rating-research-v03',STORE='kv',CP_KEY='checkpoint-v03';
  const ENGINE_URL='https://raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/research/aram-rating-v031-active-sampling/update/v0.15.129/rating-engine-v01.js';
  async function engine(){
    if(globalThis.ARAMRatingResearchEngineV01)return globalThis.ARAMRatingResearchEngineV01;
    const src=await fetch(ENGINE_URL+'?t='+Date.now()).then(r=>{if(!r.ok)throw new Error('reference_engine_fetch_'+r.status);return r.text()});
    (0,eval)(src);
    if(!globalThis.ARAMRatingResearchEngineV01)throw new Error('reference_engine_unavailable');
    return globalThis.ARAMRatingResearchEngineV01;
  }
  function dbOpenExisting(){return new Promise((res,rej)=>{const q=indexedDB.open(DB);let upgrading=false;q.onupgradeneeded=()=>{upgrading=true;try{q.transaction.abort()}catch{};rej(new Error('research_db_missing_refusing_to_create'))};q.onsuccess=()=>{if(upgrading){try{q.result.close()}catch{};return}const db=q.result;if(!db.objectStoreNames.contains(STORE)){db.close();rej(new Error('research_store_missing'));return}res(db)};q.onerror=()=>{if(!upgrading)rej(q.error||new Error('research_db_open_failed'))}})}
  async function get(k){const db=await dbOpenExisting();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(k);r.onsuccess=()=>{db.close();res(r.result??null)};r.onerror=()=>{db.close();rej(r.error)}})}
  const metric=m=>({n:m?.n??0,accuracy:m?.accuracy??null,log_loss:m?.log_loss??null,brier:m?.brier??null,ece:m?.ece??null});
  const cold=c=>({match_fraction:c?.match_fraction??null,player_fraction:c?.player_fraction??null,matches_with_cold_start:c?.matches_with_cold_start??0,cold_players:c?.cold_players??0});
  function modelSummary(r){return{frozen:metric(r?.frozen),walk_forward:metric(r?.walk_forward),frozen_cold_start:cold(r?.frozen_cold_start),walk_forward_cold_start:cold(r?.walk_forward_cold_start)}}
  async function evaluate(){
    const cp=await get(CP_KEY);if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');if(!Array.isArray(cp.matches))throw new Error('checkpoint_matches_missing');
    const E=await engine(),normalized=E.normalizeMatches(cp.matches);if(normalized.length<500)throw new Error(`b2_500_required_current_${normalized.length}`);
    const run=E.buildLatestRun(cp.matches,{phase:'B2',status:cp.status||'hard_cap_reached',sampling_version:VERSION,source:'local_checkpoint_v032'});
    const summary={
      status:'SUCCESS',evaluation:'B2_500_AGGREGATE',sampling_version:VERSION,engine_version:run.engine_version,
      dataset:{matches:run.dataset.matches,players:run.dataset.players,train:run.dataset.train,test:run.dataset.test,single_match_fraction:run.dataset.single_match_fraction,players_2_plus:run.dataset.players_2_plus,players_5_plus:run.dataset.players_5_plus,players_10_plus:run.dataset.players_10_plus,component_count:run.dataset.component_count,largest_component_fraction:run.dataset.largest_component_fraction,pair_graph_density:run.dataset.pair_graph_density,fingerprint:run.dataset.fingerprint},
      observed_leader:run.observed_leader,observed_runner_up:run.observed_runner_up,
      models:{elo:modelSummary(run.models.elo),glicko:modelSummary(run.models.glicko),trueskill_family:modelSummary(run.models.trueskill_family)},
      baselines:{constant_50:{frozen:metric(run.baselines?.constant_50?.frozen),walk_forward:metric(run.baselines?.constant_50?.walk_forward)},historical_winrate:{frozen:metric(run.baselines?.historical_winrate?.frozen),walk_forward:metric(run.baselines?.historical_winrate?.walk_forward)},recent_winrate:{frozen:metric(run.baselines?.recent_winrate?.frozen),walk_forward:metric(run.baselines?.recent_winrate?.walk_forward)}},
      selection:run.selection,
      privacy:{raw_matches_returned:false,raw_puuid_returned:false,riot_id_returned:false,identity_mapping_returned:false},
      side_effects:{checkpoint_written:false,riot_lcu_requests:0,automatic_collection:false,production_changed:false}
    };
    console.table(Object.entries(summary.models).map(([model,v])=>({model,frozen_log_loss:v.frozen.log_loss,frozen_brier:v.frozen.brier,frozen_ece:v.frozen.ece,frozen_accuracy:v.frozen.accuracy,walk_forward_log_loss:v.walk_forward.log_loss,walk_forward_brier:v.walk_forward.brier,walk_forward_ece:v.walk_forward.ece,walk_forward_accuracy:v.walk_forward.accuracy,frozen_cold_player_fraction:v.frozen_cold_start.player_fraction,walk_cold_player_fraction:v.walk_forward_cold_start.player_fraction})));
    console.log('[ARAM Rating v0.3.2] B2 500 aggregate evaluation complete',summary);return summary;
  }
  window.aramRatingB2EvaluateV032={version:VERSION,evaluate};
  console.log('[ARAM Rating v0.3.2] B2 evaluator ready. READ ONLY · no Riot/LCU collection · run: await aramRatingB2EvaluateV032.evaluate()');
})();
