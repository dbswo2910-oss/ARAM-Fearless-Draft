'use strict';
(()=>{
  const V='0.15.13';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  try{
    // ROLE GRADE v3: role-normalized durability + ally/self sustain separation.
    ARAM_ROLE_METRIC_DEFS.absorb={label:'피해 흡수',detail:'받은피해·피해감소·생존당 흡수 효율'};
    ARAM_ROLE_METRIC_DEFS.allySustain={label:'아군 유지력',detail:'아군 회복·보호막 절대량/팀비중'};
    ARAM_ROLE_METRIC_DEFS.selfSustain={label:'자기 유지력',detail:'자기 회복·지속전 생존 대리지표'};
    ARAM_ROLE_EXPECTED_AXIS_MAP.absorb=['프론트라인'];
    ARAM_ROLE_EXPECTED_AXIS_MAP.allySustain=['유지력','보호/필'];
    ARAM_ROLE_EXPECTED_AXIS_MAP.selfSustain=['유지력','프론트라인'];

    // Tank templates now expose mitigation/absorption directly instead of letting raw tank-share dominate implicitly.
    ARAM_ROLE_TEMPLATES.tank_engage={label:'선이니시 메인탱커',core:['absorb','engage','cc'],items:[['absorb',25],['engage',22],['cc',18],['kp',14],['survival',10],['function',11]]};
    ARAM_ROLE_TEMPLATES.tank_disrupt={label:'교전제어 탱커',core:['absorb','cc','engage'],items:[['absorb',22],['cc',22],['engage',17],['peel',12],['kp',15],['survival',6],['function',6]]};
    ARAM_ROLE_TEMPLATES.tank_warden={label:'보호·역이니시 탱커',core:['peel','absorb','cc'],items:[['peel',24],['absorb',20],['cc',18],['kp',15],['survival',10],['function',13]]};
    ARAM_ROLE_TEMPLATES.tank_pick={label:'캐치·단일 이니시 탱커',core:['pick','cc','absorb'],items:[['pick',24],['cc',21],['absorb',18],['kp',15],['engage',12],['survival',5],['function',5]]};
    ARAM_ROLE_TEMPLATES.tank_frontline={label:'순수 프론트라인 탱커',core:['absorb','sustainFight','kp'],items:[['absorb',30],['sustainFight',18],['kp',15],['survival',12],['cc',10],['damage',6],['function',9]]};
    // Explicit ally-only sustain prevents self-healing or ambiguous totalHeal from inflating support grades.
    ARAM_ROLE_TEMPLATES.support_sustain={label:'유지력 특화 서포터',core:['allySustain','peel','kp'],items:[['allySustain',27],['peel',19],['utility',16],['kp',17],['survival',10],['function',11]]};
    ARAM_ROLE_TEMPLATES.support_attach={label:'원캐리 부착·증폭 서포터',core:['peel','utility','kp'],items:[['peel',27],['utility',23],['allySustain',16],['kp',20],['cc',6],['function',8]]};

    const oldBaseSignals=aramHistoryBaseSignals;
    aramHistoryBaseSignals=function(m){
      const me=m?.me||{},team=m?.ourTeam||[];if(!m?.teamContextComplete)return null;
      const mins=Math.max(1,(Number(m?.gameDuration)||1)/60),tk=team.reduce((a,x)=>a+(Number(x.kills)||0),0),teamAvgKills=tk/Math.max(1,team.length),killShare=tk>0?(Number(me.kills)||0)/tk:0;
      const kp=Math.round(aramHistoryCurve(me.killParticipation,[[.35,15],[.5,35],[.6,50],[.7,67],[.8,83],[.9,96],[1,100]]));
      const deathRate=x=>Number.isFinite(Number(x?.deathsPer10))?Number(x.deathsPer10):((Number(x?.deaths)||0)/mins*10),meDeaths10=deathRate(me),teamAvgDeathsPer10=team.reduce((a,x)=>a+deathRate(x),0)/Math.max(1,team.length),deathDeltaPer10=meDeaths10-teamAvgDeathsPer10;
      const survivalAbs=Math.round(aramHistoryCurve(meDeaths10,[[2,95],[3,86],[4,72],[5,58],[6,44],[7.5,25],[9,10],[11,0]])),survivalRel=Math.round(aramHistoryCurve(deathDeltaPer10,[[-3,96],[-2,88],[-1,76],[0,62],[1,48],[2,33],[3,19],[4.5,6],[6,0]])),survival=Math.round(survivalAbs*.50+survivalRel*.50);
      const dShare=aramHistoryCurve(me.damageShare,[[.08,18],[.12,30],[.16,45],[.2,58],[.25,72],[.3,86],[.35,96],[.42,100]]),dpm=aramHistoryCurve(me.dpm,[[500,18],[800,32],[1100,48],[1400,61],[1800,77],[2200,89],[2700,97],[3200,100]]),dRank=aramHistoryRankScore(team,me,x=>x.dpm,true),damage=Math.round(dShare*.45+dpm*.35+dRank*.20);
      const eff=Math.round(aramHistoryCurve(me.resourceEfficiency,[[.5,10],[.7,27],[.85,42],[1,58],[1.15,72],[1.35,86],[1.6,97],[1.9,100]]));

      // Durability: role-normalized shares + mitigation efficiency + value absorbed per death.
      // Pure team rank is capped at 15% so simply being the team's tank does not automatically create A-tier evidence.
      const takenRank=aramHistoryRankScore(team,me,x=>x.totalDamageTaken,true),mitRank=aramHistoryRankScore(team,me,x=>x.damageSelfMitigated,true);
      const tankShare=aramHistoryCurve(me.damageTakenShare,[[.06,8],[.12,20],[.18,34],[.24,48],[.30,62],[.36,75],[.42,87],[.50,97],[.58,100]]);
      const mitShare=aramHistoryCurve(me.mitigatedShare,[[.03,7],[.10,18],[.17,31],[.24,45],[.31,58],[.38,71],[.46,84],[.55,95],[.65,100]]);
      const taken=Math.max(0,Number(me.totalDamageTaken)||0),mitigated=Math.max(0,Number(me.damageSelfMitigated)||0),mitRatio=(taken+mitigated)>0?mitigated/(taken+mitigated):0;
      const mitRatioScore=aramHistoryCurve(mitRatio,[[.15,12],[.25,25],[.35,39],[.45,53],[.55,66],[.63,78],[.70,88],[.78,96],[.86,100]]);
      const soakPerDeath=x=>((Math.max(0,Number(x?.totalDamageTaken)||0)+Math.max(0,Number(x?.damageSelfMitigated)||0))/Math.max(1,Number(x?.deaths)||0));
      const soakRank=aramHistoryRankScore(team,me,soakPerDeath,true);
      const tank=Math.round(tankShare*.85+takenRank*.15),mit=Math.round(mitShare*.85+mitRank*.15);
      const absorb=Math.round(tank*.30+mit*.30+mitRatioScore*.20+soakRank*.20);

      const ccPer10=(Number(me.timeCCingOthers)||0)/mins*10,ccShare=aramHistoryCurve(me.ccShare,[[.01,8],[.04,22],[.08,36],[.14,52],[.22,70],[.32,86],[.45,100]]),ccAbs=aramHistoryCurve(ccPer10,[[1,8],[3,20],[6,35],[10,52],[15,68],[22,84],[30,96],[40,100]]),cc=Math.round(ccShare*.65+ccAbs*.35);
      // Match-v5 exposes explicit teammate heal/shield fields. Keep them separate from totalHeal because totalHeal semantics are not reliable enough to sum with teammate heal without double-count risk.
      const allyRaw=(Number(me.totalHealsOnTeammates)||0)+(Number(me.totalDamageShieldedOnTeammates)||0),allyPerMin=allyRaw/mins,allyShare=Math.max(Number(me.healShare)||0,Number(me.shieldShare)||0),allyShareScore=aramHistoryCurve(allyShare,[[.01,7],[.04,18],[.08,30],[.14,44],[.22,60],[.32,76],[.45,90],[.58,98],[.7,100]]),allyAbs=aramHistoryCurve(allyPerMin,[[30,6],[100,16],[220,28],[420,42],[700,57],[1100,72],[1650,86],[2350,96],[3200,100]]),allySustain=Math.round(allyShareScore*.60+allyAbs*.40);
      const selfPerMin=(Number(me.totalHeal)||0)/mins,selfSustain=Math.round(aramHistoryCurve(selfPerMin,[[25,8],[80,18],[160,30],[280,43],[450,57],[700,72],[1050,85],[1500,94],[2200,100]]));
      const sustain=Math.max(selfSustain,allySustain);
      const kills=Math.round(aramHistoryCurve(killShare,[[.03,8],[.07,20],[.12,35],[.18,52],[.2,58],[.24,69],[.32,86],[.42,100]])),multi=Math.round(aramHistoryCurve(me.largestMultiKill||0,[[1,20],[2,48],[3,72],[4,90],[5,100]]));

      // v3: role contribution uses the right sustain source and reduces raw tank-stat circularity.
      const frontline=Math.round(absorb*.60+kp*.25+survival*.15),engage=Math.round(cc*.50+kp*.30+absorb*.20),peel=Math.round(cc*.38+allySustain*.37+kp*.25),carry=Math.round(damage*.50+eff*.25+kp*.20+survival*.05),burst=Math.round(damage*.30+kills*.30+kp*.20+multi*.20),utility=Math.round(cc*.32+allySustain*.40+kp*.28),poke=Math.round(damage*.52+eff*.25+kp*.18+survival*.05),dive=Math.round(burst*.38+kp*.28+frontline*.26+survival*.08),reset=Math.round(burst*.36+damage*.24+kp*.30+survival*.10),control=Math.round(cc*.50+kp*.28+damage*.17+survival*.05),pick=Math.round(burst*.32+cc*.28+kp*.24+dive*.12+survival*.04),sustainFight=Math.round(damage*.32+frontline*.25+selfSustain*.25+kp*.15+survival*.03);
      return{kp,survival,survivalAbs,survivalRel,teamAvgDeathsPer10,deathDeltaPer10,damage,eff,tank,mit,mitRatio:Math.round(mitRatio*1000)/1000,mitRatioScore:Math.round(mitRatioScore),soakRank,absorb,cc,sustain,allySustain,selfSustain,kills,multi,frontline,engage,peel,carry,burst,utility,poke,dive,reset,control,pick,sustainFight,dpmAbs:Math.round(dpm),damageShareAbs:Math.round(dShare),killShare,teamAvgKills};
    };

    aramHistoryTraitExecution=function(m){const me=m?.me||{},name=aramHistoryResolveParticipant(me),f=aramHistoryFunctionProfile(name),s=aramHistoryBaseSignals(m);if(!s)return{score:null,traits:[]};const map={
      '프론트라인':s.frontline,'이니시':s.engage,'캐치':s.pick,'CC':s.cc,'보호/필':s.peel,'역이니시/디스인게이지':Math.round(s.peel*.58+s.cc*.42),'포킹':s.poke,'순간폭딜':s.burst,'지속딜':s.carry,'광역 한타력':Math.round(s.damage*.42+s.kp*.28+s.cc*.30),'라인 클리어':Math.round(s.damage*.65+s.eff*.35),'대탱커':s.carry,'다이브/후방 접근':s.dive,'공간 장악':s.control,'유지력':Math.round(Math.max(s.allySustain,s.selfSustain)*.72+s.kp*.23+s.survival*.05),'기동성/재포지셔닝':Math.round(s.kp*.45+s.eff*.35+s.survival*.20),'유효 사거리':Math.round(s.damage*.55+s.eff*.30+s.survival*.15),'공성/구조물 압박':Math.round(s.poke*.55+s.damage*.30+s.eff*.15)};
      const traits=Object.entries(f).map(([k,v])=>({key:k,expected:Number(v)||0,score:Number(map[k])||0})).filter(x=>x.expected>0).sort((a,b)=>b.expected-a.expected).slice(0,5),top=traits.filter(x=>x.expected>=2.5).slice(0,3),use=top.length?top:traits.slice(0,3),den=use.reduce((a,x)=>a+x.expected,0)||1,raw=Math.round(use.reduce((a,x)=>a+x.score*x.expected,0)/den),score=Math.round(50+(raw-50)*.90);return{score:clamp(score),raw,traits,reliability:'proxy-v3'};
    };

    const oldMetricValue=aramHistoryRoleMetricValue;
    aramHistoryRoleMetricValue=function(key,s,trait){if(key==='function')return Number(trait?.score)||0;if(key==='absorb')return Number(s?.absorb)||0;if(key==='allySustain')return Number(s?.allySustain)||0;if(key==='selfSustain')return Number(s?.selfSustain)||0;return Number(s?.[key])||0};

    // Champion-specific expectation normalization is now meaningful enough to neutralize "easy stat" inflation, but stays bounded so a champion is never punished for its identity.
    aramHistoryExpectedNormalizeMetric=function(name,key,score){const exp=aramHistoryExpectedAxisValue(name,key);if(exp===null)return clamp(score);const shift=Math.max(-5.5,Math.min(6,(exp-3)*3));return clamp(score-shift)};

    // Slightly soften the high-grade evidence requirement after direct Function weight was capped at 5%; B-band remains neutral.
    aramHistoryV2SoftPenalty=function(coreAvg,coreMin,highEvidence,calibrated){let p=0;if(coreAvg<40)p+=7;else if(coreAvg<50)p+=5;else if(coreAvg<58)p+=3;else if(coreAvg<64)p+=1;if(coreMin<25)p+=4;else if(coreMin<35)p+=2;else if(coreMin<45)p+=1;if(calibrated>=91&&highEvidence<2)p+=(2-highEvidence)*1.25;if(calibrated>=96&&highEvidence<3)p+=(3-highEvidence)*1.25;return Math.max(0,Math.min(13,p))};

    // Keep the score bands, but report the new model name everywhere.
    const oldBreakdown=aramHistoryRoleBreakdown;
    aramHistoryRoleBreakdown=function(m){const r=oldBreakdown(m);if(r&&r.score!==null)r.gradeModel='ROLE GRADE v3';return r};
    aramHistoryRoleBreakdownHtml=function(m){const r=aramHistoryRoleBreakdown(m);if(r.score===null)return'<div class="historyEmpty">10인 상세 데이터가 있어야 역할별 수행지표를 계산할 수 있습니다.</div>';const traits=(r.trait?.traits||[]).slice(0,4),p=r.profile||{},s=aramHistoryBaseSignals(m);return `<div class="historyRolePanel"><div class="historyRoleHead"><div><b>${aramHistoryEsc(r.role)} 역할 수행지표 · ${aramHistoryEsc(p.identity||p.label||'')}</b><span>${p.classified?'챔피언 개별 프로필':'역할 공통 임시 프로필'} · ROLE GRADE v3는 절대 성과 + 팀내 상대성과 + 챔피언/빌드 기대축을 함께 봅니다.</span></div><em>${r.score}/100 · ROLE INDEX v3</em></div><div class="historyRoleGrid">${r.items.map(x=>{const tone=x.score>=80?'good':x.score<45?'bad':x.score<60?'warn':'';return `<div class="historyRoleMetric ${tone}"><div class="rh"><span>${aramHistoryEsc(x.label)}</span><b>${x.score}</b></div><div class="rb"><i style="width:${x.score}%"></i></div><small>${aramHistoryEsc(x.detail)} · 비중 ${Math.round(x.weight)}%</small></div>`}).join('')}</div><div class="historyRoleAudit"><span>핵심축 평균 <b>${r.coreAvg}</b></span><span>핵심축 최저 <b>${r.coreMin}</b></span><span>80+ 증거 <b>${r.highEvidence}개</b></span>${s?`<span>피해흡수 <b>${s.absorb}</b></span>`:''}${p.buildSensitive?(p.buildResolved?`<span>자동 빌드 분기 <b>${aramHistoryEsc(String(p.buildStyle||'기본').toUpperCase())}</b></span>`:'<span class="warn">빌드 분기 보류</span>'):''}</div><div class="historyRoleCalibration"><span>원점수 <b>${r.rawScore}</b></span><span>분포 교정 <b>${r.calibratedScore}</b></span><span>핵심축 보정 <b>-${r.softPenalty}</b></span><span>Function18 직접비중 <b>최대 5%</b></span></div>${traits.length?`<div class="historyFunctionChips">${traits.map(x=>`<span>${aramHistoryEsc(x.key)} <b>${x.expected.toFixed(1)}/5</b> · 관측 ${x.score}</span>`).join('')}</div>`:''}<div class="historyModelNote">※ ${aramHistoryEsc(p.note||'')}${p.buildSensitive?` · 빌드판정: ${aramHistoryEsc(p.buildReason||'기본 프로필')}`:''} · 피해감소량은 이제 탱커/브루저의 <b>피해 흡수</b>에 명시 반영하며, 받은피해 단순 팀내 1등만으로 고등급이 되지 않게 팀순위 비중을 낮췄습니다. 아군 유지력은 totalHealsOnTeammates/보호막을 사용하고 자기회복과 분리합니다. 승패와 Power Curve는 점수 가산에 쓰지 않습니다.</div></div>`};

    const oldSummaryHtml=aramHistorySummaryHtml;
    aramHistorySummaryHtml=function(matches){const html=oldSummaryHtml(matches);return String(html||'').replace(/ROLE GRADE v2/g,'ROLE GRADE v3')};
    const oldSummaryTab=aramHistorySummaryTab;
    aramHistorySummaryTab=function(m){const me=m?.me||{},html=String(oldSummaryTab(m)||''),metric=`<div class="historyMetric"><span>받은피해 / 감소</span><b>${aramHistoryN(me.totalDamageTaken)} · ${aramHistoryN(me.damageSelfMitigated)}</b></div>`;return html.replace('<div class="historyMetric"><span>DPM</span>',metric+'<div class="historyMetric"><span>DPM</span>')};

    // Match Lab 5v5 table: damage -> received/mitigated -> DPM -> gold. This groups combat flow and moves economy to the final column.
    aramHistoryTeamStatTable=function(list,meId,label,tone='our',match=null){if(!Array.isArray(list)||!list.length)return'<div class="historyEmpty">팀 상세 데이터가 없습니다.</div>';const maxD=Math.max(1,...list.map(p=>Number(p.damageToChampions||p.totalDamageDealtToChampions)||0)),maxAbs=Math.max(1,...list.map(p=>(Number(p.totalDamageTaken)||0)+(Number(p.damageSelfMitigated)||0))),maxG=Math.max(1,...list.map(p=>Number(p.goldEarned)||0));return `<div class="matchTeamTable ${tone}"><div class="matchTeamTitle">${label}</div><div class="matchTeamHeader"><span>챔피언</span><span>KDA / KP</span><span>피해량</span><span>받은피해 / 감소</span><span>DPM</span><span>골드 / 효율</span></div>${list.map(p=>{const n=aramHistoryResolveParticipant(p),isMe=String(p.participantId)===String(meId),d=Number(p.damageToChampions||p.totalDamageDealtToChampions)||0,g=Number(p.goldEarned)||0,taken=Number(p.totalDamageTaken)||0,mit=Number(p.damageSelfMitigated)||0,abs=taken+mit,pn=aramHistoryParticipantName(p),pdata=aramHistoryParticipantProfileData(p),profileTitle=pn?`${pn} 전적 검색`:'이 플레이어 전적 검색',perf=match?aramHistoryParticipantPerformance(match,p,list):{score:null,grade:'-',tone:'partial'},ally=(Number(p.totalHealsOnTeammates)||0)+(Number(p.totalDamageShieldedOnTeammates)||0);return `<div class="matchTeamRow ${isMe?'me':''}"><div class="matchPlayerCell"><button type="button" class="matchPlayerProfile" data-profile="${aramHistoryEsc(pdata)}" onclick="aramHistoryOpenParticipantData(this.dataset.profile)" title="${aramHistoryEsc(profileTitle)}">${aramHistoryIcon(n,'draft')}<span><b>${aramHistoryEsc(n)}</b><small>${aramHistoryEsc(pn||aramHistoryRole(n))}</small></span><span class="matchTeamGrade ${perf.tone}" title="ROLE GRADE v3">${perf.grade}<small>${perf.score===null?'':perf.score}</small></span><em>전적</em></button></div><div><b>${p.kills||0}/${p.deaths||0}/${p.assists||0}</b><small>KDA ${aramHistoryN(p.kda,2)} · KP ${aramHistoryPct(p.killParticipation)}</small></div><div><b>${aramHistoryN(d)}</b><div class="matchBar"><i style="width:${Math.max(3,d/maxD*100)}%"></i></div><small>${aramHistoryPct(p.damageShare)} · ${p.damageRank||'-'}위</small></div><div><b>받피 ${aramHistoryN(taken)}</b><div class="matchBar"><i style="width:${Math.max(3,abs/maxAbs*100)}%"></i></div><small>감소 ${aramHistoryN(mit)} · CC ${aramHistoryN(p.timeCCingOthers)}s${ally?` · 아군보조 ${aramHistoryN(ally)}`:''}</small></div><div><b>${aramHistoryN(p.dpm)}</b><small>데스/10분 ${aramHistoryN(p.deathsPer10,2)}</small></div><div><b>${aramHistoryN(g)}</b><div class="matchBar gold"><i style="width:${Math.max(3,g/maxG*100)}%"></i></div><small>${aramHistoryPct(p.goldShare)} · 효율 ${p.resourceEfficiency?Number(p.resourceEfficiency).toFixed(2)+'×':'-'}</small></div></div>`}).join('')}</div>`};

    if(typeof DATA!=='undefined'){
      DATA.version=V;
      DATA.role_grade_v3_v01513={version:'v0.15.13 · ROLE GRADE v3 Balance Pass',coverage:'173/173 champion role profiles',grade_cut:{Splus:96,S:91,Aplus:84,A:76,B:64,C:52},changes:['tank absorption normalization','damageSelfMitigated explicit score axis','ally/self sustain split','stronger champion expectation normalization','Match Lab stat column regrouping'],global_population_percentile:false};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    const info=document.querySelector?.('.dataInfoPanel .callout');
    if(info&&!String(info.innerHTML||'').includes('ROLE GRADE v3 Balance Pass'))info.innerHTML=`<b>v0.15.13:</b> <b>ROLE GRADE v3 Balance Pass</b> — 173/173 챔피언 개별 역할 프로필을 전수 검증하고, 피해감소량을 명시적 피해흡수 축으로 반영했습니다. 받은피해/피해감소 팀내 순위만으로 탱커가 과대평가되지 않도록 절대·상대·흡수효율을 재조정하고, 아군 회복/보호막과 자기회복을 분리했습니다. Match Lab 5인 표는 피해량 → 받은피해/감소 → DPM → 골드/효율 순으로 재배치했습니다.<br><br>`+info.innerHTML;
    window.__ARAM_ROLE_GRADE_V01513__=true;
  }catch(e){console.error('[v0.15.13] role grade patch failed',e);window.__ARAM_ROLE_GRADE_V01513__=false}
})();
