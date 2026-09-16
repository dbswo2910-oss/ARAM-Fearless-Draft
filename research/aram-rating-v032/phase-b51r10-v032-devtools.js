'use strict';
(()=>{
  const VERSION='v0.3.2',PHASE='B5.1-R10',CONFIRM='B51R10-COLLECT-THREE-ANCHORS';
  const DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const EXPECTED=Object.freeze({checkpoint_matches:1984,queue_selected:15,completed_before:1,remaining_before:14,last_recovery_phase:'B5.1-R9'});
  const REQUEST=Object.freeze({limit:20,scan:100,queueMode:'standard',priority:'background',timeout_ms:20000,max_requests:3});
  const state={consumed:false,inFlight:false,lastResult:null};
  const CONTRACT=Object.freeze({purpose:'guarded three-anchor bounded recovery after successful R9',request_budget:3,retry:false,stop_on_first_request_or_validation_failure:true,checkpoint_write:'per-anchor only after valid target response',rollback_scope:'current anchor only on postcondition failure',automatic_invocation:false,production_changed:false,exposes_raw_puuid:false});

  const roots=g=>[g,g?.game,g?.match,g?.data,g?.raw,g?.info].filter(Boolean);
  const pick=(g,keys)=>{for(const r of roots(g))for(const k of keys){const v=r?.[k];if(v!==undefined&&v!==null&&v!=='')return v}return null};
  const matchId=g=>String(pick(g,['gameId','id','matchId','match_id'])??'');
  function queueId(g){const x=pick(g,['queueId','queue_id']);if(x!==null&&Number.isFinite(Number(x)))return Number(x);for(const r of roots(g)){const n=Number(r?.gameQueueConfig?.id);if(Number.isFinite(n))return n}return null}
  function participants(g){for(const r of roots(g)){if(Array.isArray(r?.participants)&&r.participants.length)return r.participants;const a=Array.isArray(r?.team)?r.team:[],b=Array.isArray(r?.enemy)?r.enemy:[];if(a.length||b.length)return[...a,...b]}return[]}
  function participantPuuids(g){let xs=participants(g).map(p=>String(typeof p==='string'?p:(p?.puuid||p?.player?.puuid||'')).trim()).filter(Boolean);if(xs.length)return[...new Set(xs)];for(const r of roots(g))if(Array.isArray(r?.participantIdentities)){xs=r.participantIdentities.map(x=>String(x?.player?.puuid||x?.puuid||'').trim()).filter(Boolean);if(xs.length)return[...new Set(xs)]}return[]}
  const standardMatches=rows=>(Array.isArray(rows)?rows:[]).filter(g=>queueId(g)===450&&participantPuuids(g).length===10&&matchId(g));
  function dedupeMatches(rows){const out=[],seen=new Set();for(const g of standardMatches(rows)){const id=matchId(g);if(seen.has(id))continue;seen.add(id);out.push(g)}return out}
  const clone=v=>JSON.parse(JSON.stringify(v));
  function fingerprint(value){const text=JSON.stringify(value??null);let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return{hash:'fnv1a32:'+h.toString(16).padStart(8,'0'),chars:text.length}}
  const same=(a,b)=>!!a&&!!b&&a.hash===b.hash&&a.chars===b.chars;
  function mask(v){const p=String(v||'').trim();return p?p.slice(0,8)+'…'+p.slice(-6):null}
  function normalizeError(e,secret){const raw=String(e?.message||e||'unknown_error'),safe=secret?raw.split(secret).join('[PUUID]'):raw;const direct=Number(e?.status||e?.statusCode||e?.response?.status||0),m=safe.match(/(?:->|status\s*[:=]?|http\s*)\s*(\d{3})\b/i);return{name:String(e?.name||'Error'),status:direct>=100&&direct<=599?direct:(m?Number(m[1]):null),message:safe}}
  function openExisting(){return new Promise((resolve,reject)=>{const q=indexedDB.open(DB);let upgrading=false;q.onupgradeneeded=()=>{upgrading=true;try{q.transaction.abort()}catch{};reject(new Error('research_db_missing_refusing_to_create'))};q.onsuccess=()=>{if(upgrading)return;const db=q.result;if(!db.objectStoreNames.contains(STORE)){db.close();return reject(new Error('research_store_missing'))}resolve(db)};q.onerror=()=>{if(!upgrading)reject(q.error||new Error('research_db_open_failed'))}})}
  async function readCp(){const db=await openExisting();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(KEY);r.onsuccess=()=>{db.close();resolve(r.result??null)};r.onerror=()=>{db.close();reject(r.error||new Error('research_checkpoint_read_failed'))}})}
  async function writeCp(cp){const db=await openExisting();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(cp,KEY);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error||new Error('research_checkpoint_write_failed'))};tx.onabort=()=>{db.close();reject(tx.error||new Error('research_checkpoint_write_aborted'))}})}
  async function timed(p,ms){let t;return Promise.race([Promise.resolve(p).finally(()=>clearTimeout(t)),new Promise((_,reject)=>{t=setTimeout(()=>reject(new Error('request_timeout')),ms)})])}
  function analyze(cp){if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');const queue=Array.isArray(cp.b51_v032_queue)?cp.b51_v032_queue:[],completed=Array.isArray(cp.completed_puuids_b51_v032)?cp.completed_puuids_b51_v032:[],skipped=Array.isArray(cp.skipped_puuids_b51_v032)?cp.skipped_puuids_b51_v032:[];const done=new Set(completed),skip=new Set(skipped),remaining=queue.filter(x=>!done.has(x.puuid)&&!skip.has(x.puuid));return{queue,completed,skipped,remaining}}
  function startPreflight(cp,a){const matches=dedupeMatches(cp.matches||[]).length,last=cp?.b51_v032_repair_state?.last_recovery_phase||null,status=cp?.b51_v032_repair_state?.status||null;return{ok:matches===EXPECTED.checkpoint_matches&&a.queue.length===EXPECTED.queue_selected&&new Set(a.completed).size===EXPECTED.completed_before&&a.remaining.length===EXPECTED.remaining_before&&last===EXPECTED.last_recovery_phase&&status==='bounded_recovery_started',checkpoint_matches:matches,queue_selected:a.queue.length,completed_unique:new Set(a.completed).size,remaining:a.remaining.length,last_recovery_phase:last,recovery_status:status}}
  function buildStop(classification,message,pre,progress,extra={}){return{phase:PHASE,version:VERSION,mode:'GUARDED_THREE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:false,classification,message,riot_lcu_requests_performed:progress.length+(extra.request_count_increment||0),anchors_committed:progress.length,progress,...extra}}

  async function collect(options={}){
    if(options.token!==CONFIRM)return{phase:PHASE,version:VERSION,mode:'GUARDED_THREE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:true,reason:'explicit_confirmation_required',expected_token:CONFIRM};
    if(state.consumed||state.inFlight)return{phase:PHASE,version:VERSION,mode:'GUARDED_THREE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:true,reason:'request_budget_consumed_reload_required'};
    if(!window.aramDesktop?.getAramMatchHistory)return{phase:PHASE,version:VERSION,mode:'GUARDED_THREE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:true,reason:'desktop_match_history_bridge_unavailable'};
    state.consumed=true;state.inFlight=true;
    const progress=[];
    try{
      let cp=await readCp(),a=analyze(cp),pre=startPreflight(cp,a);
      if(!pre.ok){const result={phase:PHASE,version:VERSION,mode:'GUARDED_THREE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:true,reason:'r9_exact_precondition_not_met',pre,checkpoint_written:false,riot_lcu_requests_performed:0};state.lastResult=result;return result}

      for(let i=0;i<REQUEST.max_requests;i++){
        a=analyze(cp);const target=a.remaining[0];if(!target)break;
        const beforeAnchor=clone(cp),beforeMatches=dedupeMatches(cp.matches||[]),beforeCount=beforeMatches.length,beforeFp=fingerprint(cp);
        let response;
        try{response=await timed(window.aramDesktop.getAramMatchHistory({limit:REQUEST.limit,scan:REQUEST.scan,target:{puuid:target.puuid},queueMode:REQUEST.queueMode,priority:REQUEST.priority}),REQUEST.timeout_ms)}catch(e){const result=buildStop('R10_STOP_REQUEST_FAILED_NO_WRITE','Stopped on first request failure; prior committed anchors are preserved.',pre,progress,{request_count_increment:1,checkpoint_written_for_failed_anchor:false,target:{anchor_rank:Number(target.anchor_rank)||null,puuid_preview:mask(target.puuid)},error:normalizeError(e,target.puuid)});state.lastResult=result;return result}
        if(response?.connected===false){const result=buildStop('R10_STOP_LCU_UNAVAILABLE_NO_WRITE','Stopped because LCU/downstream reported disconnected; prior committed anchors are preserved.',pre,progress,{request_count_increment:1,checkpoint_written_for_failed_anchor:false,target:{anchor_rank:Number(target.anchor_rank)||null}});state.lastResult=result;return result}
        const valid=dedupeMatches(response?.matches||[]),targetHits=valid.filter(g=>participantPuuids(g).includes(target.puuid)).length;
        if(!valid.length||!targetHits){const result=buildStop(!valid.length?'R10_STOP_EMPTY_VALID_HISTORY_NO_WRITE':'R10_STOP_TARGET_MISMATCH_NO_WRITE','Stopped on first validation failure; prior committed anchors are preserved.',pre,progress,{request_count_increment:1,checkpoint_written_for_failed_anchor:false,target:{anchor_rank:Number(target.anchor_rank)||null},returned_valid_matches:valid.length,target_hits:targetHits});state.lastResult=result;return result}
        const existingIds=new Set(beforeMatches.map(matchId)),fresh=valid.filter(g=>!existingIds.has(matchId(g))),room=Math.max(0,2200-beforeCount),accepted=fresh.slice(0,Math.min(20,room));
        cp.matches=dedupeMatches([...beforeMatches,...accepted]);
        cp.completed_puuids_b51_v032=Array.isArray(cp.completed_puuids_b51_v032)?cp.completed_puuids_b51_v032:[];
        if(!cp.completed_puuids_b51_v032.includes(target.puuid))cp.completed_puuids_b51_v032.push(target.puuid);
        cp.expansion_logs_b51_v032=Array.isArray(cp.expansion_logs_b51_v032)?cp.expansion_logs_b51_v032:[];
        cp.expansion_logs_b51_v032.push({anchor_rank:target.anchor_rank,source_pool:target.source_pool,evidence_tier:target.evidence_tier,heldout_matches:target.heldout_matches,closed_10_of_10_matches:target.closed_10_of_10_matches,requests:1,new_unique_matches:accepted.length,duplicates:valid.length-fresh.length,error:'',error_class:'NONE',recovery_phase:'B5.1-R10'});
        cp.b51_v032_recovery_history=Array.isArray(cp.b51_v032_recovery_history)?cp.b51_v032_recovery_history:[];
        cp.b51_v032_recovery_history.push({phase:'B5.1-R10',at:new Date().toISOString(),anchor_rank:Number(target.anchor_rank)||null,request_count:1,returned_valid_matches:valid.length,target_hits:targetHits,new_unique_matches:accepted.length,checkpoint_matches_before:beforeCount,checkpoint_matches_after:cp.matches.length});
        cp.b51_v032_repair_state={...(cp.b51_v032_repair_state||{}),status:'bounded_recovery_progress',last_recovery_phase:'B5.1-R10',last_recovery_at:new Date().toISOString(),last_anchor_rank:Number(target.anchor_rank)||null};
        cp.status='b51_v032_recovery_paused';
        await writeCp(cp);
        const afterCp=await readCp(),afterA=analyze(afterCp),afterMatches=dedupeMatches(afterCp.matches||[]),matchCountOk=afterMatches.length===beforeCount+accepted.length,completionOk=afterA.completed.includes(target.puuid),existingPreserved=beforeMatches.every(g=>afterMatches.some(x=>matchId(x)===matchId(g)));
        if(!matchCountOk||!completionOk||!existingPreserved){await writeCp(beforeAnchor);const rolled=await readCp();const result=buildStop('R10_CURRENT_ANCHOR_POSTCONDITION_FAILED_ROLLED_BACK','Current anchor write failed integrity checks and was rolled back; earlier committed anchors remain preserved.',pre,progress,{request_count_increment:1,checkpoint_written_for_failed_anchor:true,rolled_back_current_anchor:true,rollback_integrity:same(beforeFp,fingerprint(rolled)),match_count_integrity:matchCountOk,completion_integrity:completionOk,existing_match_integrity:existingPreserved,target:{anchor_rank:Number(target.anchor_rank)||null}});state.lastResult=result;return result}
        progress.push({sequence:i+1,anchor_rank:Number(target.anchor_rank)||null,returned_valid_matches:valid.length,target_hits:targetHits,duplicates:valid.length-fresh.length,new_unique_matches:accepted.length,checkpoint_matches_before:beforeCount,checkpoint_matches_after:afterMatches.length,completed_after:new Set(afterA.completed).size,remaining_after:afterA.remaining.length,match_count_integrity:matchCountOk,completion_integrity:completionOk,existing_match_integrity:existingPreserved});
        cp=afterCp;
      }

      const finalA=analyze(cp),finalMatches=dedupeMatches(cp.matches||[]).length,totalNew=progress.reduce((n,x)=>n+x.new_unique_matches,0),allIntegrity=progress.every(x=>x.match_count_integrity&&x.completion_integrity&&x.existing_match_integrity);
      const result={phase:PHASE,version:VERSION,mode:'GUARDED_THREE_ANCHOR_RECOVERY',contract:CONTRACT,ok:progress.length>0&&allIntegrity,refused:false,classification:progress.length===3?'R10_THREE_ANCHOR_RECOVERY_ACCEPTED':'R10_BOUNDED_RECOVERY_ACCEPTED',riot_lcu_requests_performed:progress.length,anchors_committed:progress.length,total_new_unique_matches:totalNew,checkpoint_matches_before:pre.checkpoint_matches,checkpoint_matches_after:finalMatches,completed_after:new Set(finalA.completed).size,remaining_after:finalA.remaining.length,progress,privacy:{contains_raw_puuid:false,contains_riot_id:false},production_changed:false};state.lastResult=result;return result;
    }finally{state.inFlight=false}
  }

  function status(){return{phase:PHASE,version:VERSION,contract:CONTRACT,safety:{consumed:state.consumed,in_flight:state.inFlight},last_result:state.lastResult}}
  window.aramRatingB51R10V032=Object.freeze({version:VERSION,phase:PHASE,confirmation:CONFIRM,contract:CONTRACT,collect,status});
  console.log('[ARAM Rating v0.3.2] B5.1 R10 guarded three-anchor recovery ready. Exact R9 checkpoint state required. At most 3 Riot/LCU requests, no retries, stop on first request/validation failure, per-anchor writes only after valid target history, and current-anchor rollback on postcondition failure.');
})();
