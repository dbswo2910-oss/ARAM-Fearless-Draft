'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {app,BrowserWindow,session}=require('electron');

function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null}
const mode=String(arg('--mode')||'verify').toLowerCase();
const appDir=path.resolve(arg('--app-dir')||'');
const userData=path.resolve(arg('--user-data')||'');
const reportPath=path.resolve(arg('--report')||path.join(process.cwd(),'audit-output','stability','installed-persistence',`probe-${mode}.json`));
const expectedMatches=159;
const DB_NAME='aram-rating-research-v03',STORE='kv',CHECKPOINT_KEY='checkpoint-v03',LATEST_RUN_KEY='rating-ui-latest-run-v01';
const FIXTURE_KEY='aram_v0160_persistence_fixture_v1';
const FAVORITES_KEY='aram_match_lab_favorites_v1';
const HISTORY_KEY='aramFearless_aramHistoryTracked_v2';

if(!['seed','verify'].includes(mode))throw new Error(`unsupported --mode: ${mode}`);
if(!appDir||!userData)throw new Error('usage: electron tools/stability/windows-persistence-probe.js --mode <seed|verify> --app-dir <installed-app> --user-data <stable-userData> --report <json>');
const indexPath=path.join(appDir,'index.html');
if(!fs.existsSync(indexPath))throw new Error(`installed index missing: ${indexPath}`);
fs.mkdirSync(path.dirname(reportPath),{recursive:true});
app.setPath('userData',userData);
app.disableHardwareAcceleration();

