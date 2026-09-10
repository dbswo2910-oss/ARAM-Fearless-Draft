'use strict';
(()=>{
  const V='0.15.54';
  if(window.__ARAM_RANDOM_INGAME_SHOP_POLISH_V01554__)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;

  function ensureStyles(){
    if($('#riShopPolishStyleV01554'))return;
    const st=document.createElement('style');
    st.id='riShopPolishStyleV01554';
    st.textContent=`
      /* Real screenshot follow-up: keep the shop decision dense and remove duplicated chrome. */
      #riCoachShellV01550 .riCoachTitle small::after{content:'INGAME COACH · v0.15.54'!important}
      body.riRandomIngameV01552 .footer,
      body.riRandomIngameV01552 footer.footer{display:none!important}
      #riShopPlannerV01553 .riShopHead{justify-content:flex-start}
      #riShopPlannerV01553 .riShopHead>b{display:none!important}
      #riShopPlannerV01553 .riShopBuyLabel{font-size:9px;color:#7f9fb5}
      #riShopPlannerV01553 .riShopFoot{font-size:10px}
      #riShopPlannerV01553 .riShopFoot span:last-child{font-weight:850;color:#a9c0d1}
    `;
    document.head.appendChild(st);
  }

  function sync(){
    const root=$('#random'),shell=$('#riCoachShellV01550');
    if(!root||!shell)return;
    ensureStyles();
    const ingame=root.getAttribute('data-random-mode')==='ingame';
    document.body?.classList.toggle('riRandomIngameV01552',ingame);

    const planner=$('#riShopPlannerV01553',shell);
    if(!planner)return;
    const head=$('.riShopHead span',planner);
    if(head){
      const t=String(head.textContent||'');
      if(t.includes('미리보기 · 보유 부품 없음 가정'))head.textContent='💰 지금 구매 · 미리보기 · 보유템 없음 가정';
    }
    const label=$('.riShopBuyLabel',planner);
    if(label&&label.textContent!=='지금 살 것')label.textContent='지금 살 것';
  }

  function start(){
    const root=$('#random'),shell=$('#riCoachShellV01550');
    if(!root||!shell){setTimeout(start,160);return}
    ensureStyles();sync();
    const timer=setInterval(sync,320);
    window.__ARAM_RANDOM_INGAME_SHOP_POLISH_V01554__=true;
    window.aramRandomIngameShopPolishV01554={version:V,refresh:sync,timer,score_logic_changed:false,source:'v0.15.53 screenshot micro-polish'};
  }
  start();
})();
