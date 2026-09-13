'use strict';
(()=>{
  const V='0.15.115';
  if(window.__ARAM_UI_STABILITY_BASELINE_V015115__===true)return;
  window.__ARAM_UI_STABILITY_BASELINE_V015115__=true;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const text=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();

  /*
   * v0.15.115 is intentionally a baseline, not another repair loop.
   * RANDOM layout/selection belongs to the v0.15.90/v0.15.100 transformed
   * random-practice-focus runtime. This module never reparents RANDOM nodes.
   * DATA boundary/presentation belongs here and is updated only on its own tabs.
   */
  const OWNERS=Object.freeze({
    random:'random-focus-v015100',
    data:'ui-stability-v015115',
    ingame:'random-ingame-runtime'
  });

  function ensureStyle(){
    if($('#aramUiStabilityBaselineStyleV015115'))return;
    const st=document.createElement('style');
    st.id='aramUiStabilityBaselineStyleV015115';
    st.textContent=`
      /* Hard mode boundary. No layout ownership here. */
      #random[data-random-mode="ingame"] .randomPickOnly{display:none!important}
      #random[data-random-mode="pick"] .randomInGameOnly{display:none!important}
      #random[data-random-mode="ingame"] #randomIngameShell.randomInGameOnly{display:block!important}

      /* DATA is never allowed to participate in RANDOM layout. */
      #random #dataCard,#random #dataPatchNotesV01599,#random #dataHubNavV01599,
      #random #dataHubTopNavV015103,#random #dataHubTopNavV015115{display:none!important}

      /* Stable DATA host. Exact #data / #dataCard structural scope only. */
      #data.data115View #dataHubTopNavV015115{display:flex;align-items:center;gap:7px;width:100%;box-sizing:border-box;margin:0 0 10px;padding:7px;border:1px solid #244e6b;border-radius:10px;background:linear-gradient(180deg,#0b2236,#081a2a);box-shadow:0 8px 24px rgba(0,0,0,.13)}
      #data.data115View #dataHubTopNavV015115 button{appearance:none;border:1px solid #2c5b7d;background:#081a2a;color:#9ebbd0;border-radius:8px;padding:8px 14px;font-size:11px;font-weight:900;cursor:pointer}
      #data.data115View #dataHubTopNavV015115 button.active{border-color:#54bcff;background:linear-gradient(180deg,#143d5f,#0d2d49);color:#fff;box-shadow:inset 0 -2px 0 #55d8ff}
      #data.data115View #dataHubTopNavV015115 .badge{margin-left:4px;padding:2px 5px;border-radius:5px;background:#8b6516;color:#ffe79a;font-size:7px}
      #data.data115View #dataHubNavV01599{display:none!important}
      #data.data115View.data115PatchMode .data115TierBranch{display:none!important}
      #data.data115View.data115PatchMode .data115DetailBranch{grid-column:1/-1!important;width:100%!important;max-width:none!important;min-width:0!important}
      #data.data115View.data115PatchMode #dataCard{display:block!important;width:100%!important;max-width:none!important;min-width:0!important;margin:0!important}
      #data.data115View.data115PatchMode #dataPatchNotesV01599{display:block!important;width:100%!important;max-width:none!important;margin:0!important}
      #data.data115View.data115PatchMode #dataPatchNotesV01599 .dh99Layout{grid-template-columns:minmax(0,1fr) 300px!important;gap:16px!important;width:100%!important}
      #data.data115View.data115PatchMode #dataPatchNotesV01599 .dh99Main{min-width:0!important;width:100%!important}
      #data.data115View.data115PatchMode #dataPatchNotesV01599 .dh99Side{width:300px!important;min-width:300px!important}

      /* Patch-note champion cards only. Never matches normal DATA tier cards. */
      #data.data115View #dataPatchNotesV01599 #dh99ChampionGrid.dh99ChampionGrid{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:7px!important;padding:10px 12px 13px!important;align-items:stretch!important}
      #data.data115View #dataPatchNotesV01599 #dh99ChampionGrid .dh99Champ{min-width:0!important;min-height:88px!important;height:auto!important;padding:7px 5px!important;border-radius:9px!important;overflow:hidden!important}
      #data.data115View #dataPatchNotesV01599 #dh99ChampionGrid .dh99Portrait,
      #data.data115View #dataPatchNotesV01599 #dh99ChampionGrid .dh99Portrait img{display:block!important;width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;max-width:46px!important;max-height:46px!important;object-fit:cover!important;object-position:center!important;transform:none!important}
      #data.data115View #dataPatchNotesV01599 #dh99ChampionGrid .dh99Portrait{position:relative!important;aspect-ratio:1/1!important;margin:0 auto 6px!important;border-radius:8px!important;overflow:hidden!important;box-sizing:border-box!important}
      #data.data115View #dataPatchNotesV01599 #dh99ChampionGrid .dh99ChampName{display:block!important;font-size:10px!important;line-height:1.2!important;margin:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}

      @media(max-width:1180px){
        #data.data115View.data115PatchMode #dataPatchNotesV01599 .dh99Layout{grid-template-columns:1fr!important}
        #data.data115View.data115PatchMode #dataPatchNotesV01599 .dh99Side{width:auto!important;min-width:0!important}
        #data.data115View #dataPatchNotesV01599 #dh99ChampionGrid.dh99ChampionGrid{grid-template-columns:repeat(5,minmax(0,1fr))!important}
      }
      @media(max-width:900px){#data.data115View #dataPatchNotesV01599 #dh99ChampionGrid.dh99ChampionGrid{grid-template-columns:repeat(4,minmax(0,1fr))!important}}
      @media(max-width:650px){#data.data115View #dataPatchNotesV01599 #dh99ChampionGrid.dh99ChampionGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
    `;
    (document.head||document.documentElement)?.appendChild(st);
  }

  function directBranch(host,node){
    if(!host||!node||!host.contains(node))return null;
    let x=node;
    while(x?.parentElement&&x.parentElement!==host)x=x.parentElement;
    return x?.parentElement===host?x:null;
  }

  function claim(el,owner,slot){
    if(!el)return;
    el.dataset.uiOwner=owner;
    if(slot)el.dataset.uiSlot=slot;
  }

  function claimRandom(){
    const root=$('#random');if(!root)return false;
    const map=[
      ['#randomInputAnchor','workspace'],['#externalInputs','external-inputs'],['#poolInputs','candidate-pool'],
      ['#comboResults','top5'],['#comboDetail','selection-detail'],['#rpPickIntelV01589','dna'],
      ['#randomIngameShell','ingame-shell']
    ];
    claim(root,OWNERS.random,'random-root');
    for(const [sel,slot] of map){const el=$(sel,root);if(el)claim(el,slot==='ingame-shell'?OWNERS.ingame:OWNERS.random,slot)}
    root.dataset.aramSingleOwnerBaseline=V;
    return true;
  }

  function dataParts(){
    const view=$('#data'),card=$('#dataCard');
    if(!view||!card||!view.contains(card))return null;
    const host=card.closest('.grid2')||card.parentElement;
    if(!host||!view.contains(host))return null;
    const detailBranch=directBranch(host,card)||card;
    const tierBranch=[...host.children].find(x=>x!==detailBranch&&x.id!=='dataHubTopNavV015115')||null;
    return{view,card,host,detailBranch,tierBranch};
  }

  function currentDataMode(card){
    if(card?.classList.contains('dataHubPatchModeV01599'))return 'patch';
    const original=$('#dataHubNavV01599',card);
    if(original?.querySelector('[data-dh99-tab="patch"].active'))return 'patch';
    return 'tier';
  }

  function ensureDataNav(p){
    let nav=$('#dataHubTopNavV015115',p.view);
    if(!nav){
      nav=document.createElement('nav');nav.id='dataHubTopNavV015115';nav.setAttribute('aria-label','데이터 보기');
      nav.innerHTML='<button type="button" data-v115-tab="tier">챔피언 티어리스트</button><button type="button" data-v115-tab="patch">패치노트 <span class="badge">26.18</span></button>';
      p.host.parentElement?.insertBefore(nav,p.host);
      nav.addEventListener('click',e=>{
        const b=e.target?.closest?.('[data-v115-tab]');if(!b)return;
        const mode=b.dataset.v115Tab;
        const original=$('#dataHubNavV01599',p.card)?.querySelector?.(`[data-dh99-tab="${mode}"]`);
        original?.click?.();
        syncData(mode);
        queueMicrotask(()=>syncData(mode));
      });
    }
    claim(nav,OWNERS.data,'data-nav');
    return nav;
  }

  function syncData(requested){
    const p=dataParts();if(!p)return false;
    p.view.classList.add('data115View');
    p.detailBranch.classList.add('data115DetailBranch');
    p.tierBranch?.classList.add('data115TierBranch');
    claim(p.view,OWNERS.data,'data-root');claim(p.card,OWNERS.data,'data-card');
    claim(p.detailBranch,OWNERS.data,'data-detail-branch');claim(p.tierBranch,OWNERS.data,'data-tier-branch');
    const nav=ensureDataNav(p);
    const mode=requested==='patch'||requested==='tier'?requested:currentDataMode(p.card);
    p.view.classList.toggle('data115PatchMode',mode==='patch');
    p.view.dataset.data115Mode=mode;
    $$('[data-v115-tab]',nav).forEach(b=>b.classList.toggle('active',b.dataset.v115Tab===mode));
    const title=p.detailBranch.querySelector(':scope > .panel > .title')||p.detailBranch.querySelector(':scope > .title')||p.card.closest('.panel')?.querySelector(':scope > .title');
    if(title){
      if(!title.dataset.data115Original)title.dataset.data115Original=text(title)||'챔피언 상세';
      title.textContent=mode==='patch'?'패치노트':title.dataset.data115Original;
    }
    const eyebrow=$('#dataPatchNotesV01599 .dh99Eyebrow',p.card);
    if(eyebrow&&/ARAM PATCH COMPANION/i.test(text(eyebrow)))eyebrow.textContent='❄ ARAM PATCH COMPANION · 26.18';
    p.view.dataset.aramSingleOwnerBaseline=V;
    return true;
  }

  function duplicateIds(){
    const critical=['random','randomInputAnchor','externalInputs','poolInputs','comboResults','comboDetail','rpPickIntelV01589','randomIngameShell','data','dataCard','dataPatchNotesV01599'];
    return critical.map(id=>({id,count:document.querySelectorAll(`[id="${id}"]`).length})).filter(x=>x.count!==1&&!(x.count===0&&['rpPickIntelV01589','dataPatchNotesV01599'].includes(x.id)));
  }

  function audit(){
    const root=$('#random'),data=$('#data');
    const requiredParents={
      externalInputs:$('#externalInputs')?.closest('#random')?.id||null,
      poolInputs:$('#poolInputs')?.closest('#random')?.id||null,
      comboResults:$('#comboResults')?.closest('#random')?.id||null,
      comboDetail:$('#comboDetail')?.closest('#random')?.id||null,
      dna:$('#rpPickIntelV01589')?.closest('#random')?.id||null,
      dataCard:$('#dataCard')?.closest('#data')?.id||null
    };
    const crossView={
      dataInsideRandom:!!root?.querySelector('#dataCard,#dataPatchNotesV01599,#dataHubNavV01599,#dataHubTopNavV015115'),
      randomInsideData:!!data?.querySelector('#randomInputAnchor,#comboResults,#comboDetail,#rpPickIntelV01589')
    };
    return{version:V,owners:OWNERS,duplicateIds:duplicateIds(),requiredParents,crossView,randomMode:root?.dataset?.randomMode||null,ok:duplicateIds().length===0&&!crossView.dataInsideRandom&&!crossView.randomInsideData};
  }

  function boot(){
    ensureStyle();
    claimRandom();
    try{window.__aramDataHubMountV01599?.()}catch{}
    syncData();
    document.documentElement?.setAttribute('data-aram-ui-stability-baseline',V);
  }

  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#randomPickModeBtn,#randomIngameModeBtn'))queueMicrotask(claimRandom);
  },false);

  window.aramUiStabilityV015115={version:V,owners:OWNERS,claimRandom,syncData,audit,score_logic_changed:false,random_scoring_changed:false,dom_reparent_on_interaction:false};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
