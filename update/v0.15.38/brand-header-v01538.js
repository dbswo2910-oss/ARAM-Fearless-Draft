'use strict';
(()=>{
  const V='0.15.38';
  let desktopVersion=V;
  const brandText='by잉디디';

  function applyBrand(){
    const badge=document.querySelector('header .badge');
    if(badge&&badge.textContent!==brandText){
      badge.textContent=brandText;
      badge.title=`현재 앱 버전은 오른쪽 업데이트 배지에서 확인할 수 있습니다.`;
    }
    document.title=`ARAM Fearless Draft v${desktopVersion}`;
  }

  async function syncDesktopVersion(){
    try{
      const info=await window.aramDesktop?.getDesktopInfo?.();
      if(info?.version)desktopVersion=String(info.version);
    }catch{}
    applyBrand();
  }

  try{
    const previous=window.syncAppVersionUI;
    window.syncAppVersionUI=function(...args){
      let result;
      try{result=previous?.apply(this,args)}finally{applyBrand()}
      return result;
    };

    const header=document.querySelector('header');
    if(header){
      const observer=new MutationObserver(()=>applyBrand());
      observer.observe(header,{subtree:true,childList:true,characterData:true});
    }

    applyBrand();
    syncDesktopVersion();
    setTimeout(applyBrand,100);
    setTimeout(applyBrand,600);

    window.__ARAM_BRAND_HEADER_V01538__=true;
    if(typeof DATA!=='undefined'){
      DATA.brand_header_v01538={version:'v0.15.38 · Header brand-only badge',header_badge:brandText,version_source:'desktop:get-info/right updater badge'};
    }
  }catch(e){
    console.error('[v0.15.38] brand header patch failed',e);
    window.__ARAM_BRAND_HEADER_V01538__=false;
  }
})();
