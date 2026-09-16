'use strict';
const CHANNEL='rating:universal-rate-resolved-history';
function createUniversalRatingBridge(ipcRenderer){
  if(!ipcRenderer||typeof ipcRenderer.invoke!=='function')throw new Error('ipcRenderer.invoke required');
  return Object.freeze({
    rateUniversalResolvedHistory(payload){return ipcRenderer.invoke(CHANNEL,payload||{})}
  });
}
module.exports={CHANNEL,createUniversalRatingBridge,production_active:false,automatic_promotion:false,network_owner:false,owner_status:'shadow'};