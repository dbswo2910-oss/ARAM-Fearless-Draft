'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const autosync=require('../../src/autosync');
const tx=require('../../src/updater/transaction');
const boot=require('../../src/updater/boot-guard');
const lifecycle=require('../../src/core/lifecycle');

const OUT=path.join(process.cwd(),'audit-output','stability','autosync-updater-lifecycle-soak-report.json');
function ensure(p){fs.mkdirSync(p,{recursive:true})}
function write(p,s){ensure(path.dirname(p));fs.writeFileSync(p,s,'utf8')}
function read(p){return fs.readFileSync(p,'utf8')}

async function autosyncSoak(cycles=300){
  let executed=0,coalesced=0,maxCacheKeys=0;
  for(let i=0;i<cycles;i++){
    let now=1700000000000+i*1000;
    const c=autosync.createCoordinator({now:()=>++now});
    const before=executed;
    const p1=c.singleFlight('same-request',async()=>{executed++;await Promise.resolve();return i});
    const p2=c.singleFlight('same-request',async()=>{throw new Error('coalesced request must not execute')});
    assert.strictEqual(p1,p2,'single-flight promise identity drift');
    const [a,b]=await Promise.all([p1,p2]);
    assert.strictEqual(a,i);assert.strictEqual(b,i);assert.strictEqual(executed,before+1);
    for(let k=0;k<16;k++)c.cacheHistory(`standard|fixture-${k}`,{connected:true,scanned:k,matches:[{gameId:`${i}-${k}`,gameCreation:now-k}]});
    const stats=c.stats();
    assert.strictEqual(stats.history.cacheKeys,autosync.HISTORY_CACHE_MAX_KEYS,'history cache cap drift');
    assert.strictEqual(stats.requestCoalesces,1,'request coalescing counter drift');
    maxCacheKeys=Math.max(maxCacheKeys,stats.history.cacheKeys);coalesced+=stats.requestCoalesces;
    c.reset();
    const reset=c.stats();
    assert.strictEqual(reset.stopped,true);assert.strictEqual(reset.history.cacheKeys,0);assert.strictEqual(reset.history.interactiveInflight,0);
  }
  const merged=autosync.mergeHistoryPayload(
    {scanned:20,matches:Array.from({length:35},(_,i)=>({gameId:`old-${i}`,gameCreation:1000-i}))},
    {scanned:50,matches:Array.from({length:35},(_,i)=>({gameId:i<10?`old-${i}`:`new-${i}`,gameCreation:2000-i}))}
  );
  assert.strictEqual(merged.matches.length,autosync.HISTORY_CACHE_MAX_ROWS,'history row cap drift');
  assert.strictEqual(new Set(merged.matches.map(x=>x.gameId)).size,merged.matches.length,'history dedupe drift');
  assert.strictEqual(merged.scanned,50);
  return{cycles,executed,coalesced,maxCacheKeys,rowCapVerified:merged.matches.length};
}

function seedApp(appDir,label){
  for(const rel of tx.CRITICAL_FILES)write(path.join(appDir,rel),`${label}:${rel}\n`);
  write(path.join(appDir,'nested','fixture.json'),JSON.stringify({label}));
}

