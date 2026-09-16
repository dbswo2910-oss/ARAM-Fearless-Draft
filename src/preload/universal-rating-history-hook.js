'use strict';
const HISTORY_CHANNEL='match-history:load';
const RATING_CHANNEL='rating:universal-rate-resolved-history';
const MARKER='__ARAM_UNIVERSAL_RATING_HISTORY_HOOK_V1__';

function patchPreloadSource(source){
  source=String(source||'');
  if(source.includes(MARKER))return{source,changed:false,count:0,alreadyPatched:true};
  const exposeNeedle="contextBridge.exposeInMainWorld('aramDesktop', {";
  const historyNeedle="getAramMatchHistory: options => ipcRenderer.invoke('match-history:load', options || {}),";
  if(!source.includes(exposeNeedle))throw new Error('preload aramDesktop expose contract missing');
  if(!source.includes(historyNeedle))throw new Error('preload match-history contract missing');
  const helper=`const ${MARKER}=true;\nasync function universalRatingShadowHistory(options){\n  const result=await ipcRenderer.invoke('${HISTORY_CHANNEL}', options || {});\n  try{\n    const player=result&&result.account||null;\n    const matches=Array.isArray(result&&result.matches)?result.matches:[];\n    if(result&&result.connected!==false&&player&&player.puuid&&matches.length){\n      void ipcRenderer.invoke('${RATING_CHANNEL}',{player,matches,force:false,reason:'SHIPPED_HISTORY_SHADOW'}).catch(()=>{});\n    }\n  }catch{}\n  return result;\n}\n`;
  const next=source.replace(exposeNeedle,helper+exposeNeedle).replace(historyNeedle,"getAramMatchHistory: options => universalRatingShadowHistory(options),");
  return{source:next,changed:true,count:1,alreadyPatched:false};
}

module.exports={HISTORY_CHANNEL,RATING_CHANNEL,MARKER,patchPreloadSource,production_active:false,automatic_promotion:false,network_owner:false,owner_status:'shadow-sidecar'};
