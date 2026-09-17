'use strict';
const { contextBridge, ipcRenderer } = require('electron');
const fs=require('fs'),path=require('path');
const stateIntegrity=require('./state-integrity-v015117');
try{
  const root=process.env.APPDATA||path.join(process.env.USERPROFILE||'', 'AppData','Roaming');
  const stableDir=path.join(root,'aram-fearless-draft','diagnostics');
  const legacyDir=path.join(root,'ARAM Fearless Draft','diagnostics');
  fs.mkdirSync(stableDir,{recursive:true});
  fs.mkdirSync(legacyDir,{recursive:true});
  const targets=[
    path.join(stableDir,'heartbeat-renderer.json'),
    path.join(stableDir,'heartbeat-renderer-v01578.json'),
    path.join(legacyDir,'heartbeat-renderer.json'),
    path.join(legacyDir,'heartbeat-renderer-v01578.json')
  ];
  const write=()=>{const body=JSON.stringify({at:Date.now(),pid:process.pid,version:'0.15.117'});for(const file of targets)fs.writeFile(file,body,()=>{})};
  write();setInterval(write,500);
}catch{}
function stateRead(namespace){
  try{return stateIntegrity.readNamespace(namespace,{maxBytes:4*1024*1024})}
  catch(e){return{ok:false,payload:null,source:'none',recovered:false,reason:e?.message||String(e)}}
}
function stateWrite(namespace,payload){
  try{return stateIntegrity.writeNamespace(namespace,payload,{maxBytes:4*1024*1024})}
  catch(e){stateIntegrity.appendDiagnostic({},'RENDERER_MIRROR_WRITE_ERROR',{namespace:String(namespace||'').slice(0,96),message:e?.message||String(e)});return{ok:false,error:e?.message||String(e)}}
}
function boundedDetail(detail){
  if(!detail||typeof detail!=='object')return{};
  try{
    const text=JSON.stringify(detail);
    if(text.length<=32000)return JSON.parse(text);
    return{truncated:true,preview:text.slice(0,30000),originalChars:text.length};
  }catch(e){return{serializationError:e?.message||String(e)}}
}
function stateDiagnostic(event,detail){
  const name=String(event||'RENDERER_STATE').replace(/[^A-Za-z0-9._-]/g,'_').slice(0,80)||'RENDERER_STATE';
  stateIntegrity.appendDiagnostic({},name,boundedDetail(detail));return true;
}
const __ARAM_UNIVERSAL_RATING_HISTORY_HOOK_V3__=true;
let __universalRatingShadowLastPlayer=null;
let __universalRatingShadowTask=null;
let __universalRatingShadowLastResult=null;
async function universalRatingShadowHistory(options){
  const requestOptions={...(options||{})};
  const ratingReason=String(requestOptions.__ratingAutoSyncReason||'SHIPPED_HISTORY_SHADOW').slice(0,80);
  delete requestOptions.__ratingAutoSyncReason;
  const result=await ipcRenderer.invoke('match-history:load', requestOptions);
  try{
    const player=result&&result.account||null;
    const matches=Array.isArray(result&&result.matches)?result.matches:[];
    if(result&&result.connected!==false&&player&&player.puuid){
      __universalRatingShadowLastPlayer={puuid:String(player.puuid),gameName:String(player.gameName||''),tagLine:String(player.tagLine||''),platformId:String(player.platformId||'KR')};
      if(matches.length){
        __universalRatingShadowTask=ipcRenderer.invoke('rating:universal-rate-resolved-history',{player,matches,force:false,reason:ratingReason}).then(x=>(__universalRatingShadowLastResult=x,x)).catch(()=>null);
      }
    }
  }catch{}
  return result;
}
async function universalRatingShadowDiagnostics(){
  const player=__universalRatingShadowLastPlayer;
  if(!player||!player.puuid)return{schemaVersion:1,status:'NO_TARGET',mode:'DUAL_SHADOW',productionActive:false,automaticPromotion:false,productionRating:null,modelSelection:'no_clear_winner',player:null,candidates:{},networkRequests:0,updatedAt:null};
  try{if(__universalRatingShadowTask)await __universalRatingShadowTask}catch{}
  try{return await ipcRenderer.invoke('rating:universal-shadow-diagnostics',{puuid:player.puuid})}catch{return{schemaVersion:1,status:'READ_FAILED',mode:'DUAL_SHADOW',productionActive:false,automaticPromotion:false,productionRating:null,modelSelection:'no_clear_winner',player:{gameName:player.gameName,tagLine:player.tagLine,platformId:player.platformId},candidates:{},networkRequests:0,updatedAt:null}}
}

