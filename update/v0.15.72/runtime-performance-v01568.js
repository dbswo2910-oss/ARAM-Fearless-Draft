'use strict';
(()=>{
  const V='0.15.68';
  if(window.__ARAM_RUNTIME_PERFORMANCE_V01568__)return;

  window.__ARAM_RANDOM_PARTY_LABELS_V01559__=true;
  window.__ARAM_RANDOM_PARTY_LABEL_FIX_V01561__=true;
  window.__ARAM_RANDOM_PARTY_POOL_LABELS_V01562__=true;

  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  let scheduleTimer=0,observer=null,busy=false,hookRestored=false;
  const counters={scheduled:0,syncs:0,busySkips:0,governedIntervals:0,clampedIntervals:0,dedupedShopPaints:0};

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

  const shopHtmlCache=new WeakMap();
  try{
    const proto=globalThis.Element?.prototype,desc=proto&&Object.getOwnPropertyDescriptor(proto,'innerHTML');
    if(desc?.get&&desc?.set&&!proto.__aramShopHtmlDedupeV01568){
      Object.defineProperty(proto,'innerHTML',{configurable:desc.configurable,enumerable:desc.enumerable,get:desc.get,set:function(v){
        if(this?.id==='riShopPlannerV01553'){const next=String(v??'');if(shopHtmlCache.get(this)===next){counters.dedupedShopPaints++;return}shopHtmlCache.set(this,next)}
        return desc.set.call(this,v);
      }});
      Object.defineProperty(proto,'__aramShopHtmlDedupeV01568',{value:true,configurable:true});
    }
  }catch{}

  function ensureStyle(){
    if($('#aramRuntimePerformanceStyleV01568'))return;
    const st=document.createElement('style');
    st.id='aramRuntimePerformanceStyleV01568';
    st.textContent=`
      body.aramPerfBusyV01568 *{animation-play-state:paused!important;transition:none!important}
      body.aramPerfBusyV01568 header,
      body.aramPerfBusyV01568 .builderWorkspaceNav,
      body.aramPerfBusyV01568 .profileDetailOverlay,
      body.aramPerfBusyV01568 .profileDetailHead,
      body.aramPerfBusyV01568 .scoreExplainOverlay,
      body.aramPerfBusyV01568 .scoreExplainHead,
      body.aramPerfBusyV01568 .draftLockToast,
      body.aramPerfBusyV01568 .draftResultToast,
      body.aramPerfBusyV01568 .mobileBackTop{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;box-shadow:none!important}
      #random #manualPartyInputs .rpPartyLabelV01561,
      #random #manualPartyInputs .rpPartyStatePillV01559{display:none!important}
      #random #manualPartyInputs .searchWrap.rpPartyLabelWrapV01561 .searchInput{padding-right:38px!important}
      #random #poolInputs .randomPoolItem.rpPartyPoolPickV01562{border-radius:8px;background:#0c2033;box-shadow:inset 2px 0 0 #4ca9e8;padding-left:3px}
      #random #poolInputs .randomPoolTeamBadgeV01562{display:block;margin-top:2px;font-size:7px;line-height:1.1;font-weight:950;color:#83d1ff;white-space:nowrap}
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
  function schedule(){counters.scheduled++;clearTimeout(scheduleTimer);scheduleTimer=setTimeout(sync,70)}
  function bind(){
    const root=$('#random');if(!root){setTimeout(bind,160);return}
    // v0.15.72: Random Practice recurring observation/listening is centralized. Keep the
    // v0.15.68 native-move guard and compatibility renderer, but do not own another watcher.
    ensureStyle();sync();observer=null;
  }
  function setNativeInteraction(v){
    busy=!!v;window.__ARAM_PERF_PAUSE_V01568__=busy;document.body?.classList?.toggle('aramPerfBusyV01568',busy);
    if(!busy)schedule();return busy;
  }

  const compat={version:V,refresh:sync,score_logic_changed:false,delegated_to:'v0.15.68 runtime performance owner'};
  window.aramRandomPartyLabelsV01559=compat;
  window.aramRandomPartyLabelFixV01561=compat;
  window.aramRandomPartyPoolLabelsV01562={...compat,visible_location:'remaining-random-pool-slot',external_pick_precedence:true,left_inline_team_label_hidden:true};
  window.aramRuntimePerformanceV01568={version:V,setNativeInteraction,setBusy:setNativeInteraction,refresh:sync,restoreTimerHook,getStats:()=>({...counters,busy,hookRestored,observer:!!observer}),score_logic_changed:false};
  window.__ARAM_PERF_PAUSE_V01568__=false;
  window.aramRuntimePerformanceV01567=window.aramRuntimePerformanceV01568;
  window.__ARAM_RUNTIME_PERFORMANCE_V01567__=true;
  window.__ARAM_RUNTIME_PERFORMANCE_V01568__=true;
  bind();
})();
