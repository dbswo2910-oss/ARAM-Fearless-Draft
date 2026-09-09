'use strict';
(()=>{
  const V='0.15.51';
  if(window.__ARAM_RANDOM_INGAME_UX_V01551__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;

  function ensureStyles(){
    if($('#riUxStyleV01551'))return;
    const st=document.createElement('style');
    st.id='riUxStyleV01551';
    st.textContent=`
      /* In-game means in-game: remove pick-stage noise, but restore instantly when mode changes. */
      #random.riIngameFocusV01551 .rpStageHeadV01549,
      #random.riIngameFocusV01551 #randomInputAnchor,
      #random.riIngameFocusV01551 #rpFocusCardV01549,
      #random.riIngameFocusV01551 #randomRecommendAnchor,
      #random.riIngameFocusV01551 #rpInfoShellV01549,
      #random.riIngameFocusV01551 > .randomHero.randomPickOnly,
      #random.riIngameFocusV01551 > .mobilePhaseNav.randomPickOnly,
      #random.riIngameFocusV01551 > .panel.mt.randomPickOnly,
      #random.riIngameFocusV01551 > .grid2.mt.randomPickOnly{display:none!important}

      /* Preview controls: one compact toolbar instead of two full-width rows. */
      #riCoachShellV01550.preview .riPreviewBar{
        display:grid!important;
        grid-template-columns:max-content repeat(3,max-content) minmax(220px,1fr) minmax(160px,.58fr);
        align-items:center;gap:6px;padding:7px 12px;background:#211c0d
      }
      #riCoachShellV01550 .riPreviewBar select{width:100%;min-width:0;height:30px}
      #riCoachShellV01550 .riPreviewBar button{height:30px;padding:5px 9px}
      #riCoachShellV01550 .riPreviewNote{white-space:nowrap}

      /* LIVE: only three supporting cards. Current situation already lives in NOW CALL. */
      #riCoachShellV01550 .riMetrics{grid-template-columns:minmax(150px,.78fr) minmax(280px,1.55fr) minmax(180px,.92fr)!important;gap:9px}
      #riCoachShellV01550 .riMetric[data-ri51="situation"]{display:none!important}
      #riCoachShellV01550 .riMetric{padding:10px 11px}
      #riCoachShellV01550 .riMetric span{font-size:9px}
      #riCoachShellV01550 .riMetric b{font-size:13px;white-space:normal;overflow:visible;text-overflow:clip}
      #riCoachShellV01550 .riMetric small{font-size:9px;white-space:normal;overflow:visible;text-overflow:clip}
      #riCoachShellV01550 .riMetric[data-ri51="threat"]{border-color:#5f3a43;background:#16151d}
      #riCoachShellV01550 .riMetric[data-ri51="role"]{border-color:#31526f;background:#0b1b2b}
      #riCoachShellV01550 .riMetric[data-ri51="buy"]{border-color:#2f6a55;background:#0c211b}
      #riCoachShellV01550 .riHero{padding:13px 14px}
      #riCoachShellV01550 .riHero h3{font-size:21px;margin-top:4px}
      #riCoachShellV01550 .riAlert{font-size:11px;padding:9px 11px}

      /* Death mode: action first, statistics second. */
      #riCoachShellV01550 .riBuildCompare{grid-template-columns:minmax(0,1.35fr) minmax(0,.65fr)!important;gap:10px}
      #riCoachShellV01550 .riBuildCard.opt{order:-1;padding:12px 13px;border-width:2px}
      #riCoachShellV01550 .riBuildCard.opt .riBuildMain{font-size:18px}
      #riCoachShellV01550 .riBuildCard.opt .riBuildSub{font-size:9px}
      #riCoachShellV01550 .riBuildCard:not(.opt){opacity:.82;padding:10px}
      #riCoachShellV01550 .riBuildCard:not(.opt) .riBuildTree{font-size:9px;line-height:1.45}
      #riCoachShellV01550 .riRespawnStrip{padding:10px 12px}
      #riCoachShellV01550 .riRespawnStrip strong{font-size:23px}
      #riCoachShellV01550 .riOneLine{border-left:3px solid #4c86ad;padding:9px 11px;font-size:11px}

      /* Slightly tighter frame so the entire decision HUD fits without scrolling. */
      #riCoachShellV01550 .riCoachBody{padding:10px 12px 12px;min-height:0}
      #riCoachShellV01550 .riCoachTabs{padding-top:7px}

      @media(max-width:1120px){
        #riCoachShellV01550.preview .riPreviewBar{grid-template-columns:max-content repeat(3,max-content) minmax(170px,1fr) minmax(130px,.55fr)}
        #riCoachShellV01550 .riMetrics{grid-template-columns:minmax(130px,.8fr) minmax(230px,1.4fr) minmax(160px,.9fr)!important}
      }
      @media(max-width:860px){
        #riCoachShellV01550.preview .riPreviewBar{grid-template-columns:repeat(4,max-content) 1fr}
        #riCoachShellV01550 .riPreviewNote{grid-column:1/-1}
        #riCoachShellV01550 .riPreviewBar select{grid-column:span 2}
        #riCoachShellV01550 .riMetrics{grid-template-columns:1fr!important}
        #riCoachShellV01550 .riBuildCompare{grid-template-columns:1fr!important}
      }
    `;
    document.head.appendChild(st);
  }

  function markLiveCards(shell){
    const cards=[...shell.querySelectorAll('.riMetrics > .riMetric')];
    const keys=['threat','role','buy','situation'];
    cards.forEach((el,i)=>{
      if(keys[i]&&el.dataset.ri51!==keys[i])el.dataset.ri51=keys[i];
    });
  }

  function sync(){
    const root=$('#random');
    const shell=$('#riCoachShellV01550');
    if(!root||!shell)return;
    ensureStyles();
    const ingame=root.getAttribute('data-random-mode')==='ingame';
    root.classList.toggle('riIngameFocusV01551',ingame);
    root.classList.toggle('riPreviewFocusV01551',shell.classList.contains('preview'));
    markLiveCards(shell);
  }

  function start(){
    const root=$('#random');
    const shell=$('#riCoachShellV01550');
    if(!root||!shell){setTimeout(start,160);return}
    ensureStyles();sync();
    const mo=new MutationObserver(()=>sync());
    mo.observe(root,{attributes:true,attributeFilter:['data-random-mode'],childList:true,subtree:true});
    window.__ARAM_RANDOM_INGAME_UX_V01551__=true;
    window.aramRandomIngameUxV01551={version:V,refresh:sync,score_logic_changed:false,source:'v0.15.50 coach HUD screenshot polish'};
  }
  start();
})();
