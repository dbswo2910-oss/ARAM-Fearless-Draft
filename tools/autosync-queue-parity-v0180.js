'use strict';
const assert=require('assert');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const legacy=require(path.join(ROOT,'update/v0.15.17/autosync-queue-v01517.js'));
const canonical=require(path.join(ROOT,'src/autosync/queue.js'));

function participants(){return Array.from({length:10},(_,i)=>({participantId:i+1,championId:i+10,teamId:i<5?100:200}))}
function createModule(){
  class Core{
    constructor(){this.account={connected:true,puuid:'ME',gameName:'Me',tagLine:'KR1'};this.requests=[]}
    async buildInGame(phase,queueId,gameId){return{phase,queueId,gameId,gameMode:queueId===2400?'KIWI':'ARAM',mapId:12}}
    async refreshCreds(){return true}
    async ensureChampionMap(){}
    async captureIdentityAndParty(){}
    async resolveAramHistoryTarget(target){return target?.puuid?{connected:true,...target}:{...this.account}}
    async lcuGet(endpoint){this.requests.push(endpoint);return{games:[
      {gameId:'std2',queueId:450,gameMode:'ARAM',gameCreation:200,participants:participants()},
      {gameId:'may1',queueId:2400,gameMode:'KIWI',gameCreation:150,participants:participants()},
      {gameId:'std1',queueId:450,gameMode:'ARAM',gameCreation:100,participants:participants()}
    ]}}
    champ(id){return`C${id}`}
  }
  return{
    LeagueAutoSyncCore:Core,
    extractHistoryGames:p=>Array.isArray(p?.games)?p.games:[],
    normalizeAramHistoryGame:(g,target)=>({gameId:g.gameId,gameCreation:g.gameCreation,participantCount:(g.participants||[]).length,teamContextComplete:(g.participants||[]).length===10,me:{puuid:target.puuid}})
  };
}
function stripTime(x){const y=JSON.parse(JSON.stringify(x));delete y.loadedAt;return y}
async function exercise(patcher){
  const mod=createModule();patcher(mod);const Core=mod.LeagueAutoSyncCore,core=new Core();
  const classes=[
    mod.classifyAramQueue({queueId:450}),mod.classifyAramQueue({queueId:2400}),mod.classifyAramQueue({queueId:420}),mod.classifyAramQueue({gameMode:'ARAM'}),mod.classifyAramQueue({gameMode:'KIWI'})
  ];
  const contexts=[core.aramFromContext({queueId:450}),core.aramFromContext({queueId:2400}),core.aramFromContext({gameMode:'ARAM'}),core.aramFromContext({mapId:12}),core.aramFromContext({}, {benchEnabled:true,allowRerolling:true})];
  const standardBuild=await core.buildInGame('InProgress',450,1),mayhemBuild=await core.buildInGame('InProgress',2400,2);
  const standard=stripTime(await core.getAramMatchHistory({limit:20,scan:80,queueMode:'standard'}));
  const mayhem=stripTime(await core.getAramMatchHistory({limit:20,scan:80,queueMode:'mayhem'}));
  return{classes,contexts,standardBuild,mayhemBuild,standard,mayhem,semanticReady:!!Core.prototype.__ARAM_AUTOSYNC_QUEUE__,legacyReady:!!Core.prototype.__ARAM_QUEUE_SPLIT_V01517__};
}
(async()=>{
  const before=await exercise(legacy.patch),after=await exercise(canonical.install);
  const comparable={...after};delete comparable.semanticReady;delete comparable.legacyReady;
  const expected={...before};delete expected.semanticReady;delete expected.legacyReady;
  assert.deepStrictEqual(comparable,expected,'canonical queue owner changed Golden behavior');
  assert.strictEqual(after.semanticReady,true,'canonical queue semantic readiness missing');
  assert.strictEqual(after.legacyReady,true,'canonical queue frozen readiness alias missing');
  const mod=createModule();canonical.install(mod);const history=mod.LeagueAutoSyncCore.prototype.getAramMatchHistory,build=mod.LeagueAutoSyncCore.prototype.buildInGame;legacy.patch(mod);assert.strictEqual(mod.LeagueAutoSyncCore.prototype.getAramMatchHistory,history,'legacy queue rewrapped canonical history');assert.strictEqual(mod.LeagueAutoSyncCore.prototype.buildInGame,build,'legacy queue rewrapped canonical buildInGame');
  console.log(JSON.stringify({status:'PASS',owner:canonical.OWNER,queueParity:true,historyParity:true,noDoubleWrap:true}));
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
