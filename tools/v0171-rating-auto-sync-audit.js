'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
const auto=require('../src/preload/universal-rating-auto-sync');
const hook=require('../src/preload/universal-rating-history-hook');
const {UniversalRatingService}=require('../src/rating/universal/service');
const {MemoryRatingStore}=require('../src/rating/universal/store');

function ok(cond,msg){assert.ok(cond,msg)}
function makeMatch(id='KR_AUTO_1',ts=Date.now()){
  const participants=[];
  for(let i=0;i<10;i++)participants.push({puuid:`p${i+1}`,teamId:i<5?100:200,win:i<5,championId:10+i,kills:i+1,deaths:2,assists:5});
  return{gameId:id,queueId:450,gameEndTimestamp:ts,gameVersion:'26.18.1',participants};
}
async function main(){
  const c1=auto.classifyAutoSyncState({gameflowPhase:'InProgress',queueId:450,connected:true});
  ok(c1.inGame===true&&c1.queueId===450,'InProgress queue 450 classification failed');
  const c2=auto.classifyAutoSyncState({phase:'EndOfGame',queueId:450});
  ok(c2.terminal===true&&c2.inGame===false,'terminal classification failed');

  const events=[];
  const detector=auto.createTransitionDetector({onGameEnd:e=>events.push(e)});
  detector.observe({phase:'Lobby',queueId:450});
  detector.observe({phase:'Lobby',queueId:450});
  ok(events.length===0,'startup idle must not trigger game end');
  detector.observe({phase:'InProgress',queueId:450});
  detector.observe({connected:false,phase:'None',queueId:450});
  ok(events.length===0,'disconnect must not trigger');
  detector.observe({phase:'EndOfGame',queueId:450});
  ok(events.length===1,'terminal transition must trigger once');
  detector.observe({phase:'Lobby',queueId:450});
  ok(events.length===1,'post-game idle must not double trigger');

  const basePreload=`'use strict';\nconst {contextBridge,ipcRenderer}=require('electron');\ncontextBridge.exposeInMainWorld('aramDesktop', {\n  getAutoSyncState: () => ipcRenderer.invoke('autosync:get-state'),\n  getAramMatchHistory: options => ipcRenderer.invoke('match-history:load', options || {}),\n});\n`;
  const p1=hook.patchPreloadSource(basePreload);
  ok(p1.changed,'base preload should patch');
  const src=p1.source;
  ok(src.includes('__ARAM_UNIVERSAL_RATING_HISTORY_HOOK_V3__'),'V3 history marker missing');
  ok(src.includes('__ARAM_UNIVERSAL_RATING_AUTO_SYNC_V1__'),'auto-sync marker missing');
  ok(src.includes('getAutoSyncState: () => universalRatingAutoSyncState()'),'autosync owner was not wrapped');
  ok(src.includes('getUniversalRatingAutoSyncState:'),'public auto-sync state bridge missing');
  ok(src.includes('onUniversalRatingAutoSync:'),'public subscribe bridge missing');
  ok(src.includes('offUniversalRatingAutoSync:'),'public unsubscribe bridge missing');
  ok(!src.includes('setInterval('),'auto-sync must not create a second polling interval');
  ok(!src.includes('http://')&&!src.includes('https://'),'preload auto-sync must not add remote endpoint owner');
  ok(src.includes("ipcRenderer.invoke('match-history:load'"),'existing match-history owner must remain');
  const p2=hook.patchPreloadSource(src);
  ok(p2.changed===false&&p2.alreadyPatched===true,'preload patch must be idempotent');

  const frozenNames=['aram-rating-research-v03','checkpoint-v03'];
  const autoSource=fs.readFileSync(path.join(ROOT,'src/preload/universal-rating-auto-sync.js'),'utf8');
  for(const needle of frozenNames)ok(!autoSource.includes(needle),`live auto-sync must not mutate frozen research checkpoint: ${needle}`);

  const store=new MemoryRatingStore();
  const estimator={modelVersion:'fixture-shadow-v1',modelName:'Fixture',status:'SHADOW',async estimate({puuid,matches}){
    const own=matches.filter(m=>m.teamA.includes(puuid)||m.teamB.includes(puuid));
    return{modelName:'Fixture',modelStatus:'SHADOW',status:own.length?'READY':'NO_DATA',rating:1500+own.length,uncertainty:Math.max(20,200-own.length),games:own.length};
  }};
  const service=new UniversalRatingService({store,estimator});
  const first=await service.rateResolved({player:{puuid:'p1',gameName:'Target',tagLine:'KR1'},matches:[makeMatch()],reason:'GAME_END_AUTO_SYNC',source:'game-end-auto-sync'});
  ok(first.newMatches===1,'first ingest must add exactly one match');
  ok(Array.isArray(first.affectedPuuids)&&first.affectedPuuids.length===10,'new match must expose ten internal affected players');
  ok(first.totalMatches===1,'target match count must be one');
  const second=await service.rateResolved({player:{puuid:'p1'},matches:[makeMatch()],reason:'GAME_END_AUTO_SYNC',source:'game-end-auto-sync'});
  ok(second.newMatches===0,'same match must not be stored twice');
  ok(second.duplicateMatches===1,'duplicate match must be counted');
  ok(store.getAllMatches().length===1,'store must remain deduplicated');

  const runtimeSource=fs.readFileSync(path.join(ROOT,'src/rating/universal/runtime.js'),'utf8');
  ok(runtimeSource.includes("GAME_END_AUTO_SYNC"),'runtime auto-sync reason missing');
  ok(runtimeSource.includes('recalcAffected'),'affected-player recalculation missing');
  ok(runtimeSource.includes("productionActive:false"),'shadow must remain production inactive');
  ok(runtimeSource.includes("modelSelection:'no_clear_winner'"),'model selection gate must remain closed');
  ok(!runtimeSource.includes('aram-rating-research-v03')&&!runtimeSource.includes('checkpoint-v03'),'runtime must not touch frozen research checkpoint');

  const ipcContract=require('../src/preload/ipc-contract');
  for(const name of ['getUniversalRatingShadowDiagnostics','getUniversalRatingAutoSyncState','onUniversalRatingAutoSync','offUniversalRatingAutoSync'])ok(ipcContract.bridgeMethods.includes(name),`IPC contract missing ${name}`);

  console.log(JSON.stringify({status:'PASS',tests:{transition:true,noSecondPoll:true,historyOwnerPreserved:true,idempotentPatch:true,dedup:true,affectedPlayers:10,frozenResearchUntouched:true,productionRatingStillOff:true}},null,2));
}
main().catch(err=>{console.error(err&&err.stack||err);process.exit(1)});
