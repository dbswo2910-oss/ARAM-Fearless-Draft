'use strict';
const assert=require('node:assert/strict');
const {MemoryRatingStore}=require('../src/rating/universal/store');
const {createUniversalRatingRuntime}=require('../src/rating/universal/runtime');
const ipc=require('../src/main/universal-rating-ipc');
const hook=require('../src/preload/universal-rating-history-hook');
const view=require('../src/profile/shadow-rating-diagnostics-renderer');

(async()=>{
  const puuid='private-puuid-must-not-reach-renderer';
  const store=new MemoryRatingStore();
  const rt=createUniversalRatingRuntime({store});
  store.putPlayer({puuid,gameName:'ShadowTester',tagLine:'KR1',platformId:'KR'});
  store.putRating({schemaVersion:1,puuid,modelVersion:'research-v032-elo-shadow',modelName:'elo',modelStatus:'SHADOW',status:'ESTIMATED_SHADOW',rating:1532.4,uncertainty:81,games:24,confidence:{level:'HIGH',label:'높음',score:88,lower:1374,upper:1691,uncertainty:81},evidenceMatches:220,targetMatches:24,updatedAt:1700000000000,productionActive:false});
  store.putRating({schemaVersion:1,puuid,modelVersion:'research-v032-glicko-shadow',modelName:'glicko',modelStatus:'SHADOW',status:'ESTIMATED_SHADOW',rating:1518.2,uncertainty:96,games:24,confidence:{level:'HIGH',label:'높음',score:84,lower:1330,upper:1706,uncertainty:96},evidenceMatches:220,targetMatches:24,updatedAt:1700000001000,productionActive:false});
  const diagnostic=rt.getShadowDiagnostics(puuid);
  assert.equal(diagnostic.status,'READY');
  assert.equal(diagnostic.mode,'DUAL_SHADOW');
  assert.equal(diagnostic.productionActive,false);
  assert.equal(diagnostic.automaticPromotion,false);
  assert.equal(diagnostic.productionRating,null);
  assert.equal(diagnostic.networkRequests,0);
  assert.equal(diagnostic.player.gameName,'ShadowTester');
  assert.equal(diagnostic.player.tagLine,'KR1');
  assert.equal(diagnostic.targetMatches,24);
  assert.equal(diagnostic.candidates.elo.rating,1532.4);
  assert.equal(diagnostic.candidates.glicko.rating,1518.2);
  assert.equal(diagnostic.updatedAt,1700000001000);
  assert.equal(JSON.stringify(diagnostic).includes(puuid),false,'renderer diagnostics must not expose raw PUUID');

  const handlers=new Map();
  const fakeIpc={handle:(name,fn)=>handlers.set(name,fn),removeHandler:name=>handlers.delete(name)};
  const installed=ipc.installUniversalRatingIpc({ipcMain:fakeIpc,runtime:rt});
  assert.equal(installed.diagnosticsChannel,ipc.DIAGNOSTICS_CHANNEL);
  const viaIpc=await handlers.get(ipc.DIAGNOSTICS_CHANNEL)(null,{puuid});
  assert.equal(viaIpc.candidates.elo.games,24);
  assert.equal(viaIpc.networkRequests,0);
  installed.dispose();
  assert.equal(handlers.size,0);

  const base="const {contextBridge,ipcRenderer}=require('electron');\ncontextBridge.exposeInMainWorld('aramDesktop', {\n    getAramMatchHistory: options => ipcRenderer.invoke('match-history:load', options || {}),\n});\n";
  const patched=hook.patchPreloadSource(base);
  assert.equal(patched.changed,true);
  assert.match(patched.source,/getUniversalRatingShadowDiagnostics/);
  assert.match(patched.source,/rating:universal-shadow-diagnostics/);
  assert.match(patched.source,/__universalRatingShadowLastPlayer/);
  assert.match(patched.source,/await __universalRatingShadowTask/);

  const html=view.renderContent(diagnostic);
  assert.match(html,/RESEARCH ONLY/);
  assert.match(html,/정식 Rating이 아닙니다/);
  assert.match(html,/ShadowTester#KR1/);
  assert.match(html,/1532/);
  assert.match(html,/1518/);
  assert.match(html,/95% 추정 범위/);
  assert.match(html,/Production Rating: OFF/);
  assert.equal(html.includes(puuid),false);
  const empty=view.renderContent({status:'NO_TARGET'});
  assert.match(empty,/전적을 먼저 검색해 주세요/);
  assert.equal(view.production_active,false);
  assert.equal(view.automatic_promotion,false);
  assert.equal(view.network_owner,false);

  console.log('UNIVERSAL RATING SHADOW DIAGNOSTICS V1: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
