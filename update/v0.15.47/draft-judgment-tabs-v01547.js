'use strict';
(()=>{
  const V='0.15.47';
  if(window.__ARAM_DRAFT_JUDGMENT_TABS_V01547__)return;
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const clamp=(v,a=0,b=1.5)=>Math.max(a,Math.min(b,n(v)));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const names=xs=>(xs||[]).filter(Boolean);
  const conf=c=>[0,.38,.66,.88,.95,1][Math.min(5,Math.max(0,c))]||1;
  let activeTab='summary';

  function metric(xs,key){try{return n(compMetrics(names(xs))?.[key])}catch{return 0}}
  function density(xs,key){const a=names(xs);return a.length?metric(a,key)/a.length:0}
  function direct(name,key){return n(byName?.[name]?.[key])}
  function f18(name,key){return n(byName?.[name]?.['기능프로필18']?.[key])}
  function feature(name,keys){let best=0;for(const k of keys||[])best=Math.max(best,direct(name,k),f18(name,k));return best}
  function avgFeature(xs,keys){const a=names(xs);return a.length?a.reduce((s,x)=>s+feature(x,keys),0)/a.length:0}
  function strength(xs,key,target5){
    const a=names(xs),c=a.length;if(!c)return 0;
    const target=Math.max(.8,n(target5)*(c/5));
    return clamp((metric(a,key)/target)*conf(c),0,1.45);
  }
  function response(xs,parts){
    const a=names(xs);if(!a.length)return 0;
    let total=0,w=0;
    for(const [key,target,weight=1] of parts||[]){total+=clamp(metric(a,key)/Math.max(.8,target*(a.length/5)),0,1.4)*weight;w+=weight}
    return w?clamp(total/w,0,1.25):0;
  }
  function riskLevel(s){
    if(s>=1.12)return{tone:'critical',label:'매우 높음',rank:3};
    if(s>=.82)return{tone:'high',label:'높음',rank:2};
    if(s>=.60)return{tone:'watch',label:'주의',rank:1};
    return{tone:'normal',label:'보통',rank:0};
  }

  function pureEngageProfile(team,defender=[]){
    const a=names(team),d=names(defender),c=a.length;if(!c)return{strength:0,sources:[],count:0};
    const rows=a.map(name=>({name,v:Math.max(direct(name,'이니시'),f18(name,'이니시'),direct(name,'강제진입'),f18(name,'강제진입'))})).sort((x,y)=>y.v-x.v);
    const sources=rows.filter(x=>x.v>=3.6).slice(0,4).map(x=>x.name);
    let base=strength(a,'이니시',8);
    if(sources.length>=3)base+=.15;else if(sources.length>=2)base+=.08;
    const peel=response(d,[['역이니시',8,.48],['보호',10,.32],['이니시',8,.20]]);
    let s=base*(1-.25*Math.min(1,peel));
    if(!sources.length)s=Math.min(s,.62);
    else if(sources.length===1)s=Math.min(s,.90);
    else if(sources.length===2)s=Math.min(s,1.08);
    return{strength:clamp(s),sources,count:sources.length};
  }

  function calibratedRisks(){
    let rows=[];try{rows=window.aramDraftRiskBoardV01546?.()||[]}catch{}
    rows=rows.map(x=>({...x,sources:[...(x.sources||[])]}));
    const ep=pureEngageProfile(state.enemy,state.our);
    const idx=rows.findIndex(x=>x.key==='engage');
    if(idx>=0){
      const lv=riskLevel(ep.strength);
      rows[idx]={...rows[idx],strength:ep.strength,rank:lv.rank,tone:lv.tone,level:lv.label,sources:ep.sources,
        detail:`상대가 원하는 타이밍에 교전을 열 수 있는 실제 선개시 수단을 따로 계산합니다${ep.count?` · 강한 개시 수단 ${ep.count}개`:''}.`,
        tip:'간격 유지 · 무효화 수단 · 역이니시'};
    }
    return rows.sort((a,b)=>b.rank-a.rank||b.strength-a.strength);
  }

  function riskBadge(r){return `<span class="draftRiskBadgeV01546 ${esc(r.tone)}"><i>${esc(r.icon)}</i><b>${esc(r.label)}</b><em>${esc(r.level)}</em></span>`}
  function riskDetail(r,i){const src=r.sources?.length?` · ${r.sources.join(' · ')}`:'';return `<div class="draftRiskDetailV01546 ${esc(r.tone)}"><div class="draftRiskNoV01546">${i+1}</div><div class="draftRiskBodyV01546"><b>${esc(r.icon)} ${esc(r.label)} · ${esc(r.level)}</b><span>${esc((r.detail||'')+src)}</span><small>대응: ${esc(r.tip||'')}</small></div></div>`}
  function riskPanelHtml(){
    const enemy=names(state.enemy),active=calibratedRisks().filter(x=>x.rank>0);
    if(enemy.length<2)return `<div class="draftRiskBoardV01546 waiting"><div class="draftRiskHeadV01546"><b>상대 위험 감지</b><span>상대 2픽부터 분석</span></div></div>`;
    if(!active.length)return `<div class="draftRiskBoardV01546 safe"><div class="draftRiskHeadV01546"><b>상대 위험 감지</b><span>뚜렷한 고위험 신호 없음</span></div></div>`;
    return `<div class="draftRiskBoardV01546"><div class="draftRiskHeadV01546"><b>상대 위험 감지</b><span>${active.length}개 감지 · 높은 순</span></div><div class="draftRiskBadgesV01546">${active.map(riskBadge).join('')}</div><div class="draftRiskDetailsV01546">${active.slice(0,2).map(riskDetail).join('')}</div></div>`;
  }

  function sustainPower(team){
    const a=names(team);if(!a.length)return 0;
    const feat=avgFeature(a,['유지력','회복','회복/보호막','힐/보호막','보호막','치유','아군 회복']);
    return clamp(Math.max(feat/4.2,density(a,'보호')*.24),0,1.35)*conf(a.length);
  }
  function valuePower(team){
    const a=names(team);if(!a.length)return 0;
    const late=avgFeature(a,['후반','후반밸류','후반 파워','후반파워','스케일링','성장'])/5;
    return clamp(density(a,'지속딜')*.16+density(a,'프론트')*.10+density(a,'보호')*.09+density(a,'대탱')*.07+sustainPower(a)*.24+late*.34,0,1.4)*conf(a.length);
  }
  function vectorSet(attacker,defender){
    const A=names(attacker),D=names(defender);
    const engage=pureEngageProfile(A,D).strength;
    const defs={
      poke:{label:'포킹',icon:'🎯',attack:strength(A,'포킹',8),counter:clamp(response(D,[['프론트',8,.28],['이니시',8,.28],['보호',10,.14]])+sustainPower(D)*.30,0,1.25),need:'유지력/강제진입 부족'},
      dive:{label:'돌진',icon:'💥',attack:strength(A,'다이브',10),counter:response(D,[['보호',10,.40],['역이니시',8,.38],['프론트',8,.22]]),need:'후방 보호/역이니시 부족'},
      engage:{label:'강제 이니시',icon:'🚨',attack:engage,counter:response(D,[['역이니시',8,.48],['보호',10,.32],['이니시',8,.20]]),need:'역이니시/무효화 부족'},
      catch:{label:'캐치',icon:'⛓️',attack:strength(A,'캐치',7),counter:response(D,[['보호',10,.42],['프론트',8,.26],['역이니시',8,.32]]),need:'생존/보호 부족'},
      front:{label:'전열',icon:'🛡️',attack:strength(A,'프론트',8),counter:response(D,[['대탱',7,.55],['지속딜',10,.45]]),need:'지속딜·대탱 부족'},
      sustain:{label:'유지력',icon:'💚',attack:sustainPower(A),counter:response(D,[['이니시',8,.48],['캐치',7,.30],['지속딜',10,.22]]),need:'강제진입·집중딜 부족'}
    };
    return Object.values(defs).map(v=>({...v,residual:clamp(v.attack*(1-.52*Math.min(1.1,v.counter)),0,1.5)})).sort((a,b)=>b.residual-a.residual);
  }
  function matchup(){
    const our=names(state.our),enemy=names(state.enemy);
    if(our.length<2||enemy.length<2)return{ready:false};
    const ours=vectorSet(our,enemy),theirs=vectorSet(enemy,our);
    const mean=xs=>xs.slice(0,4).reduce((s,x)=>s+x.residual,0)/4;
    const valueDiff=valuePower(our)-valuePower(enemy);
    const delta=(mean(ours)-mean(theirs))+valueDiff*.22;
    let label='팽팽',tone='even';
    if(delta>=.32){label='우리가 크게 유리';tone='our'}
    else if(delta>=.12){label='우리 약우세';tone='our'}
    else if(delta<=-.32){label='상대가 크게 유리';tone='enemy'}
    else if(delta<=-.12){label='상대 약우세';tone='enemy'}
    const ourEdges=ours.filter(x=>x.attack>=.60&&x.residual>=.36).slice(0,2);
    const enemyEdges=theirs.filter(x=>x.attack>=.60&&x.residual>=.36).slice(0,2);
    return{ready:true,label,tone,delta,ourEdges,enemyEdges,valueDiff,ourCount:our.length,enemyCount:enemy.length};
  }
  function edgeRow(x,side){
    const cls=side==='our'?'our':'enemy';
    return `<div class="draftCounterEdgeV01547 ${cls}"><b>${esc(x.icon)} ${esc(x.label)}</b><span>▶ ${esc(x.need)}</span></div>`;
  }
  function matchupHtml(){
    const m=matchup();
    if(!m.ready)return `<div class="draftCounterBoardV01547 waiting"><b>⚔️ 조합 상성</b><span>양 팀 2픽부터 현재 공개 픽 기준으로 계산합니다.</span></div>`;
    const value=m.valueDiff>.16?'우리 후반 밸류 우세':m.valueDiff<-.16?'상대 후반 밸류 우세':'후반 밸류 비슷';
    const our=m.ourEdges.length?m.ourEdges.map(x=>edgeRow(x,'our')).join(''):'<div class="draftCounterEmptyV01547">뚜렷하게 찌르는 축 없음</div>';
    const enemy=m.enemyEdges.length?m.enemyEdges.map(x=>edgeRow(x,'enemy')).join(''):'<div class="draftCounterEmptyV01547">뚜렷하게 찔리는 축 없음</div>';
    return `<div class="draftCounterBoardV01547"><div class="draftCounterHeadV01547"><div><small>현재 공개 픽 기준</small><b>⚔️ ${esc(m.label)}</b></div><span>${esc(value)}</span></div><div class="draftCounterColsV01547"><section><h4>🟢 우리가 상대를 찌르는 점</h4>${our}</section><section><h4>🔴 상대가 우리를 찌르는 점</h4>${enemy}</section></div><div class="draftCounterFootV01547">위험도가 높아도 우리 대응력이 충분하면 실제 카운터 강도는 낮아집니다. 추천 점수에는 반영하지 않습니다.</div></div>`;
  }

  function fixFloatingClearButtons(){
    const root=document.querySelector('#builder .currentPickGrid');if(!root)return;
    root.querySelectorAll('button').forEach(b=>{
      const t=String(b.textContent||'').trim(),lab=String(b.getAttribute('aria-label')||b.title||'');
      if(t==='×'||t==='✕'||t==='✖'||/제거|삭제|clear|remove/i.test(lab))b.classList.add('draftPickClearScrollFixV01547');
    });
  }
  function ensureHeader(engine){
    let header=engine.querySelector(':scope > .draftJudgmentHeaderV01547');
    let title=engine.querySelector(':scope > .title')||engine.querySelector('.title');
    if(!header){
      header=document.createElement('div');header.className='draftJudgmentHeaderV01547';
      if(title?.parentElement===engine)engine.insertBefore(header,title);else engine.insertBefore(header,engine.firstChild);
      if(title)header.appendChild(title);
      const tabs=document.createElement('div');tabs.className='draftJudgmentTabsV01547';tabs.innerHTML='<button data-tab="summary">요약</button><button data-tab="risk">위험 감지</button><button data-tab="matchup">조합 상성</button>';
      header.appendChild(tabs);
      tabs.addEventListener('click',e=>{const b=e.target.closest('button[data-tab]');if(!b)return;activeTab=b.dataset.tab;applyTabState()});
    }
    title=header.querySelector('.title');if(title)title.textContent='픽 판단';
    return header;
  }
  function applyTabState(){
    const shell=document.querySelector('#builderCore > .draftJudgmentShellV01547');if(!shell)return;
    shell.querySelectorAll('.draftJudgmentPanelV01547').forEach(p=>p.hidden=p.dataset.tab!==activeTab);
    document.querySelectorAll('#builderEngineAnchor .draftJudgmentTabsV01547 button').forEach(b=>b.classList.toggle('active',b.dataset.tab===activeTab));
  }
  function buildTabs(){
    const engine=document.getElementById('builderEngineAnchor'),core=document.getElementById('builderCore');if(!engine||!core)return false;
    ensureHeader(engine);
    core.querySelectorAll(':scope > .draftEmergencyStack,:scope > #draftRiskBoardV01546').forEach(x=>x.remove());
    let shell=core.querySelector(':scope > .draftJudgmentShellV01547');
    if(!shell){
      const summaryHtml=core.innerHTML;
      core.innerHTML='';
      shell=document.createElement('div');shell.className='draftJudgmentShellV01547';
      shell.innerHTML=`<div class="draftJudgmentPanelV01547" data-tab="summary">${summaryHtml}</div><div class="draftJudgmentPanelV01547" data-tab="risk"></div><div class="draftJudgmentPanelV01547" data-tab="matchup"></div>`;
      core.appendChild(shell);
    }
    const risk=shell.querySelector('[data-tab="risk"]'),match=shell.querySelector('[data-tab="matchup"]');
    if(risk)risk.innerHTML=riskPanelHtml();
    if(match)match.innerHTML=matchupHtml();
    applyTabState();fixFloatingClearButtons();return true;
  }
  function ensureStyle(){
    if(document.getElementById('aram-draft-judgment-tabs-v01547-style'))return;
    const st=document.createElement('style');st.id='aram-draft-judgment-tabs-v01547-style';st.textContent=`
      #builderEngineAnchor .draftJudgmentHeaderV01547{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}
      #builderEngineAnchor .draftJudgmentHeaderV01547>.title{margin:0!important;flex:0 0 auto}
      #builderEngineAnchor .draftJudgmentTabsV01547{display:flex;gap:5px;align-items:center}
      #builderEngineAnchor .draftJudgmentTabsV01547 button{appearance:none;border:1px solid #31506f;background:#0b1b2e;color:#9fb5ca;border-radius:7px;padding:5px 9px;font-size:10px;font-weight:900;cursor:pointer;line-height:1.15}
      #builderEngineAnchor .draftJudgmentTabsV01547 button:hover{border-color:#4d7298;color:#d9ecff}
      #builderEngineAnchor .draftJudgmentTabsV01547 button.active{background:#123654;border-color:#4ba7df;color:#fff;box-shadow:inset 0 -2px 0 #61c5ff}
      #builderCore .draftJudgmentPanelV01547[hidden]{display:none!important}
      #builderCore .draftJudgmentPanelV01547{min-height:0}
      #builder .draftPickClearScrollFixV01547{position:relative!important;top:auto!important;bottom:auto!important;left:auto!important;right:auto!important;transform:none!important;z-index:auto!important;inset:auto!important}
      .draftCounterBoardV01547{border:1px solid #294865;background:#0a192a;border-radius:10px;padding:10px}
      .draftCounterBoardV01547.waiting{display:flex;flex-direction:column;gap:3px;color:#9fb5ca}
      .draftCounterHeadV01547{display:flex;align-items:end;justify-content:space-between;gap:10px;margin-bottom:9px}
      .draftCounterHeadV01547 small{display:block;color:#809bb5;font-size:8px;font-weight:800}.draftCounterHeadV01547 b{display:block;color:#f3f8ff;font-size:12px;margin-top:2px}.draftCounterHeadV01547>span{font-size:9px;color:#a9bfd3;font-weight:850}
      .draftCounterColsV01547{display:grid;grid-template-columns:1fr 1fr;gap:8px}.draftCounterColsV01547 section{border:1px solid #263f58;border-radius:8px;padding:8px;background:#091624}.draftCounterColsV01547 h4{margin:0 0 6px;font-size:9px;color:#bfd3e5}
      .draftCounterEdgeV01547{display:flex;gap:6px;align-items:center;border-radius:7px;padding:6px 7px;margin-top:5px;font-size:9px}.draftCounterEdgeV01547 b{white-space:nowrap}.draftCounterEdgeV01547 span{color:#c8d5e1}
      .draftCounterEdgeV01547.our{background:#0d2a23;border:1px solid #205d4d}.draftCounterEdgeV01547.our b{color:#6ee6bd}.draftCounterEdgeV01547.enemy{background:#2a151b;border:1px solid #713343}.draftCounterEdgeV01547.enemy b{color:#ff8997}
      .draftCounterEmptyV01547{font-size:9px;color:#71889f;padding:7px 2px}.draftCounterFootV01547{margin-top:8px;font-size:8px;color:#728ba3;line-height:1.4}
      @media(max-width:1150px){.draftCounterColsV01547{grid-template-columns:1fr}}
    `;document.head.appendChild(st);
  }
  function apply(){ensureStyle();try{return buildTabs()}catch(e){console.warn('[v0.15.47] judgment tabs',e);return false}}

  const oldRenderBuilder=typeof renderBuilder==='function'?renderBuilder:null;
  if(oldRenderBuilder)renderBuilder=function(...args){const r=oldRenderBuilder.apply(this,args);apply();requestAnimationFrame(apply);return r};
  const oldRenderBuilderCore=typeof renderBuilderCore==='function'?renderBuilderCore:null;
  if(oldRenderBuilderCore)renderBuilderCore=function(...args){const r=oldRenderBuilderCore.apply(this,args);apply();requestAnimationFrame(apply);return r};
  ensureStyle();apply();setTimeout(apply,0);setTimeout(apply,120);setTimeout(apply,350);

  window.aramDraftCalibratedRisksV01547=calibratedRisks;
  window.aramDraftMatchupV01547=matchup;
  window.aramApplyDraftJudgmentTabsV01547=apply;
  if(typeof DATA!=='undefined'){
    DATA.version=V;
    DATA.draft_judgment_tabs_v01547={version:'v0.15.47 · Judgment tabs + matchup counter + scroll clear fix',tabs:['요약','위험 감지','조합 상성'],default_tab:'요약',engage_uses_pure_initiation_not_generic_cc:true,counter_is_bidirectional:true,counter_score_affects_recommendation:false,pick_clear_buttons_non_sticky:true};
  }
  if(typeof syncAppVersionUI==='function')try{syncAppVersionUI()}catch{}
  window.__ARAM_DRAFT_JUDGMENT_TABS_V01547__=true;
})();
