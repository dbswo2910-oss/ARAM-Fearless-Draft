'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const DEFAULT_MIN_INTERVAL_MS=1800;
function createShopPipeline({now=(()=>Date.now()),refreshBase=(()=>{}),refreshPolish=(()=>{}),refreshIcons=(()=>{}),minIntervalMs=DEFAULT_MIN_INTERVAL_MS}={}){
  let lastShopAt=0,refreshes=0;
  function refresh({buildActive=false,force=false}={}){
    if(!buildActive)return false;const t=Number(now())||0;if(!force&&t-lastShopAt<minIntervalMs)return false;lastShopAt=t;refreshes++;refreshBase();refreshPolish();refreshIcons();return true;
  }
  return{refresh,getState:()=>({lastShopAt,refreshes,minIntervalMs})};
}
module.exports={IMPLEMENTATION_VERSION,DEFAULT_MIN_INTERVAL_MS,createShopPipeline,production_active:false,score_logic_changed:false,random_scoring_changed:false};
