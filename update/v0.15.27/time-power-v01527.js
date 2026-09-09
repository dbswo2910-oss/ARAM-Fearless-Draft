'use strict';
(()=>{
  const V='0.15.27';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const finite=v=>Number.isFinite(Number(v));
  const num=(v,d=0)=>finite(v)?Number(v):d;
  const sum=(xs,fn)=>Array.isArray(xs)?xs.reduce((s,x)=>s+num(fn(x)),0):0;
  const esc=s=>{try{return aramHistoryEsc(String(s??''))}catch{return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}};
  let catalog={ok:false,loaded:false,version:'',items:{},error:''};
  let smooth={key:'',time:0,share:null,discrete:''};

  const stableCtx=ctx=>{try{return window.aramLiveItemMemoryV01520?.sync?.(ctx)||ctx}catch{return ctx}};
  const pkey=p=>String(p?.riotId||p?.summonerName||p?.name||p?.championName||p?.rawChampionName||'').toLowerCase();
  const rosterKey=ctx=>[...(ctx?.ours||[]).map(pkey).sort(),':',...(ctx?.enemy||[]).map(pkey).sort()].join('|');
  const inventory=p=>{for(const x of [p?.items,p?.inventory,p?.itemList,p?.raw?.items,p?.live?.items,p?.player?.items])if(Array.isArray(x))return x;return null};
  const iid=x=>num(x?.itemID??x?.itemId??x?.id??x?.item?.id,0);
  const iname=x=>String(x?.displayName||x?.name||x?.rawDisplayName||'').toLowerCase();
  const directCost=x=>num(x?.price??x?.totalPrice??x?.gold?.total??x?.cost??x?.totalGold,0);
  const levelOf=p=>{for(const v of [p?.level,p?.championLevel,p?.raw?.level,p?.live?.level,p?.player?.level]){if(finite(v)){const n=Number(v);if(n>=1&&n<=18)return n}}return null};

  function singleItemValue(x){
    try{if(typeof randomLivePlayerValue!=='function')return 0;const v=num(randomLivePlayerValue({items:[x]}),0);return v>0&&v<10000?v:0}catch{return 0}
  }
  function itemMeta(x){
    const id=iid(x),d=id&&catalog?.items?.[String(id)]||null,cost=num(d?.total,0)||directCost(x)||singleItemValue(x),name=String(d?.name||iname(x)||'').toLowerCase();
    const excluded=/guardian|수호자|elixir|영약|potion|물약|trinket|장신구|ward|와드|biscuit|비스킷/.test(name);
    const full=d?!!d.full:(cost>=2000&&!excluded);
    return{id,cost,full,name:d?.name||String(x?.displayName||x?.name||''),source:d?'ddragon':cost?'live':'unknown'};
  }
  function playerObs(p){
    const inv=inventory(p);if(inv===null)return{available:false,value:0,known:0,unknown:0,itemCount:0,core:0};
    let known=0,unknown=0,itemCount=0,core=0,value=0;
    for(const x of inv){const id=iid(x);if(!id)continue;itemCount++;const m=itemMeta(x),count=Math.max(1,num(x?.count,1));if(m.source==='unknown')unknown++;else known++;value+=m.cost*count;if(m.full)core+=count}
    try{const v=num(typeof randomLivePlayerValue==='function'?randomLivePlayerValue(p):0,0);if(v>0)value=v}catch{}
    return{available:true,value,known,unknown,itemCount,core};
  }
  function teamInventory(ps){
    ps=Array.isArray(ps)?ps:[];const rows=ps.map(playerObs),available=rows.filter(x=>x.available).length,known=sum(rows,x=>x.known),unknown=sum(rows,x=>x.unknown),itemCount=known+unknown;
    return{roster:ps.length,rows,available,known,unknown,itemCount,resolvedRatio:itemCount?known/itemCount:1,value:sum(rows,x=>x.value),core:sum(rows,x=>x.core)};
  }
  function teamLevels(ps){
    ps=Array.isArray(ps)?ps:[];const values=ps.map(levelOf),valid=values.filter(v=>v!==null),available=valid.length,reliable=ps.length===5&&available===5,avg=reliable?valid.reduce((a,b)=>a+b,0)/5:0;
    const c6=valid.filter(x=>x>=6).length,c11=valid.filter(x=>x>=11).length,c16=valid.filter(x=>x>=16).length;
    return{roster:ps.length,values,available,reliable,avg,c6,c11,c16,score:c6*.45+c11*1+c16*1.7,text:reliable?`${c6}/${c11}/${c16}`:'대기'};
  }
  function currentCurve(power){
    if(!power)return{enabled:false,our:0,enemy:0,label:'현재'};
    const idx=num(power?.idx,0),a=power?.ourCurve?.scores?.[idx],b=power?.enemyCurve?.scores?.[idx];
    if(finite(a)&&finite(b))return{enabled:true,our:Number(a),enemy:Number(b),label:String(power?.label||'현재'),idx};
    if(finite(power?.our)&&finite(power?.enemy))return{enabled:true,our:Number(power.our),enemy:Number(power.enemy),label:String(power?.label||'현재'),idx};
    return{enabled:false,our:0,enemy:0,label:String(power?.label||'현재'),idx};
  }
  function nextCurve(power){
    const cur=currentCurve(power);if(!cur.enabled)return{enabled:false,label:'다음 구간',our:0,enemy:0,diff:0};
    const idx=Math.min(4,num(power?.idx,0)+1),a=power?.ourCurve?.scores?.[idx],b=power?.enemyCurve?.scores?.[idx];
    if(!finite(a)||!finite(b))return{enabled:false,label:'다음 구간',our:0,enemy:0,diff:0};
    return{enabled:true,idx,label:(typeof POWER_STAGES!=='undefined'&&POWER_STAGES[idx]?.label)||'다음 구간',our:Number(a),enemy:Number(b),diff:Number(a)-Number(b)};
  }
  function smoothShare(raw,ctx,discrete){
    const key=rosterKey(ctx),t=num(ctx?.gameTime,0);
    if(!smooth.key||smooth.key!==key||(smooth.time&&t&&t+20<smooth.time)||smooth.share==null){smooth={key,time:t,share:raw,discrete};return raw}
    if(t&&smooth.time&&t<=smooth.time+.2)return smooth.share;
    const gap=raw-smooth.share,major=discrete!==smooth.discrete,alpha=major?.76:Math.abs(gap)>=8?.58:Math.abs(gap)>=4?.46:.34;
    let next=smooth.share+gap*alpha;if(Math.abs(next-smooth.share)<.55)next=smooth.share;smooth={key,time:t||smooth.time,share:next,discrete};return next;
  }
  function reasonText(factors,ours){
    const xs=factors.filter(x=>x.enabled&&Math.abs(num(x.delta))>=.65).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));if(!xs.length)return '핵심 타이밍 차이가 작아 거의 동등한 구간';
    const fav=xs.filter(x=>ours?x.delta>0:x.delta<0).slice(0,2),pick=fav.length?fav:xs.slice(0,2);return `${pick.map(x=>x.short).join(' · ')} 쪽 차이가 가장 큼`;
  }
  function strength(ctx,ours,enemies,modes={},enemyModes={},power=null){
    ctx=stableCtx(ctx);if(!ctx)return null;const op=Array.isArray(ctx.ours)?ctx.ours:[],ep=Array.isArray(ctx.enemy)?ctx.enemy:[];
    try{power=power||randomLivePowerSnapshot(ctx,ours,enemies,modes,enemyModes)}catch{}
    const oi=teamInventory(op),ei=teamInventory(ep),fullRoster=op.length===5&&ep.length===5;
    const itemEnabled=fullRoster&&oi.available===5&&ei.available===5&&oi.unknown===0&&ei.unknown===0;
    const coreEnabled=itemEnabled;
    const oa=itemEnabled?oi.value/5:0,ea=itemEnabled?ei.value/5:0,itemDen=Math.max(2500,(oa+ea)/2),itemDelta=itemEnabled?clamp((oa-ea)/itemDen*14,-7,7):0;
    const coreDelta=coreEnabled?clamp((oi.core-ei.core)*1.25,-5,5):0;
    const ol=teamLevels(op),el=teamLevels(ep),levelEnabled=ol.reliable&&el.reliable;
    const levelDelta=levelEnabled?clamp((ol.avg-el.avg)*1.8,-4,4):0,breakDelta=levelEnabled?clamp((ol.score-el.score)*1.1,-4,4):0;
    const cv=currentCurve(power),curveEnabled=fullRoster&&Array.isArray(ours)&&ours.length===5&&Array.isArray(enemies)&&enemies.length===5&&cv.enabled,curveDelta=curveEnabled?clamp((cv.our-cv.enemy)*.32,-9,9):0;
    const totalDelta=itemDelta+coreDelta+levelDelta+breakDelta+curveDelta,rawShare=clamp(50+totalDelta,20,80);
    const discrete=`i${itemEnabled?1:0}|c${coreEnabled?`${oi.core}/${ei.core}`:'x'}|l${levelEnabled?`${Math.round(ol.avg*10)}/${Math.round(el.avg*10)}:${ol.text}/${el.text}`:'x'}|p${curveEnabled?`${Math.round(cv.our)}/${Math.round(cv.enemy)}`:'x'}`;
    const our=Math.round(clamp(smoothShare(rawShare,ctx,discrete),20,80)),enemy=100-our,diff=our-enemy,nx=nextCurve(power),nextShare=nx.enabled?Math.round(clamp(50+itemDelta+coreDelta+levelDelta+breakDelta+clamp(nx.diff*.32,-9,9),20,80)):our;
    const itemNote=itemEnabled?`${catalog.ok?`Data Dragon ${catalog.version}`:'Live 아이템'} · 10/10`:`데이터 대기 · 인벤토리 ${oi.available+ei.available}/10 · 미확인 ${oi.unknown+ei.unknown}`;
    const levelNote=levelEnabled?'레벨 10/10 확인':`데이터 대기 · 레벨 ${ol.available+el.available}/10`;
    const curveNote=curveEnabled?'5:5 챔피언 구성 확인':'데이터 대기';
    const factors=[
      {key:'item',name:'장비 실전가치',short:'장비',our:oi.value,enemy:ei.value,ourText:itemEnabled?Math.round(oi.value).toLocaleString('ko-KR'):'대기',enemyText:itemEnabled?Math.round(ei.value).toLocaleString('ko-KR'):'대기',delta:itemDelta,enabled:itemEnabled,note:itemNote},
      {key:'core',name:'코어 완성',short:'코어',our:oi.core,enemy:ei.core,ourText:coreEnabled?`${oi.core}개`:'대기',enemyText:coreEnabled?`${ei.core}개`:'대기',delta:coreDelta,enabled:coreEnabled,note:itemNote},
      {key:'level',name:'평균 레벨',short:'레벨',our:ol.avg,enemy:el.avg,ourText:levelEnabled?ol.avg.toFixed(1):'대기',enemyText:levelEnabled?el.avg.toFixed(1):'대기',delta:levelDelta,enabled:levelEnabled,note:levelNote},
      {key:'break',name:'핵심 레벨 · 6/11/16',short:'핵심레벨',our:ol.score,enemy:el.score,ourText:ol.text,enemyText:el.text,delta:breakDelta,enabled:levelEnabled,note:levelNote},
      {key:'curve',name:`조합 성장곡선 · ${cv.label}`,short:'성장곡선',our:cv.our,enemy:cv.enemy,ourText:curveEnabled?Math.round(cv.our):'대기',enemyText:curveEnabled?Math.round(cv.enemy):'대기',delta:curveDelta,enabled:curveEnabled,note:curveNote}
    ];
    let label='팽팽';if(diff>=24)label='매우 유리';else if(diff>=12)label='유리';else if(diff>=5)label='약우세';else if(diff<=-24)label='매우 불리';else if(diff<=-12)label='불리';else if(diff<=-5)label='약열세';
    const tone=diff>=5?'good':diff<=-5?'bad':'warn',call=diff>=5?`정상 5:5 기준 우리 우세 · ${reasonText(factors,true)}`:diff<=-5?`정상 5:5 기준 상대 우세 · ${reasonText(factors,false)}`:'정상 5:5 기준 큰 전력 차이 없음';
    const enabledCount=factors.filter(x=>x.enabled).length,confidence=Math.round(clamp(48+enabledCount*8+(fullRoster?5:0),48,93));
    return{our,enemy,diff,label,tone,call,confidence,factors,item:{our:oi,enemy:ei,enabled:itemEnabled},core:{our:oi.core,enemy:ei.core,enabled:coreEnabled},level:{our:ol,enemy:el,enabled:levelEnabled},curve:{...cv,enabled:curveEnabled},next:nx,nextShare,components:{itemDelta,coreDelta,levelDelta,breakDelta,curveDelta,totalDelta,rawShare},coverage:{fullRoster,item:itemNote,level:levelNote,curve:curveNote}};
  }
  function factorRow(f){
    const disabled=!f.enabled,m=Math.max(1,num(f.our),num(f.enemy)),ow=Math.max(4,num(f.our)/m*100),ew=Math.max(4,num(f.enemy)/m*100),d=disabled?'대기':f.delta>=0?`+${f.delta.toFixed(1)}`:f.delta.toFixed(1),dt=disabled?'':f.delta>.65?'our':f.delta<-.65?'enemy':'';
    return `<div class="liveStrengthFactor ${disabled?'tp27disabled':''}"><div class="liveStrengthFactorName"><b>${esc(f.name)}</b><span class="${dt}">${esc(d)}</span></div><div class="liveStrengthFactorDuel"><div class="liveStrengthHalf our"><span>${esc(String(f.ourText))}</span><i style="width:${ow}%"></i></div><em></em><div class="liveStrengthHalf enemy"><i style="width:${ew}%"></i><span>${esc(String(f.enemyText))}</span></div></div>${f.note?`<small class="tp27note">${esc(f.note)}</small>`:''}</div>`;
  }
  function card(s){
    if(!s)return'';const trend=!s.next.enabled?'다음 구간 데이터 대기':s.nextShare>s.our+3?'다음 구간 우리 상승':s.nextShare<s.our-3?'다음 구간 상대 상승':'다음 구간도 비슷',pd=s.diff>=0?`+${s.diff}`:String(s.diff);
    return `<div class="liveStrengthCard ${s.tone}"><div class="liveStrengthHead"><div><span>⏱ 시간대 전력 · 정상 5:5 기준</span><b>${esc(s.label)} · 우리 ${s.our} : ${s.enemy} 상대</b></div><div class="liveStrengthConfidence"><small>판정 신뢰</small><b>${s.confidence}%</b></div></div><div class="liveStrengthMainBar"><div class="our" style="width:${s.our}%"><span>우리 ${s.our}</span></div><i></i><div class="enemy" style="width:${s.enemy}%"><span>상대 ${s.enemy}</span></div></div><div class="liveStrengthDelta">시간대 전력 차이 <b>${pd}</b> · ${esc(s.call)}</div><div class="liveStrengthFactors">${s.factors.map(factorRow).join('')}</div><div class="liveStrengthFooter"><span>${s.next.enabled?`<b>${esc(s.next.label)}</b> 예상 ${Math.round(s.next.our)}:${Math.round(s.next.enemy)} · ${esc(trend)}`:esc(trend)}</span><span>생존 인원·최근 킬 미반영 · 불완전 데이터는 0으로 간주하지 않고 해당 축 제외</span></div></div>`;
  }
  function installStyle(){if(document.getElementById('timePowerV01527Style'))return;const st=document.createElement('style');st.id='timePowerV01527Style';st.textContent=`.liveStrengthFactor.tp27disabled{opacity:.52}.tp27note{display:block;margin-top:5px;color:#607d94;font-size:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;document.head.appendChild(st)}
  async function loadCatalog(){try{const api=window.aramDesktop;if(!api?.getItemCatalog){catalog={...catalog,loaded:true,error:'desktop catalog API 없음'};return}const d=await api.getItemCatalog();catalog={ok:!!d?.ok,loaded:true,version:String(d?.version||''),items:d?.items&&typeof d.items==='object'?d.items:{},error:String(d?.error||'')};try{renderRandomDetails()}catch{}}catch(e){catalog={...catalog,loaded:true,error:e?.message||String(e)}}}
  try{
    installStyle();
    randomLiveSummaryHtml=function(ctx,plan,threats,advice,power,alive){
      if(!ctx)return'';const stable=stableCtx(ctx),names=x=>(x||[]).map(p=>p?.name||p?.championName||p?.rawChampionName).filter(Boolean),ours=names(stable.ours),enemies=names(stable.enemy),m=typeof randomState!=='undefined'?randomState:{ourModes:{},enemyModes:{}},s=strength(stable,ours,enemies,m.ourModes||{},m.enemyModes||{},power),t=threats?.[0],next=advice?.items?.[0];
      return `${card(s)}<div class="randomLiveSummaryGrid"><div class="randomLiveHeroCall ${plan?.tone||''}"><span>현재 플레이 가이드</span><b>${esc(plan?.headline||'-')}</b><p>${esc(plan?.detail||'-')}<br><b style="font-size:10px">내 역할:</b> ${esc(typeof randomLiveLocalJob==='function'?randomLiveLocalJob(stable,m.ourModes||{}):'-')}</p></div><div class="randomLiveQuickCards"><div class="randomLiveQuickCard"><span>최고위협</span><b>${t?`${esc(t.name)} ${Math.round(t.score)}`:'-'}</b><small>${t?`${esc(t.damageType)} 중심 · ${t.scores?.kills??0}/${t.scores?.deaths??0}/${t.scores?.assists??0} · Lv.${t.level??'-'}`:'-'}</small></div><div class="randomLiveQuickCard"><span>다음 구매</span><b>${next?esc(next.item):'-'}</b><small>${next?esc(next.reason):'내 아이템 정보 대기'}</small></div><div class="randomLiveQuickCard"><span>시간대 전력</span><b>${esc(s.label)} · ${s.our}:${s.enemy}</b><small>활성 지표 ${s.factors.filter(x=>x.enabled).length}/5 · ${esc(s.coverage.item)}</small></div></div></div>`;
    };
    window.randomLiveTimePowerSnapshotV01527=strength;
    window.aramTimePowerV01527={version:V,strength,teamInventory,teamLevels,currentCurve,nextCurve,reset:()=>{smooth={key:'',time:0,share:null,discrete:''}},get catalog(){return catalog}};
    window.__ARAM_TIME_POWER_V01527__=true;
    if(typeof DATA!=='undefined'){DATA.version=V;DATA.time_power_v01527={version:'v0.15.27 · Time Power Reliability Audit',uses:['equipped item value','completed cores','average level','6/11/16 breakpoints','composition growth curve'],excludes:['alive count','respawn state','recent kills'],partial_data_policy:'disable affected factor instead of treating missing as zero'}}
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();loadCatalog();if(typeof renderRandomDetails==='function')setTimeout(()=>{try{renderRandomDetails()}catch{}},0);
  }catch(e){console.error('[v0.15.27] Time power patch failed',e);window.__ARAM_TIME_POWER_V01527__=false}
})();
