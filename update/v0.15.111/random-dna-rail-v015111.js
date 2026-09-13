'use strict';
(()=>{
  const V='0.15.111';
  if(window.__ARAM_RANDOM_DNA_RAIL_V015111__===true)return;
  window.__ARAM_RANDOM_DNA_RAIL_V015111__=true;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  let timer=0;

  function ensureStyle(){
    if($('#randomDnaRailStyleV015111'))return;
    const st=document.createElement('style');
    st.id='randomDnaRailStyleV015111';
    st.textContent=`
      /* v0.15.111 — screenshot-confirmed RANDOM right-rail repair.
         The old responsive rule could leave detail + DNA squeezed into two tiny
         columns. Auto-fit now decides from the rail's actual width instead of
         viewport assumptions: narrow rail = one readable column; wide row = two. */
      #random.rp107RandomRepair #randomInputAnchor>.rp107Right,
      #random #randomInputAnchor>.rp111RightRail{
        display:grid!important;
        grid-template-columns:repeat(auto-fit,minmax(260px,1fr))!important;
        gap:10px!important;
        align-content:start!important;
        align-items:start!important;
        min-width:0!important;
        width:100%!important;
      }
      #random #randomInputAnchor>.rp111RightRail>*{
        min-width:0!important;
        width:100%!important;
        max-width:100%!important;
        box-sizing:border-box!important;
      }
      #random #randomInputAnchor>.rp111RightRail>.rp111DetailPanel{order:1!important}
      #random #randomInputAnchor>.rp111RightRail>#rpPickIntelV01589,
      #random #randomInputAnchor>.rp111RightRail>.rp111DnaPanel{order:2!important}

      /* Stop the selection-detail prose/metrics from breaking almost character by
         character when the rail is narrow. */
      #random .rp111DetailPanel,
      #random .rp111DetailPanel *{
        min-width:0!important;
      }
      #random .rp111DetailPanel{
        overflow:hidden!important;
      }
      #random .rp111DetailPanel .title{
        font-size:13px!important;
        line-height:1.3!important;
        word-break:keep-all!important;
      }
      #random .rp111DetailPanel #comboDetail,
      #random .rp111DetailPanel #comboDetail *{
        word-break:keep-all!important;
        overflow-wrap:break-word!important;
        line-height:1.45!important;
      }

      /* DNA remains compact, but no longer microscopic in a desktop side rail. */
      #random #rpPickIntelV01589{
        min-width:0!important;
        width:100%!important;
        max-width:100%!important;
        overflow:hidden!important;
        box-sizing:border-box!important;
      }
      #random #rpPickIntelV01589 .rp89IntelHead b{font-size:12px!important;line-height:1.25!important}
      #random #rpPickIntelV01589 .rp89IntelHead span{font-size:7.5px!important;line-height:1.2!important;white-space:nowrap!important}
      #random #rpPickIntelV01589 .rp90DnaTop,
      #random #rpPickIntelV01589 .rp103DnaTop{font-size:8px!important;gap:8px!important}
      #random #rpPickIntelV01589 .rp90DnaTop b,
      #random #rpPickIntelV01589 .rp103DnaTop b{font-size:8.5px!important}
      #random #rpPickIntelV01589 .rp89Top1 b,
      #random #rpPickIntelV01589 .rp103Top1 b{white-space:normal!important;word-break:keep-all!important;overflow-wrap:break-word!important;text-overflow:clip!important}

      /* At genuinely small widths, keep a single rail column. */
      @media(max-width:1060px){
        #random.rp107RandomRepair #randomInputAnchor>.rp107Right,
        #random #randomInputAnchor>.rp111RightRail{grid-template-columns:minmax(0,1fr)!important}
      }
    `;
    (document.head||document.documentElement)?.appendChild(st);
  }

  function directChild(host,node){
    let x=node;
    while(x&&x.parentElement&&x.parentElement!==host)x=x.parentElement;
    return x?.parentElement===host?x:null;
  }

  function repair(){
    ensureStyle();
    try{window.aramViewBoundaryRepairV015107?.repairRandom?.()}catch{}
    const root=$('#random'),input=$('#randomInputAnchor',root);
    if(!root||!input)return;
    const intel=$('#rpPickIntelV01589',root);
    const detail=$('#comboDetail',root);
    const detailPanel=detail?.closest?.('.panel')||detail?.parentElement||null;
    let right=$(':scope > .rp107Right',input);
    if(!right&&intel&&detailPanel){
      let p=intel.parentElement;
      while(p&&p!==input&&!p.contains(detailPanel))p=p.parentElement;
      if(p&&p!==input)right=p;
    }
    if(!right)return;
    right.classList.add('rp111RightRail');
    if(detailPanel&&directChild(right,detailPanel)===detailPanel)detailPanel.classList.add('rp111DetailPanel');
    else if(detailPanel&&right.contains(detailPanel))detailPanel.classList.add('rp111DetailPanel');
    if(intel&&right.contains(intel))intel.classList.add('rp111DnaPanel');
    root.setAttribute('data-aram-random-dna-rail',V);
    window.dispatchEvent(new CustomEvent('aram:random-dna-rail-repaired',{detail:{version:V}}));
  }

  function schedule(delay=20){
    clearTimeout(timer);
    timer=setTimeout(()=>{requestAnimationFrame(repair);setTimeout(repair,80)},Math.max(0,delay));
  }
  document.addEventListener('click',e=>{if(e.target?.closest?.('#random,button'))schedule(10)},true);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#random'))schedule(20)},true);
  document.addEventListener('input',e=>{if(e.target?.closest?.('#random'))schedule(30)},true);
  window.addEventListener('resize',()=>schedule(30),{passive:true});
  window.aramRandomDnaRailV015111={version:V,repair,score_logic_changed:false,scope:'random-right-rail-only'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(0),{once:true});else schedule(0);
})();
