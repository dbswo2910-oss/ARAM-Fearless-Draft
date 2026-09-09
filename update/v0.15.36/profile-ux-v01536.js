'use strict';
(()=>{
  const V='0.15.36';
  const ctx=window.aramRoleProfileContextV01523;
  const spec=window.aramRoleProfileSpecializedV01530;
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const r1=v=>Math.round(num(v)*10)/10;

  const WEAK_GUIDE={
    '탱커':{absorb:'진입 뒤 피해를 받아내는 효율',frontline:'아군 앞에서 전선을 유지하는 안정성',engage:'교전 시작 기여',cc:'CC 영향력',peel:'아군 보호·역이니시 기여',endurance:'진입 후 생존·지속전'},
    '원딜':{damage:'직접 딜 생산',carry:'지속딜 유지',eff:'자원 대비 화력 환산',survival:'딜 손실을 줄이는 생존',kp:'팀 교전 관여',carryExec:'캐리 수행 완성도'},
    '메이지':{damage:'직접 딜 생산',poke:'본교전 전 체력 압박',control:'공간·제어 기여',cc:'CC 영향력',survival:'딜 기회를 유지하는 생존',eff:'자원 대비 화력 효율'},
    '서포터':{peel:'아군 보호·필링',allySustain:'아군 유지력',utility:'팀 유틸리티 기여',cc:'CC 영향력',kp:'교전 관여',survival:'기능을 계속 제공할 수 있는 생존'},
    '브루저':{damage:'직접 딜 생산',dive:'진입 압박',frontline:'전열 기여',sustainFight:'긴 교전 지속력',survival:'진입 후 생존',kp:'팀 교전 관여'},
    '암살자':{burst:'순간 폭딜',dive:'후방 접근',pick:'캐치 기여',killConv:'킬 전환',survival:'진입 후 이탈·생존',reset:'리셋·마무리'}
  };

  function scoutText(d){
    const hi=d?.strong?.[0],hi2=d?.strong?.[1],lo=d?.weak?.[0];
    if(!d?.role||!d?.n||!hi||!hi2||!lo)return'';
    const guide=WEAK_GUIDE[d.role]?.[lo.k]||`${lo.l} 개선`;
    const hasTrend=d.roleTrend!==null&&d.roleTrend!==undefined&&Number.isFinite(Number(d.roleTrend)),trend=hasTrend?Number(d.roleTrend):0;
    const trendText=hasTrend
      ? trend>=4?`최근 ${d.role} ROLE은 이전 구간보다 ${r1(trend)}점 상승했습니다.`
        :trend<=-4?`최근 ${d.role} ROLE은 이전 구간보다 ${Math.abs(r1(trend))}점 낮아졌습니다.`
        :'최근 ROLE 흐름은 이전 구간과 큰 차이가 없습니다.'
      :'아직 이전 구간과 비교할 표본이 충분하지 않습니다.';
    const sampleText=d.n>=12
      ?'표본이 충분해 현재 역할 프로필의 신뢰도가 높은 편입니다.'
      :d.n>=6
        ?'표본은 보통 수준이라 방향성 판단에는 쓸 수 있지만 세부 수치는 더 쌓일수록 안정됩니다.'
        :d.n>=3
          ?`표본이 ${d.n}경기로 적어 현재 유형과 수치는 잠정 평가입니다.`
          :`표본이 ${d.n}경기뿐이라 현재 평가는 참고용입니다.`;
    return `${d.role} ${d.n}경기 기준, ${hi.l} ${Math.round(hi.v)}와 ${hi2.l} ${Math.round(hi2.v)}가 현재 가장 강한 축입니다. 반대로 ${lo.l} ${Math.round(lo.v)}으로 가장 낮아 다음 개선 우선순위는 ${guide}입니다. ${trendText} ${sampleText}`;
  }

  let queued=false;
  function applyScout(){
    queued=false;
    try{
      const role=ctx?.selectedRole,root=document.getElementById('pp19c');
      if(!role||!root||!document.getElementById('pp19ov')?.classList?.contains('open')||!spec?.roleData)return false;
      const d=spec.roleData(role),text=scoutText(d),el=root.querySelector('.ppscout');
      if(!text||!el)return false;
      if(el.textContent!==text)el.textContent=text;
      return true;
    }catch(e){console.warn('[v0.15.36] role scout report apply failed',e);return false}
  }
  function schedule(){if(queued)return;queued=true;setTimeout(applyScout,55);setTimeout(applyScout,170)}

  function closeMetricOnEsc(e){
    if(e.key!=='Escape')return;
    const ov=document.getElementById('rmDetailOverlay');
    if(!ov?.classList?.contains('open'))return;
    e.preventDefault();e.stopPropagation();
    try{window.closeRoleMetricDetail?.()}catch{ov.classList.remove('open')}
  }

  try{
    document.addEventListener('keydown',closeMetricOnEsc,true);
    const mo=new MutationObserver(()=>{if(ctx?.selectedRole&&document.getElementById('pp19ov')?.classList?.contains('open'))schedule()});
    mo.observe(document.documentElement,{subtree:true,childList:true});
    const oldOpen=window.openPlayerProfile;
    window.openPlayerProfile=function(...a){const r=oldOpen?.apply(this,a);schedule();return r};
    window.aramProfileUxV01536={scoutText,applyScout,schedule};
    window.__ARAM_PROFILE_UX_V01536__=true;
    if(typeof DATA!=='undefined'){
      DATA.version=V;
      DATA.profile_ux_v01536={version:'v0.15.36 · Role Scout Report + Metric Modal ESC',role_scout_uses_role_axes:true,esc_closes_role_metric_modal:true};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    schedule();
  }catch(e){console.error('[v0.15.36] profile UX patch failed',e);window.__ARAM_PROFILE_UX_V01536__=false}
})();