function updaterSoak(cycles=90){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aram-v0160-updater-soak-'));
  let commits=0,rollbacks=0,probationCommits=0;
  try{
    for(let i=0;i<cycles;i++){
      const appDir=path.join(temp,`app-${i}`),root=path.join(temp,`safety-${i}`);seedApp(appDir,`cycle-${i}`);
      const original=read(path.join(appDir,'index.html'));
      const pending=tx.prepareTransaction({root,appDir,current:'0.15.135',latest:'0.16.0-rc',touched:['nested/fixture.json']});
      assert.strictEqual(pending.state,'prepared');assert.ok(fs.existsSync(pending.snapshotDir));
      assert.strictEqual(tx.markApplied({root,from:'0.15.135',to:'0.16.0-rc'}),true);
      if(i%9===0){
        write(path.join(appDir,'index.html'),'BROKEN\n');
        assert.strictEqual(tx.restoreSnapshot(tx.readPending({root}),{root}),true);
        assert.strictEqual(read(path.join(appDir,'index.html')),original,'rollback content drift');
        assert.strictEqual(tx.readPending({root}),null,'rollback left pending transaction');rollbacks++;continue;
      }
      const started=boot.startProbation({root,version:'0.16.0-rc',now:()=>1700000000000+i});
      assert.ok(started&&started.bootCount===1,'probation start drift');
      const diag=path.join(root,'diagnostics');ensure(diag);write(path.join(diag,'heartbeat-main.json'),'{}');write(path.join(diag,'heartbeat-renderer.json'),'{}');
      const monitor=boot.createProbationMonitor({root,version:'0.16.0-rc',diagDir:diag,heartbeatMaxAgeMs:60000,healthyRequired:3});
      let result;
      for(let n=0;n<3;n++)result=monitor.tick(Date.now());
      assert.ok(result&&result.committed===true,'probation monitor failed to commit');
      assert.strictEqual(tx.readPending({root}),null,'committed probation left pending transaction');
      const lkg=tx._test.readJson(path.join(root,'last-known-good.json'));
      assert.strictEqual(lkg.version,'0.16.0-rc');commits++;probationCommits++;
    }
  }finally{fs.rmSync(temp,{recursive:true,force:true})}
  return{cycles,commits,rollbacks,probationCommits};
}

function lifecycleSoak(cycles=600){
  let resourceDisposes=0,beforeUnloadDisposes=0;
  for(let i=0;i<cycles;i++){
    const lc=lifecycle.createResourceLifecycle([
      {name:'autosync',ready:()=>true,dispose:()=>{resourceDisposes++},getStats:()=>({cycle:i})},
      {name:'scheduler',ready:true,dispose:()=>{resourceDisposes++}}
    ]);
    const snap=lc.snapshot();assert.strictEqual(snap.resources.autosync.ready,true);assert.strictEqual(snap.resources.scheduler.ready,true);
    assert.strictEqual(lc.dispose('soak'),true);assert.strictEqual(lc.dispose('duplicate'),false,'dispose must be idempotent');
    assert.strictEqual(lc.getStats().disposeErrors,0);

    let handler=null;
    const target={addEventListener:(name,fn,opts)=>{assert.strictEqual(name,'beforeunload');assert.strictEqual(opts.once,true);handler=fn}};
    const lc2=lifecycle.createResourceLifecycle([{name:'window',dispose:()=>{beforeUnloadDisposes++}}]);
    lifecycle.attachBeforeUnload(target,lc2);assert.strictEqual(typeof handler,'function');handler();handler();
    assert.strictEqual(lc2.getStats().disposed,true);
  }
  assert.strictEqual(resourceDisposes,cycles*2,'resource dispose count drift');
  assert.strictEqual(beforeUnloadDisposes,cycles,'beforeunload double-dispose leak');
  return{cycles,resourceDisposes,beforeUnloadDisposes};
}

(async()=>{
  ensure(path.dirname(OUT));
  assert.strictEqual(autosync.production_active,false);
  assert.strictEqual(tx.production_active,false);
  assert.strictEqual(boot.production_active,false);
  assert.strictEqual(lifecycle.production_active,false);
  const report={
    status:'SUCCESS',stage:'V0160_INSTALLED_LIKE_SOAK',
    autosync:await autosyncSoak(),updater:updaterSoak(),lifecycle:lifecycleSoak(),
    network_requests:0,league_client_requests:0,research_collection_requests:0,automatic_b2_collection:false,
    production_active:false,score_logic_changed:false,random_scoring_changed:false,
    scope:'deterministic canonical shadow soak only; does not substitute for physical Windows + real League/LCU acceptance'
  };
  fs.writeFileSync(OUT,JSON.stringify(report,null,2),'utf8');
  console.log('V0.16 AUTOSYNC/UPDATER/LIFECYCLE SOAK: SUCCESS',JSON.stringify(report));
})().catch(error=>{
  ensure(path.dirname(OUT));
  const report={status:'FAILURE',stage:'V0160_INSTALLED_LIKE_SOAK',error:error?.stack||String(error),production_active:false};
  fs.writeFileSync(OUT,JSON.stringify(report,null,2),'utf8');console.error(error);process.exitCode=1;
});
