'use strict';
(()=>{
  const VERSION='v0.3.2',PHASE='B5.1-R5',CONFIRM='B51R5-SEQUENCE-TWO';
  const DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const REQUEST=Object.freeze({limit:20,scan:100,queueMode:'standard',priority:'background'});
  const CONTRACT=Object.freeze({
    purpose:'two-request sequential replay after independent R3/R4 success',
    prior_live_evidence:'R3 anchor1 accepted; R4 anchor2 accepted with exact legacy shape',
    renderer_bridge:'window.aramDesktop.getAramMatchHistory',
    ipc_channel:'match-history:load',
    main_handler:'core.getAramMatchHistory(opts||{})',
    concurrency_wrapper:'Core.prototype.getAramMatchHistory(opts) -> oldHistory.call(this,o)',
    request_shape:'{limit:20,scan:100,target:{puuid},queueMode:"standard",priority:"background"}',
    target_sequence:'first two distinct valid PUUIDs in b51_v032_queue',
    request_budget:2,
    checkpoint_access:'readonly',
    checkpoint_written:false,
    storage_mutation:false,
    automatic_invocation:false,
    retry:false,
    inter_request_delay_ms:0
  });
  const state={consumed:false,inFlight:false,requestsUsed:0,lastResult:null};

  const normalizePuuid=v=>typeof v==='string'?v.trim():'';
  const usable=v=>{const p=normalizePuuid(v);return p.length>=32&&p.length<=128&&/^[A-Za-z0-9_-]+$/.test(p)};
  const mask=v=>{const p=normalizePuuid(v);return !p?null:(p.length<=16?p.slice(0,4)+'…'+p.slice(-4):p.slice(0,8)+'…'+p.slice(-6))};
  const redact=(text,secret)=>{const s=normalizePuuid(secret);const out=String(text??'');return s?out.split(s).join('[PUUID]'):out};
  function normalizeError(error,secret){
    const raw=String(error?.message||error||'unknown_error');
    const direct=Number(error?.status||error?.statusCode||error?.response?.status||0);
    const m=raw.match(/(?:->|status\s*[:=]?|http\s*)\s*(\d{3})\b/i);
    const status=direct>=100&&direct<=599?direct:(m?Number(m[1]):null);
    return{name:String(error?.name||'Error'),code:error?.code==null?null:String(error.code),status:Number.isFinite(status)?status:null,message:redact(raw,secret)};
  }
  function summarize(value){
    if(!value||typeof value!=='object')return{kind:typeof value,value:value==null?null:String(value).slice(0,120)};
    const out={kind:'object',connected:typeof value.connected==='boolean'?value.connected:null,matches:Array.isArray(value.matches)?value.matches.length:null,scanned:Number.isFinite(Number(value.scanned))?Number(value.scanned):null};
    if(value?._historyLatency&&typeof value._historyLatency==='object')out.history_latency={mode:value._historyLatency.mode??null,scan:Number(value._historyLatency.scan)||0,limit:Number(value._historyLatency.limit)||0,cacheHit:value._historyLatency.cacheHit===true,ms:Number(value._historyLatency.ms)||0};
    return out;
  }
  function fingerprint(value){const text=JSON.stringify(value??null);let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return{hash:'fnv1a32:'+h.toString(16).padStart(8,'0'),chars:text.length,matches:Array.isArray(value?.matches)?value.matches.length:null,schema:value?.schema||null}}
  const same=(a,b)=>!!a&&!!b&&a.hash===b.hash&&a.chars===b.chars&&a.matches===b.matches&&a.schema===b.schema;
  function openExistingReadonly(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB);let upgrading=false;request.onupgradeneeded=()=>{upgrading=true;try{request.transaction.abort()}catch{};reject(new Error('research_db_missing_refusing_to_create'))};request.onsuccess=()=>{if(upgrading)return;const db=request.result;if(!db.objectStoreNames.contains(STORE)){db.close();return reject(new Error('research_store_missing'))}resolve(db)};request.onerror=()=>{if(!upgrading)reject(request.error||new Error('research_db_open_failed'))}})}
  async function readCheckpointReadonly(){const db=await openExistingReadonly();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).get(KEY);request.onsuccess=()=>{db.close();resolve(request.result??null)};request.onerror=()=>{db.close();reject(request.error||new Error('research_checkpoint_read_failed'))}})}
  function resolveTwo(cp){
    if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');
    const valid=(Array.isArray(cp.b51_v032_queue)?cp.b51_v032_queue:[]).filter(x=>usable(x?.puuid));
    if(valid.length<2)throw new Error('b51_requires_two_valid_queue_anchors');
    const first=valid[0],p1=normalizePuuid(first.puuid),second=valid.find((x,i)=>i>0&&normalizePuuid(x.puuid)!==p1);
    if(!second)throw new Error('b51_second_distinct_queue_anchor_missing');
    return[
      {puuid:p1,anchor_rank:Number.isFinite(Number(first.anchor_rank))?Number(first.anchor_rank):null},
      {puuid:normalizePuuid(second.puuid),anchor_rank:Number.isFinite(Number(second.anchor_rank))?Number(second.anchor_rank):null}
    ];
  }
  function base(targets,before=null,after=null){return{phase:PHASE,version:VERSION,mode:'READ_ONLY_TWO_REQUEST_SEQUENCE',automatic_invocation:false,checkpoint_written:false,storage_mutation:false,checkpoint_integrity:before&&after?same(before,after):null,safety:{request_budget:2,requests_used:state.requestsUsed,consumed:state.consumed,in_flight:state.inFlight,reload_required_for_retry:state.consumed},targets:targets?targets.map((t,i)=>({sequence:i+1,anchor_rank:t.anchor_rank,identity_kind:'puuid',puuid_preview:mask(t.puuid),puuid_length:t.puuid.length})):null,checkpoint:before?{before,after}:null,contract:CONTRACT,request:{limit:REQUEST.limit,scan:REQUEST.scan,queueMode:REQUEST.queueMode,priority:REQUEST.priority}}}
  async function live(target){
    state.requestsUsed++;
    try{
      const response=await window.aramDesktop.getAramMatchHistory({limit:REQUEST.limit,scan:REQUEST.scan,target:{puuid:target.puuid},queueMode:REQUEST.queueMode,priority:REQUEST.priority});
      return{ok:true,response:summarize(response),error:null};
    }catch(e){return{ok:false,response:null,error:normalizeError(e,target.puuid)}}
  }
  function classify(first,second){
    if(first?.error?.status===400)return'SEQUENCE_FIRST_HTTP_400_UNEXPECTED';
    if(first?.error)return'SEQUENCE_FIRST_ERROR';
    if(first?.response?.connected===false)return'SEQUENCE_FIRST_LCU_UNAVAILABLE';
    if(second?.error?.status===400)return'SEQUENCE_SECOND_HTTP_400_AFTER_FIRST_ACCEPTED';
    if(second?.error)return'SEQUENCE_SECOND_ERROR_AFTER_FIRST_ACCEPTED';
    if(second?.response?.connected===false)return'SEQUENCE_SECOND_LCU_UNAVAILABLE';
    return'SEQUENCE_TWO_ACCEPTED';
  }
  async function probe(options={}){
    if(options.token!==CONFIRM)return{...base(null),ok:false,refused:true,reason:'explicit_confirmation_required',expected_token:CONFIRM};
    if(state.consumed||state.inFlight)return{...base(null),ok:false,refused:true,reason:'probe_budget_consumed_reload_required'};
    if(!window.aramDesktop?.getAramMatchHistory)return{...base(null),ok:false,refused:true,reason:'desktop_match_history_bridge_unavailable'};
    let cpBefore,targets,before;
    try{cpBefore=await readCheckpointReadonly();before=fingerprint(cpBefore);targets=resolveTwo(cpBefore)}catch(error){return{...base(null),ok:false,refused:true,reason:'target_or_checkpoint_preflight_failed',error:normalizeError(error)}}
    state.consumed=true;state.inFlight=true;
    let first=null,second=null;
    try{
      first=await live(targets[0]);
      if(first.ok&&first.response?.connected!==false)second=await live(targets[1]);
    }finally{state.inFlight=false}
    let after=null,integrityError=null;
    try{after=fingerprint(await readCheckpointReadonly())}catch(e){integrityError=normalizeError(e)}
    const integrity=!!after&&same(before,after),classification=classify(first,second);
    const ok=classification==='SEQUENCE_TWO_ACCEPTED'&&integrity;
    const interpretation=classification==='SEQUENCE_SECOND_HTTP_400_AFTER_FIRST_ACCEPTED'
      ?'Both anchors succeed independently, but anchor 2 failed immediately after anchor 1 in one session. Sequential request state is now the leading cause; inspect the concurrency/request cache path and legacy runner sequencing before any bulk retry.'
      :classification==='SEQUENCE_TWO_ACCEPTED'
        ?'The first two exact legacy-shape requests also succeed sequentially. The old bulk failure is not reproduced by a two-request sequence; next use a small bounded multi-anchor sequence, still read-only and without retries/checkpoint writes, to find the earliest failing request index.'
        :'The bounded two-request sequence did not complete cleanly. Use this single result to select the next diagnostic and keep the legacy bulk runner blocked.';
    const result={...base(targets,before,after),ok,refused:false,classification,first,second,integrity_error:integrityError,checkpoint_integrity:integrity,interpretation};
    state.lastResult=result;return result;
  }
  function status(){return{...base(null),last_result:state.lastResult}}
  window.aramRatingB51R5V032=Object.freeze({version:VERSION,phase:PHASE,confirmation:CONFIRM,contract:CONTRACT,probe,status});
  console.log('[ARAM Rating v0.3.2] B5.1 R5 two-request sequence ready. NO Riot/LCU request has started. One explicit probe performs at most two read-only exact legacy-shape requests (anchor 1 then anchor 2), with no retry/write, and verifies the Research checkpoint before/after.');
})();
