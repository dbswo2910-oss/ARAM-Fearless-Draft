'use strict';
(()=>{
  const V='0.15.106';
  if(window.__ARAM_RANDOM_DATA_HOTFIX_V015106__===true)return;
  const $=(s,r=document)=>r?.querySelector?.(s)||null;
  const $$=(s,r=document)=>[...(r?.querySelectorAll?.(s)||[])];
  const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number(v)||0));
  const norm=s=>String(s||'').replace(/선택 미리보기|상세보기|상세|현재 선택/g,'').replace(/\s+/g,' ').trim();

  function ensureStyle(){
    if($('#randomDataHotfixStyleV015106'))return;
    const st=document.createElement('style');
    st.id='randomDataHotfixStyleV015106';
    st.textContent=`
      /* v0.15.106: visible RANDOM TOP5 interaction + restored detail */
      #random #comboResults .combo{cursor:pointer!important;pointer-events:auto!important}
      #random #comboResults .combo.rp106Selected,
      #random #comboResults .combo.isSelectedV01593{border-color:#39d9ff!important;box-shadow:inset 3px 0 0 #39d9ff,0 0 0 1px rgba(57,217,255,.22),0 0 18px rgba(57,217,255,.10)!important}
      #random #comboResults .rp90ComboView{grid-template-columns:28px minmax(180px,1fr) 72px minmax(120px,.58fr) minmax(190px,1.18fr) 62px!important;gap:8px!important}
      #random #comboResults .rp90Damage{display:block!important;visibility:visible!important;opacity:1!important;min-width:108px!important}
      #random #comboResults .rp90Damage>span{display:block!important}
      #random #comboResults .rp90DamageBar{display:flex!important;height:5px!important;margin-top:3px!important}
      #random #comboResults .rp106DamageNumbers{display:flex;justify-content:space-between;gap:5px;margin-top:3px;font-size:7px;line-height:1;color:#8baac0;white-space:nowrap}
      #random #comboResults .rp106DamageNumbers b{font-size:7px;color:#d9f1ff}
      #random #comboResults .rp90Badges{display:flex!important}
      #random #comboResults .rp90Desc{display:-webkit-box!important;visibility:visible!important;opacity:1!important}
      #random #comboResults .rp106SelectHint{position:absolute;right:7px;top:5px;z-index:3;font-size:7px;color:#6e97b3;pointer-events:none}
      #random #comboResults .combo:hover .rp106SelectHint{color:#8ee7ff}
      #random #comboResults .combo.rp106Selected .rp106SelectHint{color:#66e8ff;font-weight:900}
      @media(max-width:1320px){
        #random #comboResults .rp90ComboView{grid-template-columns:26px minmax(150px,1fr) 66px minmax(105px,.55fr) minmax(160px,1.1fr) 58px!important}
      }

      /* v0.15.106: Patch Notes owns the Data workspace while active */
      .dataHubHostV015103.rp106PatchWide,
      .rp106PatchWide{grid-template-columns:minmax(0,1fr)!important;width:100%!important;max-width:none!important}
      .rp106PatchWide>.dataHubTierPaneV015103,
      .rp106PatchWide>.rp106TierPane{display:none!important}
      .rp106PatchWide>.dataHubDetailPaneV015103,
      .rp106PatchWide>.rp106DetailPane{grid-column:1/-1!important;width:100%!important;max-width:none!important;min-width:0!important}
      .rp106PatchWide #dataCard{grid-column:1/-1!important;width:100%!important;max-width:none!important;min-width:0!important}
      .rp106PatchWide #dataPatchNotesV01599{width:100%!important;max-width:none!important;margin:0!important}
      .rp106PatchWide .dh99Layout{grid-template-columns:minmax(0,1fr) 270px!important;gap:18px!important;align-items:start!important;width:100%!important}
      .rp106PatchWide .dh99Main{min-width:0!important;width:100%!important}
      .rp106PatchWide .dh99Side{width:270px!important;min-width:270px!important}
      .rp106PatchWide .dh99Hero{min-height:180px!important;padding:26px 30px!important}
      .rp106PatchWide .dh99HeroCopy{max-width:860px!important}
      @media(max-width:1180px){
        .rp106PatchWide .dh99Layout{grid-template-columns:1fr!important}
        .rp106PatchWide .dh99Side{width:auto!important;min-width:0!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      }
    `;
    (document.head||document.documentElement)?.appendChild(st);
  }

  function profile(row){
    if(!row)return null;
    const name=norm(row.dataset.rp93Candidate||txt($('.rp90Name',row))||txt($('.names',row))||'');
    const score=txt($('.rp90Score',row))||txt($('.comboScore',row))||'-';
    const desc=txt($('.rp90Desc',row))||txt($('.desc',row))||'선택 후보 기준 완성 조합입니다.';
    let ad=Number(row.dataset.rp93Ad),ap=Number(row.dataset.rp93Ap);
    if(!Number.isFinite(ad)||!Number.isFinite(ap)){
      const style=$('.rp90DamageBar',row)?.getAttribute('style')||'';
      const am=style.match(/--ad:\s*(\d+(?:\.\d+)?)%/i),pm=style.match(/--ap:\s*(\d+(?:\.\d+)?)%/i);
      if(am)ad=Number(am[1]);if(pm)ap=Number(pm[1]);
    }
    if(!Number.isFinite(ad)||!Number.isFinite(ap)){
      const m=(txt(row)).match(/AD\s*(\d+(?:\.\d+)?)\s*%?.*?AP\s*(\d+(?:\.\d+)?)\s*%?/i);
      if(m){ad=Number(m[1]);ap=Number(m[2])}
    }
    if(!Number.isFinite(ad)||!Number.isFinite(ap)){ad=50;ap=50}
    const sum=ad+ap||100;ad=Math.round(ad/sum*100);ap=100-ad;
    return{row,name,score,desc,ad,ap,text:txt(row).toLowerCase()};
  }

  function decorateRow(row){
    const p=profile(row);if(!p||!p.name)return;
    row.dataset.rp93Candidate=p.name;row.dataset.rp93Ad=String(p.ad);row.dataset.rp93Ap=String(p.ap);row.tabIndex=0;
    let dmg=$('.rp90Damage',row);
    if(!dmg){
      const view=$('.rp90ComboView',row);if(!view)return;
      dmg=document.createElement('div');dmg.className='rp90Damage';
      const desc=$('.rp90Desc',view);if(desc)view.insertBefore(dmg,desc);else view.appendChild(dmg);
    }
    let label=$(':scope>span',dmg);if(!label){label=document.createElement('span');dmg.prepend(label)}
    label.textContent='실전 AD/AP';
    let bar=$('.rp90DamageBar',dmg);if(!bar){bar=document.createElement('div');bar.className='rp90DamageBar';bar.innerHTML='<i class="ad"></i><i class="ap"></i>';dmg.appendChild(bar)}
    bar.setAttribute('style',`--ad:${p.ad}%;--ap:${p.ap}%`);
    let nums=$('.rp106DamageNumbers',dmg);if(!nums){nums=document.createElement('div');nums.className='rp106DamageNumbers';dmg.appendChild(nums)}
    nums.innerHTML=`<span>AD <b>${p.ad}%</b></span><span>AP <b>${p.ap}%</b></span>`;
    let hint=$('.rp106SelectHint',row);if(!hint){hint=document.createElement('span');hint.className='rp106SelectHint';row.appendChild(hint)}
    const on=row.classList.contains('rp106Selected')||row.classList.contains('isSelectedV01593');hint.textContent=on?'선택됨':'클릭 → DNA';
  }

  function signal(text,key){
    const t=String(text||'').toLowerCase();
    const rules={
      engage:/이니시|진입|교전|engage|dive|돌진|암살|탱커/,
      poke:/포킹|poke|사거리|장거리|artillery|메이지/,
      front:/프론트|앞라인|탱커|tank|브루저|fighter|전사/,
      sustain:/지속|유지|회복|보호|쉴드|힐|support|서포터|원딜|adc|marksman/,
      cc:/군중|제어|\bcc\b|속박|기절|에어본|knock|slow|silence|탱커|서포터/
    };
    return rules[key]?.test(t)||false;
  }

  function metricInfo(node){
    if(!node)return null;
    if(!node.dataset.rp106BaseV){
      const bar=$('.rp90DnaBar,.rp103DnaBar',node),style=bar?.getAttribute('style')||'',m=style.match(/--v:\s*(\d+(?:\.\d+)?)%/);
      node.dataset.rp106BaseV=String(clamp(m?Number(m[1]):78));
      node.dataset.rp106BaseState=txt($('b',node))||'확보';
      node.dataset.rp106BaseMissing=node.classList.contains('missing')?'1':'0';
    }
    return{v:clamp(node.dataset.rp106BaseV),state:node.dataset.rp106BaseState||'확보',missing:node.dataset.rp106BaseMissing==='1'};
  }

  function updateMetric(node,on){
    const base=metricInfo(node);if(!base)return;
    const v=on?Math.max(base.v,base.missing?82:88):base.v;
    const state=on?(base.missing?'보완':'강화'):base.state;
    node.classList.toggle('missing',!on&&base.missing);
    const bar=$('.rp90DnaBar,.rp103DnaBar',node);if(bar)bar.setAttribute('style',`--v:${v}%`);
    const b=$('b',node);if(b)b.textContent=state;
  }

  function fallbackPreview(p){
    const panel=$('#rpPickIntelV01589');if(!panel||!p)return;
    const head=$('.rp89IntelHead span',panel);if(head)head.textContent=`${p.name} 반영 · LIVE PREVIEW`;
    const metrics=$$('.rp90DnaMetric,.rp103DnaMetric',panel);
    for(const node of metrics){
      const t=txt(node).toLowerCase();
      const key=t.includes('engage')?'engage':t.includes('poke')?'poke':t.includes('front')?'front':t.includes('sustain')?'sustain':t.includes('cc')?'cc':null;
      if(key)updateMetric(node,signal(p.text,key));
    }
    const dmg=$('.rp90DnaDamage,.rp103Damage',panel);
    if(dmg){
      const top=$('.rp90DnaTop b,.rp103DnaTop b',dmg);if(top)top.textContent=`AD ${p.ad}% / AP ${p.ap}%`;
      const split=$('.rp90DnaSplit,.rp103Split',dmg);if(split)split.setAttribute('style',`--ad:${p.ad}%;--ap:${p.ap}%`);
      const legend=$$('.rp90DnaLegend span,.rp103Legend span',dmg);if(legend[0])legend[0].textContent=`AD ${p.ad}%`;if(legend[1])legend[1].textContent=`AP ${p.ap}%`;
    }
    const top=$('.rp89Top1,.rp103Top1',panel);if(top){const s=$('span',top),b=$('b',top),sm=$('small',top);if(s)s.textContent=p.score;if(b)b.textContent=p.name;if(sm)sm.textContent=p.desc}
    $$('.rpQuickCardV01549').forEach(card=>{
      const label=txt($('span',card)),b=$('b',card);if(!b)return;
      if(label==='현재 결론'){b.textContent=p.name;const sm=$('small',card);if(sm)sm.textContent='선택 미리보기'}
      if(label==='실전 AD / AP'){b.textContent=`${p.ad} / ${p.ap}`;const sp=$('.rp90QuickSplit',card);if(sp)sp.setAttribute('style',`--ad:${p.ad}%;--ap:${p.ap}%`)}
      if(label==='TOP1 점수')b.textContent=p.score;
      if(label==='추천 방향')b.textContent=p.desc;
    });
  }

  function fallbackSelect(row){
    const p=profile(row),results=$('#comboResults');if(!p||!p.name||!results)return false;
    results.dataset.selectedCandidate=p.name;results.dataset.selectedCandidateScore=p.score;results.dataset.selectedCandidateDesc=p.desc;results.dataset.selectedCandidateAd=String(p.ad);results.dataset.selectedCandidateAp=String(p.ap);
    $$('.combo',results).forEach(x=>{const on=x===row;x.classList.toggle('rp106Selected',on);x.classList.toggle('isSelectedV01593',on);const h=$('.rp106SelectHint',x);if(h)h.textContent=on?'선택됨':'클릭 → DNA'});
    fallbackPreview(p);return true;
  }

  function decorateTop5(){
    const results=$('#comboResults');if(!results)return;
    const rows=$$('.combo',results).slice(0,5);rows.forEach(decorateRow);
    const selected=norm(results.dataset.selectedCandidate||'');
    if(selected){for(const row of rows){const p=profile(row),on=p?.name===selected;row.classList.toggle('rp106Selected',on);const h=$('.rp106SelectHint',row);if(h)h.textContent=on?'선택됨':'클릭 → DNA'}}
  }

  function patchModeActive(){
    const card=$('#dataCard'),nav=$('#dataHubTopNavV015103');
    const patchBtn=$('[data-v103-tab="patch"]',nav)||$$('button',nav).find(b=>txt(b).includes('패치노트'));
    const patchSurface=$('#dataPatchNotesV01599');
    const visible=patchSurface&&patchSurface.getClientRects?.().length>0;
    return !!(patchBtn?.classList.contains('active')||card?.classList.contains('dataHubPatchModeV01599')||visible);
  }

  function syncDataLayout(){
    const nav=$('#dataHubTopNavV015103'),card=$('#dataCard');if(!nav||!card)return;
    let host=nav.parentElement;if(!host)return;
    const active=patchModeActive();
    host.classList.toggle('rp106PatchWide',active);
    const direct=[...host.children].filter(x=>x!==nav);
    let detail=direct.find(x=>x===card||x.contains?.(card))||card.parentElement;
    let tier=direct.find(x=>x!==detail&&(x.classList?.contains('dataHubTierPaneV015103')||/역할별 티어 브라우저/.test(txt(x))))||null;
    if(!tier){const panel=$$('.panel',host).find(x=>/역할별 티어 브라우저/.test(txt(x)));tier=panel?direct.find(x=>x===panel||x.contains?.(panel)):null}
    if(detail)detail.classList.toggle('rp106DetailPane',active);
    if(tier)tier.classList.toggle('rp106TierPane',active);
  }

  function sync(){ensureStyle();decorateTop5();syncDataLayout()}

  document.addEventListener('click',e=>{
    const row=e.target?.closest?.('#comboResults .combo');
    if(row){
      const expected=profile(row)?.name||'',results=$('#comboResults');
      setTimeout(()=>{
        const selected=norm(results?.dataset?.selectedCandidate||'');
        if(!expected||selected!==expected)fallbackSelect(row);
        decorateTop5();
      },0);
    }
    if(e.target?.closest?.('#dataHubTopNavV015103 button')){setTimeout(syncDataLayout,0);setTimeout(syncDataLayout,80)}
    if(e.target?.closest?.('#random'))setTimeout(decorateTop5,40);
  },true);

  document.addEventListener('keydown',e=>{
    const row=e.target?.closest?.('#comboResults .combo');
    if(row&&(e.key==='Enter'||e.key===' ')){e.preventDefault();fallbackSelect(row)}
  },true);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#random')||e.target?.closest?.('#dataCard'))setTimeout(sync,50)},true);

  window.__ARAM_V015106_SYNC__=sync;
  try{ensureStyle();sync();window.__ARAM_RANDOM_DATA_HOTFIX_V015106__=true;document.documentElement?.setAttribute('data-aram-ui-patch','0.15.106')}catch(e){try{delete window.__ARAM_RANDOM_DATA_HOTFIX_V015106__}catch{};throw e}
})();
