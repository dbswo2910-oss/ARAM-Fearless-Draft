'use strict';
(()=>{
  const V='0.15.110';
  if(window.__ARAM_PATCH_NOTES_DENSITY_V015110__===true)return;
  window.__ARAM_PATCH_NOTES_DENSITY_V015110__=true;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  let timer=0;

  function ensureStyle(){
    if($('#aramPatchNotesDensityStyleV015110'))return;
    const st=document.createElement('style');
    st.id='aramPatchNotesDensityStyleV015110';
    st.textContent=`
      /* v0.15.110 — Patch Notes champion cards only. Never touch DATA tier cards. */
      #dataPatchNotesV01599 #dh99ChampionGrid.dh99ChampionGrid{
        display:grid!important;
        grid-template-columns:repeat(6,minmax(0,1fr))!important;
        gap:7px!important;
        padding:10px 12px 13px!important;
        align-items:stretch!important;
      }
      #dataPatchNotesV01599 #dh99ChampionGrid .dh99Champ{
        min-width:0!important;
        min-height:88px!important;
        height:auto!important;
        padding:7px 5px!important;
        border-radius:9px!important;
        overflow:hidden!important;
      }
      #dataPatchNotesV01599 #dh99ChampionGrid .dh99Champ .dh99Portrait{
        display:block!important;
        position:relative!important;
        width:46px!important;
        height:46px!important;
        min-width:46px!important;
        min-height:46px!important;
        max-width:46px!important;
        max-height:46px!important;
        aspect-ratio:1/1!important;
        margin:0 auto 6px!important;
        border-radius:8px!important;
        overflow:hidden!important;
        box-sizing:border-box!important;
        transform:none!important;
      }
      #dataPatchNotesV01599 #dh99ChampionGrid .dh99Champ .dh99Portrait img{
        display:block!important;
        width:46px!important;
        height:46px!important;
        min-width:46px!important;
        min-height:46px!important;
        max-width:46px!important;
        max-height:46px!important;
        object-fit:cover!important;
        object-position:center!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        transform:none!important;
      }
      #dataPatchNotesV01599 #dh99ChampionGrid .dh99ChampName{
        display:block!important;
        font-size:10px!important;
        line-height:1.2!important;
        margin:0!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
        white-space:nowrap!important;
      }
      #dataPatchNotesV01599 #dh99ChampionGrid .dh99Badge{
        display:inline-flex!important;
        margin-top:4px!important;
        padding:2px 5px!important;
        font-size:7px!important;
        line-height:1.2!important;
      }
      @media(max-width:1180px){
        #dataPatchNotesV01599 #dh99ChampionGrid.dh99ChampionGrid{grid-template-columns:repeat(5,minmax(0,1fr))!important}
      }
      @media(max-width:900px){
        #dataPatchNotesV01599 #dh99ChampionGrid.dh99ChampionGrid{grid-template-columns:repeat(4,minmax(0,1fr))!important}
      }
      @media(max-width:650px){
        #dataPatchNotesV01599 #dh99ChampionGrid.dh99ChampionGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
      }
    `;
    (document.head||document.documentElement)?.appendChild(st);
  }

  function forcePortraitSize(){
    const root=$('#dataPatchNotesV01599');
    if(!root)return;
    $$('#dh99ChampionGrid .dh99Portrait',root).forEach(el=>{
      ['width','height','min-width','min-height','max-width','max-height'].forEach(p=>el.style.setProperty(p,'46px','important'));
      el.style.setProperty('transform','none','important');
    });
    $$('#dh99ChampionGrid .dh99Portrait img',root).forEach(img=>{
      ['width','height','min-width','min-height','max-width','max-height'].forEach(p=>img.style.setProperty(p,'46px','important'));
      img.style.setProperty('object-fit','cover','important');
      img.style.setProperty('transform','none','important');
    });
    root.setAttribute('data-aram-patch-density',V);
  }

  function repair(){
    ensureStyle();
    try{forcePortraitSize()}catch(e){console.warn?.('[ARAM v0.15.110] Patch Notes density repair skipped',e)}
    document.documentElement?.setAttribute('data-aram-ui-patch',V);
  }
  function schedule(delay=20){clearTimeout(timer);timer=setTimeout(()=>{requestAnimationFrame(repair);setTimeout(repair,80)},Math.max(0,delay))}
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-v103-tab="patch"],[data-dh99-tab="patch"],#dataCard'))schedule(10)},true);
  window.aramPatchNotesDensityV015110={version:V,repair,score_logic_changed:false,scope:'patch-notes-only'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>schedule(0),{once:true});else schedule(0);
})();
