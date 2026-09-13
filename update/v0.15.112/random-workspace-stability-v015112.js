'use strict';
(()=>{
  const V='0.15.112';
  if(window.__ARAM_RANDOM_WORKSPACE_STABILITY_V015112__===true)return;
  window.__ARAM_RANDOM_WORKSPACE_STABILITY_V015112__=true;

  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  let modeObserver=null;
  let originalSetRandomViewMode=null;

  function ensureStyle(){
    if($('#randomWorkspaceStyleV015112'))return;
    const st=document.createElement('style');
    st.id='randomWorkspaceStyleV015112';
    st.textContent=`
      /* v0.15.112 — exact-ID RANDOM workspace stabilization.
         1) Pick-only UI can never win against IN GAME mode.
         2) Pick workspace is assembled once into left / center / insight rail.
         3) The insight rail is always one readable column; no post-paint 2-column snap. */
      #random[data-random-mode="ingame"] .randomPickOnly,
      #random[data-random-mode="ingame"] #rpInputHeadV01549,
      #random[data-random-mode="ingame"] #rpFocusCardV01549,
      #random[data-random-mode="ingame"] #rpInfoShellV01549,
      #random[data-random-mode="ingame"].rp107RandomRepair #randomInputAnchor.rp107RandomGrid,
      #random[data-random-mode="ingame"].rp112RandomWorkspace #randomInputAnchor.rp112WorkspaceGrid{
        display:none!important;
      }
      #random[data-random-mode="pick"] #randomIngameShell.randomInGameOnly{
        display:none!important;
      }
      #random[data-random-mode="ingame"] #randomIngameShell.randomInGameOnly{
        display:block!important;
      }

      #random.rp112RandomWorkspace{
        position:relative!important;
        left:50%!important;
        transform:translateX(-50%)!important;
        width:min(1720px,calc(100vw - 28px))!important;
        max-width:none!important;
        margin-left:0!important;
        margin-right:0!important;
        padding-bottom:22px!important;
      }
      #random.rp112RandomWorkspace #randomInputAnchor.rp112WorkspaceGrid{
        display:grid!important;
        grid-template-columns:minmax(300px,.72fr) minmax(680px,1.55fr) minmax(330px,.72fr)!important;
        gap:12px!important;
        align-items:start!important;
        margin-top:10px!important;
        min-width:0!important;
      }
      #random.rp112RandomWorkspace #randomInputAnchor>.rp112Left{
        grid-column:1!important;
        grid-row:1!important;
        min-width:0!important;
        margin:0!important;
      }
      #random.rp112RandomWorkspace #randomInputAnchor>.rp112Center{
        grid-column:2!important;
        grid-row:1!important;
        display:grid!important;
        grid-template-columns:minmax(0,1fr)!important;
        gap:10px!important;
        min-width:0!important;
        margin:0!important;
      }
      #random.rp112RandomWorkspace #randomInputAnchor>.rp112Right{
        grid-column:3!important;
        grid-row:1!important;
        display:grid!important;
        grid-template-columns:minmax(0,1fr)!important;
        gap:10px!important;
        align-content:start!important;
        align-items:start!important;
        min-width:0!important;
        width:100%!important;
        margin:0!important;
      }
      #random.rp112RandomWorkspace #randomInputAnchor>.rp112Right::before{
        content:'04 · 조합 판단';
        display:block!important;
        font-size:9px!important;
        line-height:1!important;
        letter-spacing:.08em!important;
        font-weight:950!important;
        color:#62d7ef!important;
        padding:2px 2px 0!important;
      }
      #random.rp112RandomWorkspace #randomInputAnchor>.rp112Right>*{
        min-width:0!important;
        width:100%!important;
        max-width:100%!important;
        box-sizing:border-box!important;
      }
      #random.rp112RandomWorkspace #randomInputAnchor>.rp112Right>#rpPickIntelV01589{
        order:1!important;
        display:block!important;
      }
      #random.rp112RandomWorkspace #randomInputAnchor>.rp112Right>.rp112DetailPanel{
        order:2!important;
      }

      #random.rp112RandomWorkspace .rp112Panel{
        position:relative!important;
        border:1px solid #294b67!important;
        border-radius:11px!important;
        background:linear-gradient(180deg,#0b1e31,#071522)!important;
        box-shadow:0 10px 25px rgba(0,0,0,.14)!important;
        box-sizing:border-box!important;
        min-width:0!important;
      }
      #random.rp112RandomWorkspace .rp112Panel[data-rp112-step]::before{
        content:attr(data-rp112-step);
        display:block!important;
        margin:0 0 7px!important;
        font-size:8px!important;
        line-height:1.1!important;
        letter-spacing:.08em!important;
        font-weight:950!important;
        color:#5ccff4!important;
      }
      #random.rp112RandomWorkspace .rp112Panel>.title,
      #random.rp112RandomWorkspace .rp112Panel .rpPanelHeadV01549>.title{
        font-size:14px!important;
        line-height:1.25!important;
        color:#f1f8ff!important;
        font-weight:950!important;
        word-break:keep-all!important;
      }

      #random.rp112RandomWorkspace #poolInputs.poolGrid{
        grid-template-columns:repeat(3,minmax(0,1fr))!important;
        gap:6px!important;
      }
      #random.rp112RandomWorkspace #poolInputs .randomPoolItem{
        min-height:38px!important;
        border-radius:8px!important;
      }
      #random.rp112RandomWorkspace #comboResults{
        display:grid!important;
        grid-template-columns:minmax(0,1fr)!important;
        gap:6px!important;
        min-width:0!important;
      }
      #random.rp112RandomWorkspace #comboResults .combo{
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        margin:0!important;
        overflow:hidden!important;
      }
      #random.rp112RandomWorkspace #comboResults .rp90ComboView{
        grid-template-columns:28px minmax(150px,1fr) 64px minmax(105px,.5fr) minmax(155px,1fr) 54px!important;
        gap:6px!important;
        min-width:0!important;
      }

      #random.rp112RandomWorkspace #rpPickIntelV01589{
        min-width:0!important;
        width:100%!important;
        max-width:100%!important;
        overflow:hidden!important;
        box-sizing:border-box!important;
        padding:11px!important;
        border:1px solid #2b5872!important;
        border-top:2px solid #36d6b4!important;
        border-radius:11px!important;
        background:linear-gradient(180deg,#0b2030,#081623)!important;
      }
      #random.rp112RandomWorkspace #rpPickIntelV01589 .rp89IntelHead b{font-size:13px!important;line-height:1.25!important}
      #random.rp112RandomWorkspace #rpPickIntelV01589 .rp89IntelHead span{font-size:8px!important;line-height:1.2!important;white-space:nowrap!important}
      #random.rp112RandomWorkspace #rpPickIntelV01589 .rp90DnaTop,
      #random.rp112RandomWorkspace #rpPickIntelV01589 .rp103DnaTop{font-size:9px!important;line-height:1.3!important;gap:8px!important}
      #random.rp112RandomWorkspace #rpPickIntelV01589 .rp90DnaTop b,
      #random.rp112RandomWorkspace #rpPickIntelV01589 .rp103DnaTop b{font-size:9.5px!important;white-space:nowrap!important}
      #random.rp112RandomWorkspace #rpPickIntelV01589 .rp89Top1 b,
      #random.rp112RandomWorkspace #rpPickIntelV01589 .rp103Top1 b{
        white-space:normal!important;
        word-break:keep-all!important;
        overflow-wrap:break-word!important;
        text-overflow:clip!important;
      }

      #random.rp112RandomWorkspace .rp112DetailPanel{
        overflow:hidden!important;
        padding:11px!important;
      }
      #random.rp112RandomWorkspace .rp112DetailPanel #comboDetail,
      #random.rp112RandomWorkspace .rp112DetailPanel #comboDetail *{
        min-width:0!important;
        word-break:keep-all!important;
        overflow-wrap:break-word!important;
        line-height:1.45!important;
      }
      #random.rp112RandomWorkspace .rp112DetailPanel #comboDetail{font-size:10px!important;color:#cfe3f2!important}

      #random.rp112RandomWorkspace #randomRecommendAnchor.rp112EmptyLegacy{
        display:none!important;
      }
      #random.rp112PickStaging[data-random-mode="pick"] #randomInputAnchor,
      #random.rp112PickStaging[data-random-mode="pick"] #randomRecommendAnchor{
        visibility:hidden!important;
      }

      @media(max-width:1500px){
        #random.rp112RandomWorkspace #randomInputAnchor.rp112WorkspaceGrid{
          grid-template-columns:minmax(300px,.62fr) minmax(620px,1.38fr)!important;
        }
        #random.rp112RandomWorkspace #randomInputAnchor>.rp112Left{grid-column:1!important;grid-row:1 / span 2!important}
        #random.rp112RandomWorkspace #randomInputAnchor>.rp112Center{grid-column:2!important;grid-row:1!important}
        #random.rp112RandomWorkspace #randomInputAnchor>.rp112Right{grid-column:2!important;grid-row:2!important;grid-template-columns:minmax(0,1fr)!important}
      }
      @media(max-width:1080px){
        #random.rp112RandomWorkspace{width:calc(100vw - 22px)!important}
        #random.rp112RandomWorkspace #randomInputAnchor.rp112WorkspaceGrid{grid-template-columns:minmax(0,1fr)!important}
        #random.rp112RandomWorkspace #randomInputAnchor>.rp112Left,
        #random.rp112RandomWorkspace #randomInputAnchor>.rp112Center,
        #random.rp112RandomWorkspace #randomInputAnchor>.rp112Right{grid-column:1!important;grid-row:auto!important}
        #random.rp112RandomWorkspace #comboResults .rp90ComboView{grid-template-columns:26px minmax(135px,1fr) 58px!important;gap:5px!important}
        #random.rp112RandomWorkspace #comboResults .rp90Damage,
        #random.rp112RandomWorkspace #comboResults .rp90Desc,
        #random.rp112RandomWorkspace #comboResults .rp90Badges{display:none!important}
      }
      @media(max-width:720px){
        #random.rp112RandomWorkspace #poolInputs.poolGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      }
    `;
    (document.head||document.documentElement)?.appendChild(st);
  }

  function directPanel(root,id){
    const node=$('#'+id,root);
    return node?.closest?.('.panel')||null;
  }

  function ensureWrapper(input,primary,legacy){
    let el=$(':scope > .'+primary,input)||$(':scope > .'+legacy,input);
    if(!el){el=document.createElement('div');input.appendChild(el)}
    el.classList.add(primary,legacy);
    return el;
  }

  function currentMode(root){
    const m=String(root?.dataset?.randomMode||'');
    if(m==='pick'||m==='ingame')return m;
    const ingame=$('#randomIngameModeBtn',root),pick=$('#randomPickModeBtn',root);
    if(ingame?.classList.contains('active')&&!pick?.classList.contains('active'))return 'ingame';
    return 'pick';
  }

  function markPickArtifacts(root){
    $('#rpInputHeadV01549',root)?.classList.add('randomPickOnly','rp112PickArtifact');
    $('#rpFocusCardV01549',root)?.classList.add('randomPickOnly','rp112PickArtifact');
    $('#rpInfoShellV01549',root)?.classList.add('randomPickOnly','rp112PickArtifact');
  }

  function stabilizePick(root){
    if(!root||currentMode(root)==='ingame')return false;
    ensureStyle();
    root.classList.add('rp112PickStaging');
    const input=$('#randomInputAnchor',root);
    if(!input){root.classList.remove('rp112PickStaging');return false}

    const externalPanel=directPanel(root,'externalInputs');
    const poolPanel=directPanel(root,'poolInputs');
    const resultPanel=directPanel(root,'comboResults');
    const detailPanel=directPanel(root,'comboDetail');
    if(!externalPanel||!poolPanel||!resultPanel){root.classList.remove('rp112PickStaging');return false}

    root.classList.add('rp112RandomWorkspace','rp107RandomRepair');
    input.classList.add('rp112WorkspaceGrid','rp107RandomGrid');
    markPickArtifacts(root);

    externalPanel.classList.add('rp112Left','rp107Left','rp112Panel');
    externalPanel.dataset.rp112Step='01 · 팀 입력';
    if(externalPanel.parentElement!==input)input.insertBefore(externalPanel,input.firstChild);

    const center=ensureWrapper(input,'rp112Center','rp107Center');
    poolPanel.classList.add('rp112Panel','rp112PoolPanel');
    poolPanel.dataset.rp112Step='02 · 후보 풀';
    resultPanel.classList.add('rp112Panel','rp112ResultPanel');
    resultPanel.dataset.rp112Step='03 · 추천 TOP5';
    if(poolPanel.parentElement!==center)center.appendChild(poolPanel);
    if(resultPanel.parentElement!==center)center.appendChild(resultPanel);

    const right=ensureWrapper(input,'rp112Right','rp107Right');
    let intel=$('#rpPickIntelV01589',root);
    if(!intel){
      intel=document.createElement('aside');
      intel.id='rpPickIntelV01589';
      intel.className='panel rpPickIntelV01589 randomPickOnly';
    }
    intel.classList.add('rp112DnaPanel');
    if(intel.parentElement!==right)right.appendChild(intel);

    if(detailPanel&&detailPanel!==resultPanel){
      detailPanel.classList.add('rp112Panel','rp112DetailPanel');
      if(detailPanel.parentElement!==right)right.appendChild(detailPanel);
    }

    const recommend=$('#randomRecommendAnchor',root);
    if(recommend&&!recommend.querySelector('#comboResults,#comboDetail'))recommend.classList.add('rp112EmptyLegacy');
    else recommend?.classList.remove('rp112EmptyLegacy');

    root.classList.remove('rp112PickStaging');
    root.classList.add('rp112Ready');
    root.setAttribute('data-aram-random-workspace',V);
    return true;
  }

  function syncMode(requested){
    ensureStyle();
    const root=$('#random');if(!root)return;
    let mode=requested==='pick'||requested==='ingame'?requested:currentMode(root);
    if(mode!=='pick'&&mode!=='ingame')mode='pick';
    if(root.dataset.randomMode!==mode)root.dataset.randomMode=mode;
    root.classList.toggle('rp112ModePick',mode==='pick');
    root.classList.toggle('rp112ModeIngame',mode==='ingame');
    markPickArtifacts(root);
    if(mode==='pick')stabilizePick(root);
    else root.classList.remove('rp112PickStaging');
    root.setAttribute('data-aram-random-mode-isolation',V);
  }

  function wrapModeSetter(){
    const fn=window.setRandomViewMode;
    if(typeof fn!=='function'||fn.__aramV015112Wrapped)return;
    originalSetRandomViewMode=fn;
    const wrapped=function(mode,...args){
      const root=$('#random');
      if(root&&mode==='pick')root.classList.add('rp112PickStaging');
      const out=fn.apply(this,[mode,...args]);
      queueMicrotask(()=>syncMode(mode));
      return out;
    };
    wrapped.__aramV015112Wrapped=true;
    wrapped.__aramOriginal=fn;
    window.setRandomViewMode=wrapped;
    try{setRandomViewMode=wrapped}catch{}
  }

  function installModeObserver(){
    const root=$('#random');
    if(!root||modeObserver||typeof MutationObserver!=='function')return;
    modeObserver=new MutationObserver(()=>syncMode());
    modeObserver.observe(root,{attributes:true,attributeFilter:['data-random-mode']});
  }

  function boot(){
    ensureStyle();
    wrapModeSetter();
    installModeObserver();
    syncMode();
  }

  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('#randomPickModeBtn,#randomIngameModeBtn');
    if(b){
      const next=b.id==='randomIngameModeBtn'?'ingame':'pick';
      const root=$('#random');if(root&&next==='pick')root.classList.add('rp112PickStaging');
      queueMicrotask(()=>syncMode(next));
      return;
    }
    if(e.target?.closest?.('#random')&&currentMode($('#random'))==='pick')queueMicrotask(()=>stabilizePick($('#random')));
  },true);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#random')&&currentMode($('#random'))==='pick')queueMicrotask(()=>stabilizePick($('#random')))},true);
  document.addEventListener('input',e=>{if(e.target?.closest?.('#randomInputAnchor')&&currentMode($('#random'))==='pick')queueMicrotask(()=>stabilizePick($('#random')))},true);
  window.addEventListener('aram:random-dna-rail-repaired',()=>{if(currentMode($('#random'))==='pick')stabilizePick($('#random'))});

  window.aramRandomWorkspaceStabilityV015112={
    version:V,
    boot,
    syncMode,
    stabilizePick:()=>stabilizePick($('#random')),
    score_logic_changed:false,
    random_scoring_changed:false,
    mode_isolation_changed:true,
    pick_workspace_changed:true,
    layout_flash_changed:true,
    scope:'random-exact-id-workspace-only'
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