const __ARAM_UNIVERSAL_RATING_AUTO_SYNC_V1__=true;
const __URAS_ACTIVE_PHASES=new Set(['INPROGRESS','INGAME','GAMESTART','PLAYING','RECONNECT']);
const __URAS_TERMINAL_PHASES=new Set(['ENDOFGAME','PREENDOFGAME','POSTGAME','WAITINGFORSTATS']);
let __urasSeenGame=false,__urasIdleSamples=0,__urasLastQueue=null,__urasLastPhase='',__urasSyncTask=null,__urasSyncTimer=null,__urasSubSeq=0;
const __urasSubscribers=new Map();
const __urasState={status:'IDLE',lastTriggerAt:null,lastSuccessAt:null,lastAttemptAt:null,lastNewMatches:0,lastError:'',lastPhase:'',lastQueueId:null,retries:0};
function __urasPick(obj,paths){for(const path of paths){let cur=obj;for(const key of path){if(cur==null){cur=undefined;break}cur=cur[key]}if(cur!==undefined&&cur!==null&&cur!=='')return cur}return null}
function __urasPhase(v){return String(v||'').replace(/[^a-z]/gi,'').toUpperCase()}
function __urasClassify(raw){const phase=__urasPhase(__urasPick(raw,[['gameflowPhase'],['phase'],['gamePhase'],['lifecycle','phase'],['gameflow','phase'],['game','phase'],['session','phase'],['status']]));const connectedRaw=__urasPick(raw,[['connected'],['leagueConnected'],['clientConnected'],['connection','connected']]);const explicit=__urasPick(raw,[['inGame'],['gameActive'],['gameInProgress'],['liveGame'],['game','active'],['session','inGame']]);const q=__urasPick(raw,[['queueId'],['game','queueId'],['session','queueId'],['gameData','queueId'],['queue','id']]);const queueId=Number.isFinite(Number(q))?Number(q):null;return{phase,connected:connectedRaw===false?false:true,inGame:explicit===true||__URAS_ACTIVE_PHASES.has(phase),terminal:__URAS_TERMINAL_PHASES.has(phase),queueId}}
function __urasPublicState(){return{...__urasState}}
function __urasEmit(){const snap=__urasPublicState();for(const cb of __urasSubscribers.values())try{cb(snap)}catch{}}
function __urasSubscribe(cb){if(typeof cb!=='function')return 0;const id=++__urasSubSeq;__urasSubscribers.set(id,cb);try{cb(__urasPublicState())}catch{}return id}
function __urasUnsubscribe(id){return __urasSubscribers.delete(Number(id))}
function __urasNewestTime(result){let best=0;for(const g of Array.isArray(result&&result.matches)?result.matches:[]){for(const row of [g,g&&g.game,g&&g.match,g&&g.data,g&&g.raw,g&&g.info]){if(!row)continue;for(const v of [row.gameEndTimestamp,row.gameEnd,row.timestamp,row.ts,row.createdAt,row.gameCreation,row.gameStartTimestamp]){const n=Number(v);if(Number.isFinite(n)&&n>best)best=n}}}return best}
async function __urasRunSync(triggerAt,attempt){if(__urasSyncTask)return __urasSyncTask;__urasState.status='SYNCING';__urasState.lastAttemptAt=Date.now();__urasState.retries=attempt;__urasState.lastError='';__urasEmit();__urasSyncTask=(async()=>{try{const result=await universalRatingShadowHistory({target:{current:true},queueMode:'standard',limit:20,scan:40,priority:'background',latestProbe:true,__ratingAutoSyncReason:'GAME_END_AUTO_SYNC'});try{if(__universalRatingShadowTask)await __universalRatingShadowTask}catch{}const sidecar=__universalRatingShadowLastResult||null;const newest=__urasNewestTime(result);const newMatches=Number(sidecar&&sidecar.ingest&&sidecar.ingest.newMatches)||0;__urasState.lastNewMatches=newMatches;if(result&&result.connected!==false&&Array.isArray(result.matches)&&result.matches.length){__urasState.status='SYNCED';__urasState.lastSuccessAt=Date.now();__urasEmit();if(newMatches===0&&attempt<2&&(!newest||newest<triggerAt-120000)){const wait=[0,8000,16000][attempt+1]||16000;setTimeout(()=>void __urasRunSync(triggerAt,attempt+1),wait)}return result}throw new Error('history_not_ready')}catch(e){__urasState.status='RETRY_WAIT';__urasState.lastError=e&&e.message?String(e.message):String(e);__urasEmit();if(attempt<2){const wait=[0,8000,16000][attempt+1]||16000;setTimeout(()=>void __urasRunSync(triggerAt,attempt+1),wait)}else{__urasState.status='ERROR';__urasEmit()}return null}finally{__urasSyncTask=null}})();return __urasSyncTask}
function __urasSchedule(event){if(__urasSyncTimer)clearTimeout(__urasSyncTimer);__urasState.status='WAITING_HISTORY';__urasState.lastTriggerAt=event.at;__urasState.lastQueueId=event.queueId;__urasState.lastPhase=event.phase||'';__urasEmit();__urasSyncTimer=setTimeout(()=>{__urasSyncTimer=null;void __urasRunSync(event.at,0)},5000)}
function __urasObserve(raw){const s=__urasClassify(raw);__urasState.lastPhase=s.phase||__urasState.lastPhase;if(s.queueId!==null){__urasLastQueue=s.queueId;__urasState.lastQueueId=s.queueId}if(s.connected===false){__urasIdleSamples=0;return}if(s.inGame){__urasSeenGame=true;__urasIdleSamples=0;__urasState.status='IN_GAME';return}if(!__urasSeenGame)return;__urasIdleSamples=s.terminal?2:__urasIdleSamples+1;if(__urasIdleSamples<2)return;__urasSeenGame=false;__urasIdleSamples=0;if(__urasLastQueue!==null&&__urasLastQueue!==450){__urasState.status='IGNORED_NON_ARAM';__urasEmit();return}__urasSchedule({at:Date.now(),phase:s.phase,queueId:__urasLastQueue})}
async function universalRatingAutoSyncState(){const out=await ipcRenderer.invoke('autosync:get-state');try{__urasObserve(out)}catch{}return out}
contextBridge.exposeInMainWorld('aramDesktop', {
  isElectron: true,
  getAutoSyncState: () => universalRatingAutoSyncState(),
  getAramMatchHistory: options => universalRatingShadowHistory(options),
    getUniversalRatingShadowDiagnostics: () => universalRatingShadowDiagnostics(),
    getUniversalRatingAutoSyncState: () => __urasPublicState(),
    onUniversalRatingAutoSync: callback => __urasSubscribe(callback),
    offUniversalRatingAutoSync: id => __urasUnsubscribe(id),
  getRiotGradeState: () => ipcRenderer.invoke('riot-grade:get-state'),
  pollRiotGrade: () => ipcRenderer.invoke('riot-grade:poll'),
  annotateRiotGradeSnapshots: rows => ipcRenderer.invoke('riot-grade:annotate-snapshots', Array.isArray(rows)?rows:[]),
  getDesktopInfo: () => ipcRenderer.invoke('desktop:get-info'),
  checkAndApplyUpdate: () => ipcRenderer.invoke('desktop:update-now'),
  getItemCatalog: () => ipcRenderer.invoke('desktop:get-item-catalog'),
  setAlwaysOnTop: value => ipcRenderer.invoke('desktop:set-always-on-top', !!value),
  setLaunchAtStartup: value => ipcRenderer.invoke('desktop:set-launch-at-startup', !!value),
  showWindow: () => ipcRenderer.invoke('desktop:show-window'),
  traceFreeze: payload => ipcRenderer.send('diagnostics:freeze-trace-v01575', payload && typeof payload==='object' ? payload : {stage:String(payload||'')}),
  traceDiagnostic: payload => ipcRenderer.send('diagnostics:blackbox-v01577', payload && typeof payload==='object' ? payload : {message:String(payload||'')}),
  getLastDiagnostic: () => ipcRenderer.invoke('diagnostics:get-last-v01577'),
  readStateMirror: namespace => stateRead(namespace),
  writeStateMirror: (namespace,payload) => stateWrite(namespace,payload),
  traceStateIntegrity: (event,detail) => stateDiagnostic(event,detail)
});
