'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
function createCoordinator({readState=(()=>null),semanticSignature,isActive=(()=>false),isBusy=(()=>false),renderSemantic=(()=>{}),schedulePost=(()=>{}),updateVolatile=(()=>{}),refreshShop=(()=>{}),refreshGlobalIcons=(()=>{}),now=(()=>Date.now())}={}){
  if(typeof semanticSignature!=='function')throw new Error('semanticSignature function required');
  let lastSemanticSig='',lastTickAt=0;
  const counters={ticks:0,inactiveSkips:0,busySkips:0,semanticRefreshes:0,volatileRefreshes:0,shopRefreshes:0,globalIconRefreshes:0};
  function tick(force=false){
    lastTickAt=now();counters.ticks++;
    if(isBusy()){counters.busySkips++;return{status:'busy',force:!!force}}
    if(!isActive()){
      counters.inactiveSkips++;
      if(counters.ticks%3===0){counters.globalIconRefreshes++;refreshGlobalIcons()}
      return{status:'inactive',force:!!force}
    }
    const state=readState(),sig=semanticSignature(state);
    let semantic=false;
    if(force||sig!==lastSemanticSig){lastSemanticSig=sig;counters.semanticRefreshes++;semantic=true;renderSemantic(!!force);schedulePost()}
    counters.volatileRefreshes++;updateVolatile(state);
    const shop=refreshShop(state)===true;if(shop)counters.shopRefreshes++;
    return{status:'active',force:!!force,semantic,signature:sig,shop};
  }
  function resetSemantic(){lastSemanticSig=''}
  function getState(){return{implementation:IMPLEMENTATION_VERSION,lastSemanticSig,lastTickAt,counters:{...counters}}}
  return{tick,resetSemantic,getState};
}
module.exports={IMPLEMENTATION_VERSION,createCoordinator,production_active:false,score_logic_changed:false,random_scoring_changed:false};
