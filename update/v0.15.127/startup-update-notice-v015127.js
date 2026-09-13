'use strict';
(()=>{
  const V='0.15.127';
  if(window.__ARAM_STARTUP_UPDATE_NOTICE_V015127__===true)return;
  window.__ARAM_STARTUP_UPDATE_NOTICE_V015127__=true;
  let checked=false,showRetries=0,lastResult=null;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  function ensureStyle(){
    if($('#aramStartupUpdateStyleV015127'))return;
    const st=document.createElement('style');
    st.id='aramStartupUpdateStyleV015127';
    st.textContent=`
#aramStartupUpdateV015127{position:fixed;inset:0;z-index:2147483050;display:grid;place-items:center;padding:22px;background:rgba(2,9,16,.72);backdrop-filter:blur(7px)}
#aramStartupUpdateV015127 .asu127Card{width:min(520px,calc(100vw - 34px));overflow:hidden;border:1px solid #2f6e8d;border-radius:18px;background:radial-gradient(circle at 86% 6%,rgba(61,190,255,.18),transparent 30%),linear-gradient(160deg,#0b263b,#071621 72%);box-shadow:0 28px 80px rgba(0,0,0,.5);color:#eef9ff;font-family:inherit}
#aramStartupUpdateV015127 .asu127Glow{height:4px;background:linear-gradient(90deg,#4ac7ff,#7de1ff,#4ac7ff)}
#aramStartupUpdateV015127 .asu127Body{padding:25px 27px 16px}
#aramStartupUpdateV015127 .asu127Eyebrow{font-size:10px;font-weight:900;letter-spacing:1.5px;color:#67cdfb}
#aramStartupUpdateV015127 h2{margin:8px 0 8px;font-size:24px;letter-spacing:-.4px}
#aramStartupUpdateV015127 p{margin:0;color:#9ebed1;font-size:13px;line-height:1.65}
#aramStartupUpdateV015127 .asu127Version{display:flex;align-items:center;gap:9px;margin-top:17px;padding:12px 14px;border:1px solid #24506a;border-radius:11px;background:rgba(5,20,32,.62)}
#aramStartupUpdateV015127 .asu127Version strong{font-size:18px;color:#fff}#aramStartupUpdateV015127 .asu127Version span{font-size:10px;font-weight:900;color:#7fdcff}
#aramStartupUpdateV015127 .asu127Actions{display:flex;gap:9px;padding:0 27px 25px}
#aramStartupUpdateV015127 button{appearance:none;border:0;font-family:inherit;cursor:pointer}
#aramStartupUpdateV015127 .asu127Primary{flex:1;border-radius:10px;padding:11px 14px;background:linear-gradient(180deg,#2ea7dc,#1779ad);color:#fff;font-size:12px;font-weight:900}
#aramStartupUpdateV015127 .asu127Later{border:1px solid #31546b;border-radius:10px;padding:11px 15px;background:#081b29;color:#a7bdcb;font-size:11px;font-weight:800}
#aramStartupUpdateV015127 .asu127Primary:disabled,#aramStartupUpdateV015127 .asu127Later:disabled{opacity:.55;cursor:wait}
@media(max-width:560px){#aramStartupUpdateV015127 .asu127Actions{flex-direction:column}#aramStartupUpdateV015127 .asu127Body{padding:22px 22px 16px}#aramStartupUpdateV015127 .asu127Actions{padding:0 22px 22px}}
`;
    (document.head||document.documentElement)?.appendChild(st);
  }
  function setBadge(result){
    const el=document.getElementById('topUpdateBadge');
    if(!el)return;
    if(result?.status==='available'){el.textContent=`업데이트 있음 · v${result.latest}`;el.title='클릭하면 업데이트를 적용하고 앱을 재시작합니다.'}
    else if(result?.status==='launcher-required'){el.textContent='Launcher 업데이트 필요'}
  }
  function close(){const el=$('#aramStartupUpdateV015127');if(el)el.remove()}
  async function apply(){
    const modal=$('#aramStartupUpdateV015127');if(!modal)return;
    const p=$('.asu127Primary',modal),l=$('.asu127Later',modal),msg=$('.asu127Message',modal);
    if(p)p.disabled=true;if(l)l.disabled=true;if(p)p.textContent='업데이트 적용 중…';if(msg)msg.textContent='파일을 검증하고 안전하게 적용하는 중입니다. 완료되면 자동으로 재시작합니다.';
    try{
      const r=await window.aramDesktop?.checkAndApplyUpdate?.();
      if(r?.status==='applied'){if(p)p.textContent='재시작 준비 완료';if(msg)msg.textContent=`v${r.latest} 적용 완료 · 잠시 후 자동으로 재시작합니다.`;return}
      if(r?.status==='current'){close();return}
      if(msg)msg.textContent=r?.message||'업데이트 적용에 실패했습니다.';
      if(p){p.disabled=false;p.textContent='다시 시도'}if(l)l.disabled=false;
    }catch(e){if(msg)msg.textContent=e?.message||String(e);if(p){p.disabled=false;p.textContent='다시 시도'}if(l)l.disabled=false}
  }
  function show(result){
    if(!result||result.status!=='available'||$('#aramStartupUpdateV015127'))return false;
    if($('#aramPatchNotesNoticeV015123')&&showRetries<20){showRetries++;setTimeout(()=>show(result),500);return false}
    ensureStyle();
    const modal=document.createElement('div');modal.id='aramStartupUpdateV015127';modal.dataset.latest=String(result.latest||'');
    modal.innerHTML=`<section class="asu127Card" role="dialog" aria-modal="true" aria-labelledby="asu127Title"><div class="asu127Glow"></div><div class="asu127Body"><div class="asu127Eyebrow">APP UPDATE</div><h2 id="asu127Title">새 업데이트가 준비됐어요</h2><p class="asu127Message">${String(result.releaseMessage||result.message||'새 버전이 있습니다.').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</p><div class="asu127Version"><strong>v${String(result.latest||'')}</strong><span>현재 v${String(result.current||V)}</span></div></div><div class="asu127Actions"><button type="button" class="asu127Primary">업데이트 후 재시작</button><button type="button" class="asu127Later">나중에</button></div></section>`;
    document.body.appendChild(modal);
    $('.asu127Primary',modal)?.addEventListener('click',apply);
    $('.asu127Later',modal)?.addEventListener('click',()=>close());
    $('.asu127Primary',modal)?.focus?.();
    document.documentElement?.setAttribute('data-aram-startup-update',`available:${result.latest}`);
    return true;
  }
  function showLauncherRequired(result){
    setBadge(result);
    document.documentElement?.setAttribute('data-aram-startup-update',`launcher-required:${result?.minLauncher||''}`);
  }
  async function checkNow(){
    if(checked)return lastResult;
    checked=true;
    if(!window.aramDesktop?.checkUpdateAvailability)return{status:'unsupported',current:V};
    try{
      const r=await window.aramDesktop.checkUpdateAvailability();lastResult=r||{status:'error'};setBadge(lastResult);
      if(lastResult.status==='available')show(lastResult);else if(lastResult.status==='launcher-required')showLauncherRequired(lastResult);else document.documentElement?.setAttribute('data-aram-startup-update',lastResult.status||'unknown');
      return lastResult;
    }catch(e){lastResult={status:'error',current:V,message:e?.message||String(e)};return lastResult}
  }
  function boot(){setTimeout(()=>{checkNow()},1200)}
  window.aramStartupUpdateNoticeV015127={version:V,checkNow,show,close,apply,score_logic_changed:false,random_scoring_changed:false};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
