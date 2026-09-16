'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../..'),R=path.join(ROOT,'research/aram-rating-v032');
const FILE=path.join(R,'phase-b51r2-v032-devtools.js');
const LEGACY=path.join(R,'phase-b51-v032-devtools.js');
const PRELOAD=path.join(ROOT,'update/v0.15.117/preload.js');
const MAIN=path.join(ROOT,'update/v0.15.70/main.js');
const CONCURRENCY=path.join(ROOT,'update/v0.15.128/autosync-concurrency-v015119.js');
const BASE_CORE=path.join(ROOT,'update/v0.15.70/autosync-core.js');
const source=fs.readFileSync(FILE,'utf8'),legacy=fs.readFileSync(LEGACY,'utf8'),preload=fs.readFileSync(PRELOAD,'utf8'),main=fs.readFileSync(MAIN,'utf8'),concurrency=fs.readFileSync(CONCURRENCY,'utf8');
let pass=0;const ok=(condition,message)=>{if(!condition)throw new Error('B5.1 R2 PREFLIGHT AUDIT: '+message);pass++};

// Static one-shot and read-only contract.
ok(source.includes("CONFIRM='B51R2-PROBE-ONE'"),'explicit one-shot token');
ok(source.includes('request_budget:1'),'request budget is one');
ok(source.includes('state.consumed=true;state.inFlight=true;state.requestsUsed=1;'),'budget consumed before live call');
ok((source.match(/await window\.aramDesktop\.getAramMatchHistory\(payload\)/g)||[]).length===1,'exactly one live call site');
ok(source.includes("db.transaction(STORE,'readonly')"),'checkpoint access is read-only');
ok(!source.includes("'readwrite'")&&!source.includes('.put('),'no IndexedDB writes');
ok(!source.includes('localStorage')&&!source.includes('savePlayerStore')&&!source.includes('player-store:save'),'no alternate storage writes');
ok(!source.includes('setInterval(')&&!source.includes('setTimeout('),'no background timer or retry scheduler');
ok(!source.includes('fetch(')&&!source.includes('(0,eval)')&&!source.includes('eval('),'no remote fetch/eval path');
ok(source.includes('fingerprint(cpBefore)')&&source.includes('fingerprint(await readCheckpointReadonly())')&&source.includes('sameFingerprint(before,after)'),'checkpoint fingerprint verified before and after');
ok(source.includes("split(s).join('[PUUID]')"),'raw PUUID is redacted from downstream error text');
ok(source.includes("classification=classify(error,response)")&&source.includes("HTTP_400_AFTER_VERIFIED_RENDERER_IPC_MAIN_WRAPPER_PATH"),'400 result is explicitly classified');
ok(source.includes("limit:1,scan:20,queueMode:'standard',priority:'interactive'"),'probe uses reduced diagnostic request');
ok(source.includes("previous_b51_shape:'{limit:20,scan:100,target:{puuid},queueMode:\"standard\",priority:\"background\"}'"),'legacy failed request shape is documented');
ok(legacy.includes("limit:CFG.max_matches_per_player,scan:CFG.scan,target:{puuid:f.puuid},queueMode:'standard',priority:'background'")&&legacy.includes('scan:100'),'old B5.1 45-request shape is preserved only as evidence');
ok(source.includes("reason:'probe_budget_consumed_reload_required'"),'same-session second call refused');

// Repository-backed bridge evidence. Do not invent an untracked downstream core contract.
ok(preload.includes("getAramMatchHistory: options => ipcRenderer.invoke('match-history:load', options || {})"),'preload forwards renderer options unchanged to match-history IPC');
ok(main.includes("ipcMain.handle('match-history:load',(_event,opts)=>core.getAramMatchHistory(opts||{}));"),'main handler forwards opts to core.getAramMatchHistory');
ok(concurrency.includes("const oldHistory=Core.prototype.getAramMatchHistory;")&&concurrency.includes("const bits=['puuid','summonerId','accountId','riotId','gameName','tagLine','name']")&&concurrency.includes('oldHistory.call(this,o)'),'concurrency wrapper recognizes target.puuid and forwards options to installed base core');
ok(source.includes("main_handler:'core.getAramMatchHistory(opts||{})'")&&source.includes("concurrency_wrapper:'Core.prototype.getAramMatchHistory(opts) -> oldHistory.call(this,o)'"),'probe metadata matches tracked runtime sources');
ok(!fs.existsSync(BASE_CORE),'installed base autosync-core source is not tracked at update/v0.15.70/autosync-core.js');
ok(source.includes('downstream_base_core_source_tracked:false')&&source.includes('tracked_downstream_endpoint:false'),'untracked downstream boundary is explicit');

function fakeIndexedDb(initial){
  const holder={value:initial,reads:0,modes:[]};
  return{
    holder,
    api:{
      open(){
        const request={result:null};
        Promise.resolve().then(()=>{
          request.result={
            objectStoreNames:{contains:name=>name==='kv'},
            transaction(_store,mode){
              holder.modes.push(mode);
              return{objectStore(){return{get(){
                const getRequest={};holder.reads++;
                Promise.resolve().then(()=>{getRequest.result=holder.value;getRequest.onsuccess?.()});
                return getRequest;
              }}}};
            },
            close(){}
          };
          request.onsuccess?.();
        });
        return request;
      }
    }
  };
}
function makeContext(handler,initialCheckpoint){
  let calls=0,lastPayload=null;const idb=fakeIndexedDb(initialCheckpoint);
  const sandbox={console:{log(){},warn(){},error(){}},indexedDB:idb.api,aramDesktop:{async getAramMatchHistory(payload){calls++;lastPayload=payload;return handler(payload,idb.holder)}}};
  sandbox.window=sandbox;sandbox.globalThis=sandbox;
  const context=vm.createContext(sandbox);new vm.Script(source,{filename:'phase-b51r2-v032-devtools.js'}).runInContext(context);
  return{api:context.aramRatingB51R2V032,calls:()=>calls,payload:()=>lastPayload,holder:idb.holder};
}
const puuidA='A'.repeat(78),puuidB='B'.repeat(78),baseCheckpoint={schema:'aram-rating-phase-b-checkpoint-v03',matches:[{gameId:1}],b51_v032_queue:[{puuid:puuidA,anchor_rank:1}]};

