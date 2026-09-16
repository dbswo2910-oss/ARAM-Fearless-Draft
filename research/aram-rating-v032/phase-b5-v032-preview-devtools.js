'use strict';
(()=>{
  const VERSION='v0.3.2',DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const CFG=Object.freeze({phase:'B5',sampling_profile:'B5_CLOSED_NETWORK_PREVIEW',history_limit:50,min_train_observations:5,skip_headroom_lte:3,skip_duplicate_ratio_gte:.94,preview_candidates:60,automatic_collection:false});
  function core(){const c=globalThis.ARAMRatingB5ClosedNetworkCoreV032;if(!c)throw new Error('B5_core_not_loaded_load_b5_closed_network_core_first');return c}
  function openExisting(){return new Promise((res,rej)=>{const q=indexedDB.open(DB);let upgrading=false;q.onupgradeneeded=()=>{upgrading=true;try{q.transaction.abort()}catch{};rej(new Error('research_db_missing_refusing_to_create'))};q.onsuccess=()=>{if(upgrading)return;const db=q.result;if(!db.objectStoreNames.contains(STORE)){db.close();return rej(new Error('research_store_missing'))}res(db)};q.onerror=()=>{if(!upgrading)rej(q.error||new Error('research_db_open_failed'))}})}
  async function readCp(){const db=await openExisting();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(KEY);r.onsuccess=()=>{db.close();res(r.result??null)};r.onerror=()=>{db.close();rej(r.error)}})}
  async function preview(){
    const C=core(),cp=await readCp();if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');
    const n=C.dedupeMatches(cp.matches||[]).length;if(n<1900)throw new Error('b5_requires_existing_checkpoint_1900_plus_matches_current_'+n);
    const coverage=C.currentNoColdCoverage(cp.matches||[]),top=C.buildClosedCandidatePool(cp,CFG).slice(0,CFG.preview_candidates),pools={closed_train_5_9:0,closed_train_10_19:0,closed_train_20_plus:0};for(const x of top)pools[x.source_pool]=(pools[x.source_pool]||0)+1;
    const out={status:'PREVIEW_ONLY',sampling_profile:CFG.sampling_profile,riot_lcu_collection_requests_performed:0,checkpoint_written:false,checkpoint_matches:n,current_no_cold_coverage:coverage,selected_count:top.length,min_train_observations:CFG.min_train_observations,closed_network_first:true,selected_pool_counts:pools,candidates:top.map((x,i)=>({candidate:'Candidate '+String(i+1).padStart(2,'0'),source_pool:x.source_pool,current_observations:x.current_observation_count,train_observations:x.train_observation_count,expected_headroom:x.expected_new_headroom,train_seen_neighbor_ratio:x.train_seen_neighbor_ratio,train_5plus_neighbor_ratio:x.train_5plus_neighbor_ratio,train_10plus_neighbor_ratio:x.train_10plus_neighbor_ratio,historical_closed_match_ratio:x.historical_closed_match_ratio,historical_closed_5plus_match_ratio:x.historical_closed_5plus_match_ratio,no_cold_yield_proxy:x.no_cold_yield_proxy,new_player_penalty:x.closed_network_new_player_penalty,closed_network_priority:x.b5_priority}))};
    console.table(out.candidates);console.log('[ARAM Rating v0.3.2] B5 CLOSED-NETWORK PREVIEW ONLY · no Riot/LCU collection request',out);return out;
  }
  window.aramRatingB5PreviewV032={version:VERSION,config:{...CFG},preview};
  console.log('[ARAM Rating v0.3.2] B5 closed-network preview ready. READ ONLY · no Riot/LCU collection · run: await aramRatingB5PreviewV032.preview()');
})();
