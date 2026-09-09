'use strict';
(()=>{
  const V='0.15.48';
  if(window.__ARAM_RANDOM_PRACTICE_FOCUS_V01548__)return;

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
  const visible=el=>!!el&&el.nodeType===1&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';
  let activeTab='quick', timer=0, observer=null, lastRoot=null;

  const ROOT_SELECTORS=[
    '#randomPractice','#randomPracticePanel','#randomPracticeRoot','#randomPracticeView','#randomPracticeAnchor',
    '#practiceRandom','#practiceRandomPanel','#randomModePanel','#randomPracticeTabContent',
    '[data-view="random-practice"]','[data-mode="random-practice"]','[data-mode="random"]',
    '[id*="randomPractice" i]','[class*="randomPractice" i]','[id*="practice" i][id*="random" i]'
  ];
  const sectionSelectors='section,.panel,.card,.box,.subPanel,.analysisPanel,.resultPanel,[class*="section" i],[class*="panel" i],[class*="card" i]';
  const titleSelectors=':scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > .title,:scope > .sectionTitle,:scope > .cardTitle,:scope > header h1,:scope > header h2,:scope > header h3,:scope > header h4,:scope > header .title';

  function text(el){return norm(el?.textContent)}
  function ownHeading(el){
    if(!el)return'';
    const h=el.querySelector(titleSelectors);
    if(h)return text(h);
    const first=[...el.children].find(x=>/^H[1-4]$/.test(x.tagName)||/title|heading/i.test(x.className||''));
    return text(first);
  }
  function scoreRoot(el){
    if(!el||!visible(el))return-1;
    const t=text(el),inputs=el.querySelectorAll('input,select,button').length;
    let s=0;
    if(/랜덤\s*연습/.test(t))s+=5;
    if(/추천/.test(t))s+=2;
    if(/벤치|남은\s*챔피언|선택\s*가능|보유\s*챔피언|팀원/.test(t))s+=2;
    if(inputs>=4)s+=2;
    if(t.length>200)s+=1;
    if(/실시간\s*모의밴픽|드래프트\s*작업대/.test(t))s-=5;
    return s;
  }
  function targetFromTab(){
    const tabs=[...document.querySelectorAll('button,a,[role="tab"]')].filter(x=>/랜덤\s*연습/.test(text(x)));
    for(const tab of tabs){
      for(const a of ['aria-controls','data-target','data-bs-target','href']){
        let v=tab.getAttribute(a);if(!v)continue;
        v=v.replace(/^#/,'');
        const el=document.getElementById(v);if(el&&scoreRoot(el)>=3)return el;
      }
    }
    return null;
  }
  function findRoot(){
    const direct=[];
    for(const sel of ROOT_SELECTORS){try{document.querySelectorAll(sel).forEach(x=>direct.push(x))}catch{}}
    const tabTarget=targetFromTab();if(tabTarget)direct.push(tabTarget);
    let best=null,bestScore=-99;
    for(const el of [...new Set(direct)]){
      const s=scoreRoot(el);if(s>bestScore){best=el;bestScore=s}
    }
    if(best&&bestScore>=3)return best;

    const labeled=[...document.querySelectorAll('h1,h2,h3,h4,.title,.tabTitle,.sectionTitle')].filter(x=>/랜덤\s*연습/.test(text(x)));
    for(const label of labeled){
      let p=label;
      for(let i=0;i<6&&p;i++,p=p.parentElement){
        const s=scoreRoot(p);if(s>=5&&p.querySelectorAll('input,button').length>=3)return p;
      }
    }

    const big=[...document.querySelectorAll('main,section,[role="tabpanel"],.tabPane,.tab-pane,.page,.screen,.panel')];
    for(const el of big){
      const t=text(el);if(!visible(el)||t.length<150)continue;
      if(/추천/.test(t)&&/벤치|팀원|남은\s*챔피언|선택\s*가능|보유\s*챔피언/.test(t)&&!/드래프트\s*작업대/.test(t)){
        const s=scoreRoot(el);if(s>bestScore){best=el;bestScore=s}
      }
    }
    return bestScore>=4?best:null;
  }

  function allSections(root){
    const rows=[...root.querySelectorAll(sectionSelectors)].filter(x=>x!==root&&visible(x));
    return rows.filter(x=>{
      const h=ownHeading(x);return h&&h.length<80;
    });
  }
  function chooseSection(root,re){
    const hits=allSections(root).filter(x=>re.test(ownHeading(x)));
    hits.sort((a,b)=>a.querySelectorAll(sectionSelectors).length-b.querySelectorAll(sectionSelectors).length||text(a).length-text(b).length);
    return hits[0]||null;
  }
  function nonOverlapping(list){
    const out=[];
    for(const el of list.filter(Boolean))if(!out.some(x=>x===el||x.contains(el)||el.contains(x)))out.push(el);
    return out;
  }
  function classify(root){
    const input=chooseSection(root,/(현재.*(픽|선택)|우리.*(픽|선택)|팀원.*(픽|선택|챔피언)|내.*챔피언|보유.*챔피언)/);
    const pool=chooseSection(root,/(벤치|남은.*챔피언|선택.*가능.*챔피언|후보.*챔피언|챔피언.*(풀|목록))/);
    const rec=chooseSection(root,/(추천.*(TOP|챔피언|픽)|베스트.*(픽|챔피언)|우선.*추천)/i);
    const completion=allSections(root).filter(x=>/(완성.*조합|다인큐|[2-5]인큐|조합.*추천)/.test(ownHeading(x)));
    const analysis=allSections(root).filter(x=>/(조합.*분석|역할.*밸런스|조합.*점수|파워|시너지|결손|부족)/.test(ownHeading(x)));
    const detail=allSections(root).filter(x=>/(상세|계산|근거|점수.*상세|추천.*이유|세부)/.test(ownHeading(x)));
    return{input,pool,rec,completion:nonOverlapping(completion),analysis:nonOverlapping(analysis),detail:nonOverlapping(detail)};
  }

  function findRows(rec){
    if(!rec)return[];
    const preferred=[...rec.querySelectorAll('.recommendRow,.recRow,.recommend-card,.recommendCard,.recommendItem,.candidateRow,.candidateCard,.resultRow,tbody > tr')].filter(visible);
    if(preferred.length>=3)return preferred;
    const parents=[rec,...rec.querySelectorAll(':scope > div,:scope > section,div > div')];
    let best=[];
    for(const p of parents){
      const kids=[...p.children].filter(x=>visible(x)&&text(x).length>=10);
      if(kids.length>=3&&kids.length<=12){
        const rowish=kids.filter(x=>/\b[1-9]\b|S\+|A\+|B\+|점|추천|티어/.test(text(x)));
        if(rowish.length>=Math.min(3,kids.length)&&kids.length>best.length)best=kids;
      }
    }
    return best;
  }
  function addMoreButton(rec,rows){
    let b=rec.querySelector(':scope > .rpMoreRecV01548');
    if(rows.length<=5){b?.remove();rows.forEach(x=>x.classList.remove('rpHiddenRecV01548'));return}
    if(!b){b=document.createElement('button');b.type='button';b.className='rpMoreRecV01548';b.addEventListener('click',()=>{
      const expanded=rec.classList.toggle('rpRecExpandedV01548');
      b.textContent=expanded?'추천 접기':`추천 더 보기 +${Math.max(0,rows.length-5)}`;
      compactRecommendations(rec);
    });rec.appendChild(b)}
    const expanded=rec.classList.contains('rpRecExpandedV01548');
    rows.forEach((x,i)=>x.classList.toggle('rpHiddenRecV01548',!expanded&&i>=5));
    b.textContent=expanded?'추천 접기':`추천 더 보기 +${Math.max(0,rows.length-5)}`;
  }
  function compactRecommendations(rec){
    if(!rec)return;
    rec.classList.add('rpRecommendationsV01548');
    const rows=findRows(rec);rows.forEach(x=>x.classList.add('rpRecommendationRowV01548'));
    addMoreButton(rec,rows);
    rec.querySelectorAll('[class*="reason" i],[class*="desc" i],[class*="explain" i],p,.sub').forEach(x=>{
      if(text(x).length>55)x.classList.add('rpReasonClampV01548');
    });
  }
  function extractFocus(rec){
    if(!rec)return{champ:'',reason:'현재 조합의 가장 큰 결손을 채우는 후보를 우선하세요.'};
    const row=findRows(rec)[0];if(!row)return{champ:'',reason:'현재 조합의 가장 큰 결손을 채우는 후보를 우선하세요.'};
    const champEl=row.querySelector('[class*="champ" i],[class*="name" i],strong,b');
    let champ=norm(champEl?.textContent||'').replace(/^\d+[.)]?\s*/,'').slice(0,18);
    const reasonEl=row.querySelector('[class*="reason" i],[class*="desc" i],[class*="explain" i],p,.sub');
    let reason=norm(reasonEl?.textContent||'');
    if(!reason){
      reason=text(row).replace(champ,'').replace(/^\s*\d+[.)]?\s*/,'');
    }
    reason=reason.replace(/점수\s*\d+(?:\.\d+)?/g,'').replace(/\s+/g,' ').trim();
    if(reason.length>115)reason=reason.slice(0,112)+'…';
    if(!reason)reason='1순위 후보가 현재 조합의 핵심 결손을 가장 안정적으로 보완합니다.';
    return{champ,reason};
  }
  function ensureFocus(root,rec){
    let card=root.querySelector(':scope > .rpFocusCardV01548')||root.querySelector('.rpFocusCardV01548');
    const f=extractFocus(rec);
    if(!card){
      card=document.createElement('div');card.className='rpFocusCardV01548';
      if(rec?.parentElement)rec.parentElement.insertBefore(card,rec);else root.insertBefore(card,root.firstChild);
    }
    card.innerHTML=`<span>💡 이번 선택의 핵심</span><b>${esc(f.champ?`${f.champ} · ${f.reason}`:f.reason)}</b>`;
  }

  function ensurePoolToggle(pool){
    if(!pool)return;
    pool.classList.add('rpPoolV01548');
    const heading=pool.querySelector(titleSelectors);
    let keep=heading?[...pool.children].find(x=>x.contains(heading)):pool.firstElementChild;
    if(keep)keep.classList.add('rpPoolKeepV01548');
    let b=pool.querySelector('.rpPoolToggleV01548');
    if(!b){
      b=document.createElement('button');b.type='button';b.className='rpPoolToggleV01548';
      b.addEventListener('click',()=>{pool.classList.toggle('rpPoolCollapsedV01548');syncPoolButton(pool)});
      (keep||pool).appendChild(b);
      if(!pool.dataset.rpTouchedV01548)pool.classList.add('rpPoolCollapsedV01548');
      pool.dataset.rpTouchedV01548='1';
    }
    syncPoolButton(pool);
  }
  function syncPoolButton(pool){
    const b=pool.querySelector('.rpPoolToggleV01548');if(!b)return;
    const c=pool.querySelectorAll('[class*="champ" i],button,input').length;
    const collapsed=pool.classList.contains('rpPoolCollapsedV01548');
    b.textContent=`후보 챔피언${c?` · ${c}개`:''} · ${collapsed?'펼치기':'숨기기'}`;
    b.setAttribute('aria-expanded',String(!collapsed));
  }

  function ensureTopGrid(root,parts){
    const a=parts.input,b=parts.pool;if(!a||!b||a===b||a.contains(b)||b.contains(a))return;
    if(a.parentElement!==b.parentElement)return;
    let grid=a.parentElement.querySelector(':scope > .rpTopGridV01548');
    if(!grid){
      grid=document.createElement('div');grid.className='rpTopGridV01548';
      a.parentElement.insertBefore(grid,a);grid.append(a,b);
    }else{if(a.parentElement!==grid)grid.appendChild(a);if(b.parentElement!==grid)grid.appendChild(b)}
  }

  function summaryHtml(parts){
    const f=extractFocus(parts.rec);
    const inputText=parts.input?ownHeading(parts.input):'현재 선택';
    const poolText=parts.pool?ownHeading(parts.pool):'후보 챔피언';
    return `<div class="rpQuickGridV01548"><div><small>현재 입력</small><b>${esc(inputText||'현재 선택')}</b></div><div><small>후보 풀</small><b>${esc(poolText||'후보 챔피언')}</b></div><div class="wide"><small>추천 방향</small><b>${esc(f.champ?`${f.champ} 우선 · ${f.reason}`:f.reason)}</b></div></div>`;
  }
  function setTabSections(parts,tab){
    const groups={complete:parts.completion,analysis:parts.analysis,detail:parts.detail};
    for(const [key,els] of Object.entries(groups))for(const el of els)el.hidden=key!==tab;
  }
  function ensureTabs(root,parts){
    const grouped=[...parts.completion,...parts.analysis,...parts.detail];
    if(!grouped.length)return;
    const first=grouped.sort((a,b)=>{
      if(a===b)return 0;const pos=a.compareDocumentPosition(b);return pos&Node.DOCUMENT_POSITION_FOLLOWING?-1:1;
    })[0];
    let shell=root.querySelector('.rpInfoShellV01548');
    if(!shell){
      shell=document.createElement('div');shell.className='rpInfoShellV01548';
      const tabs=document.createElement('div');tabs.className='rpTabsV01548';
      tabs.innerHTML='<button data-rp-tab="quick">빠른 판단</button><button data-rp-tab="complete">완성 조합</button><button data-rp-tab="analysis">조합 분석</button><button data-rp-tab="detail">상세</button>';
      const quick=document.createElement('div');quick.className='rpQuickPanelV01548';
      shell.append(tabs,quick);first.parentElement.insertBefore(shell,first);
      tabs.addEventListener('click',e=>{const b=e.target.closest('button[data-rp-tab]');if(!b||b.disabled)return;activeTab=b.dataset.rpTab;applyTabs(root,parts)});
    }
    const quick=shell.querySelector('.rpQuickPanelV01548');if(quick)quick.innerHTML=summaryHtml(parts);
    applyTabs(root,parts);
  }
  function applyTabs(root,parts){
    const shell=root.querySelector('.rpInfoShellV01548');if(!shell)return;
    const has={quick:true,complete:parts.completion.length>0,analysis:parts.analysis.length>0,detail:parts.detail.length>0};
    if(!has[activeTab])activeTab='quick';
    shell.querySelectorAll('.rpTabsV01548 button').forEach(b=>{
      b.disabled=!has[b.dataset.rpTab];b.classList.toggle('active',b.dataset.rpTab===activeTab);
    });
    const quick=shell.querySelector('.rpQuickPanelV01548');if(quick)quick.hidden=activeTab!=='quick';
    setTabSections(parts,activeTab);
  }

  function ensureStyle(){
    if(document.getElementById('randomPracticeFocusStyleV01548'))return;
    const s=document.createElement('style');s.id='randomPracticeFocusStyleV01548';s.textContent=`
      .rpFocusRootV01548{--rp-border:#284a6c;--rp-bg:#0b1b2e;--rp-soft:#102840}
      .rpFocusCardV01548{display:flex;align-items:center;gap:12px;margin:10px 0 12px;padding:10px 13px;border:1px solid #246d91;border-radius:10px;background:linear-gradient(90deg,rgba(10,74,103,.28),rgba(10,26,43,.35));min-height:38px}
      .rpFocusCardV01548 span{flex:0 0 auto;color:#67c9f4;font-size:12px;font-weight:800}.rpFocusCardV01548 b{min-width:0;color:#e8f5ff;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .rpRecommendationsV01548{position:relative}.rpRecommendationRowV01548{min-height:0!important}.rpRecommendationRowV01548.rpHiddenRecV01548{display:none!important}
      .rpReasonClampV01548{display:-webkit-box!important;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden!important;max-height:3.05em!important}
      .rpTopGridV01548{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:start;margin-bottom:10px}
      .rpTopGridV01548>*{min-width:0;margin-top:0!important}
      .rpMoreRecV01548,.rpPoolToggleV01548{appearance:none;border:1px solid #315b7d;background:#10243a;color:#b9d9ee;border-radius:8px;padding:7px 10px;font-size:11px;font-weight:800;cursor:pointer}
      .rpMoreRecV01548{margin:8px auto 2px;display:block}.rpPoolToggleV01548{margin:6px 0 0 auto;display:block}
      .rpPoolCollapsedV01548>:not(.rpPoolKeepV01548){display:none!important}
      .rpPoolCollapsedV01548{padding-bottom:8px!important;min-height:0!important}
      .rpInfoShellV01548{margin:12px 0;border:1px solid #274b6e;border-radius:12px;background:rgba(7,21,36,.55);overflow:hidden}
      .rpTabsV01548{display:flex;gap:5px;padding:8px 10px;border-bottom:1px solid #24425e;background:#0a192a;position:relative;z-index:1}
      .rpTabsV01548 button{border:1px solid #31526e;background:#0e2237;color:#92abc0;border-radius:8px;padding:7px 12px;font-size:11px;font-weight:850;cursor:pointer}.rpTabsV01548 button.active{color:#fff;border-color:#43a9dd;background:#133a56;box-shadow:inset 0 -2px 0 #53c6ff}.rpTabsV01548 button:disabled{opacity:.35;cursor:default}
      .rpQuickPanelV01548{padding:10px}.rpQuickGridV01548{display:grid;grid-template-columns:1fr 1fr;gap:8px}.rpQuickGridV01548>div{border:1px solid #234966;border-radius:9px;background:#0c2033;padding:9px 11px;min-width:0}.rpQuickGridV01548>div.wide{grid-column:1/-1}.rpQuickGridV01548 small{display:block;color:#6f99b7;font-size:10px;margin-bottom:4px}.rpQuickGridV01548 b{display:block;color:#e7f2fa;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      @media(max-width:1180px){.rpTopGridV01548{grid-template-columns:1fr}.rpFocusCardV01548 b{white-space:normal}.rpQuickGridV01548{grid-template-columns:1fr}.rpQuickGridV01548>div.wide{grid-column:auto}.rpQuickGridV01548 b{white-space:normal}}
    `;document.head.appendChild(s);
  }

  function apply(){
    const root=findRoot();if(!root)return false;
    lastRoot=root;root.classList.add('rpFocusRootV01548');ensureStyle();
    const parts=classify(root);
    if(parts.input)parts.input.classList.add('rpInputV01548');
    if(parts.pool)ensurePoolToggle(parts.pool);
    ensureTopGrid(root,parts);
    if(parts.rec){compactRecommendations(parts.rec);ensureFocus(root,parts.rec)}
    ensureTabs(root,parts);
    if(typeof DATA!=='undefined'){
      DATA.version=V;
      DATA.random_practice_focus_v01548={version:'v0.15.48 · Random Practice Focus UI',top_recommendations:5,pool_collapsible:true,tabs:['빠른 판단','완성 조합','조합 분석','상세'],score_logic_changed:false,adaptive_dom:true};
    }
    return true;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(()=>{try{apply()}catch(e){console.warn('[v0.15.48] random practice focus apply failed',e)}},50)}

  document.addEventListener('click',e=>{
    if(e.target.closest('button,a,[role="tab"],input,select'))setTimeout(schedule,40);
  },true);
  observer=new MutationObserver(muts=>{
    if(muts.some(m=>m.addedNodes.length||m.removedNodes.length))schedule();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  ensureStyle();schedule();setTimeout(schedule,160);setTimeout(schedule,600);
  window.aramApplyRandomPracticeFocusV01548=apply;
  window.aramFindRandomPracticeRootV01548=findRoot;
  window.__ARAM_RANDOM_PRACTICE_FOCUS_V01548__=true;
})();
