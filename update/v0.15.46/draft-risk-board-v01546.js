'use strict';
(()=>{
  const V='0.15.46';
  if(window.__ARAM_DRAFT_RISK_BOARD_V01546__)return;
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const clamp=(v,a=0,b=1.4)=>Math.max(a,Math.min(b,n(v)));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
  const names=xs=>(xs||[]).filter(Boolean);
  const confidence=c=>[0,.38,.66,.88,.95,1][Math.min(5,Math.max(0,c))]||1;

  function metric(xs,key){
    try{return n(compMetrics(names(xs))?.[key])}catch{return 0}
  }
  function density(xs,key){const a=names(xs);return a.length?metric(a,key)/a.length:0}
  function direct(name,key){return n(byName?.[name]?.[key])}
  function f18(name,key){return n(byName?.[name]?.['기능프로필18']?.[key])}
  function feature(name,keys){
    let best=0;
    for(const k of keys||[])best=Math.max(best,direct(name,k),f18(name,k));
    return best;
  }
  function avgFeature(xs,keys){const a=names(xs);return a.length?a.reduce((s,x)=>s+feature(x,keys),0)/a.length:0}
  function targetStrength(xs,key,target5){
    const a=names(xs),count=a.length;if(!count)return 0;
    const scaled=Math.max(.8,n(target5)*(count/5));
    return clamp((metric(a,key)/scaled)*confidence(count),0,1.5);
  }
  function responseStrength(xs,parts){
    const a=names(xs);if(!a.length)return 0;
    let total=0,weight=0;
    for(const p of parts||[]){
      const [key,target,w=1]=p;total+=clamp(metric(a,key)/Math.max(.8,target*(a.length/5)),0,1.4)*w;weight+=w;
    }
    return weight?clamp(total/weight,0,1.2):0;
  }
  function topSources(type){
    const enemy=names(state.enemy),map={
      value:['후반','후반밸류','후반 파워','후반파워','스케일링','성장','지속딜','보호'],
      poke:['포킹','유효 사거리','장거리 포킹'],
      dive:['다이브','다이브/후방 접근','후방 접근','진입'],
      engage:['이니시','강제진입','CC','광역 CC'],
      catch:['캐치','CC','장거리 CC'],
      frontline:['프론트','탱킹','전열','내구'],
      sustain:['유지력','회복','회복/보호막','힐/보호막','보호막','치유','아군 회복'],
      aoe:['광역 한타','광역딜','광역 피해','AOE','광역 CC','이니시','CC']
    };
    const keys=map[type]||[];
    const rows=enemy.map(name=>{
      let v=feature(name,keys);
      if(type==='value')v=Math.max(v,direct(name,'지속딜')*.75,direct(name,'보호')*.65);
      if(type==='frontline')v=Math.max(v,direct(name,'프론트'));
      if(type==='poke')v=Math.max(v,direct(name,'포킹'));
      if(type==='dive')v=Math.max(v,direct(name,'다이브'));
      if(type==='engage')v=Math.max(v,direct(name,'이니시'));
      if(type==='catch')v=Math.max(v,direct(name,'캐치'));
      return{name,v};
    }).sort((a,b)=>b.v-a.v);
    return rows.filter(x=>x.v>=2.8).slice(0,4).map(x=>x.name);
  }
  function level(strength){
    if(strength>=1.12)return{key:'critical',label:'매우 높음',rank:3};
    if(strength>=.82)return{key:'high',label:'높음',rank:2};
    if(strength>=.60)return{key:'watch',label:'주의',rank:1};
    return{key:'normal',label:'보통',rank:0};
  }
  function risk(key,label,icon,strength,detail,tip,sources=[]){
    const lv=level(strength);return{key,label,icon,strength:clamp(strength),level:lv.label,tone:lv.key,rank:lv.rank,detail,tip,sources};
  }
  function partialCatch(enemy){
    try{return window.aramDraftPartialCatchPressureV01542?.(enemy,state.enemyModes||{})||null}catch{return null}
  }
  function risks(){
    const enemy=names(state.enemy),our=names(state.our),ec=enemy.length,oc=our.length;
    if(ec<2)return[];
    const out=[];

    const ownProtect=responseStrength(our,[['보호',10,.58],['역이니시',8,.42]]);
    const ownEngage=responseStrength(our,[['이니시',8,.55],['캐치',7,.45]]);
    const ownFront=responseStrength(our,[['프론트',8,1]]);

    const cp=partialCatch(enemy);
    const catchBase=Math.max(targetStrength(enemy,'캐치',7),n(cp?.scale)*1.34);
    const catchStrength=catchBase*(1-.16*Math.min(1,ownProtect));
    out.push(risk('catch','캐치/CC 위험','⛓️',catchStrength,
      `상대의 선픽·장거리 CC 밀도가 높아 한 명이 먼저 끊기며 한타가 시작될 수 있습니다${cp?` · 강한 축 ${n(cp.strongSources)}명`:''}.`,
      '직접 생존 · 주문 방어 · 재배치',topSources('catch')));

    const pokeBase=targetStrength(enemy,'포킹',8);
    const sustainO=avgFeature(our,['유지력','회복','회복/보호막','힐/보호막','보호막','치유'])/5;
    const pokeMit=clamp(ownFront*.16+ownEngage*.12+sustainO*.18,0,.34);
    out.push(risk('poke','포킹 위험','🎯',pokeBase*(1-pokeMit),
      '교전 전에 체력이 깎이면서 좋은 한타 각 자체가 사라질 위험입니다.',
      '전열 · 유지력 · 강제진입',topSources('poke')));

    const diveBase=targetStrength(enemy,'다이브',10);
    out.push(risk('dive','돌진 위험','💥',diveBase*(1-.22*Math.min(1,ownProtect)),
      '상대가 후방 딜러에게 직접 접근해 포커싱을 강제할 수 있습니다.',
      '후방 보호 · 역이니시 · 자체 이탈',topSources('dive')));

    const engageSources=enemy.filter(x=>Math.max(direct(x,'이니시'),f18(x,'CC'),f18(x,'이니시'))>=3.8).length;
    let engageBase=targetStrength(enemy,'이니시',8);
    if(engageSources>=3)engageBase+=.18;else if(engageSources>=2)engageBase+=.09;
    out.push(risk('engage','강한 이니시 위험','🚨',engageBase*(1-.18*Math.min(1,ownProtect)),
      `상대가 원하는 타이밍에 교전을 열기 쉽습니다${engageSources?` · 강한 개시 수단 ${engageSources}개`:''}.`,
      '간격 유지 · 무효화 수단 · 역이니시',topSources('engage')));

    const enemyFront=targetStrength(enemy,'프론트',8);
    const antiTank=responseStrength(our,[['대탱',7,.55],['지속딜',10,.45]]);
    const frontRisk=enemyFront*(1-.46*Math.min(1,antiTank))+.16*Math.max(0,1-antiTank)*Math.min(1,enemyFront);
    out.push(risk('frontline','전열 처리 위험','🛡️',frontRisk,
      '상대 전열은 단단한데 우리 쪽 지속딜·대탱 수단이 부족해 앞라인에서 막힐 수 있습니다.',
      '지속딜 · 체력비례/대탱 · 관통',topSources('frontline')));

    const sustainE=avgFeature(enemy,['유지력','회복','회복/보호막','힐/보호막','보호막','치유','아군 회복']);
    const protectProxy=density(enemy,'보호')*.55;
    const sustainBase=clamp(Math.max(sustainE/4.2,protectProxy/2.3)*confidence(ec),0,1.4);
    out.push(risk('sustain','유지력 위험','💚',sustainBase*(1-.16*Math.min(1,ownEngage)),
      '상대가 포킹과 짧은 교환의 손해를 회복해 장기전에서 누적 우위를 만들 수 있습니다.',
      '강제진입 · 집중 폭딜 · 치감 검토',topSources('sustain')));

    const aoeFeature=avgFeature(enemy,['광역 한타','광역딜','광역 피해','AOE','광역 CC']);
    const aoeSources=enemy.filter(x=>feature(x,['광역 한타','광역딜','광역 피해','AOE','광역 CC','이니시','CC'])>=3.5).length;
    const aoeBase=clamp(targetStrength(enemy,'이니시',8)*.52+targetStrength(enemy,'캐치',7)*.18+(aoeFeature/5)*.30+(aoeSources>=3?.12:aoeSources>=2?.06:0),0,1.4);
    out.push(risk('aoe','광역 한타 위험','🌪️',aoeBase*(1-.13*Math.min(1,ownProtect)),
      '선진입 뒤 광역 CC·광역 피해가 겹치며 한 번에 전투가 무너질 수 있습니다.',
      '산개 · 핵심궁 분산 · 역이니시',topSources('aoe')));

    if(ec>=3&&oc>=2){
      const eSustain=avgFeature(enemy,['유지력','회복/보호막','힐/보호막','보호막'])/5;
      const oSustain=avgFeature(our,['유지력','회복/보호막','힐/보호막','보호막'])/5;
      const eValue=density(enemy,'지속딜')*.36+density(enemy,'프론트')*.20+density(enemy,'보호')*.18+density(enemy,'대탱')*.12+eSustain*.14;
      const oValue=density(our,'지속딜')*.36+density(our,'프론트')*.20+density(our,'보호')*.18+density(our,'대탱')*.12+oSustain*.14;
      const lateE=avgFeature(enemy,['후반','후반밸류','후반 파워','후반파워','스케일링','성장']);
      const lateO=avgFeature(our,['후반','후반밸류','후반 파워','후반파워','스케일링','성장']);
      const lateDiff=(lateE||lateO)?(lateE-lateO)*.10:0;
      const gap=eValue-oValue;
      const valueStrength=clamp((.54+gap*.22+lateDiff)*Math.min(1,confidence(ec)+.12),0,1.35);
      out.push(risk('value','밸류 위험','📈',valueStrength,
        '시간이 갈수록 상대의 지속딜·전열·보호가 함께 살아남아 장기 한타 기대값이 우리보다 높아질 수 있습니다.',
        '빠른 강제교전 · 성장 차단 · 지속딜/밸류 보완',topSources('value')));
    }

    return out.sort((a,b)=>b.rank-a.rank||b.strength-a.strength);
  }
  function badgeHtml(r){
    return `<span class="draftRiskBadgeV01546 ${r.tone}"><i>${r.icon}</i><b>${esc(r.label)}</b><em>${esc(r.level)}</em></span>`;
  }
  function detailHtml(r,index){
    const src=r.sources?.length?` · ${r.sources.join(' · ')}`:'';
    return `<div class="draftRiskDetailV01546 ${r.tone}"><div class="draftRiskNoV01546">${index+1}</div><div class="draftRiskBodyV01546"><b>${r.icon} ${esc(r.label)} · ${esc(r.level)}</b><span>${esc(r.detail+src)}</span><small>대응: ${esc(r.tip)}</small></div></div>`;
  }
  function boardHtml(){
    const all=risks(),active=all.filter(x=>x.rank>0),enemy=names(state.enemy);
    if(enemy.length<2)return `<div id="draftRiskBoardV01546" class="draftRiskBoardV01546 waiting"><div class="draftRiskHeadV01546"><b>상대 위험 감지</b><span>상대 2픽부터 분석</span></div></div>`;
    if(!active.length)return `<div id="draftRiskBoardV01546" class="draftRiskBoardV01546 safe"><div class="draftRiskHeadV01546"><b>상대 위험 감지</b><span>뚜렷한 고위험 신호 없음</span></div><div class="draftRiskBadgesV01546"><span class="draftRiskBadgeV01546 normal"><i>✓</i><b>현재</b><em>안정</em></span></div></div>`;
    const top=active.slice(0,2);
    return `<div id="draftRiskBoardV01546" class="draftRiskBoardV01546"><div class="draftRiskHeadV01546"><b>상대 위험 감지</b><span>${active.length}개 감지 · 높은 순</span></div><div class="draftRiskBadgesV01546">${active.map(badgeHtml).join('')}</div><div class="draftRiskDetailsV01546">${top.map(detailHtml).join('')}</div></div>`;
  }
  function applyBoard(){
    const core=document.getElementById('builderCore');if(!core)return false;
    core.querySelectorAll('.draftEmergencyStack,#draftRiskBoardV01546').forEach(x=>x.remove());
    core.insertAdjacentHTML('afterbegin',boardHtml());
    return true;
  }
  function ensureStyle(){
    if(document.getElementById('aram-draft-risk-board-v01546-style'))return;
    const st=document.createElement('style');st.id='aram-draft-risk-board-v01546-style';st.textContent=`
      #draftRiskBoardV01546{border:1px solid #304b69;background:#0b1a2c;border-radius:10px;padding:9px 10px;margin-bottom:9px;box-sizing:border-box}
      #draftRiskBoardV01546.waiting,#draftRiskBoardV01546.safe{border-color:#29445e;background:#0a1727}
      .draftRiskHeadV01546{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px}.draftRiskHeadV01546 b{font-size:10px;color:#eef7ff}.draftRiskHeadV01546 span{font-size:8px;color:#8197ad;font-weight:800}
      .draftRiskBadgesV01546{display:flex;flex-wrap:wrap;gap:5px}.draftRiskBadgeV01546{display:inline-flex;align-items:center;gap:4px;border:1px solid #765c29;background:#231e12;border-radius:999px;padding:4px 7px;white-space:nowrap}.draftRiskBadgeV01546 i{font-style:normal;font-size:10px}.draftRiskBadgeV01546 b{font-size:8px;color:#e7edf4}.draftRiskBadgeV01546 em{font-style:normal;font-size:8px;font-weight:950;color:#ffd66d}
      .draftRiskBadgeV01546.high{border-color:#985a32;background:#29190f}.draftRiskBadgeV01546.high em{color:#ffb16a}.draftRiskBadgeV01546.critical{border-color:#a83b4a;background:#301118;box-shadow:inset 2px 0 0 #ff6574}.draftRiskBadgeV01546.critical em{color:#ff8b98}.draftRiskBadgeV01546.normal{border-color:#2d624b;background:#10261d}.draftRiskBadgeV01546.normal em{color:#78d6a9}
      .draftRiskDetailsV01546{display:grid;gap:5px;margin-top:7px}.draftRiskDetailV01546{display:flex;gap:7px;align-items:flex-start;border:1px solid #6f572b;background:#211c12;border-radius:8px;padding:7px 8px}.draftRiskDetailV01546.high{border-color:#8e5531;background:#28180f}.draftRiskDetailV01546.critical{border-color:#973846;background:#2b1117}.draftRiskNoV01546{display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#223b56;color:#dcecff;font-size:8px;font-weight:950;flex:0 0 auto}.draftRiskDetailV01546.critical .draftRiskNoV01546{background:#7b2635}.draftRiskBodyV01546{min-width:0;display:flex;flex-direction:column;gap:2px}.draftRiskBodyV01546 b{font-size:9px;color:#f3f7fb}.draftRiskBodyV01546 span{font-size:8px;line-height:1.42;color:#bdc9d6}.draftRiskBodyV01546 small{font-size:8px;color:#8fa8bf;font-weight:850}
    `;document.head.appendChild(st);
  }
  function apply(){ensureStyle();try{return applyBoard()}catch(e){console.warn('[v0.15.46] draft risk board',e);return false}}
  const oldRenderBuilder=typeof renderBuilder==='function'?renderBuilder:null;
  if(oldRenderBuilder)renderBuilder=function(...args){const r=oldRenderBuilder.apply(this,args);apply();requestAnimationFrame(apply);return r};
  const oldRenderBuilderCore=typeof renderBuilderCore==='function'?renderBuilderCore:null;
  if(oldRenderBuilderCore)renderBuilderCore=function(...args){const r=oldRenderBuilderCore.apply(this,args);apply();requestAnimationFrame(apply);return r};
  ensureStyle();apply();setTimeout(apply,0);setTimeout(apply,120);setTimeout(apply,350);

  window.aramDraftRiskBoardV01546=risks;
  window.aramApplyDraftRiskBoardV01546=apply;
  if(typeof DATA!=='undefined'){
    DATA.version=V;
    DATA.draft_risk_board_v01546={version:'v0.15.46 · Pick judgment multi-risk board',categories:['밸류','포킹','돌진','강한 이니시','캐치/CC','전열 처리','유지력','광역 한타'],show_all_active_badges:true,detail_top_n:2,placement:'builderCore / 픽 판단',relative_to_our_comp:true,partial_pick_confidence:true,score_logic_changed:false};
  }
  if(typeof syncAppVersionUI==='function')try{syncAppVersionUI()}catch{}
  window.__ARAM_DRAFT_RISK_BOARD_V01546__=true;
})();
