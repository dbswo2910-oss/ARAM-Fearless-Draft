'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {MemoryRatingStore}=require('../src/rating/universal/store');
const {createUniversalRatingRuntime}=require('../src/rating/universal/runtime');
const {confidence,stabilityProgress}=require('../src/rating/universal/confidence');
const view=require('../src/profile/shadow-rating-diagnostics-renderer');

function rawMatch(id,ts,target='p0'){
  const ids=[target,'p1','p2','p3','p4','p5','p6','p7','p8','p9'];
  return{
    queueId:450,
    gameId:id,
    gameEndTimestamp:ts,
    gameVersion:'26.18.1',
    participants:ids.map((puuid,i)=>({puuid,teamId:i<5?100:200,win:i<5,championId:10+i,kills:5+i,deaths:4,assists:10}))
  };
}

(async()=>{
  const puuid='private-target-puuid';
  const store=new MemoryRatingStore();
  const rt=createUniversalRatingRuntime({store});
  const player={puuid,gameName:'Transparency',tagLine:'KR1',platformId:'KR'};
  const matches=[rawMatch('KR_1001',1700000000000,puuid),rawMatch('KR_1002',1700001000000,puuid)];

  const first=await rt.rateResolved({player,matches,reason:'TEST_FIRST_SEARCH'});
  assert.equal(first.ingest.receivedMatches,2);
  assert.equal(first.ingest.newMatches,2);
  assert.equal(first.ingest.duplicateMatches,0);
  assert.equal(first.ingest.targetMatches,2);
  assert.equal(first.database.uniqueMatches,2);
  assert.equal(first.database.graphPlayers,10);
  assert.equal(first.database.searchedPlayers,1);

  const second=await rt.rateResolved({player,matches,reason:'TEST_REPEAT_SEARCH'});
  assert.equal(second.ingest.receivedMatches,2);
  assert.equal(second.ingest.newMatches,0);
  assert.equal(second.ingest.duplicateMatches,2);
  assert.equal(second.ingest.targetMatches,2);
  assert.equal(second.database.uniqueMatches,2);

  const diagnostic=rt.getShadowDiagnostics(puuid);
  assert.equal(diagnostic.status,'READY');
  assert.equal(diagnostic.ingest.receivedMatches,2);
  assert.equal(diagnostic.ingest.newMatches,0);
  assert.equal(diagnostic.ingest.duplicateMatches,2);
  assert.equal(diagnostic.database.uniqueMatches,2);
  assert.equal(diagnostic.database.graphPlayers,10);
  assert.equal(diagnostic.database.searchedPlayers,1);
  assert.equal(diagnostic.interpretation.stabilityIsPredictiveAccuracy,false);
  assert.equal(diagnostic.interpretation.predictiveAccuracyValidated,false);
  assert.equal(Number.isFinite(diagnostic.modelGapPoints),true);
  assert.equal(JSON.stringify(diagnostic).includes(puuid),false,'renderer diagnostics must not expose raw PUUID');

  const low=confidence({games:7,uncertainty:124,rating:1500});
  const lowProgress=stabilityProgress({games:7,uncertainty:124,confidence:low});
  assert.equal(low.level,'LOW');
  assert.equal(lowProgress.nextLevel,'MEDIUM');
  assert.equal(lowProgress.gamesNeeded,1);
  assert.equal(lowProgress.maxUncertainty,220);

  const medium=confidence({games:19,uncertainty:78,rating:1500});
  const mediumProgress=stabilityProgress({games:19,uncertainty:78,confidence:medium});
  assert.equal(medium.level,'MEDIUM');
  assert.equal(mediumProgress.nextLevel,'HIGH');
  assert.equal(mediumProgress.gamesNeeded,1);
  assert.equal(mediumProgress.maxUncertainty,120);

  const high=confidence({games:20,uncertainty:76,rating:1500});
  const highProgress=stabilityProgress({games:20,uncertainty:76,confidence:high});
  assert.equal(high.level,'HIGH');
  assert.equal(highProgress.nextLevel,null);
  assert.equal(highProgress.sampleMaturityRemaining,10);

  const html=view.renderContent(diagnostic);
  for(const text of ['계산 안정도','정확도 아님','이번 검색 · 경기 집계','신규 저장','중복 제외','Rating DB · Match Graph','Elo↔Glicko 점수 차이','Predictive accuracy: NOT VALIDATED'])assert.match(html,new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.equal(html.includes(puuid),false);
  const source=fs.readFileSync(path.join(__dirname,'../src/profile/shadow-rating-diagnostics-renderer.js'),'utf8');
  assert.equal(source.includes('MutationObserver'),false);
  assert.match(source,/MAX_LAUNCH_RETRIES=20/);
  assert.match(source,/setTimeout\(scheduleLauncher,LAUNCH_RETRY_MS\)/);

  console.log('UNIVERSAL RATING SHADOW TRANSPARENCY V1: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
