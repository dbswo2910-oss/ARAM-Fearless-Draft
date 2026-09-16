'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {MemoryRatingStore,JsonRatingStore,UniversalRatingService,normalizeMatch,fingerprint,createEstimator}=require('../src/rating/universal');
const {createUniversalRatingRuntime}=require('../src/rating/universal/runtime');
const {createHistoryService}=require('../src/profile/history-service');
const {createUniversalRatingProfileAdapter}=require('../src/profile/universal-rating-adapter');
const {CHANNEL,MAX_MATCHES_PER_REQUEST,sanitizePayload,installUniversalRatingIpc}=require('../src/main/universal-rating-ipc');
const {createUniversalRatingBridge}=require('../src/preload/universal-rating-bridge');

function raw(id,t,target='A',win=true){
  const a=[target,`${id}a1`,`${id}a2`,`${id}a3`,`${id}a4`],b=[`${id}b1`,`${id}b2`,`${id}b3`,`${id}b4`,`${id}b5`];
  return{gameId:id,gameEndTimestamp:t,gameVersion:'26.18.1',queueId:450,participants:[...a.map((puuid,i)=>({puuid,teamId:100,win,kills:i+1,deaths:2,assists:8,totalDamageDealtToChampions:12000+i})),...b.map((puuid,i)=>({puuid,teamId:200,win:!win,kills:i,deaths:4,assists:4,totalDamageDealtToChampions:9000+i}))]};
}
function fakeEstimator(modelVersion='test-model-v1'){
  return{modelVersion,modelName:'fixture',status:'SHADOW',async estimate({puuid,matches}){const games=matches.filter(m=>m.teamA.includes(puuid)||m.teamB.includes(puuid)).length;return{status:games?'ESTIMATED_SHADOW':'INSUFFICIENT_DATA',rating:games?1500+games:null,uncertainty:games?100:null,games,modelName:'fixture',modelStatus:'SHADOW'}}};
}

test('canonical evidence fingerprint is independent from app version metadata',()=>{
  const a=normalizeMatch({...raw('m1',1000),appVersion:'0.16.0'}),b=normalizeMatch({...raw('m1',1000),appVersion:'99.0.0'});
  assert.deepEqual(a,b);
  assert.equal(fingerprint([a],'model-v1'),fingerprint([b],'model-v1'));
});

test('resolved history rates an unrelated searched player with zero rating-network requests',async()=>{
  const store=new MemoryRatingStore(),service=new UniversalRatingService({store,estimator:fakeEstimator()});
  const r=await service.rateResolved({player:{puuid:'stranger',gameName:'Stranger'},matches:[raw('s1',1000,'stranger'),raw('s2',2000,'stranger',false)]});
  assert.equal(r.rating,1502);
  assert.equal(r.targetMatches,2);
  assert.equal(r.networkRequests,0);
  assert.equal(r.productionActive,false);
  assert.equal(store.getAllMatches().length,2);
});

test('resolved history refuses unrelated detailed matches and preserves null for insufficient rating',async()=>{
  const store=new MemoryRatingStore(),service=new UniversalRatingService({store,estimator:fakeEstimator()});
  const r=await service.rateResolved({player:{puuid:'target'},matches:[raw('x1',1000,'other')]});
  assert.equal(r.targetMismatchMatches,1);
  assert.equal(r.targetMatches,0);
  assert.equal(r.status,'INSUFFICIENT_DATA');
  assert.equal(r.rating,null);
  assert.equal(r.uncertainty,null);
  assert.equal(store.getAllMatches().length,0);
});

test('profile adapter resolves searched target and does not become a network owner',async()=>{
  const state={targetMode:'searched',target:{puuid:'searched-puuid',gameName:'Search',tagLine:'KR1'},account:{puuid:'searched-puuid'},matches:[raw('p1',1000,'searched-puuid')]};
  const service=new UniversalRatingService({store:new MemoryRatingStore(),estimator:fakeEstimator()});
  const adapter=createUniversalRatingProfileAdapter({ratingService:service,getState:()=>state});
  const r=await adapter.rateLoadedHistory();
  assert.equal(r.targetMode,'searched');
  assert.equal(r.rating,1501);
  assert.equal(r.networkRequests,0);
  assert.equal(r.productionActive,false);
});

test('rating adapter adds zero bridge calls after History Service has loaded searched details',async()=>{
  const rows=[raw('h1',1000,'stranger'),raw('h2',2000,'stranger',false)];
  const state={targetMode:'searched',target:{puuid:'stranger',gameName:'Stranger',tagLine:'KR1'},queueMode:'standard',limit:2,matches:[],selectedGameId:''};
  let bridgeCalls=0;
  const history=createHistoryService({
    desktopHistory:async options=>{bridgeCalls++;if(options?.cacheOnly)return{connected:true,matches:[],_historyLatency:{cacheHit:false}};return{connected:true,matches:rows,account:{puuid:'stranger',gameName:'Stranger',tagLine:'KR1'},localAccount:{puuid:'local'},targetMode:'searched',queueMode:'standard',scanned:2,fullTeamCount:2,errors:[]}},
    getState:()=>state,
    render:()=>{}
  });
  await history.load({limit:2});
  const afterHistory=bridgeCalls;
  const service=new UniversalRatingService({store:new MemoryRatingStore(),estimator:fakeEstimator()});
  const adapter=createUniversalRatingProfileAdapter({ratingService:service,getState:()=>state});
  const rating=await adapter.rateLoadedHistory();
  assert.equal(bridgeCalls,afterHistory,'rating must reuse resolved history and add no bridge call');
  assert.equal(rating.rating,1502);
  assert.equal(rating.networkRequests,0);
});

