'use strict';
(()=>{
  const V='0.15.23';
  const api=window.aramPlayerProfileV01519;
  const drill=window.aramRoleMasteryDrilldownV01522;
  if(!api?.profile||!drill?.aggregate)throw new Error('Player Profile v0.15.19 / drilldown v0.15.22 missing');
  const originalApiProfile=api.profile;
  const openBeforePatch=window.openPlayerProfile;
  const closeBeforePatch=window.closePlayerProfile;
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const avg=a=>a?.length?a.reduce((s,x)=>s+num(x),0)/a.length:0;
  const esc=s=>{try{return aramHistoryEsc(String(s??''))}catch{return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}};
  let selectedRole='';
  let sourceMatches=null;
  let rendering=false;

  function bucket(r){const x=`${r?.group||''} ${r?.role||''}`.toLowerCase();return /원딜|marksman|adc/.test(x)?'원딜':/탱커|tank/.test(x)?'탱커':/서포|support|enchanter/.test(x)?'서포터':/메이지|mage/.test(x)?'메이지':/브루저|fighter|juggernaut/.test(x)?'브루저':/암살|assassin/.test(x)?'암살자':String(r?.group||r?.role||'기타')}
  function roleOfMatch(m){try{return bucket(aramHistoryRoleBreakdown(m))}catch{return ''}}
  function fullMatches(){return Array.isArray(sourceMatches)?sourceMatches:(Array.isArray(aramHistoryState?.matches)?aramHistoryState.matches:[])}
  function roleMatches(role){return fullMatches().filter(m=>roleOfMatch(m)===role)}
  function withMatches(matches,fn){if(!aramHistoryState)return fn();const prev=aramHistoryState.matches;aramHistoryState.matches=matches;try{return fn()}finally{aramHistoryState.matches=prev}}
  api.profile=function(){
    if(!selectedRole)return originalApiProfile();
    const full=fullMatches(),subset=roleMatches(selectedRole),p=withMatches(subset,()=>originalApiProfile());
    if(p){p.total=full.length;p.contextRole=selectedRole;p.contextRoleMatches=subset.length}
    return p;
  };

  function installStyle(){if(document.getElementById('pp23style'))return;const s=document.createElement('style');s.id='pp23style';s.textContent=`
.pp23scope{display:inline-flex;align-items:center;gap:5px;margin-left:7px;padding:4px 7px;border:1px solid #39749d;border-radius:99px;background:#0d2b42;color:#9fdcff;font-size:7px;font-weight:950;vertical-align:middle}.pp23scope button{border:0!important;background:transparent!important;color:#9fdcff!important;margin:0!important;padding:0 0 0 4px!important;font-size:8px!important;cursor:pointer}.pp23scopeNote{margin-top:5px;color:#6f8fa6;font-size:7px}.pp23roleIndex{color:#9fdcff!important}.pp23roleCoach .pp23coachTitle{display:flex;justify-content:space-between;gap:8px;align-items:center}.pp23roleCoach .pp23coachTitle b{font-size:12px}.pp23roleCoach .pp23coachTitle span{font-size:7px;color:#75a8c8}.pp23coachMain{margin-top:13px;font-size:14px;color:#d7ebfa}.pp23coachSub{margin-top:7px;color:#7f9ab0;font-size:8px;line-height:1.55}.pp23coachNums{display:flex;gap:6px;margin-top:9px;flex-wrap:wrap}.pp23coachNums span{padding:5px 7px;border:1px solid #2f5860;border-radius:7px;color:#a8dccf;font-size:7px;background:#0b2225}.pp23activeRole{box-shadow:inset 0 0 0 1px #4cb1e8!important;border-color:#67bff0!important;background:#0d2940!important}
`;document.head.appendChild(s)}
  const ROLE_METRICS={
    '탱커':[['absorb','피해 흡수'],['frontline','전열'],['engage','이니시'],['cc','CC'],['survival','생존']],
    '메이지':[['damage','딜 생산'],['poke','포킹'],['control','제어'],['cc','CC'],['survival','생존']],
    '원딜':[['damage','딜 생산'],['carry','지속딜'],['survival','생존'],['eff','자원 효율'],['kp','교전 참여']],
    '서포터':[['peel','보호'],['allySustain','아군 유지력'],['utility','유틸'],['cc','CC'],['survival','생존']],
    '브루저':[['damage','딜 생산'],['dive','진입'],['frontline','전열'],['sustainFight','지속전'],['survival','생존']],
    '암살자':[['burst','순간폭딜'],['dive','후방 접근'],['pick','캐치'],['damage','딜 생산'],['survival','생존']]
  };
  function roleRows(role){try{return drill.rows().filter(x=>x.role===role)}catch{return[]}}
  function roleCoach(role){
    const rs=roleRows(role),metrics=ROLE_METRICS[role]||[['damage','딜 생산'],['kp','교전 참여'],['survival','생존'],['cc','CC'],['eff','자원 효율']];
    if(!rs.length)return '<div class="ppempty">역할 전적이 더 쌓이면 목표를 계산합니다.</div>';
    const ranked=metrics.map(([k,l])=>({k,l,v:avg(rs.slice(0,10).map(x=>num(x[k])))}).filter(x=>Number.isFinite(x.v))).sort((a,b)=>a.v-b.v),w=ranked[0]||{l:'역할 수행',v:70};
    const target=Math.min(96,Math.round(w.v+5)),roleAvg=avg(rs.slice(0,10).map(x=>num(x.score)));
    return `<div class="pp23roleCoach"><div class="pp23coachTitle"><b>NEXT OBJECTIVE · ${esc(role)} / ${esc(w.l)}</b><span>역할 전용 목표</span></div><div class="pp23coachNums"><span>현재 ${Math.round(w.v)}</span><span>목표 ${target}</span><span>ROLE 평균 ${Math.round(roleAvg)}</span></div><div class="pp23coachMain">${esc(w.l)} 지표를 올리면서 현재 ROLE 수행 수준 유지하기</div><div class="pp23coachSub">${esc(role)} 전적만 기준으로 가장 낮은 핵심 지표를 골랐습니다. 새 ${esc(role)} 경기가 추가되면 목표도 다시 계산됩니다.</div></div>`;
  }
  function rolesHtml(fullProfile){
    return (fullProfile?.roles||[]).map(x=>`<div class="pprole pp22click ${selectedRole===x.role?'active pp23activeRole':''}" data-pp22="1" data-pp23-role="${esc(x.role)}" tabindex="0" role="button" aria-expanded="${selectedRole===x.role?'true':'false'}"><div><b>${esc(x.role)}</b><b>${esc(x.grade)}</b></div><strong>${Math.round(x.score)}</strong><small>${x.n}경기${x.tmp?' · 임시평가':''}</small><div class="ppbar"><i style="width:${Math.round(x.score)}%"></i></div></div>`).join('')||'<div class="ppempty">표본 없음</div>'
  }
  function syncDrill(){
    const d=window.aramRoleMasteryDrilldownV01522;if(!d)return;
    try{
      const cur=d.selectedRole||'';
      if(!selectedRole){if(cur)d.select(cur);else d.bind?.();return}
      if(cur&&cur!==selectedRole)d.select(cur);
      if((d.selectedRole||'')!==selectedRole)d.select(selectedRole);else d.bind?.();
    }catch{}
  }
  function postProcess(){
    installStyle();const root=document.getElementById('pp19c');if(!root)return false;
    const full=originalApiProfile();
    const roles=root.querySelector('.pproles');if(roles){roles.innerHTML=rolesHtml(full);roles.querySelectorAll('[data-pp23-role]').forEach(el=>{const role=el.getAttribute('data-pp23-role')||'';el.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();selectRole(role)});el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopImmediatePropagation();selectRole(role)}})})}
    const head=root.querySelector('.pphead h2');if(head)head.textContent=selectedRole?`PLAYER PROFILE · ${selectedRole} SCOUT REPORT`:'PLAYER PROFILE · SCOUT REPORT';
    const headSmall=root.querySelector('.pphead small');if(headSmall&&selectedRole&&!headSmall.querySelector('.pp23scope')){const span=document.createElement('span');span.className='pp23scope';span.innerHTML=`역할 필터 · ${esc(selectedRole)} <button type="button" title="전체 프로필로 돌아가기">×</button>`;span.querySelector('button').addEventListener('click',e=>{e.preventDefault();e.stopPropagation();selectRole(selectedRole)});headSmall.appendChild(span)}
    const idx=root.querySelector('.ppidx');if(idx&&selectedRole){const sm=idx.querySelector(':scope > small');if(sm)sm.textContent=`${selectedRole} PLAYER INDEX`;sm?.classList.add('pp23roleIndex');const p=api.profile();const allN=fullMatches().length,roleN=p?.n||0;const notes=[...idx.querySelectorAll(':scope > small')];const last=notes[notes.length-1];if(last&&last!==sm)last.textContent=`${selectedRole} 분석 ${roleN}/${allN}경기 · 신뢰도 ${roleN>=12?'높음':roleN>=6?'보통':roleN>=3?'낮음':'표본 부족'} · ${p?.wins||0}승 ${Math.max(0,roleN-(p?.wins||0))}패`}
    if(selectedRole){const grids=root.querySelectorAll('.ppgrid');const lastGrid=grids[grids.length-1],coachBox=lastGrid?.querySelectorAll('.ppbox')?.[1];if(coachBox)coachBox.innerHTML=roleCoach(selectedRole)}
    syncDrill();
    return true;
  }
  function renderContext(){
    if(rendering)return;rendering=true;
    const all=Array.isArray(aramHistoryState?.matches)?aramHistoryState.matches:[];sourceMatches=all;
    const subset=selectedRole?all.filter(m=>roleOfMatch(m)===selectedRole):all;
    try{withMatches(subset,()=>openBeforePatch?.())}finally{if(!selectedRole)sourceMatches=null;rendering=false}
    setTimeout(()=>{try{postProcess()}catch(e){console.error('[v0.15.23] role context postprocess failed',e)}},30);
    setTimeout(()=>{try{postProcess()}catch{}},130);
  }
  function selectRole(role){selectedRole=selectedRole===role?'':role;renderContext()}
  window.openPlayerProfile=function(...a){if(!selectedRole){sourceMatches=null;const r=openBeforePatch?.apply(this,a);setTimeout(postProcess,35);return r}renderContext()};
  window.closePlayerProfile=function(...a){selectedRole='';sourceMatches=null;try{const d=window.aramRoleMasteryDrilldownV01522;if(d?.selectedRole)d.select(d.selectedRole)}catch{}return closeBeforePatch?.apply(this,a)};
  try{const prevRender=renderAramHistoryFeedback;renderAramHistoryFeedback=function(...a){const r=prevRender.apply(this,a);if(selectedRole&&document.getElementById('pp19ov')?.classList?.contains('open'))setTimeout(renderContext,0);else if(document.getElementById('pp19ov')?.classList?.contains('open'))setTimeout(postProcess,20);return r}}catch{}
  installStyle();
  window.aramRoleProfileContextV01523={selectRole,renderContext,postProcess,get selectedRole(){return selectedRole},roleMatches};
  window.__ARAM_ROLE_PROFILE_CONTEXT_V01523__=true;
  if(typeof DATA!=='undefined'){DATA.version=V;DATA.role_profile_context_v01523={version:'v0.15.23 · Full Role Profile Context',scope:'ROLE MASTERY click recalculates whole player profile',sections:['PLAYER INDEX','PLAY STYLE RADAR','6 axes','SCOUT REPORT','DEVELOPMENT','NEXT OBJECTIVE'],toggle_back_to_all:true}}
  if(typeof syncAppVersionUI==='function')syncAppVersionUI();
})();
