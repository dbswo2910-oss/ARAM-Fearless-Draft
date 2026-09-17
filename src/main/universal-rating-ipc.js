'use strict';
const {createUniversalRatingRuntime}=require('../rating/universal/runtime');
const CHANNEL='rating:universal-rate-resolved-history';
const DIAGNOSTICS_CHANNEL='rating:universal-shadow-diagnostics';
const MAX_MATCHES_PER_REQUEST=60;
const SHADOW_MODELS=Object.freeze([
  'research-v032-elo-shadow',
  'research-v032-glicko-shadow',
  'research-v2-network-bt-shadow'
]);

function sanitizePayload(payload){
  const player=payload?.player||{};
  const puuid=String(player.puuid||'').trim();
  if(!puuid)throw new Error('player.puuid required');
  const matches=Array.isArray(payload?.matches)?payload.matches.slice(0,MAX_MATCHES_PER_REQUEST):[];
  return{
    player:{puuid,gameName:String(player.gameName||''),tagLine:String(player.tagLine||''),platformId:String(player.platformId||'KR')},
    matches,
    force:payload?.force===true,
    reason:String(payload?.reason||'PROFILE_HISTORY_IPC').slice(0,80)
  };
}
function sanitizeDiagnosticsPayload(payload){
  const puuid=String(payload?.puuid||'').trim();
  if(!puuid)throw new Error('player.puuid required');
  return{puuid};
}

function installUniversalRatingIpc({ipcMain,userDataPath,runtime=null}={}){
  if(!ipcMain||typeof ipcMain.handle!=='function')throw new Error('ipcMain.handle required');
  const ratingRuntime=runtime||createUniversalRatingRuntime({userDataPath,modelVersions:SHADOW_MODELS});
  if(typeof ipcMain.removeHandler==='function'){
    ipcMain.removeHandler(CHANNEL);
    ipcMain.removeHandler(DIAGNOSTICS_CHANNEL);
  }
  ipcMain.handle(CHANNEL,async(_event,payload)=>ratingRuntime.rateResolved(sanitizePayload(payload)));
  ipcMain.handle(DIAGNOSTICS_CHANNEL,async(_event,payload)=>ratingRuntime.getShadowDiagnostics(sanitizeDiagnosticsPayload(payload).puuid));
  return{
    channel:CHANNEL,
    diagnosticsChannel:DIAGNOSTICS_CHANNEL,
    runtime:ratingRuntime,
    dispose(){if(typeof ipcMain.removeHandler==='function'){ipcMain.removeHandler(CHANNEL);ipcMain.removeHandler(DIAGNOSTICS_CHANNEL)}}
  };
}

module.exports={CHANNEL,DIAGNOSTICS_CHANNEL,MAX_MATCHES_PER_REQUEST,SHADOW_MODELS,sanitizePayload,sanitizeDiagnosticsPayload,installUniversalRatingIpc,production_active:false,automatic_promotion:false,network_owner:false,owner_status:'multi-shadow'};
