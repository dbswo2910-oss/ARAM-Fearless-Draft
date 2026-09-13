'use strict';
(()=>{
  const V='0.15.127';
  if(window.__ARAM_STARTUP_UPDATE_NOTICE_V015127__===true)return;
  window.__ARAM_STARTUP_UPDATE_NOTICE_V015127__=true;
  let started=false,lastResult=null,retries=0;
  function badge(){return document.getElementById('topUpdateBadge')||null}
  function setBadge(text,title=''){const el=badge();if(!el)return;el.textContent=text;if(title)el.title=title}
  async function run(){
    if(started)return lastResult;
    if(document.getElementById('aramPatchNotesNoticeV015123')&&retries<20){retries++;setTimeout(run,500);return null}
    started=true;
    if(!window.aramDesktop?.checkAndApplyUpdate){lastResult={status:'unsupported',current:V};return lastResult}
    try{
      const r=await window.aramDesktop.checkAndApplyUpdate();
      lastResult=r||{status:'error',current:V};
      if(lastResult.status==='current')setBadge(`✓ 최신 버전 · v${lastResult.current||V}`,'앱 시작 시 자동으로 최신 버전을 확인합니다.');
      else if(lastResult.status==='applied')setBadge(`✓ v${lastResult.latest} 적용 완료`,'업데이트 적용 완료 · 자동으로 재시작합니다.');
      else if(lastResult.status==='launcher-required')setBadge('! Launcher 업데이트 필요',lastResult.message||'새 Launcher가 필요합니다.');
      else if(lastResult.status==='busy')setBadge('⟳ 업데이트 확인 중…');
      else if(lastResult.status==='error'){const el=badge();if(el)el.title=lastResult.message||'자동 업데이트 확인에 실패했습니다. 클릭해서 다시 확인할 수 있습니다.'}
      document.documentElement?.setAttribute('data-aram-startup-update',String(lastResult.status||'unknown'));
      return lastResult;
    }catch(e){lastResult={status:'error',current:V,message:e?.message||String(e)};const el=badge();if(el)el.title=lastResult.message;return lastResult}
  }
  function boot(){setTimeout(run,1200)}
  window.aramStartupUpdateNoticeV015127={version:V,run,score_logic_changed:false,random_scoring_changed:false,mode:'auto-check-apply-restart'};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
