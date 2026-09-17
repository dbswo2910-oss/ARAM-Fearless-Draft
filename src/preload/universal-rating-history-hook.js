'use strict';
const {buildPreloadAutoSyncSource}=require('./universal-rating-auto-sync');
const HISTORY_CHANNEL='match-history:load';
const RATING_CHANNEL='rating:universal-rate-resolved-history';
const DIAGNOSTICS_CHANNEL='rating:universal-shadow-diagnostics';
const MARKER='__ARAM_UNIVERSAL_RATING_HISTORY_HOOK_V3__';
const LEGACY_MARKER='__ARAM_UNIVERSAL_RATING_HISTORY_HOOK_V2__';

function shadowHelperSource(){
  return `const ${MARKER}=true;\nlet __universalRatingShadowLastPlayer=null;\nlet __universalRatingShadowTask=null;\nlet __universalRatingShadowLastResult=null;\nasync function universalRatingShadowHistory(options){\n  const requestOptions={...(options||{})};\n  const ratingReason=String(requestOptions.__ratingAutoSyncReason||'SHIPPED_HISTORY_SHADOW').slice(0,80);\n  delete requestOptions.__ratingAutoSyncReason;\n  const result=await ipcRenderer.invoke('${HISTORY_CHANNEL}', requestOptions);\n  try{\n    const player=result&&result.account||null;\n    const matches=Array.isArray(result&&result.matches)?result.matches:[];\n    if(result&&result.connected!==false&&player&&player.puuid){\n      __universalRatingShadowLastPlayer={puuid:String(player.puuid),gameName:String(player.gameName||''),tagLine:String(player.tagLine||''),platformId:String(player.platformId||'KR')};\n      if(matches.length){\n        __universalRatingShadowTask=ipcRenderer.invoke('${RATING_CHANNEL}',{player,matches,force:false,reason:ratingReason}).then(x=>(__universalRatingShadowLastResult=x,x)).catch(()=>null);\n      }\n    }\n  }catch{}\n  return result;\n}\nasync function universalRatingShadowDiagnostics(){\n  const player=__universalRatingShadowLastPlayer;\n  if(!player||!player.puuid)return{schemaVersion:1,status:'NO_TARGET',mode:'DUAL_SHADOW',productionActive:false,automaticPromotion:false,productionRating:null,modelSelection:'no_clear_winner',player:null,candidates:{},networkRequests:0,updatedAt:null};\n  try{if(__universalRatingShadowTask)await __universalRatingShadowTask}catch{}\n  try{return await ipcRenderer.invoke('${DIAGNOSTICS_CHANNEL}',{puuid:player.puuid})}catch{return{schemaVersion:1,status:'READ_FAILED',mode:'DUAL_SHADOW',productionActive:false,automaticPromotion:false,productionRating:null,modelSelection:'no_clear_winner',player:{gameName:player.gameName,tagLine:player.tagLine,platformId:player.platformId},candidates:{},networkRequests:0,updatedAt:null}}\n}\n`;
}

function upgradeV2(source){
  let next=source;
  next=next.replace(`const ${LEGACY_MARKER}=true;`,`const ${MARKER}=true;`);
  if(!next.includes('let __universalRatingShadowLastResult=')){
    next=next.replace('let __universalRatingShadowTask=null;','let __universalRatingShadowTask=null;\nlet __universalRatingShadowLastResult=null;');
  }
  const oldStart=`async function universalRatingShadowHistory(options){\n  const result=await ipcRenderer.invoke('${HISTORY_CHANNEL}', options || {});`;
  const newStart=`async function universalRatingShadowHistory(options){\n  const requestOptions={...(options||{})};\n  const ratingReason=String(requestOptions.__ratingAutoSyncReason||'SHIPPED_HISTORY_SHADOW').slice(0,80);\n  delete requestOptions.__ratingAutoSyncReason;\n  const result=await ipcRenderer.invoke('${HISTORY_CHANNEL}', requestOptions);`;
  if(next.includes(oldStart))next=next.replace(oldStart,newStart);
  const oldTask=`__universalRatingShadowTask=ipcRenderer.invoke('${RATING_CHANNEL}',{player,matches,force:false,reason:'SHIPPED_HISTORY_SHADOW'}).catch(()=>null);`;
  const newTask=`__universalRatingShadowTask=ipcRenderer.invoke('${RATING_CHANNEL}',{player,matches,force:false,reason:ratingReason}).then(x=>(__universalRatingShadowLastResult=x,x)).catch(()=>null);`;
  if(next.includes(oldTask))next=next.replace(oldTask,newTask);
  return next;
}

function patchPreloadSource(source){
  source=String(source||'');
  if(source.includes(MARKER)&&source.includes('__ARAM_UNIVERSAL_RATING_AUTO_SYNC_V1__'))return{source,changed:false,count:0,alreadyPatched:true};
  const exposeNeedle="contextBridge.exposeInMainWorld('aramDesktop', {";
  const bareHistoryNeedle="getAramMatchHistory: options => ipcRenderer.invoke('match-history:load', options || {}),";
  const wrappedHistoryNeedle='getAramMatchHistory: options => universalRatingShadowHistory(options),';
  const bareStateNeedle="getAutoSyncState: () => ipcRenderer.invoke('autosync:get-state'),";
  if(!source.includes(exposeNeedle))throw new Error('preload aramDesktop expose contract missing');

  let next=source;
  if(next.includes(LEGACY_MARKER))next=upgradeV2(next);
  if(!next.includes(MARKER)){
    if(!next.includes(bareHistoryNeedle))throw new Error('preload match-history contract missing');
    next=next.replace(exposeNeedle,shadowHelperSource()+exposeNeedle).replace(bareHistoryNeedle,wrappedHistoryNeedle);
  }
  if(!next.includes('__ARAM_UNIVERSAL_RATING_AUTO_SYNC_V1__')){
    next=next.replace(exposeNeedle,buildPreloadAutoSyncSource({historyChannel:HISTORY_CHANNEL,ratingChannel:RATING_CHANNEL})+exposeNeedle);
  }
  if(next.includes(bareStateNeedle))next=next.replace(bareStateNeedle,"getAutoSyncState: () => universalRatingAutoSyncState(),");
  else if(!next.includes('getAutoSyncState: () => universalRatingAutoSyncState(),'))throw new Error('preload autosync state bridge contract missing');

  const diagnosticsNeedle='getUniversalRatingShadowDiagnostics: () => universalRatingShadowDiagnostics(),';
  if(!next.includes(diagnosticsNeedle)){
    if(!next.includes(wrappedHistoryNeedle))throw new Error('preload wrapped history bridge missing');
    next=next.replace(wrappedHistoryNeedle,wrappedHistoryNeedle+"\n    "+diagnosticsNeedle);
  }
  const autoBridge="getUniversalRatingAutoSyncState: () => __urasPublicState(),\n    onUniversalRatingAutoSync: callback => __urasSubscribe(callback),\n    offUniversalRatingAutoSync: id => __urasUnsubscribe(id),";
  if(!next.includes('getUniversalRatingAutoSyncState:'))next=next.replace(diagnosticsNeedle,diagnosticsNeedle+'\n    '+autoBridge);
  return{source:next,changed:next!==source,count:next===source?0:1,alreadyPatched:false};
}

module.exports={HISTORY_CHANNEL,RATING_CHANNEL,DIAGNOSTICS_CHANNEL,MARKER,LEGACY_MARKER,patchPreloadSource,production_active:false,automatic_promotion:false,network_owner:false,extends_existing_autosync_owner:true,owner_status:'shadow-sidecar+game-end-auto-sync'};
