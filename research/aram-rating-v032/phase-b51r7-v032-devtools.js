'use strict';
(()=>{
  const VERSION='v0.3.2',PHASE='B5.1-R7';
  const DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const CONTRACT=Object.freeze({purpose:'read-only repair preview for legacy B5.1 HTTP400 false-completions',riot_lcu_requests:0,checkpoint_access:'readonly',checkpoint_written:false,storage_mutation:false,automatic_invocation:false,exposes_raw_puuid:false});
  function openExistingReadonly(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB);let upgrading=false;request.onupgradeneeded=()=>{upgrading=true;try{request.transaction.abort()}catch{};reject(new Error('research_db_missing_refusing_to_create'))};request.onsuccess=()=>{if(upgrading)return;const db=request.result;if(!db.objectStoreNames.contains(STORE)){db.close();return reject(new Error('research_store_missing'))}resolve(db)};request.onerror=()=>{if(!upgrading)reject(request.error||new Error('research_db_open_failed'))}})}
  async function readCheckpointReadonly(){const db=await openExistingReadonly();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).get(KEY);request.onsuccess=()=>{db.close();resolve(request.result??null)};request.onerror=()=>{db.close();reject(request.error||new Error('research_checkpoint_read_failed'))}})}
  function fingerprint(value){const text=JSON.stringify(value??null);let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return{hash:'fnv1a32:'+h.toString(16).padStart(8,'0'),chars:text.length}}
  function same(a,b){return!!a&&!!b&&a.hash===b.hash&&a.chars===b.chars}
  function errorClass(value){const s=String(value||'').toLowerCase();if(!s)return'NONE';if(/(?:->|status\s*[:=]?|http\s*)\s*400\b/.test(s)||/\b400\b/.test(s))return'HTTP_400';return'OTHER'}
  function analyze(cp){
    if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');
    const queue=Array.isArray(cp.b51_v032_queue)?cp.b51_v032_queue:[],logs=Array.isArray(cp.expansion_logs_b51_v032)?cp.expansion_logs_b51_v032:[],completed=Array.isArray(cp.completed_puuids_b51_v032)?cp.completed_puuids_b51_v032:[];
    const failedRanks=new Set(logs.filter(x=>errorClass(x?.error)==='HTTP_400'&&Number(x?.new_unique_matches||0)===0).map(x=>Number(x?.anchor_rank)).filter(Number.isFinite));
    const candidates=queue.filter(x=>failedRanks.has(Number(x?.anchor_rank))&&completed.includes(x.puuid));
    const completedAfter=completed.filter(p=>!new Set(candidates.map(x=>x.puuid)).has(p));
    const classification=candidates.length===15?'REPAIR_PREVIEW_15_HTTP400_FALSE_COMPLETIONS':candidates.length>0?'REPAIR_PREVIEW_PARTIAL_HTTP400_FALSE_COMPLETIONS':'REPAIR_PREVIEW_NOTHING_TO_REQUEUE';
    return{phase:PHASE,version:VERSION,mode:'READ_ONLY_REPAIR_PREVIEW',contract:CONTRACT,classification,checkpoint_status:cp.status||null,checkpoint_matches:Array.isArray(cp.matches)?cp.matches.length:null,queue:{selected:queue.length,completed_before:new Set(completed).size,would_requeue:candidates.length,completed_after_preview:new Set(completedAfter).size,remaining_after_preview:queue.filter(x=>!completedAfter.includes(x.puuid)).length},legacy_logs:{count:logs.length,http400_zero_yield:logs.filter(x=>errorClass(x?.error)==='HTTP_400'&&Number(x?.new_unique_matches||0)===0).length},repair:{would_change_completion_state:candidates.length>0,would_change_matches:false,would_request_riot_lcu:false},privacy:{contains_raw_puuid:false,contains_riot_id:false}};
  }
  async function preview(){const cp1=await readCheckpointReadonly(),before=fingerprint(cp1),matchBefore=fingerprint(cp1?.matches||[]),report=analyze(cp1),cp2=await readCheckpointReadonly(),after=fingerprint(cp2),matchAfter=fingerprint(cp2?.matches||[]);report.checkpoint_integrity=same(before,after);report.match_data_integrity=same(matchBefore,matchAfter);console.log('[ARAM Rating v0.3.2] B5.1 R7 repair preview · ZERO Riot/LCU requests · ZERO writes',report);return report}
  window.aramRatingB51R7V032=Object.freeze({version:VERSION,phase:PHASE,contract:CONTRACT,preview});
  console.log('[ARAM Rating v0.3.2] B5.1 R7 repair preview ready. ZERO Riot/LCU requests and ZERO writes. Run await window.aramRatingB51R7V032.preview().');
})();
