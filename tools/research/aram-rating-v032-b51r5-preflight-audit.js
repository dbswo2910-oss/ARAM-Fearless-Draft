'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../..'),FILE=path.join(ROOT,'research/aram-rating-v032/phase-b51r5-v032-devtools.js');
const source=fs.readFileSync(FILE,'utf8');let pass=0;const ok=(c,m)=>{if(!c)throw new Error('B5.1 R5 PREFLIGHT AUDIT: '+m);pass++};
ok(source.includes("CONFIRM='B51R5-SEQUENCE-TWO'"),'explicit token');
ok(source.includes('request_budget:2'),'two-request budget');
ok(source.includes("db.transaction(STORE,'readonly')"),'checkpoint readonly');
ok(!source.includes("'readwrite'")&&!source.includes('.put('),'no checkpoint writes');
ok(!source.includes('setInterval(')&&!source.includes('setTimeout('),'no retry/background scheduler');
ok(source.includes("return'SEQUENCE_TWO_ACCEPTED'")&&source.includes("SEQUENCE_SECOND_HTTP_400_AFTER_FIRST_ACCEPTED"),'sequence classifications');

function fakeIndexedDb(cp){return{open(){const q={};Promise.resolve().then(()=>{q.result={objectStoreNames:{contains:n=>n==='kv'},transaction(_s,mode){if(mode!=='readonly')throw new Error('non-readonly');return{objectStore(){return{get(){const g={};Promise.resolve().then(()=>{g.result=cp;g.onsuccess?.()});return g}}}}},close(){}};q.onsuccess?.()});return q}}}
function context(handler){
  const A='A'.repeat(78),B='B'.repeat(78),cp={schema:'aram-rating-phase-b-checkpoint-v03',matches:[{gameId:1}],b51_v032_queue:[{puuid:A,anchor_rank:1},{puuid:B,anchor_rank:2}]};
  const calls=[];const sandbox={console:{log(){}},indexedDB:fakeIndexedDb(cp),aramDesktop:{async getAramMatchHistory(payload){calls.push(payload);return handler(payload,calls.length,A,B)}}};sandbox.window=sandbox;sandbox.globalThis=sandbox;const ctx=vm.createContext(sandbox);new vm.Script(source).runInContext(ctx);return{api:ctx.aramRatingB51R5V032,calls,A,B};
}
(async()=>{
  const s=context((_p,n)=>({connected:true,matches:Array.from({length:20},(_,i)=>({gameId:n*100+i})),scanned:100,_historyLatency:{mode:'background',scan:100,limit:20,cacheHit:false}}));
  const bad=await s.api.probe({token:'WRONG'});ok(bad.refused&&s.calls.length===0,'wrong token is inert');
  const r=await s.api.probe({token:'B51R5-SEQUENCE-TWO'});ok(r.ok&&r.classification==='SEQUENCE_TWO_ACCEPTED'&&r.checkpoint_integrity,'two sequential requests accepted');
  ok(s.calls.length===2&&s.calls[0].target.puuid===s.A&&s.calls[1].target.puuid===s.B,'first then second distinct anchor');
  ok(s.calls.every(x=>x.limit===20&&x.scan===100&&x.queueMode==='standard'&&x.priority==='background'),'exact legacy shape preserved');
  ok(!JSON.stringify(r).includes(s.A)&&!JSON.stringify(r).includes(s.B),'raw PUUID not returned');
  const again=await s.api.probe({token:'B51R5-SEQUENCE-TWO'});ok(again.refused&&s.calls.length===2,'same-session second probe blocked');

  const f=context((_p,n)=>{if(n===2)throw new Error('request -> 400');return{connected:true,matches:[{gameId:1}],scanned:100}});
  const fr=await f.api.probe({token:'B51R5-SEQUENCE-TWO'});ok(fr.classification==='SEQUENCE_SECOND_HTTP_400_AFTER_FIRST_ACCEPTED'&&fr.ok===false&&f.calls.length===2,'second-request 400 classified');

  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'update/manifest.json'),'utf8'));
  ok(!(manifest.files||[]).some(x=>String(x.source||'').includes('phase-b51r5-v032-devtools')),'R5 not shipped in production manifest');
  const report={status:'SUCCESS',passes:pass,phase:'B5.1-R5',probe:'READ_ONLY_TWO_REQUEST_SEQUENCE',confirmation:'B51R5-SEQUENCE-TWO',request_budget:2,request_shape:{limit:20,scan:100,queueMode:'standard',priority:'background',targets:'first-two-distinct-b51-queue-anchors'},checkpoint_access:'readonly',checkpoint_written:false,storage_mutation:false,retry:false,automatic_invocation:false,production_changed:false};
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/aram-rating-v032-b51r5-preflight-audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`B5.1 R5 TWO-REQUEST PREFLIGHT AUDIT: SUCCESS · ${pass} checks`);
})().catch(e=>{console.error(e);process.exit(1)});
