'use strict';
(()=>{
  const VERSION='v0.3.2',PHASE='B5.1-R3',CONFIRM='B51R3-LEGACY-SHAPE-ONE';
  const DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  // R2 proved the same checkpoint anchor can be queried with limit 1 / scan 20 / interactive.
  // R3 replays the ORIGINAL B5.1 request shape exactly once against that same first valid anchor.
  // This separates "legacy request shape" from "many targets / retries / long-running collection" without mutating Research state.
  const REQUEST=Object.freeze({limit:20,scan:100,queueMode:'standard',priority:'background'});
  const CONTRACT=Object.freeze({
    purpose:'one-shot exact legacy-shape replay after successful R2',
    r2_live_observation:'ONE_SHOT_ACCEPTED on first valid B5.1 queue anchor with limit 1 / scan 20 / interactive',
    renderer_bridge:'window.aramDesktop.getAramMatchHistory',
    ipc_channel:'match-history:load',
    main_handler:'core.getAramMatchHistory(opts||{})',
    concurrency_wrapper:'Core.prototype.getAramMatchHistory(opts) -> oldHistory.call(this,o)',
    identity_kind:'puuid',
    request_shape:'{limit:20,scan:100,target:{puuid},queueMode:"standard",priority:"background"}',
    legacy_b51_shape:'{limit:20,scan:100,target:{puuid},queueMode:"standard",priority:"background"}',
    known_good_r2_shape:'{limit:1,scan:20,target:{puuid},queueMode:"standard",priority:"interactive"}',
    request_budget:1,
    checkpoint_access:'readonly',
    checkpoint_written:false,
    storage_mutation:false,
    automatic_invocation:false,
    retry:false
  });
  const state={consumed:false,inFlight:false,requestsUsed:0,lastResult:null};

  function normalizePuuid(value){return typeof value==='string'?value.trim():''}
  function maskPuuid(value){const p=normalizePuuid(value);if(!p)return null;return p.length<=16?p.slice(0,4)+'…'+p.slice(-4):p.slice(0,8)+'…'+p.slice(-6)}
  function puuidLooksUsable(value){const p=normalizePuuid(value);return p.length>=32&&p.length<=128&&/^[A-Za-z0-9_-]+$/.test(p)}
  function redact(text,secret){let out=String(text??'');const s=normalizePuuid(secret);return s?out.split(s).join('[PUUID]'):out}
  function normalizeError(error,secret){
    const raw=String(error?.message||error||'unknown_error');
    const direct=Number(error?.status||error?.statusCode||error?.response?.status||0);
    const m=raw.match(/(?:->|status\s*[:=]?|http\s*)\s*(\d{3})\b/i);
    const status=direct>=100&&direct<=599?direct:(m?Number(m[1]):null);
    return{name:String(error?.name||'Error'),code:error?.code==null?null:String(error.code),status:Number.isFinite(status)?status:null,message:redact(raw,secret)};
  }
  function responseSummary(value){
    if(Array.isArray(value))return{kind:'array',length:value.length};
    if(!value||typeof value!=='object')return{kind:typeof value,value:value==null?null:String(value).slice(0,160)};
    const out={kind:'object',keys:Object.keys(value).slice(0,24)};
    if(typeof value.connected==='boolean')out.connected=value.connected;
    if(Array.isArray(value.matches))out.matches=value.matches.length;
    if(Number.isFinite(Number(value.scanned)))out.scanned=Number(value.scanned);
    if(Number.isFinite(Number(value.status)))out.status=Number(value.status);
    if(value?._historyLatency&&typeof value._historyLatency==='object')out.history_latency={mode:value._historyLatency.mode??null,scan:Number(value._historyLatency.scan)||0,limit:Number(value._historyLatency.limit)||0,cacheHit:value._historyLatency.cacheHit===true,ms:Number(value._historyLatency.ms)||0};
    return out;
  }
  function fingerprint(value){
    const text=JSON.stringify(value??null);let h=2166136261;
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0}
    return{hash:'fnv1a32:'+h.toString(16).padStart(8,'0'),chars:text.length,matches:Array.isArray(value?.matches)?value.matches.length:null,schema:value?.schema||null};
  }
  function sameFingerprint(a,b){return!!a&&!!b&&a.hash===b.hash&&a.chars===b.chars&&a.matches===b.matches&&a.schema===b.schema}
  function classify(error,response){
    if(error?.status===400)return'LEGACY_SHAPE_REPRODUCED_HTTP_400';
    if(error)return'LEGACY_SHAPE_BRIDGE_OR_DOWNSTREAM_ERROR';
    if(response?.connected===false)return'LCU_NOT_CONNECTED_OR_DOWNSTREAM_UNAVAILABLE';
    return'LEGACY_SHAPE_ACCEPTED_SAME_ANCHOR';
  }
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
  function resolveTargetFromCheckpoint(cp,options){
    const explicit=normalizePuuid(options?.puuid);
    if(explicit){if(!puuidLooksUsable(explicit))throw new Error('explicit_puuid_shape_invalid');return{puuid:explicit,source:'explicit_option',anchor_rank:null}}
    if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required_or_pass_explicit_puuid');
    const queue=Array.isArray(cp.b51_v032_queue)?cp.b51_v032_queue:[];
    const row=queue.find(x=>puuidLooksUsable(x?.puuid));
    if(!row)throw new Error('b51_anchor_queue_missing_or_no_valid_puuid_pass_explicit_puuid');
    return{puuid:normalizePuuid(row.puuid),source:'b51_checkpoint_queue_anchor',anchor_rank:Number.isFinite(Number(row.anchor_rank))?Number(row.anchor_rank):null};
  }
  function baseDiagnostic(target,before=null,after=null){
    const intact=before&&after?sameFingerprint(before,after):null;
    return{phase:PHASE,version:VERSION,mode:'READ_ONLY_ONE_SHOT_LEGACY_SHAPE_REPLAY',automatic_invocation:false,checkpoint_written:false,storage_mutation:false,checkpoint_integrity:intact,safety:{request_budget:1,requests_used:state.requestsUsed,consumed:state.consumed,in_flight:state.inFlight,reload_required_for_retry:state.consumed},target:target?{identity_kind:'puuid',source:target.source,anchor_rank:target.anchor_rank,puuid_preview:maskPuuid(target.puuid),puuid_length:target.puuid.length}:null,checkpoint:before?{before,after}:null,contract:CONTRACT,request:target?{limit:REQUEST.limit,scan:REQUEST.scan,target:{identity_kind:'puuid',puuid_preview:maskPuuid(target.puuid),puuid_length:target.puuid.length},queueMode:REQUEST.queueMode,priority:REQUEST.priority}:null};
  }
  async function probe(options={}){
    if(options.token!==CONFIRM)return{...baseDiagnostic(null),ok:false,refused:true,reason:'explicit_confirmation_required',expected_token:CONFIRM};
    if(state.consumed||state.inFlight)return{...baseDiagnostic(null),ok:false,refused:true,reason:'probe_budget_consumed_reload_required'};
    if(!window.aramDesktop?.getAramMatchHistory)return{...baseDiagnostic(null),ok:false,refused:true,reason:'desktop_match_history_bridge_unavailable'};
    let cpBefore,target,before;
    try{cpBefore=await readCheckpointReadonly();before=fingerprint(cpBefore);target=resolveTargetFromCheckpoint(cpBefore,options)}catch(error){return{...baseDiagnostic(null),ok:false,refused:true,reason:'target_or_checkpoint_preflight_failed',error:normalizeError(error)}}
    const payload={limit:REQUEST.limit,scan:REQUEST.scan,target:{puuid:target.puuid},queueMode:REQUEST.queueMode,priority:REQUEST.priority};
    state.consumed=true;state.inFlight=true;state.requestsUsed=1;
    let response=null,error=null;
    try{response=await window.aramDesktop.getAramMatchHistory(payload)}catch(e){error=normalizeError(e,target.puuid)}finally{state.inFlight=false}
    let after=null,integrityError=null;
    try{after=fingerprint(await readCheckpointReadonly())}catch(e){integrityError=normalizeError(e)}
    const integrity=!!after&&sameFingerprint(before,after),normalizedResponse=responseSummary(response),classification=classify(error,response);
    const interpretation=error?.status===400
      ?'The exact original B5.1 limit 20 / scan 100 / background shape reproduced HTTP 400 on the same anchor that R2 accepted. Split scan versus limit next; do not rerun legacy B5.1.'
      :!error&&integrity
        ?'The exact original B5.1 request shape was accepted on the same anchor. The old B5.1 failure is therefore not caused by target.puuid or the limit 20 / scan 100 / background shape alone; investigate later anchors, repeated-request state, or retry/collection sequencing next.'
        :integrity
          ?'The exact legacy shape reached the bridge but failed for a non-400 reason. Use this single result to choose the next diagnostic; do not rerun legacy B5.1.'
          :'Checkpoint integrity could not be proven; stop research collection.';
    const result={...baseDiagnostic(target,before,after),ok:!error&&integrity,refused:false,classification,response:normalizedResponse,error,integrity_error:integrityError,checkpoint_integrity:integrity,interpretation};
    state.lastResult=result;return result;
  }
  function status(){return{...baseDiagnostic(null),last_result:state.lastResult};}
  window.aramRatingB51R3V032=Object.freeze({version:VERSION,phase:PHASE,confirmation:CONFIRM,contract:CONTRACT,probe,status});
  console.log('[ARAM Rating v0.3.2] B5.1 R3 exact legacy-shape one-shot ready. NO Riot/LCU request has started. This probe performs at most one read-only limit 20 / scan 100 / background request and verifies the Research checkpoint before/after.');
})();
