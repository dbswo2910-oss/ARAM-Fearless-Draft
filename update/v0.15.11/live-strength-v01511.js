'use strict';
(()=>{
  const V='0.15.11';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const avg=(xs,fn)=>xs?.length?xs.reduce((s,x)=>s+(Number(fn(x))||0),0)/xs.length:0;
  const sum=(xs,fn)=>xs?.reduce((s,x)=>s+(Number(fn(x))||0),0)||0;
  const itemValue=x=>typeof randomLivePlayerValue==='function'?randomLivePlayerValue(x):Number(x?.itemValue)||0;
  const sideOf=(ctx,raw)=>{
    const key=typeof randomLiveNormPlayerName==='function'?randomLiveNormPlayerName(raw):String(raw||'').toLowerCase();
    const hit=(arr)=>arr?.some(x=>[x.riotId,x.riotIdGameName,x.summonerName].some(v=>(typeof randomLiveNormPlayerName==='function'?randomLiveNormPlayerName(v):String(v||'').toLowerCase())===key));
    return hit(ctx?.ours)?'our':hit(ctx?.enemy)?'enemy':'';
  };
  const recentFlow=(ctx,windowSec=60)=>{
    const now=Number(ctx?.gameTime)||0; let our=0,enemy=0;
    for(const e of (ctx?.recentEvents||[])){
      if(!String(e?.eventName||'').toLowerCase().includes('championkill'))continue;
      const t=Number(e?.eventTime)||0;if(now&&t&&now-t>windowSec)continue;
      const s=sideOf(ctx,e?.killerName);if(s==='our')our++;else if(s==='enemy')enemy++;
    }
    return {our,enemy,diff:our-enemy};
  };
  const nextCurve=(power)=>{
    const idx=Math.min(4,(Number(power?.idx)||0)+1),o=Number(power?.ourCurve?.scores?.[idx])||0,e=Number(power?.enemyCurve?.scores?.[idx])||0;
    return {idx,label:(typeof POWER_STAGES!=='undefined'&&POWER_STAGES[idx]?.label)||'다음 구간',our:o,enemy:e,diff:o-e};
  };
  function strength(ctx,ours,enemies,modes={},enemyModes={},power=null,alive=null){
    if(!ctx)return null;
    power=power||randomLivePowerSnapshot(ctx,ours,enemies,modes,enemyModes);
    alive=alive||randomLiveAliveSnapshot(ctx);
    const oi=sum(ctx.ours,itemValue),ei=sum(ctx.enemy,itemValue),oa=avg(ctx.ours,itemValue),ea=avg(ctx.enemy,itemValue);
    const ol=avg(ctx.ours,x=>x.level),el=avg(ctx.enemy,x=>x.level);
    const curveO=Number(power?.ourCurve?.scores?.[power.idx])||Number(power?.our)||50,curveE=Number(power?.enemyCurve?.scores?.[power.idx])||Number(power?.enemy)||50;
    const flow=recentFlow(ctx,60);
    const denom=Math.max(1800,(oa+ea)/2),itemDelta=clamp((oa-ea)/denom*18,-10,10),curveDelta=clamp((curveO-curveE)*.34,-11,11),levelDelta=clamp((ol-el)*2.1,-6,6),aliveDelta=clamp((alive.our.alive-alive.enemy.alive)*6.2,-18,18),flowDelta=clamp(flow.diff*2.2,-6,6);
    const totalDelta=itemDelta+curveDelta+levelDelta+aliveDelta+flowDelta;
    const our=clamp(Math.round(50+totalDelta),15,85),enemy=100-our,diff=our-enemy;
    const buildEvidence=avg([...(ctx.ours||[]),...(ctx.enemy||[])],x=>{try{return randomLiveBuildProfile(x).confidence}catch{return 0}}),timeEvidence=clamp((Number(ctx.gameTime)||0)/900,0,1),confidence=Math.round(clamp(58+buildEvidence*29+timeEvidence*8,58,95));
    const next=nextCurve(power),nextShare=clamp(Math.round(50+clamp(next.diff*.34,-11,11)+itemDelta+levelDelta),20,80);
    let label='팽팽';if(diff>=28)label='매우 유리';else if(diff>=16)label='유리';else if(diff>=6)label='약우세';else if(diff<=-28)label='매우 불리';else if(diff<=-16)label='불리';else if(diff<=-6)label='약열세';
    let tone=diff>=6?'good':diff<=-6?'bad':'warn',call='동수 한타는 핵심 스킬과 포지션을 보고 결정';
    if(alive.our.alive>alive.enemy.alive)call='수적 우위가 살아있는 동안 압박/교전 가치가 높음';
    else if(alive.our.alive<alive.enemy.alive)call='수적 열세 해소 전 정면 교전은 보수적으로';
    else if(our>=58&&nextShare<our-4)call='현재가 상대적으로 강한 창 · 다음 구간 전에 이득 굴리기';
    else if(our>=58)call='현재 전력 우세 · 먼저 각을 만들되 핵심 쿨은 직접 확인';
    else if(our<=42&&nextShare>our+4)call='지금은 약세 · 다음 파워 구간까지 시간을 버는 편이 좋음';
    else if(our<=42)call='현재 전력 열세 · 받아치기/포킹으로 교환비 관리';
    const factors=[
      {key:'item',name:'장비 가치',our:oi,enemy:ei,ourText:Math.round(oi).toLocaleString('ko-KR'),enemyText:Math.round(ei).toLocaleString('ko-KR'),delta:itemDelta,unit:'g'},
      {key:'curve',name:`조합 파워 · ${power.label}`,our:curveO,enemy:curveE,ourText:Math.round(curveO),enemyText:Math.round(curveE),delta:curveDelta},
      {key:'level',name:'평균 레벨',our:ol,enemy:el,ourText:ol.toFixed(1),enemyText:el.toFixed(1),delta:levelDelta},
      {key:'alive',name:'현재 생존',our:alive.our.alive,enemy:alive.enemy.alive,ourText:String(alive.our.alive),enemyText:String(alive.enemy.alive),delta:aliveDelta},
      {key:'flow',name:'최근 60초 킬',our:flow.our,enemy:flow.enemy,ourText:String(flow.our),enemyText:String(flow.enemy),delta:flowDelta}
    ];
    return {our,enemy,diff,label,tone,call,confidence,factors,item:{ourTotal:oi,enemyTotal:ei,ourAvg:oa,enemyAvg:ea},flow,next,nextShare,power,alive,components:{itemDelta,curveDelta,levelDelta,aliveDelta,flowDelta,totalDelta}};
  }
  function factorRow(f){
    const m=Math.max(1,Number(f.our)||0,Number(f.enemy)||0),ow=Math.max(4,(Number(f.our)||0)/m*100),ew=Math.max(4,(Number(f.enemy)||0)/m*100),d=f.delta>=0?`+${f.delta.toFixed(1)}`:f.delta.toFixed(1),dt=f.delta>1?'our':f.delta<-1?'enemy':'';
    return `<div class="liveStrengthFactor"><div class="liveStrengthFactorName"><b>${aramHistoryEsc(f.name)}</b><span class="${dt}">${d}</span></div><div class="liveStrengthFactorDuel"><div class="liveStrengthHalf our"><span>${aramHistoryEsc(String(f.ourText))}</span><i style="width:${ow}%"></i></div><em></em><div class="liveStrengthHalf enemy"><i style="width:${ew}%"></i><span>${aramHistoryEsc(String(f.enemyText))}</span></div></div></div>`;
  }
  function card(s){
    if(!s)return'';
    const trend=s.nextShare>s.our+3?'다음 구간 우리 상승':s.nextShare<s.our-3?'다음 구간 상대 반등':'다음 구간도 비슷',pd=s.diff>=0?`+${s.diff}`:String(s.diff);
    return `<div class="liveStrengthCard ${s.tone}"><div class="liveStrengthHead"><div><span>⚔ 실시간 전력 우위</span><b>${aramHistoryEsc(s.label)} · 우리 ${s.our} : ${s.enemy} 상대</b></div><div class="liveStrengthConfidence"><small>판정 신뢰</small><b>${s.confidence}%</b></div></div><div class="liveStrengthMainBar"><div class="our" style="width:${s.our}%"><span>우리 ${s.our}</span></div><i></i><div class="enemy" style="width:${s.enemy}%"><span>상대 ${s.enemy}</span></div></div><div class="liveStrengthDelta">전력 차이 <b>${pd}</b> · ${aramHistoryEsc(s.call)}</div><div class="liveStrengthFactors">${s.factors.map(factorRow).join('')}</div><div class="liveStrengthFooter"><span><b>${aramHistoryEsc(s.next.label)}</b> 조합 ${Math.round(s.next.our)}:${Math.round(s.next.enemy)} · ${aramHistoryEsc(trend)}</span><span>장비가치 = Live Client에 보이는 현재 장착 아이템 가격 합계</span></div></div>`;
  }
  function installStyles(){
    if(document.getElementById('liveStrengthV01511Style'))return;
    const st=document.createElement('style');st.id='liveStrengthV01511Style';st.textContent=`
.liveStrengthCard{margin-bottom:9px;padding:12px;border:1px solid #35516d;border-radius:13px;background:linear-gradient(135deg,#0a1c2c,#081522);box-shadow:0 8px 24px #0002}.liveStrengthCard.good{border-color:#2d7256}.liveStrengthCard.bad{border-color:#7b3e49}.liveStrengthCard.warn{border-color:#6d5b32}.liveStrengthHead{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.liveStrengthHead span{font-size:9px;color:#83a1bc;font-weight:900}.liveStrengthHead>div>b{display:block;margin-top:3px;font-size:18px;color:#f3f8fc}.liveStrengthConfidence{text-align:right;min-width:62px}.liveStrengthConfidence small{display:block;color:#6f879d;font-size:8px}.liveStrengthConfidence b{display:block;color:#d8e8f5;font-size:15px}.liveStrengthMainBar{position:relative;display:flex;height:30px;margin-top:10px;border-radius:9px;overflow:hidden;background:#06101a;border:1px solid #294158}.liveStrengthMainBar>div{display:flex;align-items:center;font-size:10px;font-weight:900;transition:width .25s ease}.liveStrengthMainBar .our{justify-content:flex-start;padding-left:10px;background:linear-gradient(90deg,#153d66,#1976b6);color:#dff4ff}.liveStrengthMainBar .enemy{justify-content:flex-end;padding-right:10px;background:linear-gradient(90deg,#8b3341,#4f1d28);color:#ffe3e6}.liveStrengthMainBar>i{position:absolute;left:50%;top:0;bottom:0;width:1px;background:#d8e4ee99;z-index:2}.liveStrengthDelta{margin:7px 0 9px;color:#94aabd;font-size:9px}.liveStrengthDelta b{color:#fff}.liveStrengthFactors{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}.liveStrengthFactor{padding:7px;border:1px solid #263d53;border-radius:9px;background:#081421}.liveStrengthFactorName{display:flex;justify-content:space-between;gap:4px;align-items:center}.liveStrengthFactorName b{font-size:8px;color:#a9bdce}.liveStrengthFactorName span{font-size:8px;color:#7890a5}.liveStrengthFactorName span.our{color:#67c9ff}.liveStrengthFactorName span.enemy{color:#ff8896}.liveStrengthFactorDuel{display:grid;grid-template-columns:1fr 1px 1fr;gap:4px;align-items:center;margin-top:6px}.liveStrengthFactorDuel>em{height:24px;background:#31485d}.liveStrengthHalf{position:relative;height:24px;overflow:hidden;display:flex;align-items:center}.liveStrengthHalf i{position:absolute;top:7px;height:10px;opacity:.78}.liveStrengthHalf span{position:relative;z-index:2;font-size:8px;font-weight:900;color:#dceaf4}.liveStrengthHalf.our{justify-content:flex-end}.liveStrengthHalf.our i{right:0;background:#1777b4}.liveStrengthHalf.our span{padding-right:4px}.liveStrengthHalf.enemy{justify-content:flex-start}.liveStrengthHalf.enemy i{left:0;background:#8e3543}.liveStrengthHalf.enemy span{padding-left:4px}.liveStrengthFooter{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:8px;padding-top:7px;border-top:1px solid #20364a;color:#70899f;font-size:8px}.liveStrengthFooter b{color:#b7cada}@media(max-width:1100px){.liveStrengthFactors{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:720px){.liveStrengthFactors{grid-template-columns:1fr 1fr}.liveStrengthHead>div>b{font-size:15px}}`;
    document.head.appendChild(st);
  }
  try{
    installStyles();
    if(typeof DATA!=='undefined'){
      DATA.version=V;
      DATA.live_strength_v01511={version:'v0.15.11 · LIVE Strength Advantage',uses:['visible equipped item value','current power curve','level','alive/respawn state','recent champion kills'],hidden_enemy_gold_estimate:false,win_probability:false,principle:'공개 Live Client 관측값과 조합 파워를 분리 가중해 현재 전투력 우위를 표시'};
    }
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    const oldSummary=randomLiveSummaryHtml;
    randomLiveSummaryHtml=function(ctx,plan,threats,advice,power,alive){
      if(!ctx)return oldSummary(ctx,plan,threats,advice,power,alive);
      const ours=ctx.ours.map(x=>x.name).filter(n=>byName[n]),enemies=ctx.enemy.map(x=>x.name).filter(n=>byName[n]),s=strength(ctx,ours,enemies,randomState.ourModes,randomState.enemyModes,power,alive),t=threats[0],next=advice?.items?.[0];
      return `${card(s)}<div class="randomLiveSummaryGrid"><div class="randomLiveHeroCall ${plan.tone}"><span>현재 교전 판단</span><b>${aramHistoryEsc(plan.headline)}</b><p>${aramHistoryEsc(plan.detail)}<br><b style="font-size:10px">내 역할:</b> ${aramHistoryEsc(randomLiveLocalJob(ctx,randomState.ourModes))}</p></div><div class="randomLiveQuickCards"><div class="randomLiveQuickCard"><span>최고위협</span><b>${t?`${aramHistoryEsc(t.name)} ${Math.round(t.score)}`:'-'}</b><small>${t?`${t.damageType} 중심 · ${t.scores.kills}/${t.scores.deaths}/${t.scores.assists} · Lv.${t.level}`:'-'}</small></div><div class="randomLiveQuickCard"><span>다음 구매</span><b>${next?aramHistoryEsc(next.item):'-'}</b><small>${next?aramHistoryEsc(next.reason):'내 아이템 정보 대기'}</small></div><div class="randomLiveQuickCard"><span>현재 구도</span><b>${s.label} · ${s.our}:${s.enemy}</b><small>장비가치 ${Math.round(s.item.ourTotal).toLocaleString('ko-KR')}:${Math.round(s.item.enemyTotal).toLocaleString('ko-KR')} · 생존 ${alive.our.alive}:${alive.enemy.alive}</small></div></div></div>`;
    };
    const oldTiming=randomLiveTimingHtml;
    randomLiveTimingHtml=function(ctx,power,alive){
      if(!ctx)return oldTiming(ctx,power,alive);
      const html=oldTiming(ctx,power,alive),ours=ctx.ours.map(x=>x.name).filter(n=>byName[n]),enemies=ctx.enemy.map(x=>x.name).filter(n=>byName[n]),s=strength(ctx,ours,enemies,randomState.ourModes,randomState.enemyModes,power,alive);
      return html.replace('평균 아이템 가치','평균 장비 가치').replace('</div></div><div class="randomDeadList">',`</div><div class="randomTimingCard"><span>실시간 전력</span><b>우리 ${s.our} : ${s.enemy} 상대</b></div></div><div class="randomDeadList">`);
    };
    window.randomLiveStrengthSnapshotV01511=strength;
    window.randomLiveStrengthCardV01511=card;
    window.__ARAM_LIVE_STRENGTH_V01511__=true;
    if(typeof renderRandomDetails==='function')setTimeout(()=>{try{renderRandomDetails()}catch{}},0);
  }catch(e){console.error('[v0.15.11 LIVE strength patch]',e)}
})();
