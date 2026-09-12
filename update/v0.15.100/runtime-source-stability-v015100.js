'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01599')}catch{prior=require('../v0.15.99/runtime-source-stability-v01599')}

function countOf(src,needle){return String(src).split(needle).length-1}
function replaceRangeV015100(src,start,end,replacement,label){
  const a=src.indexOf(start),b=a>=0?src.indexOf(end,a+start.length):-1;
  if(a<0||b<0||src.indexOf(start,a+1)>=0)throw new Error(`v0.15.100 source contract mismatch ${label}`);
  return src.slice(0,a)+replacement+src.slice(b);
}

function clearSelectedCandidateV015100(){
  const results=document.querySelector('#comboResults');if(!results)return;
  ['selectedCandidate','selectedCandidateScore','selectedCandidateDesc','selectedCandidateAd','selectedCandidateAp'].forEach(k=>{try{delete results.dataset[k]}catch{}});
  results.querySelectorAll('.combo.isSelectedV01593').forEach(row=>row.classList.remove('isSelectedV01593'));
  results.querySelectorAll('.rp93SelectedBadge').forEach(x=>x.remove());
}

function selectedCandidateSnapshotV015100(options={}){
  const results=document.querySelector('#comboResults');if(!results)return null;
  const selected=normalizeNameV01593(results.dataset.selectedCandidate||'');if(!selected)return null;
  const rows=[...results.querySelectorAll('.combo')].slice(0,5);
  const row=rows.find(x=>normalizeNameV01593(x.dataset.rp93Candidate||canonicalChampionNameV01590(txt(x.querySelector('.names')),x))===selected)||null;
  if(!row){
    if(rows.length&&options.clearMissing!==false){clearSelectedCandidateV015100();return null}
    const ad=Number(results.dataset.selectedCandidateAd),ap=Number(results.dataset.selectedCandidateAp);
    return{
      row:null,name:selected,
      profile:{adPct:Number.isFinite(ad)?ad:50,apPct:Number.isFinite(ap)?ap:50},
      score:results.dataset.selectedCandidateScore||'-',
      desc:results.dataset.selectedCandidateDesc||'선택한 후보를 포함한 조합 미리보기입니다.'
    };
  }
  const name=row.dataset.rp93Candidate||selected;
  const ad=Number(row.dataset.rp93Ad),ap=Number(row.dataset.rp93Ap);
  const score=txt(row.querySelector('.comboScore'))||txt(row.querySelector('.rp90Score'))||results.dataset.selectedCandidateScore||'-';
  const desc=txt(row.querySelector('.desc'))||txt(row.querySelector('.rp90Desc'))||results.dataset.selectedCandidateDesc||'선택한 후보를 포함한 조합 미리보기입니다.';
  return{row,name,profile:{adPct:Number.isFinite(ad)&&ad>0?ad:50,apPct:Number.isFinite(ap)&&ap>0?ap:50},score,desc};
}

function applyCandidatePreviewV015100(row,name,profile,score,desc){
  const results=document.querySelector('#comboResults');if(!results)return false;
  const selected=normalizeNameV01593(name);if(!selected)return false;
  const p={adPct:Number(profile?.adPct)||50,apPct:Number(profile?.apPct)||50};
  results.dataset.selectedCandidate=selected;
  results.dataset.selectedCandidateScore=String(score||'-');
  results.dataset.selectedCandidateDesc=String(desc||'선택한 후보를 포함한 조합 미리보기입니다.');
  results.dataset.selectedCandidateAd=String(p.adPct);
  results.dataset.selectedCandidateAp=String(p.apPct);

  results.querySelectorAll('.combo').forEach(x=>{
    const isSelected=row?x===row:normalizeNameV01593(x.dataset.rp93Candidate||canonicalChampionNameV01590(txt(x.querySelector('.names')),x))===selected;
    if(x.classList.contains('isSelectedV01593')!==isSelected)x.classList.toggle('isSelectedV01593',isSelected);
    const nameBox=x.querySelector('.rp90Name');
    const badge=x.querySelector('.rp93SelectedBadge');
    if(isSelected&&nameBox&&!badge){const b=document.createElement('span');b.className='rp93SelectedBadge';b.textContent='선택 미리보기';nameBox.appendChild(b)}
    else if(!isSelected&&badge)badge.remove();
  });

  renderCandidateDnaV01594(row,selected,p,score,desc);
  document.querySelectorAll('.rpQuickCardV01549').forEach(card=>{
    const label=String(card.querySelector('span')?.textContent||'').trim(),b=card.querySelector('b');if(!b)return;
    if(label==='현재 결론'){
      b.textContent=selected;
      const small=card.querySelector('small');if(small)small.textContent='선택 미리보기';
    }
    if(label==='실전 AD / AP'){
      b.textContent=`${p.adPct} / ${p.apPct}`;
      const split=card.querySelector('.rp90QuickSplit');if(split)split.setAttribute('style',`--ad:${p.adPct}%;--ap:${p.apPct}%`);
    }
    if(label==='TOP1 점수')b.textContent=score||'-';
    if(label==='추천 방향')b.textContent=desc||'선택 후보 기준으로 조합을 확인합니다.';
  });
  return true;
}

