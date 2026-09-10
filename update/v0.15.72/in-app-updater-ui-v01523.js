'use strict';
(()=>{
  const V='0.15.23';
  let busy=false,lastBound=null,toastTimer=0;
  function installStyle(){if(document.getElementById('upd23style'))return;const s=document.createElement('style');s.id='upd23style';s.textContent=`
.aramUpdateClickableV01523{cursor:pointer!important;user-select:none;transition:filter .15s ease,transform .15s ease}.aramUpdateClickableV01523:hover{filter:brightness(1.18);transform:translateY(-1px)}.aramUpdateClickableV01523:focus{outline:1px solid #b78cff;outline-offset:2px}.aramUpdateClickableV01523.busy{cursor:wait!important;opacity:.85}.aramUpdateToastV01523{position:fixed;right:18px;top:64px;z-index:10000;max-width:360px;padding:10px 13px;border:1px solid #36546f;border-radius:10px;background:#0b1b2aef;color:#ddecf8;font-size:10px;font-weight:800;box-shadow:0 10px 30px #0008;opacity:0;transform:translateY(-5px);pointer-events:none;transition:.18s}.aramUpdateToastV01523.show{opacity:1;transform:none}.aramUpdateToastV01523.ok{border-color:#2f7157;color:#a9e8ca}.aramUpdateToastV01523.err{border-color:#844553;color:#ffb4bd}
`;document.head.appendChild(s)}
  function toast(text,type=''){installStyle();let el=document.getElementById('aramUpdateToastV01523');if(!el){el=document.createElement('div');el.id='aramUpdateToastV01523';el.className='aramUpdateToastV01523';document.body.appendChild(el)}el.textContent=text;el.className=`aramUpdateToastV01523 ${type} show`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3400)}
  function candidate(){
    // v0.15.72: the update surface has an exact stable id in the installed base.
    // Avoid scanning every div/span/button and forcing layout reads on each DOM mutation.
    return document.getElementById('topUpdateBadge')||null;
  }
  function text(el,t){if(el)el.textContent=t}
  async function check(){
    if(busy)return;
    const el=lastBound||candidate();if(!el)return toast('업데이트 상태 버튼을 찾지 못했습니다.','err');
    if(!window.aramDesktop?.checkAndApplyUpdate)return toast('이 버전에서는 앱 내부 업데이트 확인을 사용할 수 없습니다.','err');
    busy=true;el.classList.add('busy');text(el,'⟳ 업데이트 확인 중…');
    try{
      const r=await window.aramDesktop.checkAndApplyUpdate();
      if(r?.status==='current'){text(el,`✓ 최신 버전 · v${r.current||V}`);toast(`최신 버전입니다 · v${r.current||V}`,'ok')}
      else if(r?.status==='applied'){text(el,`✓ v${r.latest} 적용 완료`);toast(`v${r.latest} 패치 적용 완료 · 자동 재시작합니다.`,'ok')}
      else if(r?.status==='launcher-required'){text(el,'! Launcher 업데이트 필요');toast(r.message||'새 Launcher가 필요합니다.','err')}
      else if(r?.status==='busy'){text(el,'⟳ 업데이트 확인 중…')}
      else{const msg=r?.message||'업데이트 확인에 실패했습니다.';text(el,'! 업데이트 확인 실패');toast(msg,'err');setTimeout(()=>{if(!busy)text(el,`업데이트 확인 · v${V}`)},3000)}
    }catch(e){text(el,'! 업데이트 확인 실패');toast(e?.message||String(e),'err')}finally{busy=false;el.classList.remove('busy')}
  }
  function bind(){installStyle();const el=candidate();if(!el)return false;if(el===lastBound&&el.dataset.upd23==='1')return true;lastBound=el;el.dataset.upd23='1';el.classList.add('aramUpdateClickableV01523');el.tabIndex=0;el.setAttribute('role','button');el.title='클릭하면 GitHub 최신 패치를 확인합니다. 최신이면 앱은 종료되지 않습니다.';el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();check()});el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();check()}});return true}
  // v0.15.72: header/update badge is stable; bind directly instead of observing the whole document.
  setTimeout(bind,0);setTimeout(bind,500);
  window.aramInAppUpdaterUIV01523={check,bind,candidate};
  window.__ARAM_IN_APP_UPDATER_UI_V01523__=true;
  if(typeof DATA!=='undefined'){DATA.version=V;DATA.in_app_updater_ui_v01523={version:'v0.15.23 · In-App Update Button',no_update_exit:false,update_found:'apply and auto relaunch',no_update:'stay open and show latest'}}
  if(typeof syncAppVersionUI==='function')syncAppVersionUI();
})();
