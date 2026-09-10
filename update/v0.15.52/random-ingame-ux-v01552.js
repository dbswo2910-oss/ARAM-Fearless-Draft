'use strict';
(()=>{
  const V='0.15.52';
  if(window.__ARAM_RANDOM_INGAME_UX_V01552__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;

  function ensureStyles(){
    if($('#riUxStyleV01552'))return;
    const st=document.createElement('style');
    st.id='riUxStyleV01552';
    st.textContent=`
      /* Combat HUD should show decisions, not implementation/source noise. */
      body.riRandomIngameV01552 > .footer{display:none!important}
      #riCoachShellV01550 .riMetric[data-ri51="role"] small,
      #riCoachShellV01550 .riMetric[data-ri51="buy"] small{display:none!important}
      #riCoachShellV01550.ri52Dead .riRespawnStrip{grid-template-columns:auto 1fr!important}
      #riCoachShellV01550.ri52Dead .riRespawnStrip span{display:none!important}
      #riCoachShellV01550.ri52Dead .riRespawnStrip b{justify-self:end}
      #riCoachShellV01550 .riCoachTitle small{letter-spacing:.06em}
      #riCoachShellV01550 .riMetric[data-ri51="threat"] small{color:#a9b7c5}
      #riCoachShellV01550 .riMetric[data-ri51="threat"] small[title]{cursor:help}
    `;
    document.head.appendChild(st);
  }

  function threatLabel(score){
    if(score>=90)return '위험 매우 높음';
    if(score>=75)return '위험 높음';
    if(score>=58)return '위험 보통';
    return '위험 낮음';
  }

  function polishThreat(shell){
    const small=$('.riMetric[data-ri51="threat"] small',shell);
    if(!small)return;
    const raw=String(small.textContent||'').trim();
    const m=raw.match(/^(.*?)\s*·\s*(\d+(?:\.\d+)?)점\s*$/);
    if(!m)return;
    const score=Number(m[2]);
    if(!Number.isFinite(score))return;
    const next=`${m[1].trim()} · ${threatLabel(score)}`;
    if(small.textContent!==next)small.textContent=next;
    small.title=`위협 점수 ${score}점 · 상세 탭에서 전체 위협 순위 확인`;
  }

  function sync(){
    const root=$('#random');
    const shell=$('#riCoachShellV01550');
    if(!root||!shell)return;
    ensureStyles();
    const ingame=root.getAttribute('data-random-mode')==='ingame';
    document.body?.classList.toggle('riRandomIngameV01552',ingame);

    const eyebrow=$('.riCoachTitle small',shell);
    if(eyebrow&&eyebrow.textContent!==`INGAME COACH · v${V}`)eyebrow.textContent=`INGAME COACH · v${V}`;

    const title=$('#riCoachTitleV01550',shell);
    const isDead=!!title&&String(title.textContent||'').startsWith('사망 분석');
    shell.classList.toggle('ri52Dead',isDead);
    if(isDead&&title.textContent!=='사망 분석')title.textContent='사망 분석';

    polishThreat(shell);
  }

  function start(){
    const root=$('#random');
    const shell=$('#riCoachShellV01550');
    if(!root||!shell){setTimeout(start,160);return}
    ensureStyles();sync();
    const timer=setInterval(sync,320);
    window.__ARAM_RANDOM_INGAME_UX_V01552__=true;
    window.aramRandomIngameUxV01552={version:V,refresh:sync,timer,score_logic_changed:false,source:'v0.15.51 screenshot micro-polish'};
  }
  start();
})();
