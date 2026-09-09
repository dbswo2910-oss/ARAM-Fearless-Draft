'use strict';
(()=>{
  const V='0.15.26';
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const avg=(xs,fn)=>xs?.length?xs.reduce((s,x)=>s+num(fn(x)),0)/xs.length:0;
  const sum=(xs,fn)=>xs?.reduce((s,x)=>s+num(fn(x)),0)||0;
  const esc=s=>{try{return aramHistoryEsc(String(s??''))}catch{return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}};
  const BASE_DDRAGON='16.17.1';
  let catalog={ok:false,loaded:false,version:'',items:{},error:''};
  let smooth={key:'',time:0,share:null,discrete:''};

  const stableCtx=ctx=>{try{return window.aramLiveItemMemoryV01520?.sync?.(ctx)||ctx}catch{return ctx}};
  const playerKey=p=>String(p?.riotId||p?.summonerName||p?.name||p?.championName||p?.rawChampionName||'').toLowerCase();
  const rosterKey=ctx=>[...(ctx?.ours||[]).map(playerKey).sort(),':',...(ctx?.enemy||[]).map(playerKey).sort()].join('|');
  function inventory(p){
    const bags=[p?.items,p?.inventory,p?.itemList,p?.raw?.items,p?.live?.items,p?.player?.items];
    for(const x of bags)if(Array.isArray(x))return x;
    return null;
  }
  const itemId=x=>num(x?.itemID??x?.itemId??x?.id??x?.item?.id,0);
  const itemName=x=>String(x?.displayName||x?.name||x?.rawDisplayName||'').toLowerCase();
  const directCost=x=>num(x?.price??x?.totalPrice??x?.gold?.total??x?.cost??x?.totalGold,0);
  function singleItemValue(x){
    try{
      if(typeof randomLivePlayerValue!=='function')return 0;
      const v=num(randomLivePlayerValue({items:[x]}),0);
      return v>0&&v<10000?v:0;
    }catch{return 0}
  }
  function itemMeta(x){
    const id=itemId(x),d=id&&catalog?.items?.[String(id)]||null;
    const cost=num(d?.total,0)||directCost(x)||singleItemValue(x);
    const n=String(d?.name||itemName(x)||'').toLowerCase();
    const excluded=/guardian|수호자|elixir|영약|potion|물약|trinket|장신구|ward|와드|biscuit|비스킷/.test(n);
    const full=d?!!d.full:(cost>=2000&&!excluded);
    return{id,cost,full,name:d?.name||String(x?.displayName||x?.name||''),source:d?'ddragon':cost?'live':'unknown'};
  }
  function playerItemValue(p){
    try{const v=num(typeof randomLivePlayerValue==='function'?randomLivePlayerValue(p):0,0);if(v>0)return v}catch{}
    const inv=inventory(p);return inv?sum(inv,x=>itemMeta(x).cost*Math.max(1,num(x?.count,1))):0;
  }
  function corePlayer(p){
    const inv=inventory(p);
    if(inv===null)return{available:false,count:0,known:0,unknown:0,totalItems:0,names:[]};
    let count=0,known=0,unknown=0;const names=[];
    for(const x of inv){
      const id=itemId(x);if(!id)continue;
      const m=itemMeta(x);if(m.source==='unknown')unknown++;else known++;
      if(m.full){const c=Math.max(1,num(x?.count,1));count+=c;if(m.name)names.push(m.name)}
    }
    return{available:true,count,known,unknown,totalItems:known+unknown,names};
  }
  function teamCore(ps){
    const rows=(ps||[]).map(corePlayer),available=rows.filter(x=>x.available).length,known=sum(rows,x=>x.known),unknown=sum(rows,x=>x.unknown),items=known+unknown;
    const resolvedRatio=items?known/items:1,reliable=available>=4&&resolvedRatio>=.75;
    return{count:sum(rows,x=>x.count),available,known,unknown,items,resolvedRatio,reliable,rows};
  }
  function breakpoint(ps){
    const lv=(ps||[]).map(x=>num(x?.level,0)),c6=lv.filter(x=>x>=6).length,c11=lv.filter(x=>x>=11).length,c16=lv.filter(x=>x>=16).length;
    return{c6,c11,c16,score:c6*.45+c11*1+c16*1.7,text:`${c6}/${c11}/${c16}`};
  }
  function nextCurve(power){
    const idx=Math.min(4,num(power?.idx,0)+1),o=num(power?.ourCurve?.scores?.[idx],0),e=num(power?.enemyCurve?.scores?.[idx],0);
    return{idx,label:(typeof POWER_STAGES!=='undefined'&&POWER_STAGES[idx]?.label)||'다음 구간',our:o,enemy:e,diff:o-e};
  }
  function smoothShare(raw,ctx,discrete){
    const key=rosterKey(ctx),t=num(ctx?.gameTime,0);
    if(!smooth.key||smooth.key!==key||(smooth.time&&t&&t+20<smooth.time)||smooth.share==null){smooth={key,time:t,share:raw,discrete};return raw}
    if(t&&smooth.time&&t<=smooth.time+.2)return smooth.share;
    const gap=raw-smooth.share,major=discrete!==smooth.discrete,alpha=major?.72:Math.abs(gap)>=8?.58:Math.abs(gap)>=4?.46:.36;
    let next=smooth.share+gap*alpha;if(Math.abs(next-smooth.share)<.55)next=smooth.share;
    smooth={key,time:t||smooth.time,share:next,discrete};return next;
  }
  function reasonText(factors,ours){
    const xs=factors.filter(x=>x.enabled!==false&&Math.abs(num(x.delta))>=.65).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
    if(!xs.length)return '핵심 타이밍 차이가 작아 거의 동등한 구간';
    const fav=xs.filter(x=>ours?x.delta>0:x.delta<0).slice(0,2),pick=fav.length?fav:xs.slice(0,2);
    return `${pick.map(x=>x.short||x.name.replace(/ · .*/,'')).join(' · ')} 쪽 차이가 가장 큼`;
  }
  function strength(ctx,ours,enemies,modes={},enemyModes={},power=null){
    ctx=stableCtx(ctx);if(!ctx)return null;
    try{power=power||randomLivePowerSnapshot(ctx,ours,enemies,modes,enemyModes)}catch{}
    const oi=sum(ctx.ours,playerItemValue),ei=sum(ctx.enemy,playerItemValue),oa=avg(ctx.ours,playerItemValue),ea=avg(ctx.enemy,playerItemValue);
    const oc=teamCore(ctx.ours),ec=teamCore(ctx.enemy),coreEnabled=oc.reliable&&ec.reliable;
    const ol=avg(ctx.ours,x=>x.level),el=avg(ctx.enemy,x=>x.level),ob=breakpoint(ctx.ours),eb=breakpoint(ctx.enemy);
    const curveO=num(power?.ourCurve?.scores?.[power?.idx],num(power?.our,50)),curveE=num(power?.enemyCurve?.scores?.[power?.idx],num(power?.enemy,50));
    const itemEvidence=(oi>0||ei>0)&&Math.min((ctx.ours||[]).length,(ctx.enemy||[]).length)>=4;
    const itemDen=Math.max(2500,(oa+ea)/2),itemDelta=itemEvidence?clamp((oa-ea)/itemDen*14,-7,7):0;
    const coreDelta=coreEnabled?clamp((oc.count-ec.count)*1.25,-5,5):0;
    const levelDelta=clamp((ol-el)*1.8,-4,4),breakDelta=clamp((ob.score-eb.score)*1.1,-4,4),curveDelta=clamp((curveO-curveE)*.32,-9,9);
    const totalDelta=itemDelta+coreDelta+levelDelta+breakDelta+curveDelta,rawShare=clamp(50+totalDelta,20,80);
    const discrete=`${oc.count}/${ec.count}|${ob.text}/${eb.text}|${Math.round(ol*10)}/${Math.round(el*10)}`;
    const our=Math.round(clamp(smoothShare(rawShare,ctx,discrete),20,80)),enemy=100-our,diff=our-enemy;
    const next=nextCurve(power),nextDelta=itemDelta+coreDelta+levelDelta+breakDelta+clamp(next.diff*.32,-9,9),nextShare=Math.round(clamp(50+nextDelta,20,80));
    const coreNote=coreEnabled?(catalog.ok?`Data Dragon ${catalog.version||BASE_DDRAGON}`:'Live 가격 판정'):`부분 데이터 · ${oc.available+ec.available}/10 인벤토리`;
    const factors=[
      {key:'item',name:'장비 실전가치',short:'장비',our:oi,enemy:ei,ourText:itemEvidence?Math.round(oi).toLocaleString('ko-KR'):'대기',enemyText:itemEvidence?Math.round(ei).toLocaleString('ko-KR'):'대기',delta:itemDelta,enabled:itemEvidence},
      {key:'core',name:'코어 완성',short:'코어',our:oc.count,enemy:ec.count,ourText:`${oc.count}개`,enemyText:`${ec.count}개`,delta:coreDelta,enabled:coreEnabled,note:coreNote},
      {key:'level',name:'평균 레벨',short:'레벨',our:ol,enemy:el,ourText:ol.toFixed(1),enemyText:el.toFixed(1),delta:levelDelta,enabled:true},
      {key:'break',name:'핵심 레벨 · 6/11/16',short:'핵심레벨',our:ob.score,enemy:eb.score,ourText:ob.text,enemyText:eb.text,delta:breakDelta,enabled:true},
      {key:'curve',name:`조합 성장곡선 · ${power?.label||'현재'}`,short:'성장곡선',our:curveO,enemy:curveE,ourText:Math.round(curveO),enemyText:Math.round(curveE),delta:curveDelta,enabled:!!power}
    ];
    let label='팽팽';if(diff>=24)label='매우 유리';else if(diff>=12)label='유리';else if(diff>=5)label='약우세';else if(diff<=-24)label='매우 불리';else if(diff<=-12)label='불리';else if(diff<=-5)label='약열세';
    const tone=diff>=5?'good':diff<=-5?'bad':'warn',call=diff>=5?`정상 5:5 기준 우리 우세 · ${reasonText(factors,true)}`:diff<=-5?`정상 5:5 기준 상대 우세 · ${reasonText(factors,false)}`:'정상 5:5 기준 큰 전력 차이 없음';
    const rosterEv=Math.min(1,Math.min((ctx.ours||[]).length,(ctx.enemy||[]).length)/5),coreEv=coreEnabled?1:.35,itemEv=itemEvidence?1:.35,curveEv=power?1:.35;
    const confidence=Math.round(clamp(52+rosterEv*13+itemEv*10+coreEv*8+curveEv*8,52,91));
    return{our,enemy,diff,label,tone,call,confidence,factors,item:{ourTotal:oi,enemyTotal:ei,ourAvg:oa,enemyAvg:ea,evidence:itemEvidence},core:{our:oc,enemy:ec,enabled:coreEnabled,note:coreNote},level:{our:ol,enemy:el},breakpoints:{our:ob,enemy:eb},power,next,nextShare,components:{itemDelta,coreDelta,levelDelta,breakDelta,curveDelta,totalDelta,rawShare}};
  }
  function factorRow(f){
    const disabled=f.enabled===false,m=Math.max(1,num(f.our),num(f.enemy)),ow=Math.max(4,num(f.our)/m*100),ew=Math.max(4,num(f.enemy)/m*100),d=disabled?'대기':f.delta>=0?`+${f.delta.toFixed(1)}`:f.delta.toFixed(1),dt=disabled?'':f.delta>.65?'our':f.delta<-.65?'enemy':'';
    return `<div class="liveStrengthFactor ${disabled?'tp26disabled':''}"><div class="liveStrengthFactorName"><b>${esc(f.name)}</b><span class="${dt}">${esc(d)}</span></div><div class="liveStrengthFactorDuel"><div class="liveStrengthHalf our"><span>${esc(f.ourText)}</span><i style="width:${ow}%"></i></div><em></em><div class="liveStrengthHalf enemy"><i style="width:${ew}%"></i><span>${esc(f.enemyText)}</span></div></div>${f.note?`<small class="tp26note">${esc(f.note)}</small>`:''}</div>`;
  }
  function card(s){
    if(!s)return'';const trend=s.nextShare>s.our+3?'다음 구간 우리 상승':s.nextShare<s.our-3?'다음 구간 상대 상승':'다음 구간도 비슷',pd=s.diff>=0?`+${s.diff}`:String(s.diff),coreCov=s.core.our.available+s.core.enemy.available;
    return `<div class="liveStrengthCard ${s.tone}"><div class="liveStrengthHead"><div><span>⏱ 시간대 전력 · 정상 5:5 기준</span><b>${esc(s.label)} · 우리 ${s.our} : ${s.enemy} 상대</b></div><div class="liveStrengthConfidence"><small>판정 신뢰</small><b>${s.confidence}%</b></div></div><div class="liveStrengthMainBar"><div class="our" style="width:${s.our}%"><span>우리 ${s.our}</span></div><i></i><div class="enemy" style="width:${s.enemy}%"><span>상대 ${s.enemy}</span></div></div><div class="liveStrengthDelta">시간대 전력 차이 <b>${pd}</b> · ${esc(s.call)}</div><div class="liveStrengthFactors">${s.factors.map(factorRow).join('')}</div><div class="liveStrengthFooter"><span><b>${esc(s.next.label)}</b> 예상 ${Math.round(s.next.our)}:${Math.round(s.next.enemy)} · ${esc(trend)}</span><span>코어 판정 ${esc(s.core.note)} · 인벤토리 ${coreCov}/10 · 생존/최근킬 미반영</span></div></div>`;
  }
  function installStyle(){
    if(document.getElementById('timePowerFixV01526Style'))return;const st=document.createElement('style');st.id='timePowerFixV01526Style';st.textContent=`.liveStrengthFactor.tp26disabled{opacity:.58}.tp26note{display:block;margin-top:5px;color:#607d94;font-size:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;document.head.appendChild(st);
  }
  function getModes(){return typeof randomState!=='undefined'?{ours:randomState.ourModes||{},enemy:randomState.enemyModes||{}}:{ours:{},enemy:{}}}
  function rerender(){try{if(typeof renderRandomDetails==='function')renderRandomDetails()}catch{}}
  async function loadCatalog(){
    try{
      const api=window.aramDesktop;if(!api?.getItemCatalog){catalog={...catalog,loaded:true,error:'desktop catalog API 없음'};return}
      const data=await api.getItemCatalog();catalog={ok:!!data?.ok,loaded:true,version:String(data?.version||''),items:data?.items&&typeof data.items==='object'?data.items:{},error:String(data?.error||'')};rerender();
    }catch(e){catalog={ok:false,loaded:true,version:'',items:{},error:e?.message||String(e)}}
  }
  try{
    installStyle();
    const oldSummary=window.randomLiveSummaryHtml;if(typeof oldSummary!=='function')throw new Error('randomLiveSummaryHtml unavailable');
    window.randomLiveSummaryHtml=function(ctx,plan,threats,advice,power,alive){
      if(!ctx)return oldSummary.apply(this,arguments);
      const stable=stableCtx(ctx),modes=getModes(),ours=(stable.ours||[]).map(x=>x.name).filter(n=>typeof byName==='undefined'||byName[n]),enemies=(stable.enemy||[]).map(x=>x.name).filter(n=>typeof byName==='undefined'||byName[n]),s=strength(stable,ours,enemies,modes.ours,modes.enemy,power),t=threats?.[0],next=advice?.items?.[0];
      return `${card(s)}<div class="randomLiveSummaryGrid"><div class="randomLiveHeroCall ${plan?.tone||''}"><span>현재 플레이 가이드</span><b>${esc(plan?.headline||'-')}</b><p>${esc(plan?.detail||'-')}<br><b style="font-size:10px">내 역할:</b> ${esc(typeof randomLiveLocalJob==='function'?randomLiveLocalJob(stable,modes.ours):'-')}</p></div><div class="randomLiveQuickCards"><div class="randomLiveQuickCard"><span>최고위협</span><b>${t?`${esc(t.name)} ${Math.round(t.score)}`:'-'}</b><small>${t?`${esc(t.damageType)} 중심 · ${t.scores?.kills??0}/${t.scores?.deaths??0}/${t.scores?.assists??0} · Lv.${t.level??'-'}`:'-'}</small></div><div class="randomLiveQuickCard"><span>다음 구매</span><b>${next?esc(next.item):'-'}</b><small>${next?esc(next.reason):'내 아이템 정보 대기'}</small></div><div class="randomLiveQuickCard"><span>시간대 전력</span><b>${esc(s.label)} · ${s.our}:${s.enemy}</b><small>장비 ${Math.round(s.item.ourTotal).toLocaleString('ko-KR')}:${Math.round(s.item.enemyTotal).toLocaleString('ko-KR')} · 코어 ${s.core.our.count}:${s.core.enemy.count}</small></div></div></div>`;
    };
    window.randomLiveTimePowerSnapshotV01526=(ctx,ours,enemies,modes,enemyModes,power)=>strength(ctx,ours,enemies,modes,enemyModes,power);
    window.aramTimePowerV01526={version:V,strength,inventory,itemMeta,corePlayer,teamCore,get catalog(){return catalog},reset:()=>{smooth={key:'',time:0,share:null,discrete:''}}};
    window.__ARAM_TIME_POWER_FIX_V01526__=true;
    if(typeof DATA!=='undefined'){DATA.version=V;DATA.time_power_fix_v01526={version:'v0.15.26 · Time Power Source Reliability Fix',core_source_priority:['Data Dragon 16.17.1 catalog','Live Client direct item price','existing randomLivePlayerValue single-item fallback'],missing_core_data:'exclude factor instead of treating as zero',structural_only:true}}
    if(typeof syncAppVersionUI==='function')syncAppVersionUI();
    loadCatalog();setTimeout(rerender,0);
  }catch(e){console.error('[v0.15.26] Time power reliability fix failed',e);window.__ARAM_TIME_POWER_FIX_V01526__=false}
})();