test('re-rating identical evidence is cached and does not duplicate persistent matches',async()=>{
  const rows=[raw('d1',1000,'A'),raw('d2',2000,'A')],store=new MemoryRatingStore(),service=new UniversalRatingService({store,estimator:fakeEstimator()});
  const first=await service.rateResolved({player:{puuid:'A'},matches:rows});
  const second=await service.rateResolved({player:{puuid:'A'},matches:rows});
  assert.equal(first.newMatches,2);
  assert.equal(second.cacheHit,true);
  assert.equal(second.newMatches,0);
  assert.equal(second.duplicateMatches,2);
  assert.equal(store.getAllMatches().length,2);
});

test('model version is an explicit rating key',async()=>{
  const rows=[raw('v1',1000,'A')],store=new MemoryRatingStore();
  await new UniversalRatingService({store,estimator:fakeEstimator('model-v1')}).rateResolved({player:{puuid:'A'},matches:rows});
  await new UniversalRatingService({store,estimator:fakeEstimator('model-v2')}).rateResolved({player:{puuid:'A'},matches:rows});
  assert.ok(store.getRating('model-v1','A'));
  assert.ok(store.getRating('model-v2','A'));
  assert.notEqual(store.getRating('model-v1','A').evidenceFingerprint,store.getRating('model-v2','A').evidenceFingerprint);
});

test('persistent rating DB survives app restarts without install-version coupling',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aram-rating-')),file=path.join(dir,'universal-rating.json');
  const m=normalizeMatch(raw('persist1',1000,'A'));
  let s=new JsonRatingStore(file);s.putMatches([m]);s.putPlayer({puuid:'A'});s.putRating({modelVersion:'m1',puuid:'A',rating:1550});
  s=new JsonRatingStore(file);
  assert.equal(s.getAllMatches().length,1);
  assert.equal(s.getRating('m1','A').rating,1550);
  fs.rmSync(dir,{recursive:true,force:true});
});

test('dual-shadow runtime stores Elo and Glicko separately and exposes no production rating',async()=>{
  const runtime=createUniversalRatingRuntime({store:new MemoryRatingStore()});
  const rows=[];for(let i=0;i<8;i++)rows.push(raw(`r${i}`,1000+i,'A',i%2===0));
  const r=await runtime.rateResolved({player:{puuid:'A'},matches:rows});
  assert.equal(r.mode,'DUAL_SHADOW');
  assert.equal(r.modelSelection,'no_clear_winner');
  assert.equal(r.productionRating,null);
  assert.equal(r.productionActive,false);
  assert.equal(r.networkRequests,0);
  assert.ok(r.candidates.elo);
  assert.ok(r.candidates.glicko);
  assert.equal(r.candidates.elo.targetMatches,8);
  assert.equal(r.candidates.glicko.targetMatches,8);
  assert.equal(runtime.store.getAllMatches().length,8);
  assert.ok(runtime.store.getRating('research-v032-elo-shadow','A'));
  assert.ok(runtime.store.getRating('research-v032-glicko-shadow','A'));
});

test('main IPC is bounded and preload bridge invokes only the rating channel',async()=>{
  const handlers=new Map();
  const ipcMain={handle:(channel,fn)=>handlers.set(channel,fn),removeHandler:channel=>handlers.delete(channel)};
  const runtime={rateResolved:async payload=>({ok:true,count:payload.matches.length,puuid:payload.player.puuid})};
  const installed=installUniversalRatingIpc({ipcMain,runtime});
  assert.equal(installed.channel,CHANNEL);
  const many=Array.from({length:MAX_MATCHES_PER_REQUEST+5},(_,i)=>({id:i}));
  const payload=sanitizePayload({player:{puuid:'P'},matches:many});
  assert.equal(payload.matches.length,MAX_MATCHES_PER_REQUEST);
  const result=await handlers.get(CHANNEL)(null,payload);
  assert.deepEqual(result,{ok:true,count:MAX_MATCHES_PER_REQUEST,puuid:'P'});
  let invoked=null;
  const bridge=createUniversalRatingBridge({invoke:(channel,value)=>{invoked={channel,value};return Promise.resolve({ok:true})}});
  await bridge.rateUniversalResolvedHistory({player:{puuid:'P'},matches:[]});
  assert.equal(invoked.channel,CHANNEL);
  assert.equal(invoked.value.player.puuid,'P');
  installed.dispose();
  assert.equal(handlers.has(CHANNEL),false);
});

test('research candidate estimator remains shadow-only',async()=>{
  const rows=[];for(let i=0;i<12;i++)rows.push(normalizeMatch(raw(`e${i}`,1000+i,'A',i%2===0)));
  const est=createEstimator('research-v032-elo-shadow'),r=await est.estimate({puuid:'A',matches:rows});
  assert.equal(est.productionActive,false);
  assert.equal(r.modelStatus,'SHADOW');
  assert.equal(r.games,12);
  assert.ok(Number.isFinite(r.rating));
});
