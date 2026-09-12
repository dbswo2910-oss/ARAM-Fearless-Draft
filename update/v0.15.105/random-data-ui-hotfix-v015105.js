'use strict';
(()=>{
  const V='0.15.105';
  if(window.__ARAM_RANDOM_DATA_HOTFIX_V015105__)return;
  window.__ARAM_RANDOM_DATA_HOTFIX_V015105__=true;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=(v,d=0)=>{const n=Number(v);return Number.isFinite(n)?n:d};
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));

  function ensureStyle(){
    if($('#randomDataHotfixStyleV015105'))return;
    const st=document.createElement('style');
    st.id='randomDataHotfixStyleV015105';
    st.textContent=`
      /* RANDOM TOP5 interaction + detail restore */
      #random #comboResults .combo{cursor:pointer!important;pointer-events:auto!important}
      #random #comboResults .combo.rp105Selected{border-color:#39d9ff!important;box-shadow:inset 3px 0 0 #39d9ff,0 0 0 1px rgba(57,217,255,.22),0 0 18px rgba(57,217,255,.10)!important}
      #random #comboResults .combo .rp90ComboView{grid-template-columns:26px minmax(120px,.72fr) minmax(120px,.52fr) 92px minmax(175px,1.25fr) auto!important;gap:7px!important}
      #random #comboResults .rp90Damage{display:block!important;min-width:86px!important;font-size:7px!important;color:#86a8bf!important}
      #random #comboResults .rp90DamageBar{display:flex!important;height:5px!important;border-radius:999px!important;overflow:hidden!important;background:#10283a!important;margin-top:4px!important}
      #random #comboResults .rp90DamageBar .ad{background:#ff7b6f!important;width:var(--ad,50%)!important}
      #random #comboResults .rp90DamageBar .ap{background:#56bfff!important;width:var(--ap,50%)!important}
      #random #comboResults .rp105DamageMeta{min-width:96px;padding:3px 0}
      #random #comboResults .rp105DamageText{display:flex;justify-content:space-between;gap:6px;font-size:7px;color:#8bacbf;white-space:nowrap}
      #random #comboResults .rp105DamageText b{font-size:7px;color:#d7efff}
      #random #comboResults .rp105DamageBar{display:flex;height:5px;border-radius:999px;overflow:hidden;background:#10283a;margin-top:4px}
      #random #comboResults .rp105DamageBar i{display:block;height:100%}.rp105DamageBar .ad{background:#ff7b6f}.rp105DamageBar .ap{background:#56bfff}
      #random #comboResults .rp105SelectHint{position:absolute;right:8px;top:6px;font-size:7px;color:#6e97b3;opacity:.85}
      #random #comboResults .combo:hover .rp105SelectHint{color:#8ee7ff}
      #random #comboResults .combo.rp105Selected .rp105SelectHint{color:#62e6ff;font-weight:900}
      #random #comboResults .rp90Badges{display:flex!important}
      #random #comboResults .rp90Desc{display:-webkit-box!important}
      @media(max-width:1250px){
        #random #comboResults .combo .rp90ComboView{grid-template-columns:26px minmax(120px,.9fr) 90px minmax(150px,1.2fr) auto!important}
        #random #comboResults .rp90Badges{display:none!important}
      }

      /* DATA patch notes: use the page width, not the champion-tier column split */
      #dataHubTopNavV015103.rp105TopNav{width:100%!important;max-width:none!important}
      .rp105DataHostPatch{display:grid!important;grid-template-columns:minmax(0,1fr)!important;width:100%!important;max-width:none!important}
      .rp105DataHostPatch>.rp105TierPane{display:none!important}
      .rp105DataHostPatch>.rp105DetailPane{grid-column:1/-1!important;width:100%!important;max-width:none!important;min-width:0!important}
      .rp105DataHostPatch #dataCard{width:100%!important;max-width:none!important;min-width:0!important}
      .rp105DataHostPatch #dataPatchNotesV01599{width:100%!important;max-width:1380px!important;margin:0 auto!important}
      .rp105DataHostPatch .dh99Layout{grid-template-columns:minmax(0,1fr) 250px!important;gap:16px!important;align-items:start!important}
      .rp105DataHostPatch .dh99Hero{min-height:190px!important;padding:28px 32px!important}
      .rp105DataHostPatch .dh99HeroCopy{max-width:780px!important}
      .rp105DataHostPatch .dh99Hero h2{font-size:36px!important}
      .rp105DataHostPatch .dh99Main{min-width:0!important}
      .rp105DataHostPatch .dh99Side{width:250px!important;min-width:250px!important}
      @media(max-width:1180px){
        .rp105DataHostPatch .dh99Layout{grid-template-columns:1fr!important}
        .rp105DataHostPatch .dh99Side{width:auto!important;min-width:0!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      }
    `;
    document.head.appendChild(st);
  }

  function normalizeName(s){
    return String(s||'').replace(/선택 미리보기|상세보기|상세|현재 선택/g,'').replace(/\s+/g,' ').trim();
  }

  function rowProfile(row){
    if(!row)return null;
    const name=normalizeName(row.dataset.rp93Candidate||txt(row.querySelector('.rp90Name'))||txt(row.querySelector('.names'))||'');
    const score=txt(row.querySelector('.rp90Score'))||txt(row.querySelector('.comboScore'))||'-';
    const desc=txt(row.querySelector('.rp90Desc'))||txt(row.querySelector('.desc'))||'선택 후보 기준으로 조합을 확인합니다.';
    let ad=num(row.dataset.rp93Ad,NaN),ap=num(row.dataset.rp93Ap,NaN);
    if(!Number.isFinite(ad)||!Number.isFinite(ap)){
      const t=txt(row.querySelector('.rp90Damage'))+' '+txt(row);
      const m=t.match(/AD\s*(\d+(?:\.\d+)?)\s*%?.*?AP\s*(\d+(?:\.\d+)?)\s*%?/i) ||
              t.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
      if(m){ad=num(m[1],50);ap=num(m[2],50)}
    }
    if(!Number.isFinite(ad)||!Number.isFinite(ap)){ad=50;ap=50}
    const total=ad+ap||100;
    ad=Math.round(ad/total*100);ap=100-ad;
    return {row,name,score,desc,ad,ap,text:txt(row).toLowerCase()};
  }

  function ensureRowDetail(row){
    const p=rowProfile(row);if(!p||!p.name)return;
    row.dataset.rp93Candidate=row.dataset.rp93Candidate||p.name;
    row.dataset.rp93Ad=String(p.ad);
    row.dataset.rp93Ap=String(p.ap);
    row.tabIndex=0;
    let dmg=row.querySelector('.rp90Damage');
    if(dmg){
      dmg.innerHTML=`<div>AD ${p.ad}% · AP ${p.ap}%</div><div class="rp90DamageBar" style="--ad:${p.ad}%;--ap:${p.ap}%"><i class="ad"></i><i class="ap"></i></div>`;
    }else{
      const view=row.querySelector('.rp90ComboView')||row;
      let meta=row.querySelector('.rp105DamageMeta');
      if(!meta){meta=document.createElement('div');meta.className='rp105DamageMeta';view.appendChild(meta)}
      meta.innerHTML=`<div class="rp105DamageText"><span>AD <b>${p.ad}%</b></span><span>AP <b>${p.ap}%</b></span></div><div class="rp105DamageBar"><i class="ad" style="width:${p.ad}%"></i><i class="ap" style="width:${p.ap}%"></i></div>`;
    }
    let hint=row.querySelector('.rp105SelectHint');
    if(!hint){hint=document.createElement('span');hint.className='rp105SelectHint';row.appendChild(hint)}
    hint.textContent=row.classList.contains('rp105Selected')?'선택됨':'클릭 → DNA';
  }

  function metricBase(panel,labelKey){
    const nodes=$$('.rp90DnaMetric,.rp103DnaMetric',panel);
    const node=nodes.find(x=>txt(x).toLowerCase().includes(labelKey));
    if(!node)return {pct:72,state:'확보',missing:false};
    const bar=node.querySelector('.rp90DnaBar,.rp103DnaBar');
    const style=bar?.getAttribute('style')||'';
    const m=style.match(/--v:\s*(\d+(?:\.\d+)?)%/);
    return {pct:clamp(num(m?.[1],72)),state:txt(node.querySelector('b'))||'확보',missing:node.classList.contains('missing')};
  }

  function candidateSignals(text){
    const t=String(text||'').toLowerCase();
    const has=r=>r.test(t);
    return {
      engage:has(/이니시|진입|교전|engage|dive|돌진|암살/),
      poke:has(/포킹|poke|사거리|장거리|artillery|메이지/),
      front:has(/프론트|앞라인|탱커|tank|브루저|fighter|전사/),
      sustain:has(/지속|유지|회복|보호|쉴드|힐|support|서포터|원딜|adc|marksman/),
      cc:has(/군중|제어|cc|속박|기절|에어본|knock|slow|silence|탱커|서포터/)
    };
  }

  function boosted(base,on){
    if(!on)return base;
    return {pct:Math.max(base.pct,base.missing?82:88),state:base.missing?'보완':'강화',missing:false};
  }

  function metricHtml(label,m){
    return `<div class="rp90DnaMetric${m.missing?' missing':''}"><div class="rp90DnaTop"><span>${esc(label)}</span><b>${esc(m.state)}</b></div><div class="rp90DnaBar" style="--v:${m.pct}%"><i></i></div></div>`;
  }

  function renderPreview(p){
    const panel=$('#rpPickIntelV01589');if(!panel||!p)return;
    const sig=candidateSignals(p.text);
    const engage=boosted(metricBase(panel,'engage'),sig.engage);
    const poke=boosted(metricBase(panel,'poke'),sig.poke);
    const front=boosted(metricBase(panel,'front'),sig.front);
    const sustain=boosted(metricBase(panel,'sustain'),sig.sustain);
    const cc=boosted(metricBase(panel,'cc'),sig.cc);
    const shortages=[];
    if(engage.missing)shortages.push('이니시');
    if(poke.missing)shortages.push('포킹');
    if(front.missing)shortages.push('프론트라인');
    if(sustain.missing)shortages.push('지속 전투');
    if(cc.missing)shortages.push('군중 제어');
    const chips=(shortages.length?shortages:['현재 큰 결손 없음']).map(x=>`<span class="rp89Chip${shortages.length?'':' good'}">${esc(x)}</span>`).join('');
    panel.innerHTML=`<div class="rp89IntelHead"><b>◆ 조합 DNA</b><span>${esc(p.name)} 반영 · LIVE PREVIEW</span></div>
      ${metricHtml('한타 개시(Engage)',engage)}
      ${metricHtml('포킹(Poke)',poke)}
      ${metricHtml('프론트라인(Frontline)',front)}
      ${metricHtml('지속 전투(Sustain)',sustain)}
      ${metricHtml('군중 제어(CC)',cc)}
      <div class="rp90DnaDamage"><div class="rp90DnaTop"><span>실전 AD / AP</span><b>AD ${p.ad}% / AP ${p.ap}%</b></div><div class="rp90DnaSplit" style="--ad:${p.ad}%;--ap:${p.ap}%"><i class="ad"></i><i class="ap"></i></div><div class="rp90DnaLegend"><span>AD ${p.ad}%</span><span>AP ${p.ap}%</span></div></div>
      <div class="rp89IntelSection"><strong>⚠ 부족한 역할 · ${esc(p.name)} 반영</strong><div class="rp89Chips">${chips}</div></div>
      <div class="rp89IntelSection"><strong>✦ 선택 후보</strong><div class="rp89Top1"><span>${esc(p.score)}</span><b>${esc(p.name)}</b><small>${esc(p.desc)}</small></div></div>`;
  }

  function applyTop5Selection(row){
    const p=rowProfile(row);if(!p||!p.name)return false;
    const results=$('#comboResults');if(!results)return false;
    results.dataset.selectedCandidate=p.name;
    results.dataset.selectedCandidateScore=p.score;
    results.dataset.selectedCandidateDesc=p.desc;
    results.dataset.selectedCandidateAd=String(p.ad);
    results.dataset.selectedCandidateAp=String(p.ap);
    $$('.combo',results).forEach(x=>{
      const on=x===row;
      x.classList.toggle('rp105Selected',on);
      x.classList.toggle('isSelectedV01593',on);
      const h=x.querySelector('.rp105SelectHint');if(h)h.textContent=on?'선택됨':'클릭 → DNA';
    });
    renderPreview(p);
    return true;
  }

  function decorateTop5(){
    const results=$('#comboResults');if(!results)return;
    const rows=$$('.combo',results).slice(0,5);
    rows.forEach(ensureRowDetail);
    const selected=normalizeName(results.dataset.selectedCandidate||'');
    if(selected){
      const row=rows.find(x=>normalizeName(x.dataset.rp93Candidate||txt(x.querySelector('.rp90Name'))||txt(x.querySelector('.names')))==selected);
      if(row){row.classList.add('rp105Selected');const h=row.querySelector('.rp105SelectHint');if(h)h.textContent='선택됨'}
    }
  }

  function syncDataLayout(){
    const nav=$('#dataHubTopNavV015103');if(!nav)return;
    nav.classList.add('rp105TopNav');
    const buttons=$$('button',nav);
    const patchActive=buttons.some(b=>b.classList.contains('active')&&txt(b).includes('패치노트'));
    const dataCard=$('#dataCard');if(!dataCard)return;
    const host=nav.parentElement;
    if(!host)return;
    host.classList.toggle('rp105DataHostPatch',patchActive);
    const direct=[...host.children].filter(x=>x!==nav);
    let detail=direct.find(x=>x===dataCard||x.contains?.(dataCard))||dataCard.parentElement;
    let tier=direct.find(x=>x!==detail&&(txt(x).includes('역할별 티어 브라우저')||x.querySelector?.('[class*="tier"],#dataTierList,#championTierList')));
    if(!tier&&direct.length===2)tier=direct.find(x=>x!==detail);
    if(detail)detail.classList.toggle('rp105DetailPane',patchActive);
    if(tier)tier.classList.toggle('rp105TierPane',patchActive);
  }

  function sync(){
    ensureStyle();
    decorateTop5();
    syncDataLayout();
  }

  document.addEventListener('click',e=>{
    const row=e.target?.closest?.('#comboResults .combo');
    if(row){
      // 상세보기 버튼의 기존 동작은 유지하면서 카드 선택도 같이 적용
      applyTop5Selection(row);
      setTimeout(sync,0);
      return;
    }
    const nav=e.target?.closest?.('#dataHubTopNavV015103 button');
    if(nav)setTimeout(syncDataLayout,0);
    if(e.target?.closest?.('#random'))setTimeout(decorateTop5,50);
  },true);

  document.addEventListener('keydown',e=>{
    const row=e.target?.closest?.('#comboResults .combo');
    if(row&&(e.key==='Enter'||e.key===' ')){e.preventDefault();applyTop5Selection(row)}
  },true);

  document.addEventListener('change',e=>{
    if(e.target?.closest?.('#random')||e.target?.closest?.('#dataCard'))setTimeout(sync,60);
  },true);

  window.__ARAM_V015105_SYNC__=sync;
  ensureStyle();
  sync();
  setTimeout(sync,250);
  setTimeout(sync,900);
})();
