'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {createCollector,extractRows,normGrade}=require('../work-in-progress/riot-grade-identity/collector');
function fixture(t,payload,puuid='one'){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'aram-grade-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const core={account:{puuid},refreshCreds:async()=>true,lcuGet:async()=>payload};
 const app={getPath:()=>dir};return {core,app,collector:createCollector(core,{app})};
}
test('direct capture, normalization, deduplication and restart persistence',async t=>{
 const f=fixture(t,{gameId:'KR_123456',championId:888,grade:'S_MINUS'});
 await f.collector.poll();await f.collector.poll();
 const s=f.collector.getState();assert.equal(s.records.length,1);assert.equal(s.records[0].gameId,'123456');assert.equal(s.records[0].grade,'S-');assert.equal(s.scoringUse,false);
 assert.equal(createCollector(f.core,{app:f.app}).getState().records.length,1);
});
test('missing PUUID cannot capture',async t=>{const f=fixture(t,{gameId:'123456',championId:888,grade:'A+'},'');assert.equal((await f.collector.poll()).records.length,0)});
test('account changes during LCU response cannot relabel a record',async t=>{
 const f=fixture(t,null);f.core.lcuGet=async()=>{f.core.account={puuid:'two'};return {gameId:'123456',championId:888,grade:'A+'}};
 assert.equal((await f.collector.poll()).records.length,0);
});
test('missing game ID does not join an unrelated EOG response',async t=>{
 const f=fixture(t,null);let calls=0;f.core.lcuGet=async()=>++calls===1?{championId:888,grade:'A+'}:{gameId:'999999'};
 assert.equal((await f.collector.poll()).records.length,0);assert.equal(calls,1);
});
test('missing and invalid champion identity is excluded',async t=>{
 for(const championId of [null,undefined,0,'',-1,1.5]){const f=fixture(t,{gameId:'123456',championId,grade:'B'});assert.equal((await f.collector.poll()).records.length,0)}
 assert.equal(extractRows({grade:'A',championId:null})[0].championId,null);assert.equal(normGrade('B_PLUS'),'B+');
});
test('two accounts in same game remain distinct',async t=>{
 const f=fixture(t,{gameId:'123456',championId:888,grade:'A'});await f.collector.poll();f.core.account.puuid='two';await f.collector.poll();assert.equal(f.collector.getState().records.length,2);
});
function ui(){
 let resolve;const statePromise=new Promise(r=>resolve=r),root={querySelector:()=>null,prepend(){this.inserted=true}},head={appendChild(){}};
 const history={account:{puuid:'one'},localAccount:{puuid:'one'},matches:[{gameId:'123456',championId:888}],selectedGameId:'123456'};
 const document={head,getElementById:id=>id==='historyMatchDetail'?root:id==='rg28Style'?{}:null,createElement:()=>({})};
 const window={aramDesktop:{getRiotGradeState:()=>statePromise}};
 const ctx={window,document,aramHistoryState:history,setTimeout:()=>{},setInterval:()=>{},console};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../work-in-progress/riot-grade-identity/ui.js'),'utf8'),ctx);
 return {api:window.aramRiotGradeV01528,history,root,resolve};
}
test('UI join requires matching PUUID, champion and explicit game source',()=>{
 const f=ui(),m=f.history.matches[0],good={gameId:'KR_123456',championId:888,puuid:'one',grade:'A',gameIdSource:'mastery-update'};
 assert.equal(f.api.findRecord({records:[good]},m),good);
 for(const patch of [{puuid:''},{puuid:'two'},{championId:1},{gameId:''},{gameIdSource:'eog-stats-fallback'}])assert.equal(f.api.findRecord({records:[{...good,...patch}]},m),null);
 f.history.account={};assert.equal(f.api.findRecord({records:[good]},m),null);
});
test('async annotation is discarded when selected match changes',async()=>{
 const f=ui(),pending=f.api.annotate();f.history.selectedGameId='999999';f.resolve({records:[]});await pending;assert.equal(f.root.inserted,undefined);
});
test('async annotation is discarded when selected account changes',async()=>{
 const f=ui(),pending=f.api.annotate();f.history.account.puuid='two';f.resolve({records:[]});await pending;assert.equal(f.root.inserted,undefined);
});
test('failed first write retries identical grade and survives restart',async t=>{
 const f=fixture(t,{gameId:'123456',championId:888,grade:'A'}),original=fs.writeFileSync;
 fs.writeFileSync=()=>{throw new Error('injected disk full')};
 try{await f.collector.poll()}finally{fs.writeFileSync=original}
 assert.match(f.collector.getState().lastError,/disk full/);
 await f.collector.poll();
 assert.equal(createCollector(f.core,{app:f.app}).getState().records.length,1);
});
test('pending write recovers even after client disconnects',async t=>{
 const f=fixture(t,{gameId:'123456',championId:888,grade:'A'}),original=fs.writeFileSync;
 fs.writeFileSync=()=>{throw new Error('injected disk full')};
 try{await f.collector.poll()}finally{fs.writeFileSync=original}
 f.core.refreshCreds=async()=>false;await f.collector.poll();
 assert.equal(createCollector(f.core,{app:f.app}).getState().records.length,1);
});
test('failed replacement preserves valid store and recovers without temp files',async t=>{
 const f=fixture(t,{gameId:'123456',championId:888,grade:'A'});await f.collector.poll();
 f.core.lcuGet=async()=>({gameId:'234567',championId:888,grade:'S'});
 const original=fs.renameSync;fs.renameSync=()=>{throw new Error('injected sharing violation')};
 try{await f.collector.poll()}finally{fs.renameSync=original}
 assert.equal(createCollector(f.core,{app:f.app}).getState().records.length,1);
 await f.collector.poll();assert.equal(createCollector(f.core,{app:f.app}).getState().records.length,2);
 assert.equal(fs.readdirSync(f.app.getPath()).filter(x=>x.includes('.tmp-')).length,0);
});
