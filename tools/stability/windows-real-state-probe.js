'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {app,BrowserWindow,session}=require('electron');

function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null}
const appDir=path.resolve(arg('--app-dir')||'');
const userData=path.resolve(arg('--user-data')||'');
const reportPath=path.resolve(arg('--report')||path.join(process.cwd(),'physical-acceptance-report-state.json'));
const DB_NAME='aram-rating-research-v03',STORE='kv',CHECKPOINT_KEY='checkpoint-v03',LATEST_RUN_KEY='rating-ui-latest-run-v01';
if(!appDir||!userData)throw new Error('usage: electron windows-real-state-probe.js --app-dir <installed-app> --user-data <stable-userData> --report <json>');
const indexPath=path.join(appDir,'index.html');
if(!fs.existsSync(indexPath))throw new Error(`installed index missing: ${indexPath}`);
fs.mkdirSync(path.dirname(reportPath),{recursive:true});
app.setPath('userData',userData);
app.disableHardwareAcceleration();

function stableJson(v){if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return `[${v.map(stableJson).join(',')}]`;return `{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stableJson(v[k])}`).join(',')}}`}
function digest(v){return v==null?'':crypto.createHash('sha256').update(stableJson(v)).digest('hex')}
const rendererScript=`(async()=>{
  const DB_NAME=${JSON.stringify(DB_NAME)},STORE=${JSON.stringify(STORE)},CHECKPOINT_KEY=${JSON.stringify(CHECKPOINT_KEY)},LATEST_RUN_KEY=${JSON.stringify(LATEST_RUN_KEY)};
  const known=['aram_match_lab_favorites_v1','aramFearless_aramHistoryTracked_v2'];
  const local={key_count:localStorage.length,known:{}};for(const k of known)local.known[k]=localStorage.getItem(k)!==null;
  let exists=null;try{if(indexedDB.databases)exists=(await indexedDB.databases()).some(x=>x&&x.name===DB_NAME)}catch{}
  if(exists===false)return{local,research:{database_exists:false,checkpoint:null,latest_run:null,db_version:null,stores:[]}};
  function openExisting(){return new Promise((resolve,reject)=>{let created=false;const q=indexedDB.open(DB_NAME);q.onupgradeneeded=e=>{if(Number(e.oldVersion||0)===0){created=true;try{q.transaction.abort()}catch{}}};q.onsuccess=()=>resolve({db:q.result,missing:false});q.onerror=()=>created&&q.error&&q.error.name==='AbortError'?resolve({db:null,missing:true}):reject(q.error||new Error('indexedDB open failed'));q.onblocked=()=>reject(new Error('indexedDB open blocked'))})}
  function get(db,key){return new Promise((resolve,reject)=>{let tx;try{tx=db.transaction(STORE,'readonly')}catch(e){reject(e);return}const q=tx.objectStore(STORE).get(key);q.onsuccess=()=>resolve(q.result??null);q.onerror=()=>reject(q.error||new Error('indexedDB read failed'))})}
  const opened=await openExisting();if(opened.missing||!opened.db)return{local,research:{database_exists:false,checkpoint:null,latest_run:null,db_version:null,stores:[]}};
  const db=opened.db,stores=Array.from(db.objectStoreNames||[]);let checkpoint=null,latestRun=null;if(stores.includes(STORE)){checkpoint=await get(db,CHECKPOINT_KEY);try{latestRun=await get(db,LATEST_RUN_KEY)}catch{}}const version=db.version;db.close();
  return{local,research:{database_exists:true,checkpoint,latest_run:latestRun,db_version:version,stores}};
})()`;

let win=null,finished=false;
function finish(code,report){if(finished)return;finished=true;try{fs.writeFileSync(reportPath,JSON.stringify(report,null,2),'utf8')}catch(e){console.error(e)}try{win&&win.destroy()}catch{}setTimeout(()=>app.exit(code),50)}
function fail(e){finish(1,{status:'FAILURE',stage:'REAL_WINDOWS_STATE_PROBE',error_name:e?.name||'Error',error_message:e?.message||String(e),privacy_safe:true})}
const watchdog=setTimeout(()=>fail(new Error('real state probe timeout')),30000);watchdog.unref?.();
app.whenReady().then(async()=>{try{
  win=new BrowserWindow({show:false,width:800,height:600,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:false,webSecurity:true}});
  await win.loadFile(indexPath,{query:{physicalAcceptanceProbe:'1'}});
  const snap=await win.webContents.executeJavaScript(rendererScript,true);
  await session.defaultSession.flushStorageData();
  const cp=snap.research?.checkpoint||null,matches=Array.isArray(cp?.matches)?cp.matches:[];
  const report={status:'SUCCESS',stage:'REAL_WINDOWS_STATE_PROBE',privacy_safe:true,raw_personal_data_in_report:false,user_data_identity:path.basename(userData),app_dir_name:path.basename(appDir),local_storage_key_count:Number(snap.local?.key_count||0),known_local_storage_keys:snap.local?.known||{},research_database:DB_NAME,research_store:STORE,research_database_exists:!!snap.research?.database_exists,research_db_version:snap.research?.db_version??null,research_stores:Array.isArray(snap.research?.stores)?snap.research.stores:[],research_checkpoint_key:CHECKPOINT_KEY,research_checkpoint_found:!!cp,research_checkpoint_matches:matches.length,research_checkpoint_sha256:digest(cp),research_latest_run_key:LATEST_RUN_KEY,research_latest_run_found:!!snap.research?.latest_run,research_latest_run_sha256:digest(snap.research?.latest_run||null)};
  clearTimeout(watchdog);finish(0,report);
}catch(e){clearTimeout(watchdog);fail(e)}}).catch(e=>{clearTimeout(watchdog);fail(e)});
