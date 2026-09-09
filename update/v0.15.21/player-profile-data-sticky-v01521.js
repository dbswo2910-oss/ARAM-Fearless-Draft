'use strict';
(()=>{
  const V='0.15.21';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const avg=a=>a?.length?a.reduce((s,x)=>s+num(x),0)/a.length:0;
  const esc=s=>{try{return aramHistoryEsc(String(s??''))}catch{return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}};
  const base=window.aramPlayerProfileV01519;
  if(!base?.profile)throw new Error('v0.15.19 Player Profile base missing');

  const STYLE_AXES=[
    ['aggression','교전 적극성'],
    ['survival','생존 지향'],
    ['carry','캐리 지향'],
    ['frontline','전열 성향'],
    ['control','제어·지원'],
    ['consistency','안정성']
  ];

  function playerLabel(){
    try{
      const a=aramHistoryState?.account||aramHistoryState?.target||aramHistoryState?.localAccount||null;
      return aramHistoryAccountLabel(a)||a?.riotId||a?.gameName||'player';
    }catch{return 'player'}
  }
  function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function roleDiversity(p){
    const xs=(p.roles||[]).filter(x=>num(x.n)>0),tot=xs.reduce((s,x)=>s+num(x.n),0)||1;
    const shares=xs.map(x=>num(x.n)/tot),entropy=-shares.reduce((s,q)=>s+(q>0?q*Math.log(q):0),0),max=Math.log(Math.max(1,xs.length));
    return {versatility:max?clamp(entropy/max*100):0,topShare:Math.max(0,...shares)*100,roleCount:xs.length,topRole:xs[0]?.role||''};
  }
  function rawStyle(p){
    const rows=(p.rows||[]).slice(0,20);if(!rows.length)return null;
    const A=k=>avg(rows.map(x=>num(x[k]))), role=avg(rows.map(x=>num(x.score)));
    const raw={
      aggression:A('engage')*.36+A('participation')*.30+A('cc')*.14+A('damage')*.20,
      survival:A('survival'),
      carry:A('damage')*.46+A('resource')*.20+A('poke')*.19+role*.15,
      frontline:A('frontline')*.46+A('absorb')*.34+A('engage')*.20,
      control:A('cc')*.34+A('peel')*.28+A('ally')*.23+A('participation')*.15,
      consistency:num(p.stability,62)
    };
    return raw;
  }
  function contrast(raw){
    const vals=STYLE_AXES.map(([k])=>num(raw[k])),m=avg(vals),sd=Math.sqrt(avg(vals.map(v=>(v-m)**2)))||1;
    const gain=sd<5?1.85:sd<9?1.55:1.32;
    const out={};
    for(const[k]of STYLE_AXES){
      const v=num(raw[k]);
      out[k]=clamp(50+(v-m)*gain+(v-70)*.16,12,96);
    }
    return out;
  }
  function archetypes(p,style,raw,div){
    const s=style,a=num(p.axes?.resource),r=num(p.axes?.role),part=num(p.axes?.participation),dmg=avg((p.rows||[]).slice(0,20).map(x=>num(x.damage))),poke=avg((p.rows||[]).slice(0,20).map(x=>num(x.poke)));
    const req=(ok,score,label,group,desc)=>ok?{score,label,group,desc}:null;
    const c=[
      req(s.aggression>=58&&s.frontline>=56, s.aggression*.36+s.frontline*.38+(100-s.survival)*.14+s.control*.12,'선봉 돌격형','engage','먼저 몸을 던져 교전의 시작점을 만드는 성향'),
      req(s.aggression>=54&&s.control>=55, s.aggression*.31+s.control*.43+part*.16+s.consistency*.10,'교전 지휘형','engage','CC와 참여도를 바탕으로 한타 흐름을 여는 성향'),
      req(s.frontline>=60&&s.survival>=50, s.frontline*.49+s.survival*.27+s.control*.14+r*.10,'전열 버팀목','front','앞줄에서 피해를 받아내며 전선을 유지하는 성향'),
      req(s.carry>=60&&s.survival>=53, s.carry*.50+s.survival*.25+(100-s.frontline)*.15+s.consistency*.10,'안정 캐리형','carry','후방에서 성과를 내면서 생존도 함께 챙기는 성향'),
      req(s.carry>=58&&s.aggression>=55&&s.survival<=48, s.carry*.42+s.aggression*.32+(100-s.survival)*.26,'하이리스크 캐리형','carry','성과를 위해 위험을 적극적으로 감수하는 성향'),
      req(poke>=78&&s.carry>=53, poke*.46+s.carry*.30+(100-s.frontline)*.14+s.control*.10,'포킹 압박형','range','긴 교전 전부터 체력 우위를 만드는 성향'),
      req(s.control>=61&&s.carry<=55, s.control*.52+part*.20+s.survival*.16+(100-s.carry)*.12,'팀 조율형','support','제어와 보호를 통해 팀 전체의 전투력을 끌어올리는 성향'),
      req(a>=80&&r>=74, a*.42+r*.28+s.carry*.18+s.consistency*.12,'자원 환산형','economy','먹은 자원을 실제 역할 수행으로 연결하는 성향'),
      req(a<=68&&r>=77, r*.46+(100-a)*.30+s.control*.14+s.consistency*.10,'저자원 효율형','economy','많이 먹지 않아도 역할 수행을 만들어내는 성향'),
      req(s.consistency>=64&&s.survival>=52, s.consistency*.50+s.survival*.23+r*.17+part*.10,'안정 루틴형','stable','경기별 편차를 줄이고 평균치를 꾸준히 지키는 성향'),
      req(s.consistency<=42&&Math.max(s.carry,s.aggression)>=58, (100-s.consistency)*.48+Math.max(s.carry,s.aggression)*.32+r*.20,'고점·저점형','variance','고점은 높지만 경기별 결과 편차가 큰 성향'),
      req(div.versatility>=68&&div.roleCount>=3, div.versatility*.53+r*.24+s.consistency*.13+part*.10,'멀티롤 올라운더','versatile','여러 역할군을 오가며 팀 조합에 맞춰 적응하는 성향'),
      req(div.topShare>=62&&div.roleCount>=1, div.topShare*.18+(p.roles?.[0]?.score||70)*.25+s.consistency*.12,`${div.topRole||'주 역할'} 스페셜리스트`,'specialist','특정 역할군에서 반복적으로 강점을 만드는 성향'),
      req(part>=84&&s.aggression>=54, part*.44+s.aggression*.36+s.control*.12+s.consistency*.08,'한타 개근형','fight','교전이 열리면 빠지지 않고 관여하는 성향'),
      req(dmg>=82&&s.carry>=56, dmg*.46+s.carry*.34+s.survival*.12+s.consistency*.08,'딜 생산형','damage','전투에서 직접적인 피해 생산을 우선하는 성향')
    ].filter(Boolean).sort((x,y)=>y.score-x.score);
    if(!c.length)c.push({score:70,label:div.versatility>=55?'상황 적응형':'역할 중심형',group:'fallback',desc:div.versatility>=55?'조합과 챔피언에 따라 플레이 방향을 바꾸는 성향':'주어진 역할의 기본 수행을 우선하는 성향'});
    const chosen=[];for(const x of c){if(!chosen.some(y=>y.group===x.group)){chosen.push(x);if(chosen.length>=4)break}}
    return chosen;
  }
  const FUN={
    '선봉 돌격형':['“한타 시작 버튼을 남에게 맡기는 편은 아니다.”','“앞줄이 비면 직접 문을 열고 들어가는 쪽.”','“교전 콜이 없으면 몸으로 콜을 만드는 타입.”'],
    '교전 지휘형':['“싸움을 많이 하는 게 아니라, 싸움이 시작될 곳에 먼저 있는 편.”','“CC가 준비되면 한타도 준비됐다고 생각하는 타입.”','“버튼 하나로 팀 전체의 방향을 정하는 걸 좋아한다.”'],
    '전열 버팀목':['“딜표보다 맞은 피해량이 더 자랑스러울 수 있는 타입.”','“팀이 뒤에서 편하게 때릴 수 있다면 본인은 앞에서 맞아도 된다.”','“전선이 무너지기 전에 본인이 먼저 서는 편.”'],
    '안정 캐리형':['“죽지 않는 것도 딜이라는 걸 꽤 잘 아는 플레이어.”','“화려한 한 번보다 살아남아 두 번 때리는 쪽을 선호한다.”','“딜과 생존을 동시에 챙기려는 계산이 보이는 타입.”'],
    '하이리스크 캐리형':['“딜각이 보이면 생존확률 계산은 잠시 뒤로 미루는 편.”','“리스크를 지불하고 고점을 사는 플레이어.”','“살아남으면 캐리, 못 살아남으면 다음 판 복기감.”'],
    '포킹 압박형':['“한타는 시작 전에 체력바부터 깎아놓는 게 예의라고 생각한다.”','“정면충돌보다 상대가 지쳐 들어오게 만드는 쪽.”','“사거리 자체를 하나의 탱킹 수단처럼 쓰는 편.”'],
    '팀 조율형':['“본인 스탯보다 팀 전체가 편해지는 그림을 선호한다.”','“딜러가 잘할 수 있게 판을 깔아주는 쪽에 가깝다.”','“혼자 빛나기보다 다섯 명을 굴리는 타입.”'],
    '자원 환산형':['“먹은 만큼 돌려주는 편이라 식비 청구가 덜 아깝다.”','“자원을 요구하지만 결과로 영수증을 제출하는 타입.”','“골드가 들어오면 역할 수행으로 바꾸는 환전율이 좋은 편.”'],
    '저자원 효율형':['“많이 먹지 않아도 밥값을 하는 타입.”','“적은 자원으로 팀 기여도를 뽑는 가성비 플레이어.”','“팀 골드를 덜 써도 존재감은 남기는 편.”'],
    '안정 루틴형':['“대박보다는 망하지 않는 경기를 꾸준히 쌓는 타입.”','“고점 자랑보다 평균점 관리가 더 강하다.”','“팀 입장에서 계산하기 편한 플레이어.”'],
    '고점·저점형':['“잘 풀리는 날과 안 풀리는 날의 캐릭터가 꽤 다르다.”','“고점 영상은 멋있고 저점 복기는 길어지는 타입.”','“평균보다 천장이 먼저 눈에 들어오는 플레이어.”'],
    '멀티롤 올라운더':['“픽창에서 남는 자리를 맡겨도 그림이 나오는 편.”','“한 포지션 장인보다는 조합 맞춤형 공구함에 가깝다.”','“챔피언보다 팀에 필요한 역할을 먼저 보는 타입.”'],
    '한타 개근형':['“한타 출석률만큼은 개근에 가깝다.”','“교전 알림이 뜨면 거의 항상 현장에 있는 편.”','“팀이 싸우는데 혼자 다른 일을 하는 장면이 드문 타입.”'],
    '딜 생산형':['“결국 체력바를 줄이는 사람이 필요하다는 걸 잘 안다.”','“한타 결과표에서 피해량 칸이 먼저 눈에 들어오는 타입.”','“역할을 맡으면 직접적인 화력으로 답하는 편.”'],
    '스페셜리스트':['“이것저것 잘하기보다 익숙한 역할에서 확실히 값을 뽑는 편.”','“주 역할을 잡았을 때 프로필 색깔이 가장 선명해지는 타입.”','“폭넓음보다 깊이로 승부하는 쪽에 가깝다.”']
  };
  function funLine(primary){
    const key=primary.label.includes('스페셜리스트')?'스페셜리스트':primary.label, arr=FUN[key]||['“한 장면보다 여러 경기에서 반복되는 습관으로 평가되는 타입.”'];
    return arr[hash(playerLabel()+primary.label)%arr.length];
  }
  function analyze(p=base.profile()){
    if(!p?.n)return {...p,style:null,archetypes:[]};
    const raw=rawStyle(p),style=contrast(raw),div=roleDiversity(p),types=archetypes(p,style,raw,div),primary=types[0];
    const ranked=STYLE_AXES.map(([k,l])=>({k,l,v:num(style[k]),raw:num(raw[k])})).sort((a,b)=>b.v-a.v), hi=ranked[0],lo=ranked[ranked.length-1];
    const spread=hi.v-lo.v;
    const trend=num(p.trend);
    const trendText=trend>=4?`최근 ROLE 흐름은 이전 구간보다 ${Math.round(trend*10)/10}점 상승 중입니다.`:trend<=-4?`최근 ROLE 흐름은 이전 구간보다 ${Math.abs(Math.round(trend*10)/10)}점 낮아졌습니다.`:'최근 흐름은 장기 평균에서 큰 이탈 없이 유지되고 있습니다.';
    const scout=`${primary.label}: ${primary.desc}. 현재 프로필에서 ${hi.l}이 가장 두드러지고 ${lo.l}은 상대적으로 낮습니다. ${spread<13?'축 간 편차는 작지만, 역할 분포와 세부 지표를 함께 반영해 유형을 구분했습니다.':''} ${trendText}`.replace(/\s+/g,' ').trim();
    return {...p,styleRaw:raw,style,roleDiversity:div,archetypes:types,primaryType:primary,styleSpread:spread,scoutV21:scout,funV21:funLine(primary)};
  }
  function poly(vals,cx=180,cy=132,R=92){return vals.map((v,i)=>{const a=-Math.PI/2+i*Math.PI*2/vals.length,r=R*clamp(v)/100;return`${(cx+Math.cos(a)*r).toFixed(1)},${(cy+Math.sin(a)*r).toFixed(1)}`}).join(' ')}
  function radar(p){
    const cx=180,cy=132,R=92,vals=STYLE_AXES.map(([k])=>num(p.style?.[k],50));
    const rings=[20,40,60,80,100].map(v=>`<polygon points="${poly(Array(6).fill(v),cx,cy,R)}" class="pprg"/>`).join('');
    const lines=STYLE_AXES.map((_,i)=>{const a=-Math.PI/2+i*Math.PI*2/6;return`<line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(a)*R}" y2="${cy+Math.sin(a)*R}" class="pprs"/>`}).join('');
    const labs=STYLE_AXES.map(([k,l],i)=>{const a=-Math.PI/2+i*Math.PI*2/6,x=cx+Math.cos(a)*(R+29),y=cy+Math.sin(a)*(R+29),an=Math.cos(a)>.3?'start':Math.cos(a)<-.3?'end':'middle';return`<text x="${x}" y="${y+3}" text-anchor="${an}" class="pprl">${esc(l)} <tspan>${Math.round(num(p.style?.[k],50))}</tspan></text>`}).join('');
    return `<div class="pp21radarTitle"><b>PLAY STYLE RADAR</b><span>절대 실력점수가 아니라 이 선수 안에서 어떤 성향이 상대적으로 강한지 보여줍니다.</span></div><svg viewBox="0 0 360 276" class="ppradar">${rings}${lines}<polygon points="${poly(vals,cx,cy,R)}" class="pprc"/>${labs}</svg><div class="ppleg"><span>● 개인 내 상대강점</span><span>유형 ${esc(p.primaryType?.label||'-')}</span></div>`;
  }
  function enhance(){
    const root=document.getElementById('pp19c');if(!root)return false;const p=analyze();if(!p?.n)return false;
    const heroBoxes=root.querySelectorAll('.pphero .ppbox');if(heroBoxes[1])heroBoxes[1].innerHTML=radar(p);
    const tags=root.querySelector('.pptags');if(tags)tags.innerHTML=p.archetypes.slice(0,4).map((x,i)=>`<span class="${i===0?'pp21primary':''}">${i===0?'★ ':''}${esc(x.label)}</span>`).join('');
    const scout=root.querySelector('.ppscout');if(scout)scout.textContent=p.scoutV21;
    const fun=root.querySelector('.ppfun');if(fun)fun.textContent=p.funV21;
    const idx=root.querySelector('.ppidx');if(idx&&!idx.querySelector('.pp21type')){const d=document.createElement('div');d.className='pp21type';d.innerHTML=`<span>PLAY TYPE</span><b>${esc(p.primaryType.label)}</b><small>역할 다양성 ${Math.round(p.roleDiversity.versatility)} · 주 역할 비중 ${Math.round(p.roleDiversity.topShare)}%</small>`;idx.appendChild(d)}
    else if(idx){const d=idx.querySelector('.pp21type');if(d)d.innerHTML=`<span>PLAY TYPE</span><b>${esc(p.primaryType.label)}</b><small>역할 다양성 ${Math.round(p.roleDiversity.versatility)} · 주 역할 비중 ${Math.round(p.roleDiversity.topShare)}%</small>`}
    return true;
  }
  function css(){if(document.getElementById('pp21style'))return;const s=document.createElement('style');s.id='pp21style';s.textContent=`
.pp21radarTitle{display:flex;flex-direction:column;gap:2px;margin:0 0 2px}.pp21radarTitle b{font-size:10px;color:#d9edff;letter-spacing:.7px}.pp21radarTitle span{font-size:7.5px;color:#6f899f;line-height:1.35}.pptags .pp21primary{border-color:#6aa9db!important;color:#dff2ff!important;background:#12304a!important}.pp21type{margin-top:11px;padding:8px 9px;border:1px solid #294861;border-radius:9px;background:#071725}.pp21type span{display:block;font-size:7px;color:#6f8ba2;font-weight:900}.pp21type b{display:block;margin-top:2px;font-size:13px;color:#dff1ff}.pp21type small{display:block;margin-top:3px;font-size:7.5px;color:#7891a7}
.dataChampionDetailStickyV01521{position:sticky!important;top:10px!important;align-self:flex-start!important;max-height:calc(100vh - 20px)!important;overflow:auto!important;overscroll-behavior:contain;scrollbar-gutter:stable;z-index:8}.dataChampionDetailStickyParentV01521{align-items:flex-start!important}.dataChampionDetailStickyV01521::-webkit-scrollbar{width:7px}.dataChampionDetailStickyV01521::-webkit-scrollbar-thumb{background:#29455e;border-radius:10px}@media(max-width:1050px){.dataChampionDetailStickyV01521{position:static!important;max-height:none!important;overflow:visible!important}}
`;document.head.appendChild(s)}
  function rebind(){
    const b=document.getElementById('pp19open');if(!b||b.dataset.pp21==='1')return;const c=b.cloneNode(true);c.dataset.pp21='1';b.replaceWith(c);c.addEventListener('click',()=>{try{window.openPlayerProfile()}catch{}})
  }
  const oldOpen=window.openPlayerProfile;
  function open21(){oldOpen?.();setTimeout(enhance,0)}
  window.openPlayerProfile=open21;

  function stickyCandidates(){
    const out=[];
    const titles=[...document.querySelectorAll('.panel .title,.dataInfoPanel .title,[class*="champ"][class*="detail"] .title,[id*="champ"][id*="detail"] .title')];
    for(const t of titles){const tx=String(t.textContent||'').replace(/\s+/g,' ').trim();if(/챔피언\s*상세|champion\s*detail/i.test(tx)){const p=t.closest('.panel,.dataInfoPanel,[class*="champ"][class*="detail"],[id*="champ"][id*="detail"]');if(p)out.push(p)}}
    if(!out.length){for(const p of document.querySelectorAll('[id*="champ"][id*="detail"],[class*="champ"][class*="detail"]')){const tx=String(p.textContent||'');if(/티어|역할|기능|상세|챔피언/.test(tx))out.push(p)}}
    return [...new Set(out)];
  }
  function applySticky(){
    document.querySelectorAll('.dataChampionDetailStickyV01521').forEach(x=>x.classList.remove('dataChampionDetailStickyV01521'));
    document.querySelectorAll('.dataChampionDetailStickyParentV01521').forEach(x=>x.classList.remove('dataChampionDetailStickyParentV01521'));
    if(innerWidth<1050)return false;
    const c=stickyCandidates();if(!c.length)return false;
    for(const p of c){p.classList.add('dataChampionDetailStickyV01521');p.parentElement?.classList.add('dataChampionDetailStickyParentV01521')}
    return true;
  }
  function scheduleSticky(){clearTimeout(scheduleSticky.t);scheduleSticky.t=setTimeout(applySticky,40)}
  css();rebind();applySticky();
  const obs=new MutationObserver(()=>{rebind();scheduleSticky();try{if(document.getElementById('pp19ov')?.classList.contains('open'))setTimeout(enhance,0)}catch{}});obs.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',scheduleSticky,{passive:true});
  document.addEventListener('click',e=>{if(e.target?.closest?.('[class*="champ"],[id*="champ"],.dataRow,.dataCard'))scheduleSticky()},{capture:true});
  try{
    const oldRender=renderAramHistoryFeedback;renderAramHistoryFeedback=function(...a){const r=oldRender.apply(this,a);rebind();try{if(document.getElementById('pp19ov')?.classList.contains('open'))setTimeout(enhance,0)}catch{}return r};
  }catch{}
  if(typeof DATA!=='undefined'){DATA.version=V;DATA.player_profile_diversity_v01521={version:'v0.15.21 · Player Profile Diversity + Data Sticky Detail',style_radar:'within-player contrast',archetype_count:15,balance_fallback_removed:true,sticky_champion_detail:true}}
  if(typeof syncAppVersionUI==='function')syncAppVersionUI();
  window.aramPlayerProfileDiversityV01521={analyze,rawStyle,contrast,archetypes,applySticky,stickyCandidates,enhance};
  window.__ARAM_PLAYER_PROFILE_DIVERSITY_V01521__=true;
})();