(async()=>{
  const success=makeContext(()=>({connected:true,matches:[{gameId:11}],_historyLatency:{mode:'interactive',scan:20,limit:1,cacheHit:false}}),baseCheckpoint);
  ok(success.calls()===0,'script load is inert');
  const bad=await success.api.probe({token:'WRONG',puuid:puuidA});
  ok(bad.refused===true&&bad.reason==='explicit_confirmation_required'&&success.calls()===0&&bad.safety.requests_used===0,'bad token performs zero live requests');
  const first=await success.api.probe({token:'B51R2-PROBE-ONE',puuid:puuidA});
  ok(first.ok===true&&first.checkpoint_integrity===true&&success.calls()===1&&first.safety.request_budget===1&&first.safety.requests_used===1&&first.safety.consumed===true,'valid probe consumes exactly one request with unchanged checkpoint');
  ok(success.payload().limit===1&&success.payload().scan===20&&success.payload().target.puuid===puuidA&&success.payload().queueMode==='standard'&&success.payload().priority==='interactive','one-shot request is reduced while preserving target.puuid contract');
  ok(first.response.kind==='object'&&first.response.matches===1&&first.response.history_latency.scan===20&&!JSON.stringify(first).includes(puuidA),'successful result is summarized and raw PUUID is not returned');
  ok(success.holder.reads===2&&success.holder.modes.every(x=>x==='readonly'),'synthetic successful probe reads checkpoint exactly before/after in readonly mode');
  const second=await success.api.probe({token:'B51R2-PROBE-ONE',puuid:puuidB});
  ok(second.refused===true&&second.reason==='probe_budget_consumed_reload_required'&&success.calls()===1,'second same-session probe cannot invoke bridge');

  const failure=makeContext((_payload)=>{throw new Error("Error invoking remote method 'match-history:load': Error: "+puuidA+' -> 400')},baseCheckpoint);
  const failed=await failure.api.probe({token:'B51R2-PROBE-ONE',puuid:puuidA});
  ok(failure.calls()===1&&failed.ok===false&&failed.refused===false&&failed.error.status===400&&failed.classification==='HTTP_400_AFTER_VERIFIED_RENDERER_IPC_MAIN_WRAPPER_PATH','400 failure is normalized and classified after one request');
  ok(!JSON.stringify(failed).includes(puuidA)&&failed.error.message.includes('[PUUID]'),'400 diagnostic redacts raw PUUID');
  const failedAgain=await failure.api.probe({token:'B51R2-PROBE-ONE',puuid:puuidB});
  ok(failure.calls()===1&&failedAgain.refused===true,'failure also burns one-shot budget');

  const integrity=makeContext((_payload,holder)=>{holder.value={...holder.value,matches:[...(holder.value.matches||[]),{gameId:99}]};return{connected:true,matches:[]}},baseCheckpoint);
  const changed=await integrity.api.probe({token:'B51R2-PROBE-ONE',puuid:puuidA});
  ok(integrity.calls()===1&&changed.ok===false&&changed.checkpoint_integrity===false,'unexpected checkpoint mutation is detected and blocks success');

  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'update/manifest.json'),'utf8'));
  ok(manifest.version==='0.16.0','branch production version remains v0.16.0');
  ok(!(manifest.files||[]).some(x=>String(x.source||'').includes('phase-b51r2-v032-devtools')),'R2 probe is not shipped in production manifest');
  ok(!(manifest.files||[]).some(x=>String(x.path||'')==='autosync-core.js'),'base autosync-core remains an installed-base dependency, not a tracked update source');

  const report={status:'SUCCESS',passes:pass,phase:'B5.1-R2',probe:'ONE_SHOT_MATCH_HISTORY_DIAGNOSTIC',confirmation:'B51R2-PROBE-ONE',request_budget:1,legacy_b51_status:'BLOCKED_DO_NOT_RERUN',legacy_failed_request_budget:45,diagnostic_request:{limit:1,scan:20,queueMode:'standard',priority:'interactive',target:'{puuid}'},checkpoint_access:'readonly',checkpoint_fingerprint_before_after:true,checkpoint_written:false,storage_mutation:false,automatic_invocation:false,retry:false,bridge:'window.aramDesktop.getAramMatchHistory',ipc_channel:'match-history:load',main_handler:'core.getAramMatchHistory(opts||{})',concurrency_wrapper:'target.puuid recognized; options forwarded to oldHistory',downstream_base_core_source_tracked:false,live_root_cause_status:'REQUIRES_ONE_LIVE_USER_PC_PROBE',production_changed:false};
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output/aram-rating-v032-b51r2-preflight-audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`B5.1 R2 ONE-SHOT PREFLIGHT AUDIT: SUCCESS · ${pass} checks · live root cause still requires exactly one user-PC probe`);
})().catch(error=>{console.error(error);process.exit(1)});
