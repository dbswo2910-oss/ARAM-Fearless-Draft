'use strict';
(()=>{
  const V='0.15.15',clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  try{
    const FAMILY={damage:'offense',carry:'offense',poke:'offense',eff:'economy',burst:'execution',reset:'execution',pick:'execution',dive:'execution',kp:'participation',survival:'survival',absorb:'durability',frontline:'durability',sustainFight:'durability',cc:'control',engage:'control',control:'control',peel:'utility',utility:'utility',allySustain:'utility',selfSustain:'sustain',sustain:'sustain'};
    function familyAudit(items){
      const fam={};let total=0;
      for(const x of (items||[])){if(x.key==='function')continue;const k=FAMILY[x.key]||x.key,w=Math.max(0,Number(x.weight)||0);if(!w)continue;total+=w;const f=fam[k]||(fam[k]={key:k,weight:0,weighted:0,score:0});f.weight+=w;f.weighted+=(Number(x.score)||0)*w}
      const rows=Object.values(fam).map(f=>({...f,score:f.weight?f.weighted/f.weight:0})),strong=rows.filter(f=>f.score>=80),elite=rows.filter(f=>f.score>=88),mass=xs=>total?xs.reduce((a,x)=>a+x.weight,0)/total:0,concentration=total&&rows.length?Math.max(...rows.map(x=>x.weight))/total:1;
      return{rows,total,strongFamilies:strong.length,eliteFamilies:elite.length,strongCoverage:mass(strong),eliteCoverage:mass(elite),concentration};
    }
    function diversityPenalty(a,calibrated){
      if(!a||calibrated<84)return 0;let p=0;
      if(calibrated>=91&&a.strongCoverage<.56)p+=(.56-a.strongCoverage)*14;else if(a.strongCoverage<.42)p+=(.42-a.strongCoverage)*8;
      if(calibrated>=96&&a.eliteCoverage<.48)p+=(.48-a.eliteCoverage)*11;
      if(a.concentration>.46)p+=(a.concentration-.46)*7;
      return Math.max(0,Math.min(5,p));
    }
    function benchmarkScore(name,profile){
      const weighted=aramHistoryRoleV2Items(profile?.items||[]),items=weighted.map(([key,weight])=>({key,weight,score:Math.round(aramHistoryExpectedNormalizeMetric(name,key,88))})),den=items.reduce((a,x)=>a+x.weight,0)||1,raw=items.reduce((a,x)=>a+x.score*x.weight,0)/den,cores=(profile?.core||[]).map(k=>items.find(x=>x.key===k&&k!=='function')).filter(Boolean),coreAvg=cores.length?cores.reduce((a,x)=>a+x.score,0)/cores.length:raw,coreMin=cores.length?Math.min(...cores.map(x=>x.score)):raw,high=items.filter(x=>x.key!=='function'&&x.score>=80).length,cal=aramHistoryV2CalibrateScore(raw),soft=aramHistoryV2SoftPenalty(coreAvg,coreMin,high,cal),fa=familyAudit(items),div=diversityPenalty(fa,cal);
      return Math.max(0,Math.min(100,cal-soft-div));
    }
    function fairAdjustment(name,profile,preScore){
      const bench=benchmarkScore(name,profile),full=Math.max(-4,Math.min(4,91-bench)),ramp=Math.max(0,Math.min(1,((Number(preScore)||0)-76)/12));
      return{benchmark:Math.round(bench*10)/10,full:Math.round(full*10)/10,applied:Math.round(full*ramp*10)/10};
    }
    function topGate(score,coreAvg,coreMin,a){
      let out=score,reason='';const famCount=a?.rows?.length||0;
      if(out>=96){const req=Math.min(3,famCount);if(coreAvg<86||coreMin<68||(a?.eliteCoverage||0)<.48||(a?.strongCoverage||0)<.70||(a?.eliteFamilies||0)<req){out=95;reason='S+ 독립증거 게이트'}}
      if(out>=91){const req=Math.min(2,famCount);if(coreAvg<78||coreMin<58||(a?.strongCoverage||0)<.56||(a?.strongFamilies||0)<req){out=90;reason=reason||'S 독립증거 게이트'}}
      return{score:out,reason};
    }
    aramHistoryRoleBreakdown=function(m){
      const me=m?.me||{},name=aramHistoryResolveParticipant(me),role=aramHistoryRole(name),group=aramHistoryRoleGroup(role),sig=aramHistoryBaseSignals(m),trait=aramHistoryTraitExecution(m),profile=aramHistoryChampionRoleProfile(name,role,m);
      if(!sig)return{role,group,score:null,items:[],trait,power:aramHistoryPowerContext(m),profile};
      const weighted=aramHistoryRoleV2Items(profile.items),items=weighted.map(([key,weight])=>{const def=ARAM_ROLE_METRIC_DEFS[key]||{label:key,detail:''},base=clamp(Number(aramHistoryRoleMetricValue(key,sig,trait))||0),score=Math.round(aramHistoryExpectedNormalizeMetric(name,key,base));return{key,label:def.label,detail:def.detail,score,baseScore:Math.round(base),weight:Math.round(weight*10)/10}}),den=items.reduce((a,x)=>a+x.weight,0)||1,rawScore=items.reduce((a,x)=>a+x.score*x.weight,0)/den,coreItems=profile.core.map(k=>items.find(x=>x.key===k&&x.key!=='function')).filter(Boolean),coreAvg=coreItems.length?coreItems.reduce((a,x)=>a+x.score,0)/coreItems.length:rawScore,coreMin=coreItems.length?Math.min(...coreItems.map(x=>x.score)):rawScore,highEvidence=items.filter(x=>x.key!=='function'&&x.score>=80).length,calibrated=aramHistoryV2CalibrateScore(rawScore),softPenalty=aramHistoryV2SoftPenalty(coreAvg,coreMin,highEvidence,calibrated),family=familyAudit(items),dupPenalty=diversityPenalty(family,calibrated),preFair=clamp(calibrated-softPenalty-dupPenalty),fair=fairAdjustment(name,profile,preFair),preGate=clamp(Math.round(preFair+fair.applied)),gate=topGate(preGate,coreAvg,coreMin,family),score=clamp(Math.round(gate.score));
      return{role,group,score,rawScore:Math.round(rawScore*10)/10,calibratedScore:Math.round(calibrated*10)/10,softPenalty:Math.round(softPenalty*10)/10,diversityPenalty:Math.round(dupPenalty*10)/10,fairAdjustment:fair.applied,fairBenchmark:fair.benchmark,gateReason:gate.reason,items,trait,power:aramHistoryPowerContext(m),profile,coreAvg:Math.round(coreAvg),coreMin:Math.round(coreMin),highEvidence,family,gradeModel:'ROLE GRADE v4 FAIR-S'};
    };
    aramHistoryRoleBreakdownHtml=function(m){
      const r=aramHistoryRoleBreakdown(m);if(r.score===null)return'<div class="historyEmpty">10인 상세 데이터가 있어야 역할별 수행지표를 계산할 수 있습니다.</div>';
      const traits=(r.trait?.traits||[]).slice(0,4),p=r.profile||{},sig=aramHistoryBaseSignals(m),fam=r.family||{},pct=x=>Math.round((Number(x)||0)*100);
      return `<div class="historyRolePanel"><div class="historyRoleHead"><div><b>${aramHistoryEsc(r.role)} 역할 수행지표 · ${aramHistoryEsc(p.identity||p.label||'')}</b><span>${p.classified?'챔피언 개별 프로필':'역할 공통 임시 프로필'} · ROLE GRADE v4 FAIR-S · 173챔 동일 S 난이도 + 독립 증거군</span></div><em>${r.score}/100 · ROLE INDEX v4</em></div><div class="historyRoleGrid">${r.items.map(x=>{const tone=x.score>=80?'good':x.score<45?'bad':x.score<60?'warn':'';return `<div class="historyRoleMetric ${tone}"><div class="rh"><span>${aramHistoryEsc(x.label)}</span><b>${x.score}</b></div><div class="rb"><i style="width:${x.score}%"></i></div><small>${aramHistoryEsc(x.detail)} · 비중 ${Math.round(x.weight)}%</small></div>`}).join('')}</div><div class="historyRoleAudit"><span>핵심축 평균 <b>${r.coreAvg}</b></span><span>핵심축 최저 <b>${r.coreMin}</b></span><span>독립증거 80+ <b>${fam.strongFamilies||0}개 · ${pct(fam.strongCoverage)}%</b></span><span>엘리트증거 88+ <b>${fam.eliteFamilies||0}개 · ${pct(fam.eliteCoverage)}%</b></span>${sig?`<span>피해흡수 <b>${sig.absorb}</b></span>`:''}</div><div class="historyRoleCalibration"><span>원점수 <b>${r.rawScore}</b></span><span>분포 교정 <b>${r.calibratedScore}</b></span><span>핵심축 <b>-${r.softPenalty}</b></span><span>중복증거 <b>-${r.diversityPenalty}</b></span><span>S난이도 보정 <b>${r.fairAdjustment>=0?'+':''}${r.fairAdjustment}</b></span><span>88점 표준벤치 <b>${r.fairBenchmark}</b></span></div>${r.gateReason?`<div class="historyModelNote"><b>${aramHistoryEsc(r.gateReason)}</b> · S/S+는 서로 다른 성과군에서 충분한 증거가 있어야 합니다.</div>`:''}${traits.length?`<div class="historyFunctionChips">${traits.map(x=>`<span>${aramHistoryEsc(x.key)} <b>${x.expected.toFixed(1)}/5</b> · 관측 ${x.score}</span>`).join('')}</div>`:''}<div class="historyModelNote">※ 챔피언별 역할 템플릿과 Function18 기대축은 유지하면서 동일한 정규화 성과 88/100이면 173챔 모두 S 경계에 도달하도록 상위등급 난이도를 교정합니다. 이는 전세계 플레이어 백분위가 아니라 앱 내부 점수식 공정성 교정입니다.</div></div>`;
    };
    const oldSummary=aramHistorySummaryHtml;aramHistorySummaryHtml=function(matches){return String(oldSummary(matches)||'').replace(/ROLE GRADE v3/g,'ROLE GRADE v4')};
    const oldTable=aramHistoryTeamStatTable;aramHistoryTeamStatTable=function(...args){return String(oldTable.apply(this,args)||'').replace(/ROLE GRADE v3/g,'ROLE GRADE v4')};
    if(typeof DATA!=='undefined'){DATA.version=V;DATA.role_grade_v4_v01515={version:'v0.15.15 · ROLE GRADE v4 FAIR-S',coverage:'173/173 champion role profiles',grade_cut:{Splus:96,S:91,Aplus:84,A:76,B:64,C:52},fair_s:{standardized_elite_evidence:88,target_score:91,max_champion_adjustment:4,independent_family_gate:true},global_population_percentile:false}}
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    window.__ARAM_ROLE_GRADE_V01515__=true;
  }catch(e){console.error('[v0.15.15] ROLE GRADE v4 FAIR-S patch failed',e);window.__ARAM_ROLE_GRADE_V01515__=false}
})();
