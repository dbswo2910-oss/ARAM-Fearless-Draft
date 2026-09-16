'use strict';
(()=>{
  const VERSION='v0.3.2',DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const LOCK='__ARAM_RATING_PHASE_B51_V032_RUNNING__',CONFIRM='B51-EVIDENCE-FIRST-CLOSED-2200';
  const CFG=Object.freeze({phase:'B5.1',sampling_profile:'B51_MATCH_LEVEL_EVIDENCE_FIRST_CLOSED_2200',max_expanded_players:15,max_matches_per_player:20,max_total_accepted_matches:2200,max_requests:45,request_timeout_ms:15000,retry_limit:2,cooldown_ms:1800,overall_timeout_ms:1800000,scan:100,history_limit:50,min_train_observations:5,min_heldout_matches:1,full_evidence_matches:5,min_evidence_tier:2,min_resume_matches:1900,fixed_anchor_queue:true,dynamic_rerank:false,automatic_collection:false});
  let runtime=null;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function core(){const c=globalThis.ARAMRatingB51MatchLevelClosedCoreV032;if(!c)throw new Error('B51_core_not_loaded_run_preview_loader_first');return c}
  function openExisting(){return new Promise((res,rej)=>{const q=indexedDB.open(DB);let upgrading=false;q.onupgradeneeded=()=>{upgrading=true;try{q.transaction.abort()}catch{};rej(new Error('research_db_missing_refusing_to_create'))};q.onsuccess=()=>{if(upgrading)return;const db=q.result;if(!db.objectStoreNames.contains(STORE)){db.close();return rej(new Error('research_store_missing'))}res(db)};q.onerror=()=>{if(!upgrading)rej(q.error||new Error('research_db_open_failed'))}})}
  async function readCp(){const db=await openExisting();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(KEY);r.onsuccess=()=>{db.close();res(r.result??null)};r.onerror=()=>{db.close();rej(r.error)}})}
  async function writeCp(cp){const db=await openExisting();return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(cp,KEY);tx.oncomplete=()=>{db.close();res()};tx.onerror=()=>{db.close();rej(tx.error)}})}
  function assertCp(cp,C){if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');const n=C.dedupeMatches(cp.matches||[]).length;if(n<CFG.min_resume_matches)throw new Error('b51_requires_existing_checkpoint_1900_plus_matches_current_'+n);return cp}
  function countAtLeast(C,cp,n){let c=0;for(const v of C.networkState(cp.matches||[]).counts.values())if(v>=n)c++;return c}
  function evidenceTiers(rows){const out={tier3_closed10:0,tier2_exact9:0,tier1_exact8:0,tier0_other:0};for(const x of rows||[]){if(x.evidence_tier===3)out.tier3_closed10++;else if(x.evidence_tier===2)out.tier2_exact9++;else if(x.evidence_tier===1)out.tier1_exact8++;else out.tier0_other++}return out}
  function queueProgress(cp){const q=Array.isArray(cp.b51_v032_queue)?cp.b51_v032_queue:[],done=new Set(cp.completed_puuids_b51_v032||[]),skipped=new Set(cp.skipped_puuids_b51_v032||[]);return{selected:q.length,completed:q.filter(x=>done.has(x.puuid)).length,skipped:q.filter(x=>skipped.has(x.puuid)).length,remaining:q.filter(x=>!done.has(x.puuid)&&!skipped.has(x.puuid)).length,evidence_tiers:evidenceTiers(q)}}
  function summary(C,cp,label){const k=C.kpis(cp.matches||[]),cov=C.currentNoColdCoverage(cp.matches||[]),q=queueProgress(cp);return{label,checkpoint_matches:k.matches,players:k.players,single_match_fraction:k.single_match_fraction,players_2_plus:k.players_2_plus,players_5_plus:k.players_5_plus,players_10_plus:k.players_10_plus,players_20_plus:countAtLeast(C,cp,20),connected_components:k.connected_components,giant_component_ratio:k.giant_component_ratio,no_cold_test_matches:cov.no_cold_test_matches,no_cold_test_fraction:cov.no_cold_test_fraction,cold_start_distribution:cov.cold_start_distribution,queue_selected:q.selected,queue_completed:q.completed,queue_skipped:q.skipped,queue_remaining:q.remaining,queue_evidence_tiers:q.evidence_tiers}}
  function timed(p,ms){let t;return Promise.race([Promise.resolve(p).finally(()=>clearTimeout(t)),new Promise((_,rej)=>{t=setTimeout(()=>rej(new Error('request_timeout')),ms)})])}
  async function request(opts){if(runtime?.abort)throw new Error('manual_abort');if(runtime.requests>=CFG.max_requests)throw new Error('max_request_count');runtime.requests++;return timed(window.aramDesktop.getAramMatchHistory(opts),CFG.request_timeout_ms)}
  function makeQueue(C,cp){
    if(Array.isArray(cp.b51_v032_queue)&&cp.b51_v032_queue.length){if(cp.b51_v032_queue_profile!==CFG.sampling_profile)throw new Error('b51_existing_queue_profile_mismatch');return cp.b51_v032_queue}
    const pool=C.buildMatchLevelCandidatePool(cp,CFG).filter(x=>x.evidence_tier>=CFG.min_evidence_tier),selected=pool.slice(0,CFG.max_expanded_players);
    if(!selected.length)throw new Error('b51_no_tier2_plus_candidates');
    cp.b51_v032_queue=selected.map((x,i)=>({puuid:x.puuid,anchor_rank:i+1,source_pool:x.source_pool,evidence_tier:x.evidence_tier,evidence_support:x.evidence_support,heldout_matches:x.heldout_matches,closed_10_of_10_matches:x.closed_10_of_10_matches,exact_9_of_10_matches:x.exact_9_of_10_matches,exact_8_of_10_matches:x.exact_8_of_10_matches,closed_10_of_10_ratio:x.closed_10_of_10_ratio,exact_9_of_10_ratio:x.exact_9_of_10_ratio,exact_8_of_10_ratio:x.exact_8_of_10_ratio,avg_known_participants:x.avg_known_participants,closed_10_of_10_wilson_lower:x.closed_10_of_10_wilson_lower,direct_no_cold_yield_proxy:x.direct_no_cold_yield_proxy}));
    cp.b51_v032_queue_profile=CFG.sampling_profile;cp.b51_v032_queue_created_at=new Date().toISOString();cp.b51_v032_queue_anchor_matches=C.dedupeMatches(cp.matches||[]).length;return cp.b51_v032_queue;
  }
  function liveYield(C,rows,beforeCounts){const p=(rows||[]).map(g=>C.matchKnownProfile(g,beforeCounts)),n=p.length,c10=p.filter(x=>x.is_10_of_10).length,c9p=p.filter(x=>x.is_9_plus).length,c8p=p.filter(x=>x.is_8_plus).length;return{matches:n,closed_10_of_10_matches:c10,nine_plus_matches:c9p,eight_plus_matches:c8p,closed_10_of_10_ratio:n?c10/n:0,nine_plus_ratio:n?c9p/n:0,eight_plus_ratio:n?c8p/n:0,avg_known_participants:n?p.reduce((a,x)=>a+x.known_participants,0)/n:0,avg_known_5plus_participants:n?p.reduce((a,x)=>a+x.known_5plus_participants,0)/n:0}}
  function errorClass(value){const s=String(value||'').toLowerCase();if(!s)return'NONE';if(/(?:->|status\s*[:=]?|http\s*)\s*400\b/.test(s)||/\b400\b/.test(s))return'HTTP_400';if(s.includes('request_timeout'))return'REQUEST_TIMEOUT';if(s.includes('league_client_unavailable'))return'LCU_UNAVAILABLE';if(s.includes('empty_target_history'))return'EMPTY_TARGET_HISTORY';if(s.includes('returned_history_does_not_match_target_puuid'))return'TARGET_MISMATCH';if(s.includes('max_request_count'))return'MAX_REQUEST_COUNT';if(s.includes('manual_abort'))return'MANUAL_ABORT';return'OTHER_ERROR'}
  function isTerminalTargetError(cls){return cls==='EMPTY_TARGET_HISTORY'||cls==='TARGET_MISMATCH'}
  function repairLegacyHttp400Completions(cp){
    const q=Array.isArray(cp.b51_v032_queue)?cp.b51_v032_queue:[],logs=Array.isArray(cp.expansion_logs_b51_v032)?cp.expansion_logs_b51_v032:[],completed=Array.isArray(cp.completed_puuids_b51_v032)?cp.completed_puuids_b51_v032:[];
    const failedRanks=new Set(logs.filter(x=>errorClass(x?.error)==='HTTP_400'&&Number(x?.new_unique_matches||0)===0).map(x=>Number(x?.anchor_rank)).filter(Number.isFinite));
    if(!failedRanks.size)return{requeued:0,changed:false};
    const failedPuuids=new Set(q.filter(x=>failedRanks.has(Number(x?.anchor_rank))).map(x=>x.puuid).filter(Boolean));
    const next=completed.filter(p=>!failedPuuids.has(p)),removed=completed.length-next.length;
    if(!removed)return{requeued:0,changed:false};
    cp.completed_puuids_b51_v032=next;
    cp.b51_v032_repair_history=Array.isArray(cp.b51_v032_repair_history)?cp.b51_v032_repair_history:[];
    cp.b51_v032_repair_history.push({repair:'R6_HTTP400_FALSE_COMPLETION_REQUEUE',at:new Date().toISOString(),requeued:removed,match_count_unchanged:Array.isArray(cp.matches)?cp.matches.length:null});
    return{requeued:removed,changed:true};
  }
  async function preview(){const C=core(),cp=assertCp(await readCp(),C),pool=C.buildMatchLevelCandidatePool(cp,CFG).filter(x=>x.evidence_tier>=CFG.min_evidence_tier),top=pool.slice(0,CFG.max_expanded_players);const out={status:'PREVIEW_ONLY',sampling_profile:CFG.sampling_profile,riot_lcu_collection_requests_performed:0,checkpoint_written:false,checkpoint_matches:C.dedupeMatches(cp.matches||[]).length,target_checkpoint_matches:CFG.max_total_accepted_matches,selected_count:top.length,min_evidence_tier:CFG.min_evidence_tier,fixed_anchor_queue:true,evidence_tiers:evidenceTiers(top),candidates:top.map((x,i)=>({candidate:'Candidate '+String(i+1).padStart(2,'0'),anchor_rank:i+1,source_pool:x.source_pool,evidence_tier:x.evidence_tier,evidence_support:x.evidence_support,heldout_matches:x.heldout_matches,closed_10_of_10_matches:x.closed_10_of_10_matches,ratio_10_of_10:x.closed_10_of_10_ratio,ratio_exact_9_of_10:x.exact_9_of_10_ratio,avg_known_participants:x.avg_known_participants,closed_10_of_10_wilson_lower:x.closed_10_of_10_wilson_lower,direct_no_cold_yield_proxy:x.direct_no_cold_yield_proxy}))};console.table(out.candidates);console.log('[ARAM Rating v0.3.2] B5.1 RUNNER PREVIEW ONLY · no Riot/LCU collection request',out);return out}
  async function runB51(options={}){
    if(options.confirm!==CONFIRM)throw new Error("explicit_confirmation_required: runB51({confirm:'B51-EVIDENCE-FIRST-CLOSED-2200'})");
    if(globalThis[LOCK])return{status:'already_running'};if(!window.aramDesktop?.getAramMatchHistory)throw new Error('desktop_match_history_bridge_unavailable');
    globalThis[LOCK]=true;runtime={abort:false,requests:0,started:Date.now()};
    try{
      const C=core(),cp=assertCp(await readCp(),C);cp.completed_puuids_b51_v032=Array.isArray(cp.completed_puuids_b51_v032)?cp.completed_puuids_b51_v032:[];cp.skipped_puuids_b51_v032=Array.isArray(cp.skipped_puuids_b51_v032)?cp.skipped_puuids_b51_v032:[];cp.expansion_logs_b51_v032=Array.isArray(cp.expansion_logs_b51_v032)?cp.expansion_logs_b51_v032:[];makeQueue(C,cp);
      const repair=repairLegacyHttp400Completions(cp),beforeNow=summary(C,cp,'before_b51_v032');cp.phase='B5.1';cp.sampling_version=VERSION;cp.sampling_profile=CFG.sampling_profile;cp.b51_v032_before=cp.b51_v032_before||beforeNow;cp.status='b51_v032_collecting';await writeCp(cp);
      if(beforeNow.checkpoint_matches>=CFG.max_total_accepted_matches){cp.status='hard_cap_reached';cp.b51_v032_final=beforeNow;await writeCp(cp);return{status:cp.status,expanded_this_run:0,requests_this_run:0,repair,before:cp.b51_v032_before,after:beforeNow,privacy:{contains_raw_puuid:false,contains_riot_id:false},production_changed:false}}
      let expanded=0;
      while(true){
        if(runtime.abort){cp.status='manual_abort';break}
        if(Date.now()-runtime.started>CFG.overall_timeout_ms){cp.status='overall_timeout';break}
        if(C.kpis(cp.matches||[]).matches>=CFG.max_total_accepted_matches){cp.status='hard_cap_reached';break}
        const done=new Set(cp.completed_puuids_b51_v032||[]),skipped=new Set(cp.skipped_puuids_b51_v032||[]),f=(cp.b51_v032_queue||[]).find(x=>!done.has(x.puuid)&&!skipped.has(x.puuid));if(!f){cp.status='phase_complete';break}
        let merged=null,err='',attempts=0;
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
        if(!merged){
          const cls=errorClass(err);cp.expansion_logs_b51_v032.push({anchor_rank:f.anchor_rank,source_pool:f.source_pool,evidence_tier:f.evidence_tier,heldout_matches:f.heldout_matches,closed_10_of_10_matches:f.closed_10_of_10_matches,requests:attempts,new_unique_matches:0,error:err,error_class:cls});
          if(isTerminalTargetError(cls)){cp.skipped_puuids_b51_v032.push(f.puuid);cp.status='b51_v032_collecting';await writeCp(cp);continue}
          cp.status='transient_failure_paused';cp.b51_v032_last_transient_failure={anchor_rank:f.anchor_rank,error_class:cls,requests:attempts,at:new Date().toISOString()};await writeCp(cp);break;
        }
        const room=Math.max(0,CFG.max_total_accepted_matches-C.kpis(cp.matches||[]).matches),accepted=merged.new_matches.slice(0,room),beforeCounts=C.networkState(cp.matches||[]).counts,yieldStats=liveYield(C,accepted,beforeCounts),m=C.mergeExpansion(cp.matches||[],accepted,f.puuid);
        cp.matches=C.dedupeMatches([...(cp.matches||[]),...accepted]);cp.completed_puuids_b51_v032.push(f.puuid);cp.expansion_logs_b51_v032.push({anchor_rank:f.anchor_rank,source_pool:f.source_pool,evidence_tier:f.evidence_tier,evidence_support:f.evidence_support,heldout_matches:f.heldout_matches,closed_10_of_10_matches:f.closed_10_of_10_matches,ratio_10_of_10:f.closed_10_of_10_ratio,ratio_exact_9_of_10:f.exact_9_of_10_ratio,closed_10_of_10_wilson_lower:f.closed_10_of_10_wilson_lower,direct_no_cold_yield_proxy:f.direct_no_cold_yield_proxy,requests:attempts,new_unique_matches:accepted.length,duplicates:merged.duplicates.length,new_players:m.new_players,known_player_appearances:m.already_known_player_appearances,threshold_crossings:m.threshold_crossings,density_gain:m.density_gain,information_gain:m.information_gain,live_closed_yield:yieldStats});expanded++;await writeCp(cp);
        const now=summary(C,cp,'progress');console.log(`[ARAM Rating v0.3.2] B5.1 ${now.queue_completed}/${now.queue_selected} · skipped ${now.queue_skipped} · tier ${f.evidence_tier} · +${accepted.length} · live 10/10 ${yieldStats.closed_10_of_10_matches}/${yieldStats.matches} · accepted ${now.checkpoint_matches}/${CFG.max_total_accepted_matches} · no-cold ${(100*now.no_cold_test_fraction).toFixed(2)}%`);
        if(now.checkpoint_matches>=CFG.max_total_accepted_matches){cp.status='hard_cap_reached';break}
        await sleep(CFG.cooldown_ms);
      }
      if(cp.status==='b51_v032_collecting')cp.status='paused';
      const after=summary(C,cp,'after_b51_v032');cp.b51_v032_final=after;cp.b51_v032_delta=C.delta(cp.b51_v032_before,after);await writeCp(cp);
      const out={status:cp.status,expanded_this_run:expanded,requests_this_run:runtime.requests,repair,before:cp.b51_v032_before,after,delta:cp.b51_v032_delta,queue:queueProgress(cp),last_transient_failure:cp.b51_v032_last_transient_failure||null,privacy:{contains_raw_puuid:false,contains_riot_id:false},production_changed:false};console.log('[ARAM Rating v0.3.2] B5.1 stopped',out);return out;
    }finally{runtime=null;delete globalThis[LOCK]}
  }
  function abort(){if(runtime)runtime.abort=true;return!!runtime}
  async function status(){const C=core(),cp=assertCp(await readCp(),C);return{...summary(C,cp,'current'),status:cp.status||null,sampling_profile:cp.sampling_profile||null,automatic_collection:false,last_transient_failure:cp.b51_v032_last_transient_failure||null}}
  window.aramRatingB51V032={version:VERSION,config:{...CFG},preview,runB51,abort,status,confirmation:CONFIRM};
  console.log('[ARAM Rating v0.3.2] B5.1 manual evidence-first runner ready. Legacy HTTP 400 false-completions are requeued only after explicit run confirmation; transient failures pause without marking the target complete. NO Riot/LCU collection request has started.');
})();
