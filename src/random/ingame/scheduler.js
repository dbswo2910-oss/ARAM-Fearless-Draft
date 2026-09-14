'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
function createScheduler({coordinator,documentRef=globalThis.document,windowRef=globalThis.window,setIntervalFn=globalThis.setInterval?.bind(globalThis),clearIntervalFn=globalThis.clearInterval?.bind(globalThis),setTimeoutFn=globalThis.setTimeout?.bind(globalThis),intervalMs=1000,readMode=(()=>''),refreshUx=(()=>{}),bindBodyObserver=(()=>{}),scheduleGlobalIcons=(()=>{})}={}){
  if(!coordinator||typeof coordinator.tick!=='function')throw new Error('coordinator.tick required');
  if(typeof setIntervalFn!=='function'||typeof clearIntervalFn!=='function'||typeof setTimeoutFn!=='function')throw new Error('timer functions required');
  let started=false,timer=0;
  const counters={starts:0,stops:0,intervalTicks:0,modeClicks:0,navClicks:0,visibilityRefreshes:0,focusRefreshes:0};
  const defer=(fn,delay=0)=>setTimeoutFn(fn,Math.max(0,Number(delay)||0));
  function forceTick(){return coordinator.tick(true)}
  function intervalTick(){counters.intervalTicks++;return coordinator.tick(false)}
  function onClick(e){
    const target=e?.target;
    const modeBtn=target?.closest?.('#randomPickModeBtn,#randomIngameModeBtn');
    if(modeBtn){counters.modeClicks++;defer(()=>{refreshUx();if(readMode()==='ingame')forceTick();else scheduleGlobalIcons()},0);return}
    if(target?.closest?.('#nav .randomTab')){counters.navClicks++;defer(forceTick,0);return}
    if(target?.closest?.('#nav .tab')){counters.navClicks++;scheduleGlobalIcons()}
  }
  function onVisibility(){if(documentRef?.visibilityState==='visible'){counters.visibilityRefreshes++;bindBodyObserver();defer(forceTick,0);scheduleGlobalIcons()}}
  function onFocus(){counters.focusRefreshes++;bindBodyObserver();defer(forceTick,0)}
  function start(){
    if(started)return false;started=true;counters.starts++;
    bindBodyObserver();
    timer=setIntervalFn(intervalTick,intervalMs);
    documentRef?.addEventListener?.('click',onClick,true);
    documentRef?.addEventListener?.('visibilitychange',onVisibility,{passive:true});
    windowRef?.addEventListener?.('focus',onFocus,{passive:true});
    defer(forceTick,0);
    return true;
  }
  function stop(){
    if(!started)return false;started=false;counters.stops++;
    if(timer){clearIntervalFn(timer);timer=0}
    documentRef?.removeEventListener?.('click',onClick,true);
    documentRef?.removeEventListener?.('visibilitychange',onVisibility,{passive:true});
    windowRef?.removeEventListener?.('focus',onFocus,{passive:true});
    return true;
  }
  function getState(){return{implementation:IMPLEMENTATION_VERSION,started,timer:!!timer,intervalMs,counters:{...counters}}}
  return{start,stop,forceTick,intervalTick,getState};
}
module.exports={IMPLEMENTATION_VERSION,createScheduler,production_active:false,score_logic_changed:false,random_scoring_changed:false,lifecycle_single_owner:true};
