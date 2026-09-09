(()=>{
  'use strict';
  if(window.__ARAM_INPUT_INTERACTION_STABILITY_V01539__)return;
  window.__ARAM_INPUT_INTERACTION_STABILITY_V01539__=true;

  const STYLE_ID='aram-input-stability-v01539-style';
  const TOAST_ID='aram-input-stability-v01539-toast';
  let lastEditableInput=null;
  let toastTimer=null;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
      #${TOAST_ID}{position:fixed;left:50%;top:18px;transform:translateX(-50%) translateY(-8px);z-index:2147483647;max-width:min(720px,calc(100vw - 32px));padding:11px 14px;border:1px solid #7ea6cc;border-radius:11px;background:rgba(10,24,40,.97);box-shadow:0 14px 36px rgba(0,0,0,.38);color:#eaf5ff;font-size:12px;font-weight:800;line-height:1.45;opacity:0;pointer-events:none;transition:opacity .14s ease,transform .14s ease;white-space:pre-line;text-align:center}
      #${TOAST_ID}.show{opacity:1;transform:translateX(-50%) translateY(0)}
      #${TOAST_ID}.bad{border-color:#e26d7a;background:rgba(49,15,23,.97);color:#ffdce0}
      #${TOAST_ID}.good{border-color:#4cbe85;background:rgba(10,43,30,.97);color:#d9ffeb}
      .searchInput.aramInputRecovered{outline:2px solid rgba(87,185,255,.72);outline-offset:1px}
    `;
    document.head.appendChild(s);
  }

  function showToast(message,tone='bad'){
    ensureStyle();
    let el=document.getElementById(TOAST_ID);
    if(!el){el=document.createElement('div');el.id=TOAST_ID;document.body.appendChild(el)}
    el.className=tone==='good'?'good':'bad';
    el.textContent=String(message||'확인해주세요.');
    requestAnimationFrame(()=>el.classList.add('show'));
    if(toastTimer)clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.remove('show'),3800);
  }

  function isEditableInput(el){
    return !!el && el instanceof HTMLInputElement && !el.disabled && !el.readOnly;
  }

  function rememberStableSearch(el){
    if(!isEditableInput(el)||!el.classList.contains('searchInput'))return;
    if(!Object.prototype.hasOwnProperty.call(el.dataset,'aramStableCommitted')){
      el.dataset.aramStableCommitted=el.dataset.committed||'';
    }
  }

  function recoverSearchInput(el){
    if(!isEditableInput(el)||!el.classList.contains('searchInput'))return false;
    rememberStableSearch(el);
    const stable=el.dataset.aramStableCommitted;
    const current=el.dataset.committed||'';
    if(stable===current)return false;
    el.value=stable;
    el.dataset.committed=stable;
    el.dataset.enterArmed='';
    el.dataset.actionArmed='';
    el.classList.remove('enterArmed','actionArmed');
    const wrap=el.closest('.searchWrap');
    wrap?.classList.remove('onlineActionReady');
    wrap?.querySelector('.suggest')?.classList.remove('open');
    el.classList.add('aramInputRecovered');
    setTimeout(()=>el.classList.remove('aramInputRecovered'),700);
    return true;
  }

  function refocusInput(el,select=false){
    if(!isEditableInput(el)||!el.isConnected)return;
    setTimeout(()=>{
      if(!isEditableInput(el)||!el.isConnected)return;
      try{el.focus({preventScroll:true})}catch{try{el.focus()}catch{}}
      if(select&&typeof el.select==='function'){try{el.select()}catch{}}
    },85);
  }

  document.addEventListener('focusin',e=>{
    const el=e.target;
    if(isEditableInput(el)){
      lastEditableInput=el;
      rememberStableSearch(el);
    }
  },true);

  document.addEventListener('input',e=>{
    const el=e.target;
    if(!(el instanceof HTMLInputElement))return;
    if(el.id==='onlineJoinCode'||el.id==='onlineWatchCode'){
      const clean=String(el.value||'').replace(/\D/g,'').slice(0,6);
      if(el.value!==clean)el.value=clean;
    }
  },true);

  const nativeAlert=window.alert?.bind(window);
  window.__ARAM_NATIVE_ALERT_V01539__=nativeAlert;
  window.alert=function(message){
    const active=isEditableInput(document.activeElement)?document.activeElement:lastEditableInput;
    const recovered=recoverSearchInput(active);
    showToast(message,'bad');
    if(active)refocusInput(active,recovered||active.id==='onlineJoinCode'||active.id==='onlineWatchCode');
    return undefined;
  };

  function wrapCodeAction(fnName,inputId,label){
    const original=window[fnName];
    if(typeof original!=='function'||original.__aramInputStableV01539)return;
    const wrapped=function(...args){
      const input=document.getElementById(inputId);
      if(input){
        const code=String(input.value||'').replace(/\D/g,'').slice(0,6);
        input.value=code;
        if(code.length!==6){
          lastEditableInput=input;
          showToast(`6자리 ${label}를 입력해주세요.`,'bad');
          refocusInput(input,true);
          return;
        }
      }
      return original.apply(this,args);
    };
    wrapped.__aramInputStableV01539=true;
    wrapped.__aramOriginal=original;
    window[fnName]=wrapped;
  }

  wrapCodeAction('onlineJoinRoom','onlineJoinCode','초대코드');
  wrapCodeAction('onlineWatchRoom','onlineWatchCode','관전 코드');

  // renderOnline()이 입력창을 다시 만들더라도 onclick 전역 함수 래퍼는 유지된다.
  // 잘못된 챔피언/밴 선택에서 기존 검색기가 먼저 committed를 바꾸는 구조는
  // alert 대체 시점에 마지막 정상 committed 값으로 즉시 롤백하고 원래 입력칸에 포커스를 돌린다.
  window.__aramInputStabilityNotify=showToast;
})();
