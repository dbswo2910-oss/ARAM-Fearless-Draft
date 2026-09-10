'use strict';
(()=>{
  const V='0.15.72';
  if(window.__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__)return;
  const now=()=>globalThis.performance?.now?.()||Date.now();
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  let maintenanceTimer=0,analysisTimer=0,detailTimer=0,comboTimer=0,comboGeneration=0;
  let maintenanceBusy=false,analysisBusy=false,detailBusy=false,comboBusy=false,lastAutoSig='';
  const counters={maintenance:0,maintenanceCoalesced:0,comboRuns:0,comboCancels:0,comboYields:0,comboTeams:0,maxChunkMs:0,analysisDeferred:0,detailsDeferred:0,longTasks:0,maxTaskMs:0};
  const original={
    renderInputs:window.renderRandomInputs,
    renderAnalysis:window.renderRandomAnalysis,
    renderDetails:window.renderRandomDetails,
    runCombos:window.runRandomCombos
  };
  const scoreCache=new Map();

  function randomMode(){
    try{if(typeof randomViewMode!=='undefined')return randomViewMode}catch{}
    return $('#random')?.getAttribute?.('data-random-mode')||'pick';
  }
  function randomVisible(){return !!$('#random.active')}
  function pickVisible(){return randomVisible()&&randomMode()!=='ingame'}
  function timed(fn){const a=now();try{return fn()}finally{const ms=Math.max(0,now()-a);if(ms>=90)counters.longTasks++;counters.maxTaskMs=Math.max(counters.maxTaskMs,ms)}}

  function maintenance(){
    maintenanceTimer=0;if(maintenanceBusy||!randomVisible())return;
    maintenanceBusy=true;counters.maintenance++;
    try{
      window.aramRandomPracticeFocusV01549?.refresh?.();
      window.aramRandomPickDensityV01555?.refresh?.();
      window.aramRandomPartyPicksV01558?.refresh?.();
      window.aramRuntimePerformanceV01568?.refresh?.();
    }catch(e){console.warn(`[v${V}] Random maintenance failed`,e)}finally{maintenanceBusy=false}
  }
  function scheduleMaintenance(delay=35){
    if(!randomVisible())return;
    if(maintenanceTimer)counters.maintenanceCoalesced++;
    clearTimeout(maintenanceTimer);maintenanceTimer=setTimeout(maintenance,Math.max(0,delay|0));
  }

  function scheduleDetails(delay=130){
    if(!pickVisible()||typeof original.renderDetails!=='function')return typeof original.renderDetails==='function'?original.renderDetails():undefined;
    counters.detailsDeferred++;clearTimeout(detailTimer);detailTimer=setTimeout(()=>{
      detailTimer=0;if(detailBusy||!pickVisible())return;detailBusy=true;
      try{timed(()=>original.renderDetails())}catch(e){console.warn(`[v${V}] deferred Random details failed`,e)}finally{detailBusy=false;scheduleMaintenance(20)}
    },Math.max(0,delay|0));
  }
  function scheduleAnalysis(delay=80){
    if(!pickVisible()||typeof original.renderAnalysis!=='function')return typeof original.renderAnalysis==='function'?original.renderAnalysis():undefined;
    counters.analysisDeferred++;clearTimeout(analysisTimer);analysisTimer=setTimeout(()=>{
      analysisTimer=0;if(analysisBusy||!pickVisible())return;analysisBusy=true;
      try{timed(()=>original.renderAnalysis())}catch(e){console.warn(`[v${V}] deferred Random analysis failed`,e)}finally{analysisBusy=false;scheduleMaintenance(20)}
    },Math.max(0,delay|0));
  }

  // v0.15.49-v0.15.58 compatibility refreshes no longer own subtree observers/timers.
  // Hook the actual base render instead, so one user action creates one coalesced maintenance pass.
  if(typeof original.renderInputs==='function'){
    const wrapped=function(...a){const r=original.renderInputs.apply(this,a);scheduleMaintenance(0);return r};
    try{renderRandomInputs=wrapped}catch{};try{window.renderRandomInputs=wrapped}catch{}
  }
  if(typeof original.renderDetails==='function'){
    const wrapped=function(...a){if(pickVisible())return scheduleDetails(130);return original.renderDetails.apply(this,a)};
    try{renderRandomDetails=wrapped}catch{};try{window.renderRandomDetails=wrapped}catch{}
  }
  if(typeof original.renderAnalysis==='function'){
    const wrapped=function(...a){if(pickVisible())return scheduleAnalysis(75);return original.renderAnalysis.apply(this,a)};
    try{renderRandomAnalysis=wrapped}catch{};try{window.renderRandomAnalysis=wrapped}catch{}
  }

  function modeKey(names,modes){
    const xs=(names||[]).filter(Boolean);
    const mm=xs.map(n=>`${n}:${String(modes?.[n]||'자동')}`).join('|');
    return xs.join('\u0001')+'\u0002'+mm;
  }
  function scoreTeam(names,modes){
    const k=modeKey(names,modes);if(scoreCache.has(k))return scoreCache.get(k);
    const v=teamScore(names,modes);scoreCache.set(k,v);if(scoreCache.size>6500)scoreCache.clear();return v;
  }
  function comboCmp(a,b){return b.score-a.score||a.party.join('|').localeCompare(b.party.join('|'),'ko')}
  function makeCombo(plan,sel){
    const party=[...plan.locked,...sel],names=[...plan.external,...party],ts=scoreTeam(names,randomState.ourModes);
    return{sel:[...sel],party,locked:[...plan.locked],names,score:ts.s,direction:ts.direction,reason:ts.reason,warning:ts.warning,structure:ts.structure,parts:ts.parts,pair:ts.pair,totalCombos:plan.totalCombos,provisional:plan.provisional};
  }
  function* comboIter(arr,k,start=0,p=[]){
    if(p.length===k){yield [...p];return}
    for(let i=start;i<=arr.length-(k-p.length);i++){p.push(arr[i]);yield* comboIter(arr,k,i+1,p);p.pop()}
  }
  function finishCombo(plan,raw,token){
    if(token!==comboGeneration){counters.comboCancels++;return}
    randomState.combos=raw;
    randomState.selectedCombo=Math.min(randomState.selectedCombo,Math.max(0,raw.length-1));
    randomState.shortlist=[...plan.pool];randomState.lastComboCount=plan.totalCombos;
    try{persist()}catch{}
    try{renderRandomComboResults()}catch{}
    try{renderComboDetail()}catch{}
    try{renderExternalCheck()}catch{}
    scheduleAnalysis(45);scheduleMaintenance(0);
  }
  function failCombo(plan,token,kind){
    if(token!==comboGeneration)return;
    const result=$('#comboResults'),detail=$('#comboDetail');randomState.combos=[];
    if(kind==='duplicate'){
      if(result)result.innerHTML=`<div class="emptyState">고정픽 중복: <b>${plan.duplicates.join(' · ')}</b><br>같은 챔피언은 한 팀에 두 번 선택할 수 없습니다.</div>`;
    }else if(result){
      result.innerHTML=`<div class="emptyState">수동 고정 ${plan.locked.length}명 · 남은 추천 ${plan.needed}명에 필요한 후보가 부족합니다.</div>`;
    }
    if(detail)detail.innerHTML='';try{persist()}catch{};try{renderExternalCheck()}catch{};scheduleAnalysis(45);scheduleMaintenance(0);
  }
  function runCombosCooperative(){
    const token=++comboGeneration;counters.comboRuns++;clearTimeout(comboTimer);
    comboTimer=setTimeout(()=>{
      comboTimer=0;if(token!==comboGeneration)return;
      let plan;try{plan=randomDraftPlan()}catch(e){console.error(`[v${V}] Random plan failed`,e);return}
      if(plan.duplicates?.length){failCombo(plan,token,'duplicate');return}
      if(plan.pool.length<plan.needed){failCombo(plan,token,'short');return}
      if(plan.needed===0){finishCombo(plan,[makeCombo(plan,[])],token);return}
      const iter=comboIter(plan.pool,plan.needed),top=[];let done=false,processed=0;
      const result=$('#comboResults');
      if(plan.totalCombos>120&&result)result.innerHTML=`<div class="emptyState" data-rp72-progress>완성 조합 계산 중 · 0 / ${Number(plan.totalCombos).toLocaleString()}<br><span class="muted">화면을 멈추지 않도록 나눠서 전수 계산합니다.</span></div>`;
      comboBusy=true;
      const step=()=>{
        if(token!==comboGeneration){comboBusy=false;counters.comboCancels++;return}
        const a=now();let n=0;
        try{
          while(n<28&&now()-a<11){
            const it=iter.next();if(it.done){done=true;break}
            const row=makeCombo(plan,it.value);processed++;counters.comboTeams++;top.push(row);top.sort(comboCmp);if(top.length>5)top.pop();n++;
          }
        }catch(e){comboBusy=false;console.error(`[v${V}] cooperative combo calculation failed`,e);return}
        const ms=Math.max(0,now()-a);counters.maxChunkMs=Math.max(counters.maxChunkMs,ms);
        const progress=$('[data-rp72-progress]');if(progress&&processed%112<28)progress.firstChild.textContent=`완성 조합 계산 중 · ${processed.toLocaleString()} / ${Number(plan.totalCombos).toLocaleString()}`;
        if(done){comboBusy=false;finishCombo(plan,top.sort(comboCmp),token);return}
        counters.comboYields++;setTimeout(step,0);
      };
      step();
    },0);
  }
  if(typeof original.runCombos==='function'){
    const wrapped=function(){runCombosCooperative()};
    wrapped.__aramOriginal=original.runCombos;
    try{runRandomCombos=wrapped}catch{};try{window.runRandomCombos=wrapped}catch{}
  }

  function autoSig(s){
    if(!s||s.phase!=='champ_select'||!s.isAram)return `${s?.phase||''}:${!!s?.isAram}`;
    const r=x=>{try{return typeof lolAutoSyncResolveChamp==='function'?lolAutoSyncResolveChamp(x)||'':String(x?.championName||x?.name||x||'')}catch{return''}};
    const list=xs=>(xs||[]).map(r).filter(Boolean);
    return JSON.stringify([s.gameId||0,s.partySize||1,list(s.party),r(s.localChampion),list(s.team),list(s.external),list(s.bench),list(s.candidatePool)]);
  }
  function onAutoSyncState(s){const sig=autoSig(s);if(sig===lastAutoSig)return;lastAutoSig=sig;scheduleMaintenance(20)}

  document.addEventListener('click',e=>{
    if(!e.target?.closest?.('#random'))return;
    const tab=e.target.closest('button[data-rp49]');
    if(tab&&(tab.dataset.rp49==='analysis'||tab.dataset.rp49==='detail')){setTimeout(()=>{scheduleAnalysis(0);scheduleDetails(20)},0)}
    else scheduleMaintenance(45);
  },true);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#random'))scheduleMaintenance(20)},true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&randomVisible())scheduleMaintenance(20)},{passive:true});
  window.addEventListener('focus',()=>{if(randomVisible())scheduleMaintenance(20)},{passive:true});

  try{
    if(typeof PerformanceObserver==='function'&&PerformanceObserver.supportedEntryTypes?.includes?.('longtask')){
      const po=new PerformanceObserver(list=>{for(const e of list.getEntries()){const d=Number(e.duration)||0;counters.longTasks++;counters.maxTaskMs=Math.max(counters.maxTaskMs,d)}});po.observe({entryTypes:['longtask']});
    }
  }catch{}

  window.aramRandomPracticeRuntimeV01572={
    version:V,refresh:()=>scheduleMaintenance(0),onAutoSyncState,cancelCombos:()=>{comboGeneration++;clearTimeout(comboTimer);comboBusy=false},
    getStats:()=>({version:V,randomVisible:randomVisible(),mode:randomMode(),comboBusy,comboGeneration,scoreCache:scoreCache.size,counters:{...counters}}),
    architecture:'single Random Practice maintenance owner + cooperative exhaustive TOP5 calculation + lazy analysis/details',
    score_logic_changed:false
  };
  window.__ARAM_RANDOM_PRACTICE_RUNTIME_V01572__=true;
  scheduleMaintenance(0);
})();
