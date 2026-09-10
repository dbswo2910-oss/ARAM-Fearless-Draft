'use strict';
(()=>{
  const V='0.15.63';
  if(window.__ARAM_ITEM_ART_HOTFIX_V01563__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const OVERRIDE={
    '3143':{
      names:['란두인의 예언',"Randuin's Omen",'Randuins Omen'],
      url:'https://raw.communitydragon.org/latest/game/assets/items/icons2d/3143_randuins_omen.png'
    },
    '3075':{
      names:['가시 갑옷','Thornmail'],
      url:'https://raw.communitydragon.org/latest/game/assets/items/icons2d/3075_thornmail.png'
    }
  };
  const KNOWN_ROOTS=[
    '#liveBuilds','#liveUtils','#randomLiveTopbar','#randomLiveSummary','#randomLiveBuildAdvice',
    '#randomBuilds','#randomUtils','#randomThreatList','#randomIngameShell','#dataCard','#historyMatchDetail'
  ];
  let timer=0;

  function itemIdFrom(img){
    const direct=String(img?.dataset?.itemId||'').match(/\d+/)?.[0];
    if(direct&&OVERRIDE[direct])return direct;
    const holder=img?.closest?.('[data-ri-icon-item-v01556],[data-aram-item-icon-v01557],[data-item-id]');
    const data=String(holder?.dataset?.riIconItemV01556||holder?.dataset?.aramItemIconV01557||holder?.dataset?.itemId||'').match(/\d+/)?.[0];
    if(data&&OVERRIDE[data])return data;
    const src=String(img?.getAttribute?.('src')||'');
    const bySrc=src.match(/(?:\/item\/|\/icons2d\/)(\d+)[^/]*\.png/i)?.[1]||'';
    if(bySrc&&OVERRIDE[bySrc])return bySrc;
    const scope=img?.closest?.('[data-ri-icon-item-v01556],[data-aram-item-icon-v01557],.matchItems,.checkCard,.coachCard,.randomLiveCard,.card,.panel,li,div')||img?.parentElement;
    const text=String(scope?.textContent||'').replace(/\s+/g,' ').trim();
    for(const [id,meta] of Object.entries(OVERRIDE)){
      if(meta.names.some(n=>text.includes(n)))return id;
    }
    return'';
  }

  function fallbackUrl(id){
    let ver='16.18.1';
    try{ver=String(window.aramUiRefreshV01560?.catalogVersion||ver)}catch{}
    return `https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(ver)}/img/item/${id}.png`;
  }

  function forceLatest(img,id){
    const meta=OVERRIDE[id];if(!meta)return;
    const base=meta.url;
    const wanted=base+'?aramArt='+V;
    if(img.dataset.aramCurrentArtV01563===id&&String(img.src||'').includes(base))return;
    img.dataset.aramCurrentArtV01563=id;
    img.dataset.itemId=id;
    /* Tell v0.15.60 this is already a latest-art image so its interval cannot restore the stale catalog path. */
    img.dataset.aramArtV01560=id;
    delete img.dataset.aramArtFailedV01560;
    const fb=fallbackUrl(id);
    img.onerror=()=>{
      if(img.dataset.aramCurrentArtFallbackV01563==='1'){img.style.display='none';return}
      img.dataset.aramCurrentArtFallbackV01563='1';
      img.onerror=()=>{img.style.display='none'};
      img.src=fb;
    };
    img.style.display='';
    img.src=wanted;
  }

  function sync(){
    const selectors=[];
    for(const root of KNOWN_ROOTS)selectors.push(`${root} img`);
    selectors.push('img.riItemIconV01556','img.aramItemIconV01557');
    $$(selectors.join(',')).forEach(img=>{
      const id=itemIdFrom(img);if(id)forceLatest(img,id);
    });
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(sync,50)}
  function start(){
    sync();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','data-item-id']});
    document.addEventListener('click',schedule,true);
    setInterval(schedule,900);
    window.__ARAM_ITEM_ART_HOTFIX_V01563__=true;
    window.aramItemArtHotfixV01563={
      version:V,refresh:sync,score_logic_changed:false,
      override_item_ids:['3143','3075'],
      source:'CommunityDragon latest /game/assets/items/icons2d current base art',
      urls:Object.fromEntries(Object.entries(OVERRIDE).map(([id,x])=>[id,x.url]))
    };
  }
  start();
})();
