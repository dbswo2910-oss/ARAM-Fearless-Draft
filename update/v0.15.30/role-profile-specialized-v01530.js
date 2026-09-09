'use strict';
(()=>{
  const V='0.15.30';
  const ctx=window.aramRoleProfileContextV01523;
  if(!ctx?.roleMatches)throw new Error('v0.15.23 role profile context missing');
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const avg=a=>a?.length?a.reduce((s,x)=>s+num(x),0)/a.length:0;
  const r1=v=>Math.round(num(v)*10)/10;
  const esc=s=>{try{return aramHistoryEsc(String(s??''))}catch{return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}};

  const ROLE_AXES={
    '탱커':[
      ['absorb','피해 흡수',s=>s.absorb],['frontline','전열 유지',s=>s.frontline],['engage','이니시',s=>s.engage],['cc','CC 영향력',s=>s.cc],['peel','보호/필',s=>s.peel],['endurance','생존·지속전',s=>s.survival*.55+s.sustainFight*.25+s.selfSustain*.20]
    ],
    '원딜':[
      ['damage','딜 생산',s=>s.damage],['carry','지속딜',s=>s.carry],['eff','자원 환산',s=>s.eff],['survival','생존',s=>s.survival],['kp','교전 참여',s=>s.kp],['carryExec','캐리 수행',s=>s.damage*.30+s.carry*.30+s.eff*.18+s.kp*.14+s.survival*.08]
    ],
    '메이지':[
      ['damage','딜 생산',s=>s.damage],['poke','포킹',s=>s.poke],['control','공간·제어',s=>s.control],['cc','CC 영향력',s=>s.cc],['survival','생존',s=>s.survival],['eff','자원 효율',s=>s.eff]
    ],
    '서포터':[
      ['peel','보호/필',s=>s.peel],['allySustain','아군 유지력',s=>s.allySustain],['utility','유틸리티',s=>s.utility],['cc','CC 영향력',s=>s.cc],['kp','교전 참여',s=>s.kp],['survival','생존',s=>s.survival]
    ],
    '브루저':[
      ['damage','딜 생산',s=>s.damage],['dive','진입',s=>s.dive],['frontline','전열',s=>s.frontline],['sustainFight','지속전',s=>s.sustainFight],['survival','생존',s=>s.survival],['kp','교전 참여',s=>s.kp]
    ],
    '암살자':[
      ['burst','순간폭딜',s=>s.burst],['dive','후방 접근',s=>s.dive],['pick','캐치',s=>s.pick],['killConv','킬 전환',s=>s.burst*.42+s.kills*.28+s.kp*.18+s.multi*.12],['survival','생존',s=>s.survival],['reset','리셋·마무리',s=>s.reset]
    ]
  };
  const FALLBACK=[['damage','딜 생산',s=>s.damage],['kp','교전 참여',s=>s.kp],['survival','생존',s=>s.survival],['cc','CC 영향력',s=>s.cc],['eff','자원 효율',s=>s.eff],['role','ROLE 수행',(_s,r)=>r.score]];

  function row(m,i){
    try{
      const s=aramHistoryBaseSignals(m),r=aramHistoryRoleBreakdown(m);if(!s||!r||r.score==null)return null;
      return{id:String(m?.gameId??i),t:num(m?.gameEndTimestamp||m?.gameCreation||m?.gameStartTimestamp),s,r,score:clamp(r.score),win:m?.me?.win===true||m?.win===true};
    }catch{return null}
  }
  function roleData(role){
    const defs=ROLE_AXES[role]||FALLBACK,rows=(ctx.roleMatches(role)||[]).map(row).filter(Boolean).sort((a,b)=>b.t-a.t),values={};
    for(const [k,l,fn] of defs){
      const all=rows.slice(0,20).map(x=>clamp(fn(x.s,x.r))),recentRows=rows.slice(0,Math.min(5,rows.length)),olderRows=rows.slice(Math.min(5,rows.length),Math.min(15,rows.length)),recent=avg(recentRows.map(x=>clamp(fn(x.s,x.r)))),older=olderRows.length>=3?avg(olderRows.map(x=>clamp(fn(x.s,x.r)))):null,overall=avg(all);
      values[k]={k,l,v:overall,recent:recentRows.length?recent:overall,older,delta:older==null?null:recent-older,n:all.length};
    }
    const list=defs.map(([k])=>values[k]),ranked=list.slice().sort((a,b)=>b.v-a.v),scoreAvg=avg(rows.slice(0,20).map(x=>x.score)),recentRole=avg(rows.slice(0,Math.min(5,rows.length)).map(x=>x.score)),olderRole=rows.length>=8?avg(rows.slice(5,15).map(x=>x.score)):null;
    return{role,defs,rows,values,list,ranked,strong:ranked.slice(0,2),weak:ranked.slice(-2).reverse(),n:rows.length,scoreAvg,recentRole,olderRole,roleTrend:olderRole==null?null:recentRole-olderRole};
  }
  function roleTypes(d){
    const v=k=>num(d.values[k]?.v),out=[];
    const add=(ok,label,desc)=>{if(ok&&!out.some(x=>x.label===label))out.push({label,desc})};
    if(d.role==='탱커'){
      add(v('engage')>=76&&v('cc')>=76,'선이니시형','이니시와 CC로 먼저 교전을 여는 탱커');
      add(v('absorb')>=76&&v('frontline')>=74,'전열 버팀목','피해를 받아내며 전선을 유지하는 탱커');
      add(v('peel')>=73,'보호·역이니시형','아군을 지키고 상대 진입을 끊는 비중이 큰 탱커');
      add(v('endurance')>=76,'지속전 탱커','진입 후에도 전투를 오래 이어가는 탱커');
    }else if(d.role==='원딜'){
      add(v('carry')>=78&&v('damage')>=78,'지속딜 캐리형','딜 생산과 지속 화력을 함께 만드는 원딜');
      add(v('eff')>=80,'자원 환산형','골드를 실제 화력으로 바꾸는 효율이 높은 원딜');
      add(v('survival')>=76&&v('damage')>=72,'안정 캐리형','생존을 유지하면서 화력을 누적하는 원딜');
      add(v('kp')>=82,'한타 개근형','팀 교전에 빠지지 않고 꾸준히 관여하는 원딜');
    }else if(d.role==='메이지'){
      add(v('poke')>=78,'포킹 압박형','본교전 전에 체력 우위를 만드는 메이지');
      add(v('control')>=76&&v('cc')>=72,'공간 지배형','CC와 공간 제어로 한타 구도를 만드는 메이지');
      add(v('damage')>=80,'화력 중심형','직접적인 피해 생산 비중이 높은 메이지');
      add(v('survival')>=76&&v('eff')>=74,'안정 운영형','생존과 자원 효율을 함께 관리하는 메이지');
    }else if(d.role==='서포터'){
      add(v('peel')>=76,'보호 중심형','아군 보호와 필링에 강점이 있는 서포터');
      add(v('allySustain')>=76,'유지력 중심형','회복·보호막으로 팀의 전투 지속력을 높이는 서포터');
      add(v('cc')>=76&&v('kp')>=76,'교전 조율형','CC와 높은 참여도로 교전을 조율하는 서포터');
      add(v('utility')>=76,'유틸 증폭형','직접 화력보다 팀 기능을 강화하는 서포터');
    }else if(d.role==='브루저'){
      add(v('dive')>=76&&v('frontline')>=70,'진입 압박형','몸을 넣어 후방과 전열을 동시에 흔드는 브루저');
      add(v('sustainFight')>=78,'지속전 특화형','짧은 폭딜보다 긴 교전에서 강한 브루저');
      add(v('damage')>=78&&v('survival')>=68,'딜탱 균형형','화력과 생존을 함께 만드는 브루저');
      add(v('kp')>=82,'한타 합류형','교전 참여도가 높은 브루저');
    }else if(d.role==='암살자'){
      add(v('burst')>=78&&v('killConv')>=74,'처형형','순간 화력을 실제 킬로 전환하는 암살자');
      add(v('dive')>=78,'후방 침투형','적 후방 접근과 진입 비중이 높은 암살자');
      add(v('pick')>=76,'캐치 특화형','고립된 목표를 잡아내는 데 강점이 있는 암살자');
      add(v('reset')>=76,'리셋 연쇄형','첫 처치 이후 교전을 이어가는 능력이 강한 암살자');
    }
    if(!out.length){const hi=d.strong[0];out.push({label:`${hi?.l||d.role} 중심형`,desc:`${hi?.l||'역할 핵심지표'}가 현재 ${d.role} 지표 중 상대적으로 가장 높은 유형`})}
    return out.slice(0,4);
  }
  function poly(vals,cx=180,cy=132,R=92){return vals.map((v,i)=>{const a=-Math.PI/2+i*Math.PI*2/vals.length,r=R*clamp(v)/100;return`${(cx+Math.cos(a)*r).toFixed(1)},${(cy+Math.sin(a)*r).toFixed(1)}`}).join(' ')}
  function radar(d){
    const cx=180,cy=132,R=92,vals=d.list.map(x=>x.recent),old=d.list.map(x=>x.older),hasOld=old.every(v=>v!==null),rings=[20,40,60,80,100].map(v=>`<polygon points="${poly(Array(6).fill(v),cx,cy,R)}" class="pprg"/>`).join(''),lines=d.list.map((_,i)=>{const a=-Math.PI/2+i*Math.PI*2/6;return`<line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(a)*R}" y2="${cy+Math.sin(a)*R}" class="pprs"/>`}).join(''),labs=d.list.map((x,i)=>{const a=-Math.PI/2+i*Math.PI*2/6,px=cx+Math.cos(a)*(R+30),py=cy+Math.sin(a)*(R+30),an=Math.cos(a)>.3?'start':Math.cos(a)<-.3?'end':'middle';return`<text x="${px}" y="${py+3}" text-anchor="${an}" class="pprl">${esc(x.l)} <tspan>${Math.round(x.recent)}</tspan></text>`}).join('');
    return `<div class="pp30radarTitle"><b>${esc(d.role)} ROLE RADAR</b><span>${esc(d.role)} 경기에서 실제로 중요한 6개 수행지표입니다. 전체 PLAY STYLE RADAR와 다른 역할 전용 평가입니다.</span></div><svg viewBox="0 0 360 278" class="ppradar">${rings}${lines}${hasOld?`<polygon points="${poly(old,cx,cy,R)}" class="pprp"/>`:''}<polygon points="${poly(vals,cx,cy,R)}" class="pprc"/>${labs}</svg><div class="ppleg"><span>● 최근 ${Math.min(5,d.n)}경기</span>${hasOld?'<span>◇ 이전 구간</span>':`<span>${d.role} ${d.n}경기 기준</span>`}</div>`;
  }
  function metricCards(d){return d.list.map(x=>{const delta=x.delta,sub=delta==null?`${d.role} ${d.n}경기 기준`:`최근5 ${delta>=0?'+':''}${r1(delta)} · 이전 ${Math.min(10,Math.max(3,d.n-5))}경기 대비`;return`<div class="ppaxis pp30axis"><div><span>${esc(x.l)}</span><b>${Math.round(x.v)}</b></div><div class="ppbar"><i style="width:${Math.round(clamp(x.v))}%"></i></div><small class="${delta!=null&&delta>=3?'up':delta!=null&&delta<=-3?'down':''}">${esc(sub)}</small></div>`}).join('')}
  function scout(d){
    const types=roleTypes(d),hi=d.strong[0],hi2=d.strong[1],lo=d.weak[0],trend=d.roleTrend,trendText=trend==null?`${d.role} ${d.n}경기의 현재 표본을 기준으로 평가했습니다.`:trend>=4?`최근 ${d.role} ROLE은 이전 구간보다 ${r1(trend)}점 상승했습니다.`:trend<=-4?`최근 ${d.role} ROLE은 이전 구간보다 ${Math.abs(r1(trend))}점 낮아졌습니다.`:'최근 ROLE 흐름은 이전 구간과 큰 차이가 없습니다.';
    const conf=d.n>=12?'높음':d.n>=6?'보통':d.n>=3?'낮음':'매우 낮음';
    return{types,text:`${d.role} 전적에서는 ${types[0].label} 성향이 가장 선명합니다. ${hi.l} ${Math.round(hi.v)} · ${hi2.l} ${Math.round(hi2.v)}가 강점이고, 현재 가장 큰 개선 여지는 ${lo.l} ${Math.round(lo.v)}입니다. ${trendText} 표본 신뢰도는 ${conf}입니다.`,fun:funLine(d,types[0])};
  }
  function funLine(d,type){const h=d.strong[0]?.l,w=d.weak[0]?.l;return d.role==='탱커'&&d.values.engage?.v>=78?'“싸움의 시작 버튼을 남에게 맡기기보다 직접 누르는 탱커.”':d.role==='원딜'&&d.values.survival?.v>=78?'“한 번 더 살아서 한 번 더 때리는 쪽으로 캐리하는 원딜.”':d.role==='서포터'&&d.values.peel?.v>=78?'“본인 하이라이트보다 아군 하이라이트를 만드는 쪽.”':d.role==='메이지'&&d.values.control?.v>=78?'“딜뿐 아니라 상대가 설 자리까지 줄이는 메이지.”':d.role==='브루저'&&d.values.sustainFight?.v>=78?'“첫 3초보다 그 이후가 더 부담스러운 브루저.”':d.role==='암살자'&&d.values.killConv?.v>=78?'“들어간 뒤 킬로 끝내는 비율이 강점인 암살자.”':`“${h}은 강점으로 남기고, ${w}만 한 단계 올리면 ${type.label}의 완성도가 더 높아진다.”`}
  function strengthWeak(d){return `<div class="ppsw"><div><b>강점</b>${d.strong.map(x=>`<span>+ ${esc(x.l)} <b>${Math.round(x.v)}</b></span>`).join('')}</div><div><b>개선 여지</b>${d.weak.map(x=>`<span>− ${esc(x.l)} <b>${Math.round(x.v)}</b></span>`).join('')}</div></div>`}
  function development(d){
    if(!d.n)return'<div class="ppempty">역할 표본이 없습니다.</div>';
    return d.list.slice().sort((a,b)=>Math.abs(num(b.delta))-Math.abs(num(a.delta))).map(x=>x.delta==null?`<div><span>${esc(x.l)}</span><b>${Math.round(x.v)}</b><em>${d.n}경기</em></div>`:`<div><span>${esc(x.l)}</span><b>${Math.round(x.recent)}</b><em class="${x.delta>1?'up':x.delta<-1?'down':''}">${x.delta>=0?'+':''}${r1(x.delta)}</em></div>`).join('')
  }
  function objective(d){
    const weak=d.weak[0],strong=d.strong[0],target=Math.min(96,Math.round(weak.v+5));
    return `<div class="pp30coach"><div class="ppt"><b>NEXT OBJECTIVE · ${esc(d.role)} / ${esc(weak.l)}</b><em>역할 전용 목표</em></div><div class="ppnums"><span>현재 <b>${Math.round(weak.v)}</b></span><span>목표 <b>${target}</b></span><span>${esc(strong.l)} 유지 <b>${Math.max(0,Math.round(strong.v-4))}+</b></span></div><p>${esc(weak.l)}을 약 +5 올리되 ${esc(strong.l)} 강점을 크게 희생하지 않기</p><small>${esc(d.role)} ${d.n}경기의 관측값으로 고른 한 가지 우선 목표입니다. 단일 수치가 올라도 강점 지표나 ROLE이 급락하면 개선으로 단정하지 않습니다.</small></div>`
  }
  function installStyle(){if(document.getElementById('pp30style'))return;const s=document.createElement('style');s.id='pp30style';s.textContent=`.pp30radarTitle{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:2px}.pp30radarTitle b{font-size:10px;color:#dff2ff}.pp30radarTitle span{max-width:62%;font-size:6.7px;line-height:1.4;color:#6f8da5;text-align:right}.pp30axis small{min-height:12px}.pp30roleNote{margin-top:6px;color:#7795ac;font-size:7px}.pp30coach small{display:block;color:#748fa7;line-height:1.45}.pp30specialized .pp21type b{color:#9ee4ff}`;document.head.appendChild(s)}
  function apply(){
    installStyle();const root=document.getElementById('pp19c'),role=ctx.selectedRole;if(!root||!role||!document.getElementById('pp19ov')?.classList?.contains('open'))return false;
    const d=roleData(role);if(!d.n)return false;const sig=`${role}|${d.rows.map(x=>x.id).join(',')}|${d.list.map(x=>Math.round(x.v)).join(',')}`,hero=root.querySelectorAll('.pphero .ppbox')[1];if(hero?.dataset.pp30sig===sig)return true;
    root.classList.add('pp30specialized');
    if(hero){hero.innerHTML=radar(d);hero.dataset.pp30sig=sig}
    const axes=root.querySelector('.ppaxes');if(axes){axes.innerHTML=metricCards(d);axes.dataset.pp30sig=sig}
    const s=scout(d),tags=root.querySelector('.pptags');if(tags)tags.innerHTML=s.types.map((x,i)=>`<span class="${i===0?'pp21primary':''}">${i===0?'★ ':''}${esc(x.label)}</span>`).join('');
    const sr=root.querySelector('.ppscout');if(sr)sr.textContent=s.text;const fun=root.querySelector('.ppfun');if(fun)fun.textContent=s.fun;
    const sw=root.querySelector('.ppsw');if(sw){const holder=document.createElement('div');holder.innerHTML=strengthWeak(d);sw.replaceWith(holder.firstElementChild)}
    const type=root.querySelector('.pp21type');if(type)type.innerHTML=`<span>${esc(role)} PLAY TYPE</span><b>${esc(s.types[0].label)}</b><small>${role} ${d.n}경기 기준 · 역할 수행지표 기반</small>`;
    const dev=root.querySelector('.ppdev');if(dev)dev.innerHTML=development(d);const grids=root.querySelectorAll('.ppgrid'),coachBox=grids[grids.length-1]?.querySelectorAll('.ppbox')?.[1];if(coachBox)coachBox.innerHTML=objective(d);
    const devTitle=grids[grids.length-1]?.querySelector('.ppbox>b');if(devTitle)devTitle.textContent=d.list.every(x=>x.delta==null)?`DEVELOPMENT · ${role} ${d.n}경기 현재 표본`:'DEVELOPMENT · 최근5 vs 이전 구간';
    const idx=root.querySelector('.ppidx');if(idx&&!idx.querySelector('.pp30roleNote')){const note=document.createElement('div');note.className='pp30roleNote';note.textContent=`ROLE RADAR·세부지표·SCOUT REPORT·DEVELOPMENT·NEXT OBJECTIVE 모두 ${role} 전적만 사용`;idx.appendChild(note)}
    return true;
  }
  let queued=false;function schedule(){if(queued)return;queued=true;setTimeout(()=>{queued=false;try{apply()}catch(e){console.warn('[v0.15.30] role-specialized profile apply failed',e)}},45)}
  try{
    installStyle();const oldOpen=window.openPlayerProfile;window.openPlayerProfile=function(...a){const r=oldOpen?.apply(this,a);schedule();setTimeout(schedule,140);return r};
    const mo=new MutationObserver(()=>{if(ctx.selectedRole&&document.getElementById('pp19ov')?.classList?.contains('open'))schedule()});mo.observe(document.documentElement,{subtree:true,childList:true});
    window.aramRoleProfileSpecializedV01530={ROLE_AXES,roleData,roleTypes,apply,schedule};window.__ARAM_ROLE_PROFILE_SPECIALIZED_V01530__=true;
    if(typeof DATA!=='undefined'){DATA.version=V;DATA.role_profile_specialized_v01530={version:'v0.15.30 · Role-specific Player Profile',role_radar:true,role_axes:Object.fromEntries(Object.entries(ROLE_AXES).map(([k,v])=>[k,v.map(x=>x[1])])),external_percentile:false,missing_compare_text:'role sample count instead of 비교 표본 대기',sections:['ROLE RADAR','6 role metrics','PLAY TYPE','SCOUT REPORT','strength/weakness','DEVELOPMENT','NEXT OBJECTIVE']}}
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();schedule();
  }catch(e){console.error('[v0.15.30] role-specific Player Profile failed',e);window.__ARAM_ROLE_PROFILE_SPECIALIZED_V01530__=false}
})();
