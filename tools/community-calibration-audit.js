'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const os=require('os');

const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const fail=[];
const pass=[];
const ok=(v,n,d='')=>{(v?pass:fail).push({name:n,detail:d});if(!v)console.error('FAIL',n,d)};

(async()=>{
  let cfg=null;
  try{cfg=JSON.parse(read('update/community-calibration-config.json'));ok(true,'remote config JSON')}catch(e){ok(false,'remote config JSON',e.message)}
  if(cfg){
    ok(cfg.enabled===false,'staged config remains disabled','must stay false until backend + Windows/Riot E2E');
    ok(Number(cfg.schema_version)===1,'schema version is 1');
    ok(Number(cfg.policy_version)===1,'policy version is 1');
    ok(!cfg.endpoint,'disabled config has no live endpoint');
    ok(cfg.mode==='required-for-use','consent mode is explicit required-for-use');
  }

  const telemetry='update/v0.15.34/autosync-telemetry-v01534.js';
  const client='update/v0.15.34/community-calibration-v01534.js';
  for(const f of [telemetry,client]){
    try{cp.execFileSync(process.execPath,['--check',path.join(ROOT,f)],{stdio:'pipe'});ok(true,`syntax ${f}`)}catch(e){ok(false,`syntax ${f}`,String(e.stderr||e.message))}
  }

  // Cloudflare Worker is ESM; syntax-check through a temporary .mjs copy.
  try{
    const t=path.join(os.tmpdir(),`cc-worker-${process.pid}.mjs`);fs.writeFileSync(t,read('backend/community-calibration/worker.js'));
    cp.execFileSync(process.execPath,['--check',t],{stdio:'pipe'});fs.rmSync(t,{force:true});ok(true,'Cloudflare Worker ESM syntax');
  }catch(e){ok(false,'Cloudflare Worker ESM syntax',String(e.stderr||e.message))}

  // Synthetic raw-field preservation test. This proves unknown numeric fields survive
  // while common identity keys are stripped before the normal ARAM history object is returned.
  try{
    class FakeCore{
      async lcuGet(){return {games:[{gameId:123456,participants:[{participantId:1,stats:{participantId:1,kills:3,deaths:4,futureMetric2027:77,challenges:{futureNestedMetric:42},puuid:'DO_NOT_KEEP',summonerName:'DO_NOT_KEEP',gameId:123456}}]}]}}
      async getAramMatchHistory(){return {matches:[{gameId:123456,me:{participantId:1}}]}}
    }
    const mod={LeagueAutoSyncCore:FakeCore};require(path.join(ROOT,telemetry)).patch(mod);
    const c=new FakeCore();await c.lcuGet('/lol-match-history/v1/games/123456');const h=await c.getAramMatchHistory();
    const raw=h.matches[0].me.rawGameplay||{};
    ok(h.matches[0].rawGameplayAvailable===true,'synthetic raw gameplay attached');
    ok(raw.futureMetric2027===77,'unknown future numeric field preserved');
    ok(raw.challenges?.futureNestedMetric===42,'unknown nested numeric field preserved');
    ok(!('puuid' in raw)&&!('summonerName' in raw)&&!('gameId' in raw),'identity/raw game id fields stripped');
    ok(Number(h.matches[0].rawGameplayFieldCount)>=4,'raw field count populated');
  }catch(e){ok(false,'synthetic raw-field preservation',e.stack||e.message)}

  const cs=read(client);
  ok(/targetMode\s*!==\s*['"]searched['"]/.test(cs),'searched-user upload guard present');
  ok(/scoring_use\s*:\s*false/.test(cs),'Community Calibration scoring isolation present');
  ok(/raw_game_id_upload\s*:\s*false/.test(cs),'raw game id upload disabled');
  ok(/identity_upload\s*:\s*false/.test(cs),'identity upload disabled');
  ok(/동의하고 시작/.test(cs)&&/동의하지 않고 종료/.test(cs),'required consent choices present');
  ok(cs.includes('^https:\\/\\/'),'HTTPS upload guard present');

  const worker=read('backend/community-calibration/worker.js');
  for(const key of ['puuid','summonername','riotid','gameid','access_token'])ok(worker.toLowerCase().includes(`'${key}'`)||worker.toLowerCase().includes(`'${key.replace('_','')}'`),`worker rejects ${key}`);
  ok(/MAX_BATCH\s*=\s*20/.test(worker),'server batch cap present');
  ok(/MAX_BODY_BYTES\s*=\s*512\s*\*\s*1024/.test(worker),'server body cap present');
  ok(/INSERT OR IGNORE/.test(worker),'server dedupe insert present');

  const report={generatedAt:new Date().toISOString(),status:fail.length?'FAIL':'PASS',pass,fail};
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
  fs.writeFileSync(path.join(ROOT,'audit-output','community-calibration-report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({status:report.status,pass:pass.length,fail:fail.length}));
  process.exitCode=fail.length?1:0;
})().catch(e=>{console.error(e);process.exitCode=1});
