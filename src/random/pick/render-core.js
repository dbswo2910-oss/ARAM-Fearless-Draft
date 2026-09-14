'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const ROLE_BY_ID=Object.freeze({
  random:'random-root',randomInputAnchor:'random-input-anchor',externalInputs:'random-external-inputs',manualPartyInputs:'random-party-inputs',poolInputs:'random-pool-inputs',comboResults:'random-top5',comboDetail:'random-top5-detail',randomOurFive:'random-team-five',randomOurSummary:'random-team-summary',randomEnemySummary:'random-enemy-summary'
});
function bindStableRoles(document){
  if(!document||typeof document.getElementById!=='function')throw new Error('document with getElementById required');
  const bound=[];for(const [id,role] of Object.entries(ROLE_BY_ID)){const el=document.getElementById(id);if(!el)continue;el.setAttribute('data-ui-role',role);bound.push({id,role})}return bound;
}
function comboResultsHtml(combos=[],selectedCombo=0,{championIconHtml=(()=>''),escapeHtml=(x=>String(x??''))}={}){
  return (combos||[]).map((x,i)=>{const party=x.party||x.sel||[],locks=x.locked||[],adds=x.sel||[],names=party.join(' + '),lockHtml=locks.length?`<div class="muted" style="font-size:9px">🔒 고정 ${escapeHtml(locks.join(' · '))}${adds.length?` · 추천 ${escapeHtml(adds.join(' · '))}`:''}</div>`:'',icons=party.map(n=>`<span class="comboIconChip">${championIconHtml(n,'draft')}<span>${escapeHtml(n)}</span></span>`).join(''),score=Number(x.score),scoreText=Number.isFinite(score)?score.toFixed(1):'0.0';return `<div class="combo comboRank${i+1} ${i===selectedCombo?'selected':''}" data-random-combo-index="${i}"><div class="comboHead"><span class="comboRank">${i+1}</span><div class="names">${escapeHtml(names)}${lockHtml}<div class="comboIconLine">${icons}</div></div><span class="comboScore">${scoreText}</span></div><div class="desc"><span class="routeMini">${escapeHtml(x.direction??'')}</span><br>${escapeHtml(x.reason??'')}</div></div>`}).join('');
}
function comboDetailHtml(x,{nval=(v=>Number(v)||0),teamBushUtilityValue=null,teamBushMetricText=null,teamBushAxisText=null,modes={}}={}){
  if(!x)return '<div class="muted">후보를 입력하세요.</div>';
  const p=x.parts||{},calc=x.totalCombos||0,lock=x.locked?.length?`고정 ${x.locked.join(' · ')}${x.sel?.length?` → 추천 ${x.sel.join(' · ')}`:''}`:'수동 고정 없음';
  const scoreParts=`챔피언 밸류 ${nval(p.overall).toFixed(1)} · Function18 +${nval(p.canonicalExtra).toFixed(1)} · 구조 -${(nval(p.gapPenalty)+nval(p.rolePenalty)+nval(p.damagePenalty)-nval(p.damageBonus)).toFixed(1)} · 시너지 +${nval(p.synergy).toFixed(1)} · 특수기능 ${nval(p.specialUtility)>=0?'+':''}${nval(p.specialUtility).toFixed(1)} (부쉬 ${nval(p.specialBush)>=0?'+':''}${nval(p.specialBush).toFixed(1)} / 증폭 +${nval(p.specialAlly).toFixed(1)})`;
  const full=(x.names||[]).filter(Boolean).length===5,teamBush=full&&typeof teamBushUtilityValue==='function'?teamBushUtilityValue(x.names,modes):null;
  const bush=teamBush&&typeof teamBushMetricText==='function'&&typeof teamBushAxisText==='function'?`<div class="status"><span>팀 부쉬지표</span><b><span class="teamBushChip teamBushGrade${teamBush.grade}">${teamBushMetricText(teamBush)}</span> · ${teamBushAxisText(teamBush)}</b></div>`:'';
  return `<div class="status"><span>추천 핵심</span><b>${(x.party||x.sel||[]).join(' + ')||'수동 확정'}</b></div><div class="status"><span>수동 고정</span><b>${lock}</b></div><div class="status"><span>조합 시너지</span><b>${x.reason??''}</b></div><div class="status"><span>완성 방향</span><b>${x.direction??''}</b></div>${bush}<div class="status"><span>구조 완성</span><b>${x.structure??''}</b></div><div class="status"><span>선택 시 주의</span><b>${x.warning??''}</b></div><div class="status"><span>점수 구조</span><b>${scoreParts}</b></div><div class="status"><span>후보 계산</span><b>${Number(calc).toLocaleString()}개 조합 전수${x.provisional?' · 외부픽 미완성 임시평가':''}</b></div>`;
}
function createRenderCore({document,state,championIconHtml,nval,teamBushUtilityValue,teamBushMetricText,teamBushAxisText,persist=(()=>{}),renderAnalysis=(()=>{})}={}){
  if(!document||!state)throw new Error('document and state required');
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const deps={championIconHtml:typeof championIconHtml==='function'?championIconHtml:()=>'',escapeHtml:esc};let selectionHandler=null;
  function renderResults(){const el=document.getElementById('comboResults');if(!el)return false;el.innerHTML=comboResultsHtml(state.combos||[],Number(state.selectedCombo)||0,deps);bindStableRoles(document);return true}
  function renderDetail(){const el=document.getElementById('comboDetail');if(!el)return false;const x=(state.combos||[])[Number(state.selectedCombo)||0];el.innerHTML=comboDetailHtml(x,{nval,teamBushUtilityValue,teamBushMetricText,teamBushAxisText,modes:state.ourModes||{}});bindStableRoles(document);return true}
  function select(index){const max=Math.max(0,(state.combos||[]).length-1);state.selectedCombo=Math.max(0,Math.min(Number(index)||0,max));persist();renderResults();renderDetail();renderAnalysis();return state.selectedCombo}
  function bindSelection(){const root=document.getElementById('comboResults');if(!root||selectionHandler)return false;selectionHandler=e=>{const row=e.target?.closest?.('[data-random-combo-index]');if(!row||!root.contains(row))return;select(row.getAttribute('data-random-combo-index'))};root.addEventListener('click',selectionHandler);return true}
  function render(){bindStableRoles(document);renderResults();renderDetail();bindSelection();return true}
  function dispose(){const root=document.getElementById('comboResults');if(root&&selectionHandler)root.removeEventListener('click',selectionHandler);selectionHandler=null}
  return{render,renderResults,renderDetail,select,bindSelection,bindStableRoles:()=>bindStableRoles(document),dispose};
}
module.exports={IMPLEMENTATION_VERSION,ROLE_BY_ID,bindStableRoles,comboResultsHtml,comboDetailHtml,createRenderCore,production_active:false,score_logic_changed:false,random_scoring_changed:false};