function stableJson(v){
  if(v===null||typeof v!=='object')return JSON.stringify(v);
  if(Array.isArray(v))return `[${v.map(stableJson).join(',')}]`;
  return `{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stableJson(v[k])}`).join(',')}}`;
}
function digest(v){return crypto.createHash('sha256').update(stableJson(v)).digest('hex')}
function checkpointStamp(cp){const xs=Array.isArray(cp?.matches)?cp.matches:[],last=xs.at(-1),id=last?.gameId??last?.id??last?.matchId??'';return[cp?.seed_fingerprint||'',cp?.phase||'',cp?.status||'',cp?.sampling_version||cp?.config?.samplingVersion||'',xs.length,cp?.finished_at_v031||cp?.finished_at||'',id].join('|')}
function expectedFixture(){
  const checkpoint={seed_fingerprint:'v0160-persistence-fixture',phase:'B1',status:'complete',sampling_version:'v0.3.1',finished_at_v031:'2026-09-15T00:00:00Z',matches:Array.from({length:expectedMatches},(_,i)=>({gameId:`PERSIST-${String(i+1).padStart(3,'0')}`,queueId:450,gameCreation:1700000000000+i*60000,synthetic:true}))};
  const stamp=checkpointStamp(checkpoint);
  const latestRun={schema:'aram-rating-ui-latest-run-v01',source_run:{checkpoint_key:CHECKPOINT_KEY,checkpoint_stamp:stamp,checkpoint_finished_at:checkpoint.finished_at_v031,checkpoint_status:checkpoint.status,checkpoint_phase:checkpoint.phase},dataset:{matches:expectedMatches,players:0,synthetic:true},players:{}};
  const localStorage={
    [FIXTURE_KEY]:JSON.stringify({schema:1,marker:'v0160-installed-persistence',count:expectedMatches,synthetic:true}),
    [FAVORITES_KEY]:JSON.stringify([{gameName:'Fixture',tagLine:'TEST',synthetic:true,note:'v0160 persistence acceptance'}]),
    [HISTORY_KEY]:JSON.stringify({'PERSIST-001':{gameId:'PERSIST-001',ownerPuuid:'fixture-owner',ownerRiotId:'Fixture#TEST',synthetic:true}})
  };
  return{checkpoint,latestRun,localStorage,stamp};
}
const expected=expectedFixture();

const rendererScript=`(async()=>{
  const mode=${JSON.stringify(mode)};
  const DB_NAME=${JSON.stringify(DB_NAME)},STORE=${JSON.stringify(STORE)},CHECKPOINT_KEY=${JSON.stringify(CHECKPOINT_KEY)},LATEST_RUN_KEY=${JSON.stringify(LATEST_RUN_KEY)};
  const expected=${JSON.stringify(expected)};
  function idbOpen(){return new Promise((resolve,reject)=>{const q=indexedDB.open(DB_NAME,3);q.onupgradeneeded=()=>{const db=q.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error||new Error('indexedDB open failed'));q.onblocked=()=>reject(new Error('indexedDB open blocked'))})}
  function put(db,key,value){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite'),q=tx.objectStore(STORE).put(value,key);q.onsuccess=()=>resolve();q.onerror=()=>reject(q.error||new Error('indexedDB put failed'));tx.onabort=()=>reject(tx.error||new Error('indexedDB tx aborted'))})}
  function get(db,key){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),q=tx.objectStore(STORE).get(key);q.onsuccess=()=>resolve(q.result??null);q.onerror=()=>reject(q.error||new Error('indexedDB get failed'))})}
  if(mode==='seed'){
    for(const [k,v] of Object.entries(expected.localStorage))localStorage.setItem(k,v);
    const db=await idbOpen();await put(db,CHECKPOINT_KEY,expected.checkpoint);await put(db,LATEST_RUN_KEY,expected.latestRun);db.close();
  }
  const local={};for(const k of Object.keys(expected.localStorage))local[k]=localStorage.getItem(k);
  const db=await idbOpen();const cp=await get(db,CHECKPOINT_KEY),run=await get(db,LATEST_RUN_KEY);const version=db.version,stores=Array.from(db.objectStoreNames);db.close();
  return{href:location.href,local,checkpoint:cp,latestRun:run,dbVersion:version,stores};
})()`;

let win=null,finished=false;
function finish(code,report){
  if(finished)return;finished=true;
  try{fs.writeFileSync(reportPath,JSON.stringify(report,null,2),'utf8')}catch(e){console.error(e)}
  try{win?.destroy()}catch{}
  setTimeout(()=>app.exit(code),50);
}
function fail(error,extra={}){finish(1,{status:'FAILURE',mode,error:error?.stack||error?.message||String(error),...extra})}
const watchdog=setTimeout(()=>fail(new Error('persistence probe timeout')),30000);
watchdog.unref?.();

app.whenReady().then(async()=>{
  try{
    fs.mkdirSync(userData,{recursive:true});
    win=new BrowserWindow({show:false,width:800,height:600,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:false,webSecurity:true}});
    await win.loadFile(indexPath,{query:{persistenceProbe:'1'}});
    const snapshot=await win.webContents.executeJavaScript(rendererScript,true);
    await session.defaultSession.flushStorageData();
    const localExact=Object.entries(expected.localStorage).every(([k,v])=>snapshot.local?.[k]===v);
    const checkpointExact=stableJson(snapshot.checkpoint)===stableJson(expected.checkpoint);
    const runExact=stableJson(snapshot.latestRun)===stableJson(expected.latestRun);
    const matchCount=Array.isArray(snapshot.checkpoint?.matches)?snapshot.checkpoint.matches.length:0;
    const lastGameId=snapshot.checkpoint?.matches?.at?.(-1)?.gameId||'';
    const actualStamp=checkpointStamp(snapshot.checkpoint);
    const success=localExact&&checkpointExact&&runExact&&matchCount===expectedMatches&&lastGameId==='PERSIST-159'&&actualStamp===expected.stamp&&snapshot.dbVersion===3&&Array.isArray(snapshot.stores)&&snapshot.stores.includes(STORE);
    clearTimeout(watchdog);
    const report={status:success?'SUCCESS':'FAILURE',mode,stage:'WINDOWS_CHROMIUM_PERSISTENCE_PROBE',app_index:indexPath,user_data:userData,origin:snapshot.href,local_storage_keys:Object.keys(expected.localStorage),local_storage_exact:localExact,research_database:DB_NAME,research_store:STORE,research_db_version:snapshot.dbVersion,research_checkpoint_key:CHECKPOINT_KEY,research_checkpoint_matches:matchCount,research_checkpoint_last_game:lastGameId,research_checkpoint_stamp:actualStamp,research_checkpoint_sha256:digest(snapshot.checkpoint),expected_checkpoint_sha256:digest(expected.checkpoint),research_checkpoint_exact:checkpointExact,research_latest_run_key:LATEST_RUN_KEY,research_latest_run_exact:runExact,synthetic_fixture:true,personal_data_in_fixture:false};
    if(!success)return finish(1,report);
    finish(0,report);
  }catch(e){clearTimeout(watchdog);fail(e)}
}).catch(e=>{clearTimeout(watchdog);fail(e)});
