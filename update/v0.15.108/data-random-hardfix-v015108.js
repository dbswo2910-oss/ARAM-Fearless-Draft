'use strict';
(()=>{
  const V='0.15.108';
  if(window.__ARAM_DATA_RANDOM_HARDFIX_V015108__===true)return;
  window.__ARAM_DATA_RANDOM_HARDFIX_V015108__=true;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  let timer=0;

  function ensureStyle(){
    if($('#dataRandomHardfixStyleV015108'))return;
    const st=document.createElement('style');
    st.id='dataRandomHardfixStyleV015108';
    st.textContent=`
      /* v0.15.108: deterministic DATA patch-mode ownership. Descendant selectors
         intentionally avoid the direct-child assumption that failed in v0.15.107. */
      .rp108DataHost.rp108PatchMode{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important;width:100%!important;max-width:none!important;min-width:0!important;align-items:start!important}
      .rp108DataHost.rp108PatchMode .rp108TierBranch,.rp108DataHost.rp108PatchMode .rp108TierPanel{display:none!important}
      .rp108DataHost.rp108PatchMode .rp108DetailBranch{display:block!important;grid-column:1/-1!important;width:100%!important;max-width:none!important;min-width:0!important}
      .rp108DataHost.rp108PatchMode #dataHubTopNavV015103{grid-column:1/-1!important;width:100%!important;max-width:none!important}
      .rp108DataHost.rp108PatchMode #dataCard{display:block!important;grid-column:1/-1!important;width:100%!important;max-width:none!important;min-width:0!important;margin:0!important}
      .rp108DataHost.rp108PatchMode #dataPatchNotesV01599{display:block!important;width:100%!important;max-width:none!important;margin:0!important}
      .rp108DataHost.rp108PatchMode #dataPatchNotesV01599 .dh99Layout{grid-template-columns:minmax(0,1fr) 300px!important;gap:16px!important;width:100%!important}
      .rp108DataHost.rp108PatchMode #dataPatchNotesV01599 .dh99Main{min-width:0!important;width:100%!important}
      .rp108DataHost.rp108PatchMode #dataPatchNotesV01599 .dh99Side{width:300px!important;min-width:300px!important}
      @media(max-width:1180px){.rp108DataHost.rp108PatchMode #dataPatchNotesV01599 .dh99Layout{grid-template-columns:1fr!important}.rp108DataHost.rp108PatchMode #dataPatchNotesV01599 .dh99Side{width:auto!important;min-width:0!important}}

      /* If DATA-owned nodes somehow exist under RANDOM, remove both the node and
         its empty layout branch so it cannot reserve a champion-list column. */
      #random .rp108ForeignData,#random .rp108ForeignDataBranch{display:none!important}
    `;
    (document.head||document.documentElement)?.appendChild(st);
  }

  function directChild(host,node){
    let x=node;
    while(x&&x.parentElement&&x.parentElement!==host)x=x.parentElement;
    return x?.parentElement===host?x:null;
  }
  function nearestCommon(a,b,boundary){
    let p=a?.parentElement||null;
    while(p&&p!==boundary&&!p.contains(b))p=p.parentElement;
    if(p&&p.contains(b)&&(!boundary||boundary.contains(p)))return p;
    return boundary&&boundary.contains(a)&&boundary.contains(b)?boundary:null;
  }
  function panelTitle(panel){
    return txt(panel?.querySelector?.(':scope > .title')||panel?.querySelector?.('.title'));
  }
  function dataViewFor(card){
    const exact=document.getElementById('data');
    if(exact?.contains(card))return exact;
    return card?.closest?.('.view')||card?.parentElement||null;
  }
  function readRequestedMode(view,card){
    const requested=String(view?.dataset?.rp108RequestedMode||'');
    if(requested==='patch'||requested==='tier')return requested;
    const top=$('#dataHubTopNavV015103',view);
    const topPatch=$('[data-v103-tab="patch"]',top);
    const topTier=$('[data-v103-tab="tier"]',top);
    if(topPatch?.classList.contains('active'))return 'patch';
    if(topTier?.classList.contains('active'))return 'tier';
    const original=$('#dataHubNavV01599',card);
    const op=$('[data-dh99-tab="patch"]',original),ot=$('[data-dh99-tab="tier"]',original);
    if(op?.classList.contains('active'))return 'patch';
    if(ot?.classList.contains('active'))return 'tier';
    if(card?.classList.contains('dataHubPatchModeV01599'))return 'patch';
    const notes=$('#dataPatchNotesV01599',card);
    if(notes){try{if(getComputedStyle(notes).display!=='none')return 'patch'}catch{}}
    return 'tier';
  }
  function syncNav(view,card,mode){
    const top=$('#dataHubTopNavV015103',view);
    $$('[data-v103-tab]',top).forEach(b=>b.classList.toggle('active',b.dataset.v103Tab===mode));
    const original=$('#dataHubNavV01599',card);
    $$('[data-dh99-tab]',original).forEach(b=>b.classList.toggle('active',b.dataset.dh99Tab===mode));
    card?.classList.toggle('dataHubPatchModeV01599',mode==='patch');
  }
  function clearDataMarkers(view){
    $$('.rp108DataHost,.rp108TierBranch,.rp108DetailBranch,.rp108TierPanel',view).forEach(el=>el.classList.remove('rp108DataHost','rp108TierBranch','rp108DetailBranch','rp108TierPanel'));
  }
  function repairData(){
    const card=$('#dataCard');if(!card)return;
    window.__aramDataHubMountV01599?.();
    const view=dataViewFor(card);if(!view)return;
    const panels=$$('.panel',view);
    const tierPanel=panels.find(p=>p!==card&&panelTitle(p)==='역할별 티어 브라우저')||panels.find(p=>p!==card&&txt(p).includes('역할별 티어 브라우저'));
    if(!tierPanel)return;
    const host=nearestCommon(tierPanel,card,view);if(!host)return;
    const tierBranch=directChild(host,tierPanel);
    const detailBranch=directChild(host,card);
    clearDataMarkers(view);
    host.classList.add('rp108DataHost');
    tierPanel.classList.add('rp108TierPanel');
    if(tierBranch&&tierBranch!==detailBranch)tierBranch.classList.add('rp108TierBranch');
    if(detailBranch)detailBranch.classList.add('rp108DetailBranch');
    const mode=readRequestedMode(view,card);
    host.classList.toggle('rp108PatchMode',mode==='patch');
    view.classList.toggle('rp108PatchMode',mode==='patch');
    syncNav(view,card,mode);
    view.setAttribute('data-aram-data-hardfix',V);
  }

  const legitRandomIds=['externalInputs','poolInputs','comboResults','comboDetail','rpPickIntelV01589'];
  function hasLegitRandom(branch){return legitRandomIds.some(id=>branch?.querySelector?.('#'+id)||branch?.id===id)}
  function markForeign(root,node){
    if(!node||!root?.contains(node))return;
    node.classList.add('rp108ForeignData');
    const anchor=$('#randomInputAnchor',root)||root;
    const branch=directChild(anchor,node);
    if(branch&&branch!==node&&!hasLegitRandom(branch))branch.classList.add('rp108ForeignDataBranch');
  }
  function repairRandom(){
    const root=$('#random');if(!root)return;
    $$('[id="dataCard"],[id="dataPatchNotesV01599"],[id="dataHubTopNavV015103"],[id="dataHubNavV01599"]',root).forEach(n=>markForeign(root,n));
    $$('.panel',root).forEach(p=>{
      const t=panelTitle(p),all=txt(p);
      if(t==='역할별 티어 브라우저'||all.includes('역할별 티어 브라우저'))markForeign(root,p);
    });
    root.setAttribute('data-aram-random-hardfix',V);
  }
  function repair(){
    ensureStyle();
    try{repairData()}catch(e){console.warn?.('[ARAM v0.15.108] DATA hardfix skipped',e)}
    try{repairRandom()}catch(e){console.warn?.('[ARAM v0.15.108] RANDOM quarantine skipped',e)}
    document.documentElement?.setAttribute('data-aram-ui-patch',V);
  }
  function schedule(delay=20){clearTimeout(timer);timer=setTimeout(()=>{requestAnimationFrame(repair);setTimeout(repair,80)},Math.max(0,delay))}

  document.addEventListener('click',e=>{
    const tab=e.target?.closest?.('[data-v103-tab],[data-dh99-tab]');
    if(tab){
      const card=$('#dataCard'),view=dataViewFor(card);
      const mode=tab.dataset.v103Tab||tab.dataset.dh99Tab;
      if(view&&(mode==='patch'||mode==='tier'))view.dataset.rp108RequestedMode=mode;
      schedule(0);return;
    }
    if(e.target?.closest?.('#random,#dataCard,button'))schedule(20);
  },true);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#random,#dataCard'))schedule(20)},true);
  document.addEventListener('input',e=>{if(e.target?.closest?.('#random'))schedule(30)},true);

  window.aramDataRandomHardfixV015108={version:V,repair,repairData,repairRandom,score_logic_changed:false};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(0),{once:true});else schedule(0);
})();
