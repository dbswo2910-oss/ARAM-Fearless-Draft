'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../..'),R=path.join(ROOT,'research/aram-rating-v032');
const FILE=path.join(R,'phase-b51r4-v032-devtools.js');
const source=fs.readFileSync(FILE,'utf8');
let pass=0;const ok=(c,m)=>{if(!c)throw new Error('B5.1 R4 PREFLIGHT AUDIT: '+m);pass++};

ok(source.includes("CONFIRM='B51R4-SECOND-ANCHOR-ONE'"),'explicit confirmation token');
ok(source.includes("limit:20,scan:100,queueMode:'standard',priority:'background'"),'exact legacy request shape');
ok(source.includes("target_selection:'second distinct valid PUUID in b51_v032_queue'"),'second-distinct target contract documented');
ok(source.includes("source:'b51_checkpoint_queue_second_distinct_anchor'"),'second anchor source explicit');
ok(source.includes('valid.length<2'),'requires at least two valid anchors');
ok(source.includes("normalizePuuid(x.puuid)!==first"),'requires target distinct from first anchor');
ok(source.includes('request_budget:1'),'request budget one');
ok(source.includes('state.consumed=true;state.inFlight=true;state.requestsUsed=1;'),'budget consumed before request');
ok((source.match(/await window\.aramDesktop\.getAramMatchHistory\(payload\)/g)||[]).length===1,'exactly one live call site');
ok(source.includes("db.transaction(STORE,'readonly')"),'checkpoint reads are readonly');
ok(!source.includes("'readwrite'")&&!source.includes('.put('),'no checkpoint writes');
ok(!source.includes('setInterval(')&&!source.includes('setTimeout('),'no retry/timer scheduler');
ok(!source.includes('fetch(')&&!source.includes('eval('),'no remote eval/fetch');
ok(source.includes("reason:'probe_budget_consumed_reload_required'"),'second same-session invocation refused');
ok(source.includes("SECOND_ANCHOR_REPRODUCED_HTTP_400")&&source.includes("SECOND_ANCHOR_ACCEPTED"),'result classification explicit');
ok(source.includes("split(s).join('[PUUID]')"),'raw PUUID redaction');
ok(source.includes('fingerprint(cpBefore)')&&source.includes('fingerprint(await readCheckpointReadonly())')&&source.includes('sameFingerprint(before,after)'),'checkpoint integrity before/after');

function fakeIndexedDb(initial){
  const holder={value:initial,reads:0,modes:[]};
  return{holder,api:{open(){const request={result:null};Promise.resolve().then(()=>{request.result={objectStoreNames:{contains:n=>n==='kv'},transaction(_s,mode){holder.modes.push(mode);return{objectStore(){return{get(){const r={};holder.reads++;Promise.resolve().then(()=>{r.result=holder.value;r.onsuccess?.()});return r}}}}},close(){}};request.onsuccess?.()});return request}}};
}
function makeContext(handler,cp){
  const idb=fakeIndexedDb(cp);let calls=0,lastPayload=null;
  const sandbox={console:{log(){},warn(){},error(){}},indexedDB:idb.api,aramDesktop:{async getAramMatchHistory(payload){calls++;lastPayload=payload;return handler(payload,idb.holder)}}};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  const ctx=vm.createContext(sandbox);new vm.Script(source,{filename:'phase-b51r4-v032-devtools.js'}).runInContext(ctx);
  return{api:ctx.aramRatingB51R4V032,calls:()=>calls,payload:()=>lastPayload,holder:idb.holder};
}
const A='A'.repeat(78),B='B'.repeat(78),C='C'.repeat(78);
const cp={schema:'aram-rating-phase-b-checkpoint-v03',matches:[{gameId:1}],b51_v032_queue:[{puuid:A,anchor_rank:1},{puuid:B,anchor_rank:2},{puuid:C,anchor_rank:3}]};

