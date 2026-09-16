'use strict';
const HISTORY_CHANNEL='match-history:load';
const RATING_CHANNEL='rating:universal-rate-resolved-history';
const DIAGNOSTICS_CHANNEL='rating:universal-shadow-diagnostics';
const MARKER='__ARAM_UNIVERSAL_RATING_HISTORY_HOOK_V2__';

function patchPreloadSource(source){
  source=String(source||'');
  if(source.includes(MARKER))return{source,changed:false,count:0,alreadyPatched:true};
  const exposeNeedle="contextBridge.exposeInMainWorld('aramDesktop', {";
  const historyNeedle="getAramMatchHistory: options => ipcRenderer.invoke('match-history:load', options || {}),";
  if(!source.includes(exposeNeedle))throw new Error('preload aramDesktop expose contract missing');
  if(!source.includes(historyNeedle))throw new Error('preload match-history contract missing');
  const helper=`const ${MARKER}=true;\nlet __universalRatingShadowLastPlayer=null;\nlet __universalRatingShadowTask=null;\nasync function universalRatingShadowHistory(options){\n  const result=await ipcRenderer.invoke('${HISTORY_CHANNEL}', options || {});\n  try{\n    const player=result&&result.account||null;\n    const matches=Array.isArray(result&&result.matches)?result.matches:[];\n    if(result&&result.connected!==false&&player&&player.puuid){\n      __universalRatingShadowLastPlayer={puuid:String(player.puuid),gameName:String(player.gameName||''),tagLine:String(player.tagLine||''),platformId:String(player.platformId||'KR')};\n      if(matches.length){\n        __universalRatingShadowTask=ipcRenderer.invoke('${RATING_CHANNEL}',{player,matches,force:false,reason:'SHIPPED_HISTORY_SHADOW'}).catch(()=>null);\n      }\n    }\n  }catch{}\n  return result;\n}\nasync function universalRatingShadowDiagnostics(){\n  const player=__universalRatingShadowLastPlayer;\n  if(!player||!player.puuid)return{schemaVersion:1,status:'NO_TARGET',mode:'DUAL_SHADOW',productionActive:false,automaticPromotion:false,productionRating:null,modelSelection:'no_clear_winner',player:null,candidates:{},networkRequests:0,updatedAt:null};\n  try{if(__universalRatingShadowTask)await __universalRatingShadowTask}catch{}\n  try{return await ipcRenderer.invoke('${DIAGNOSTICS_CHANNEL}',{puuid:player.puuid})}catch{return{schemaVersion:1,status:'READ_FAILED',mode:'DUAL_SHADOW',productionActive:false,automaticPromotion:false,productionRating:null,modelSelection:'no_clear_winner',player:{gameName:player.gameName,tagLine:player.tagLine,platformId:player.platformId},candidates:{},networkRequests:0,updatedAt:null}}\n}\n`;
  const replacement="getAramMatchHistory: options => universalRatingShadowHistory(options),\n    getUniversalRatingShadowDiagnostics: () => universalRatingShadowDiagnostics(),";
  const next=source.replace(exposeNeedle,helper+exposeNeedle).replace(historyNeedle,replacement);
  return{source:next,changed:true,count:1,alreadyPatched:false};
}

module.exports={HISTORY_CHANNEL,RATING_CHANNEL,DIAGNOSTICS_CHANNEL,MARKER,patchPreloadSource,production_active:false,automatic_promotion:false,network_owner:false,owner_status:'shadow-sidecar'};