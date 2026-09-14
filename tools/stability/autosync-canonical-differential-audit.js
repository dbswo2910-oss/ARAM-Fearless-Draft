'use strict';
const L=require('./lib');
const legacy=require('../../update/v0.15.128/autosync-concurrency-v015119');
const next=require('../../src/autosync');
function stable(v){return JSON.stringify(v)}
for(const n of [0,1,2,3,4,5,9])L.must(legacy._test.backoffMs(n)===next.backoffMs(n),`backoff drift at ${n}`);
for(const creds of [null,{port:2999,password:'x',protocol:'https'},{token:'abc',address:'127.0.0.1'}])L.must(legacy._test.credentialSignature(creds)===next.credentialSignature(creds),'credential signature drift');
const optionFixtures=[{}, {queueMode:'mayhem'}, {target:{current:true}}, {target:{puuid:'ABC',gameName:'Name',tagLine:'KR1'}}, {queueMode:'standard',target:{riotId:'Some#KR'}}];
for(const o of optionFixtures){L.must(legacy._test.historyIdentity(o)===next.historyIdentity(o),'history identity drift');L.must(legacy._test.historyTargetKey(o)===next.historyTargetKey(o),'history target key drift')}
const games=[{gameId:4,gameEndTimestamp:400},{game:{id:3,timestamp:300}},{metadata:{matchId:'2'},gameCreation:200},{info:{matchId:'1',gameStartTimestamp:100}}];
for(const g of games){L.must(legacy._test.historyGameKey(g)===next.historyGameKey(g),'history game key drift');L.must(legacy._test.historyGameTime(g)===next.historyGameTime(g),'history game time drift')}
const previous={connected:true,scanned:4,fullTeamCount:1,matches:[{gameId:1,gameEndTimestamp:100},{gameId:2,gameEndTimestamp:200}]};
const incoming={connected:true,scanned:7,fullTeamCount:2,matches:[{gameId:2,gameEndTimestamp:200},{gameId:3,gameEndTimestamp:300}]};
L.must(stable(legacy._test.mergeHistoryPayload(previous,incoming))===stable(next.mergeHistoryPayload(previous,incoming)),'history merge payload drift');
(async()=>{
 const coord=next.createCoordinator({now:()=>12345});let calls=0;let release;const gate=new Promise(r=>release=r);const p1=coord.singleFlight('same',async()=>{calls++;await gate;return 7});const p2=coord.singleFlight('same',async()=>{calls++;return 9});L.must(p1===p2,'singleFlight must return same promise');L.must(calls===0,'singleFlight must defer fn to microtask');await Promise.resolve();L.must(calls===1,'singleFlight invoked duplicate work');release();L.must(await p1===7&&await p2===7,'singleFlight result drift');L.must(coord.state.requestCoalesces===1,'singleFlight coalesce counter drift');
 const key=next.historyTargetKey({target:{puuid:'abc'}});coord.cacheHistory(key,previous);coord.cacheHistory(key,incoming);const cached=coord.cachedHistory(key);L.must(cached?.at===12345,'cache timestamp drift');L.must(stable(cached.payload)===stable(next.mergeHistoryPayload(previous,incoming)),'canonical history cache merge drift');
 for(let i=0;i<15;i++)coord.cacheHistory('standard|p'+i,{connected:true,matches:[{gameId:100+i,gameEndTimestamp:100+i}]});L.must(coord.state.historyCache.size===next.HISTORY_CACHE_MAX_KEYS,'history cache LRU bound drift');
 coord.reset();L.must(coord.state.historyCache.size===0&&coord.state.requests.size===0&&coord.state.stopped===true,'canonical AutoSync reset drift');
 L.must(next.CORE_INTERVAL_MS===1200&&next.HISTORY_CACHE_MAX_ROWS===40&&next.HISTORY_CACHE_MAX_KEYS===12,'canonical AutoSync constants drift');L.must(next.production_active===false&&next.score_logic_changed===false&&next.random_scoring_changed===false,'canonical AutoSync must remain inactive and scoring neutral');
 const report={status:'SUCCESS',production_active:false,implementation:next.IMPLEMENTATION_VERSION,core_interval_ms:next.CORE_INTERVAL_MS,max_backoff_ms:next.BACKOFF[next.BACKOFF.length-1],history_cache_max_keys:next.HISTORY_CACHE_MAX_KEYS,history_cache_max_rows:next.HISTORY_CACHE_MAX_ROWS,singleflight_coalesces:1,semantic_helpers:['backoff','credentialSignature','historyIdentity','historyTargetKey','historyGameKey','historyGameTime','mergeHistoryPayload','singleFlight','historyCache'],cutover_allowed:false};L.write('audit-output/stability/autosync-canonical-differential.json',report);console.log('AUTOSYNC CANONICAL DIFFERENTIAL: SUCCESS · concurrency/history helper semantics preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
