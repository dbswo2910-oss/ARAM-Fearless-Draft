'use strict';
(()=>{
  const V='0.15.60';
  if(window.__ARAM_UI_REFRESH_V01560__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  let catalog=null,pending=null,timer=0;

  function ensureStyle(){
    if($('#aramUiRefreshStyleV01560'))return;
    const st=document.createElement('style');
    st.id='aramUiRefreshStyleV01560';
    st.textContent=`
      /* v0.15.60 · visible party label unified; internal lock state unchanged */
      #random #manualPartyInputs .rpPartyStatePillV01559.manual{
        color:#9fdcff!important;background:#123452!important;border-color:#2e6791!important;
        font-size:0!important
      }
      #random #manualPartyInputs .rpPartyStatePillV01559.manual::after{
        content:'팀원픽';font-size:8px!important;line-height:1;font-weight:950;letter-spacing:-.01em
      }
    `;
    document.head.appendChild(st);
  }

  async function loadCatalog(){
    if(catalog?.ok)return catalog;
    if(pending)return pending;
    pending=(async()=>{
      try{catalog=await window.aramDesktop?.getItemCatalog?.()}catch{}
      pending=null;return catalog;
    })();
    return pending;
  }

  function itemIdFrom(img){
    const direct=String(img?.dataset?.itemId||'').match(/\d+/)?.[0];
    if(direct)return direct;
    const holder=img?.closest?.('[data-ri-icon-item-v01556],[data-aram-item-icon-v01557]');
    const data=String(holder?.dataset?.riIconItemV01556||holder?.dataset?.aramItemIconV01557||'').match(/\d+/)?.[0];
    if(data)return data;
    const src=String(img?.getAttribute?.('src')||'');
    return src.match(/\/item\/(\d+)\.png/i)?.[1]||src.match(/\/icons2d\/(\d+)[^/]*\.png/i)?.[1]||'';
  }

  function fallbackUrl(id){
    const ver=String(catalog?.version||'16.17.1');
    return `https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(ver)}/img/item/${encodeURIComponent(id)}.png`;
  }

  function latestUrl(id){return String(catalog?.items?.[String(id)]?.iconUrl||'')}

  function refreshImg(img){
    const id=itemIdFrom(img);if(!id)return;
    if(img.dataset.aramArtFailedV01560===id)return;
    const latest=latestUrl(id);if(!latest)return;
    const old=String(img.getAttribute('src')||'');
    if(old.includes('raw.communitydragon.org/latest/')&&img.dataset.aramArtV01560===id)return;
    img.dataset.aramArtV01560=id;
    img.dataset.aramArtFallbackV01560=fallbackUrl(id);
    img.onerror=()=>{
      const fb=img.dataset.aramArtFallbackV01560||'';
      img.dataset.aramArtFailedV01560=id;
      if(fb&&img.src!==fb){img.onerror=()=>{img.style.display='none'};img.src=fb;return}
      img.style.display='none';
    };
    img.style.display='';
    img.src=latest+(latest.includes('?')?'&':'?')+'aramArt=0.15.60';
  }

  function refreshPartyLabels(){
    ensureStyle();
    $$('#random #manualPartyInputs .rpPartyStatePillV01559').forEach(pill=>{
      pill.setAttribute('aria-label','우리 파티 팀원픽');
      pill.title='우리 파티 팀원픽';
      if(pill.classList.contains('team')&&pill.textContent!=='팀원픽')pill.textContent='팀원픽';
    });
  }

  function refreshIcons(){
    const selectors=[
      'img.riItemIconV01556',
      'img.aramItemIconV01557',
      '#historyMatchDetail .matchItems img'
    ];
    $$(selectors.join(',')).forEach(refreshImg);
  }

  async function sync(){
    refreshPartyLabels();
    await loadCatalog();
    if(catalog?.ok)refreshIcons();
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(sync,70)}
  function start(){
    ensureStyle();sync();
    const mo=new MutationObserver(schedule);
    mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class']});
    document.addEventListener('click',schedule,true);
    setInterval(schedule,700);
    window.__ARAM_UI_REFRESH_V01560__=true;
    window.aramUiRefreshV01560={
      version:V,refresh:sync,score_logic_changed:false,
      visible_party_label:'팀원픽',internal_manual_lock_state_preserved:true,
      item_art_source:'CommunityDragon latest Riot client lol-game-data mirror',
      item_art_fallback:'Data Dragon versioned item art',
      item_targets:['riItemIconV01556','aramItemIconV01557','#historyMatchDetail .matchItems img']
    };
  }
  start();
})();
