'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const CATEGORIES=Object.freeze(['밸류','포킹','돌진','강한 이니시','캐치/CC','전열 처리','유지력','광역 한타']);
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const clamp=(v,a=0,b=1.4)=>Math.max(a,Math.min(b,n(v)));
const names=xs=>(xs||[]).filter(Boolean);
const confidence=c=>[0,.38,.66,.88,.95,1][Math.min(5,Math.max(0,c))]||1;
function createRiskEngine({compMetrics,byName={},partialCatch}={}){
  if(typeof compMetrics!=='function')throw new Error('compMetrics function required');
  const metric=(xs,key)=>{try{return n(compMetrics(names(xs))?.[key])}catch{return 0}};
  const density=(xs,key)=>{const a=names(xs);return a.length?metric(a,key)/a.length:0};
  const direct=(name,key)=>n(byName?.[name]?.[key]);
  const f18=(name,key)=>n(byName?.[name]?.['기능프로필18']?.[key]);
  const feature=(name,keys)=>{let best=0;for(const key of keys||[])best=Math.max(best,direct(name,key),f18(name,key));return best};
  const avgFeature=(xs,keys)=>{const a=names(xs);return a.length?a.reduce((s,x)=>s+feature(x,keys),0)/a.length:0};
  const targetStrength=(xs,key,target5)=>{const a=names(xs),count=a.length;if(!count)return 0;const scaled=Math.max(.8,n(target5)*(count/5));return clamp((metric(a,key)/scaled)*confidence(count),0,1.5)};
  const responseStrength=(xs,parts)=>{const a=names(xs);if(!a.length)return 0;let total=0,weight=0;for(const p of parts||[]){const[key,target,w=1]=p;total+=clamp(metric(a,key)/Math.max(.8,target*(a.length/5)),0,1.4)*w;weight+=w}return weight?clamp(total/weight,0,1.2):0};
  function topSources(type,state){
    const enemy=names(state.enemy),map={value:['후반','후반밸류','후반 파워','후반파워','스케일링','성장','지속딜','보호'],poke:['포킹','유효 사거리','장거리 포킹'],dive:['다이브','다이브/후방 접근','후방 접근','진입'],engage:['이니시','강제진입','CC','광역 CC'],catch:['캐치','CC','장거리 CC'],frontline:['프론트','탱킹','전열','내구'],sustain:['유지력','회복','회복/보호막','힐/보호막','보호막','치유','아군 회복'],aoe:['광역 한타','광역딜','광역 피해','AOE','광역 CC','이니시','CC']},keys=map[type]||[];
    const rows=enemy.map(name=>{let v=feature(name,keys);if(type==='value')v=Math.max(v,direct(name,'지속딜')*.75,direct(name,'보호')*.65);if(type==='frontline')v=Math.max(v,direct(name,'프론트'));if(type==='poke')v=Math.max(v,direct(name,'포킹'));if(type==='dive')v=Math.max(v,direct(name,'다이브'));if(type==='engage')v=Math.max(v,direct(name,'이니시'));if(type==='catch')v=Math.max(v,direct(name,'캐치'));return{name,v}}).sort((a,b)=>b.v-a.v);
    return rows.filter(x=>x.v>=2.8).slice(0,4).map(x=>x.name);
  }
  const level=strength=>strength>=1.12?{key:'critical',label:'매우 높음',rank:3}:strength>=.82?{key:'high',label:'높음',rank:2}:strength>=.60?{key:'watch',label:'주의',rank:1}:{key:'normal',label:'보통',rank:0};
  const risk=(key,label,icon,strength,detail,tip,sources=[])=>{const lv=level(strength);return{key,label,icon,strength:clamp(strength),level:lv.label,tone:lv.key,rank:lv.rank,detail,tip,sources}};
  function risks(state={}){
    const enemy=names(state.enemy),our=names(state.our),ec=enemy.length,oc=our.length;if(ec<2)return[];const out=[];
    const ownProtect=responseStrength(our,[['보호',10,.58],['역이니시',8,.42]]),ownEngage=responseStrength(our,[['이니시',8,.55],['캐치',7,.45]]),ownFront=responseStrength(our,[['프론트',8,1]]);
    let cp=null;try{cp=typeof partialCatch==='function'?partialCatch(enemy,state.enemyModes||{}):null}catch{}
    const catchBase=Math.max(targetStrength(enemy,'캐치',7),n(cp?.scale)*1.34),catchStrength=catchBase*(1-.16*Math.min(1,ownProtect));
    out.push(risk('catch','캐치/CC 위험','⛓️',catchStrength,`상대의 선픽·장거리 CC 밀도가 높아 한 명이 먼저 끊기며 한타가 시작될 수 있습니다${cp?` · 강한 축 ${n(cp.strongSources)}명`:''}.`,'직접 생존 · 주문 방어 · 재배치',topSources('catch',state)));
    const pokeBase=targetStrength(enemy,'포킹',8),sustainO=avgFeature(our,['유지력','회복','회복/보호막','힐/보호막','보호막','치유'])/5,pokeMit=clamp(ownFront*.16+ownEngage*.12+sustainO*.18,0,.34);
    out.push(risk('poke','포킹 위험','🎯',pokeBase*(1-pokeMit),'교전 전에 체력이 깎이면서 좋은 한타 각 자체가 사라질 위험입니다.','전열 · 유지력 · 강제진입',topSources('poke',state)));
    const diveBase=targetStrength(enemy,'다이브',10);out.push(risk('dive','돌진 위험','💥',diveBase*(1-.22*Math.min(1,ownProtect)),'상대가 후방 딜러에게 직접 접근해 포커싱을 강제할 수 있습니다.','후방 보호 · 역이니시 · 자체 이탈',topSources('dive',state)));
    const engageSources=enemy.filter(x=>Math.max(direct(x,'이니시'),f18(x,'CC'),f18(x,'이니시'))>=3.8).length;let engageBase=targetStrength(enemy,'이니시',8);if(engageSources>=3)engageBase+=.18;else if(engageSources>=2)engageBase+=.09;
    out.push(risk('engage','강한 이니시 위험','🚨',engageBase*(1-.18*Math.min(1,ownProtect)),`상대가 원하는 타이밍에 교전을 열기 쉽습니다${engageSources?` · 강한 개시 수단 ${engageSources}개`:''}.`,'간격 유지 · 무효화 수단 · 역이니시',topSources('engage',state)));
    const enemyFront=targetStrength(enemy,'프론트',8),antiTank=responseStrength(our,[['대탱',7,.55],['지속딜',10,.45]]),frontRisk=enemyFront*(1-.46*Math.min(1,antiTank))+.16*Math.max(0,1-antiTank)*Math.min(1,enemyFront);
    out.push(risk('frontline','전열 처리 위험','🛡️',frontRisk,'상대 전열은 단단한데 우리 쪽 지속딜·대탱 수단이 부족해 앞라인에서 막힐 수 있습니다.','지속딜 · 체력비례/대탱 · 관통',topSources('frontline',state)));
    const sustainE=avgFeature(enemy,['유지력','회복','회복/보호막','힐/보호막','보호막','치유','아군 회복']),protectProxy=density(enemy,'보호')*.55,sustainBase=clamp(Math.max(sustainE/4.2,protectProxy/2.3)*confidence(ec),0,1.4);
    out.push(risk('sustain','유지력 위험','💚',sustainBase*(1-.16*Math.min(1,ownEngage)),'상대가 포킹과 짧은 교환의 손해를 회복해 장기전에서 누적 우위를 만들 수 있습니다.','강제진입 · 집중 폭딜 · 치감 검토',topSources('sustain',state)));
    const aoeFeature=avgFeature(enemy,['광역 한타','광역딜','광역 피해','AOE','광역 CC']),aoeSources=enemy.filter(x=>feature(x,['광역 한타','광역딜','광역 피해','AOE','광역 CC','이니시','CC'])>=3.5).length,aoeBase=clamp(targetStrength(enemy,'이니시',8)*.52+targetStrength(enemy,'캐치',7)*.18+(aoeFeature/5)*.30+(aoeSources>=3?.12:aoeSources>=2?.06:0),0,1.4);
    out.push(risk('aoe','광역 한타 위험','🌪️',aoeBase*(1-.13*Math.min(1,ownProtect)),'선진입 뒤 광역 CC·광역 피해가 겹치며 한 번에 전투가 무너질 수 있습니다.','산개 · 핵심궁 분산 · 역이니시',topSources('aoe',state)));
    if(ec>=3&&oc>=2){const eSustain=avgFeature(enemy,['유지력','회복/보호막','힐/보호막','보호막'])/5,oSustain=avgFeature(our,['유지력','회복/보호막','힐/보호막','보호막'])/5,eValue=density(enemy,'지속딜')*.36+density(enemy,'프론트')*.20+density(enemy,'보호')*.18+density(enemy,'대탱')*.12+eSustain*.14,oValue=density(our,'지속딜')*.36+density(our,'프론트')*.20+density(our,'보호')*.18+density(our,'대탱')*.12+oSustain*.14,lateE=avgFeature(enemy,['후반','후반밸류','후반 파워','후반파워','스케일링','성장']),lateO=avgFeature(our,['후반','후반밸류','후반 파워','후반파워','스케일링','성장']),lateDiff=(lateE||lateO)?(lateE-lateO)*.10:0,gap=eValue-oValue,valueStrength=clamp((.54+gap*.22+lateDiff)*Math.min(1,confidence(ec)+.12),0,1.35);out.push(risk('value','밸류 위험','📈',valueStrength,'시간이 갈수록 상대의 지속딜·전열·보호가 함께 살아남아 장기 한타 기대값이 우리보다 높아질 수 있습니다.','빠른 강제교전 · 성장 차단 · 지속딜/밸류 보완',topSources('value',state)))}
    return out.sort((a,b)=>b.rank-a.rank||b.strength-a.strength);
  }
  return{risks,metric,density,feature,avgFeature,targetStrength,responseStrength,level,confidence};
}
module.exports={IMPLEMENTATION_VERSION,CATEGORIES,createRiskEngine,production_active:false,score_logic_changed:false,random_scoring_changed:false};
