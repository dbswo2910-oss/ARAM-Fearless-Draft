'use strict';
(()=>{
  const VERSION='v0.3.2',PHASE='B5.1-R6';
  const DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const CONTRACT=Object.freeze({
    purpose:'read-only forensic of the preserved legacy B5.1 checkpoint logs',
    riot_lcu_requests:0,
    checkpoint_access:'readonly',
    checkpoint_written:false,
    storage_mutation:false,
    exposes_raw_puuid:false,
    automatic_invocation:false
  });

  function openExistingReadonly(){
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB);let upgrading=false;
      request.onupgradeneeded=()=>{upgrading=true;try{request.transaction.abort()}catch{};reject(new Error('research_db_missing_refusing_to_create'))};
      request.onsuccess=()=>{if(upgrading)return;const db=request.result;if(!db.objectStoreNames.contains(STORE)){db.close();return reject(new Error('research_store_missing'))}resolve(db)};
      request.onerror=()=>{if(!upgrading)reject(request.error||new Error('research_db_open_failed'))};
    });
  }
  async function readCheckpointReadonly(){
    const db=await openExistingReadonly();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).get(KEY);
      request.onsuccess=()=>{db.close();resolve(request.result??null)};
      request.onerror=()=>{db.close();reject(request.error||new Error('research_checkpoint_read_failed'))};
    });
  }
  function fingerprint(value){
    const text=JSON.stringify(value??null);let h=2166136261;
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
    return{hash:'fnv1a32:'+h.toString(16).padStart(8,'0'),chars:text.length,matches:Array.isArray(value?.matches)?value.matches.length:null,schema:value?.schema||null};
  }
  function same(a,b){return!!a&&!!b&&a.hash===b.hash&&a.chars===b.chars&&a.matches===b.matches&&a.schema===b.schema}
  function errorClass(value){
    const s=String(value||'').toLowerCase();
    if(!s)return'NONE';
    if(/(?:->|status\s*[:=]?|http\s*)\s*400\b/.test(s)||/\b400\b/.test(s))return'HTTP_400';
    if(s.includes('request_timeout'))return'REQUEST_TIMEOUT';
    if(s.includes('league_client_unavailable'))return'LCU_UNAVAILABLE';
    if(s.includes('empty_target_history'))return'EMPTY_TARGET_HISTORY';
    if(s.includes('returned_history_does_not_match_target_puuid'))return'TARGET_MISMATCH';
    if(s.includes('max_request_count'))return'MAX_REQUEST_COUNT';
    return'OTHER_ERROR';
  }
  function summarize(cp){
    if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');
    const queue=Array.isArray(cp.b51_v032_queue)?cp.b51_v032_queue:[];
    const logs=Array.isArray(cp.expansion_logs_b51_v032)?cp.expansion_logs_b51_v032:[];
    const completed=Array.isArray(cp.completed_puuids_b51_v032)?cp.completed_puuids_b51_v032:[];
    const completedSet=new Set(completed);
    const rows=logs.map((x,i)=>{
      const q=queue.find(q=>Number(q?.anchor_rank)===Number(x?.anchor_rank));
      const err=errorClass(x?.error);
      return{
        log_index:i+1,
        anchor_rank:Number.isFinite(Number(x?.anchor_rank))?Number(x.anchor_rank):null,
        requests:Number.isFinite(Number(x?.requests))?Number(x.requests):0,
        new_unique_matches:Number.isFinite(Number(x?.new_unique_matches))?Number(x.new_unique_matches):0,
        error_class:err,
        failed:err!=='NONE',
        marked_completed:!!q&&completedSet.has(q.puuid)
      };
    });
    const errorCounts={};for(const r of rows)errorCounts[r.error_class]=(errorCounts[r.error_class]||0)+1;
    const failed=rows.filter(r=>r.failed),success=rows.filter(r=>!r.failed&&r.new_unique_matches>0);
    const totalRequests=rows.reduce((a,r)=>a+r.requests,0);
    const failedMarkedCompleted=failed.filter(r=>r.marked_completed).length;
    let classification='LEGACY_LOGS_PARTIAL_OR_MIXED';
    if(rows.length===15&&failed.length===15&&totalRequests===45&&failed.every(r=>r.requests===3))classification='LEGACY_ALL_15_FAILED_THREE_ATTEMPTS';
    else if(failed.length===rows.length&&rows.length>0)classification='LEGACY_ALL_LOGGED_TARGETS_FAILED';
    else if(failed.length>0&&success.length>0)classification='LEGACY_MIXED_SUCCESS_FAILURE';
    else if(success.length>0&&failed.length===0)classification='LEGACY_LOGS_ALL_SUCCESS';
    else if(rows.length===0)classification='NO_LEGACY_B51_EXPANSION_LOGS';
    return{
      phase:PHASE,version:VERSION,mode:'READ_ONLY_CHECKPOINT_FORENSIC',contract:CONTRACT,classification,
      checkpoint_status:cp.status||null,sampling_profile:cp.sampling_profile||null,
      checkpoint_matches:Array.isArray(cp.matches)?cp.matches.length:null,
      queue:{selected:queue.length,completed_unique:new Set(completed).size,completed_entries:completed.length},
      logs:{count:rows.length,total_requests_logged:totalRequests,failed:failed.length,successful_with_new_matches:success.length,failed_marked_completed:failedMarkedCompleted,error_counts:errorCounts,rows},
      repair_signal:{failed_targets_were_marked_completed:failedMarkedCompleted>0,legacy_runner_should_not_mark_transient_failures_completed:failedMarkedCompleted>0},
      privacy:{contains_raw_puuid:false,contains_riot_id:false}
    };
  }
  async function inspect(){
    const beforeCp=await readCheckpointReadonly(),before=fingerprint(beforeCp),report=summarize(beforeCp),after=fingerprint(await readCheckpointReadonly());
    report.checkpoint_integrity=same(before,after);report.checkpoint={before,after};
    console.table(report.logs.rows);
    console.log('[ARAM Rating v0.3.2] B5.1 R6 checkpoint forensic · ZERO Riot/LCU requests · read-only',report);
    return report;
  }
  window.aramRatingB51R6V032=Object.freeze({version:VERSION,phase:PHASE,contract:CONTRACT,inspect});
  console.log('[ARAM Rating v0.3.2] B5.1 R6 checkpoint forensic ready. ZERO Riot/LCU requests. Run await window.aramRatingB51R6V032.inspect() to inspect preserved legacy B5.1 logs read-only.');
})();
