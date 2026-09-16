'use strict';
(()=>{
  const VERSION='v0.3.2',PHASE='B5.1-R8',CONFIRM='B51R8-REPAIR-FALSE-COMPLETIONS-15';
  const DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const state={consumed:false,inFlight:false,lastResult:null};
  const CONTRACT=Object.freeze({
    purpose:'one-shot checkpoint repair for the 15 preserved legacy B5.1 HTTP400 false-completions',
    riot_lcu_requests:0,
    expected_false_completions:15,
    expected_legacy_attempts_per_target:3,
    checkpoint_write:'completion-state-only plus repair metadata',
    match_data_write:false,
    automatic_invocation:false,
    retry:false,
    rollback_on_postcondition_failure:true,
    exposes_raw_puuid:false
  });

  function openExisting(){
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB);let upgrading=false;
      request.onupgradeneeded=()=>{upgrading=true;try{request.transaction.abort()}catch{};reject(new Error('research_db_missing_refusing_to_create'))};
      request.onsuccess=()=>{if(upgrading)return;const db=request.result;if(!db.objectStoreNames.contains(STORE)){db.close();return reject(new Error('research_store_missing'))}resolve(db)};
      request.onerror=()=>{if(!upgrading)reject(request.error||new Error('research_db_open_failed'))};
    });
  }
  async function readCheckpoint(){
    const db=await openExisting();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).get(KEY);
      request.onsuccess=()=>{db.close();resolve(request.result??null)};
      request.onerror=()=>{db.close();reject(request.error||new Error('research_checkpoint_read_failed'))};
    });
  }
  async function writeCheckpoint(cp){
    const db=await openExisting();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(cp,KEY);
      tx.oncomplete=()=>{db.close();resolve()};
      tx.onerror=()=>{db.close();reject(tx.error||new Error('research_checkpoint_write_failed'))};
      tx.onabort=()=>{db.close();reject(tx.error||new Error('research_checkpoint_write_aborted'))};
    });
  }
  function fingerprint(value){
    const text=JSON.stringify(value??null);let h=2166136261;
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
    return{hash:'fnv1a32:'+h.toString(16).padStart(8,'0'),chars:text.length};
  }
  function same(a,b){return!!a&&!!b&&a.hash===b.hash&&a.chars===b.chars}
  function clone(value){return JSON.parse(JSON.stringify(value))}
  function errorClass(value){
    const s=String(value||'').toLowerCase();
    if(!s)return'NONE';
    if(/(?:->|status\s*[:=]?|http\s*)\s*400\b/.test(s)||/\b400\b/.test(s))return'HTTP_400';
    return'OTHER';
  }
  function analyze(cp){
    if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');
    const queue=Array.isArray(cp.b51_v032_queue)?cp.b51_v032_queue:[];
    const logs=Array.isArray(cp.expansion_logs_b51_v032)?cp.expansion_logs_b51_v032:[];
    const completed=Array.isArray(cp.completed_puuids_b51_v032)?cp.completed_puuids_b51_v032:[];
    const badLogs=logs.filter(x=>errorClass(x?.error)==='HTTP_400'&&Number(x?.new_unique_matches||0)===0&&Number(x?.requests||0)===3);
    const failedRanks=new Set(badLogs.map(x=>Number(x?.anchor_rank)).filter(Number.isFinite));
    const candidates=queue.filter(x=>failedRanks.has(Number(x?.anchor_rank))&&completed.includes(x.puuid));
    return{queue,logs,completed,badLogs,candidates};
  }
  function summary(cp,a){
    return{
      checkpoint_status:cp.status||null,
      checkpoint_matches:Array.isArray(cp.matches)?cp.matches.length:null,
      queue_selected:a.queue.length,
      legacy_logs:a.logs.length,
      legacy_http400_three_attempt_zero_yield:a.badLogs.length,
      completed_before:new Set(a.completed).size,
      repair_candidates:a.candidates.length
    };
  }
  async function repair(options={}){
    if(options.token!==CONFIRM)return{phase:PHASE,version:VERSION,mode:'ONE_SHOT_COMPLETION_STATE_REPAIR',contract:CONTRACT,ok:false,refused:true,reason:'explicit_confirmation_required',expected_token:CONFIRM};
    if(state.consumed||state.inFlight)return{phase:PHASE,version:VERSION,mode:'ONE_SHOT_COMPLETION_STATE_REPAIR',contract:CONTRACT,ok:false,refused:true,reason:'repair_budget_consumed_reload_required'};
    state.consumed=true;state.inFlight=true;
    let result;
    try{
      const cp=await readCheckpoint(),original=clone(cp),before=fingerprint(cp),matchesBefore=fingerprint(cp?.matches||[]),a=analyze(cp),pre=summary(cp,a);
      if(a.queue.length!==15||a.logs.length!==15||a.badLogs.length!==15||a.candidates.length!==15){
        result={phase:PHASE,version:VERSION,mode:'ONE_SHOT_COMPLETION_STATE_REPAIR',contract:CONTRACT,ok:false,refused:true,reason:'exact_legacy_r6_precondition_not_met',pre,checkpoint_written:false};
        state.lastResult=result;return result;
      }
      const remove=new Set(a.candidates.map(x=>x.puuid));
      const repairedCompleted=a.completed.filter(p=>!remove.has(p));
      cp.b51_v032_r8_backup=cp.b51_v032_r8_backup||{created_at:new Date().toISOString(),checkpoint_fingerprint:before,match_fingerprint:matchesBefore,completed_puuids_b51_v032:[...a.completed],status:cp.status||null};
      cp.completed_puuids_b51_v032=repairedCompleted;
      cp.b51_v032_repair_history=Array.isArray(cp.b51_v032_repair_history)?cp.b51_v032_repair_history:[];
      cp.b51_v032_repair_history.push({repair:'R8_LEGACY_HTTP400_FALSE_COMPLETION_REQUEUE',at:new Date().toISOString(),requeued:15,match_count_unchanged:Array.isArray(cp.matches)?cp.matches.length:null});
      cp.b51_v032_repair_state={phase:'B5.1-R8',status:'completion_state_repaired_ready_for_bounded_recovery',requeued:15,at:new Date().toISOString()};
      cp.status='b51_v032_repaired_paused';
      await writeCheckpoint(cp);
      const afterCp=await readCheckpoint(),after=fingerprint(afterCp),matchesAfter=fingerprint(afterCp?.matches||[]),postA=analyze(afterCp);
      const matchDataIntegrity=same(matchesBefore,matchesAfter);
      const completionRepairIntegrity=postA.candidates.length===0&&new Set(postA.completed).size===new Set(repairedCompleted).size;
      if(!matchDataIntegrity||!completionRepairIntegrity){
        await writeCheckpoint(original);
        const rolled=await readCheckpoint();
        result={phase:PHASE,version:VERSION,mode:'ONE_SHOT_COMPLETION_STATE_REPAIR',contract:CONTRACT,ok:false,refused:false,classification:'R8_POSTCONDITION_FAILED_AUTO_ROLLED_BACK',checkpoint_written:true,rolled_back:true,match_data_integrity:matchDataIntegrity,completion_repair_integrity:completionRepairIntegrity,rollback_integrity:same(before,fingerprint(rolled)),pre};
        state.lastResult=result;return result;
      }
      result={phase:PHASE,version:VERSION,mode:'ONE_SHOT_COMPLETION_STATE_REPAIR',contract:CONTRACT,ok:true,refused:false,classification:'R8_REPAIRED_15_FALSE_COMPLETIONS',checkpoint_written:true,rolled_back:false,riot_lcu_requests_performed:0,requeued:15,completed_before:new Set(a.completed).size,completed_after:new Set(postA.completed).size,remaining_after_repair:postA.queue.filter(x=>!postA.completed.includes(x.puuid)&&(Array.isArray(afterCp.skipped_puuids_b51_v032)?!afterCp.skipped_puuids_b51_v032.includes(x.puuid):true)).length,match_data_integrity:matchDataIntegrity,completion_repair_integrity:completionRepairIntegrity,checkpoint_changed:!same(before,after),checkpoint_matches:Array.isArray(afterCp.matches)?afterCp.matches.length:null,privacy:{contains_raw_puuid:false,contains_riot_id:false}};
      state.lastResult=result;return result;
    }finally{state.inFlight=false}
  }
  function status(){return{phase:PHASE,version:VERSION,contract:CONTRACT,safety:{consumed:state.consumed,in_flight:state.inFlight},last_result:state.lastResult}}
  window.aramRatingB51R8V032=Object.freeze({version:VERSION,phase:PHASE,confirmation:CONFIRM,contract:CONTRACT,repair,status});
  console.log('[ARAM Rating v0.3.2] B5.1 R8 completion-state repair ready. ZERO Riot/LCU requests. This performs one explicit checkpoint write only after the exact 15x HTTP400/3-attempt R6 precondition is verified, preserves match data, stores rollback backup metadata, and auto-rolls back on postcondition failure.');
})();
