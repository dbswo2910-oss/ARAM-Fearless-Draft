'use strict';
(()=>{
  const VERSION='v0.3.2',PHASE='B5.1-R2',CONFIRM='B51R2-PROBE-ONE';
  const DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const REQUEST=Object.freeze({limit:20,scan:100,queueMode:'standard',priority:'background'});
  const CONTRACT=Object.freeze({
    renderer_bridge:'window.aramDesktop.getAramMatchHistory',
    ipc_channel:'match-history:load',
    main_handler:'autoSyncCore.fetchMatchHistoryForPuuid(payload)',
    identity_kind:'puuid',
    payload_shape:'{limit,scan,target:{puuid},queueMode,priority}',
    tracked_downstream_endpoint:false,
    tracked_source_evidence:Object.freeze([
      'update/v0.15.117/preload.js -> ipcRenderer.invoke(\'match-history:load\', payload)',
      'update/v0.15.70/main.js -> autoSyncCore.fetchMatchHistoryForPuuid(payload)'
    ])
  });
  const state={consumed:false,inFlight:false,requestsUsed:0,lastResult:null};

  function normalizePuuid(value){return typeof value==='string'?value.trim():''}
  function maskPuuid(value){const p=normalizePuuid(value);if(!p)return null;return p.length<=16?p.slice(0,4)+'…'+p.slice(-4):p.slice(0,8)+'…'+p.slice(-6)}
  function normalizeError(error){
    const message=String(error?.message||error||'unknown_error');
    const direct=Number(error?.status||error?.statusCode||error?.response?.status||0);
    const m=message.match(/(?:->|status\s*[:=]?|http\s*)\s*(\d{3})\b/i);
    const status=direct>=100&&direct<=599?direct:(m?Number(m[1]):null);
    return{name:String(error?.name||'Error'),code:error?.code==null?null:String(error.code),status:Number.isFinite(status)?status:null,message};
  }
  function responseSummary(value){
    if(Array.isArray(value))return{kind:'array',length:value.length};
    if(!value||typeof value!=='object')return{kind:typeof value,value:value==null?null:String(value).slice(0,160)};
    const out={kind:'object',keys:Object.keys(value).slice(0,24)};
    if(typeof value.connected==='boolean')out.connected=value.connected;
    if(Array.isArray(value.matches))out.matches=value.matches.length;
    if(Number.isFinite(Number(value.status)))out.status=Number(value.status);
    return out;
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
  async function resolveTarget(options){
    const explicit=normalizePuuid(options?.puuid);
    if(explicit)return{puuid:explicit,source:'explicit_option',anchor_rank:null};
    const cp=await readCheckpointReadonly();
    if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required_or_pass_explicit_puuid');
    const queue=Array.isArray(cp.b51_v032_queue)?cp.b51_v032_queue:[];
    const row=queue.find(x=>normalizePuuid(x?.puuid));
    if(!row)throw new Error('b51_anchor_queue_missing_or_empty_pass_explicit_puuid');
    return{puuid:normalizePuuid(row.puuid),source:'b51_checkpoint_queue_anchor',anchor_rank:Number.isFinite(Number(row.anchor_rank))?Number(row.anchor_rank):null};
  }
  function baseDiagnostic(target){
    return{phase:PHASE,version:VERSION,mode:'READ_ONLY_ONE_SHOT_PREFLIGHT',automatic_invocation:false,checkpoint_written:false,storage_mutation:false,safety:{request_budget:1,requests_used:state.requestsUsed,consumed:state.consumed,in_flight:state.inFlight,reload_required_for_retry:state.consumed},target:target?{identity_kind:'puuid',source:target.source,anchor_rank:target.anchor_rank,puuid_preview:maskPuuid(target.puuid),puuid_length:target.puuid.length}:null,contract:CONTRACT,request:target?{limit:REQUEST.limit,scan:REQUEST.scan,target:{identity_kind:'puuid',puuid_preview:maskPuuid(target.puuid),puuid_length:target.puuid.length},queueMode:REQUEST.queueMode,priority:REQUEST.priority}:null};
  }
  async function probe(options={}){
    if(options.token!==CONFIRM)return{...baseDiagnostic(null),ok:false,refused:true,reason:'explicit_confirmation_required',expected_token:CONFIRM};
    if(state.consumed||state.inFlight)return{...baseDiagnostic(null),ok:false,refused:true,reason:'probe_budget_consumed_reload_required'};
    if(!window.aramDesktop?.getAramMatchHistory)return{...baseDiagnostic(null),ok:false,refused:true,reason:'desktop_match_history_bridge_unavailable'};
    let target;
    try{target=await resolveTarget(options)}catch(error){return{...baseDiagnostic(null),ok:false,refused:true,reason:'target_resolution_failed',error:normalizeError(error)}}
    const payload={limit:REQUEST.limit,scan:REQUEST.scan,target:{puuid:target.puuid},queueMode:REQUEST.queueMode,priority:REQUEST.priority};
    state.consumed=true;state.inFlight=true;state.requestsUsed=1;
    try{
      const response=await window.aramDesktop.getAramMatchHistory(payload);
      state.inFlight=false;
      const result={...baseDiagnostic(target),ok:true,refused:false,response:responseSummary(response),error:null};state.lastResult=result;return result;
    }catch(error){
      state.inFlight=false;
      const result={...baseDiagnostic(target),ok:false,refused:false,response:null,error:normalizeError(error)};state.lastResult=result;return result;
    }finally{state.inFlight=false}
  }
  function status(){return{...baseDiagnostic(null),last_result:state.lastResult};}
  window.aramRatingB51R2V032=Object.freeze({version:VERSION,phase:PHASE,confirmation:CONFIRM,contract:CONTRACT,probe,status});
  console.log('[ARAM Rating v0.3.2] B5.1 R2 one-shot preflight ready. NO Riot/LCU request has started. Exactly one request is allowed after explicit confirmation; reload is required after it is consumed.');
})();
