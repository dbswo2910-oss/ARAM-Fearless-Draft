'use strict';
(()=>{
  const V='0.15.61';
  if(window.__ARAM_RANDOM_PARTY_LABEL_FIX_V01561__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  let timer=0;

  function ensureStyle(){
    if($('#rpPartyLabelFixStyleV01561'))return;
    const st=document.createElement('style');
    st.id='rpPartyLabelFixStyleV01561';
    st.textContent=`
      /* v0.15.61 · always render visible party label from row state itself */
      #random #manualPartyInputs .rpPartyStatePillV01559{display:none!important}
      #random #manualPartyInputs .searchWrap.rpPartyLabelWrapV01561{position:relative!important}
      #random #manualPartyInputs .searchWrap.rpPartyLabelWrapV01561 .searchInput{padding-right:108px!important}
      #random #manualPartyInputs .rpPartyLabelV01561{
        pointer-events:none;position:absolute;right:38px;top:50%;transform:translateY(-50%);z-index:8;
        display:inline-flex;align-items:center;justify-content:center;min-width:48px;height:22px;padding:0 7px;
        border:1px solid #3377a5;border-radius:999px;background:#123a5a;color:#a8ddff;
        font-size:8px;line-height:1;font-weight:950;letter-spacing:.01em;white-space:nowrap;
        box-shadow:0 1px 0 rgba(255,255,255,.04) inset
      }
      #random #manualPartyInputs .searchWrap.rpPartyGhostWrapV01558.rpPartyLabelWrapV01561 .rpPartyGhostV01558{right:106px!important}
      @media(max-width:760px){
        #random #manualPartyInputs .rpPartyLabelV01561{right:34px;min-width:42px;padding:0 5px;font-size:7px}
        #random #manualPartyInputs .searchWrap.rpPartyLabelWrapV01561 .searchInput{padding-right:96px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function manualLockedAt(i){
    try{return String(randomState?.manual?.[i]||'').trim()}catch{return''}
  }

  function setSectionTitle(){
    const host=$('#manualPartyInputs');
    const title=host?.previousElementSibling;
    if(title?.classList?.contains('section')){
      const wanted='우리 파티 챔피언 · 고정할 픽만 선택';
      if(title.textContent!==wanted)title.textContent=wanted;
    }
  }

  function rowState(row,i){
    const synced=row.classList.contains('rpPartySyncedV01558');
    const manual=row.classList.contains('rpManualLockedV01558')||!!manualLockedAt(i);
    if(!synced&&!manual)return null;
    return manual?'manual':'autosync';
  }

  function decorateRow(row,i){
    const wrap=$('.searchWrap',row);if(!wrap)return;
    const origin=rowState(row,i);
    const old=$('.rpPartyStatePillV01559',wrap);if(old)old.style.display='none';
    let pill=$('.rpPartyLabelV01561',wrap);
    if(!origin){
      pill?.remove();
      wrap.classList.remove('rpPartyLabelWrapV01561');
      row.removeAttribute('data-rp-party-origin-v01561');
      return;
    }
    wrap.classList.add('rpPartyLabelWrapV01561');
    if(!pill){
      pill=document.createElement('span');
      pill.className='rpPartyLabelV01561';
      wrap.appendChild(pill);
    }
    pill.textContent='팀원픽';
    pill.title='우리 파티가 선택한 챔피언';
    pill.setAttribute('aria-label','우리 파티 팀원픽');
    pill.dataset.origin=origin;
    row.dataset.rpPartyOriginV01561=origin;
  }

  function sync(){
    if(!$('#random')||!$('#manualPartyInputs'))return;
    ensureStyle();
    setSectionTitle();
    $$('#manualPartyInputs .randomDraftRow').forEach(decorateRow);
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(sync,45)}
  function start(){
    const host=$('#manualPartyInputs');if(!host){setTimeout(start,120);return}
    ensureStyle();sync();
    new MutationObserver(schedule).observe(host.parentElement||host,{childList:true,subtree:true,attributes:true,characterData:true});
    document.addEventListener('input',e=>{if(e.target?.closest?.('#manualPartyInputs'))schedule()},true);
    document.addEventListener('click',e=>{if(e.target?.closest?.('#manualPartyInputs'))schedule()},true);
    setInterval(sync,450);
    window.__ARAM_RANDOM_PARTY_LABEL_FIX_V01561__=true;
    window.aramRandomPartyLabelFixV01561={
      version:V,refresh:sync,score_logic_changed:false,
      visible_label:'팀원픽',section_title:'우리 파티 챔피언 · 고정할 픽만 선택',
      source_states:['rpPartySyncedV01558','rpManualLockedV01558','randomState.manual'],
      internal_manual_lock_state_preserved:true
    };
  }
  start();
})();
