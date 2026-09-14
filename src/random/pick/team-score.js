'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const INSTALLED_BASELINE_VERSION='0.15.49';
const INSTALLED_INDEX_SHA256='8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906';
const INSTALLED_TEAM_SCORE_SHA256='6b1c791d915eb11c2f84310001f8a639b21bef21f15aed0096e6318cd5fcac01';
const REQUIRED_DEPS=["unique", "compProfiles", "compMetrics", "nval", "teamPairScore", "teamRouteFit", "randomCanonicalExtra", "randomRoleStructurePenalty", "meaningfulDamageTotals", "meaningfulDamageSources", "randomSynergyLayer", "teamSpecialUtilityScore"];
function requireDeps(deps){
  for(const name of REQUIRED_DEPS)if(typeof deps?.[name]!=='function')throw new Error(`teamScore dependency missing: ${name}`);
  return deps;
}
function createTeamScore(deps){
  const d=requireDeps(deps);
  const {unique,compProfiles,compMetrics,nval,teamPairScore,teamRouteFit,randomCanonicalExtra,randomRoleStructurePenalty,meaningfulDamageTotals,meaningfulDamageSources,randomSynergyLayer,teamSpecialUtilityScore}=d;

function teamScore(names,modes={}){
 const used=unique((names||[]).filter(Boolean)),ps=compProfiles(used,modes),m=compMetrics(used,modes),overall=ps.reduce((x,c)=>x+nval(c['종합점수']),0),adc=ps.filter(c=>c['주 역할']==='원딜').length,support=ps.filter(c=>c['주 역할']==='서포터').length,wombo=ps.reduce((x,c)=>x+nval(c['웜보태그']),0),hyper=ps.reduce((x,c)=>x+nval(c['하이퍼캐리태그']),0),pokeTag=ps.reduce((x,c)=>x+nval(c['포킹시즈태그']),0),antiTag=ps.reduce((x,c)=>x+nval(c['안티다이브태그']),0),reset=ps.reduce((x,c)=>x+nval(c['리셋태그']),0),pair=teamPairScore(used),routeFit=teamRouteFit(used),canonical=randomCanonicalExtra(used,modes),role=randomRoleStructurePenalty(used,m,modes),dmg=meaningfulDamageTotals(used,modes),dmgSources=meaningfulDamageSources(used,modes),meta={pair,routeFit,wombo,hyper,pokeTag,antiTag,reset};
 // 완성조합에는 '선픽 안정성'을 다시 더하지 않는다. 개인 체급 + 실제 기능 커버리지 + 구조 + 시너지로만 평가.
 let score=overall*.75+Math.min(nval(m['프론트']),14)*3+Math.min(nval(m['이니시']),12)*2.8+Math.min(nval(m['지속딜']),14)*2.6+Math.min(nval(m['포킹']),14)*1.2+Math.min(nval(m['라클']),12)*1.6+Math.min(nval(m['보호'])+nval(m['역이니시']),18)*1.5+Math.min(nval(m['대탱']),12)*1.2+Math.min(nval(m['캐치']),12)*1.1+canonical.score;
 const gap={front:nval(m['프론트'])<7?(7-nval(m['프론트']))*8:0,engage:nval(m['이니시'])<6?(6-nval(m['이니시']))*7:0,dps:nval(m['지속딜'])<7?(7-nval(m['지속딜']))*7:0,wave:nval(m['라클'])<5?(5-nval(m['라클']))*4:0,peel:nval(m['보호'])+nval(m['역이니시'])<6?(6-(nval(m['보호'])+nval(m['역이니시'])))*3:0};
 const gapPenalty=Object.values(gap).reduce((a,b)=>a+nval(b),0);score-=gapPenalty+role.penalty;
 // 탱커/서폿의 1.2 미만 보조 피해는 AD/AP 밸런스에서 제외한다.
 let damagePenalty=0,damageBonus=0;if(dmg.ad>=6&&dmg.ap<2.5)damagePenalty+=(2.5-dmg.ap)*12;else if(dmg.ap>=6&&dmg.ad<2.5)damagePenalty+=(2.5-dmg.ad)*12;damagePenalty+=Math.max(0,Math.abs(dmg.ad-dmg.ap)-8)*2.3;damageBonus+=Math.min(dmg.ad,dmg.ap)>=3?8:Math.min(dmg.ad,dmg.ap)>=2?4:0;score-=damagePenalty;score+=damageBonus;
 const synergy=randomSynergyLayer(used,m,meta),specialUtility=teamSpecialUtilityScore(used,synergy,modes);score+=synergy.score+specialUtility.score;score=Math.round(score*10)/10;
 let direction='밸런스 FTB';if(hyper>=1&&pair.score>=17&&nval(m['보호'])+nval(m['역이니시'])>=10)direction='하이퍼캐리 보호 FTB';else if(wombo>=2&&nval(m['이니시'])>=10)direction='광역 웜보';else if(pokeTag>=3&&nval(m['포킹'])>=12)direction='극포킹 시즈';else if(antiTag>=3&&nval(m['보호'])+nval(m['역이니시'])>=12)direction='안티다이브 벙커';else if(reset>=1&&nval(m['다이브'])>=10)direction='리셋 스노우볼';else if(nval(m['프론트'])>=12&&nval(m['지속딜'])>=11)direction='정석 FTB';else if(nval(m['이니시'])>=10&&nval(m['다이브'])>=10)direction='하드이니시/다이브';else if(nval(m['캐치'])>=10&&nval(m['포킹'])>=9)direction='포킹+캐치';
 let reason='';if(pair.score>=17)reason+=`ADC×유틸 ${Math.round(pair.score)}/20 · `;if(synergy.directPairRating>=8.5)reason+=`직접 궁합 ${synergy.directPairRating.toFixed(1)}/10 · `;if(routeFit.score>=10)reason+=`41루트 ${routeFit.routeName} ${routeFit.hits}/4축 · `;if(wombo>=2)reason+='광역 웜보축 · ';if(nval(m['프론트'])>=10&&nval(m['이니시'])>=8)reason+='프론트+시동 · ';if(nval(m['지속딜'])>=10&&nval(m['보호'])+nval(m['역이니시'])>=10)reason+='지속딜+보호 · ';if(pokeTag>=3&&nval(m['포킹'])>=10)reason+='포킹 시즈 · ';if(canonical.axes.aoe>=6.5||canonical.axes.zone>=6)reason+='광역/공간 장악 · ';if(specialUtility.bushBonus>=1.2)reason+=`부쉬 대응 ${specialUtility.bush.value.toFixed(1)} · `;if(specialUtility.allyBonus>=1.2&&specialUtility.ally.best)reason+=`증폭 ${specialUtility.ally.best.provider}→${specialUtility.ally.best.target} · `;reason+=Math.min(dmg.ad,dmg.ap)>=2.5?'실질 AD/AP 균형':dmg.ad>dmg.ap?'실질 AP 딜 부족':'실질 AD 딜 부족';
 let warning='큰 구조 결함 없음 · 상대 공개 후 세부 운영 조정';const core=role.core;if(adc>1)warning='2원딜 구조 · 캐리 보호/딜 역할 중복 확인';else if(support>1&&(core<15.5||nval(m['지속딜'])<8||nval(m['프론트'])<6))warning='2서폿 구조 · 실제 딜축/전열 부족';else if(support>1)warning='보호형 2서폿 · 핵심 딜축은 확보, 상대 조합 확인';else if(role.noAdcPenalty>=20)warning='원딜 부재 · 실질 지속딜/대탱 보완 필요';else if(dmg.ad>=6&&dmg.ap<2.5)warning='실질 AP 딜 부족 · 보조 AP는 딜러로 계산하지 않음';else if(dmg.ap>=6&&dmg.ad<2.5)warning='실질 AD 딜 부족 · 보조 AD는 딜러로 계산하지 않음';else if(nval(m['프론트'])<7)warning='전열 부족 · 하드다이브 주의';else if(nval(m['이니시'])<6)warning='강제 시동 부족 · 포킹/상대 실수 의존';else if(nval(m['지속딜'])<7)warning='지속딜 부족 · 장기전/투탱 주의';
 const structure=`프론트 ${Math.round(nval(m['프론트']))} / 이니시 ${Math.round(nval(m['이니시']))} / 지속딜 ${Math.round(nval(m['지속딜']))} / 포킹 ${Math.round(nval(m['포킹']))} / 라클 ${Math.round(nval(m['라클']))} / 보호·역이니시 ${Math.round(nval(m['보호'])+nval(m['역이니시']))} / 대탱 ${Math.round(nval(m['대탱']))} / 부쉬 ${specialUtility.bush.value.toFixed(1)} / 증폭연계 ${specialUtility.ally.value.toFixed(1)} / 광역 ${canonical.axes.aoe.toFixed(1)} / 공간 ${canonical.axes.zone.toFixed(1)} / 사거리 ${canonical.axes.range.toFixed(1)} / 실질AD ${dmg.ad.toFixed(1)} / 실질AP ${dmg.ap.toFixed(1)}`;
 return{s:score,m,direction,reason,warning,structure,pair,parts:{overall:overall*.75,first:0,canonicalExtra:canonical.score,canonicalAxes:canonical.axes,gapPenalty,gap,rolePenalty:role.penalty,roleWhy:role.why,coreDamage:role.core,noAdcPenalty:role.noAdcPenalty,meaningfulAD:dmg.ad,meaningfulAP:dmg.ap,damageSources:dmgSources,damagePenalty,damageBonus,synergy:synergy.score,synergyDetail:synergy,specialUtility:specialUtility.score,specialBush:specialUtility.bushBonus,specialAlly:specialUtility.allyBonus,specialUtilityDetail:specialUtility,routeFit:routeFit.score,routeName:routeFit.routeName,routeHits:routeFit.hits,wombo,hyper,pokeTag,antiTag,reset,adc,support}}
}

  return teamScore;
}
function decorateCatchSurvival(baseTeamScore,teamSurvival){
  if(typeof baseTeamScore!=='function')throw new Error('base teamScore function required');
  if(typeof teamSurvival!=='function')throw new Error('teamSurvival function required');
  return function teamScore(names,modes={}){
    const x=baseTeamScore(names,modes);if(!x)return x;
    const catchScore=Number(x.m?.['캐치'])||0,s=teamSurvival(names,modes);
    x.parts=x.parts||{};x.parts.catchResilience=s;x.catchSurvival=s.score;
    if(typeof x.structure==='string')x.structure+=` / 캐치 ${Math.round(catchScore)} / 생존 ${Math.round(s.score)}`;
    return x;
  };
}
module.exports={
  IMPLEMENTATION_VERSION,INSTALLED_BASELINE_VERSION,INSTALLED_INDEX_SHA256,INSTALLED_TEAM_SCORE_SHA256,
  REQUIRED_DEPS,createTeamScore,decorateCatchSurvival,
  production_active:false,scoring_math_owned:true,score_logic_changed:false,random_scoring_changed:false
};
