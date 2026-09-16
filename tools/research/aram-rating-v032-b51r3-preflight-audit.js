'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../..'),R=path.join(ROOT,'research/aram-rating-v032');
const FILE=path.join(R,'phase-b51r3-v032-devtools.js');
const R2=path.join(R,'phase-b51r2-v032-devtools.js');
const LEGACY=path.join(R,'phase-b51-v032-devtools.js');
const EVIDENCE=path.join(R,'evidence/b51r2-user-pc-result.json');
const PRELOAD=path.join(ROOT,'update/v0.15.117/preload.js');
const MAIN=path.join(ROOT,'update/v0.15.70/main.js');
const CONCURRENCY=path.join(ROOT,'update/v0.15.128/autosync-concurrency-v015119.js');
const source=fs.readFileSync(FILE,'utf8'),r2=fs.readFileSync(R2,'utf8'),legacy=fs.readFileSync(LEGACY,'utf8'),preload=fs.readFileSync(PRELOAD,'utf8'),main=fs.readFileSync(MAIN,'utf8'),concurrency=fs.readFileSync(CONCURRENCY,'utf8'),evidence=JSON.parse(fs.readFileSync(EVIDENCE,'utf8'));
let pass=0;const ok=(condition,message)=>{if(!condition)throw new Error('B5.1 R3 PREFLIGHT AUDIT: '+message);pass++};

// Live R2 evidence must be privacy-safe and must justify R3 rather than another blind collection run.
ok(evidence.schema==='aram-rating-v032-live-diagnostic-evidence-v1'&&evidence.phase==='B5.1-R2','R2 live evidence schema/phase');
ok(evidence.result?.classification==='ONE_SHOT_ACCEPTED'&&evidence.result?.ok===true&&evidence.result?.connected===true,'R2 live one-shot was accepted');
ok(evidence.request?.limit===1&&evidence.request?.scan===20&&evidence.request?.priority==='interactive'&&evidence.request?.requests_used===1,'R2 live evidence records reduced one-shot shape');
ok(evidence.result?.matches===1&&evidence.result?.checkpoint_integrity===true&&evidence.result?.checkpoint_written===false&&evidence.result?.storage_mutation===false,'R2 live evidence records one match and intact checkpoint');
ok(evidence.privacy?.contains_raw_puuid===false&&evidence.privacy?.contains_riot_id===false&&evidence.privacy?.contains_credentials===false,'R2 evidence is privacy-safe');
ok(evidence.legacy_b51_status==='BLOCKED_DO_NOT_RERUN','legacy B5.1 remains blocked');

// R3 is an exact one-shot replay of the old B5.1 request shape on the same deterministic queue anchor.
ok(source.includes("CONFIRM='B51R3-LEGACY-SHAPE-ONE'"),'explicit R3 confirmation token');
ok(source.includes("limit:20,scan:100,queueMode:'standard',priority:'background'"),'R3 request is exact legacy shape');
ok(source.includes("source:'b51_checkpoint_queue_anchor'")&&source.includes('queue.find(x=>puuidLooksUsable(x?.puuid))'),'R3 deterministically reuses first valid B5.1 anchor');
ok(source.includes('request_budget:1')&&source.includes('state.consumed=true;state.inFlight=true;state.requestsUsed=1;'),'R3 request budget is exactly one');
ok((source.match(/await window\.aramDesktop\.getAramMatchHistory\(payload\)/g)||[]).length===1,'R3 has exactly one live call site');
ok(source.includes("db.transaction(STORE,'readonly')"),'checkpoint access is read-only');
ok(!source.includes("'readwrite'")&&!source.includes('.put('),'R3 cannot write IndexedDB');
ok(!source.includes('localStorage')&&!source.includes('savePlayerStore')&&!source.includes('player-store:save'),'R3 has no alternate storage writes');
ok(!source.includes('setInterval(')&&!source.includes('setTimeout('),'R3 has no timer/retry scheduler');
ok(!source.includes('fetch(')&&!source.includes('(0,eval)')&&!source.includes('eval('),'R3 has no remote fetch/eval path');
ok(source.includes('fingerprint(cpBefore)')&&source.includes('fingerprint(await readCheckpointReadonly())')&&source.includes('sameFingerprint(before,after)'),'checkpoint fingerprint verified before/after');
ok(source.includes("split(s).join('[PUUID]')"),'raw PUUID is redacted from error text');
ok(source.includes("LEGACY_SHAPE_REPRODUCED_HTTP_400")&&source.includes("LEGACY_SHAPE_ACCEPTED_SAME_ANCHOR"),'R3 has explicit branch classifications');
ok(source.includes("reason:'probe_budget_consumed_reload_required'"),'same-session second R3 call refused');

