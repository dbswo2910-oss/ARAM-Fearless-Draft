'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const BRIDGE_METHOD='getItemCatalog';
const IPC_CHANNEL='desktop:get-item-catalog';
function validateCatalog(payload){
  if(!payload||typeof payload!=='object')return{ok:false,reason:'payload-not-object'};
  if(payload.ok!==true)return{ok:false,reason:'catalog-not-ok'};
  if(!payload.items||typeof payload.items!=='object'||Array.isArray(payload.items))return{ok:false,reason:'items-not-object'};
  const ids=Object.keys(payload.items);if(!ids.length)return{ok:false,reason:'items-empty'};
  for(const id of ids){const it=payload.items[id];if(!it||typeof it!=='object')return{ok:false,reason:`invalid-item:${id}`};if(it.name!==undefined&&typeof it.name!=='string')return{ok:false,reason:`invalid-name:${id}`}}
  return{ok:true,count:ids.length,version:String(payload.version||'')};
}
module.exports={IMPLEMENTATION_VERSION,BRIDGE_METHOD,IPC_CHANNEL,validateCatalog,production_active:false,score_logic_changed:false,random_scoring_changed:false,item_recommendation_logic_changed:false};
