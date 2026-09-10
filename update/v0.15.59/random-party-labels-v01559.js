'use strict';
(()=>{
  const V='0.15.59';
  if(window.__ARAM_RANDOM_PARTY_LABELS_V01559__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  let timer=0;

  function ensureStyles(){
    if($('#rpPartyLabelsStyleV01559'))return;
    const st=document.createElement('style');
    st.id='rpPartyLabelsStyleV01559';
    st.textContent=`
      /* v0.15.59 · explicit manual-vs-AutoSync labels inside the champion row */
      #random #manualPartyInputs .rpPartyPickBadgeV01558,
      #random #manualPartyInputs .rpManualLockBadgeV01558{display:none!important}
      #random #manualPartyInputs .searchWrap.rpPartyStateWrapV01559{position:relative!important}
      #random #manualPartyInputs .searchWrap.rpPartyStateWrapV01559 .searchInput{padding-right:108px!important}
      #random #manualPartyInputs .rpPartyStatePillV01559{
        pointer-events:none;position:absolute;right:38px;top:50%;transform:translateY(-50%);z-index:4;
        display:inline-flex;align-items:center;justify-content:center;min-width:48px;height:22px;padding:0 7px;
        border-radius:999px;font-size:8px;line-height:1;font-weight:950;letter-spacing:.01em;white-space:nowrap;
        box-shadow:0 1px 0 rgba(255,255,255,.04) inset
      }
      #random #manualPartyInputs .rpPartyStatePillV01559.team{
        color:#a8ddff;background:#123a5a;border:1px solid #3377a5
      }
      #random #manualPartyInputs .rpPartyStatePillV01559.manual{
        color:#9af1bd;background:#143b2b;border:1px solid #34845f
      }
      #random #manualPartyInputs .searchWrap.rpPartyGhostWrapV01558.rpPartyStateWrapV01559 .rpPartyGhostV01558{right:106px!important}
      @media(max-width:760px){
        #random #manualPartyInputs .rpPartyStatePillV01559{right:34px;min-width:42px;padding:0 5px;font-size:7px}
        #random #manualPartyInputs .searchWrap.rpPartyStateWrapV01559 .searchInput{padding-right:96px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function stateOf(row){
    if(row.classList.contains('rpManualLockedV01558'))return{kind:'manual',label:'수동고정',title:'프로그램에서 직접 선택해 고정한 챔피언'};
    if(row.classList.contains('rpPartySyncedV01558'))return{kind:'team',label:'팀원픽',title:'League Client AutoSync가 감지한 우리 파티의 현재 챔피언'};
    return null;
  }

  function decorateRow(row){
    const wrap=$('.searchWrap',row);if(!wrap)return;
    const state=stateOf(row);
    let pill=$('.rpPartyStatePillV01559',wrap);
    const oldTeam=$('.rpPartyPickBadgeV01558',row),oldManual=$('.rpManualLockBadgeV01558',row);
    if(oldTeam)oldTeam.textContent='팀원픽';
    if(oldManual)oldManual.textContent='수동고정';

    if(!state){
      pill?.remove();
      wrap.classList.remove('rpPartyStateWrapV01559');
      row.removeAttribute('data-rp-party-state');
      return;
    }

    wrap.classList.add('rpPartyStateWrapV01559');
    if(!pill){
      pill=document.createElement('span');
      pill.className='rpPartyStatePillV01559';
      wrap.appendChild(pill);
    }
    pill.classList.toggle('team',state.kind==='team');
    pill.classList.toggle('manual',state.kind==='manual');
    pill.textContent=state.label;
    pill.title=state.title;
    pill.setAttribute('aria-label',state.title);
    row.dataset.rpPartyState=state.kind;
  }

  function sync(){
    if(!$('#random')||!$('#manualPartyInputs'))return;
    ensureStyles();
    $$('#manualPartyInputs .randomDraftRow').forEach(decorateRow);
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(sync,70)}
  function start(){
    const host=$('#manualPartyInputs');if(!host){setTimeout(start,120);return}
    ensureStyles();sync();
    new MutationObserver(schedule).observe(host,{childList:true,subtree:true,attributes:true,characterData:true});
    document.addEventListener('input',e=>{if(e.target?.closest?.('#manualPartyInputs'))schedule()},true);
    document.addEventListener('click',e=>{if(e.target?.closest?.('#manualPartyInputs'))schedule()},true);
    setInterval(sync,650);
    window.__ARAM_RANDOM_PARTY_LABELS_V01559__=true;
    window.aramRandomPartyLabelsV01559={
      version:V,refresh:sync,score_logic_changed:false,
      team_label:'팀원픽',manual_label:'수동고정',
      placement:'inside-search-row-before-clear-control'
    };
  }
  start();
})();