// Repository-backed comparison to R2 and the old B5.1 runner.
ok(r2.includes("limit:1,scan:20,queueMode:'standard',priority:'interactive'"),'R2 known-good shape remains preserved');
ok(legacy.includes("max_matches_per_player:20")&&legacy.includes("scan:100")&&legacy.includes("limit:CFG.max_matches_per_player,scan:CFG.scan,target:{puuid:f.puuid},queueMode:'standard',priority:'background'"),'legacy B5.1 shape is limit20/scan100/background');
ok(preload.includes("getAramMatchHistory: options => ipcRenderer.invoke('match-history:load', options || {})"),'preload forwards options unchanged');
ok(main.includes("ipcMain.handle('match-history:load',(_event,opts)=>core.getAramMatchHistory(opts||{}));"),'main forwards opts to core.getAramMatchHistory');
ok(concurrency.includes("const bits=['puuid','summonerId','accountId','riotId','gameName','tagLine','name']")&&concurrency.includes('delete o.cacheOnly;delete o.priority;delete o.historyProbe;')&&concurrency.includes('oldHistory.call(this,o)'),'concurrency wrapper recognizes target.puuid, strips priority metadata, and forwards query options');

function fakeIndexedDb(initial){
  const holder={value:initial,reads:0,modes:[]};
  return{holder,api:{open(){const request={result:null};Promise.resolve().then(()=>{request.result={objectStoreNames:{contains:name=>name==='kv'},transaction(_store,mode){holder.modes.push(mode);return{objectStore(){return{get(){const q={};holder.reads++;Promise.resolve().then(()=>{q.result=holder.value;q.onsuccess?.()});return q}}}}},close(){}};request.onsuccess?.()});return request}}};
}
function makeContext(handler,initialCheckpoint){
  let calls=0,lastPayload=null;const idb=fakeIndexedDb(initialCheckpoint);
  const sandbox={console:{log(){},warn(){},error(){}},indexedDB:idb.api,aramDesktop:{async getAramMatchHistory(payload){calls++;lastPayload=payload;return handler(payload,idb.holder)}}};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  const context=vm.createContext(sandbox);new vm.Script(source,{filename:'phase-b51r3-v032-devtools.js'}).runInContext(context);
  return{api:context.aramRatingB51R3V032,calls:()=>calls,payload:()=>lastPayload,holder:idb.holder};
}
const puuidA='A'.repeat(78),puuidB='B'.repeat(78),baseCheckpoint={schema:'aram-rating-phase-b-checkpoint-v03',matches:[{gameId:1}],b51_v032_queue:[{puuid:puuidA,anchor_rank:1},{puuid:puuidB,anchor_rank:2}]};

