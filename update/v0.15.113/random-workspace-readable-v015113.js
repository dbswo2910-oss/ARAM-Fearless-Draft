'use strict';
(()=>{
  const V='0.15.113';
  if(window.__ARAM_RANDOM_WORKSPACE_READABLE_V015113__===true)return;
  window.__ARAM_RANDOM_WORKSPACE_READABLE_V015113__=true;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;

  function neutralizeLegacyRightRail(){
    let legacy=$('#randomDnaRailStyleV015111');
    if(!legacy){
      legacy=document.createElement('style');
      legacy.id='randomDnaRailStyleV015111';
      (document.head||document.documentElement)?.appendChild(legacy);
    }
    legacy.textContent='/* v0.15.113: v0.15.111 RANDOM right-rail layout rules neutralized; classes remain for compatibility. */';
  }

  function ensureStyle(){
    if($('#randomWorkspaceReadableStyleV015113'))return;
    const st=document.createElement('style');
    st.id='randomWorkspaceReadableStyleV015113';
    st.textContent=`
      /* v0.15.113 — screenshot-confirmed emergency readability repair.
         Do not keep a permanently narrow third rail. Use a two-column workbench:
         left = locked/team input, right = candidate pool + TOP5 + full-width decision area. */
      #random.rp113ReadableWorkspace{
        width:min(1720px,calc(100vw - 28px))!important;
        max-width:none!important;
      }
      #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid{
        display:grid!important;
        grid-template-columns:minmax(320px,360px) minmax(0,1fr)!important;
        gap:12px!important;
        align-items:start!important;
        min-width:0!important;
      }
      #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid>.rp112Left.rp107Left{
        grid-column:1!important;
        grid-row:1 / span 2!important;
        width:100%!important;
        min-width:0!important;
      }
      #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid>.rp112Center.rp107Center{
        grid-column:2!important;
        grid-row:1!important;
        width:100%!important;
        min-width:0!important;
      }
      #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid>.rp112Right.rp107Right{
        grid-column:2!important;
        grid-row:2!important;
        display:grid!important;
        grid-template-columns:repeat(auto-fit,minmax(360px,1fr))!important;
        gap:10px!important;
        align-items:start!important;
        align-content:start!important;
        width:100%!important;
        min-width:0!important;
        max-width:none!important;
        margin:0!important;
      }
      #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid>.rp112Right.rp107Right::before{
        grid-column:1 / -1!important;
        width:auto!important;
        margin:0!important;
      }
      #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid>.rp112Right.rp107Right>*{
        width:100%!important;
        min-width:0!important;
        max-width:none!important;
        box-sizing:border-box!important;
      }
      #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid>.rp112Right.rp107Right>#rpPickIntelV01589{
        order:1!important;
        grid-column:auto!important;
      }
      #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid>.rp112Right.rp107Right>.rp112DetailPanel{
        order:2!important;
        grid-column:auto!important;
      }

      /* Never allow the decision cards to collapse into character-by-character text. */
      #random.rp113ReadableWorkspace #rpPickIntelV01589,
      #random.rp113ReadableWorkspace #rpPickIntelV01589 *,
      #random.rp113ReadableWorkspace .rp112DetailPanel,
      #random.rp113ReadableWorkspace .rp112DetailPanel *{
        min-width:0!important;
        word-break:keep-all!important;
        overflow-wrap:break-word!important;
      }
      #random.rp113ReadableWorkspace #rpPickIntelV01589 .rp89IntelHead,
      #random.rp113ReadableWorkspace #rpPickIntelV01589 .rp89MetricTop,
      #random.rp113ReadableWorkspace #rpPickIntelV01589 .rp90DnaTop,
      #random.rp113ReadableWorkspace #rpPickIntelV01589 .rp103DnaTop{
        min-width:0!important;
      }
      #random.rp113ReadableWorkspace #rpPickIntelV01589 .rp89IntelHead span,
      #random.rp113ReadableWorkspace #rpPickIntelV01589 .rp89MetricTop span,
      #random.rp113ReadableWorkspace #rpPickIntelV01589 .rp89MetricTop b{
        white-space:normal!important;
      }

      /* Preserve the PICK / IN GAME boundary even if an older rule tries display:grid!important. */
      #random[data-random-mode="ingame"] #randomInputAnchor.rp112WorkspaceGrid,
      #random[data-random-mode="ingame"] .randomPickOnly{
        display:none!important;
      }
      #random[data-random-mode="ingame"] #randomIngameShell.randomInGameOnly{
        display:block!important;
      }

      @media(max-width:1180px){
        #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid{
          grid-template-columns:minmax(280px,330px) minmax(0,1fr)!important;
        }
        #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid>.rp112Right.rp107Right{
          grid-template-columns:minmax(0,1fr)!important;
        }
      }
      @media(max-width:900px){
        #random.rp113ReadableWorkspace{width:calc(100vw - 22px)!important}
        #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid{
          grid-template-columns:minmax(0,1fr)!important;
        }
        #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid>.rp112Left.rp107Left,
        #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid>.rp112Center.rp107Center,
        #random.rp113ReadableWorkspace #randomInputAnchor.rp112WorkspaceGrid>.rp112Right.rp107Right{
          grid-column:1!important;
          grid-row:auto!important;
        }
      }
    `;
    (document.head||document.documentElement)?.appendChild(st);
  }

  function apply(){
    neutralizeLegacyRightRail();
    ensureStyle();
    const root=$('#random');
    if(!root)return false;
    try{window.aramRandomWorkspaceStabilityV015112?.stabilizePick?.()}catch{}
    root.classList.add('rp113ReadableWorkspace');
    root.setAttribute('data-aram-random-readable-workspace',V);
    const input=$('#randomInputAnchor',root);
    const right=input?.querySelector?.(':scope > .rp112Right.rp107Right')||input?.querySelector?.(':scope > .rp112Right')||null;
    if(right)right.classList.add('rp113DecisionArea');
    return !!(input&&right);
  }

  function boot(){
    apply();
    queueMicrotask(apply);
    requestAnimationFrame(apply);
    setTimeout(apply,120);
  }

  document.addEventListener('click',e=>{if(e.target?.closest?.('#random'))queueMicrotask(apply)},true);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#random'))queueMicrotask(apply)},true);
  window.addEventListener('aram:random-dna-rail-repaired',()=>queueMicrotask(apply));
  window.addEventListener('resize',()=>queueMicrotask(apply),{passive:true});

  window.aramRandomWorkspaceReadableV015113={
    version:V,
    apply,
    architecture:'two-column RANDOM workbench; decision area below main column; v0.15.111 rail CSS neutralized',
    score_logic_changed:false,
    random_scoring_changed:false,
    data_views_changed:false
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
