'use strict';
(()=>{
  const V='0.15.40';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const round1=v=>Math.round((Number(v)||0)*10)/10;

  // Catch Resilience is a separate draft capability layer.
  // It does not alter Function18 or ROLE. Scoring is generic; the tables below only
  // describe whether a kit has an unusually reliable hard self-save / ally rescue.
  const HARD_SELF={
    '자야':[5.0,'R 지정불가'],
    '이즈리얼':[4.6,'E 즉시 재배치'],
    '시비르':[4.6,'E 주문 방어'],
    '제리':[4.3,'E 벽 재배치'],
    '카이사':[4.1,'R 실드·재배치'],
    '베인':[3.8,'Q/R 재배치·은신'],
    '트리스타나':[3.9,'W 이탈·R 밀치기'],
    '닐라':[4.0,'W 회피'],
    '루시안':[3.4,'E 재배치'],
    '칼리스타':[3.7,'패시브 연속 재배치'],
    '코르키':[3.0,'W 이탈'],
    '스몰더':[3.2,'E 재배치'],
    '아크샨':[3.6,'E 스윙 이탈'],
    '유나라':[3.4,'E 거리 재설정'],
    '퀸':[2.8,'E 거리 재설정'],
    '케이틀린':[2.4,'E 거리 재설정'],
    '세나':[2.5,'E 위장·거리 확보'],
    '리산드라':[4.8,'R 자기 무적'],
    '에코':[5.0,'R 복귀·회복'],
    '아리':[4.5,'R 다중 재배치'],
    '르블랑':[4.6,'W/R 복귀'],
    '제드':[4.4,'그림자 교체 이탈'],
    '엘리스':[4.7,'거미 E 지정불가'],
    '카사딘':[4.5,'R 반복 점멸'],
    '이블린':[4.4,'R 이탈'],
    '샤코':[4.4,'Q/R 회피'],
    '아칼리':[4.1,'W 은신·다중 이동'],
    '그웬':[4.3,'W 외부 대상 면역'],
    '피오라':[4.5,'W 핵심 CC 무효'],
    '갱플랭크':[4.4,'W CC 해제'],
    '올라프':[4.4,'R CC 면역'],
    '요네':[4.1,'E 복귀'],
    '신 짜오':[4.1,'R 외부 피해 차단'],
    '잭스':[3.4,'E 회피·Q 재배치'],
    '렝가':[3.8,'강화 W 해제'],
    '녹턴':[4.0,'W 주문 방어'],
    '말자하':[3.5,'패시브 주문 방어'],
    '모르가나':[4.1,'E CC 면역']
  };
  const HARD_ALLY={
    '레나타 글라스크':[5.0,'W 죽음 유예/부활'],
    '질리언':[5.0,'R 부활'],
    '케일':[4.8,'R 무적'],
    '킨드레드':[4.8,'R 사망 방지'],
    '타릭':[5.0,'R 광역 무적'],
    '탐 켄치':[4.8,'R 아군 삼키기'],
    '룰루':[4.5,'R 즉시 체력·에어본'],
    '밀리오':[4.2,'R 광역 해제·회복'],
    '잔나':[4.2,'Q/R 강제 분리'],
    '모르가나':[4.1,'E CC 면역'],
    '쓰레쉬':[4.3,'W 랜턴 구조'],
    '쉔':[4.2,'R 대형 실드'],
    '브라움':[3.8,'E 차단·CC 보호'],
    '바드':[3.8,'R 스테이시스 구조'],
    '유미':[3.6,'숙주 집중 보호'],
    '소라카':[3.6,'즉시 회복'],
    '아이번':[3.4,'E 실드·둔화'],
    '카르마':[3.1,'R-E 광역 실드·이속'],
    '세라핀':[3.0,'W 광역 보호'],
    '나미':[3.2,'회복·CC 차단'],
    '소나':[3.0,'회복·R 차단'],
    '라칸':[3.2,'실드·CC 차단'],
    '알리스타':[3.2,'밀치기·에어본'],
    '뽀삐':[3.5,'W/R 진입 차단'],
    '칼리스타':[4.2,'R 계약 아군 구조']
  };
  const TAG_SELF={INVULNERABLE:5.0,UNTARGETABLE:4.8,PROJECTILE_BLOCK:3.2,STEALTH:2.4};

  function champ(x){return typeof x==='string'?byName?.[x]:x}
  function f18(c,key){return Number(c?.['기능프로필18']?.[key])||0}
  function carryWeight(c){
    const role=String(c?.['주 역할']||''),base=role==='원딜'?1:role==='암살자'?.93:role==='메이지'?.86:(role==='AD브루저'||role==='AP브루저'||role==='브루저')?.70:role==='탱커'?.34:role==='서포터'?.30:.55;
    const damage=Math.max(f18(c,'지속딜'),f18(c,'순간폭딜'),f18(c,'포킹'));
    return clamp(base*.80+(damage/5)*.20,.25,1);
  }
  function selfSaveInfo(input){
    const c=champ(input);if(!c)return{score:0,hard:0,mobility:0,label:'',carry:0};
    const tags=new Set(c['특수태그']||[]);let tagScore=0,tagLabel='';
    for(const [tag,v] of Object.entries(TAG_SELF)){if(tags.has(tag)&&v>tagScore){tagScore=v;tagLabel=tag}}
    const explicit=HARD_SELF[c['챔피언']]||[0,''];
    const mob=f18(c,'기동성/재포지셔닝');
    const mobility=mob>=4.5?2.3:mob>=4?1.8:mob>=3.5?1.3:mob>=3?0.8:0;
    const hard=Math.max(tagScore,Number(explicit[0])||0);
    const score=clamp(Math.max(hard,mobility),0,5);
    const label=(Number(explicit[0])||0)>=tagScore&&explicit[1]?explicit[1]:(tagLabel?tagLabel:(mobility?`기동성 ${mob.toFixed(1)}/5`:''));
    return{score:round1(score),hard:round1(hard),mobility:round1(mobility),label,carry:round1(carryWeight(c))}
  }
  function allySaveInfo(input){
    const c=champ(input);if(!c)return{score:0,base:0,hard:0,label:''};
    const protect=f18(c,'보호/필'),disengage=f18(c,'역이니시/디스인게이지');
    const base=clamp(Math.max(0,protect-3)*.85+Math.max(0,disengage-3.5)*.45,0,3.2);
    const explicit=HARD_ALLY[c['챔피언']]||[0,''],hard=Number(explicit[0])||0,score=Math.max(base,hard);
    return{score:round1(clamp(score,0,5)),base:round1(base),hard:round1(hard),label:hard>=base&&explicit[1]?explicit[1]:(score?`보호 ${protect.toFixed(1)} · 역이니시 ${disengage.toFixed(1)}`:'')}
  }
  function teamCatch(names,modes={}){
    const used=(names||[]).filter(Boolean);if(!used.length)return{score:0,scale:0,count:0};
    const m=compMetrics(names,modes),score=Number(m?.['캐치'])||0;
    return{score:round1(score),scale:clamp((score-7)/11,0,1),count:used.length}
  }
  function vulnerableCarryCount(names){
    return (names||[]).filter(Boolean).map(champ).filter(Boolean).filter(c=>{
      const s=selfSaveInfo(c),cw=carryWeight(c);return cw>=.74&&s.score<3.4;
    }).length;
  }
  function candidateResilience(input,protectedNames=[]){
    const c=champ(input),self=selfSaveInfo(c),ally=allySaveInfo(c),cw=carryWeight(c),vulnerable=vulnerableCarryCount(protectedNames);
    const allyContext=vulnerable?1:(protectedNames||[]).filter(Boolean).length>=3?.58:.72;
    const direct=self.score*cw,allyEffective=ally.score*allyContext;
    return{self,ally,carry:round1(cw),direct:round1(direct),allyEffective:round1(allyEffective),allyContext:round1(allyContext),vulnerable}
  }
  function responseAdjustment(input,pressureNames,protectedNames,pressureModes={}){
    const pressure=teamCatch(pressureNames,pressureModes),r=candidateResilience(input,protectedNames);
    if(pressure.scale<=0)return{bonus:0,pressure,...r};
    const directLayer=r.direct*1.35,allyLayer=r.allyEffective*.72;
    const raw=Math.max(directLayer,allyLayer)+Math.min(directLayer,allyLayer)*.18;
    const reveal=clamp(.65+pressure.count*.07,.65,1);
    const bonus=round1(clamp(raw*pressure.scale*reveal,0,7.5));
    return{bonus,raw:round1(raw),reveal:round1(reveal),pressure,...r}
  }
  function teamSurvival(names,modes={}){
    const rows=(names||[]).filter(Boolean).map(n=>{const c=champ(n),s=selfSaveInfo(c),a=allySaveInfo(c);return{name:n,self:s.score,carry:s.carry,direct:s.score*s.carry,ally:a.score,selfLabel:s.label,allyLabel:a.label}});
    const direct=rows.map(x=>x.direct).sort((a,b)=>b-a),ally=rows.map(x=>x.ally).sort((a,b)=>b-a);
    const selfLayer=(direct[0]||0)*2.35+(direct[1]||0)*.70+(direct[2]||0)*.25;
    const allyLayer=(ally[0]||0)*1.60+(ally[1]||0)*.45+(ally[2]||0)*.15;
    const score=round1(clamp(selfLayer+allyLayer,0,20));
    return{score,selfLayer:round1(selfLayer),allyLayer:round1(allyLayer),rows:rows.sort((a,b)=>(b.direct+b.ally*.55)-(a.direct+a.ally*.55))}
  }
  function detailNote(info,side){
    if(!info)return'';
    const direct=`직접 생존 ${info.self.score.toFixed(1)}/5${info.self.label?` (${info.self.label})`:''}`;
    const ally=`아군 세이브 ${info.ally.score.toFixed(1)}/5${info.ally.label?` (${info.ally.label})`:''}`;
    return `${side} 캐치 ${info.pressure.score.toFixed(1)} · ${direct} · ${ally} · 직접 생존기 가중 우선`;
  }

  try{
    const oldCandidate=candidateScore;
    candidateScore=function(name,ownNames=state.our,enemyNames=state.enemy,mode='next'){
      const x=oldCandidate(name,ownNames,enemyNames,mode);if(!x||x.score<=-900||mode==='first')return x;
      const info=responseAdjustment(x.c||name,enemyNames,ownNames,state.enemyModes||{}),bonus=info.bonus;
      x.parts=x.parts||{};x.parts.contrib=x.parts.contrib||{};x.parts.contrib.catchResilience=bonus;x.parts.catchResilience=info;
      if(bonus){
        x.score=round1(x.score+bonus);
        x.reason+=` · 상대 캐치 ${info.pressure.score.toFixed(0)} 대응 ${info.self.score>=info.ally.score?'직접 생존':'세이브'} +${bonus.toFixed(1)}`;
      }
      return x;
    };

    const oldThreat=threatScore;
    threatScore=function(name){
      const x=oldThreat(name);if(!x)return x;
      const info=responseAdjustment(x.c||name,state.our,state.enemy,state.ourModes||{}),bonus=info.bonus;
      x.parts=x.parts||{};x.parts.contrib=x.parts.contrib||{};x.parts.contrib.catchResilience=bonus;x.parts.catchResilience=info;
      if(bonus){
        x.score=round1(x.score+bonus);
        x.reason+=` · 우리 캐치 ${info.pressure.score.toFixed(0)} 무력화 가능 +${bonus.toFixed(1)}`;
      }
      return x;
    };

    const oldSeriesResource=typeof seriesBanResourceInfo==='function'?seriesBanResourceInfo:null;
    if(oldSeriesResource){
      seriesBanResourceInfo=function(c,setX){
        const r=oldSeriesResource(c,setX),bonus=Number(setX?.parts?.contrib?.catchResilience)||0;
        if(!bonus)return r;
        // Series strategy remains resource-first; current-set catch counter is only a small signal.
        const add=bonus*.10,ctxWeight=Number(r.setWeight)||0;
        r.setSignal=round1((Number(r.setSignal)||0)+add);
        r.currentSet=round1(r.setSignal*ctxWeight);
        r.strategicRaw=(Number(r.overall)||0)+(Number(r.futureStrategic)||0)+r.currentSet-(Number(r.preserveCost)||0);
        r.catchResilienceSignal=round1(add);
        r.resourceAdj=r.strategicRaw-(Number(setX?.score)||0);
        return r;
      };
    }

    const oldPickBreakdown=typeof pickBreakdownHtml==='function'?pickBreakdownHtml:null;
    if(oldPickBreakdown)pickBreakdownHtml=function(x){
      let h=oldPickBreakdown(x),v=Number(x?.parts?.contrib?.catchResilience)||0;
      if(v>=.5)h+=`<span class="reasonTag balance">캐치대응 +${v.toFixed(1)}</span>`;
      return h;
    };
    const oldBanBreakdown=typeof banBreakdownHtml==='function'?banBreakdownHtml:null;
    if(oldBanBreakdown)banBreakdownHtml=function(x,viewMode='set'){
      let h=oldBanBreakdown(x,viewMode),v=Number(x?.parts?.contrib?.catchResilience)||0;
      if(v>=.5)h+=`<span class="reasonTag danger">캐치무력화 +${v.toFixed(1)}</span>`;
      return h;
    };

    const oldPickDetail=typeof pickScoreDetailHtml==='function'?pickScoreDetailHtml:null;
    if(oldPickDetail)pickScoreDetailHtml=function(x,mode){
      let h=oldPickDetail(x,mode),info=x?.parts?.catchResilience,v=Number(x?.parts?.contrib?.catchResilience)||0;
      if(mode==='first'||!info)return h;
      const row=scoreFactorRow('NEW · 상대 캐치 생존 대응',v,detailNote(info,'상대'),12);
      h=h.replace('<div class="scoreExplainGrid">','<div class="scoreExplainGrid">'+row);
      h=h.replace('Bush/Ally 상황증분','Bush/Ally 상황증분 + 캐치 생존 대응');
      const sub=`<div class="scoreExplainSection">v0.15.40 신규 · 캐치 ↔ 생존 대응</div><div class="scoreSubGrid">${scoreSub('상대 캐치',info.pressure.score,'캐치 기준 7 초과부터 가중')}${scoreSub('직접 생존',info.self.score,info.self.label||'확실한 자가 생존기 없음')}${scoreSub('아군 세이브',info.ally.score,info.ally.label||'강한 세이브 없음')}${scoreSub('적용 가점',v,'직접 생존 > 아군 세이브 · 상한 7.5')}</div>`;
      h=h.replace('<div class="scoreExplainTotal">',sub+'<div class="scoreExplainTotal">');
      return h;
    };

    const oldBanDetail=typeof banScoreDetailHtml==='function'?banScoreDetailHtml:null;
    if(oldBanDetail)banScoreDetailHtml=function(x,viewMode='set'){
      let h=oldBanDetail(x,viewMode),info=x?.parts?.catchResilience,v=Number(x?.parts?.contrib?.catchResilience)||0;
      if(!info)return h;
      const sub=`<div class="scoreExplainSection">v0.15.40 신규 · 캐치 ↔ 생존 대응</div><div class="scoreSubGrid">${scoreSub('우리 캐치',info.pressure.score,'캐치 기준 7 초과부터 가중')}${scoreSub('후보 직접 생존',info.self.score,info.self.label||'확실한 자가 생존기 없음')}${scoreSub('후보 아군 세이브',info.ally.score,info.ally.label||'강한 세이브 없음')}${scoreSub('이번세트 가점',v,'우리 캐치를 무력화할 가능성 · 직접 생존 우선')}</div>`;
      if(viewMode!=='series'){
        const row=scoreFactorRow('NEW · 우리 캐치 무력화 위험',v,detailNote(info,'우리'),12);
        h=h.replace('<div class="scoreExplainGrid">','<div class="scoreExplainGrid">'+row);
        h=h.replace('Bush/Ally 보조 + 중복감점','Bush/Ally 보조 + 캐치 생존 대응 + 중복감점');
      }
      h=h.replace('<div class="scoreExplainTotal">',sub+'<div class="scoreExplainTotal">');
      return h;
    };

    const oldRenderMetrics=typeof renderMetrics==='function'?renderMetrics:null;
    if(oldRenderMetrics)renderMetrics=function(elId,names,modes={}){
      const m=oldRenderMetrics(elId,names,modes),el=document.getElementById(elId),grid=el?.querySelector?.('.metrics');
      if(grid){
        const s=teamSurvival(names,modes),t=8,tone=metricTone(s.score,t),pct=Math.min(100,Math.round(s.score/(t*1.8)*100));
        grid.insertAdjacentHTML('beforeend',`<div class="metric liveMetric ${tone}" data-catch-survival="1"><div class="metricTop"><span>생존</span><b>${s.score.toFixed(0)}</b></div><div class="bar"><i style="width:${pct}%"></i></div><small>캐치대응 · 직접생존 우선</small></div>`);
      }
      return m;
    };

    const oldTeamScore=typeof teamScore==='function'?teamScore:null;
    if(oldTeamScore)teamScore=function(names,modes={}){
      const x=oldTeamScore(names,modes);if(!x)return x;
      const catchScore=Number(x.m?.['캐치'])||0,s=teamSurvival(names,modes);
      x.parts=x.parts||{};x.parts.catchResilience=s;x.catchSurvival=s.score;
      if(typeof x.structure==='string')x.structure+=` / 캐치 ${Math.round(catchScore)} / 생존 ${Math.round(s.score)}`;
      return x;
    };

    const oldBuilderCore=typeof renderBuilderCore==='function'?renderBuilderCore:null;
    if(oldBuilderCore)renderBuilderCore=function(){
      oldBuilderCore();
      const root=document.getElementById('builderCore');if(!root)return;
      const ourCatch=teamCatch(state.our,state.ourModes||{}),ourSurv=teamSurvival(state.our,state.ourModes||{}),enemyCatch=teamCatch(state.enemy,state.enemyModes||{}),enemySurv=teamSurvival(state.enemy,state.enemyModes||{});
      const note=root.querySelector('.draftPolicyNote');
      if(note&&!root.querySelector('[data-catch-resilience-core]')){
        note.insertAdjacentHTML('beforebegin',`<div class="engineGrid" data-catch-resilience-core="1"><div class="engineItem"><span>우리 캐치 ↔ 생존</span><b>${ourCatch.score.toFixed(0)} ↔ ${ourSurv.score.toFixed(0)}</b><small class="engineSub">생존 = 캐치 대응력 · 직접 자가 생존 우선</small></div><div class="engineItem enemy"><span>상대 캐치 ↔ 생존</span><b>${enemyCatch.score.toFixed(0)} ↔ ${enemySurv.score.toFixed(0)}</b><small class="engineSub">픽/밴 가점은 캐치가 기준 7을 넘을 때만 점진 적용</small></div></div>`);
      }
      if(note)note.innerHTML=note.innerHTML.replace('실제 대상 기반 아군 증폭 연계</b>','실제 대상 기반 아군 증폭 연계</b> + <b>캐치↔생존 대응</b>');
    };

    window.aramCatchResilienceProfile=(name)=>candidateResilience(name,[]);
    window.aramCatchResilienceTeam=(names,modes={})=>teamSurvival(names,modes);
    window.aramCatchPressure=(names,modes={})=>teamCatch(names,modes);
    window.aramCatchResponseAdjustment=(name,pressureNames,protectedNames=[],pressureModes={})=>responseAdjustment(name,pressureNames,protectedNames,pressureModes);
    if(typeof DATA!=='undefined'){
      DATA.version=V;
      DATA.catch_resilience_v01540={version:'v0.15.40 · Catch ↔ Survival Counter Layer',scoring:{self_save_priority:true,ally_save_secondary:true,max_bonus:7.5,catch_activation:7},role_grade_impact:false,riot_grade_impact:false};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    window.__ARAM_CATCH_RESILIENCE_V01540__=true;
  }catch(e){
    console.error('[v0.15.40] catch resilience patch failed',e);
    window.__ARAM_CATCH_RESILIENCE_V01540__=false;
  }
})();