(async()=>{
  const rows=Array.from({length:20},(_,i)=>({gameId:100+i}));
  const success=makeContext(()=>({connected:true,matches:rows,scanned:100,_historyLatency:{mode:'background',scan:100,limit:20,cacheHit:false,ms:321}}),baseCheckpoint);
  ok(success.calls()===0,'script load is inert');
  const bad=await success.api.probe({token:'WRONG'});
  ok(bad.refused===true&&bad.reason==='explicit_confirmation_required'&&success.calls()===0,'bad token performs zero requests');
  const first=await success.api.probe({token:'B51R3-LEGACY-SHAPE-ONE'});
  ok(first.ok===true&&first.classification==='LEGACY_SHAPE_ACCEPTED_SAME_ANCHOR'&&first.checkpoint_integrity===true,'accepted legacy-shape result classified correctly');
  ok(success.calls()===1&&success.payload().limit===20&&success.payload().scan===100&&success.payload().priority==='background'&&success.payload().queueMode==='standard'&&success.payload().target.puuid===puuidA,'synthetic live call uses exact legacy shape and first anchor');
  ok(first.response.matches===20&&first.response.scanned===100&&first.response.history_latency.mode==='background'&&first.response.history_latency.scan===100&&first.response.history_latency.limit===20,'successful response is summarized with legacy-shape latency metadata');
  ok(!JSON.stringify(first).includes(puuidA)&&first.target.puuid_preview!==puuidA,'successful result does not leak raw PUUID');
  ok(success.holder.reads===2&&success.holder.modes.every(x=>x==='readonly'),'successful R3 reads checkpoint exactly before/after in readonly mode');
  const second=await success.api.probe({token:'B51R3-LEGACY-SHAPE-ONE'});
  ok(second.refused===true&&second.reason==='probe_budget_consumed_reload_required'&&success.calls()===1,'second same-session R3 call is refused');

  const failure=makeContext(()=>{throw new Error("Error invoking remote method 'match-history:load': Error: "+puuidA+' -> 400')},baseCheckpoint);
  const failed=await failure.api.probe({token:'B51R3-LEGACY-SHAPE-ONE'});
  ok(failure.calls()===1&&failed.ok===false&&failed.error.status===400&&failed.classification==='LEGACY_SHAPE_REPRODUCED_HTTP_400','HTTP 400 is normalized and classified as legacy-shape reproduction');
  ok(!JSON.stringify(failed).includes(puuidA)&&failed.error.message.includes('[PUUID]'),'400 path redacts raw PUUID');

  const integrity=makeContext((_payload,holder)=>{holder.value={...holder.value,matches:[...(holder.value.matches||[]),{gameId:999}]};return{connected:true,matches:[]}},baseCheckpoint);
  const changed=await integrity.api.probe({token:'B51R3-LEGACY-SHAPE-ONE'});
  ok(integrity.calls()===1&&changed.ok===false&&changed.checkpoint_integrity===false,'unexpected checkpoint mutation blocks success');

  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'update/manifest.json'),'utf8'));
  ok(manifest.version==='0.16.0','branch production version remains v0.16.0');
  ok(!(manifest.files||[]).some(x=>String(x.source||'').includes('phase-b51r3-v032-devtools')),'R3 diagnostic is not shipped in production manifest');

  const report={status:'SUCCESS',passes:pass,phase:'B5.1-R3',probe:'ONE_SHOT_EXACT_LEGACY_SHAPE_REPLAY',confirmation:'B51R3-LEGACY-SHAPE-ONE',r2_live_result:'ONE_SHOT_ACCEPTED',r2_request:{limit:1,scan:20,queueMode:'standard',priority:'interactive'},r3_request:{limit:20,scan:100,queueMode:'standard',priority:'background'},request_budget:1,target_selection:'first valid existing b51_v032_queue anchor',checkpoint_access:'readonly',checkpoint_fingerprint_before_after:true,checkpoint_written:false,storage_mutation:false,automatic_invocation:false,retry:false,legacy_b51_status:'BLOCKED_DO_NOT_RERUN',decision_if_accepted:'investigate later anchors or repeated-request/retry sequencing',decision_if_http_400:'split scan versus limit with another one-shot diagnostic',production_changed:false,live_root_cause_status:'REQUIRES_ONE_R3_LIVE_USER_PC_PROBE'};
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output/aram-rating-v032-b51r3-preflight-audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`B5.1 R3 EXACT LEGACY-SHAPE PREFLIGHT AUDIT: SUCCESS · ${pass} checks · one live user-PC probe remains`);
})().catch(error=>{console.error(error);process.exit(1)});
