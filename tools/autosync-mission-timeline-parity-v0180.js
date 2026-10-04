'use strict';
const assert=require('assert');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const legacy=require(path.join(ROOT,'update/v0.15.29/autosync-mission-timeline-v01529.js'));
const canonical=require(path.join(ROOT,'src/autosync/mission-timeline.js'));
function member(id){return{participantId:id}}
function match(){return{gameId:'KR_12345',me:member(1),ourTeam:[1,2,3,4,5].map(member),enemyTeam:[6,7,8,9,10].map(member)}}
function timeline(){return{frames:[{events:[
  {type:'CHAMPION_KILL',timestamp:10000,killerId:1,victimId:6,assistingParticipantIds:[2]},
  {type:'CHAMPION_KILL',timestamp:12000,killerId:6,victimId:1,assistingParticipantIds:[7]},
  {type:'CHAMPION_KILL',timestamp:15000,killerId:2,victimId:7,assistingParticipantIds:[3]}
]}]}}
function createModule(){class Core{async getAramMatchHistory(){return{matches:[match()]}}async lcuGet(endpoint){if(endpoint.includes('/game-timelines/12345'))return timeline();throw new Error('unexpected endpoint '+endpoint)}}return{LeagueAutoSyncCore:Core}}
async function exercise(patcher){const mod=createModule();patcher(mod);const core=new mod.LeagueAutoSyncCore(),out=await core.getAramMatchHistory();const summarize=mod.summarizeMissionTimeline||mod.summarizeMissionTimelineV01529;return{out,summary:summarize(timeline(),match()),semantic:!!mod.__ARAM_AUTOSYNC_MISSION_TIMELINE__,legacy:!!mod.__ARAM_MISSION_TIMELINE_PATCH_V01529__}}
(async()=>{
  const before=await exercise(legacy.patch),after=await exercise(canonical.install);
  const a={...after};delete a.semantic;delete a.legacy;const b={...before};delete b.semantic;delete b.legacy;
  assert.deepStrictEqual(a,b,'canonical mission timeline changed Golden behavior');
  assert.strictEqual(after.semantic,true,'canonical mission timeline semantic readiness missing');
  assert.strictEqual(after.legacy,true,'canonical mission timeline legacy readiness alias missing');
  const mod=createModule();canonical.install(mod);const history=mod.LeagueAutoSyncCore.prototype.getAramMatchHistory;legacy.patch(mod);assert.strictEqual(mod.LeagueAutoSyncCore.prototype.getAramMatchHistory,history,'legacy mission timeline rewrapped canonical history');
  console.log(JSON.stringify({status:'PASS',owner:canonical.OWNER,summaryParity:true,enrichmentParity:true,noDoubleWrap:true}));
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
