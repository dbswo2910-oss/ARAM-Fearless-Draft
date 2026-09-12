'use strict';
(()=>{
  const V='0.15.107';
  if(window.__ARAM_VIEW_BOUNDARY_REPAIR_V015107__===true)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const text=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  let repairTimer=0;

  function ensureStyle(){
    if($('#viewBoundaryRepairStyleV015107'))return;
    const st=document.createElement('style');
    st.id='viewBoundaryRepairStyleV015107';
    st.textContent=`
      /* v0.15.107 — DATA is allowed to style DATA only. */
      .rp107DataHost{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(320px,.72fr)!important;gap:12px!important;align-items:start!important;width:100%!important;max-width:none!important;min-width:0!important}
      .rp107DataHost>#dataHubTopNavV015103{grid-column:1/-1!important;grid-row:1!important;margin:0 0 2px!important}
      .rp107DataHost>.rp107DataTier{grid-column:1!important;grid-row:2!important;min-width:0!important}
      .rp107DataHost>.rp107DataDetail{grid-column:2!important;grid-row:2!important;min-width:0!important;width:100%!important;max-width:none!important}
      .rp107DataHost.rp107PatchMode{grid-template-columns:minmax(0,1fr)!important}
      .rp107DataHost.rp107PatchMode>.rp107DataTier{display:none!important}
      .rp107DataHost.rp107PatchMode>.rp107DataDetail{grid-column:1/-1!important;grid-row:2!important;width:100%!important;max-width:none!important;min-width:0!important}
      .rp107DataHost.rp107PatchMode #dataCard{width:100%!important;max-width:none!important;min-width:0!important}
      .rp107DataHost.rp107PatchMode #dataPatchNotesV01599{width:100%!important;max-width:none!important;margin:0!important}
      .rp107DataHost.rp107PatchMode .dh99Layout{grid-template-columns:minmax(0,1fr) 280px!important;gap:16px!important;align-items:start!important;width:100%!important}
      .rp107DataHost.rp107PatchMode .dh99Main{min-width:0!important;width:100%!important}
      .rp107DataHost.rp107PatchMode .dh99Side{width:280px!important;min-width:280px!important}
      @media(max-width:1180px){
        .rp107DataHost{grid-template-columns:minmax(0,1fr)!important}
        .rp107DataHost>.rp107DataTier,.rp107DataHost>.rp107DataDetail{grid-column:1!important;grid-row:auto!important}
        .rp107DataHost.rp107PatchMode .dh99Layout{grid-template-columns:1fr!important}
        .rp107DataHost.rp107PatchMode .dh99Side{width:auto!important;min-width:0!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      }

      /* v0.15.107 — exact-ID RANDOM pick workspace. */
      #random.rp107RandomRepair{position:relative!important;left:50%!important;transform:translateX(-50%)!important;width:min(1600px,calc(100vw - 36px))!important;max-width:none!important;margin-left:0!important;margin-right:0!important}
      #random.rp107RandomRepair #randomInputAnchor.rp107RandomGrid{display:grid!important;grid-template-columns:minmax(320px,.72fr) minmax(690px,1.48fr) minmax(280px,.62fr)!important;gap:12px!important;align-items:start!important;margin-top:10px!important}
      #random.rp107RandomRepair #randomInputAnchor>.rp107Left{grid-column:1!important;grid-row:1!important;min-width:0!important;margin:0!important}
      #random.rp107RandomRepair #randomInputAnchor>.rp107Center{grid-column:2!important;grid-row:1!important;display:grid!important;gap:10px!important;min-width:0!important;margin:0!important}
      #random.rp107RandomRepair #randomInputAnchor>.rp107Right{grid-column:3!important;grid-row:1!important;display:grid!important;gap:10px!important;min-width:0!important;margin:0!important;align-content:start!important}
      #random.rp107RandomRepair .rp107Center>.panel,#random.rp107RandomRepair .rp107Right>.panel,#random.rp107RandomRepair #randomInputAnchor>.rp107Left{border:1px solid #294b67!important;border-radius:10px!important;background:linear-gradient(180deg,#0b1e31,#071522)!important;box-shadow:0 10px 25px rgba(0,0,0,.14)!important;box-sizing:border-box!important;min-width:0!important}
      #random.rp107RandomRepair #rpPickIntelV01589{display:block!important;margin:0!important;min-width:0!important;border:1px solid #294b67!important;border-radius:10px!important;background:linear-gradient(180deg,#0b1e31,#071522)!important;padding:11px!important;box-sizing:border-box!important}
      #random.rp107RandomRepair #poolInputs.poolGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}
      #random.rp107RandomRepair #comboResults{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:6px!important;min-width:0!important}
      #random.rp107RandomRepair #comboResults .combo{width:100%!important;max-width:100%!important;min-width:0!important;overflow:hidden!important}
      #random.rp107RandomRepair #comboResults .rp90ComboView{grid-template-columns:28px minmax(160px,1fr) 68px minmax(112px,.55fr) minmax(170px,1.1fr) 58px!important;gap:7px!important;min-width:0!important}
      #random.rp107RandomRepair #comboDetail{min-width:0!important;overflow-wrap:anywhere!important}
      #random.rp107RandomRepair #randomRecommendAnchor.rp107Relocated{display:none!important}
      #random.rp107RandomRepair .rp107ForeignDataPanel{display:none!important}
      #random.rp107RandomRepair #dataHubTopNavV015103,#random.rp107RandomRepair #dataCard,#random.rp107RandomRepair #dataPatchNotesV01599{display:none!important}
      @media(max-width:1450px){
        #random.rp107RandomRepair #randomInputAnchor.rp107RandomGrid{grid-template-columns:minmax(310px,.62fr) minmax(620px,1.38fr)!important}
        #random.rp107RandomRepair #randomInputAnchor>.rp107Left{grid-column:1!important;grid-row:1!important}
        #random.rp107RandomRepair #randomInputAnchor>.rp107Center{grid-column:2!important;grid-row:1!important}
        #random.rp107RandomRepair #randomInputAnchor>.rp107Right{grid-column:1/-1!important;grid-row:2!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}
      }
      @media(max-width:1060px){
        #random.rp107RandomRepair{width:calc(100vw - 22px)!important}
        #random.rp107RandomRepair #randomInputAnchor.rp107RandomGrid{grid-template-columns:minmax(0,1fr)!important}
        #random.rp107RandomRepair #randomInputAnchor>.rp107Left,#random.rp107RandomRepair #randomInputAnchor>.rp107Center,#random.rp107RandomRepair #randomInputAnchor>.rp107Right{grid-column:1!important;grid-row:auto!important}
        #random.rp107RandomRepair #randomInputAnchor>.rp107Right{grid-template-columns:minmax(0,1fr)!important}
        #random.rp107RandomRepair #comboResults .rp90ComboView{grid-template-columns:26px minmax(135px,1fr) 62px minmax(96px,.5fr) minmax(145px,1fr) 54px!important;gap:5px!important}
      }
      @media(max-width:720px){
        #random.rp107RandomRepair #poolInputs.poolGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        #random.rp107RandomRepair #comboResults .rp90ComboView{grid-template-columns:26px minmax(0,1fr) 58px!important}
        #random.rp107RandomRepair #comboResults .rp90Damage,#random.rp107RandomRepair #comboResults .rp90Desc,#random.rp107RandomRepair #comboResults .rp90Badges{display:none!important}
      }
    `;
    (document.head||document.documentElement)?.appendChild(st);
  }

  function directTitle(panel){
    return text(panel?.querySelector?.(':scope > .title'));
  }

  function nearestCommonInside(a,b,boundary){
    let p=a?.parentElement||null;
    while(p&&p!==boundary&&!p.contains(b))p=p.parentElement;
    if(p&&p.contains(b)&&boundary?.contains(p))return p;
    return boundary?.contains(a)&&boundary?.contains(b)?boundary:null;
  }

  function directChild(host,node){
    let x=node;
    while(x&&x.parentElement!==host)x=x.parentElement;
    return x||null;
  }

  function clearLegacyDataLayout(){
    const selector='.dataHubHostV015103,.dataHubTierPaneV015103,.dataHubDetailPaneV015103,.dataHubPatchV015103,.rp106PatchWide,.rp106TierPane,.rp106DetailPane,.rp107DataHost,.rp107DataTier,.rp107DataDetail';
    $$(selector).forEach(el=>{
      el.classList.remove('dataHubHostV015103','dataHubTierPaneV015103','dataHubDetailPaneV015103','dataHubPatchV015103','rp106PatchWide','rp106TierPane','rp106DetailPane','rp107DataHost','rp107DataTier','rp107DataDetail','rp107PatchMode');
    });
  }

  function patchActive(card){
    const original=$('#dataHubNavV01599',card);
    const originalPatch=$('[data-dh99-tab="patch"]',original);
    return !!(card?.classList.contains('dataHubPatchModeV01599')||originalPatch?.classList.contains('active'));
  }

  function ensureDataTopNav(host,card){
    let nav=$('#dataHubTopNavV015103');
    if(!nav){
      nav=document.createElement('nav');
      nav.id='dataHubTopNavV015103';
      nav.innerHTML='<button type="button" data-v103-tab="tier">챔피언 티어리스트</button><button type="button" data-v103-tab="patch">패치노트 <span class="badge">26.18</span></button>';
      nav.addEventListener('click',e=>{
        const b=e.target?.closest?.('[data-v103-tab]');if(!b)return;
        const original=$('#dataHubNavV01599',card);
        original?.querySelector?.(`[data-dh99-tab="${b.dataset.v103Tab}"]`)?.click?.();
        scheduleRepair(0);
      });
    }
    if(nav.parentElement!==host)host.insertBefore(nav,host.firstChild);
    return nav;
  }

  function repairData(){
    const card=$('#dataCard');if(!card)return;
    window.__aramDataHubMountV01599?.();
    const dataView=(document.getElementById('data')?.contains(card)?document.getElementById('data'):card.closest('.view'));
    if(!dataView)return;
    const panels=$$('.panel',dataView);
    const tierPanel=panels.find(p=>p!==card&&directTitle(p)==='역할별 티어 브라우저')||panels.find(p=>p!==card&&/역할별 티어 브라우저/.test(directTitle(p)));
    if(!tierPanel)return;
    const host=nearestCommonInside(tierPanel,card,dataView);if(!host)return;
    const tierPane=directChild(host,tierPanel),detailPane=directChild(host,card);if(!tierPane||!detailPane||tierPane===detailPane)return;

    clearLegacyDataLayout();
    host.classList.add('rp107DataHost');
    tierPane.classList.add('rp107DataTier');
    detailPane.classList.add('rp107DataDetail');
    const nav=ensureDataTopNav(host,card);
    const active=patchActive(card);
    host.classList.toggle('rp107PatchMode',active);
    $$('[data-v103-tab]',nav).forEach(b=>b.classList.toggle('active',b.dataset.v103Tab===(active?'patch':'tier')));
    dataView.setAttribute('data-aram-data-boundary',V);
    card.setAttribute('data-aram-data-card-owner',V);
  }

  function ensureWrapper(parent,cls,before=null){
    let el=$(`:scope > .${cls}`,parent);
    if(!el){el=document.createElement('div');el.className=cls;if(before&&before.parentElement===parent)parent.insertBefore(el,before);else parent.appendChild(el)}
    return el;
  }

  function quarantineForeignData(root){
    $$('#dataHubTopNavV015103,#dataCard,#dataPatchNotesV01599',root).forEach(el=>el.classList.add('rp107ForeignDataPanel'));
    $$('.panel',root).forEach(panel=>{
      if(directTitle(panel)==='역할별 티어 브라우저')panel.classList.add('rp107ForeignDataPanel');
    });
  }

  function repairRandom(){
    const root=$('#random'),input=$('#randomInputAnchor');if(!root||!input)return;
    const externalPanel=$('#externalInputs',root)?.closest?.('.panel');
    const poolPanel=$('#poolInputs',root)?.closest?.('.panel');
    const resultPanel=$('#comboResults',root)?.closest?.('.panel');
    const detailPanel=$('#comboDetail',root)?.closest?.('.panel');
    if(!externalPanel||!poolPanel||!resultPanel)return;

    root.classList.add('rp107RandomRepair');
    input.classList.add('rp107RandomGrid');
    quarantineForeignData(root);

    externalPanel.classList.add('rp107Left');
    if(externalPanel.parentElement!==input)input.insertBefore(externalPanel,input.firstChild);

    let center=$(':scope > .rp103Center',input)||$(':scope > .rp107Center',input);
    if(!center)center=ensureWrapper(input,'rp107Center');
    center.classList.add('rp107Center');
    if(poolPanel.parentElement!==center)center.appendChild(poolPanel);
    if(resultPanel.parentElement!==center)center.appendChild(resultPanel);

    const right=ensureWrapper(input,'rp107Right');
    let intel=$('#rpPickIntelV01589',root);
    if(!intel){
      intel=document.createElement('aside');
      intel.id='rpPickIntelV01589';
      intel.className='rpPickIntelV01589 randomPickOnly';
    }
    if(intel.parentElement!==right)right.appendChild(intel);
    if(detailPanel&&detailPanel!==resultPanel&&detailPanel.parentElement!==right)right.appendChild(detailPanel);

    const recommend=$('#randomRecommendAnchor',root);
    if(recommend)recommend.classList.toggle('rp107Relocated',!recommend.querySelector('#comboResults,#comboDetail'));
    root.setAttribute('data-aram-random-boundary',V);
  }

  function repair(){
    ensureStyle();
    try{repairData()}catch(e){console.warn?.('[ARAM v0.15.107] DATA boundary repair skipped',e)}
    try{repairRandom()}catch(e){console.warn?.('[ARAM v0.15.107] RANDOM repair skipped',e)}
    document.documentElement?.setAttribute('data-aram-ui-patch',V);
  }

  function scheduleRepair(delay=35){
    clearTimeout(repairTimer);
    repairTimer=setTimeout(()=>{
      requestAnimationFrame(()=>repair());
      setTimeout(repair,90);
    },Math.max(0,delay));
  }

  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#dataHubTopNavV015103,#dataHubNavV01599,#random,button'))scheduleRepair(15);
  },true);
  document.addEventListener('change',e=>{
    if(e.target?.closest?.('#random,#dataCard'))scheduleRepair(20);
  },true);
  document.addEventListener('input',e=>{
    if(e.target?.closest?.('#randomInputAnchor'))scheduleRepair(30);
  },true);

  window.aramViewBoundaryRepairV015107={version:V,repair,repairData,repairRandom,score_logic_changed:false};
  try{
    ensureStyle();repair();scheduleRepair(80);
    window.__ARAM_VIEW_BOUNDARY_REPAIR_V015107__=true;
  }catch(e){
    try{delete window.__ARAM_VIEW_BOUNDARY_REPAIR_V015107__}catch{}
    throw e;
  }
})();
