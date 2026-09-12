'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01593')}catch{prior=require('../v0.15.93/runtime-source-stability-v01593')}

function countOf(src,needle){return String(src).split(needle).length-1}
function replaceRange(src,start,end,replacement,signature,label){
  if(src.includes(signature))return src;
  const a=src.indexOf(start),b=a>=0?src.indexOf(end,a+start.length):-1;
  if(a<0||b<0||src.indexOf(start,a+1)>=0)throw new Error(`v0.15.94 source contract mismatch ${label}`);
  return src.slice(0,a)+replacement+src.slice(b);
}

function candidateRoleSignalsV01594(row,name,desc){
  const texts=[String(desc||''),String(row?.textContent||'')];
  const names=[normalizeNameV01593(name)];
  row?.querySelectorAll?.('.comboIconLine [data-champion-name],.comboIconLine [data-name],.comboIconLine img').forEach(el=>{
    const v=normalizeNameV01593(el?.dataset?.championName||el?.dataset?.name||el?.getAttribute?.('alt')||el?.getAttribute?.('title')||'');
    if(v&&v.length<=24&&!names.includes(v))names.push(v);
  });
  const metas=[];
  names.forEach(n=>{try{const m=candidateMetaFromGlobalsV01593(n);if(m)metas.push(m)}catch{}});
  metas.forEach(m=>{
    texts.push(String(m?.role||''),String(m?.class||''),String(m?.position||''),String(m?.damageType||m?.damage_type||''));
    if(Array.isArray(m?.roles))texts.push(m.roles.join(' '));
    if(Array.isArray(m?.tags))texts.push(m.tags.join(' '));
  });
  const t=texts.join(' ').toLowerCase();
  const s={engage:0,poke:0,front:0,sustain:0,cc:0};
  const raise=(k,v)=>{s[k]=Math.max(s[k],v)};
  if(/이니시|진입|교전|engage|initiat|dive|돌진/.test(t))raise('engage',1);
  if(/포킹|poke|artillery|장거리 견제|사거리/.test(t))raise('poke',1);
  if(/프론트|앞라인|탱커|frontline|\btank\b|vanguard|warden/.test(t))raise('front',1);
  if(/지속 전투|지속딜|sustain|회복|힐|보호|쉴드|enchanter|유지력/.test(t))raise('sustain',1);
  if(/군중|제어|\bcc\b|stun|root|knock|silence|slow|속박|기절|에어본/.test(t))raise('cc',1);
  if(/\btank\b|탱커|vanguard|warden/.test(t)){raise('engage',.82);raise('front',1);raise('cc',.78);raise('sustain',.55)}
  if(/fighter|bruiser|juggernaut|브루저|전사/.test(t)){raise('engage',.5);raise('front',.72);raise('sustain',.7)}
  if(/assassin|암살/.test(t)){raise('engage',.72)}
  if(/marksman|원딜|adc/.test(t)){raise('sustain',.74)}
  if(/support|서포터|enchanter|강화형/.test(t)){raise('sustain',.95);raise('cc',.58)}
  if(/mage|메이지/.test(t)){raise('poke',.46);raise('cc',.34)}
  return s;
}

function mergeDnaMetricV01594(base,signal){
  const b=base||{pct:0,state:'확인',missing:false};
  const v=Math.max(0,Math.min(1,Number(signal)||0));
  const bp=Math.max(0,Math.min(100,Number(b.pct)||0));
  if(b.missing){
    if(v>=.74)return{pct:Math.max(78,Math.min(94,Math.round(70+v*22))),state:'보완',missing:false,preview:true};
    if(v>=.45)return{pct:Math.max(52,Math.min(72,Math.round(42+v*35))),state:'부분 보완',missing:true,preview:true};
    return{pct:bp||24,state:'부족',missing:true,preview:false};
  }
  if(v>=.74)return{pct:Math.min(96,Math.max(bp,Math.round(80+v*16))),state:'강화',missing:false,preview:true};
  if(v>=.45)return{pct:Math.min(90,Math.max(bp,Math.round(72+v*18))),state:'확보+',missing:false,preview:true};
  return{pct:bp||78,state:b.state||'확보',missing:false,preview:false};
}

