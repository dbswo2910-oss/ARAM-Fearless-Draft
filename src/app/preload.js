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
const __ARAM_UNIVERSAL_RATING_HISTORY_HOOK_V2__=true;
let __universalRatingShadowLastPlayer=null;
let __universalRatingShadowTask=null;
async function universalRatingShadowHistory(options){
  const result=await ipcRenderer.invoke('match-history:load', options || {});
  try{
    const player=result&&result.account||null;
    const matches=Array.isArray(result&&result.matches)?result.matches:[];
    if(result&&result.connected!==false&&player&&player.puuid){
      __universalRatingShadowLastPlayer={puuid:String(player.puuid),gameName:String(player.gameName||''),tagLine:String(player.tagLine||''),platformId:String(player.platformId||'KR')};
      if(matches.length){
        __universalRatingShadowTask=ipcRenderer.invoke('rating:universal-rate-resolved-history',{player,matches,force:false,reason:'SHIPPED_HISTORY_SHADOW'}).catch(()=>null);
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
contextBridge.exposeInMainWorld('aramDesktop', {
  isElectron: true,
  getAutoSyncState: () => ipcRenderer.invoke('autosync:get-state'),
  getAramMatchHistory: options => universalRatingShadowHistory(options),
    getUniversalRatingShadowDiagnostics: () => universalRatingShadowDiagnostics(),
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