function restoreSelectedCandidatePreviewV015100(options={}){
  const snap=selectedCandidateSnapshotV015100(options);if(!snap)return false;
  return applyCandidatePreviewV015100(snap.row,snap.name,snap.profile,snap.score,snap.desc);
}

function refreshDnaV01590(){
  if(restoreSelectedCandidatePreviewV015100({clearMissing:true}))return;
  const panel=document.querySelector('#rpPickIntelV01589');if(!panel)return;
  const m=pickReferenceModelV01590();
  const chips=(m.shortages.length?m.shortages:[m.missing||'현재 큰 결손 없음']).filter(Boolean).map(x=>`<span class="rp89Chip${m.shortages.length?'':' good'}">${esc(x)}</span>`).join('');
  panel.innerHTML=`<div class="rp89IntelHead"><b>◆ 조합 DNA</b><span>LIVE PICK INTEL</span></div>
    ${dnaMetricHtmlV01590('한타 개시(Engage)',m.dna.engage)}
    ${dnaMetricHtmlV01590('포킹(Poke)',m.dna.poke)}
    ${dnaMetricHtmlV01590('프론트라인(Frontline)',m.dna.front)}
    ${dnaMetricHtmlV01590('지속 전투(Sustain)',m.dna.sustain)}
    ${dnaMetricHtmlV01590('군중 제어(CC)',m.dna.cc)}
    <div class="rp90DnaDamage"><div class="rp90DnaTop"><span>실전 AD / AP</span><b>${esc(m.damage)}</b></div><div class="rp90DnaSplit" style="--ad:${m.adPct}%;--ap:${m.apPct}%"><i class="ad"></i><i class="ap"></i></div><div class="rp90DnaLegend"><span>AD ${m.adPct}%</span><span>AP ${m.apPct}%</span></div></div>
    <div class="rp89IntelSection"><strong>⚠ 부족한 역할</strong><div class="rp89Chips">${chips}</div></div>
    <div class="rp89IntelSection"><strong>✦ 현재 TOP1</strong><div class="rp89Top1"><span>${esc(m.top?.score||'계산 대기')}</span><b>${esc(m.top?.name||'후보 계산 대기')}</b><small>${esc(m.top?.reason||'후보 입력 후 TOP5를 계산하면 핵심 시너지가 표시됩니다.')}</small></div></div>`;
}

function quickJudgmentHtmlV01590(){
  const m=pickReferenceModelV01590();
  const selected=selectedCandidateSnapshotV015100({clearMissing:true});
  const qText=`${m.q}인큐 · 외부 확정픽 ${m.ext}명 + 우리 파티 ${m.q}명`;
  const calcText=m.need===0?'고정 완료':`${m.calc} · 고정 ${m.locked}/${m.q}`;
  const topName=selected?.name||m.top?.name||'계산 대기';
  const direction=selected?.desc||m.top?.reason||m.missing||'후보를 입력하면 추천 방향이 표시됩니다.';
  const damage=selected?`${selected.profile.adPct} / ${selected.profile.apPct}`:m.damage;
  const adPct=selected?.profile.adPct??m.adPct,apPct=selected?.profile.apPct??m.apPct;
  const score=selected?.score||m.top?.score||'-';
  return `<div class="rpQuickGridV01549">
    <div class="rpQuickCardV01549"><span>현재 큐</span><b>${esc(qText)}</b></div>
    <div class="rpQuickCardV01549"><span>후보 계산</span><b>${esc(calcText)}</b></div>
    <div class="rpQuickCardV01549 conclusion"><span>현재 결론</span><b>${esc(topName)}</b><small>${selected?'선택 미리보기':'최우선 추천'}</small></div>
    <div class="rpQuickCardV01549"><span>실전 AD / AP</span><b>${esc(damage)}</b><div class="rp90QuickSplit" style="--ad:${adPct}%;--ap:${apPct}%"><i class="ad"></i><i class="ap"></i></div></div>
    <div class="rpQuickCardV01549"><span>TOP1 점수</span><b>${esc(score)}</b></div>
    <div class="rpQuickCardV01549 direction"><span>추천 방향</span><b>${esc(direction)}</b></div>
  </div>`;
}

