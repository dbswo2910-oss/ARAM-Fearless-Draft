'use strict';
(()=>{
  const VERSION='v0.3.2',DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const CFG=Object.freeze({phase:'B4',sampling_profile:'B4_MATURE_NETWORK_2000',target_matches:2000,history_limit:50,min_candidate_observations:5,skip_headroom_lte:3,skip_duplicate_ratio_gte:.94,preview_candidates:60,automatic_collection:false});
  function core(){const c=globalThis.ARAMRatingB4MatureCoreV032;if(!c)throw new Error('B4_core_not_loaded_load_b4_mature_core_first');return c}
  function openExisting(){return new Promise((res,rej)=>{const q=indexedDB.open(DB);let upgrading=false;q.onupgradeneeded=()=>{upgrading=true;try{q.transaction.abort()}catch{};rej(new Error('research_db_missing_refusing_to_create'))};q.onsuccess=()=>{if(upgrading)return;const db=q.result;if(!db.objectStoreNames.contains(STORE)){db.close();return rej(new Error('research_store_missing'))}res(db)};q.onerror=()=>{if(!upgrading)rej(q.error||new Error('research_db_open_failed'))}})}
  async function readCp(){const db=await openExisting();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(KEY);r.onsuccess=()=>{db.close();res(r.result??null)};r.onerror=()=>{db.close();rej(r.error)}})}
  async function preview(){
    const C=core(),cp=await readCp();if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');
    const n=C.dedupeMatches(cp.matches||[]).length;if(n<1000)throw new Error('b4_requires_existing_checkpoint_1000_plus_matches_current_'+n);
    const k=C.kpis(cp.matches||[]),top=C.buildMatureCandidatePool(cp,CFG).slice(0,CFG.preview_candidates),poolCounts={mature_5_9:0,mature_10_19:0,mature_20_plus:0};for(const x of top)poolCounts[x.source_pool]=(poolCounts[x.source_pool]||0)+1;
    const out={status:'PREVIEW_ONLY',sampling_profile:CFG.sampling_profile,riot_lcu_collection_requests_performed:0,checkpoint_written:false,checkpoint_matches:k.matches,target_checkpoint_matches:CFG.target_matches,selected_count:top.length,min_candidate_observations:CFG.min_candidate_observations,mature_network_first:true,current:{players:k.players,single_match_fraction:k.single_match_fraction,players_2_plus:k.players_2_plus,players_5_plus:k.players_5_plus,players_10_plus:k.players_10_plus,connected_components:k.connected_components,giant_component_ratio:k.giant_component_ratio},selected_pool_counts:poolCounts,candidates:top.map((x,i)=>({candidate:'Candidate '+String(i+1).padStart(2,'0'),source_pool:x.source_pool,observations:x.current_observation_count,expected_headroom:x.expected_new_headroom,network_overlap:x.existing_network_overlap,mature_neighbor_ratio:x.mature_neighbor_ratio,ten_plus_neighbor_ratio:x.ten_plus_neighbor_ratio,no_cold_start_potential:x.no_cold_start_potential,new_player_explosion_penalty:x.new_player_explosion_penalty,mature_priority:x.b4_priority}))};
    console.table(out.candidates);console.log('[ARAM Rating v0.3.2] B4 MATURE-NETWORK PREVIEW ONLY · no Riot/LCU collection request',out);return out;
  }
  window.aramRatingB4PreviewV032={version:VERSION,config:{...CFG},preview};
  console.log('[ARAM Rating v0.3.2] B4 mature-network preview ready. READ ONLY · no Riot/LCU collection · run: await aramRatingB4PreviewV032.preview()');
})();
