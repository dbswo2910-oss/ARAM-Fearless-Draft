'use strict';
(()=>{
  const V='0.15.37';
  const ctx=window.aramRoleProfileContextV01523;
  const spec=window.aramRoleProfileSpecializedV01530;
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;

  const WEAK_RISK={
    '탱커':{
      absorb:'진입 이후 너무 빨리 체력이 빠지면 아군 딜러가 편하게 딜할 시간이 짧아집니다. 진입 타이밍과 첫 포커싱을 버티는 구간을 함께 점검하는 게 좋습니다.',
      frontline:'한 번 들어간 뒤 전선이 쉽게 끊기면 팀이 앞뒤로 갈라질 수 있습니다. 진입 후 아군과의 거리와 재정렬 타이밍을 확인해볼 만합니다.',
      engage:'앞라인 역할은 잘해도 교전 시작점이 늦으면 팀이 상대 포킹을 오래 맞을 수 있습니다. 먼저 열어야 할 싸움과 받아쳐야 할 싸움을 구분하는 연습이 좋습니다.',
      cc:'몸을 넣는 것에 비해 핵심 대상을 오래 묶지 못하면 진입 가치가 줄어듭니다. CC를 가장 위협적인 딜러나 진입자에게 연결하는지가 핵심입니다.',
      peel:'진입에 집중하다 아군 딜러 보호가 비면 역으로 후방이 무너질 수 있습니다. 들어가기 전에 상대 진입 카드가 남아 있는지 확인하는 습관이 도움이 됩니다.',
      endurance:'첫 진입은 좋아도 너무 빨리 전투에서 이탈하면 후속 교전에서 존재감이 줄어듭니다. 첫 스킬 이후 생존 경로와 두 번째 스킬 사이클을 의식하는 게 좋습니다.'
    },
    '원딜':{
      damage:'안전하게 살아남아도 실제 체력바를 줄이는 시간이 부족하면 캐리력이 제한됩니다. 사거리 안에서 쉬지 않고 때릴 수 있는 위치를 더 자주 만드는 게 중요합니다.',
      carry:'한 번의 폭딜보다 긴 한타에서 딜이 끊기는 구간이 있는지 봐야 합니다. 타겟 변경과 평타 공백을 줄이는 쪽이 개선 포인트입니다.',
      eff:'자원을 많이 먹은 경기에서 그만큼 화력으로 돌려주는지가 약한 편입니다. 과도한 안전거리나 비효율적인 아이템 타이밍이 있었는지 확인해볼 만합니다.',
      survival:'딜각을 보다가 너무 일찍 끊기면 팀 화력이 급격히 떨어집니다. 상대 핵심 진입기와 즉발 CC를 먼저 세고 포지션을 잡는 습관이 좋습니다.',
      kp:'개인 딜은 나와도 중요한 교전에 늦게 합류하면 팀 승리로 연결되기 어렵습니다. 한타가 열릴 위치와 타이밍을 조금 더 일찍 읽는 게 좋습니다.',
      carryExec:'기본 화력은 있어도 실제 한타 승리로 마무리되는 과정이 덜 선명합니다. 생존·타겟 선택·딜 지속을 한 세트로 묶어 보는 게 좋습니다.'
    },
    '메이지':{
      damage:'구도는 잘 만들지만 직접 화력으로 마무리하는 비중이 낮을 수 있습니다. CC 이후 본인 딜이 실제로 얼마나 이어졌는지 확인해볼 만합니다.',
      poke:'본교전 전 상대 체력을 미리 깎아두는 압박이 약하면 한타가 늘 정면 5대5로 시작됩니다. 안전한 사거리에서 먼저 스킬을 교환하는 빈도를 높이는 게 좋습니다.',
      control:'스킬은 맞히더라도 상대가 설 자리를 제한하는 효과가 약하면 팀이 편하게 전진하기 어렵습니다. 좁은 길목과 부쉬 주변에서 스킬을 어디에 깔지 더 의식해볼 만합니다.',
      cc:'딜은 나와도 핵심 순간에 상대 행동을 끊지 못하면 메이지의 한타 영향력이 줄어듭니다. CC를 단순 적중보다 진입 차단이나 킬 연결에 쓰는지가 중요합니다.',
      survival:'좋은 스킬을 한 번 쓰고 바로 끊기면 다음 사이클이 사라집니다. 상대 돌진기와 사거리 끝을 기준으로 한 발 뒤 위치를 잡는 연습이 좋습니다.',
      eff:'자원을 실제 화력으로 바꾸는 효율은 보완 여지가 있습니다. 스킬 적중 이후 딜 전환과 불필요한 자원 점유가 있었는지 함께 점검하는 게 좋습니다.'
    },
    '서포터':{
      peel:'아군을 강화해도 상대 진입을 끊지 못하면 딜러가 기능을 쓰기 어렵습니다. 핵심 보호 스킬을 먼저 쓰지 않고 상대 진입 타이밍까지 남겨두는 판단이 중요합니다.',
      allySustain:'교전은 잘 열어도 팀 체력을 다시 복구시키는 힘이 부족하면 다음 싸움 준비가 늦어집니다. 회복·보호막을 누구에게 언제 몰아줄지 점검해볼 만합니다.',
      utility:'개별 스킬 사용은 괜찮아도 팀 전체를 편하게 만드는 기능 연결이 약할 수 있습니다. 이속·버프·세이브 스킬을 교전 전후 어느 구간에 쓰는지 보는 게 좋습니다.',
      cc:'보호만 하다가 상대 핵심 행동을 끊을 기회를 놓칠 수 있습니다. 아군 보호와 동시에 적 딜러의 딜 시작을 방해하는 타이밍을 찾는 게 좋습니다.',
      kp:'좋은 기능을 가지고도 주요 교전에 빠지면 영향력이 크게 줄어듭니다. 팀이 싸우려는 순간 한 화면 안에 함께 있는 비율을 높이는 게 중요합니다.',
      survival:'서포터가 먼저 끊기면 이후 보호·버프·CC가 모두 사라집니다. 시야를 확인하려고 몸을 내밀 때 상대 즉발 이니시 범위를 더 보수적으로 보는 게 좋습니다.'
    },
    '브루저':{
      damage:'몸을 넣는 것에 비해 상대 체력바를 실제로 압박하는 비중이 약할 수 있습니다. 진입 후 누구를 오래 때릴지와 스킬 사이 평타 공백을 줄이는 게 좋습니다.',
      dive:'전열 싸움은 하지만 상대 후방을 흔드는 압박이 적으면 브루저의 존재감이 제한됩니다. 무조건 깊게 들어가기보다 딜러가 앞으로 못 나오게 만드는 각을 찾는 게 좋습니다.',
      frontline:'딜을 하러 들어가면서 전선이 쉽게 무너지면 아군이 따라오기 어렵습니다. 진입 깊이와 아군 사거리 사이 거리를 계속 확인하는 게 중요합니다.',
      sustainFight:'첫 교환 이후 힘이 급격히 빠지면 긴 한타에서 가치가 떨어집니다. 두 번째 스킬 사이클까지 버틸 수 있는 체력 관리와 타겟 선택을 점검해볼 만합니다.',
      survival:'진입 자체는 좋아도 돌아오지 못하면 다음 교전 연결이 끊깁니다. 들어갈 때부터 빠져나올 경로와 상대 핵심 CC 잔여 여부를 함께 보는 게 좋습니다.',
      kp:'개인 교전은 잘해도 팀 한타와 따로 놀면 영향력이 분산됩니다. 아군 이니시와 본인 진입 타이밍을 맞추는 쪽이 우선입니다.'
    },
    '암살자':{
      burst:'좋은 진입각을 잡아도 첫 대상 체력을 충분히 깎지 못하면 이후 생존이 급격히 어려워집니다. 들어가기 전 스킬·아이템 준비 상태와 대상 체력을 더 엄격히 보는 게 좋습니다.',
      dive:'킬각은 보이지만 후방 접근 자체가 어려우면 전열에 시간을 많이 쓰게 됩니다. 시야 밖 진입각과 상대 이동기 사용 이후 타이밍을 노리는 게 좋습니다.',
      pick:'한타 화력만으로 승부하면 암살자의 장점이 줄어듭니다. 상대가 혼자 앞으로 나오는 순간을 먼저 잡아 숫자 우위를 만드는 쪽을 의식해볼 만합니다.',
      killConv:'들어간 뒤 상대가 살아남으면 리스크만 남습니다. 첫 대상 선정과 점사 완결성을 더 보수적으로 잡는 게 좋습니다.',
      survival:'킬을 만들더라도 매번 함께 죽으면 다음 교전 영향력이 줄어듭니다. 진입 전에 이탈 경로와 상대 즉발 CC를 하나 이상 확인하는 습관이 좋습니다.',
      reset:'첫 처치 이후 바로 빠져버리면 연쇄 마무리 잠재력이 줄어듭니다. 핵심 스킬이 다시 돌 때까지 한 발 물러났다 재진입하는 타이밍을 보는 게 좋습니다.'
    }
  };

  function strengthText(d){
    const keys=new Set((d?.strong||[]).slice(0,2).map(x=>x.k));
    const has=(...xs)=>xs.every(x=>keys.has(x));
    if(d.role==='탱커'){
      if(has('engage','cc'))return'교전을 먼저 열고 핵심 대상을 묶어 팀이 따라오기 쉬운 시작점을 만드는 플레이가 가장 선명합니다.';
      if(has('absorb','frontline'))return'상대 화력을 받아내면서 전선을 오래 유지해 뒤의 딜러가 편하게 싸울 공간을 만드는 쪽에 강점이 있습니다.';
      if(keys.has('peel'))return'무조건 깊게 들어가기보다 상대 진입을 받아치고 아군 딜러를 살려주는 판단이 강점으로 나타납니다.';
      return'앞라인에서 교전의 방향을 정하고 팀이 싸울 수 있는 공간을 만드는 역할 수행이 비교적 선명합니다.';
    }
    if(d.role==='원딜'){
      if(has('damage','carry'))return'짧은 한 번의 폭딜보다 한타가 길어질수록 계속 화력을 누적하는 캐리 방식이 강점으로 나타납니다.';
      if(keys.has('survival'))return'위험한 각을 억지로 밟기보다 살아남아 딜 시간을 늘리는 쪽으로 캐리하는 성향이 보입니다.';
      if(keys.has('eff'))return'먹은 자원을 실제 화력으로 바꾸는 비율이 좋아, 성장한 경기에서 결과를 만들어내는 힘이 있습니다.';
      return'한타에서 직접적인 화력을 담당하고, 교전이 길어질수록 꾸준히 기여하는 쪽에 강점이 있습니다.';
    }
    if(d.role==='메이지'){
      if(has('cc','control'))return'직접 폭딜로 끝내기보다 CC와 공간 제어로 상대가 설 자리를 좁히고, 아군이 딜하기 좋은 한타 구도를 만드는 플레이가 가장 선명합니다.';
      if(keys.has('poke'))return'본교전이 열리기 전에 사거리와 스킬 압박으로 체력 우위를 만들어 상대의 진입 선택지를 줄이는 데 강점이 있습니다.';
      if(keys.has('damage'))return'구도 설계보다 직접적인 스킬 화력으로 상대 체력바를 빠르게 줄이는 역할이 더 선명합니다.';
      return'사거리와 스킬을 이용해 상대의 움직임을 제한하고 아군이 싸우기 좋은 판을 만드는 쪽에 강점이 있습니다.';
    }
    if(d.role==='서포터'){
      if(keys.has('peel')||keys.has('allySustain'))return'본인이 직접 마무리하기보다 아군 핵심 딜러가 오래 기능하도록 보호하고 전투 시간을 늘려주는 역할이 강점입니다.';
      if(has('cc','kp'))return'팀이 싸우려는 순간 빠르게 합류해 CC로 교전의 흐름을 정리하는 조율형 플레이가 선명합니다.';
      if(keys.has('utility'))return'개인 스탯보다 버프·이동·세이브 같은 기능으로 팀 전체의 전투력을 끌어올리는 쪽에 강점이 있습니다.';
      return'아군이 편하게 싸울 수 있도록 보호와 교전 보조를 이어가는 역할 수행이 비교적 안정적입니다.';
    }
    if(d.role==='브루저'){
      if(has('dive','frontline'))return'몸을 넣어 전선을 밀어내면서 동시에 상대 후방이 편하게 딜하지 못하게 만드는 압박이 강점입니다.';
      if(keys.has('sustainFight'))return'첫 진입 한 번보다 긴 교전에서 계속 버티고 두 번째 스킬 사이클까지 이어가는 힘이 강점으로 나타납니다.';
      if(keys.has('damage'))return'앞라인 역할을 하면서도 직접 화력을 잃지 않는 딜탱형 플레이가 비교적 선명합니다.';
      return'전열과 후방 사이를 흔들며 팀 한타에 지속적으로 압박을 주는 역할 수행이 강점입니다.';
    }
    if(d.role==='암살자'){
      if(has('burst','killConv'))return'짧은 진입 타이밍에 한 대상을 빠르게 정리해 숫자 우위를 만드는 처형형 플레이가 가장 선명합니다.';
      if(keys.has('pick'))return'정면 5대5보다 상대가 혼자 앞으로 나온 순간을 잡아내 전투를 유리하게 시작하는 데 강점이 있습니다.';
      if(keys.has('reset'))return'첫 처치 이후 다시 각을 보며 연쇄적으로 마무리하는 교전 전개가 강점으로 나타납니다.';
      return'정면에서 오래 싸우기보다 빈틈을 찾아 후방에 압박을 주고 빠르게 전투 결과를 만드는 쪽에 강점이 있습니다.';
    }
    return'현재 역할에서 요구되는 핵심 행동을 비교적 안정적으로 수행하는 편입니다.';
  }

  function scoutText(d){
    const lo=d?.weak?.[0];
    if(!d?.role||!d?.n||!lo)return'';
    const type=spec?.roleTypes?.(d)?.[0];
    const lead=type?.desc?`현재 표본에서는 ${type.desc}에 가깝습니다.`:'';
    const strength=strengthText(d);
    const risk=WEAK_RISK[d.role]?.[lo.k]||`${lo.l}은 현재 가장 먼저 점검할 보완 포인트입니다.`;
    let trend='';
    if(d.roleTrend!==null&&d.roleTrend!==undefined&&Number.isFinite(Number(d.roleTrend))){
      const t=num(d.roleTrend);
      trend=t>=4?'최근 경기에서는 역할 수행 흐름이 좋아지는 방향입니다.':t<=-4?'최근 경기에서는 이전보다 역할 수행이 흔들리는 구간이 보여 원인을 한 번 복기할 필요가 있습니다.':'최근 경기 흐름은 이전 구간과 크게 달라지지 않았습니다.';
    }
    const sample=d.n>=12?'표본이 충분해 현재 플레이 성향을 비교적 안정적으로 볼 수 있습니다.':d.n>=6?'표본은 방향성을 보기엔 충분하지만 세부 성향은 경기 수가 더 쌓이면 달라질 수 있습니다.':d.n>=3?'아직 표본이 적어 현재 유형은 잠정적으로 보는 게 안전합니다.':'표본이 매우 적어 현재 평가는 참고용입니다.';
    return [lead,strength,risk,trend,sample].filter(Boolean).join(' ');
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
    }catch(e){console.warn('[v0.15.37] role scout interpretation apply failed',e);return false}
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
    window.aramProfileUxV01537={scoutText,applyScout,schedule};
    window.__ARAM_PROFILE_UX_V01537__=true;
    if(typeof DATA!=='undefined'){
      DATA.version=V;
      DATA.profile_ux_v01537={version:'v0.15.37 · Interpretive Role Scout Report + Metric Modal ESC',role_scout_reads_behavior_not_scores:true,esc_closes_role_metric_modal:true};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    schedule();
  }catch(e){console.error('[v0.15.37] profile UX patch failed',e);window.__ARAM_PROFILE_UX_V01537__=false}
})();
