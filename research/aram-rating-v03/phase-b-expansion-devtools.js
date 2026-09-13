'use strict';
/* ARAM Rating v0.3 research-only bounded expansion helper. Not referenced by production manifest/UI. */
(()=>{
  const RUN_LOCK_KEY='__ARAM_RATING_PHASE_B_SINGLE_INSTANCE_V03__';
  if(globalThis[RUN_LOCK_KEY]?.active){console.warn('Phase B already running');return}
  const bootToken=`boot-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  globalThis[RUN_LOCK_KEY]={active:true,token:bootToken,started_at:new Date().toISOString(),kind:'bootstrap'};
  const releaseLock=token=>{if(globalThis[RUN_LOCK_KEY]?.token===token)delete globalThis[RUN_LOCK_KEY]};

  (async()=>{
    const CORE_URL='https://raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/research/aram-rating-v03-network-expansion/research/aram-rating-v03/collector-core.js';
    const SEED_KEY='phase-a-seed-v02',CHECKPOINT_KEY='checkpoint-v03';
    const EXPECTED_SEED_MATCHES=20,EXPECTED_SEED_PLAYERS=160;
    const DEFAULTS={phase:'B1',maxExpandedPlayers:10,maxMatchesPerPlayer:20,maxAcceptedMatches:500,maxRequests:30,requestTimeoutMs:15000,retryLimit:2,cooldownMs:1800,overallTimeoutMs:10*60*1000,scan:100};
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    let activeRuntime=null;

    async function ensureCore(){if(globalThis.ARAMRatingPhaseBCore)return globalThis.ARAMRatingPhaseBCore;const text=await fetch(CORE_URL+'?ts='+Date.now()).then(r=>{if(!r.ok)throw new Error('collector-core fetch failed');return r.text()});(0,eval)(text);if(!globalThis.ARAMRatingPhaseBCore)throw new Error('collector core unavailable');return globalThis.ARAMRatingPhaseBCore}
    function dbOpen(){return new Promise((resolve,reject)=>{const req=indexedDB.open('aram-rating-research-v03',1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('kv'))db.createObjectStore('kv')};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
    async function kvGet(key){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction('kv','readonly'),r=tx.objectStore('kv').get(key);r.onsuccess=()=>{db.close();resolve(r.result||null)};r.onerror=()=>{db.close();reject(r.error)}})}
    async function kvSet(key,val){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(val,key);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
    async function kvDel(key){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').delete(key);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
    function stamp(d=new Date()){const z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}${z(d.getMonth()+1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`}
    async function download(envelope){const name=`aram-rating-phase-b-${stamp()}.json`,text=JSON.stringify(envelope,null,2);let downloaded=false,copied=false;try{const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);downloaded=true}catch{}if(!downloaded){try{if(typeof copy==='function'){copy(text);copied=true}}catch{}if(!copied)try{await navigator.clipboard.writeText(text);copied=true}catch{}}return {filename:name,downloaded,copied}}
    function timeout(p,ms){let id;return Promise.race([Promise.resolve(p).finally(()=>clearTimeout(id)),new Promise((_,rej)=>{id=setTimeout(()=>rej(new Error('request_timeout')),ms)})])}
    function publicStats(C,checkpoint){const before=checkpoint.before_kpis,after=C.kpis(checkpoint.matches);return {before,after,accepted_total:after.matches,new_unique_matches:Math.max(0,after.matches-before.matches),improved_directionally:after.single_match_fraction<before.single_match_fraction||after.players_2_plus>before.players_2_plus}}
    function consoleStart(cp,resumed){console.log(`\nPhase B Research Expansion\n\nSeed matches: ${cp.before_kpis.matches}\nSeed players: ${cp.before_kpis.players}\nSeed source: imported Phase A JSON\nCheckpoint: ${resumed?'resume':'new'}\n`)}
    function consoleProgress(C,checkpoint,idx,total,last){const k=C.kpis(checkpoint.matches);console.log(`\nPhase B Research Expansion\n\nSeed matches: ${checkpoint.before_kpis.matches}\nSeed players: ${checkpoint.before_kpis.players}\n\nExpanding ${idx}/${total}\nNew matches: +${last?.new_unique_matches||0}\nDuplicates: ${last?.duplicates||0}\n\nTotal accepted: ${k.matches} / ${checkpoint.config.maxAcceptedMatches}\nPlayers with 2+ games: ${k.players_2_plus}\nSingle-match rate: ${(k.single_match_fraction*100).toFixed(2)}%`)}
    async function fetchHistory(opts,cfg,runtime){if(runtime.aborted)throw new Error('manual_abort');if(runtime.cumulativeRequests>=cfg.maxRequests)throw new Error('max_request_count');runtime.requests++;runtime.cumulativeRequests++;if(runtime.persistRequestCount)await runtime.persistRequestCount(runtime.cumulativeRequests);return timeout(window.aramDesktop.getAramMatchHistory(opts),cfg.requestTimeoutMs)}

    function choosePhaseAJson(){return new Promise((resolve,reject)=>{const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.style.display='none';document.body.appendChild(input);input.addEventListener('change',()=>{const file=input.files?.[0]||null;input.remove();if(file)resolve(file);else reject(new Error('phase_a_seed_file_not_selected'))},{once:true});input.click()})}
    async function importPhaseAFile(file){
      const C=await ensureCore();let envelope;
      try{envelope=JSON.parse(await file.text())}catch{throw new Error('phase_a_seed_invalid_json')}
      const imported=C.phaseASeedFromEnvelope(envelope,{expectedMatches:EXPECTED_SEED_MATCHES,expectedPlayers:EXPECTED_SEED_PLAYERS});
      const record={...imported,imported_at:new Date().toISOString(),source_filename:String(file.name||'phase-a.json')};
      const existing=await kvGet(CHECKPOINT_KEY);if(existing&&existing.seed_fingerprint!==record.fingerprint){await kvDel(CHECKPOINT_KEY);console.warn('[ARAM Rating Phase B] stale checkpoint cleared because the imported Phase A seed changed.')}
      await kvSet(SEED_KEY,record);
      console.log(`[ARAM Rating Phase B] Phase A seed imported. Seed matches: ${record.kpis.matches} / Seed players: ${record.kpis.players}`);
      return {matches:record.kpis.matches,players:record.kpis.players,single_match_rate:record.kpis.single_match_fraction,largest_component_players:record.kpis.largest_component_players};
    }
    async function importPhaseA(){const file=await choosePhaseAJson();return importPhaseAFile(file)}
    async function loadImportedSeed(C){
      const record=await kvGet(SEED_KEY);if(!record)throw new Error('phase_a_seed_required');
      if(record.schema!=='aram-rating-phase-a-import-v03'||!Array.isArray(record.matches))throw new Error('phase_a_seed_storage_invalid_reimport_required');
      const stats=C.kpis(record.matches),fingerprint=C.seedFingerprint(record.matches);
      if(stats.matches!==EXPECTED_SEED_MATCHES||stats.players!==EXPECTED_SEED_PLAYERS)throw new Error(`phase_a_seed_storage_mismatch_expected_${EXPECTED_SEED_MATCHES}_matches_${EXPECTED_SEED_PLAYERS}_players_got_${stats.matches}_${stats.players}`);
      if(record.fingerprint!==fingerprint)throw new Error('phase_a_seed_storage_fingerprint_mismatch');
      return {...record,kpis:stats,fingerprint};
    }
    async function capabilityProbe(C,cfg,runtime,target){try{const r=await fetchHistory({limit:30,scan:150,target,queueMode:'standard',priority:'background'},cfg,runtime);const rows=C.dedupeMatches(C.standardMatches(r?.matches||[]));return {requested_limit:30,requested_scan:150,returned_standard_matches:rows.length,reported_scanned:Number(r?.scanned)||null,pagination_exposed:false,note:'observational probe only; no cursor/paging contract is exposed by the current bridge'}}catch(e){return {requested_limit:30,error:String(e?.message||e),pagination_exposed:false}}}

    async function runInternal(user={}){
      if(!window.aramDesktop?.getAramMatchHistory)throw new Error('desktop match-history bridge unavailable');
      const C=await ensureCore(),imported=await loadImportedSeed(C),seed=imported.matches;
      const cfg={...DEFAULTS,...user};cfg.phase=String(cfg.phase||'B1').toUpperCase();if(cfg.phase==='B1')cfg.maxExpandedPlayers=Math.min(10,Math.max(1,Number(cfg.maxExpandedPlayers)||10));else cfg.maxExpandedPlayers=Math.min(50,Math.max(25,Number(cfg.maxExpandedPlayers)||25));cfg.maxMatchesPerPlayer=Math.min(20,Math.max(1,Number(cfg.maxMatchesPerPlayer)||20));cfg.maxAcceptedMatches=Math.min(500,Math.max(EXPECTED_SEED_MATCHES,Number(cfg.maxAcceptedMatches)||500));const requestedCalls=Number(user.maxRequests)||DEFAULTS.maxRequests;cfg.maxRequests=cfg.phase==='B1'?Math.min(30,Math.max(cfg.maxExpandedPlayers,requestedCalls)):Math.min(150,Math.max(cfg.maxExpandedPlayers*3,requestedCalls));
      const runtime={aborted:false,requests:0,cumulativeRequests:0,persistRequestCount:null,started:Date.now()};activeRuntime=runtime;
      const fingerprint=imported.fingerprint;let cp=await kvGet(CHECKPOINT_KEY),resumed=Boolean(cp&&cp.seed_fingerprint===fingerprint);
      if(!cp||cp.seed_fingerprint!==fingerprint){const ranked=C.scoreCandidates(seed);cp={schema:'aram-rating-phase-b-checkpoint-v03',seed_source:'imported_phase_a_json',seed_fingerprint:fingerprint,created_at:new Date().toISOString(),phase:cfg.phase,config:cfg,seed_matches:seed,matches:seed.slice(),acceptance_order_match_ids:seed.map(C.matchId),candidate_order:ranked.map(x=>x.puuid),candidate_meta:Object.fromEntries(ranked.map((x,i)=>[x.puuid,{label:`Player ${String(i+1).padStart(3,'0')}`,priority:x.priority,components:x.components,appearances:x.appearances,known_degree:x.known_degree,is_articulation:x.is_articulation}])),completed_puuids:[],expansion_logs:[],before_kpis:C.kpis(seed),capability_probe:null,request_count_total:0,status:'collecting'};await kvSet(CHECKPOINT_KEY,cp)}
      runtime.cumulativeRequests=resumed?Number(cp.request_count_total)||0:0;cp.request_count_total=runtime.cumulativeRequests;runtime.persistRequestCount=async n=>{cp.request_count_total=n;await kvSet(CHECKPOINT_KEY,cp)};await kvSet(CHECKPOINT_KEY,cp);
      consoleStart(cp,resumed);
      if(cp.before_kpis.matches!==EXPECTED_SEED_MATCHES||cp.before_kpis.players!==EXPECTED_SEED_PLAYERS)throw new Error('phase_a_seed_checkpoint_shape_invalid');
      if(cfg.phase==='B2'&&cp.phase==='B1'){const prev=publicStats(C,cp);if(!prev.improved_directionally||prev.new_unique_matches<=0)throw new Error('phase_b2_not_allowed_b1_did_not_improve_repeat_observation_kpis')}
      cp.phase=cfg.phase;cp.status='collecting';cp.config={...cp.config,...cfg};
      if(!cp.capability_probe){const probePuuid=cp.candidate_order?.[0];if(!probePuuid)throw new Error('phase_a_seed_has_no_expansion_candidates');cp.capability_probe=await capabilityProbe(C,cfg,runtime,{puuid:probePuuid});await kvSet(CHECKPOINT_KEY,cp)}
      const observed=cp.expansion_logs.filter(x=>x.puuid_local),fetchedTotal=observed.reduce((a,x)=>a+(Number(x.fetched_matches)||0),0),duplicateTotal=observed.reduce((a,x)=>a+(Number(x.duplicates)||0),0),requestTotal=observed.reduce((a,x)=>a+(Number(x.requests)||0),0),retryTotal=observed.reduce((a,x)=>a+(Number(x.retries)||0),0),historyStats=Object.fromEntries(observed.map(x=>[x.puuid_local,{duplicate_rate:x.fetched_matches?x.duplicates/x.fetched_matches:0,retries:x.retries||0}]));historyStats.__cohort={duplicate_rate:fetchedTotal?duplicateTotal/fetchedTotal:0,retry_rate:requestTotal?retryTotal/requestTotal:0};const rankedNow=C.scoreCandidates(cp.seed_matches,historyStats),selectedNow=rankedNow.slice(0,cfg.maxExpandedPlayers),allowed=new Set(selectedNow.map(x=>x.puuid)),rankMeta=new Map(selectedNow.map((x,i)=>[x.puuid,{...x,label:(cp.candidate_meta[x.puuid]||{}).label||`Player ${String(i+1).padStart(3,'0')}`}])) ,pending=selectedNow.map(x=>x.puuid).filter(p=>!cp.completed_puuids.includes(p)),total=selectedNow.length;
      for(let pi=0;pi<pending.length;pi++){
        if(runtime.aborted){cp.status='manual_abort';break}if(Date.now()-runtime.started>cfg.overallTimeoutMs){cp.status='overall_timeout';break}if(C.kpis(cp.matches).matches>=cfg.maxAcceptedMatches){cp.status='hard_cap_reached';break}
        const puuid=pending[pi],meta=rankMeta.get(puuid)||cp.candidate_meta[puuid]||{label:'Player'},idx=cp.completed_puuids.filter(x=>allowed.has(x)).length+1;let result=null,lastErr='',attempts=0;
        for(let attempt=0;attempt<=cfg.retryLimit;attempt++){attempts=attempt+1;try{const r=await fetchHistory({limit:cfg.maxMatchesPerPlayer,scan:cfg.scan,target:{puuid},queueMode:'standard',priority:'background'},cfg,runtime);if(r?.connected===false)throw new Error('league_client_unavailable');const bounded=C.dedupeMatches(C.standardMatches(r?.matches||[])).slice(0,cfg.maxMatchesPerPlayer);const merged=C.mergeExpansion(cp.matches,bounded,puuid);if(!merged.valid.length)throw new Error('empty_target_history');if(merged.target_hits===0){cp.status='blocked_by_data_source';lastErr='returned history does not belong to requested PUUID';break}result=merged;break}catch(e){lastErr=String(e?.message||e);if(['manual_abort','max_request_count'].includes(lastErr)){cp.status=lastErr;break}if(attempt<cfg.retryLimit)await sleep(cfg.cooldownMs*Math.pow(2,attempt))}}
        if(cp.status==='blocked_by_data_source'||cp.status==='manual_abort'||cp.status==='max_request_count')break;
        if(!result&&lastErr==='empty_target_history'){cp.status='blocked_by_data_source';await kvSet(CHECKPOINT_KEY,cp);break}
        if(!result){cp.expansion_logs.push({candidate:meta.label,puuid_local:puuid,requests:attempts,retries:Math.max(0,attempts-1),fetched_matches:0,new_unique_matches:0,duplicates:0,new_players:0,already_known_player_appearances:0,information_gain:0,error:lastErr});cp.completed_puuids.push(puuid);await kvSet(CHECKPOINT_KEY,cp);continue}
        const room=Math.max(0,cfg.maxAcceptedMatches-C.kpis(cp.matches).matches),accepted=result.new_matches.slice(0,room);cp.matches=C.dedupeMatches([...cp.matches,...accepted]);for(const g of accepted){const id=C.matchId(g);if(id&&!cp.acceptance_order_match_ids.includes(id))cp.acceptance_order_match_ids.push(id)}
        const log={candidate:meta.label,puuid_local:puuid,priority:meta.priority,priority_components:meta.components,requests:attempts,retries:Math.max(0,attempts-1),fetched_matches:result.valid.length,new_unique_matches:accepted.length,duplicates:result.duplicates.length,new_players:result.new_players,already_known_player_appearances:result.already_known_player_appearances,threshold_crossings:result.threshold_crossings,information_gain:result.information_gain};cp.expansion_logs.push(log);cp.completed_puuids.push(puuid);await kvSet(CHECKPOINT_KEY,cp);consoleProgress(C,cp,idx,total,log);if(C.kpis(cp.matches).matches>=cfg.maxAcceptedMatches){cp.status='hard_cap_reached';break}await sleep(cfg.cooldownMs)
      }
      if(cp.status==='collecting')cp.status=cp.completed_puuids.filter(x=>allowed.has(x)).length>=total?'phase_complete':'paused';cp.finished_at=new Date().toISOString();await kvSet(CHECKPOINT_KEY,cp);
      const ks=publicStats(C,cp),safeLogs=cp.expansion_logs.map(({puuid_local,...x})=>x),envelope={schema:'aram-rating-phase-b-real-sample-v03',metadata:{source:'local_running_app_existing_history_bridge',seed_source:'imported_phase_a_json',region:'KR',queue:450,phase:cfg.phase,status:cp.status,exported_at:new Date().toISOString(),seed_matches:cp.before_kpis.matches,seed_players:cp.before_kpis.players,accepted_matches:ks.after.matches,hard_cap:cfg.maxAcceptedMatches,requests_used_this_run:runtime.requests,requests_used_total:runtime.cumulativeRequests,identity:'PUUID canonical locally; raw identity remains only in this local research file/checkpoint',production_ui_modified:false},capability_probe:cp.capability_probe,safety_limits:{max_expanded_players:cfg.maxExpandedPlayers,max_matches_per_player:cfg.maxMatchesPerPlayer,max_total_accepted_matches:cfg.maxAcceptedMatches,max_request_count:cfg.maxRequests,request_timeout_ms:cfg.requestTimeoutMs,retry_limit:cfg.retryLimit,cooldown_ms:cfg.cooldownMs,overall_timeout_ms:cfg.overallTimeoutMs,checkpoint:'IndexedDB aram-rating-research-v03 / checkpoint-v03',phase_a_seed:'IndexedDB aram-rating-research-v03 / phase-a-seed-v02',manual_abort:'window.aramRatingPhaseB.abort()'},kpis:ks,expansion_logs:safeLogs,acceptance_order_match_ids:cp.acceptance_order_match_ids,matches:cp.matches};
      const io=await download(envelope);globalThis.__ARAM_RATING_PHASE_B_LAST_V03__={envelope,io};console.log('[ARAM Rating v0.3 Phase B] finished',{status:cp.status,...io,kpis:ks});if(cp.status==='blocked_by_data_source')console.error('[ARAM Rating v0.3] blocked_by_data_source: current existing-program history path did not return the requested participant history. No fallback source was attempted.');return globalThis.__ARAM_RATING_PHASE_B_LAST_V03__
    }

    async function guardedRun(user={}){
      if(globalThis[RUN_LOCK_KEY]?.active){console.warn('Phase B already running');return {status:'already_running'}}
      const token=`run-${Date.now()}-${Math.random().toString(36).slice(2)}`;globalThis[RUN_LOCK_KEY]={active:true,token,started_at:new Date().toISOString(),kind:'collector'};
      try{return await runInternal(user)}finally{activeRuntime=null;releaseLock(token)}
    }
    async function importPhaseAAndRun(user={}){await importPhaseA();return guardedRun(user)}
    async function clearResearchSeed(){await kvDel(SEED_KEY);await kvDel(CHECKPOINT_KEY);console.log('[ARAM Rating Phase B] imported Phase A seed and checkpoint cleared.')}
    const api={run:guardedRun,importPhaseA,importPhaseAAndRun,abort:()=>{if(activeRuntime){activeRuntime.aborted=true;console.warn('[ARAM Rating Phase B] manual abort requested; no new history requests will start.')}},clearCheckpoint:()=>kvDel(CHECKPOINT_KEY),getCheckpoint:()=>kvGet(CHECKPOINT_KEY),getImportedSeed:()=>kvGet(SEED_KEY),clearImportedSeed:clearResearchSeed};
    globalThis.aramRatingPhaseB=api;

    const existingSeed=await kvGet(SEED_KEY);
    if(!existingSeed){console.warn('[ARAM Rating Phase B] Phase A seed required. Run: await aramRatingPhaseB.importPhaseAAndRun() and select aram-rating-real-sample-20260914-0104.json');return {status:'phase_a_seed_required'}}
    return runInternal({});
  })().catch(e=>{console.error('[ARAM Rating v0.3 Phase B] failed',String(e?.message||e));throw e}).finally(()=>{releaseLock(bootToken)});
})();
