'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
const round1=v=>Math.round((Number(v)||0)*10)/10;
const HARD_SELF=Object.freeze({
  '자야':[5.0,'R 지정불가'],'이즈리얼':[4.6,'E 즉시 재배치'],'시비르':[4.6,'E 주문 방어'],'제리':[4.3,'E 벽 재배치'],
  '카이사':[4.1,'R 실드·재배치'],'베인':[3.8,'Q/R 재배치·은신'],'트리스타나':[3.9,'W 이탈·R 밀치기'],'닐라':[4.0,'W 회피'],
  '루시안':[3.4,'E 재배치'],'칼리스타':[3.7,'패시브 연속 재배치'],'코르키':[3.0,'W 이탈'],'스몰더':[3.2,'E 재배치'],
  '아크샨':[3.6,'E 스윙 이탈'],'유나라':[3.4,'E 거리 재설정'],'퀸':[2.8,'E 거리 재설정'],'케이틀린':[2.4,'E 거리 재설정'],
  '세나':[2.5,'E 위장·거리 확보'],'리산드라':[4.8,'R 자기 무적'],'에코':[5.0,'R 복귀·회복'],'아리':[4.5,'R 다중 재배치'],
  '르블랑':[4.6,'W/R 복귀'],'제드':[4.4,'그림자 교체 이탈'],'엘리스':[4.7,'거미 E 지정불가'],'카사딘':[4.5,'R 반복 점멸'],
  '이블린':[4.4,'R 이탈'],'샤코':[4.4,'Q/R 회피'],'아칼리':[4.1,'W 은신·다중 이동'],'그웬':[4.3,'W 외부 대상 면역'],
  '피오라':[4.5,'W 핵심 CC 무효'],'갱플랭크':[4.4,'W CC 해제'],'올라프':[4.4,'R CC 면역'],'요네':[4.1,'E 복귀'],
  '신 짜오':[4.1,'R 외부 피해 차단'],'잭스':[3.4,'E 회피·Q 재배치'],'렝가':[3.8,'강화 W 해제'],'녹턴':[4.0,'W 주문 방어'],
  '말자하':[3.5,'패시브 주문 방어'],'모르가나':[4.1,'E CC 면역']
});
const HARD_ALLY=Object.freeze({
  '레나타 글라스크':[5.0,'W 죽음 유예/부활'],'질리언':[5.0,'R 부활'],'케일':[4.8,'R 무적'],'킨드레드':[4.8,'R 사망 방지'],
  '타릭':[5.0,'R 광역 무적'],'탐 켄치':[4.8,'R 아군 삼키기'],'룰루':[4.5,'R 즉시 체력·에어본'],'밀리오':[4.2,'R 광역 해제·회복'],
  '잔나':[4.2,'Q/R 강제 분리'],'모르가나':[4.1,'E CC 면역'],'쓰레쉬':[4.3,'W 랜턴 구조'],'쉔':[4.2,'R 대형 실드'],
  '브라움':[3.8,'E 차단·CC 보호'],'바드':[3.8,'R 스테이시스 구조'],'유미':[3.6,'숙주 집중 보호'],'소라카':[3.6,'즉시 회복'],
  '아이번':[3.4,'E 실드·둔화'],'카르마':[3.1,'R-E 광역 실드·이속'],'세라핀':[3.0,'W 광역 보호'],'나미':[3.2,'회복·CC 차단'],
  '소나':[3.0,'회복·R 차단'],'라칸':[3.2,'실드·CC 차단'],'알리스타':[3.2,'밀치기·에어본'],'뽀삐':[3.5,'W/R 진입 차단'],
  '칼리스타':[4.2,'R 계약 아군 구조']
});
const TAG_SELF=Object.freeze({INVULNERABLE:5.0,UNTARGETABLE:4.8,PROJECTILE_BLOCK:3.2,STEALTH:2.4});
function createTeamSurvival({byName}={}){
  if(!byName||typeof byName!=='object')throw new Error('teamSurvival byName map required');
  const champ=x=>typeof x==='string'?byName?.[x]:x;
  const f18=(c,key)=>Number(c?.['기능프로필18']?.[key])||0;
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
  function teamSurvival(names,modes={}){
    const rows=(names||[]).filter(Boolean).map(n=>{const c=champ(n),s=selfSaveInfo(c),a=allySaveInfo(c);return{name:n,self:s.score,carry:s.carry,direct:s.score*s.carry,ally:a.score,selfLabel:s.label,allyLabel:a.label}});
    const direct=rows.map(x=>x.direct).sort((a,b)=>b-a),ally=rows.map(x=>x.ally).sort((a,b)=>b-a);
    const selfLayer=(direct[0]||0)*2.35+(direct[1]||0)*.70+(direct[2]||0)*.25;
    const allyLayer=(ally[0]||0)*1.60+(ally[1]||0)*.45+(ally[2]||0)*.15;
    const score=round1(clamp(selfLayer+allyLayer,0,20));
    return{score,selfLayer:round1(selfLayer),allyLayer:round1(allyLayer),rows:rows.sort((a,b)=>(b.direct+b.ally*.55)-(a.direct+a.ally*.55))}
  }
  return{carryWeight,selfSaveInfo,allySaveInfo,teamSurvival};
}
module.exports={IMPLEMENTATION_VERSION,HARD_SELF,HARD_ALLY,TAG_SELF,createTeamSurvival,production_active:false,score_logic_changed:false,random_scoring_changed:false};
