'use strict';
(()=>{
  const V='0.15.109';
  if(window.__ARAM_SCREENSHOT_POLISH_V015109__===true)return;
  window.__ARAM_SCREENSHOT_POLISH_V015109__=true;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  let timer=0;

  function ensureStyle(){
    if($('#aramScreenshotPolishStyleV015109'))return;
    const st=document.createElement('style');
    st.id='aramScreenshotPolishStyleV015109';
    st.textContent=`
      /* v0.15.109 — screenshot-confirmed visual cleanup only. */
      #random #rpPickIntelV01589{font-size:10px!important;line-height:1.35!important;overflow:hidden!important}
      #random #rpPickIntelV01589 .rp89IntelHead{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;margin-bottom:8px!important}
      #random #rpPickIntelV01589 .rp89IntelHead b{font-size:12px!important;line-height:1.2!important;color:#eef9ff!important}
      #random #rpPickIntelV01589 .rp89IntelHead span{font-size:7px!important;line-height:1.2!important;color:#55e8c7!important;font-weight:900!important;text-align:right!important}

      #random #rpPickIntelV01589 .rp90DnaMetric,
      #random #rpPickIntelV01589 .rp103DnaMetric{display:block!important;padding:6px 0!important;border-bottom:1px solid #173247!important}
      #random #rpPickIntelV01589 .rp90DnaTop,
      #random #rpPickIntelV01589 .rp103DnaTop{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important;font-size:8px!important;line-height:1.25!important;color:#85a6be!important}
      #random #rpPickIntelV01589 .rp90DnaTop b,
      #random #rpPickIntelV01589 .rp103DnaTop b{font-size:8px!important;line-height:1.25!important;color:#dff5ff!important;white-space:nowrap!important}
      #random #rpPickIntelV01589 .rp90DnaMetric.missing .rp90DnaTop b,
      #random #rpPickIntelV01589 .rp103DnaMetric.missing .rp103DnaTop b{color:#f0c95c!important}
      #random #rpPickIntelV01589 .rp90DnaBar,
      #random #rpPickIntelV01589 .rp103DnaBar{display:block!important;height:6px!important;border-radius:999px!important;background:#102a3d!important;overflow:hidden!important;margin-top:4px!important}
      #random #rpPickIntelV01589 .rp90DnaBar i,
      #random #rpPickIntelV01589 .rp103DnaBar i{display:block!important;height:100%!important;width:var(--v,0%)!important;border-radius:inherit!important;background:linear-gradient(90deg,#24b7dd,#2fe0bf)!important}
      #random #rpPickIntelV01589 .rp90DnaMetric.missing .rp90DnaBar i,
      #random #rpPickIntelV01589 .rp103DnaMetric.missing .rp103DnaBar i{background:linear-gradient(90deg,#d49527,#efc24c)!important}

      #random #rpPickIntelV01589 .rp90DnaDamage,
      #random #rpPickIntelV01589 .rp103Damage{display:block!important;padding:7px 0!important;border-bottom:1px solid #173247!important}
      #random #rpPickIntelV01589 .rp90DnaSplit,
      #random #rpPickIntelV01589 .rp103Split{display:flex!important;height:7px!important;margin-top:4px!important;border-radius:999px!important;overflow:hidden!important;background:#11283b!important}
      #random #rpPickIntelV01589 .rp90DnaSplit .ad,
      #random #rpPickIntelV01589 .rp103Split .ad{display:block!important;width:var(--ad,50%)!important;background:#ff796f!important}
      #random #rpPickIntelV01589 .rp90DnaSplit .ap,
      #random #rpPickIntelV01589 .rp103Split .ap{display:block!important;width:var(--ap,50%)!important;background:#59bcff!important}
      #random #rpPickIntelV01589 .rp90DnaLegend,
      #random #rpPickIntelV01589 .rp103Legend{display:flex!important;justify-content:space-between!important;gap:8px!important;font-size:7px!important;color:#7899b2!important;margin-top:3px!important}

      #random #rpPickIntelV01589 .rp89IntelSection,
      #random #rpPickIntelV01589 .rp103IntelSection{display:block!important;margin-top:8px!important;padding-top:7px!important;border-top:1px solid #1e3b50!important}
      #random #rpPickIntelV01589 .rp89IntelSection>strong,
      #random #rpPickIntelV01589 .rp103IntelSection>strong{display:block!important;font-size:9px!important;line-height:1.3!important;color:#dceefa!important;margin-bottom:5px!important}
      #random #rpPickIntelV01589 .rp89Chips,
      #random #rpPickIntelV01589 .rp103Chips{display:flex!important;flex-wrap:wrap!important;gap:4px!important}
      #random #rpPickIntelV01589 .rp89Chip,
      #random #rpPickIntelV01589 .rp103Chip{display:inline-flex!important;align-items:center!important;font-size:7px!important;line-height:1.2!important;padding:3px 6px!important;border-radius:999px!important}
      #random #rpPickIntelV01589 .rp89Top1,
      #random #rpPickIntelV01589 .rp103Top1{display:block!important;padding:7px!important;border-radius:7px!important;overflow:hidden!important}
      #random #rpPickIntelV01589 .rp89Top1 span,
      #random #rpPickIntelV01589 .rp103Top1 span{display:block!important;font-size:7px!important;line-height:1.2!important}
      #random #rpPickIntelV01589 .rp89Top1 b,
      #random #rpPickIntelV01589 .rp103Top1 b{display:block!important;font-size:11px!important;line-height:1.25!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #random #rpPickIntelV01589 .rp89Top1 small,
      #random #rpPickIntelV01589 .rp103Top1 small{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:3!important;overflow:hidden!important;margin-top:4px!important;font-size:7px!important;line-height:1.35!important;color:#9cb5c7!important}

      /* Keep the right analysis column readable without stealing the TOP5 workspace. */
      @media(min-width:1451px){
        #random.rp107RandomRepair #randomInputAnchor.rp107RandomGrid{grid-template-columns:minmax(320px,.70fr) minmax(660px,1.42fr) minmax(320px,.68fr)!important}
      }
    `;
    (document.head||document.documentElement)?.appendChild(st);
  }

  function findDetailTitle(card,view){
    let node=card?.parentElement||null;
    while(node&&node!==view){
      const direct=[...(node.children||[])].find(x=>x?.classList?.contains('title'));
      if(direct&&/챔피언 상세|패치노트/.test(txt(direct)))return direct;
      if(node.classList?.contains('panel')){
        const t=node.querySelector?.(':scope > .title');
        if(t&&/챔피언 상세|패치노트/.test(txt(t)))return t;
      }
      node=node.parentElement;
    }
    return null;
  }
  function patchMode(view,card){
    if(view?.dataset?.rp108RequestedMode==='patch')return true;
    if(card?.classList?.contains('dataHubPatchModeV01599'))return true;
    const b=$('[data-v103-tab="patch"].active',view);if(b)return true;
    const n=$('#dataPatchNotesV01599',card);if(n){try{return getComputedStyle(n).display!=='none'}catch{}}
    return false;
  }
  function repairDataLabels(){
    const card=$('#dataCard');if(!card)return;
    const view=document.getElementById('data')?.contains(card)?document.getElementById('data'):card.closest?.('.view');
    if(!view)return;
    const mode=patchMode(view,card);
    const title=findDetailTitle(card,view);
    if(title){
      if(!title.dataset.rp109OriginalTitle)title.dataset.rp109OriginalTitle=txt(title)||'챔피언 상세';
      title.textContent=mode?'패치노트':title.dataset.rp109OriginalTitle;
    }
    const eyebrow=$('#dataPatchNotesV01599 .dh99Eyebrow',card);
    if(eyebrow&&/ARAM PATCH COMPANION/i.test(txt(eyebrow)))eyebrow.textContent='❄ ARAM PATCH COMPANION · 26.18';
    view.setAttribute('data-aram-screenshot-polish',V);
  }
  function repairRandomIntel(){
    const root=$('#random'),intel=$('#rpPickIntelV01589',root);if(!root||!intel)return;
    intel.setAttribute('data-aram-intel-polish',V);
    root.setAttribute('data-aram-screenshot-polish',V);
  }
  function repair(){
    ensureStyle();
    try{repairDataLabels()}catch(e){console.warn?.('[ARAM v0.15.109] Data label polish skipped',e)}
    try{repairRandomIntel()}catch(e){console.warn?.('[ARAM v0.15.109] Random intel polish skipped',e)}
    document.documentElement?.setAttribute('data-aram-ui-patch',V);
  }
  function schedule(delay=20){clearTimeout(timer);timer=setTimeout(()=>{requestAnimationFrame(repair);setTimeout(repair,90)},Math.max(0,delay))}
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-v103-tab],[data-dh99-tab],#random,#dataCard,button'))schedule(10)},true);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#random,#dataCard'))schedule(20)},true);
  document.addEventListener('input',e=>{if(e.target?.closest?.('#random'))schedule(30)},true);
  window.aramScreenshotPolishV015109={version:V,repair,repairDataLabels,repairRandomIntel,score_logic_changed:false};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(0),{once:true});else schedule(0);
})();
