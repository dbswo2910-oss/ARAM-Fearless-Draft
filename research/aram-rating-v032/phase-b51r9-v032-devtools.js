'use strict';
(()=>{
  const VERSION='v0.3.2',PHASE='B5.1-R9',CONFIRM='B51R9-COLLECT-ONE-ANCHOR';
  const DB='aram-rating-research-v03',STORE='kv',KEY='checkpoint-v03';
  const EXPECTED=Object.freeze({checkpoint_matches:1982,queue_selected:15,completed_after_r8:0,remaining_after_r8:15});
  const REQUEST=Object.freeze({limit:20,scan:100,queueMode:'standard',priority:'background',timeout_ms:20000});
  const state={consumed:false,inFlight:false,lastResult:null};
  const CONTRACT=Object.freeze({
    purpose:'guarded one-anchor recovery collection after successful R8 repair',
    request_budget:1,retry:false,automatic_invocation:false,
    checkpoint_write:'only after one valid target history response',
    rollback_on_postcondition_failure:true,production_changed:false,exposes_raw_puuid:false
  });

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
  function analyze(cp){
    if(!cp||cp.schema!=='aram-rating-phase-b-checkpoint-v03')throw new Error('checkpoint_v03_required');
    const queue=Array.isArray(cp.b51_v032_queue)?cp.b51_v032_queue:[],completed=Array.isArray(cp.completed_puuids_b51_v032)?cp.completed_puuids_b51_v032:[],skipped=Array.isArray(cp.skipped_puuids_b51_v032)?cp.skipped_puuids_b51_v032:[];
    const done=new Set(completed),skip=new Set(skipped),remaining=queue.filter(x=>!done.has(x.puuid)&&!skip.has(x.puuid));
    return{queue,completed,skipped,remaining,target:remaining[0]||null};
  }
  function preflight(cp,a){
    const matches=dedupeMatches(cp.matches||[]).length;
    const repairOk=cp?.b51_v032_repair_state?.phase==='B5.1-R8'&&cp?.b51_v032_repair_state?.status==='completion_state_repaired_ready_for_bounded_recovery';
    return{ok:repairOk&&matches===EXPECTED.checkpoint_matches&&a.queue.length===EXPECTED.queue_selected&&new Set(a.completed).size===EXPECTED.completed_after_r8&&a.remaining.length===EXPECTED.remaining_after_r8&&!!a.target,repair_state_ok:repairOk,checkpoint_matches:matches,queue_selected:a.queue.length,completed_unique:new Set(a.completed).size,remaining:a.remaining.length,target_anchor_rank:Number(a.target?.anchor_rank)||null};
  }
  async function collect(options={}){
    if(options.token!==CONFIRM)return{phase:PHASE,version:VERSION,mode:'GUARDED_ONE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:true,reason:'explicit_confirmation_required',expected_token:CONFIRM};
    if(state.consumed||state.inFlight)return{phase:PHASE,version:VERSION,mode:'GUARDED_ONE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:true,reason:'request_budget_consumed_reload_required'};
    if(!window.aramDesktop?.getAramMatchHistory)return{phase:PHASE,version:VERSION,mode:'GUARDED_ONE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:true,reason:'desktop_match_history_bridge_unavailable'};
    state.consumed=true;state.inFlight=true;
    let result;
    try{
      const cp=await readCp(),original=clone(cp),a=analyze(cp),pre=preflight(cp,a),target=a.target;
      if(!pre.ok){result={phase:PHASE,version:VERSION,mode:'GUARDED_ONE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:true,reason:'r8_exact_precondition_not_met',pre,checkpoint_written:false,riot_lcu_requests_performed:0};state.lastResult=result;return result}
      const beforeMatches=dedupeMatches(cp.matches||[]),beforeCount=beforeMatches.length,beforeMatchFp=fingerprint(beforeMatches),beforeCpFp=fingerprint(cp);
      let response;
      try{response=await timed(window.aramDesktop.getAramMatchHistory({limit:REQUEST.limit,scan:REQUEST.scan,target:{puuid:target.puuid},queueMode:REQUEST.queueMode,priority:REQUEST.priority}),REQUEST.timeout_ms)}catch(e){result={phase:PHASE,version:VERSION,mode:'GUARDED_ONE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:false,classification:'R9_REQUEST_FAILED_NO_WRITE',checkpoint_written:false,riot_lcu_requests_performed:1,target:{anchor_rank:Number(target.anchor_rank)||null,puuid_preview:mask(target.puuid)},error:normalizeError(e,target.puuid),pre};state.lastResult=result;return result}
      if(response?.connected===false){result={phase:PHASE,version:VERSION,mode:'GUARDED_ONE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:false,classification:'R9_LCU_UNAVAILABLE_NO_WRITE',checkpoint_written:false,riot_lcu_requests_performed:1,pre};state.lastResult=result;return result}
      const valid=dedupeMatches(response?.matches||[]),targetHits=valid.filter(g=>participantPuuids(g).includes(target.puuid)).length;
      if(!valid.length||!targetHits){result={phase:PHASE,version:VERSION,mode:'GUARDED_ONE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:false,classification:!valid.length?'R9_EMPTY_VALID_HISTORY_NO_WRITE':'R9_TARGET_MISMATCH_NO_WRITE',checkpoint_written:false,riot_lcu_requests_performed:1,returned_valid_matches:valid.length,target_hits:targetHits,pre};state.lastResult=result;return result}
      const existingIds=new Set(beforeMatches.map(matchId)),fresh=valid.filter(g=>!existingIds.has(matchId(g))),room=Math.max(0,2200-beforeCount),accepted=fresh.slice(0,Math.min(20,room));
      cp.matches=dedupeMatches([...beforeMatches,...accepted]);
      cp.completed_puuids_b51_v032=Array.isArray(cp.completed_puuids_b51_v032)?cp.completed_puuids_b51_v032:[];
      if(!cp.completed_puuids_b51_v032.includes(target.puuid))cp.completed_puuids_b51_v032.push(target.puuid);
      cp.expansion_logs_b51_v032=Array.isArray(cp.expansion_logs_b51_v032)?cp.expansion_logs_b51_v032:[];
      cp.expansion_logs_b51_v032.push({anchor_rank:target.anchor_rank,source_pool:target.source_pool,evidence_tier:target.evidence_tier,heldout_matches:target.heldout_matches,closed_10_of_10_matches:target.closed_10_of_10_matches,requests:1,new_unique_matches:accepted.length,duplicates:valid.length-fresh.length,error:'',error_class:'NONE',recovery_phase:'B5.1-R9'});
      cp.b51_v032_r9_backup=cp.b51_v032_r9_backup||{created_at:new Date().toISOString(),checkpoint_fingerprint:beforeCpFp,match_fingerprint:beforeMatchFp,checkpoint_matches:beforeCount,completed_puuids_b51_v032:[...a.completed],status:cp.status||null};
      cp.b51_v032_recovery_history=Array.isArray(cp.b51_v032_recovery_history)?cp.b51_v032_recovery_history:[];
      cp.b51_v032_recovery_history.push({phase:'B5.1-R9',at:new Date().toISOString(),anchor_rank:Number(target.anchor_rank)||null,request_count:1,returned_valid_matches:valid.length,target_hits:targetHits,new_unique_matches:accepted.length,checkpoint_matches_before:beforeCount,checkpoint_matches_after:cp.matches.length});
      cp.b51_v032_repair_state={...(cp.b51_v032_repair_state||{}),status:'bounded_recovery_started',last_recovery_phase:'B5.1-R9',last_recovery_at:new Date().toISOString()};
      cp.status='b51_v032_recovery_paused';
      await writeCp(cp);
      const afterCp=await readCp(),afterA=analyze(afterCp),afterMatches=dedupeMatches(afterCp.matches||[]),matchCountOk=afterMatches.length===beforeCount+accepted.length,completionOk=afterA.completed.includes(target.puuid),existingPreserved=beforeMatches.every(g=>afterMatches.some(x=>matchId(x)===matchId(g)));
      if(!matchCountOk||!completionOk||!existingPreserved){
        await writeCp(original);const rolled=await readCp();
        result={phase:PHASE,version:VERSION,mode:'GUARDED_ONE_ANCHOR_RECOVERY',contract:CONTRACT,ok:false,refused:false,classification:'R9_POSTCONDITION_FAILED_AUTO_ROLLED_BACK',checkpoint_written:true,rolled_back:true,riot_lcu_requests_performed:1,match_count_integrity:matchCountOk,completion_integrity:completionOk,existing_match_integrity:existingPreserved,rollback_integrity:same(beforeCpFp,fingerprint(rolled)),pre};state.lastResult=result;return result;
      }
      result={phase:PHASE,version:VERSION,mode:'GUARDED_ONE_ANCHOR_RECOVERY',contract:CONTRACT,ok:true,refused:false,classification:accepted.length?'R9_ONE_ANCHOR_RECOVERY_ACCEPTED':'R9_ONE_ANCHOR_VALID_NO_NEW_MATCHES',checkpoint_written:true,rolled_back:false,riot_lcu_requests_performed:1,target:{anchor_rank:Number(target.anchor_rank)||null,puuid_preview:mask(target.puuid)},returned_valid_matches:valid.length,target_hits:targetHits,duplicates:valid.length-fresh.length,new_unique_matches:accepted.length,checkpoint_matches_before:beforeCount,checkpoint_matches_after:afterMatches.length,completed_after:new Set(afterA.completed).size,remaining_after:afterA.remaining.length,match_count_integrity:matchCountOk,completion_integrity:completionOk,existing_match_integrity:existingPreserved,privacy:{contains_raw_puuid:false,contains_riot_id:false},production_changed:false};state.lastResult=result;return result;
    }finally{state.inFlight=false}
  }
  function status(){return{phase:PHASE,version:VERSION,contract:CONTRACT,safety:{consumed:state.consumed,in_flight:state.inFlight},last_result:state.lastResult}}
  window.aramRatingB51R9V032=Object.freeze({version:VERSION,phase:PHASE,confirmation:CONFIRM,contract:CONTRACT,collect,status});
  console.log('[ARAM Rating v0.3.2] B5.1 R9 guarded one-anchor recovery ready. This performs exactly one explicit Riot/LCU history request at most, no retry, writes only after a valid target response, preserves prior matches, and auto-rolls back on postcondition failure.');
})();
