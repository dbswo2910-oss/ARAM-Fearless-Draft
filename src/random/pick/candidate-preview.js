'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const DNA_LANES=Object.freeze([
  ['engage','한타 개시(Engage)'],['poke','포킹(Poke)'],['front','프론트라인(Frontline)'],['sustain','지속 전투(Sustain)'],['cc','군중 제어(CC)']
]);
const PRESENTATION_ROLES=Object.freeze({dna:'random-candidate-dna',quick:'random-quick-judgment',row:'random-candidate-row',badge:'random-candidate-selected-badge'});
function clampPct(v,fallback=50){const n=Number(v);return Number.isFinite(n)?Math.max(0,Math.min(100,n)):fallback}
function normalizeProfile(profile={}){return{adPct:clampPct(profile.adPct),apPct:clampPct(profile.apPct)}}
function defaultEsc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function metricHtml(label,x={},esc=defaultEsc){const cls=x?.missing?' missing':(x?.preview?' preview':'');return `<div class="rp90DnaMetric${cls}" data-dna-lane="${esc(label)}"><div class="rp90DnaTop"><span>${esc(label)}</span><b>${esc(x?.state||'확인')}</b></div><div class="rp90DnaBar" style="--v:${clampPct(x?.pct,0)}%"><i></i></div></div>`}
function candidateDnaHtml(preview,{name,profile,score,desc}={},escapeHtml=defaultEsc){
  const esc=escapeHtml,p=normalizeProfile(profile),x=preview||{dna:{},shortages:[]};const shortages=Array.isArray(x.shortages)?x.shortages:[];
  const chips=(shortages.length?shortages:['현재 큰 결손 없음']).map(v=>`<span class="rp89Chip${shortages.length?'':' good'}">${esc(v)}</span>`).join('');
  const lanes=DNA_LANES.map(([key,label])=>metricHtml(label,x.dna?.[key]||{},esc)).join('');
  return `<div data-ui-role="${PRESENTATION_ROLES.dna}"><div class="rp89IntelHead"><b>◆ 조합 DNA</b><span>${esc(name||'선택 후보')} 반영 · LIVE PREVIEW</span></div>${lanes}<div class="rp90DnaDamage"><div class="rp90DnaTop"><span>실전 AD / AP</span><b>AD ${p.adPct}% / AP ${p.apPct}%</b></div><div class="rp90DnaSplit" style="--ad:${p.adPct}%;--ap:${p.apPct}%"><i class="ad"></i><i class="ap"></i></div><div class="rp90DnaLegend"><span>AD ${p.adPct}%</span><span>AP ${p.apPct}%</span></div></div><div class="rp89IntelSection"><strong>⚠ 부족한 역할 · ${esc(name||'선택 후보')} 반영</strong><div class="rp89Chips">${chips}</div></div><div class="rp89IntelSection"><strong>✦ 선택 후보</strong><div class="rp89Top1"><span>${esc(score||'-')}</span><b>${esc(name||'선택 후보')}</b><small>${esc(desc||'선택한 후보를 포함한 조합 미리보기입니다.')}</small></div></div></div>`;
}
function quickJudgmentModel(reference={},selected=null){
  const m=reference||{},p=selected?normalizeProfile(selected.profile):{adPct:clampPct(m.adPct),apPct:clampPct(m.apPct)};
  const top=m.top||{},name=selected?.name||top.name||'계산 대기',score=selected?.score||top.score||'-';
  const direction=selected?.desc||top.reason||m.missing||'후보를 입력하면 추천 방향이 표시됩니다.';
  const q=Math.max(1,Math.min(5,Number(m.q)||1)),ext=Math.max(0,Number(m.ext)||0),locked=Math.max(0,Number(m.locked)||0),need=Math.max(0,Number(m.need)||0);
  return{queue:`${q}인큐 · 외부 확정픽 ${ext}명 + 우리 파티 ${q}명`,calc:need===0?'고정 완료':`${m.calc||'후보 계산 대기'} · 고정 ${locked}/${q}`,name,selected:!!selected,damage:selected?`${p.adPct} / ${p.apPct}`:(m.damage||`${p.adPct} / ${p.apPct}`),profile:p,score,direction};
}
function quickJudgmentHtml(reference={},selected=null,escapeHtml=defaultEsc){const esc=escapeHtml,m=quickJudgmentModel(reference,selected);return `<div class="rpQuickGridV01549" data-ui-role="${PRESENTATION_ROLES.quick}"><div class="rpQuickCardV01549"><span>현재 큐</span><b>${esc(m.queue)}</b></div><div class="rpQuickCardV01549"><span>후보 계산</span><b>${esc(m.calc)}</b></div><div class="rpQuickCardV01549 conclusion"><span>현재 결론</span><b>${esc(m.name)}</b><small>${m.selected?'선택 미리보기':'최우선 추천'}</small></div><div class="rpQuickCardV01549"><span>실전 AD / AP</span><b>${esc(m.damage)}</b><div class="rp90QuickSplit" style="--ad:${m.profile.adPct}%;--ap:${m.profile.apPct}%"><i class="ad"></i><i class="ap"></i></div></div><div class="rpQuickCardV01549"><span>TOP1 점수</span><b>${esc(m.score)}</b></div><div class="rpQuickCardV01549 direction"><span>추천 방향</span><b>${esc(m.direction)}</b></div></div>`}
function createCandidatePreviewController({document,selectionState,dnaEngine,referenceModel=(()=>({})),dnaTarget=(()=>document?.querySelector?.('#rpPickIntelV01589')),quickTarget=(()=>document?.querySelector?.('#rpQuickGridV01549')?.parentElement),escapeHtml=defaultEsc,onChange=(()=>{})}={}){
  if(!document||!selectionState||!dnaEngine)throw new Error('document, selectionState and dnaEngine required');
  const results=()=>document.getElementById?.('comboResults')||document.querySelector?.('#comboResults');
  const rowName=row=>String(row?.dataset?.randomCandidate||row?.dataset?.rp93Candidate||row?.querySelector?.('.names')?.textContent||'').trim();
  const rowProfile=row=>normalizeProfile({adPct:row?.dataset?.randomCandidateAd??row?.dataset?.rp93Ad,apPct:row?.dataset?.randomCandidateAp??row?.dataset?.rp93Ap});
  const rowScore=row=>String(row?.querySelector?.('.comboScore')?.textContent||row?.querySelector?.('.rp90Score')?.textContent||'-').trim();
  const rowDesc=row=>String(row?.querySelector?.('.desc')?.textContent||row?.querySelector?.('.rp90Desc')?.textContent||'선택 후보 기준 조합 미리보기입니다.').trim();
  function reflectRows(selected){const root=results();if(!root)return;[...(root.querySelectorAll?.('.combo')||[])].forEach(row=>{row.setAttribute?.('data-ui-role',PRESENTATION_ROLES.row);const hit=!!selected&&rowName(row)===selected;row.classList?.toggle?.('isSelectedV01593',hit);let badge=row.querySelector?.(`[data-ui-role="${PRESENTATION_ROLES.badge}"]`);if(hit&&!badge){const host=row.querySelector?.('.rp90Name')||row.querySelector?.('.names');if(host&&document.createElement){badge=document.createElement('span');badge.className='rp93SelectedBadge';badge.textContent='선택 미리보기';badge.setAttribute?.('data-ui-role',PRESENTATION_ROLES.badge);host.appendChild?.(badge)}}else if(!hit&&badge)badge.remove?.()})}
  function render(snapshot=null){const ref=referenceModel()||{},dna=dnaTarget?.(),quick=quickTarget?.();if(snapshot){const preview=dnaEngine.candidateDnaPreview(snapshot.row,snapshot.name,snapshot.desc,snapshot.profile);if(dna)dna.innerHTML=candidateDnaHtml(preview,snapshot,escapeHtml)}if(quick)quick.innerHTML=quickJudgmentHtml(ref,snapshot,escapeHtml);reflectRows(snapshot?.name||'');onChange(snapshot);return snapshot}
  function apply(row,input={}){const root=results();if(!root||!row)return null;const data={name:input.name||rowName(row),profile:normalizeProfile(input.profile||rowProfile(row)),score:input.score||rowScore(row),desc:input.desc||rowDesc(row)};if(!data.name)return null;const stored=selectionState.write(root,data);if(!stored)return null;const snapshot={row,name:stored.selected,profile:stored.profile,score:stored.score,desc:stored.desc};return render(snapshot)}
  function restore(options={}){const snap=selectionState.snapshot(results(),{clearMissing:options.clearMissing!==false});return snap?render(snap):render(null)}
  function clear(){selectionState.clear(results());return render(null)}
  function handleRow(row){return apply(row)}
  return{apply,restore,clear,render,handleRow,rowName,rowProfile,rowScore,rowDesc,reflectRows};
}
module.exports={IMPLEMENTATION_VERSION,DNA_LANES,PRESENTATION_ROLES,normalizeProfile,metricHtml,candidateDnaHtml,quickJudgmentModel,quickJudgmentHtml,createCandidatePreviewController,production_active:false,score_logic_changed:false,random_scoring_changed:false};
