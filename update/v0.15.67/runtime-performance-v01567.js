'use strict';
(()=>{
  const V='0.15.67';
  if(window.__ARAM_RUNTIME_PERFORMANCE_V01567__)return;

  // v0.15.62 is the final party-label visual contract. Prevent the hidden historical
  // v0.15.59/v0.15.61 label layers and v0.15.62 polling loop from installing three
  // separate MutationObservers + recurring timers. This runtime owns the same visible
  // pool badge behavior with one scoped observer and event-driven refresh only.
  window.__ARAM_RANDOM_PARTY_LABELS_V01559__=true;
  window.__ARAM_RANDOM_PARTY_LABEL_FIX_V01561__=true;
  window.__ARAM_RANDOM_PARTY_POOL_LABELS_V01562__=true;

  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  let scheduleTimer=0,resizeTimer=0,observer=null,busy=false,hookRestored=false;
  const counters={scheduled:0,syncs:0,busySkips:0,governedIntervals:0,clampedIntervals:0,dedupedShopPaints:0};

  // During overlay bootstrap, wrap only newly-created sub-second UI maintenance timers.
  // Existing base-page timers were already created before this script is injected.
  // main.js restores window.setInterval after all runtime patches are installed, while
  // the created wrappers keep respecting the busy flag during native move/resize.
  const nativeSetInterval=window.setInterval.bind(window);
  const installedSetInterval=window.setInterval;
  window.setInterval=function(fn,delay,...args){
    const requested=Math.max(0,Number(delay)||0);
    const effective=requested>0&&requested<900?900:requested;
    const wrapped=typeof fn==='function'?function(...cbArgs){
      if(busy){counters.busySkips++;return}
      return fn.apply(this,cbArgs);
    }:fn;
    counters.governedIntervals++;
    if(effective!==requested)counters.clampedIntervals++;
    return nativeSetInterval(wrapped,effective,...args);
  };

  function restoreTimerHook(){
    if(hookRestored)return;
    if(window.setInterval!==installedSetInterval)window.setInterval=installedSetInterval;
    hookRestored=true;
  }

  // v0.15.53 shop used to assign identical innerHTML on every fallback tick. Keep the
  // historical file immutable and suppress only identical paints on that exact planner node.
  const shopHtmlCache=new WeakMap();
  try{
    const proto=globalThis.Element?.prototype,desc=proto&&Object.getOwnPropertyDescriptor(proto,'innerHTML');
    if(desc?.get&&desc?.set&&!proto.__aramShopHtmlDedupeV01567){
      Object.defineProperty(proto,'innerHTML',{configurable:desc.configurable,enumerable:desc.enumerable,get:desc.get,set:function(v){
        if(this?.id==='riShopPlannerV01553'){const next=String(v??'');if(shopHtmlCache.get(this)===next){counters.dedupedShopPaints++;return}shopHtmlCache.set(this,next)}
        return desc.set.call(this,v);
      }});
      Object.defineProperty(proto,'__aramShopHtmlDedupeV01567',{value:true,configurable:true});
    }
  }catch{}

  function ensureStyle(){
    if($('#aramRuntimePerformanceStyleV01567'))return;
    const st=document.createElement('style');
    st.id='aramRuntimePerformanceStyleV01567';
    st.textContent=`
      body.aramPerfBusyV01567 #random *,
      body.aramPerfBusyV01567 #riCoachShellV01550 *{
        animation-play-state:paused!important;
        transition:none!important;
      }
      #random #manualPartyInputs .rpPartyLabelV01561,
      #random #manualPartyInputs .rpPartyStatePillV01559{display:none!important}
      #random #manualPartyInputs .searchWrap.rpPartyLabelWrapV01561 .searchInput{padding-right:38px!important}
      #random #poolInputs .randomPoolItem.rpPartyPoolPickV01562{
        border-radius:8px;background:#0c2033;box-shadow:inset 2px 0 0 #4ca9e8;padding-left:3px
      }
      #random #poolInputs .randomPoolTeamBadgeV01562{
        display:block;margin-top:2px;font-size:7px;line-height:1.1;font-weight:950;
        color:#83d1ff;white-space:nowrap
      }
    `;
    document.head.appendChild(st);
  }

  function manualNames(){
    const out=[];
    try{for(const x of Array.isArray(randomState?.manual)?randomState.manual:[]){const n=String(x||'').trim();if(n&&!out.includes(n))out.push(n)}}catch{}
    return out;
  }
  function syncedNamesFromRows(){
    const out=[];
    $$('#manualPartyInputs .randomDraftRow.rpPartySyncedV01558').forEach(row=>{
      const ghost=$('.rpPartyGhostV01558',row),portrait=$('[data-random-key^="manual-"]',row),input=$('.searchInput',row);
      const n=String(ghost?.dataset?.name||portrait?.dataset?.rp58PartyPick||input?.dataset?.committed||input?.value||'').trim();
      if(n&&!out.includes(n))out.push(n);
    });
    return out;
  }
  function teamNames(){return new Set([...manualNames(),...syncedNamesFromRows()])}
  function clearLeftInlineLabel(){
    $$('#manualPartyInputs .rpPartyLabelV01561').forEach(x=>{x.style.display='none'});
    $$('#manualPartyInputs .searchWrap.rpPartyLabelWrapV01561').forEach(w=>{w.classList.remove('rpPartyLabelWrapV01561');const input=$('.searchInput',w);if(input)input.style.removeProperty('padding-right')});
  }
  function decoratePool(){
    const team=teamNames();
    $$('#poolInputs .randomPoolItem').forEach(item=>{
      const input=$('.searchInput',item),name=String(input?.dataset?.committed||input?.value||'').trim();
      const taken=!!$('.randomPoolTakenBadge',item),desired=!!name&&team.has(name)&&!taken,legacy=$('.randomPoolTeamBadgeV01558',item);
      let badge=$('.randomPoolTeamBadgeV01562',item);
      item.classList.toggle('rpPartyPoolPickV01562',desired);
      if(desired){
        if(legacy){if(badge)badge.remove()}
        else if(!badge){const slot=$('.slot',item);if(slot){badge=document.createElement('span');badge.className='randomPoolTeamBadgeV01562';badge.textContent='팀원픽';badge.title='우리 파티가 선택한 챔피언';slot.appendChild(badge)}}
      }else if(badge)badge.remove();
    });
  }
  function sync(){
    if(busy){counters.busySkips++;return}
    if(!$('#random')||!$('#poolInputs'))return;
    counters.syncs++;ensureStyle();clearLeftInlineLabel();decoratePool();
  }
  function schedule(){
    counters.scheduled++;clearTimeout(scheduleTimer);scheduleTimer=setTimeout(sync,70);
  }
  function bind(){
    const root=$('#random');if(!root){setTimeout(bind,160);return}
    ensureStyle();sync();
    const watch=[$('#manualPartyInputs'),$('#poolInputs')].filter(Boolean);
    observer=new MutationObserver(schedule);watch.forEach(el=>observer.observe(el,{childList:true,subtree:true,attributes:true,characterData:true}));
    document.addEventListener('input',e=>{if(e.target?.closest?.('#manualPartyInputs,#poolInputs'))schedule()},true);
    document.addEventListener('change',e=>{if(e.target?.closest?.('#manualPartyInputs,#poolInputs'))schedule()},true);
    document.addEventListener('click',e=>{if(e.target?.closest?.('#manualPartyInputs,#poolInputs'))schedule()},true);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule()},{passive:true});
  }
  function setBusy(v){
    busy=!!v;window.__ARAM_PERF_PAUSE_V01567__=busy;document.body?.classList?.toggle('aramPerfBusyV01567',busy);
    if(!busy)schedule();return busy;
  }
  window.addEventListener('resize',()=>{setBusy(true);clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>setBusy(false),220)},{passive:true});

  const compat={version:V,refresh:sync,score_logic_changed:false,delegated_to:'v0.15.67 runtime performance owner'};
  window.aramRandomPartyLabelsV01559=compat;
  window.aramRandomPartyLabelFixV01561=compat;
  window.aramRandomPartyPoolLabelsV01562={...compat,visible_location:'remaining-random-pool-slot',external_pick_precedence:true,left_inline_team_label_hidden:true};
  window.aramRuntimePerformanceV01567={version:V,setBusy,refresh:sync,restoreTimerHook,getStats:()=>({...counters,busy,hookRestored,observer:!!observer}),score_logic_changed:false};
  window.__ARAM_PERF_PAUSE_V01567__=false;
  window.__ARAM_RUNTIME_PERFORMANCE_V01567__=true;
  bind();
})();