function shortageSignalV01594(text,signals,profile){
  const t=String(text||'').toLowerCase();
  if(/이니시|진입|교전|engage/.test(t))return signals.engage;
  if(/포킹|poke/.test(t))return signals.poke;
  if(/프론트|앞라인|탱커|frontline/.test(t))return signals.front;
  if(/지속|유지|보호|회복|sustain/.test(t))return signals.sustain;
  if(/군중|제어|\bcc\b/.test(t))return signals.cc;
  if(/\bad\b|물리/.test(t))return Number(profile?.adPct)>=55?1:0;
  if(/\bap\b|마법/.test(t))return Number(profile?.apPct)>=35?1:0;
  return 0;
}

function candidateDnaPreviewV01594(row,name,desc,profile){
  const m=pickReferenceModelV01590();
  const signals=candidateRoleSignalsV01594(row,name,desc);
  const dna={
    engage:mergeDnaMetricV01594(m.dna.engage,signals.engage),
    poke:mergeDnaMetricV01594(m.dna.poke,signals.poke),
    front:mergeDnaMetricV01594(m.dna.front,signals.front),
    sustain:mergeDnaMetricV01594(m.dna.sustain,signals.sustain),
    cc:mergeDnaMetricV01594(m.dna.cc,signals.cc)
  };
  const shortages=(m.shortages||[]).filter(x=>shortageSignalV01594(x,signals,profile)<.74);
  if(!shortages.length){
    const missing=[];
    if(dna.engage.missing)missing.push('이니시');
    if(dna.poke.missing)missing.push('포킹');
    if(dna.front.missing)missing.push('프론트라인');
    if(dna.sustain.missing)missing.push('지속 전투');
    if(dna.cc.missing)missing.push('군중 제어');
    shortages.push(...missing.slice(0,6));
  }
  return{m,signals,dna,shortages,profile};
}

function dnaMetricPreviewHtmlV01594(label,x){
  const cls=x?.missing?' missing':(x?.preview?' preview':'');
  return `<div class="rp90DnaMetric${cls}"><div class="rp90DnaTop"><span>${esc(label)}</span><b>${esc(x?.state||'확인')}</b></div><div class="rp90DnaBar" style="--v:${Number(x?.pct)||0}%"><i></i></div></div>`;
}

function renderCandidateDnaV01594(row,name,profile,score,desc){
  const panel=document.querySelector('#rpPickIntelV01589');if(!panel)return;
  const p=candidateDnaPreviewV01594(row,name,desc,profile);
  const chips=(p.shortages.length?p.shortages:['현재 큰 결손 없음']).map(x=>`<span class="rp89Chip${p.shortages.length?'':' good'}">${esc(x)}</span>`).join('');
  panel.innerHTML=`<div class="rp89IntelHead"><b>◆ 조합 DNA</b><span>${esc(name)} 반영 · LIVE PREVIEW</span></div>
    ${dnaMetricPreviewHtmlV01594('한타 개시(Engage)',p.dna.engage)}
    ${dnaMetricPreviewHtmlV01594('포킹(Poke)',p.dna.poke)}
    ${dnaMetricPreviewHtmlV01594('프론트라인(Frontline)',p.dna.front)}
    ${dnaMetricPreviewHtmlV01594('지속 전투(Sustain)',p.dna.sustain)}
    ${dnaMetricPreviewHtmlV01594('군중 제어(CC)',p.dna.cc)}
    <div class="rp90DnaDamage"><div class="rp90DnaTop"><span>실전 AD / AP</span><b>AD ${profile.adPct}% / AP ${profile.apPct}%</b></div><div class="rp90DnaSplit" style="--ad:${profile.adPct}%;--ap:${profile.apPct}%"><i class="ad"></i><i class="ap"></i></div><div class="rp90DnaLegend"><span>AD ${profile.adPct}%</span><span>AP ${profile.apPct}%</span></div></div>
    <div class="rp89IntelSection"><strong>⚠ 부족한 역할 · ${esc(name)} 반영</strong><div class="rp89Chips">${chips}</div></div>
    <div class="rp89IntelSection"><strong>✦ 선택 후보</strong><div class="rp89Top1"><span>${esc(score||'-')}</span><b>${esc(name||'선택 후보')}</b><small>${esc(desc||'선택한 후보를 포함한 조합 미리보기입니다.')}</small></div></div>`;
}

