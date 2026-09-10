'use strict';
(()=>{
  const V='0.15.58';
  if(window.__ARAM_RANDOM_PARTY_PICKS_V01558__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let cachedState=null,timer=0,stateTimer=0,stateBusy=false;

  function ensureStyles(){
    if($('#rpPartyPicksStyleV01558'))return;
    const st=document.createElement('style');
    st.id='rpPartyPicksStyleV01558';
    st.textContent=`
      /* v0.15.58 · exact Random Practice pick UI only */
      #random.rpPartyPicksV01558 #externalCheck.rpPickStatusV01555,
      #random.rpPartyPicksV01558 #externalCheck.rpCheckStripV01558{display:block!important;width:100%!important}
      #random.rpPartyPicksV01558 #externalCheck .randomCheckGrid{
        width:100%!important;display:grid!important;
        grid-template-columns:minmax(0,1.45fr) minmax(160px,.72fr) minmax(210px,1fr)!important;
        gap:8px!important;margin:0!important
      }
      #random.rpPartyPicksV01558 #externalCheck .checkCard{
        min-width:0!important;min-height:58px;margin:0!important;padding:9px 11px!important;
        border-radius:10px!important;display:flex;flex-direction:column;justify-content:center;gap:4px
      }
      #random.rpPartyPicksV01558 #externalCheck .checkCard>span{
        font-size:8px!important;line-height:1.1!important;text-transform:none;letter-spacing:.02em
      }
      #random.rpPartyPicksV01558 #externalCheck .checkCard>b{
        display:block;font-size:11px!important;line-height:1.3!important;white-space:normal;overflow-wrap:anywhere
      }
      #random.rpPartyPicksV01558 #externalCheck .checkCard .rpCheckChipsV01558{
        display:flex;flex-wrap:wrap;gap:4px;align-items:center
      }
      #random.rpPartyPicksV01558 #externalCheck .rpCheckChipV01558{
        display:inline-flex;align-items:center;padding:3px 6px;border-radius:999px;
        border:1px solid #755f28;background:#342b11;color:#f4d875;font-size:9px;font-weight:900;line-height:1
      }
      #random.rpPartyPicksV01558 #externalCheck .checkCard.good .rpCheckChipV01558{
        border-color:#2b7655;background:#123426;color:#86eab5
      }
      #random.rpPartyPicksV01558 .rpPartyNoteV01558{
        display:flex;align-items:center;gap:6px;margin:4px 0 6px;padding:6px 8px;
        border:1px solid #274969;border-radius:8px;background:#0a1a2b;color:#86a9ca;font-size:8px;line-height:1.25
      }
      #random.rpPartyPicksV01558 .rpPartyNoteV01558 b{color:#a9d8ff;font-size:8px}
      #random.rpPartyPicksV01558 #manualPartyInputs .randomDraftRow.rpPartySyncedV01558{
        border-radius:9px;background:linear-gradient(90deg,#0b2134 0,#091625 62%);box-shadow:inset 2px 0 0 #4ca9e8;
        padding:4px 5px 4px 4px
      }
      #random.rpPartyPicksV01558 #manualPartyInputs .randomDraftRow.rpManualLockedV01558{
        border-radius:9px;background:linear-gradient(90deg,#10291f 0,#091625 62%);box-shadow:inset 2px 0 0 #49c987;
        padding:4px 5px 4px 4px
      }
      #random.rpPartyPicksV01558 .rpPartyPickBadgeV01558,
      #random.rpPartyPicksV01558 .rpManualLockBadgeV01558{
        display:block;margin-top:2px;width:max-content;padding:2px 4px;border-radius:4px;
        font-size:7px;line-height:1;font-weight:950;white-space:nowrap
      }
      #random.rpPartyPicksV01558 .rpPartyPickBadgeV01558{color:#8ed4ff;background:#123452;border:1px solid #2e6791}
      #random.rpPartyPicksV01558 .rpManualLockBadgeV01558{color:#84eeb5;background:#133426;border:1px solid #2a7454}
      #random.rpPartyPicksV01558 #manualPartyInputs .searchWrap.rpPartyGhostWrapV01558{position:relative}
      #random.rpPartyPicksV01558 #manualPartyInputs .rpPartyGhostV01558{
        pointer-events:none;position:absolute;z-index:1;left:11px;right:34px;top:50%;transform:translateY(-50%);
        display:flex;align-items:center;gap:7px;min-width:0;transition:opacity .12s ease
      }
      #random.rpPartyPicksV01558 #manualPartyInputs .rpPartyGhostV01558 b{
        color:#e9f5ff;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis
      }
      #random.rpPartyPicksV01558 #manualPartyInputs .rpPartyGhostV01558 small{
        color:#7698b8;font-size:8px;white-space:nowrap
      }
      #random.rpPartyPicksV01558 #manualPartyInputs .searchWrap.rpPartyGhostWrapV01558:focus-within .rpPartyGhostV01558{opacity:0}
      #random.rpPartyPicksV01558 #manualPartyInputs .searchWrap.rpPartyGhostWrapV01558 .searchInput{color:#eaf6ff}
      #random.rpPartyPicksV01558 #poolInputs .randomPoolItem.rpPartyPoolPickV01558{
        border-radius:8px;background:#0c2033;box-shadow:inset 2px 0 0 #4ca9e8;padding-left:3px
      }
      #random.rpPartyPicksV01558 .randomPoolTeamBadgeV01558{
        display:block;margin-top:2px;font-size:7px;line-height:1.1;font-weight:950;color:#83d1ff;white-space:nowrap
      }
      @media(max-width:1180px){
        #random.rpPartyPicksV01558 #externalCheck .randomCheckGrid{
          grid-template-columns:minmax(0,1.35fr) minmax(140px,.7fr) minmax(180px,1fr)!important
        }
      }
      @media(max-width:760px){
        #random.rpPartyPicksV01558 #externalCheck .randomCheckGrid{grid-template-columns:1fr!important}
        #random.rpPartyPicksV01558 #manualPartyInputs .rpPartyGhostV01558 small{display:none}
      }
    `;
    document.head.appendChild(st);
  }

  function resolveChamp(x){
    try{if(typeof lolAutoSyncResolveChamp==='function')return lolAutoSyncResolveChamp(x)||''}catch{}
    if(!x)return'';
    if(typeof x==='string')return x.trim();
    return String(x.championName||x.name||x.displayName||x.alias||'').trim();
  }
  function unique(xs){const out=[];for(const x of xs){const n=resolveChamp(x);if(n&&!out.includes(n))out.push(n)}return out}
  function getLiveState(){
    try{if(typeof lolAutoSync!=='undefined'&&lolAutoSync?.lastState)return lolAutoSync.lastState}catch{}
    return cachedState;
  }
  function partyPicks(){
    const s=getLiveState();
    if(!s||s.phase!=='champ_select'||!s.isAram)return[];
    const picks=unique(s.party||[]);
    const local=resolveChamp(s.localChampion);
    if(local&&!picks.includes(local))picks.push(local);
    const q=Math.max(1,Math.min(5,Number(s.partySize)||picks.length||1));
    return picks.slice(0,q);
  }
  function manualLockedAt(i){
    try{return String(randomState?.manual?.[i]||'').trim()}catch{return''}
  }
  function profile(name){
    try{return typeof byName!=='undefined'?byName?.[name]||null:null}catch{return null}
  }
  function portrait(name){
    try{if(typeof draftPortraitHtml==='function')return draftPortraitHtml(name,'pick')}catch{}
    return `<div class="randomMiniPortrait">${esc(String(name||'?').slice(0,2))}</div>`;
  }

  function updateSectionCopy(hasParty){
    const check=$('#externalCheck');
    const checkTitle=check?.previousElementSibling;
    if(checkTitle?.classList?.contains('section')&&checkTitle.textContent!=='현재 조합 체크')checkTitle.textContent='현재 조합 체크';
    const man=$('#manualPartyInputs');
    const manTitle=man?.previousElementSibling;
    if(manTitle?.classList?.contains('section')){
      const wanted=hasParty?'우리 파티 현재픽 · 고정할 챔피언만 선택':'우리 파티 수동 고정 · 일부만 골라도 나머지는 자동 추천';
      if(manTitle.textContent!==wanted)manTitle.textContent=wanted;
    }
  }

  function decorateManual(){
    const host=$('#manualPartyInputs');if(!host)return;
    const picks=partyPicks();
    updateSectionCopy(!!picks.length);
    let note=$('.rpPartyNoteV01558',host.parentElement);
    if(picks.length){
      if(!note){note=document.createElement('div');note.className='rpPartyNoteV01558';host.before(note)}
      const msg='<b>현재픽은 표시만</b><span>추천에서 자동 고정되지 않습니다 · 고정할 픽만 검색창에서 선택</span>';
      if(note.innerHTML!==msg)note.innerHTML=msg;
    }else if(note)note.remove();

    $$('#manualPartyInputs .randomDraftRow').forEach((row,i)=>{
      const locked=manualLockedAt(i),pick=picks[i]||'';
      const slot=$('.slot',row),portraitHost=$(`[data-random-key="manual-${i}"]`,row),meta=$('.meta',row),tier=$('.tier',row),wrap=$('.searchWrap',row);
      let partyBadge=$('.rpPartyPickBadgeV01558',row),lockBadge=$('.rpManualLockBadgeV01558',row),ghost=$('.rpPartyGhostV01558',row);

      if(locked){
        row.classList.toggle('rpManualLockedV01558',true);row.classList.toggle('rpPartySyncedV01558',false);
        if(partyBadge)partyBadge.remove();
        if(!lockBadge&&slot){lockBadge=document.createElement('span');lockBadge.className='rpManualLockBadgeV01558';lockBadge.textContent='고정';slot.appendChild(lockBadge)}
        if(ghost)ghost.remove();
        wrap?.classList.remove('rpPartyGhostWrapV01558');
        if(portraitHost)delete portraitHost.dataset.rp58PartyPick;
        return;
      }

      row.classList.toggle('rpManualLockedV01558',false);
      if(lockBadge)lockBadge.remove();
      if(!pick){
        row.classList.toggle('rpPartySyncedV01558',false);
        if(partyBadge)partyBadge.remove();
        if(ghost)ghost.remove();
        wrap?.classList.remove('rpPartyGhostWrapV01558');
        if(portraitHost?.dataset?.rp58PartyPick){portraitHost.innerHTML='<div class="randomMiniPortrait">·</div>';delete portraitHost.dataset.rp58PartyPick}
        return;
      }

      row.classList.toggle('rpPartySyncedV01558',true);
      if(!partyBadge&&slot){partyBadge=document.createElement('span');partyBadge.className='rpPartyPickBadgeV01558';partyBadge.textContent='현재픽';slot.appendChild(partyBadge)}
      if(portraitHost&&portraitHost.dataset.rp58PartyPick!==pick){portraitHost.innerHTML=portrait(pick);portraitHost.dataset.rp58PartyPick=pick}
      const c=profile(pick),role=c?.['주 역할']||'-',t=c?.['종합티어']||'-';
      if(meta&&meta.textContent!==role)meta.textContent=role;
      if(tier&&tier.textContent!==t)tier.textContent=t;
      if(wrap){
        wrap.classList.toggle('rpPartyGhostWrapV01558',true);
        if(!ghost){ghost=document.createElement('div');ghost.className='rpPartyGhostV01558';wrap.appendChild(ghost)}
        if(ghost.dataset.name!==pick){ghost.dataset.name=pick;ghost.innerHTML=`<b>${esc(pick)}</b><small>팀원 현재픽 · 클릭하면 수동 고정 검색</small>`}
        const inp=$('.searchInput',wrap);if(inp&&inp.placeholder!=='')inp.placeholder='';
      }
    });
  }

  function decoratePool(){
    const picks=new Set(partyPicks());
    $$('#poolInputs .randomPoolItem').forEach(item=>{
      const n=String($('.searchInput',item)?.dataset?.committed||$('.searchInput',item)?.value||'').trim();
      const desired=!!n&&picks.has(n)&&!$('.randomPoolTakenBadge',item);
      item.classList.toggle('rpPartyPoolPickV01558',desired);
      let badge=$('.randomPoolTeamBadgeV01558',item);
      if(desired&&!badge){const slot=$('.slot',item);if(slot){badge=document.createElement('span');badge.className='randomPoolTeamBadgeV01558';badge.textContent='팀원픽';slot.appendChild(badge)}}
      if(!desired&&badge)badge.remove();
      const wantedTitle=desired?'우리 파티가 현재 들고 있는 챔피언 · 추천 후보에는 그대로 포함':'';
      if((item.title||'')!==wantedTitle)item.title=wantedTitle;
    });
  }

  function decorateChecks(){
    const host=$('#externalCheck');if(!host)return;
    host.classList.add('rpCheckStripV01558');
    updateSectionCopy(!!partyPicks().length);
    const cards=$$('#externalCheck .randomCheckGrid>.checkCard');
    cards.forEach((card,i)=>{
      if(card.dataset.rp58Decorated==='1')return;
      const label=$(':scope>span',card),value=$(':scope>b',card);
      if(i===0){
        if(label)label.textContent='조합 보완';
        if(value){
          const raw=String(value.textContent||'').trim();
          const parts=raw?raw.split(/\s*·\s*/).filter(Boolean):[];
          value.classList.add('rpCheckChipsV01558');
          value.innerHTML=(parts.length?parts:['확인 중']).map(x=>`<span class="rpCheckChipV01558">${esc(x)}</span>`).join('');
        }
      }else if(i===1){if(label)label.textContent='실질 딜 밸런스 · AD / AP'}
      else if(i===2){if(label)label.textContent='추천 계산'}
      card.dataset.rp58Decorated='1';
    });
  }

  function sync(){
    const root=$('#random');if(!root)return;
    ensureStyles();root.classList.add('rpPartyPicksV01558');
    decorateManual();decoratePool();decorateChecks();
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(sync,55)}
  async function refreshFallbackState(){
    let hasGlobal=false;try{hasGlobal=typeof lolAutoSync!=='undefined'&&!!lolAutoSync}catch{}
    if(hasGlobal||stateBusy||!window.aramDesktop?.getAutoSyncState)return;
    stateBusy=true;
    try{cachedState=await window.aramDesktop.getAutoSyncState()}catch{}finally{stateBusy=false;schedule()}
  }
  function start(){
    const root=$('#random');if(!root){setTimeout(start,120);return}
    ensureStyles();sync();
    const watch=['#manualPartyInputs','#poolInputs','#externalCheck'].map(x=>$(x)).filter(Boolean);
    const mo=new MutationObserver(schedule);watch.forEach(el=>mo.observe(el,{childList:true,subtree:true,characterData:true,attributes:true}));
    document.addEventListener('input',e=>{if(e.target?.closest?.('#random'))schedule()},true);
    document.addEventListener('click',e=>{if(e.target?.closest?.('#random'))schedule()},true);
    stateTimer=setInterval(()=>{refreshFallbackState();schedule()},650);
    window.__ARAM_RANDOM_PARTY_PICKS_V01558__=true;
    window.aramRandomPartyPicksV01558={
      version:V,refresh:sync,score_logic_changed:false,
      party_current_pick_is_display_only:true,
      pool_party_badge:'팀원픽',
      check_layout:'full-width 3-card strip'
    };
  }
  start();
})();
