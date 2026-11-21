'use strict';
const assert=require('assert');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const legacy=require(path.join(ROOT,'update/v0.15.34/autosync-telemetry-v01534.js'));
const canonical=require(path.join(ROOT,'src/autosync/telemetry.js'));

function createModule(){
  class Core{
    async lcuGet(pathname){
      if(String(pathname).includes('/lol-match-history/'))return{
        games:[{gameId:'KR_12345',participants:[
          {participantId:1,stats:{kills:7,deaths:3,assists:11,totalDamageDealtToChampions:23456,puuid:'SECRET',nested:{gold:15000,password:'NOPE'}}},
          {participantId:2,stats:{kills:1,deaths:9,assists:4,email:'private@example.com'}}
        ]}]
      };
      return {ok:true};
    }
    async getAramMatchHistory(){return{matches:[{gameId:'12345',me:{participantId:1}}]}}
  }
  return{LeagueAutoSyncCore:Core};
}
async function exercise(patcher){
  const mod=createModule();patcher(mod);const core=new mod.LeagueAutoSyncCore();
  await core.lcuGet('/lol-match-history/v1/products/lol/current-summoner/matches');
  const out=await core.getAramMatchHistory();
  const api=mod.aramTelemetry||mod.aramTelemetryV01534;
  const sanitized=api.sanitize({kills:9,puuid:'SECRET',token:'SECRET',nested:{assists:4,email:'NOPE'},items:[{gold:100},{gameId:'NOPE'}]});
  return{out,sanitized,leafCount:api.leafCount(sanitized),legacyReady:!!mod.__ARAM_AUTOSYNC_TELEMETRY_V01534__,semanticReady:!!mod.__ARAM_AUTOSYNC_TELEMETRY__};
}
function assertNoDoubleWrap(){
  const mod=createModule();canonical.install(mod);
  const lcu=mod.LeagueAutoSyncCore.prototype.lcuGet,history=mod.LeagueAutoSyncCore.prototype.getAramMatchHistory;
  legacy.patch(mod);
  assert.strictEqual(mod.LeagueAutoSyncCore.prototype.lcuGet,lcu,'legacy telemetry re-wrapped canonical lcuGet');
  assert.strictEqual(mod.LeagueAutoSyncCore.prototype.getAramMatchHistory,history,'legacy telemetry re-wrapped canonical history');
  canonical.install(mod);
  assert.strictEqual(mod.LeagueAutoSyncCore.prototype.lcuGet,lcu,'canonical telemetry is not idempotent');
  assert.strictEqual(mod.LeagueAutoSyncCore.prototype.getAramMatchHistory,history,'canonical history wrapper is not idempotent');
}
(async()=>{
  const before=await exercise(legacy.patch);
  const after=await exercise(canonical.install);
  assert.deepStrictEqual(after.out,before.out,'canonical telemetry changed history enrichment output');
  assert.deepStrictEqual(after.sanitized,before.sanitized,'canonical telemetry changed sanitization');
  assert.strictEqual(after.leafCount,before.leafCount,'canonical telemetry changed leaf counting');
  assert.strictEqual(after.legacyReady,true,'canonical telemetry must keep frozen readiness compatibility during migration');
  assert.strictEqual(after.semanticReady,true,'canonical semantic readiness marker missing');
  assert.strictEqual(canonical.production_active,true,'canonical telemetry must be production-capable');
  assertNoDoubleWrap();
  console.log(JSON.stringify({status:'PASS',owner:canonical.OWNER,historyParity:true,sanitizeParity:true,leafCountParity:true,compatibilityAlias:true,noDoubleWrap:true}));
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
