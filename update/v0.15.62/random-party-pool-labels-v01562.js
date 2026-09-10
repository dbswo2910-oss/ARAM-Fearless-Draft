'use strict';
(()=>{
  const V='0.15.62';
  if(window.__ARAM_RANDOM_PARTY_POOL_LABELS_V01562__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  let timer=0;

  function ensureStyle(){
    if($('#rpPartyPoolLabelsStyleV01562'))return;
    const st=document.createElement('style');
    st.id='rpPartyPoolLabelsStyleV01562';
    st.textContent=`
      /* v0.15.62 · team-pick badge belongs in the remaining-random pool */
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
    try{
      const xs=Array.isArray(randomState?.manual)?randomState.manual:[];
      xs.forEach(x=>{const n=String(x||'').trim();if(n&&!out.includes(n))out.push(n)});
    }catch{}
    return out;
  }

  function syncedNamesFromRows(){
    const out=[];
    $$('#manualPartyInputs .randomDraftRow.rpPartySyncedV01558').forEach(row=>{
      const ghost=$('.rpPartyGhostV01558',row);
      const portrait=$('[data-random-key^="manual-"]',row);
      const input=$('.searchInput',row);
      const n=String(
        ghost?.dataset?.name ||
        portrait?.dataset?.rp58PartyPick ||
        input?.dataset?.committed ||
        input?.value || ''
      ).trim();
      if(n&&!out.includes(n))out.push(n);
    });
    return out;
  }

  function teamNames(){
    return new Set([...manualNames(),...syncedNamesFromRows()]);
  }

  function clearLeftInlineLabel(){
    $$('#manualPartyInputs .rpPartyLabelV01561').forEach(x=>{x.style.display='none'});
    $$('#manualPartyInputs .searchWrap.rpPartyLabelWrapV01561').forEach(w=>{
      w.classList.remove('rpPartyLabelWrapV01561');
      const input=$('.searchInput',w);if(input)input.style.removeProperty('padding-right');
    });
  }

  function decoratePool(){
    const team=teamNames();
    $$('#poolInputs .randomPoolItem').forEach(item=>{
      const input=$('.searchInput',item);
      const name=String(input?.dataset?.committed||input?.value||'').trim();
      const taken=!!$('.randomPoolTakenBadge',item);
      const desired=!!name&&team.has(name)&&!taken;
      const legacy=$('.randomPoolTeamBadgeV01558',item);
      let badge=$('.randomPoolTeamBadgeV01562',item);

      item.classList.toggle('rpPartyPoolPickV01562',desired);
      if(desired){
        if(legacy){
          if(badge)badge.remove();
        }else if(!badge){
          const slot=$('.slot',item);
          if(slot){
            badge=document.createElement('span');
            badge.className='randomPoolTeamBadgeV01562';
            badge.textContent='팀원픽';
            badge.title='우리 파티가 선택한 챔피언';
            slot.appendChild(badge);
          }
        }
      }else if(badge){
        badge.remove();
      }
    });
  }

  function sync(){
    if(!$('#random')||!$('#poolInputs'))return;
    ensureStyle();
    clearLeftInlineLabel();
    decoratePool();
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(sync,35)}
  function start(){
    const root=$('#random');if(!root){setTimeout(start,120);return}
    ensureStyle();sync();
    const watch=[$('#manualPartyInputs'),$('#poolInputs')].filter(Boolean);
    const mo=new MutationObserver(schedule);
    watch.forEach(el=>mo.observe(el,{childList:true,subtree:true,attributes:true,characterData:true}));
    document.addEventListener('input',e=>{if(e.target?.closest?.('#manualPartyInputs,#poolInputs'))schedule()},true);
    document.addEventListener('click',e=>{if(e.target?.closest?.('#manualPartyInputs,#poolInputs'))schedule()},true);
    setInterval(sync,350);
    window.__ARAM_RANDOM_PARTY_POOL_LABELS_V01562__=true;
    window.aramRandomPartyPoolLabelsV01562={
      version:V,refresh:sync,score_logic_changed:false,
      visible_location:'remaining-random-pool-slot',
      team_sources:['randomState.manual','rpPartySyncedV01558'],
      external_pick_precedence:true,
      left_inline_team_label_hidden:true
    };
  }
  start();
})();
