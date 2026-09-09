'use strict';
(()=>{
  const V='0.15.29';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const clamp5=v=>clamp(v,0,5);
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const esc=s=>{try{return aramHistoryEsc(String(s??''))}catch{return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}};
  const norm=s=>String(s??'').toLowerCase().replace(/[\s'’._-]/g,'');
  const round1=v=>Math.round(num(v)*10)/10;

  const DIRECT_METRIC_OBS={damage:.98,eff:.96,kp:.98,survival:.98,absorb:.94,allySustain:.93,selfSustain:.90,cc:.90,carry:.82,burst:.82,frontline:.72,engage:.62,peel:.58,utility:.58,poke:.80,dive:.62,reset:.68,control:.60,pick:.66,sustainFight:.70,function:.60};
  const AXIS_OBS={'프론트라인':.72,'이니시':.60,'캐치':.68,'CC':.90,'보호/필':.56,'역이니시/디스인게이지':.54,'포킹':.82,'순간폭딜':.84,'지속딜':.84,'광역 한타력':.68,'라인 클리어':.82,'대탱커':.78,'다이브/후방 접근':.58,'공간 장악':.55,'유지력':.78,'기동성/재포지셔닝':.42,'유효 사거리':.38,'공성/구조물 압박':.58};
  const SPECIAL_OBS={
    renata:{'보호/필':.30,'유지력':.42,'역이니시/디스인게이지':.42},'레나타글라스크':{'보호/필':.30,'유지력':.42,'역이니시/디스인게이지':.42},레나타:{'보호/필':.30,'유지력':.42,'역이니시/디스인게이지':.42},
    zilean:{'보호/필':.28,'유지력':.34},질리언:{'보호/필':.28,'유지력':.34},taric:{'보호/필':.36,'역이니시/디스인게이지':.38},타릭:{'보호/필':.36,'역이니시/디스인게이지':.38},
    kayle:{'보호/필':.36},케일:{'보호/필':.36},kindred:{'보호/필':.35,'역이니시/디스인게이지':.38},킨드레드:{'보호/필':.35,'역이니시/디스인게이지':.38},
    milio:{'보호/필':.36,'유효 사거리':.24,'유지력':.66},밀리오:{'보호/필':.36,'유효 사거리':.24,'유지력':.66},lulu:{'보호/필':.48,'기동성/재포지셔닝':.35},룰루:{'보호/필':.48,'기동성/재포지셔닝':.35},
    nami:{'보호/필':.50},나미:{'보호/필':.50},sona:{'기동성/재포지셔닝':.28,'보호/필':.55},소나:{'기동성/재포지셔닝':.28,'보호/필':.55},
    braum:{'보호/필':.34,'역이니시/디스인게이지':.40},브라움:{'보호/필':.34,'역이니시/디스인게이지':.40},yasuo:{'보호/필':.30,'공간 장악':.40},야스오:{'보호/필':.30,'공간 장악':.40},samira:{'보호/필':.30},사미라:{'보호/필':.30},
    xinzhao:{'보호/필':.34,'공간 장악':.44},신짜오:{'보호/필':.34,'공간 장악':.44},morgana:{'보호/필':.34},모르가나:{'보호/필':.34},poppy:{'역이니시/디스인게이지':.38,'공간 장악':.44},뽀삐:{'역이니시/디스인게이지':.38,'공간 장악':.44},
    thresh:{'보호/필':.32,'기동성/재포지셔닝':.30},쓰레쉬:{'보호/필':.32,'기동성/재포지셔닝':.30},anivia:{'공간 장악':.38},애니비아:{'공간 장악':.38},trundle:{'공간 장악':.38},트런들:{'공간 장악':.38},bard:{'공간 장악':.38,'보호/필':.36},바드:{'공간 장악':.38,'보호/필':.36}
  };
  const SPECIAL_MISSION={
    malphite:{minCap:.55},말파이트:{minCap:.55},amumu:{minCap:.55},아무무:{minCap:.55},rell:{minCap:.55},렐:{minCap:.55},leona:{minCap:.50},레오나:{minCap:.50},nautilus:{minCap:.50},노틸러스:{minCap:.50},alistar:{minCap:.50},알리스타:{minCap:.50},rakan:{minCap:.50},라칸:{minCap:.50},
    kennen:{minCap:.44},케넨:{minCap:.44},lissandra:{minCap:.44},리산드라:{minCap:.44},fiddlesticks:{minCap:.44},피들스틱:{minCap:.44},neeko:{minCap:.42},니코:{minCap:.42},wukong:{minCap:.42},오공:{minCap:.42},diana:{minCap:.40},다이애나:{minCap:.40},
    jarvaniv:{minCap:.42},자르반4세:{minCap:.42},vi:{minCap:.40},바이:{minCap:.40},sett:{minCap:.38},세트:{minCap:.38},xinzhao:{minCap:.38},신짜오:{minCap:.38},
    jax:{maxCap:.34},잭스:{maxCap:.34},pantheon:{maxCap:.34},판테온:{maxCap:.34},camille:{maxCap:.32},카밀:{maxCap:.32},
    karthus:{postDeath:true,minCap:.36},카서스:{postDeath:true,minCap:.36},sion:{postDeath:true,minCap:.36},사이온:{postDeath:true,minCap:.36}
  };

  function fprofile(name){try{return aramHistoryFunctionProfile(name)||{}}catch{return{}}}
  const fv=(f,k)=>clamp5(num(f?.[k],0));
  function missionProfile(name,sig=null){
    const f=fprofile(name),eng=fv(f,'이니시'),dive=fv(f,'다이브/후방 접근'),front=fv(f,'프론트라인'),aoe=fv(f,'광역 한타력'),cc=fv(f,'CC'),pick=fv(f,'캐치'),control=fv(f,'공간 장악'),sustain=fv(f,'지속딜'),heal=fv(f,'유지력'),range=fv(f,'유효 사거리'),poke=fv(f,'포킹'),mob=fv(f,'기동성/재포지셔닝');
    const primary=clamp5(eng*.50+front*.20+cc*.20+aoe*.10),follow=clamp5(dive*.34+aoe*.28+cc*.20+pick*.18),lockdown=clamp5(cc*.56+pick*.44),aoeImpact=clamp5(aoe*.55+control*.25+cc*.20);
    const survivalNeed=clamp5(sustain*.36+heal*.18+mob*.14+range*.12+poke*.08+(5-primary)*.12);
    let commitment=clamp5(primary*.48+follow*.30+front*.12+aoeImpact*.10-survivalNeed*.10);
    const special=SPECIAL_MISSION[norm(name)]||{};
    if(special.postDeath)commitment=clamp5(commitment+.35);
    let cap=clamp(.08+commitment/5*.56-survivalNeed/5*.22,.05,.60);
    if(sig){
      const frontBias=(num(sig.absorb)+num(sig.frontline)+num(sig.engage))/3-(num(sig.damage)+num(sig.carry))/2;
      cap+=clamp(frontBias/400,-.08,.08);
    }
    if(Number.isFinite(special.minCap))cap=Math.max(cap,special.minCap);
    if(Number.isFinite(special.maxCap))cap=Math.min(cap,special.maxCap);
    cap=clamp(cap,.05,.60);
    const type=commitment>=4.1&&survivalNeed<3.2?'고약속 선진입':commitment>=3.2?'진입·한타개시':commitment>=2.3?'조건부 진입':'생존 우선';
    return{name,commitment:round1(commitment),primary:round1(primary),follow:round1(follow),lockdown:round1(lockdown),aoeImpact:round1(aoeImpact),survivalNeed:round1(survivalNeed),refundCap:round1(cap*100)/100,postDeath:!!special.postDeath,type,function18:f};
  }
  function axisObs(name,axis){const sp=SPECIAL_OBS[norm(name)]||{};return clamp(sp[axis]??AXIS_OBS[axis]??.68,0,1)}
  function metricObs(name,key){
    if(key==='function'){
      const f=fprofile(name),xs=Object.entries(f).filter(([,v])=>num(v)>0);if(!xs.length)return DIRECT_METRIC_OBS.function;
      const den=xs.reduce((a,[,v])=>a+num(v),0)||1;return xs.reduce((a,[k,v])=>a+axisObs(name,k)*num(v),0)/den;
    }
    let axes=[];try{axes=Array.isArray(ARAM_ROLE_EXPECTED_AXIS_MAP?.[key])?ARAM_ROLE_EXPECTED_AXIS_MAP[key]:[]}catch{}
    if(axes.length){const f=fprofile(name),ws=axes.map(k=>[k,Math.max(.5,fv(f,k))]),den=ws.reduce((a,x)=>a+x[1],0)||1;return ws.reduce((a,[k,w])=>a+axisObs(name,k)*w,0)/den}
    return DIRECT_METRIC_OBS[key]??.72;
  }
  function observability(r,name){
    const items=r?.items||[];if(!items.length)return{confidence:1,correction:0,rawAdjusted:r?.rawScore||0,rows:[]};
    const rows=items.map(x=>({...x,observability:metricObs(name,x.key)})),total=rows.reduce((a,x)=>a+num(x.weight),0)||1,effDen=rows.reduce((a,x)=>a+num(x.weight)*(.55+.45*x.observability),0)||1;
    const rawAdjusted=rows.reduce((a,x)=>a+num(x.score)*num(x.weight)*(.55+.45*x.observability),0)/effDen;
    const confidence=rows.reduce((a,x)=>a+x.observability*num(x.weight),0)/total,low=clamp((.82-confidence)/.42,0,1),delta=(rawAdjusted-num(r?.rawScore))*low*.70,correction=round1(clamp(delta,-3,5));
    return{confidence:round1(confidence*100)/100,correction,rawAdjusted:round1(rawAdjusted),rows};
  }
  function survivalFromDeaths(m,s,effectiveDeaths){
    const mins=Math.max(1,num(m?.gameDuration,60)/60),d10=effectiveDeaths/mins*10,rel=d10-num(s?.teamAvgDeathsPer10),abs=Math.round(aramHistoryCurve(d10,[[2,95],[3,86],[4,72],[5,58],[6,44],[7.5,25],[9,10],[11,0]])),relScore=Math.round(aramHistoryCurve(rel,[[-3,96],[-2,88],[-1,76],[0,62],[1,48],[2,33],[3,19],[4.5,6],[6,0]]));return{score:Math.round(abs*.50+relScore*.50),abs,rel:relScore,d10,delta:rel}
  }
  function withSurvival(s,survival){
    const o={...s,survival};
    o.frontline=Math.round(o.absorb*.60+o.kp*.25+survival*.15);
    o.carry=Math.round(o.damage*.50+o.eff*.25+o.kp*.20+survival*.05);
    o.poke=Math.round(o.damage*.52+o.eff*.25+o.kp*.18+survival*.05);
    o.dive=Math.round(o.burst*.38+o.kp*.28+o.frontline*.26+survival*.08);
    o.reset=Math.round(o.burst*.36+o.damage*.24+o.kp*.30+survival*.10);
    o.control=Math.round(o.cc*.50+o.kp*.28+o.damage*.17+survival*.05);
    o.pick=Math.round(o.burst*.32+o.cc*.28+o.kp*.24+o.dive*.12+survival*.04);
    o.sustainFight=Math.round(o.damage*.32+o.frontline*.25+o.selfSustain*.25+o.kp*.15+survival*.03);
    return o;
  }
  function weightedRaw(name,profile,sig,trait){
    const weighted=typeof aramHistoryRoleV2Items==='function'?aramHistoryRoleV2Items(profile?.items||[]):profile?.items||[],rows=weighted.map(([key,weight])=>{const base=clamp(num(aramHistoryRoleMetricValue(key,sig,trait)));return{key,weight:num(weight),score:Math.round(aramHistoryExpectedNormalizeMetric(name,key,base))}}),den=rows.reduce((a,x)=>a+x.weight,0)||1;return rows.reduce((a,x)=>a+x.score*x.weight,0)/den;
  }
  function executionEvidence(sig,p){
    const engageNeed=(p.primary+p.follow)/10,lockNeed=p.lockdown/5,aoeNeed=p.aoeImpact/5,frontNeed=p.commitment/5;
    const den=engageNeed+lockNeed+aoeNeed+frontNeed||1;
    const engageScore=Math.max(num(sig.engage),num(sig.dive)),lockScore=Math.max(num(sig.cc),num(sig.pick)),aoeScore=Math.max(num(sig.control),num(sig.damage),num(sig.burst)),frontScore=Math.max(num(sig.absorb),num(sig.frontline));
    return clamp((engageScore*engageNeed+lockScore*lockNeed+aoeScore*aoeNeed+frontScore*frontNeed)/den*.82+num(sig.kp)*.18);
  }
  function deathFairness(m,r,name,sig,p){
    const tl=m?.missionTimelineV01529,actualDeaths=Math.max(0,num(m?.me?.deaths)),execution=executionEvidence(sig,p);
    const none={available:!!tl?.available,actualDeaths,productiveDeaths:num(tl?.productiveDeaths),strongDeaths:num(tl?.strongDeaths),execution:round1(execution),refund:0,refundableDeaths:0,effectiveSurvival:num(sig?.survival),reason:''};
    if(!tl?.available){none.reason='Timeline 미제공 · 데스 보정 없음';return none}
    if(actualDeaths<=0||tl.productiveDeaths<=0){none.reason='검증된 교환/후속성과 데스 없음';return none}
    if(p.commitment<2.0&&!p.postDeath){none.reason='챔피언 임무상 희생 데스 면책 대상이 아님';return none}
    if(execution<50){none.reason='진입/CC/흡수/한타 수행 증거가 부족해 환급하지 않음';return none}
    const strongRatio=tl.productiveDeaths?tl.strongDeaths/tl.productiveDeaths:0,quality=clamp((execution-45)/45,.20,1)*(.78+.22*strongRatio),refundableDeaths=Math.min(actualDeaths,tl.productiveDeaths*p.refundCap*quality),effectiveDeaths=Math.max(0,actualDeaths-refundableDeaths),surv=survivalFromDeaths(m,sig,effectiveDeaths),adjSig=withSurvival(sig,Math.max(num(sig.survival),surv.score)),rawAdj=weightedRaw(name,r.profile,adjSig,r.trait),potential=Math.max(0,rawAdj-num(r.rawScore)),refund=round1(clamp(potential,0,4));
    return{available:true,actualDeaths,productiveDeaths:tl.productiveDeaths,strongDeaths:tl.strongDeaths,execution:round1(execution),refund,refundableDeaths:round1(refundableDeaths),effectiveDeaths:round1(effectiveDeaths),effectiveSurvival:surv.score,actualSurvival:num(sig.survival),reason:refund>0?'검증된 희생 데스의 생존 페널티 일부만 환급':'생존 페널티 환급 가능한 차이 없음',timeline:tl};
  }
  function auditNames(){
    const pools=[];try{if(typeof byName!=='undefined'&&byName)pools.push(Object.keys(byName))}catch{}try{if(window.byName)pools.push(Object.keys(window.byName))}catch{}try{if(Array.isArray(DATA?.champions))pools.push(DATA.champions.map(x=>x?.name||x).filter(Boolean))}catch{}return pools.sort((a,b)=>b.length-a.length)[0]||[];
  }
  function auditAll(){const names=auditNames(),profiles=names.map(n=>missionProfile(n));return{count:names.length,expected:173,complete:names.length===173,profiles}}
  function installStyle(){if(document.getElementById('mdf29Style'))return;const s=document.createElement('style');s.id='mdf29Style';s.textContent=`.missionFair29{margin-top:9px;border:1px solid #324a65;background:#0a1727;border-radius:10px;padding:9px 10px}.missionFair29 h4{margin:0 0 7px;font-size:10px;color:#d7e9fb}.missionFair29Grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.missionFair29Grid>div{border:1px solid #263e57;background:#0b1b2e;border-radius:8px;padding:7px}.missionFair29Grid span{display:block;color:#7890aa;font-size:7px}.missionFair29Grid b{display:block;margin-top:2px;font-size:11px}.missionFair29Note{margin-top:7px;color:#8198b2;font-size:7.5px;line-height:1.45}.missionFair29 .good{color:#75e3b0}.missionFair29 .warn{color:#f1cf74}@media(max-width:760px){.missionFair29Grid{grid-template-columns:1fr 1fr}}`;document.head.appendChild(s)}
  function extraHtml(r){
    const d=r?.deathFairnessV01529,o=r?.observabilityV01529,p=r?.missionProfileV01529;if(!p)return'';const tl=d?.available?`${d.productiveDeaths}/${d.actualDeaths} 유효 · 강한 증거 ${d.strongDeaths}`:'Timeline 대기',obs=Math.round(num(o?.confidence,1)*100),corr=num(o?.correction),refund=num(d?.refund);
    return `<div class="missionFair29"><h4>MISSION / DEATH FAIRNESS · 챔피언 임무 기반</h4><div class="missionFair29Grid"><div><span>진입 약속도</span><b>${p.commitment.toFixed(1)}/5 · ${esc(p.type)}</b></div><div><span>희생 데스 상한</span><b>${Math.round(p.refundCap*100)}%</b></div><div><span>데스 효율 증거</span><b class="${d?.productiveDeaths?'good':'warn'}">${esc(tl)}</b></div><div><span>생존 페널티 환급</span><b>${refund>0?`+${refund.toFixed(1)}점`:'0점'}</b></div><div><span>실제 생존 능력</span><b>${Math.round(num(d?.actualSurvival,num(r?.items?.find(x=>x.key==='survival')?.score)))}</b></div><div><span>환급 계산용 생존</span><b>${Math.round(num(d?.effectiveSurvival,num(d?.actualSurvival)))}</b></div><div><span>기능 관측 신뢰</span><b>${obs}%</b></div><div><span>관측성 보정</span><b>${corr>0?'+':''}${corr.toFixed(1)}점</b></div></div><div class="missionFair29Note">${esc(d?.reason||'')} · 생존 능력 자체를 높여 표시하지 않고, 검증된 희생 데스가 있을 때 기존 생존/데스 페널티에서 발생한 손실 일부만 환급합니다. CC·이니시·피해흡수에서 이미 받은 점수를 다시 보너스로 더하지 않습니다. 기능 관측성이 낮은 챔피언은 측정 불가 축을 0점처럼 취급하지 않도록 비중을 제한적으로 재분배하며 신뢰도를 함께 표시합니다.</div></div>`;
  }

  try{
    const oldBreak=window.aramHistoryRoleBreakdown;if(typeof oldBreak!=='function')throw new Error('aramHistoryRoleBreakdown unavailable');
    window.aramHistoryRoleBreakdown=function(m){
      const r=oldBreak.apply(this,arguments);if(!r||r.score==null)return r;
      try{
        const name=aramHistoryResolveParticipant(m?.me||{}),sig=aramHistoryBaseSignals(m),p=missionProfile(name,sig),o=observability(r,name),d=deathFairness(m,r,name,sig,p),baseScore=num(r.score),positive=o.correction+d.refund;
        let next=clamp(baseScore+o.correction+d.refund);if(baseScore<91)next=Math.min(90,next);else if(positive>0)next=Math.min(baseScore,next);
        r.scoreBeforeMissionV01529=baseScore;r.score=Math.round(next);r.observabilityV01529=o;r.deathFairnessV01529=d;r.missionProfileV01529=p;r.missionAdjustmentV01529=round1(r.score-baseScore);r.gradeModel='ROLE GRADE v4 FAIR-S + Mission/Death Fairness';
      }catch(e){r.missionFairnessErrorV01529=e?.message||String(e)}return r;
    };
    const oldHtml=window.aramHistoryRoleBreakdownHtml;if(typeof oldHtml==='function')window.aramHistoryRoleBreakdownHtml=function(m){installStyle();const h=String(oldHtml.apply(this,arguments)||''),r=aramHistoryRoleBreakdown(m);return h+extraHtml(r)};
    window.aramMissionDeathV01529={missionProfile,observability,deathFairness,auditAll,axisObs,metricObs};window.__ARAM_MISSION_DEATH_FAIRNESS_V01529__=true;
    if(typeof DATA!=='undefined'){DATA.version=V;DATA.mission_death_fairness_v01529={version:'v0.15.29 · Champion Mission / Death Fairness',profile_source:'champion-specific Function18 + named mechanic safeguards',timeline_source:'/lol-match-history/v1/game-timelines/{gameId}',death_refund:'penalty refund only; max 4 ROLE points; cannot create S from sub-S score',observability:'low-observability axes are downweighted and redistributed; no free champion bonus',exact_spell_scene_inference:false,expected_champion_coverage:173}}
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();installStyle();
  }catch(e){console.error('[v0.15.29] Mission/death fairness failed',e);window.__ARAM_MISSION_DEATH_FAIRNESS_V01529__=false}
})();
