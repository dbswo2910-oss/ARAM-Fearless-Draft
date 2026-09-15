'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../..'),R=path.join(ROOT,'research/aram-rating-v032');
const FILE=path.join(R,'phase-b51r2-v032-devtools.js'),source=fs.readFileSync(FILE,'utf8');
let pass=0;const ok=(condition,message)=>{if(!condition)throw new Error('B5.1 R2 PREFLIGHT AUDIT: '+message);pass++};

ok(source.includes("CONFIRM='B51R2-PROBE-ONE'"),'explicit one-shot token');
ok(source.includes('request_budget:1'),'request budget is one');
ok(source.includes('state.consumed=true;state.inFlight=true;state.requestsUsed=1;'),'budget consumed immediately before live call');
ok((source.match(/await window\.aramDesktop\.getAramMatchHistory\(payload\)/g)||[]).length===1,'exactly one live call site');
ok(source.includes("db.transaction(STORE,'readonly')"),'checkpoint access is read-only');
ok(!source.includes("'readwrite'")&&!source.includes('.put('),'no IndexedDB writes');
ok(!source.includes('localStorage')&&!source.includes('savePlayerStore')&&!source.includes('player-store:save'),'no alternate storage writes');
ok(!source.includes('setInterval(')&&!source.includes('setTimeout('),'no background timer or retry scheduler');
ok(!source.includes('fetch(')&&!source.includes('(0,eval)')&&!source.includes('eval('),'no remote fetch/eval path');
ok(source.includes('automatic_invocation:false')&&source.includes('checkpoint_written:false')&&source.includes('storage_mutation:false'),'read-only diagnostics explicit');
ok(source.includes("ipc_channel:'match-history:load'")&&source.includes("main_handler:'autoSyncCore.fetchMatchHistoryForPuuid(payload)'"),'tracked bridge contract metadata');
ok(source.includes("payload_shape:'{limit,scan,target:{puuid},queueMode,priority}'"),'B5.1 payload contract documented');
ok(source.includes("source:'b51_checkpoint_queue_anchor'")&&source.includes("source:'explicit_option'"),'deterministic target sources');
ok(source.includes("reason:'probe_budget_consumed_reload_required'"),'same-session second call refused');

function makeContext(handler){
  let calls=0,lastPayload=null;
  const sandbox={console:{log(){},warn(){},error(){}},aramDesktop:{async getAramMatchHistory(payload){calls++;lastPayload=payload;return handler(payload)}}};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  const context=vm.createContext(sandbox);new vm.Script(source,{filename:'phase-b51r2-v032-devtools.js'}).runInContext(context);
  return{api:context.aramRatingB51R2V032,calls:()=>calls,payload:()=>lastPayload};
}

(async()=>{
  const success=makeContext(()=>({connected:true,matches:[{gameId:1},{gameId:2}]}));
  ok(success.calls()===0,'script load is inert');
  const bad=await success.api.probe({token:'WRONG',puuid:'PUUID-EXPLICIT-1234567890'});
  ok(bad.refused===true&&bad.reason==='explicit_confirmation_required'&&success.calls()===0&&bad.safety.requests_used===0,'bad token performs zero live requests');
  const first=await success.api.probe({token:'B51R2-PROBE-ONE',puuid:'PUUID-EXPLICIT-1234567890'});
  ok(first.ok===true&&success.calls()===1&&first.safety.request_budget===1&&first.safety.requests_used===1&&first.safety.consumed===true,'valid probe consumes exactly one request');
  ok(success.payload().limit===20&&success.payload().scan===100&&success.payload().target.puuid==='PUUID-EXPLICIT-1234567890'&&success.payload().queueMode==='standard'&&success.payload().priority==='background','probe mirrors B5.1 request shape');
  ok(first.response.kind==='object'&&first.response.matches===2&&!JSON.stringify(first).includes('PUUID-EXPLICIT-1234567890'),'response is summarized and raw PUUID is not returned');
  const second=await success.api.probe({token:'B51R2-PROBE-ONE',puuid:'OTHER-PUUID'});
  ok(second.refused===true&&second.reason==='probe_budget_consumed_reload_required'&&success.calls()===1,'second same-session probe cannot invoke bridge');

  const failure=makeContext(()=>{throw new Error("Error invoking remote method 'match-history:load': Error: invoking remote method 'match-history:load': Error: request -> 400")});
  const failed=await failure.api.probe({token:'B51R2-PROBE-ONE',puuid:'PUUID-FAIL-1234567890'});
  ok(failure.calls()===1&&failed.ok===false&&failed.refused===false&&failed.error.status===400,'400 failure normalized after one live request');
  const failedAgain=await failure.api.probe({token:'B51R2-PROBE-ONE',puuid:'PUUID-FAIL-2'});
  ok(failure.calls()===1&&failedAgain.refused===true&&failedAgain.reason==='probe_budget_consumed_reload_required','failure also burns one-shot budget');

  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'update/manifest.json'),'utf8'));
  ok(manifest.version==='0.16.0','production version unchanged');
  ok(!(manifest.files||[]).some(x=>String(x.source||'').includes('phase-b51r2-v032-devtools')),'R2 probe not shipped in production');

  const report={status:'SUCCESS',passes:pass,phase:'B5.1-R2',probe:'ONE_SHOT_MATCH_HISTORY_PREFLIGHT',confirmation:'B51R2-PROBE-ONE',request_budget:1,bad_token_live_requests:0,valid_session_max_live_requests:1,failure_session_max_live_requests:1,checkpoint_access:'readonly',checkpoint_written:false,storage_mutation:false,automatic_invocation:false,retry:false,bridge:'window.aramDesktop.getAramMatchHistory',ipc_channel:'match-history:load',main_handler:'autoSyncCore.fetchMatchHistoryForPuuid(payload)',payload_shape:'{limit,scan,target:{puuid},queueMode,priority}',production_changed:false};
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output/aram-rating-v032-b51r2-preflight-audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`B5.1 R2 ONE-SHOT PREFLIGHT AUDIT: SUCCESS · ${pass} checks`);
})().catch(error=>{console.error(error);process.exit(1)});
