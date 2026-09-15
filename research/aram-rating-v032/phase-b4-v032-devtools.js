'use strict';
(()=>{
  const VERSION='v0.3.2',DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const LOCK='__ARAM_RATING_PHASE_B4_V032_RUNNING__',CONFIRM='B4-MATURE-NETWORK-2000';
  const CFG=Object.freeze({phase:'B4',sampling_profile:'B4_MATURE_NETWORK_2000',max_expanded_players:60,max_matches_per_player:20,max_total_accepted_matches:2000,max_requests:180,request_timeout_ms:15000,retry_limit:2,cooldown_ms:1800,overall_timeout_ms:2700000,scan:100,history_limit:50,skip_headroom_lte:3,skip_duplicate_ratio_gte:.94,min_candidate_observations:5,min_resume_matches:1000,dynamic_rerank:true,automatic_collection:false});
  let runtime=null;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function core(){const c=globalThis.ARAMRatingB4MatureCoreV032;if(!c)throw new Error('B4_core_not_loaded_run_preview_loader_first');return c}
  function openExisting(){return new Promise((res,rej)=>{const q=indexedDB.open(DB);let upgrading=false;q.onupgradeneeded=()=>{upgrading=true;try{q.transaction.abort()}catch{};rej(new Error('research_db_missing_refusing_to_create'))};q.onsuccess=()=>{if(upgrading)return;const db=q.result;if(!db.objectStoreNames.contains(STORE)){db.close();return rej(new Error('research_store_missing'))}res(db)};q.onerror=()=>{if(!upgrading)rej(q.error||new Error('research_db_open_failed'))}})}
  async function readCp(){const db=await openExisting();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(KEY);r.onsuccess=()=>{db.close();res(r.result??null)};r.onerror=()=>{db.close();rej(r.error)}})}
  async function writeCp(cp){const db=await openExisting();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(cp,KEY);tx.oncomplete=()=>{db.close();res()};tx.onerror=()=>{db.close();rej(tx.error)}})}
  function assertCp(cp,C){if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');const n=C.dedupeMatches(cp.matches||[]).length;if(n<CFG.min_resume_matches)throw new Error('b4_requires_existing_checkpoint_1000_plus_matches_current_'+n);return cp}
  function countAtLeast(C,cp,n){let c=0;for(const v of C.networkState(cp.matches||[]).counts.values())if(v>=n)c++;return c}
  function summary(C,cp,label){const k=C.kpis(cp.matches||[]);return{label,checkpoint_matches:k.matches,players:k.players,single_match_fraction:k.single_match_fraction,players_2_plus:k.players_2_plus,players_5_plus:k.players_5_plus,players_10_plus:k.players_10_plus,players_20_plus:countAtLeast(C,cp,20),connected_components:k.connected_components,giant_component_ratio:k.giant_component_ratio,completed_b4:(cp.completed_puuids_b4_v032||[]).length}}
  function timed(p,ms){let t;return Promise.race([Promise.resolve(p).finally(()=>clearTimeout(t)),new Promise((_,rej)=>{t=setTimeout(()=>rej(new Error('request_timeout')),ms)})])}
  async function request(opts){if(runtime?.abort)throw new Error('manual_abort');if(runtime.requests>=CFG.max_requests)throw new Error('max_request_count');runtime.requests++;return timed(window.aramDesktop.getAramMatchHistory(opts),CFG.request_timeout_ms)}
  async function preview(){const C=core(),cp=assertCp(await readCp(),C),k=C.kpis(cp.matches||[]),top=C.buildMatureCandidatePool(cp,CFG).slice(0,CFG.max_expanded_players);const out={status:'PREVIEW_ONLY',riot_lcu_collection_requests_performed:0,checkpoint_written:false,checkpoint_matches:k.matches,target_checkpoint_matches:CFG.max_total_accepted_matches,selected_count:top.length,mature_network_first:true,candidates:top.map((x,i)=>({candidate:'Candidate '+String(i+1).padStart(2,'0'),source_pool:x.source_pool,observations:x.current_observation_count,expected_headroom:x.expected_new_headroom,network_overlap:x.existing_network_overlap,mature_neighbor_ratio:x.mature_neighbor_ratio,ten_plus_neighbor_ratio:x.ten_plus_neighbor_ratio,no_cold_start_potential:x.no_cold_start_potential,new_player_explosion_penalty:x.new_player_explosion_penalty,mature_priority:x.b4_priority}))};console.table(out.candidates);console.log('[ARAM Rating v0.3.2] B4 PREVIEW ONLY',out);return out}
  async function runB4(options={}){
    if(options.confirm!==CONFIRM)throw new Error("explicit_confirmation_required: runB4({confirm:'B4-MATURE-NETWORK-2000'})");
    if(globalThis[LOCK])return{status:'already_running'};if(!window.aramDesktop?.getAramMatchHistory)throw new Error('desktop_match_history_bridge_unavailable');
    globalThis[LOCK]=true;runtime={abort:false,requests:0,started:Date.now()};
    try{
      const C=core(),cp=assertCp(await readCp(),C),beforeNow=summary(C,cp,'before_b4_v032');
      if(beforeNow.checkpoint_matches>=CFG.max_total_accepted_matches)return{status:'hard_cap_reached',before:beforeNow,after:beforeNow,delta:C.delta(beforeNow,beforeNow)};
      cp.phase='B4';cp.sampling_version=VERSION;cp.sampling_profile=CFG.sampling_profile;cp.completed_puuids_b4_v032=Array.isArray(cp.completed_puuids_b4_v032)?cp.completed_puuids_b4_v032:[];cp.expansion_logs_b4_v032=Array.isArray(cp.expansion_logs_b4_v032)?cp.expansion_logs_b4_v032:[];cp.b4_v032_before=cp.b4_v032_before||beforeNow;cp.status='b4_v032_collecting';await writeCp(cp);let expanded=0;
      while(cp.completed_puuids_b4_v032.length<CFG.max_expanded_players){
        if(runtime.abort){cp.status='manual_abort';break}
        if(Date.now()-runtime.started>CFG.overall_timeout_ms){cp.status='overall_timeout';break}
        if(C.kpis(cp.matches||[]).matches>=CFG.max_total_accepted_matches){cp.status='hard_cap_reached';break}
        const pool=C.buildMatureCandidatePool(cp,CFG);if(!pool.length){cp.status='candidate_pool_exhausted';break}
        const f=pool[0];let merged=null,err='',attempts=0;
        for(let a=0;a<=CFG.retry_limit;a++){
          attempts=a+1;
          try{
            const r=await request({limit:CFG.max_matches_per_player,scan:CFG.scan,target:{puuid:f.puuid},queueMode:'standard',priority:'background'});
            if(r?.connected===false)throw new Error('league_client_unavailable');
            const rows=C.dedupeMatches(r?.matches||[]).slice(0,CFG.max_matches_per_player);
            merged=C.mergeExpansion(cp.matches||[],rows,f.puuid);
            if(!merged.valid.length)throw new Error('empty_target_history');
            if(!merged.target_hits)throw new Error('returned_history_does_not_match_target_puuid');
            break;
          }catch(e){err=String(e?.message||e);if(a<CFG.retry_limit)await sleep(CFG.cooldown_ms*Math.pow(2,a))}
        }
        if(!merged){cp.expansion_logs_b4_v032.push({source_pool:f.source_pool,observations:f.current_observation_count,requests:attempts,new_unique_matches:0,error:err});cp.completed_puuids_b4_v032.push(f.puuid);await writeCp(cp);continue}
        const room=Math.max(0,CFG.max_total_accepted_matches-C.kpis(cp.matches||[]).matches),accepted=merged.new_matches.slice(0,room),m=C.mergeExpansion(cp.matches||[],accepted,f.puuid);
        cp.matches=C.dedupeMatches([...(cp.matches||[]),...accepted]);cp.completed_puuids_b4_v032.push(f.puuid);cp.expansion_logs_b4_v032.push({source_pool:f.source_pool,observations:f.current_observation_count,mature_neighbor_ratio:f.mature_neighbor_ratio,ten_plus_neighbor_ratio:f.ten_plus_neighbor_ratio,no_cold_start_potential:f.no_cold_start_potential,requests:attempts,new_unique_matches:accepted.length,duplicates:merged.duplicates.length,new_players:m.new_players,known_player_appearances:m.already_known_player_appearances,threshold_crossings:m.threshold_crossings,density_gain:m.density_gain,information_gain:m.information_gain});expanded++;await writeCp(cp);
        const now=summary(C,cp,'progress');console.log(`[ARAM Rating v0.3.2] B4 ${cp.completed_puuids_b4_v032.length}/${CFG.max_expanded_players} · +${accepted.length} · accepted ${now.checkpoint_matches}/${CFG.max_total_accepted_matches} · 5+ ${now.players_5_plus} · 10+ ${now.players_10_plus} · 20+ ${now.players_20_plus} · single ${(100*now.single_match_fraction).toFixed(2)}%`);
        if(now.checkpoint_matches>=CFG.max_total_accepted_matches){cp.status='hard_cap_reached';break}
        await sleep(CFG.cooldown_ms);
      }
      if(cp.status==='b4_v032_collecting')cp.status=cp.completed_puuids_b4_v032.length>=CFG.max_expanded_players?'phase_complete':'paused';
      const after=summary(C,cp,'after_b4_v032');cp.b4_v032_final=after;cp.b4_v032_delta=C.delta(cp.b4_v032_before,after);await writeCp(cp);
      const out={status:cp.status,expanded_this_run:expanded,requests_this_run:runtime.requests,before:cp.b4_v032_before,after,delta:cp.b4_v032_delta,privacy:{contains_raw_puuid:false,contains_riot_id:false},production_changed:false};console.log('[ARAM Rating v0.3.2] B4 stopped',out);return out;
    }finally{runtime=null;delete globalThis[LOCK]}
  }
  function abort(){if(runtime)runtime.abort=true;return!!runtime}
  async function status(){const C=core(),cp=assertCp(await readCp(),C);return{...summary(C,cp,'current'),status:cp.status||null,automatic_collection:false}}
  window.aramRatingB4V032={version:VERSION,config:{...CFG},preview,runB4,abort,status,confirmation:CONFIRM};
  console.log('[ARAM Rating v0.3.2] B4 manual helper ready. NO Riot/LCU collection request has started.');
})();