(async()=>{
  const success=makeContext(()=>({connected:true,matches:Array.from({length:20},(_,i)=>({gameId:100+i})),scanned:100,_historyLatency:{mode:'background',scan:100,limit:20,cacheHit:false,ms:12}}),cp);
  ok(success.calls()===0,'load is inert');
  const bad=await success.api.probe({token:'WRONG'});ok(bad.refused===true&&success.calls()===0,'bad token performs zero requests');
  const first=await success.api.probe({token:'B51R4-SECOND-ANCHOR-ONE'});
  ok(first.ok===true&&first.classification==='SECOND_ANCHOR_ACCEPTED'&&first.checkpoint_integrity===true,'second anchor success classified');
  ok(success.calls()===1,'exactly one request issued');
  ok(success.payload().target.puuid===B,'second distinct queue anchor selected');
  ok(success.payload().limit===20&&success.payload().scan===100&&success.payload().priority==='background'&&success.payload().queueMode==='standard','payload preserves legacy shape');
  ok(first.response.matches===20&&first.response.scanned===100,'response summarized');
  ok(!JSON.stringify(first).includes(B),'raw second-anchor PUUID absent from result');
  ok(success.holder.reads===2&&success.holder.modes.every(x=>x==='readonly'),'checkpoint read twice in readonly mode');
  const again=await success.api.probe({token:'B51R4-SECOND-ANCHOR-ONE'});ok(again.refused===true&&success.calls()===1,'same-session retry blocked');

  const failure=makeContext(()=>{throw new Error('downstream '+B+' -> 400')},cp);
  const failed=await failure.api.probe({token:'B51R4-SECOND-ANCHOR-ONE'});
  ok(failed.classification==='SECOND_ANCHOR_REPRODUCED_HTTP_400'&&failed.error.status===400&&failure.calls()===1,'400 classified on second anchor');
  ok(!JSON.stringify(failed).includes(B)&&failed.error.message.includes('[PUUID]'),'400 output redacts target');

  const tooShort=makeContext(()=>({connected:true,matches:[]}),{...cp,b51_v032_queue:[{puuid:A,anchor_rank:1}]});
  const refused=await tooShort.api.probe({token:'B51R4-SECOND-ANCHOR-ONE'});
  ok(refused.refused===true&&refused.reason==='target_or_checkpoint_preflight_failed'&&tooShort.calls()===0,'missing second anchor refuses before live request');

  const integrity=makeContext((_payload,h)=>{h.value={...h.value,matches:[...(h.value.matches||[]),{gameId:999}]};return{connected:true,matches:[]}},cp);
  const changed=await integrity.api.probe({token:'B51R4-SECOND-ANCHOR-ONE'});
  ok(changed.ok===false&&changed.checkpoint_integrity===false,'unexpected checkpoint mutation blocks success');

  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'update/manifest.json'),'utf8'));
  ok(manifest.version==='0.16.0','production version unchanged');
  ok(!(manifest.files||[]).some(x=>String(x.source||'').includes('phase-b51r4-v032-devtools')),'R4 not shipped in production manifest');

  const report={status:'SUCCESS',passes:pass,phase:'B5.1-R4',probe:'ONE_SHOT_SECOND_DISTINCT_ANCHOR',confirmation:'B51R4-SECOND-ANCHOR-ONE',request_budget:1,request:{limit:20,scan:100,queueMode:'standard',priority:'background',target:'second_distinct_b51_queue_puuid'},checkpoint_access:'readonly',checkpoint_fingerprint_before_after:true,checkpoint_written:false,storage_mutation:false,automatic_invocation:false,retry:false,r3_live_observation:'LEGACY_SHAPE_ACCEPTED_SAME_ANCHOR',live_root_cause_status:'REQUIRES_ONE_LIVE_USER_PC_SECOND_ANCHOR_PROBE',production_changed:false};
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output/aram-rating-v032-b51r4-preflight-audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`B5.1 R4 SECOND-ANCHOR PREFLIGHT AUDIT: SUCCESS · ${pass} checks`);
})().catch(e=>{console.error(e);process.exit(1)});