function normalizeVisibleNamesV01590(){
  const selected=selectedCandidateSnapshotV015100({clearMissing:true});
  const row=selected?.row||document.querySelector('#comboResults .combo');
  const canonical=selected?.name||canonicalChampionNameV01590(txt(row?.querySelector('.names')),row);
  const focus=document.querySelector('#rpFocusCardV01549 b');
  if(focus&&canonical&&!selected){const t=String(focus.textContent||'');const dot=t.indexOf(' · ');focus.textContent=canonical+(dot>=0?t.slice(dot):'')}
  const top=document.querySelector('#rpPickIntelV01589 .rp89Top1 b');if(top&&canonical)top.textContent=canonical;
  document.querySelectorAll('.rpQuickCardV01549').forEach(card=>{if(txt(card.querySelector('span'))==='현재 TOP1'||txt(card.querySelector('span'))==='현재 결론'){const b=card.querySelector('b');if(b&&canonical)b.textContent=canonical}});
}

function refreshPickReferenceV01590(r){
  if(!r?.root)return;
  arrangeReferenceLayoutV01590(r);
  enhanceTop5V01590(r);
  refreshDnaV01590();
  normalizeVisibleNamesV01590();
}

function patchRandomPracticeV015100(src){
  if(src.includes('function selectedCandidateSnapshotV015100('))return src;
  const helperAnchor='  function refreshDnaV01590(){';
  if(countOf(src,helperAnchor)!==1)throw new Error(`v0.15.100 source contract mismatch DNA anchor count=${countOf(src,helperAnchor)}`);
  const helpers=[clearSelectedCandidateV015100,selectedCandidateSnapshotV015100,applyCandidatePreviewV015100,restoreSelectedCandidatePreviewV015100].map(fn=>'  '+fn.toString().replace(/\n/g,'\n  ')).join('\n\n')+'\n\n';
  src=src.replace(helperAnchor,helpers+helperAnchor);

  src=replaceRangeV015100(src,'  function refreshDnaV01590(){','  function candidateRoleSignalsV01594(', '  '+refreshDnaV01590.toString().replace(/\n/g,'\n  ')+'\n\n','DNA refresh lock');
  src=replaceRangeV015100(src,'  function quickJudgmentHtmlV01590(){','  function normalizeVisibleNamesV01590(', '  '+quickJudgmentHtmlV01590.toString().replace(/\n/g,'\n  ')+'\n\n','quick judgment lock');
  src=replaceRangeV015100(src,'  function normalizeVisibleNamesV01590(){','  function refreshPickReferenceV01590(', '  '+normalizeVisibleNamesV01590.toString().replace(/\n/g,'\n  ')+'\n\n','visible name lock');
  src=replaceRangeV015100(src,'  function refreshPickReferenceV01590(r){','  function stageHead(', '  '+refreshPickReferenceV01590.toString().replace(/\n/g,'\n  ')+'\n\n','pick refresh order');

  const clickOld='setTimeout(()=>applyCandidatePreviewV01594(';
  if(countOf(src,clickOld)<1)throw new Error('v0.15.100 source contract mismatch candidate click route');
  src=src.replaceAll(clickOld,'setTimeout(()=>applyCandidatePreviewV015100(');
  const restoreOld='if(row)applyCandidatePreviewV01594(';
  if(countOf(src,restoreOld)<1)throw new Error('v0.15.100 source contract mismatch candidate restore route');
  src=src.replaceAll(restoreOld,'if(row)applyCandidatePreviewV015100(');
  return src;
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-practice-focus-v01549.js')src=patchRandomPracticeV015100(src);
  return src;
}

module.exports={
  patchRuntimeSource,
  score_logic_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  route_adoption_changed:prior.route_adoption_changed===true,
  ingame_hud_changed:prior.ingame_hud_changed===true,
  poro_snax_filtered:prior.poro_snax_filtered===true,
  random_pick_candidate_preview_changed:true,
  random_pick_candidate_full_dna_preview_changed:true,
  random_pick_manual_preview_lock_changed:true,
  policy_version:'0.15.100'
};
