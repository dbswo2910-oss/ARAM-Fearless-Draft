'use strict';
(()=>{
  const V='0.15.42';
  if(window.__ARAM_DRAFT_LIVE_CONTEXT_V01542__)return;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
  const round1=v=>Math.round((Number(v)||0)*10)/10;
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const countNames=xs=>(xs||[]).filter(Boolean).length;

  function metric(names,key){
    try{return n(compMetrics((names||[]).filter(Boolean))?.[key])}catch{return 0}
  }
  function fun(name,key){
    try{return n(byName?.[name]?.['기능프로필18']?.[key])}catch{return 0}
  }
  function catchPressure(names,modes={}){
    const used=(names||[]).filter(Boolean),count=used.length;
    if(!count)return{score:0,count:0,density:0,confidence:0,scale:0,strongSources:0,oldScale:0};
    const score=metric(used,'캐치'),density=score/count;
    const strongSources=used.filter(x=>n(byName?.[x]?.['캐치'])>=3.5||fun(x,'캐치')>=3.7||fun(x,'CC')>=4.2).length;
    const totalScale=clamp((score-5.5)/10,0,1),densityScale=clamp((density-1.8)/2.4,0,1),sourceScale=clamp((strongSources/count-.34)/.66,0,1);
    const confidence=[0,.38,.66,.88,.95,1][Math.min(5,count)]||1;
    let scale=clamp((totalScale*.48+densityScale*.40+sourceScale*.12)*confidence,0,1);
    let oldScale=0;
    try{oldScale=n(window.aramCatchPressure?.(used,modes)?.scale)}catch{}
    if(count>=5)scale=Math.max(scale,oldScale);
    return{score:round1(score),count,density:round1(density),confidence:round1(confidence),scale:round1(scale),strongSources,oldScale:round1(oldScale)};
  }
  function allySaveMax(names){
    let best=0;
    for(const name of (names||[]).filter(Boolean)){
      try{best=Math.max(best,n(window.aramCatchResilienceProfile?.(name)?.ally?.score))}catch{}
    }
    return best;
  }
  function catchContext(name,pressureNames,protectedNames=[],modes={},kind='pick'){
    const pressure=catchPressure(pressureNames,modes);
    let baseInfo=null;
    try{baseInfo=window.aramCatchResponseAdjustment?.(name,pressureNames,protectedNames,modes)||null}catch{}
    if(!baseInfo)return{pressure,desiredBonus:0,oldBonus:0,vulnerabilityPenalty:0,correction:0,net:0};
    const oldBonus=n(baseInfo.bonus),raw=n(baseInfo.raw),desiredBonus=round1(clamp(raw*pressure.scale,0,7.5));
    const c=baseInfo.self||{},ally=baseInfo.ally||{},carry=clamp(n(baseInfo.carry),0,1),self=n(c.score),selfViaTeam=n(ally.score)*.72;
    const effectiveSelf=Math.max(self,carry>=.72?selfViaTeam:0),carryFactor=clamp((carry-.58)/.42,0,1),vulnerability=clamp((3.5-effectiveSelf)/3.5,0,1)*carryFactor;
    const rescue=allySaveMax(protectedNames),teamMitigation=clamp((rescue/5)*.30,0,.30),rangeMitigation=clamp((fun(name,'유효 사거리')-3.5)*.10,0,.15);
    const maxPenalty=kind==='ban'?4.5:5.8;
    const vulnerabilityPenalty=round1(-clamp(vulnerability*pressure.scale*(kind==='ban'?5.2:6.4)*(1-teamMitigation)*(1-rangeMitigation),0,maxPenalty));
    const correction=round1((desiredBonus-oldBonus)+vulnerabilityPenalty),net=round1(desiredBonus+vulnerabilityPenalty);
    return{...baseInfo,pressure,oldBonus,desiredBonus,vulnerabilityPenalty,correction,net,effectiveSelf:round1(effectiveSelf),rescue:round1(rescue),teamMitigation:round1(teamMitigation),rangeMitigation:round1(rangeMitigation)};
  }

  const oldCandidate=typeof candidateScore==='function'?candidateScore:null;
  if(oldCandidate){
    candidateScore=function(name,ownNames=state.our,enemyNames=state.enemy,mode='next'){
      const x=oldCandidate(name,ownNames,enemyNames,mode);if(!x||x.score<=-900)return x;
      const enemyCount=countNames(enemyNames);if(!enemyCount)return x;
      const info=catchContext(name,enemyNames,ownNames,state.enemyModes||{},'pick');
      if(Math.abs(info.correction)<.05&&info.pressure.scale<.1)return x;
      x.parts=x.parts||{};x.parts.liveDraftContext=info;
      if(mode==='first'){
        x.parts.firstParts=x.parts.firstParts||{};
        x.parts.firstParts.liveCatchContext=info.correction;
      }else{
        x.parts.contrib=x.parts.contrib||{};
        x.parts.contrib.liveCatchContext=info.correction;
      }
      x.score=round1(x.score+info.correction);
      if(info.desiredBonus>=1.0)x.reason+=` · ${info.pressure.count}픽 캐치밀도 대응 +${info.desiredBonus.toFixed(1)}`;
      if(info.vulnerabilityPenalty<=-1.0)x.reason+=` · 캐치 취약 ${info.vulnerabilityPenalty.toFixed(1)}`;
      return x;
    };
  }

  const oldThreat=typeof threatScore==='function'?threatScore:null;
  if(oldThreat){
    threatScore=function(name){
      const x=oldThreat(name);if(!x)return x;
      const ourCount=countNames(state.our);if(!ourCount)return x;
      const info=catchContext(name,state.our,state.enemy,state.ourModes||{},'ban');
      if(Math.abs(info.correction)<.05&&info.pressure.scale<.1)return x;
      x.parts=x.parts||{};x.parts.contrib=x.parts.contrib||{};x.parts.liveDraftContext=info;x.parts.contrib.liveCatchContext=info.correction;
      x.score=round1(x.score+info.correction);
      if(info.desiredBonus>=1.0)x.reason+=` · 우리 ${info.pressure.count}픽 캐치 무력화 +${info.desiredBonus.toFixed(1)}`;
      if(info.vulnerabilityPenalty<=-1.0)x.reason+=` · 우리 캐치에 취약 ${info.vulnerabilityPenalty.toFixed(1)}`;
      return x;
    };
  }

  function stripOldCatchTag(h,ban=false){
    if(!h)return'';
    const re=ban?/<span class="reasonTag danger">캐치무력화 \+[^<]+<\/span>/g:/<span class="reasonTag balance">캐치대응 \+[^<]+<\/span>/g;
    return h.replace(re,'');
  }
  const oldPickBreak=typeof pickBreakdownHtml==='function'?pickBreakdownHtml:null;
  if(oldPickBreak)pickBreakdownHtml=function(x){
    let h=stripOldCatchTag(oldPickBreak(x),false),i=x?.parts?.liveDraftContext;
    if(!i)return h;
    if(n(i.desiredBonus)>=.6)h+=`<span class="reasonTag balance">N픽 캐치대응 +${n(i.desiredBonus).toFixed(1)}</span>`;
    if(n(i.vulnerabilityPenalty)<=-.6)h+=`<span class="reasonTag warn">캐치취약 ${n(i.vulnerabilityPenalty).toFixed(1)}</span>`;
    return h;
  };
  const oldBanBreak=typeof banBreakdownHtml==='function'?banBreakdownHtml:null;
  if(oldBanBreak)banBreakdownHtml=function(x,viewMode='set'){
    let h=stripOldCatchTag(oldBanBreak(x,viewMode),true),i=x?.parts?.liveDraftContext;
    if(!i||viewMode==='series')return h;
    if(n(i.desiredBonus)>=.6)h+=`<span class="reasonTag danger">N픽 캐치무력화 +${n(i.desiredBonus).toFixed(1)}</span>`;
    if(n(i.vulnerabilityPenalty)<=-.6)h+=`<span class="reasonTag warn">우리 캐치에 취약 ${n(i.vulnerabilityPenalty).toFixed(1)}</span>`;
    return h;
  };

  const oldPickDetail=typeof pickScoreDetailHtml==='function'?pickScoreDetailHtml:null;
  if(oldPickDetail)pickScoreDetailHtml=function(x,mode){
    let h=oldPickDetail(x,mode),i=x?.parts?.liveDraftContext;if(!i)return h;
    const p=i.pressure,cor=n(i.correction),row=scoreFactorRow('N픽 공개상태 캐치 보정',cor,`상대 ${p.count}픽 · 캐치 ${p.score.toFixed(1)} · 슬롯당 ${p.density.toFixed(1)} · 신뢰 ${Math.round(p.confidence*100)}%`,12);
    h=h.replace('<div class="scoreExplainGrid">','<div class="scoreExplainGrid">'+row);
    const sub=`<div class="scoreExplainSection">v0.15.42 · 완성 5인과 현재 N픽을 분리</div><div class="scoreSubGrid">${scoreSub('현재 공개 캐치',p.score,`${p.count}픽 · 밀도 ${p.density.toFixed(1)}`)}${scoreSub('직접/세이브 대응',n(i.desiredBonus),'직접 생존기 우선 · 최대 +7.5')}${scoreSub('취약 캐리 감점',n(i.vulnerabilityPenalty),i.vulnerabilityPenalty<0?'확실한 탈출/무효화 부족':'해당 없음')}${scoreSub('N픽 순보정',cor,`압박 강도 ${Math.round(p.scale*100)}%`)}</div>`;
    return h.replace('<div class="scoreExplainTotal">',sub+'<div class="scoreExplainTotal">');
  };
  const oldBanDetail=typeof banScoreDetailHtml==='function'?banScoreDetailHtml:null;
  if(oldBanDetail)banScoreDetailHtml=function(x,viewMode='set'){
    let h=oldBanDetail(x,viewMode),i=x?.parts?.liveDraftContext;if(!i||viewMode==='series')return h;
    const p=i.pressure,cor=n(i.correction),row=scoreFactorRow('N픽 우리 캐치 기준 밴 보정',cor,`우리 ${p.count}픽 · 캐치 ${p.score.toFixed(1)} · 슬롯당 ${p.density.toFixed(1)} · 신뢰 ${Math.round(p.confidence*100)}%`,12);
    h=h.replace('<div class="scoreExplainGrid">','<div class="scoreExplainGrid">'+row);
    const sub=`<div class="scoreExplainSection">v0.15.42 · 우리 N픽 강점에 대한 카운터 밴</div><div class="scoreSubGrid">${scoreSub('우리 공개 캐치',p.score,`${p.count}픽 · 밀도 ${p.density.toFixed(1)}`)}${scoreSub('캐치 무력화 가치',n(i.desiredBonus),'직접 생존 > 아군 세이브')}${scoreSub('우리 캐치에 취약',n(i.vulnerabilityPenalty),'취약 후보는 밴 우선도 하락')}${scoreSub('N픽 순보정',cor,`압박 강도 ${Math.round(p.scale*100)}%`)}</div>`;
    return h.replace('<div class="scoreExplainTotal">',sub+'<div class="scoreExplainTotal">');
  };

  const DEFICITS=[
    ['지속딜','지속딜',10],['프론트','전열',8],['이니시','이니시',8],['보호','보호/역이니시',10,'sumProtect'],['대탱','대탱',7],['라클','라클',8],['포킹','포킹',8]
  ];
  function deficitRows(names){
    const used=(names||[]).filter(Boolean),count=used.length;if(count<2)return[];
    const m=compMetrics(used),ratio=count/5,rows=[];
    for(const [key,label,target,kind] of DEFICITS){
      const value=kind==='sumProtect'?n(m?.['보호'])+n(m?.['역이니시']):n(m?.[key]),need=target*ratio,gap=Math.max(0,need-value);
      if(gap>.35)rows.push({label,value:round1(value),need:round1(need),severity:gap/Math.max(1,need)});
    }
    return rows.sort((a,b)=>b.severity-a.severity).slice(0,2);
  }
  const THREATS=[['캐치','캐치',7],['다이브','다이브',10],['이니시','강제진입',8],['포킹','포킹',8]];
  function threatRows(names){
    const used=(names||[]).filter(Boolean),count=used.length;if(!count)return[];
    const m=compMetrics(used),conf=[0,.38,.66,.88,.95,1][Math.min(5,count)]||1,rows=[];
    for(const [key,label,target] of THREATS){
      const value=n(m?.[key]),density=value/count,scaled=target*(count/5),ratio=value/Math.max(1,scaled),strength=ratio*conf;
      rows.push({key,label,value:round1(value),density:round1(density),strength});
    }
    const cp=catchPressure(used,state.enemyModes||{}),cr=rows.find(x=>x.key==='캐치');if(cr)cr.strength=Math.max(cr.strength,cp.scale*1.4);
    return rows.sort((a,b)=>b.strength-a.strength);
  }
  function threatLevel(x){return x>=1.15?'매우 높음':x>=.82?'높음':x>=.55?'주의':'보통'}
  function goalText(){
    const d=deficitRows(state.our),t=threatRows(state.enemy),cp=catchPressure(state.enemy,state.enemyModes||{}),goals=[];
    if(cp.scale>=.48)goals.push('직접 생존');
    else if(t[0]?.key==='다이브'&&t[0].strength>=.75)goals.push('보호/역이니시');
    else if(t[0]?.key==='포킹'&&t[0].strength>=.75)goals.push('전열/강제진입');
    for(const x of d){if(!goals.includes(x.label))goals.push(x.label);if(goals.length>=2)break}
    if(!goals.length)return countNames(state.our)<2?'구조 탐색 중':'큰 구멍 없음';
    return goals.slice(0,2).join(' + ');
  }
  function decisionBoardHtml(){
    const d=deficitRows(state.our),t=threatRows(state.enemy),cp=catchPressure(state.enemy,state.enemyModes||{}),own=countNames(state.our),enemy=countNames(state.enemy);
    const deficit=own<2?'픽 2개부터 표시':d.length?d.map(x=>x.label).join(' · '):'큰 구멍 없음';
    const top=t[0],threat=!enemy?'상대 픽 대기':top?`${top.label} ${threatLevel(top.strength)}${top.key==='캐치'?` · ${cp.score}/${cp.count}픽`:''}`:'보통';
    return `<div class="draftDecisionCompact"><div class="draftDecisionCell"><span>우리 결손</span><b>${esc(deficit)}</b></div><div class="draftDecisionCell enemy"><span>상대 핵심 위협</span><b>${esc(threat)}</b></div><div class="draftDecisionCell goal"><span>다음 픽 목표</span><b>${esc(goalText())}</b></div></div>`;
  }

  const POOL_KEY='aram_builder_pool_collapsed_v01542';
  const poolCollapsed=()=>{try{return localStorage.getItem(POOL_KEY)==='1'}catch{return false}};
  function setPoolCollapsed(v){try{localStorage.setItem(POOL_KEY,v?'1':'0')}catch{};decoratePool()}
  function decoratePool(){
    const root=document.querySelector('#builderPoolMount .builderChampPool');if(!root)return;
    const collapsed=poolCollapsed();root.classList.toggle('builderPoolCollapsed',collapsed);
    const head=root.querySelector('.onlinePoolHead');if(!head)return;
    let b=root.querySelector('#builderPoolToggleV01542');
    if(!b){b=document.createElement('button');b.id='builderPoolToggleV01542';b.type='button';b.className='btn secondary mini builderPoolToggle';b.addEventListener('click',()=>setPoolCollapsed(!poolCollapsed()));head.appendChild(b)}
    b.textContent=collapsed?'펼치기':'숨기기';b.setAttribute('aria-expanded',String(!collapsed));
  }
  window.setBuilderPoolCollapsedV01542=setPoolCollapsed;

  function applyBuilderUi(){
    const engine=document.getElementById('builderEngineAnchor');if(engine){const title=engine.querySelector('.title');if(title)title.textContent='픽 판단';const core=document.getElementById('builderCore');if(core)core.innerHTML=decisionBoardHtml()}
    document.getElementById('builderRouteAnchor')?.classList.add('v01542HiddenBuilderAnalysis');
    document.getElementById('builderPowerAnchor')?.classList.add('v01542HiddenBuilderAnalysis');
    document.querySelectorAll('#builder .builderWorkspaceBtns button').forEach(b=>{const x=b.getAttribute('onclick')||'';if(x.includes('builderRouteAnchor')||x.includes('builderPowerAnchor'))b.classList.add('v01542HiddenBuilderAnalysis')});
    const hero=document.querySelector('#builder .builderHero .sub');if(hero)hero.innerHTML='표준 프로 드래프트 순서를 유지하며 <b>현재 공개된 픽의 위협 밀도</b>와 우리 조합 결손을 실시간 반영합니다. 검색은 <b>Enter 또는 후보 클릭 시에만 적용</b>됩니다.';
    const sub=document.getElementById('banRecSub');if(sub&&banRecMode!=='series')sub.textContent='현재 공개된 픽의 위협 밀도와 우리 조합을 무력화할 카운터를 함께 봅니다.';
    decoratePool();
  }
  const oldBuilderCore=typeof renderBuilderCore==='function'?renderBuilderCore:null;
  if(oldBuilderCore)renderBuilderCore=function(){oldBuilderCore();applyBuilderUi()};
  const oldBuilder=typeof renderBuilder==='function'?renderBuilder:null;
  if(oldBuilder)renderBuilder=function(...args){const r=oldBuilder.apply(this,args);applyBuilderUi();return r};
  const oldPoolSetRole=typeof window.builderPoolSetRole==='function'?window.builderPoolSetRole:null;
  if(oldPoolSetRole)window.builderPoolSetRole=function(...args){const r=oldPoolSetRole.apply(this,args);queueMicrotask(decoratePool);return r};
  const oldPoolRender=typeof window.renderBuilderPool==='function'?window.renderBuilderPool:null;
  if(oldPoolRender)window.renderBuilderPool=function(...args){const r=oldPoolRender.apply(this,args);decoratePool();return r};

  let lastDataName='';
  const oldRenderData=typeof renderData==='function'?renderData:null;
  if(oldRenderData)renderData=function(name,...args){const changed=String(name||'')!==lastDataName,r=oldRenderData.call(this,name,...args);lastDataName=String(name||'');if(changed){requestAnimationFrame(()=>{const p=document.getElementById('dataDetailPanelAnchor');if(p)p.scrollTop=0})}return r};

  function ensureStyle(){
    if(document.getElementById('aram-draft-live-context-v01542-style'))return;
    const st=document.createElement('style');st.id='aram-draft-live-context-v01542-style';st.textContent=`
      #builder .v01542HiddenBuilderAnalysis{display:none!important}
      #builderEngineAnchor{padding:10px 12px}
      #builderEngineAnchor>.title{margin-bottom:7px}
      .draftDecisionCompact{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
      .draftDecisionCell{border:1px solid #29445f;background:#091827;border-radius:9px;padding:8px 9px;min-width:0}
      .draftDecisionCell span{display:block;color:#7895b3;font-size:8px;font-weight:900;margin-bottom:3px}
      .draftDecisionCell b{display:block;color:#e7f4ff;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .draftDecisionCell.enemy{border-color:#633642;background:#21131a}.draftDecisionCell.enemy b{color:#ffabb5}
      .draftDecisionCell.goal{border-color:#326852;background:#0d251d}.draftDecisionCell.goal b{color:#8ce9b6}
      #builderPoolMount .builderPoolToggle{margin-left:7px;white-space:nowrap}
      #builderPoolMount .builderPoolCollapsed .builderPoolLegend,#builderPoolMount .builderPoolCollapsed .onlinePoolFilters,#builderPoolMount .builderPoolCollapsed .onlinePoolGrid{display:none!important}
      #builderPoolMount .builderPoolCollapsed .onlinePoolHead{margin-bottom:0}
      @media(min-width:1251px){#data .dataWorkspace{align-items:stretch!important}#data .dataRightCol{align-self:stretch!important;height:auto!important;min-height:100%!important;position:relative}#data .dataDetailPanel{position:sticky!important;top:72px!important;max-height:calc(100vh - 84px)!important;overflow-y:auto!important;overscroll-behavior:contain!important;z-index:9}}
      @media(max-width:767px){.draftDecisionCompact{grid-template-columns:1fr}.draftDecisionCell b{white-space:normal}}
    `;document.head.appendChild(st);
  }
  ensureStyle();
  try{applyBuilderUi()}catch(e){console.warn('[v0.15.42] builder UI init',e)}
  try{
    const mount=document.getElementById('builderPoolMount');if(mount){new MutationObserver(()=>decoratePool()).observe(mount,{childList:true,subtree:false})}
  }catch{}

  window.aramDraftPartialCatchPressureV01542=catchPressure;
  window.aramDraftCatchContextV01542=catchContext;
  window.aramDraftDecisionBoardV01542=()=>({deficits:deficitRows(state.our),threats:threatRows(state.enemy),goal:goalText()});
  if(typeof DATA!=='undefined'){
    DATA.version=V;
    DATA.draft_live_context_v01542={version:'v0.15.42 · Partial-N Draft Context',partial_n:true,catch_density:true,vulnerable_carry_penalty:true,pick_and_ban:true,direct_self_save_priority:true,builder_route_ui_hidden:true,builder_power_ui_hidden:true,data_detail_sticky:true,role_grade_impact:false,riot_grade_impact:false};
  }
  if(typeof syncAppVersionUI==='function')try{syncAppVersionUI()}catch{}
  window.__ARAM_DRAFT_LIVE_CONTEXT_V01542__=true;
})();
