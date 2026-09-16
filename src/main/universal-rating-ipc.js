'use strict';
const {createUniversalRatingRuntime}=require('../rating/universal/runtime');
const CHANNEL='rating:universal-rate-resolved-history';
const MAX_MATCHES_PER_REQUEST=60;

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

function installUniversalRatingIpc({ipcMain,userDataPath,runtime=null}={}){
  if(!ipcMain||typeof ipcMain.handle!=='function')throw new Error('ipcMain.handle required');
  const ratingRuntime=runtime||createUniversalRatingRuntime({userDataPath});
  if(typeof ipcMain.removeHandler==='function')ipcMain.removeHandler(CHANNEL);
  ipcMain.handle(CHANNEL,async(_event,payload)=>ratingRuntime.rateResolved(sanitizePayload(payload)));
  return{
    channel:CHANNEL,
    runtime:ratingRuntime,
    dispose(){if(typeof ipcMain.removeHandler==='function')ipcMain.removeHandler(CHANNEL)}
  };
}

module.exports={CHANNEL,MAX_MATCHES_PER_REQUEST,sanitizePayload,installUniversalRatingIpc,production_active:false,automatic_promotion:false,network_owner:false,owner_status:'shadow'};