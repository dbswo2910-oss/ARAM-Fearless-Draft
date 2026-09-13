'use strict';
(()=>{
  const V='0.15.123';
  const MARK='ARAM_PATCH_NOTES_STARTUP_NOTICE_V015123';
  const STORAGE_KEY='aram.patchNotes.notice.dismissedVersion.v1';
  const FALLBACK_PATCH='26.18';
  if(window.__ARAM_PATCH_NOTES_STARTUP_NOTICE_V015123__===true)return;
  window.__ARAM_PATCH_NOTES_STARTUP_NOTICE_V015123__=true;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const text=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const safeGet=k=>{try{return localStorage.getItem(k)||''}catch{return ''}};
  const safeSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}};

  function patchVersion(){
    const api=String(window.aramDataHubV01599?.patch?.version||'').trim();
    if(api)return api;
    const badge=text($('#dataHubTopNavV015115 [data-v115-tab="patch"] .badge'))||text($('#dataHubNavV01599 [data-dh99-tab="patch"] .dh99New'));
    return badge||FALLBACK_PATCH;
  }
  function dismissed(ver=patchVersion()){return safeGet(STORAGE_KEY)===String(ver||'').trim()}
  function dismiss(ver=patchVersion()){return safeSet(STORAGE_KEY,String(ver||'').trim())}

  function ensureStyle(){
    if($('#aramPatchNotesNoticeStyleV015123'))return;
    const st=document.createElement('style');
    st.id='aramPatchNotesNoticeStyleV015123';
    st.textContent=`
      #aramPatchNotesNoticeV015123{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:22px;background:rgba(2,9,16,.74);backdrop-filter:blur(7px)}
      #aramPatchNotesNoticeV015123 .apn123Card{position:relative;width:min(520px,calc(100vw - 34px));overflow:hidden;border:1px solid #2d6387;border-radius:18px;background:radial-gradient(circle at 84% 10%,rgba(88,193,255,.2),transparent 28%),linear-gradient(160deg,#0c2840,#071723 72%);box-shadow:0 28px 80px rgba(0,0,0,.5);color:#eef9ff;font-family:inherit}
      #aramPatchNotesNoticeV015123 .apn123Glow{height:4px;background:linear-gradient(90deg,#53c7ff,#8be3ff,#53c7ff)}
      #aramPatchNotesNoticeV015123 .apn123Body{padding:26px 27px 18px}
      #aramPatchNotesNoticeV015123 .apn123Eyebrow{font-size:10px;font-weight:900;letter-spacing:1.5px;color:#66caff;text-transform:uppercase}
      #aramPatchNotesNoticeV015123 h2{margin:8px 0 8px;font-size:25px;letter-spacing:-.5px}
      #aramPatchNotesNoticeV015123 p{margin:0;color:#9ebed1;font-size:13px;line-height:1.65}
      #aramPatchNotesNoticeV015123 .apn123Version{display:flex;align-items:center;gap:9px;margin:18px 0 0;padding:12px 14px;border:1px solid #244f6d;border-radius:11px;background:rgba(5,20,32,.62)}
      #aramPatchNotesNoticeV015123 .apn123Version strong{font-size:18px;color:#fff}#aramPatchNotesNoticeV015123 .apn123Version span{padding:3px 7px;border-radius:6px;background:#8a6418;color:#ffe69a;font-size:9px;font-weight:900}
      #aramPatchNotesNoticeV015123 .apn123Actions{display:flex;gap:9px;padding:0 27px 26px}
      #aramPatchNotesNoticeV015123 button{appearance:none;border:0;font-family:inherit;cursor:pointer}
      #aramPatchNotesNoticeV015123 .apn123Primary{flex:1;border-radius:10px;padding:11px 14px;background:linear-gradient(180deg,#2e9ed6,#1977ab);color:#fff;font-size:12px;font-weight:900;box-shadow:0 8px 20px rgba(32,151,211,.2)}
      #aramPatchNotesNoticeV015123 .apn123Dismiss{border:1px solid #31546b;border-radius:10px;padding:11px 13px;background:#081b29;color:#9eb5c4;font-size:11px;font-weight:800}
      #aramPatchNotesNoticeV015123 .apn123Close{position:absolute;right:13px;top:13px;width:32px;height:32px;border-radius:9px;background:rgba(5,18,28,.72);color:#9bb8ca;font-size:18px}
      #aramPatchNotesNoticeV015123 .apn123Close:hover,#aramPatchNotesNoticeV015123 .apn123Dismiss:hover{color:#fff;border-color:#4e82a4}
      @media(max-width:560px){#aramPatchNotesNoticeV015123 .apn123Actions{flex-direction:column}#aramPatchNotesNoticeV015123 .apn123Body{padding:23px 22px 17px}#aramPatchNotesNoticeV015123 .apn123Actions{padding:0 22px 23px}}
    `;
    (document.head||document.documentElement)?.appendChild(st);
  }

  function close(){
    const modal=$('#aramPatchNotesNoticeV015123');
    if(modal)modal.remove();
  }

  function dataNavCandidate(){
    const exact=$('[data-view="data"],[data-tab="data"],[data-page="data"],[data-section="data"],[aria-controls="data"],#nav-data,#tab-data,#dataTab');
    if(exact&&!exact.closest('#data'))return exact;
    const candidates=$$('button,a,[role="tab"],[role="button"]');
    return candidates.find(el=>!el.closest('#data')&&/^데이터(?:\s|$)/.test(text(el)))||candidates.find(el=>!el.closest('#data')&&text(el)==='데이터')||null;
  }

  function openPatchNotes(){
    const nav=dataNavCandidate();
    try{nav?.click?.()}catch{}
    let frames=0;
    const settle=()=>{
      frames++;
      try{window.__aramDataHubMountV01599?.()}catch{}
      try{window.aramUiStabilityV015115?.syncData?.('patch')}catch{}
      const patchBtn=$('#dataHubTopNavV015115 [data-v115-tab="patch"],#dataHubNavV01599 [data-dh99-tab="patch"]');
      try{if(patchBtn&&!patchBtn.classList.contains('active'))patchBtn.click()}catch{}
      try{window.aramUiStabilityV015115?.syncData?.('patch')}catch{}
      const data=$('#data'),card=$('#dataCard');
      const opened=data?.dataset?.data115Mode==='patch'||card?.classList?.contains('dataHubPatchModeV01599');
      if(opened){
        try{$('#dataPatchNotesV01599')?.scrollIntoView?.({block:'start'})}catch{}
        document.documentElement?.setAttribute('data-aram-patch-notice-route','patch-opened');
        return;
      }
      if(frames<12)requestAnimationFrame(settle);
      else document.documentElement?.setAttribute('data-aram-patch-notice-route','patch-route-unresolved');
    };
    requestAnimationFrame(settle);
  }

  function show(){
    const ver=patchVersion();
    if(!ver||dismissed(ver)){
      document.documentElement?.setAttribute('data-aram-patch-notice',dismissed(ver)?`dismissed:${ver}`:'no-version');
      return false;
    }
    if($('#aramPatchNotesNoticeV015123'))return true;
    ensureStyle();
    const modal=document.createElement('div');
    modal.id='aramPatchNotesNoticeV015123';
    modal.dataset.patchVersion=ver;
    modal.dataset.owner=MARK;
    modal.innerHTML=`<section class="apn123Card" role="dialog" aria-modal="true" aria-labelledby="apn123Title"><div class="apn123Glow"></div><button type="button" class="apn123Close" aria-label="닫기">×</button><div class="apn123Body"><div class="apn123Eyebrow">HOWLING ABYSS · PATCH NOTES</div><h2 id="apn123Title">새 패치노트가 등록됐어요</h2><p>이번 일반 칼바람 변경사항을 확인할 수 있어요. 챔피언·아이템 변경과 핵심 영향을 DATA의 패치노트에서 바로 확인하세요.</p><div class="apn123Version"><strong>${ver}</strong><span>NEW</span></div></div><div class="apn123Actions"><button type="button" class="apn123Primary">패치노트 보러가기</button><button type="button" class="apn123Dismiss">다시 보지 않기</button></div></section>`;
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{
      if(e.target===modal||e.target.closest('.apn123Close')){close();return}
      if(e.target.closest('.apn123Dismiss')){dismiss(ver);close();document.documentElement?.setAttribute('data-aram-patch-notice',`dismissed:${ver}`);return}
      if(e.target.closest('.apn123Primary')){close();openPatchNotes()}
    });
    modal.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    $('.apn123Primary',modal)?.focus?.();
    document.documentElement?.setAttribute('data-aram-patch-notice',`shown:${ver}`);
    return true;
  }

  function boot(){
    requestAnimationFrame(()=>{
      try{window.__aramDataHubMountV01599?.()}catch{}
      show();
    });
  }

  window.aramPatchNotesStartupNoticeV015123={version:V,storageKey:STORAGE_KEY,patchVersion,dismissed,dismiss,show,close,openPatchNotes,score_logic_changed:false,random_scoring_changed:false};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