function applyCandidatePreviewV01594(row,name,profile,score,desc){
  const results=document.querySelector('#comboResults');if(!results)return;
  results.dataset.selectedCandidate=normalizeNameV01593(name);
  results.querySelectorAll('.combo').forEach(x=>x.classList.toggle('isSelectedV01593',x===row));
  results.querySelectorAll('.rp93SelectedBadge').forEach(x=>x.remove());
  const box=row?.querySelector('.rp90NameBox');
  if(box){const b=document.createElement('span');b.className='rp93SelectedBadge';b.textContent='선택 미리보기';box.querySelector('.rp90Name')?.appendChild(b)}
  renderCandidateDnaV01594(row,name,profile,score,desc);
  document.querySelectorAll('.rpQuickCardV01549').forEach(card=>{
    const label=String(card.querySelector('span')?.textContent||'').trim(),b=card.querySelector('b');if(!b)return;
    if(label==='현재 결론')b.textContent=name||'선택 후보';
    if(label==='실전 AD / AP'){
      b.textContent=`${profile.adPct} / ${profile.apPct}`;
      const split=card.querySelector('.rp90QuickSplit');if(split)split.setAttribute('style',`--ad:${profile.adPct}%;--ap:${profile.apPct}%`)
    }
    if(label==='TOP1 점수')b.textContent=score||'-';
    if(label==='추천 방향')b.textContent=desc||'선택 후보 기준으로 조합을 확인합니다.';
  });
}

function reapplySelectedCandidatePreviewV01594(){
  const results=document.querySelector('#comboResults');if(!results)return;
  const selected=normalizeNameV01593(results.dataset.selectedCandidate||'');if(!selected)return;
  const rows=[...results.querySelectorAll('.combo')].slice(0,5);
  const row=rows.find(x=>normalizeNameV01593(x.dataset.rp93Candidate||canonicalChampionNameV01590(txt(x.querySelector('.names')),x))===selected);if(!row)return;
  const name=row.dataset.rp93Candidate||selected;
  const profile={adPct:Number(row.dataset.rp93Ad)||50,apPct:Number(row.dataset.rp93Ap)||50};
  const score=txt(row.querySelector('.comboScore'))||txt(row.querySelector('.rp90Score'))||'-';
  const desc=txt(row.querySelector('.desc'))||txt(row.querySelector('.rp90Desc'))||'선택 후보 기준 조합 미리보기입니다.';
  applyCandidatePreviewV01594(row,name,profile,score,desc);
}

function patchRandomPracticeV01594(src){
  if(src.includes('function candidateRoleSignalsV01594('))return src;
  const helpers=[candidateRoleSignalsV01594,mergeDnaMetricV01594,shortageSignalV01594,candidateDnaPreviewV01594,dnaMetricPreviewHtmlV01594,renderCandidateDnaV01594,applyCandidatePreviewV01594,reapplySelectedCandidatePreviewV01594].map(fn=>'  '+fn.toString().replace(/\n/g,'\n  ')).join('\n\n')+'\n\n';
  const anchor='  function enhanceTop5V01590(r){';
  if(countOf(src,anchor)!==1)throw new Error(`v0.15.94 source contract mismatch TOP5 anchor count=${countOf(src,anchor)}`);
  src=src.replace(anchor,helpers+anchor);
  src=src.replaceAll('setTimeout(()=>applyCandidatePreviewV01593(','setTimeout(()=>applyCandidatePreviewV01594(');
  src=src.replaceAll('if(row)applyCandidatePreviewV01593(','if(row)applyCandidatePreviewV01594(');
  const refreshOld='    refreshDnaV01590();\n    normalizeVisibleNamesV01590();';
  const refreshNew='    refreshDnaV01590();\n    reapplySelectedCandidatePreviewV01594();\n    normalizeVisibleNamesV01590();';
  if(countOf(src,refreshOld)!==1)throw new Error(`v0.15.94 source contract mismatch DNA refresh hook count=${countOf(src,refreshOld)}`);
  src=src.replace(refreshOld,refreshNew);
  return src;
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-practice-focus-v01549.js')src=patchRandomPracticeV01594(src);
  return src;
}

module.exports={
  patchRuntimeSource,
  score_logic_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  route_adoption_changed:prior.route_adoption_changed===true,
  ingame_hud_changed:prior.ingame_hud_changed===true,
  poro_snax_filtered:prior.poro_snax_filtered===true,
  random_pick_window_hotfix_changed:prior.random_pick_window_hotfix_changed===true,
  random_pick_candidate_preview_changed:true,
  random_pick_candidate_balance_changed:true,
  random_pick_candidate_full_dna_preview_changed:true,
  policy_version:'0.15.94'
};
