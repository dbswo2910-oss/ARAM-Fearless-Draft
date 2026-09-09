'use strict';
(()=>{
  const V='0.15.45';
  if(window.__ARAM_DRAFT_BALANCE_ALERTS_V01543__)return;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
  const round1=v=>Math.round((Number(v)||0)*10)/10;
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const names=xs=>(xs||[]).filter(Boolean);

  function duoRaw(x){
    const c=x?.parts?.contrib||{};
    const keys=['synergy','duoSynergy','pairSynergy','duo','pair'];
    for(const k of keys){if(Number.isFinite(Number(c[k]))&&Number(c[k])>0)return Number(c[k])}
    return 0;
  }
  function routeRaw(x){
    const c=x?.parts?.contrib||{};
    for(const [k,v] of Object.entries(c)){
      if(/route|build|41/i.test(k)&&Number.isFinite(Number(v))&&Number(v)>0)return Number(v);
    }
    const m=String(x?.reason||'').match(/41\s*루트[^+\-]*\+\s*([0-9]+(?:\.[0-9]+)?)/i);
    return m?Number(m[1])||0:0;
  }
  function compressDuo(raw){
    raw=Math.max(0,n(raw));
    if(raw<=12)return round1(raw);
    const a=Math.min(raw-12,8)*.65;
    const b=Math.min(Math.max(raw-20,0),8)*.35;
    const c=Math.max(raw-28,0)*.15;
    return round1(Math.min(raw,22,12+a+b+c));
  }
  function duoBalanceInfo(x){
    const raw=duoRaw(x),effective=compressDuo(raw),route=routeRaw(x);
    let overlap=0;
    if(raw>=18&&route>=18)overlap=round1(clamp((raw-18)*.08+(route-18)*.035,0,2.5));
    const correction=round1((effective-raw)-overlap);
    return{raw:round1(raw),effective,route:round1(route),overlap,correction};
  }
  function applyDuoBalance(x){
    if(!x||n(x.score)<=-900)return x;
    const info=duoBalanceInfo(x);if(info.raw<=12||info.correction>=-.05)return x;
    x.parts=x.parts||{};x.parts.contrib=x.parts.contrib||{};
    x.parts.duoBalanceV01543=info;x.parts.contrib.duoBalanceV01543=info.correction;
    x.score=round1(n(x.score)+info.correction);
    x.reason=String(x.reason||'')+` · 듀오 과집중 감쇠 ${info.correction.toFixed(1)}`;
    return x;
  }

  const baseCandidate=typeof candidateScore==='function'?candidateScore:null;
  if(baseCandidate){
    candidateScore=function(name,ownNames=state.our,enemyNames=state.enemy,mode='next'){
      return applyDuoBalance(baseCandidate(name,ownNames,enemyNames,mode));
    };
  }
  const baseThreat=typeof threatScore==='function'?threatScore:null;
  if(baseThreat){
    threatScore=function(name,...args){return applyDuoBalance(baseThreat(name,...args))};
  }

  const oldPickBreak=typeof pickBreakdownHtml==='function'?pickBreakdownHtml:null;
  if(oldPickBreak)pickBreakdownHtml=function(x){
    let h=String(oldPickBreak(x)||''),i=x?.parts?.duoBalanceV01543;
    if(i&&i.correction<=-.5)h+=`<span class="reasonTag warn">듀오균형 ${i.correction.toFixed(1)}</span>`;
    return h;
  };
  const oldBanBreak=typeof banBreakdownHtml==='function'?banBreakdownHtml:null;
  if(oldBanBreak)banBreakdownHtml=function(x,viewMode='set'){
    let h=String(oldBanBreak(x,viewMode)||''),i=x?.parts?.duoBalanceV01543;
    if(i&&i.correction<=-.5&&viewMode!=='series')h+=`<span class="reasonTag warn">듀오균형 ${i.correction.toFixed(1)}</span>`;
    return h;
  };
  const oldPickDetail=typeof pickScoreDetailHtml==='function'?pickScoreDetailHtml:null;
  if(oldPickDetail)pickScoreDetailHtml=function(x,mode){
    let h=oldPickDetail(x,mode),i=x?.parts?.duoBalanceV01543;if(!i)return h;
    const row=scoreFactorRow('칼바람 듀오 과집중 감쇠',i.correction,`원 ${i.raw.toFixed(1)} → 유효 ${i.effective.toFixed(1)}${i.overlap?` · 41루트 중복 -${i.overlap.toFixed(1)}`:''}`,12);
    return h.replace('<div class="scoreExplainGrid">','<div class="scoreExplainGrid">'+row);
  };
  const oldBanDetail=typeof banScoreDetailHtml==='function'?banScoreDetailHtml:null;
  if(oldBanDetail)banScoreDetailHtml=function(x,viewMode='set'){
    let h=oldBanDetail(x,viewMode),i=x?.parts?.duoBalanceV01543;if(!i||viewMode==='series')return h;
    const row=scoreFactorRow('칼바람 듀오 과집중 감쇠',i.correction,`원 ${i.raw.toFixed(1)} → 유효 ${i.effective.toFixed(1)}`,12);
    return h.replace('<div class="scoreExplainGrid">','<div class="scoreExplainGrid">'+row);
  };

  function auditDuoConcentration(ownNames=state.our,enemyNames=state.enemy,mode='next'){
    if(!baseCandidate||typeof champs==='undefined')return{rows:[],summary:{count:0}};
    const rows=[];
    for(const c of champs){
      try{
        const x=baseCandidate(c['챔피언'],ownNames,enemyNames,mode);if(!x||n(x.score)<=-900)continue;
        const i=duoBalanceInfo(x);if(i.raw>0)rows.push({name:c['챔피언'],tier:c['종합티어'],score:round1(x.score),...i});
      }catch{}
    }
    rows.sort((a,b)=>b.raw-a.raw||b.score-a.score||String(a.name).localeCompare(String(b.name),'ko'));
    const over20=rows.filter(r=>r.raw>20).length,over16=rows.filter(r=>r.raw>16).length,max=rows[0]?.raw||0;
    return{rows:rows.slice(0,30),summary:{count:rows.length,over16,over20,max:round1(max)}};
  }

  function f18(name,key){return n(byName?.[name]?.['기능프로필18']?.[key])}
  function legacy(name,key){return n(byName?.[name]?.[key])}
  function topSources(type){
    const rows=names(state.enemy).map(name=>{
      let v=0;
      if(type==='catch')v=Math.max(legacy(name,'캐치'),f18(name,'CC'));
      if(type==='dive')v=Math.max(legacy(name,'다이브'),f18(name,'다이브/후방 접근'));
      if(type==='poke')v=Math.max(legacy(name,'포킹'),f18(name,'포킹'));
      if(type==='engage')v=Math.max(legacy(name,'이니시'),f18(name,'CC'));
      return{name,v};
    }).filter(x=>x.v>=3.2).sort((a,b)=>b.v-a.v);
    return rows.slice(0,4).map(x=>x.name);
  }
  function emergencyAlerts(){
    const enemy=names(state.enemy);if(enemy.length<2)return[];
    let board={threats:[]},cp={scale:0,score:0,count:enemy.length,strongSources:0};
    try{board=window.aramDraftDecisionBoardV01542?.()||board}catch{}
    try{cp=window.aramDraftPartialCatchPressureV01542?.(enemy,state.enemyModes||{})||cp}catch{}
    const map=Object.fromEntries((board.threats||[]).map(x=>[x.key,x]));
    const out=[];
    if(cp.scale>=.55||(enemy.length>=3&&cp.strongSources>=Math.ceil(enemy.length*.67))){
      const emergency=cp.scale>=.72||cp.strongSources>=Math.max(3,enemy.length-1);
      out.push({key:'catch',rank:(cp.scale||0)+.25,title:`CC/CATCH ${emergency?'비상':'경고'} · ${emergency?'매우 높음':'높음'}`,detail:`공개 ${enemy.length}픽 중 강한 CC/캐치 축 ${cp.strongSources}명 · 고정형 후방 캐리 생존 난도 상승`,tip:'우선 대응: 직접 생존 · 주문 방어 · 재배치',sources:topSources('catch'),emergency});
    }
    const dive=map['다이브'];
    if(dive&&dive.strength>=.88)out.push({key:'dive',rank:dive.strength,title:`다이브 위험 · ${dive.strength>=1.15?'매우 높음':'높음'}`,detail:'후방 진입과 포커싱 압력이 높습니다.',tip:'우선 대응: 후방 보호 · 역이니시 · 자체 이탈',sources:topSources('dive'),emergency:dive.strength>=1.15});
    const poke=map['포킹'];
    if(poke&&poke.strength>=.90)out.push({key:'poke',rank:poke.strength-.05,title:`포킹 압박 · ${poke.strength>=1.18?'매우 높음':'높음'}`,detail:'교전 전 체력 손실이 누적될 가능성이 높습니다.',tip:'우선 대응: 전열 · 유지력 · 강제진입',sources:topSources('poke'),emergency:poke.strength>=1.18});
    const engage=map['이니시'];
    if(engage&&engage.strength>=1.05&&cp.scale>=.45)out.push({key:'engage',rank:engage.strength-.12,title:'광역 한타 연계 경고',detail:'선진입 뒤 후속 CC가 이어질 가능성이 높습니다.',tip:'우선 대응: 간격 유지 · 역이니시 · 핵심 스킬 분산',sources:topSources('engage'),emergency:false});
    const uniq=[];for(const a of out.sort((a,b)=>b.rank-a.rank)){if(!uniq.some(x=>x.key===a.key))uniq.push(a);if(uniq.length>=2)break}
    return uniq;
  }
  function alertHtml(){
    const a=emergencyAlerts();if(!a.length)return'';
    return `<div class="draftEmergencyStack">${a.map(x=>`<div class="draftEmergency ${x.emergency?'critical':'warning'}"><div class="draftEmergencyIcon">${x.emergency?'🚨':'⚠️'}</div><div class="draftEmergencyBody"><b>${esc(x.title)}</b><span>${esc(x.detail)}${x.sources.length?` · ${esc(x.sources.join(' · '))}`:''}</span><small>${esc(x.tip)}</small></div></div>`).join('')}</div>`;
  }
  function applyEmergency(){
    const core=document.getElementById('builderCore');if(!core)return;
    core.querySelector('.draftEmergencyStack')?.remove();
    const html=alertHtml();if(html)core.insertAdjacentHTML('afterbegin',html);
  }
  function ensureStyle(){
    if(document.getElementById('aram-draft-balance-alerts-v01543-style'))return;
    const st=document.createElement('style');st.id='aram-draft-balance-alerts-v01543-style';st.textContent=`
      .draftEmergencyStack{display:grid;gap:6px;margin-bottom:8px}
      .draftEmergency{display:flex;gap:8px;align-items:flex-start;border:1px solid #74513a;background:#251b12;border-radius:9px;padding:8px 10px}
      .draftEmergency.critical{border-color:#8a3442;background:#2b1319;box-shadow:inset 3px 0 0 #ff6574}
      .draftEmergencyIcon{font-size:15px;line-height:1.2}.draftEmergencyBody{min-width:0;display:flex;flex-direction:column;gap:2px}
      .draftEmergencyBody b{font-size:10px;color:#ffd1d6}.draftEmergency.warning .draftEmergencyBody b{color:#ffd69a}
      .draftEmergencyBody span{font-size:9px;color:#c4d1df;line-height:1.45}.draftEmergencyBody small{font-size:8px;color:#8fa5bb;font-weight:800}
    `;document.head.appendChild(st);
  }

  function applyAlerts(){ensureStyle();try{applyEmergency()}catch(e){console.warn('[v0.15.45] alerts',e)}}
  const oldRenderBuilder=typeof renderBuilder==='function'?renderBuilder:null;
  if(oldRenderBuilder)renderBuilder=function(...args){const r=oldRenderBuilder.apply(this,args);applyAlerts();requestAnimationFrame(applyAlerts);return r};
  const oldRenderBuilderCore=typeof renderBuilderCore==='function'?renderBuilderCore:null;
  if(oldRenderBuilderCore)renderBuilderCore=function(...args){const r=oldRenderBuilderCore.apply(this,args);applyEmergency();return r};
  ensureStyle();applyAlerts();setTimeout(applyAlerts,0);setTimeout(applyAlerts,300);

  window.aramDuoBalanceAuditV01543=auditDuoConcentration;
  window.aramDuoBalanceInfoV01543=duoBalanceInfo;
  window.aramDraftEmergencyAlertsV01543=emergencyAlerts;
  window.aramApplyDraftLayoutV01543=()=>false;
  if(typeof DATA!=='undefined'){
    DATA.version=V;
    DATA.draft_balance_alerts_v01543={version:'v0.15.45 · Duo concentration guard + emergency alerts (layout detached)',duo_diminishing_returns:true,duo_tail_cap:22,route_overlap_guard:true,champion_hardcode:false,whole_pool_audit:true,layout_manipulation:false,emergency_top_n:2,role_grade_impact:false,riot_grade_impact:false};
  }
  if(typeof syncAppVersionUI==='function')try{syncAppVersionUI()}catch{}
  window.__ARAM_DRAFT_BALANCE_ALERTS_V01543__=true;
})();
