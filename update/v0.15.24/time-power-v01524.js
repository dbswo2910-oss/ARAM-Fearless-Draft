'use strict';
(()=>{
  const V='0.15.24';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const avg=(xs,fn)=>xs?.length?xs.reduce((s,x)=>s+(Number(fn(x))||0),0)/xs.length:0;
  const sum=(xs,fn)=>xs?.reduce((s,x)=>s+(Number(fn(x))||0),0)||0;
  const esc=s=>{try{return aramHistoryEsc(String(s??''))}catch{return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}};
  const itemValue=x=>typeof randomLivePlayerValue==='function'?Number(randomLivePlayerValue(x))||0:Number(x?.itemValue)||0;
  const itemName=x=>String(x?.displayName||x?.name||x?.rawDisplayName||'').toLowerCase();
  const itemPrice=x=>Number(x?.price??x?.totalPrice??x?.gold?.total??x?.cost??x?.totalGold??0)||0;
  const itemId=x=>Number(x?.itemID??x?.itemId??x?.id??0)||0;
  let smooth={key:'',time:0,share:null,raw:null};

  function stableCtx(ctx){try{return window.aramLiveItemMemoryV01520?.sync?.(ctx)||ctx}catch{return ctx}}
  function rosterKey(ctx){
    const one=p=>String(p?.riotId||p?.summonerName||p?.name||p?.championName||p?.rawChampionName||'').toLowerCase();
    return [...(ctx?.ours||[]).map(one).sort(),':',...(ctx?.enemy||[]).map(one).sort()].join('|');
  }
  function items(p){return Array.isArray(p?.items)?p.items:[]}
  function isCore(x){
    if(!x||!itemId(x))return false;
    const n=itemName(x),price=itemPrice(x);
    if(/boots|장화|신발|guardian|수호자|potion|물약|elixir|영약|ward|와드|trinket|장신구|cookie|비스킷/.test(n))return false;
    return price>=2000;
  }
  function coreCount(p){return items(p).filter(isCore).reduce((s,x)=>s+Math.max(1,Number(x?.count)||1),0)}
  function teamCore(ps){return sum(ps,coreCount)}
  function breakpoint(ps){
    const levels=(ps||[]).map(x=>Number(x?.level)||0),c6=levels.filter(x=>x>=6).length,c11=levels.filter(x=>x>=11).length,c16=levels.filter(x=>x>=16).length;
    return {c6,c11,c16,score:c6*.45+c11*1.0+c16*1.7,text:`${c6}/${c11}/${c16}`};
  }
  function nextCurve(power){
    const idx=Math.min(4,(Number(power?.idx)||0)+1),o=Number(power?.ourCurve?.scores?.[idx])||0,e=Number(power?.enemyCurve?.scores?.[idx])||0;
    return {idx,label:(typeof POWER_STAGES!=='undefined'&&POWER_STAGES[idx]?.label)||'다음 구간',our:o,enemy:e,diff:o-e};
  }
  function smoothShare(raw,ctx){
    const key=rosterKey(ctx),t=Number(ctx?.gameTime)||0;
    if(!smooth.key||smooth.key!==key||(smooth.time&&t&&t+20<smooth.time)||smooth.share==null){smooth={key,time:t,share:raw,raw};return raw}
    if(t&&smooth.time&&t<=smooth.time+.25)return smooth.share;
    const gap=raw-smooth.share,alpha=Math.abs(gap)>=10?.48:Math.abs(gap)>=5?.36:.27;
    let next=smooth.share+gap*alpha;
    if(Math.abs(next-smooth.share)<.85)next=smooth.share;
    smooth={key,time:t||smooth.time,share:next,raw};
    return next;
  }
  function reasonText(factors,our){
    const xs=factors.filter(x=>Math.abs(Number(x.delta)||0)>=.8).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
    if(!xs.length)return '핵심 타이밍 차이가 작아 거의 동등한 구간';
    const favorable=xs.filter(x=>our?x.delta>0:x.delta<0).slice(0,2);
    const names=(favorable.length?favorable:xs.slice(0,2)).map(x=>x.name.replace(/ · .*/,''));
    return `${names.join(' · ')} 쪽 차이가 가장 큼`;
  }
  function strength(ctx,ours,enemies,modes={},enemyModes={},power=null){
    ctx=stableCtx(ctx);if(!ctx)return null;
    try{power=power||randomLivePowerSnapshot(ctx,ours,enemies,modes,enemyModes)}catch{}
    const oi=sum(ctx.ours,itemValue),ei=sum(ctx.enemy,itemValue),oa=avg(ctx.ours,itemValue),ea=avg(ctx.enemy,itemValue);
    const oc=teamCore(ctx.ours),ec=teamCore(ctx.enemy),ol=avg(ctx.ours,x=>x.level),el=avg(ctx.enemy,x=>x.level),ob=breakpoint(ctx.ours),eb=breakpoint(ctx.enemy);
    const curveO=Number(power?.ourCurve?.scores?.[power?.idx])||Number(power?.our)||50,curveE=Number(power?.enemyCurve?.scores?.[power?.idx])||Number(power?.enemy)||50;
    const itemDenom=Math.max(2200,(oa+ea)/2),itemDelta=clamp((oa-ea)/itemDenom*16,-8,8);
    const coreDelta=clamp((oc-ec)*1.55,-6,6),levelDelta=clamp((ol-el)*2.0,-4.5,4.5),breakDelta=clamp((ob.score-eb.score)*1.25,-5,5),curveDelta=clamp((curveO-curveE)*.30,-9,9);
    const totalDelta=itemDelta+coreDelta+levelDelta+breakDelta+curveDelta,rawShare=clamp(50+totalDelta,20,80),our=Math.round(clamp(smoothShare(rawShare,ctx),20,80)),enemy=100-our,diff=our-enemy;
    const next=nextCurve(power),nextDelta=itemDelta+coreDelta+levelDelta+breakDelta+clamp(next.diff*.30,-9,9),nextShare=Math.round(clamp(50+nextDelta,20,80));
    const factors=[
      {key:'item',name:'장비 실전가치',our:oi,enemy:ei,ourText:Math.round(oi).toLocaleString('ko-KR'),enemyText:Math.round(ei).toLocaleString('ko-KR'),delta:itemDelta},
      {key:'core',name:'코어 완성',our:oc,enemy:ec,ourText:`${oc}개`,enemyText:`${ec}개`,delta:coreDelta},
      {key:'level',name:'평균 레벨',our:ol,enemy:el,ourText:ol.toFixed(1),enemyText:el.toFixed(1),delta:levelDelta},
      {key:'break',name:'핵심 레벨 · 6/11/16',our:ob.score,enemy:eb.score,ourText:ob.text,enemyText:eb.text,delta:breakDelta},
      {key:'curve',name:`조합 성장곡선 · ${power?.label||'현재'}`,our:curveO,enemy:curveE,ourText:Math.round(curveO),enemyText:Math.round(curveE),delta:curveDelta}
    ];
    let label='팽팽';if(diff>=24)label='매우 유리';else if(diff>=12)label='유리';else if(diff>=5)label='약우세';else if(diff<=-24)label='매우 불리';else if(diff<=-12)label='불리';else if(diff<=-5)label='약열세';
    const tone=diff>=5?'good':diff<=-5?'bad':'warn';
    const call=diff>=5?`정상 5:5 기준 우리 우세 · ${reasonText(factors,true)}`:diff<=-5?`정상 5:5 기준 상대 우세 · ${reasonText(factors,false)}`:'정상 5:5 기준 큰 전력 차이 없음';
    const rosterEvidence=Math.min(1,Math.min((ctx.ours||[]).length,(ctx.enemy||[]).length)/5),itemEvidence=Math.min(1,((ctx.ours||[]).filter(x=>itemValue(x)>0).length+(ctx.enemy||[]).filter(x=>itemValue(x)>0).length)/10),curveEvidence=power?1:.35;
    const confidence=Math.round(clamp(56+rosterEvidence*15+itemEvidence*12+curveEvidence*10,56,93));
    return {our,enemy,diff,label,tone,call,confidence,factors,item:{ourTotal:oi,enemyTotal:ei,ourAvg:oa,enemyAvg:ea},core:{our:oc,enemy:ec},level:{our:ol,enemy:el},breakpoints:{our:ob,enemy:eb},power,next,nextShare,components:{itemDelta,coreDelta,levelDelta,breakDelta,curveDelta,totalDelta,rawShare}};
  }
  function factorRow(f){
    const m=Math.max(1,Number(f.our)||0,Number(f.enemy)||0),ow=Math.max(4,(Number(f.our)||0)/m*100),ew=Math.max(4,(Number(f.enemy)||0)/m*100),d=f.delta>=0?`+${f.delta.toFixed(1)}`:f.delta.toFixed(1),dt=f.delta>.8?'our':f.delta<-.8?'enemy':'';
    return `<div class="liveStrengthFactor"><div class="liveStrengthFactorName"><b>${esc(f.name)}</b><span class="${dt}">${d}</span></div><div class="liveStrengthFactorDuel"><div class="liveStrengthHalf our"><span>${esc(f.ourText)}</span><i style="width:${ow}%"></i></div><em></em><div class="liveStrengthHalf enemy"><i style="width:${ew}%"></i><span>${esc(f.enemyText)}</span></div></div></div>`;
  }
  function card(s){
    if(!s)return'';const trend=s.nextShare>s.our+3?'다음 구간 우리 상승':s.nextShare<s.our-3?'다음 구간 상대 상승':'다음 구간도 비슷',pd=s.diff>=0?`+${s.diff}`:String(s.diff);
    return `<div class="liveStrengthCard ${s.tone}"><div class="liveStrengthHead"><div><span>⏱ 시간대 전력 · 정상 5:5 기준</span><b>${esc(s.label)} · 우리 ${s.our} : ${s.enemy} 상대</b></div><div class="liveStrengthConfidence"><small>판정 신뢰</small><b>${s.confidence}%</b></div></div><div class="liveStrengthMainBar"><div class="our" style="width:${s.our}%"><span>우리 ${s.our}</span></div><i></i><div class="enemy" style="width:${s.enemy}%"><span>상대 ${s.enemy}</span></div></div><div class="liveStrengthDelta">시간대 전력 차이 <b>${pd}</b> · ${esc(s.call)}</div><div class="liveStrengthFactors">${s.factors.map(factorRow).join('')}</div><div class="liveStrengthFooter"><span><b>${esc(s.next.label)}</b> 예상 ${Math.round(s.next.our)}:${Math.round(s.next.enemy)} · ${esc(trend)}</span><span>생존 인원·최근 킬 제외 · 장비/코어/레벨/핵심레벨/성장곡선만 반영</span></div></div>`;
  }
  function installStyle(){
    if(document.getElementById('timePowerV01524Style'))return;const s=document.createElement('style');s.id='timePowerV01524Style';s.textContent=`
.liveStrengthCard .liveStrengthFactors{grid-template-columns:repeat(5,minmax(0,1fr))}.liveStrengthCard .liveStrengthHead>div>span{color:#8db6d4}.liveStrengthCard .liveStrengthDelta{line-height:1.45}@media(max-width:1100px){.liveStrengthCard .liveStrengthFactors{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:720px){.liveStrengthCard .liveStrengthFactors{grid-template-columns:1fr 1fr}}
`;document.head.appendChild(s)
  }
  try{
    installStyle();
    const oldSummary=randomLiveSummaryHtml;
    randomLiveSummaryHtml=function(ctx,plan,threats,advice,power,alive){
      if(!ctx)return oldSummary(ctx,plan,threats,advice,power,alive);
      const stable=stableCtx(ctx),ours=(stable.ours||[]).map(x=>x.name).filter(n=>typeof byName==='undefined'||byName[n]),enemies=(stable.enemy||[]).map(x=>x.name).filter(n=>typeof byName==='undefined'||byName[n]),s=strength(stable,ours,enemies,randomState?.ourModes||{},randomState?.enemyModes||{},power),t=threats?.[0],next=advice?.items?.[0];
      return `${card(s)}<div class="randomLiveSummaryGrid"><div class="randomLiveHeroCall ${plan?.tone||''}"><span>현재 플레이 가이드</span><b>${esc(plan?.headline||'-')}</b><p>${esc(plan?.detail||'-')}<br><b style="font-size:10px">내 역할:</b> ${esc(typeof randomLiveLocalJob==='function'?randomLiveLocalJob(stable,randomState?.ourModes||{}):'-')}</p></div><div class="randomLiveQuickCards"><div class="randomLiveQuickCard"><span>최고위협</span><b>${t?`${esc(t.name)} ${Math.round(t.score)}`:'-'}</b><small>${t?`${esc(t.damageType)} 중심 · ${t.scores?.kills??0}/${t.scores?.deaths??0}/${t.scores?.assists??0} · Lv.${t.level??'-'}`:'-'}</small></div><div class="randomLiveQuickCard"><span>다음 구매</span><b>${next?esc(next.item):'-'}</b><small>${next?esc(next.reason):'내 아이템 정보 대기'}</small></div><div class="randomLiveQuickCard"><span>시간대 전력</span><b>${esc(s.label)} · ${s.our}:${s.enemy}</b><small>장비 ${Math.round(s.item.ourTotal).toLocaleString('ko-KR')}:${Math.round(s.item.enemyTotal).toLocaleString('ko-KR')} · 코어 ${s.core.our}:${s.core.enemy}</small></div></div></div>`;
    };
    window.randomLiveTimePowerSnapshotV01524=(ctx,ours,enemies,modes,enemyModes,power)=>strength(ctx,ours,enemies,modes,enemyModes,power);
    window.aramTimePowerV01524={version:V,strength,coreCount,breakpoint,reset:()=>{smooth={key:'',time:0,share:null,raw:null}}};
    window.__ARAM_TIME_POWER_V01524__=true;
    if(typeof DATA!=='undefined'){
      DATA.version=V;
      DATA.time_power_v01524={version:'v0.15.24 · Stable Time-Window Power',uses:['effective equipped item value','completed core timing','average level','level 6/11/16 breakpoints','current composition growth curve'],excludes:['alive player count','respawn state','recent kills','recent kill flow'],smoothing:true,principle:'정상 5:5로 리셋된 현재 시간대의 구조적 전투력만 표시'};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    if(typeof renderRandomDetails==='function')setTimeout(()=>{try{renderRandomDetails()}catch{}},0);
  }catch(e){console.error('[v0.15.24] Time-window power patch failed',e);window.__ARAM_TIME_POWER_V01524__=false}
})();
