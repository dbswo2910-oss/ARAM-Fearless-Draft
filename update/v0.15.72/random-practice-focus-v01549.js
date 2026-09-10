'use strict';
(()=>{
  const V='0.15.49';
  if(window.__ARAM_RANDOM_PRACTICE_FOCUS_V01549__)return;
  let activeTab='quick';
  let refreshTimer=0;

  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();

  function removeLegacyV48(){
    document.querySelectorAll('.rpFocusCardV01548,.rpInfoShellV01548,.rpMoreRecV01548,.rpPoolToggleV01548').forEach(x=>x.remove());
    document.querySelectorAll('.rpTopGridV01548').forEach(grid=>{
      const p=grid.parentElement;if(!p)return;
      [...grid.children].forEach(ch=>p.insertBefore(ch,grid));grid.remove();
    });
    const root=$('#random');
    if(!root)return;
    root.querySelectorAll('[class]').forEach(el=>{
      [...el.classList].filter(c=>/V01548$/.test(c)||/^rp.*V01548/.test(c)).forEach(c=>el.classList.remove(c));
    });
    ['#randomRecommendAnchor > .panel','#random > .randomPickOnly.panel','#random > .randomPickOnly.grid2'].forEach(sel=>{
      root.querySelectorAll(sel).forEach(x=>x.hidden=false);
    });
  }

  function refs(){
    const root=$('#random');
    if(!root)return null;
    const input=$('#randomInputAnchor');
    const poolInputs=$('#poolInputs');
    const poolPanel=poolInputs?.closest('.panel');
    const recommend=$('#randomRecommendAnchor');
    const results=$('#comboResults');
    const resultPanel=results?.closest('.panel');
    const detail=$('#comboDetail');
    const detailPanel=detail?.closest('.panel');
    const ourFive=$('#randomOurFive');
    const buildPanel=ourFive?.closest('.panel');
    const ourSummary=$('#randomOurSummary');
    const enemySummary=$('#randomEnemySummary');
    const summaryGrid=ourSummary?.closest('.grid2');
    const roles=$('#randomRoles');
    const rolesPanel=roles?.closest('.panel');
    return{root,input,poolInputs,poolPanel,recommend,results,resultPanel,detail,detailPanel,buildPanel,summaryGrid,rolesPanel};
  }

  function ensureStyles(){
    if($('#rpFocusStyleV01549'))return;
    const st=document.createElement('style');st.id='rpFocusStyleV01549';st.textContent=`
      #random.rpFocusV01549{width:100%;min-width:0}
      #random.rpFocusV01549>.randomModeNav{margin-bottom:10px}
      #random.rpFocusV01549>.randomHero{padding:12px 150px 11px 14px}
      #random.rpFocusV01549>.randomHero>.title{margin-bottom:6px}
      #random.rpFocusV01549>.randomHero>.sub{margin:0 0 8px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:1;overflow:hidden}
      #random.rpFocusV01549>.randomHero>.toolbar{margin-top:2px}
      #random.rpFocusV01549>.mobilePhaseNav.randomPickOnly{display:none!important}

      #random.rpFocusV01549 #lolAutoSyncPanel.rpSyncCompactV01549{padding:10px 12px}
      #random.rpFocusV01549 #lolAutoSyncPanel.rpSyncCompactV01549 .lolSyncHead{margin:0}
      #random.rpFocusV01549 #lolAutoSyncPanel.rpSyncCompactV01549 .lolSyncTitleLine .title{margin:0}
      #random.rpFocusV01549 #lolAutoSyncPanel.rpSyncCompactV01549.rpCollapsedV01549 .lolSyncHead .sub,
      #random.rpFocusV01549 #lolAutoSyncPanel.rpSyncCompactV01549.rpCollapsedV01549 .lolSyncGrid,
      #random.rpFocusV01549 #lolAutoSyncPanel.rpSyncCompactV01549.rpCollapsedV01549 .lolAccountPrivacy,
      #random.rpFocusV01549 #lolAutoSyncPanel.rpSyncCompactV01549.rpCollapsedV01549 .lolSyncNote{display:none!important}
      #random.rpFocusV01549 .rpSyncDetailsBtnV01549{background:#152b43;border:1px solid #34516f;color:#cfe4fa;border-radius:7px;padding:7px 9px;font-weight:800;cursor:pointer}

      #random.rpFocusV01549 .rpStageHeadV01549{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:15px 2px 7px}
      #random.rpFocusV01549 .rpStageHeadV01549 b{font-size:15px;color:#eef7ff}
      #random.rpFocusV01549 .rpStageHeadV01549 span{font-size:10px;color:#7890ad}
      #random.rpFocusV01549 #randomInputAnchor{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:12px;align-items:start}
      #random.rpFocusV01549 #randomInputAnchor>.panel{min-width:0;margin:0}
      #random.rpFocusV01549 #randomInputAnchor>.panel>.title{margin-bottom:9px}
      #random.rpFocusV01549 .rpPanelHeadV01549{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
      #random.rpFocusV01549 .rpPanelHeadV01549>.title{margin:0;min-width:0}
      #random.rpFocusV01549 .rpPoolToggleV01549{flex:0 0 auto;background:#152b43;border:1px solid #34516f;color:#cfe4fa;border-radius:7px;padding:6px 8px;font-size:10px;font-weight:850;cursor:pointer}
      #random.rpFocusV01549 .rpPoolCollapsedV01549 #poolInputs,
      #random.rpFocusV01549 .rpPoolCollapsedV01549>.toolbar.mt{display:none!important}
      #random.rpFocusV01549 #poolInputs.poolGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}

      #random.rpFocusV01549 .rpFocusCardV01549{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;border:1px solid #315e83;border-left:3px solid #58b8ff;border-radius:11px;background:linear-gradient(90deg,#0d2439,#0b1a2b);padding:10px 12px;margin:12px 0 8px;min-width:0}
      #random.rpFocusV01549 .rpFocusCardV01549>span{font-size:10px;font-weight:900;color:#7fcfff;white-space:nowrap}
      #random.rpFocusV01549 .rpFocusCardV01549>b{font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#eef8ff}
      #random.rpFocusV01549 .rpFocusCardV01549>em{font-style:normal;font-size:11px;color:#65dcad;font-weight:900;white-space:nowrap}
      #random.rpFocusV01549 #randomRecommendAnchor{display:block!important;margin-top:0}
      #random.rpFocusV01549 #randomRecommendAnchor>.panel{width:100%;min-width:0;margin:0}
      #random.rpFocusV01549 #comboResults .combo{padding:8px 9px;margin:6px 0}
      #random.rpFocusV01549 #comboResults .combo .desc{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;line-height:1.4}
      #random.rpFocusV01549 #comboResults .combo .comboIconLine{margin-top:3px}

      #random.rpFocusV01549 .rpInfoShellV01549{margin-top:12px;border:1px solid #34506e;border-top:2px solid #c69b42;border-radius:13px;background:linear-gradient(180deg,#0d1c2f,#0a1727);overflow:hidden;min-width:0}
      #random.rpFocusV01549 .rpInfoHeadV01549{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-bottom:1px solid #243d58}
      #random.rpFocusV01549 .rpInfoHeadV01549>b{font-size:15px;white-space:nowrap}
      #random.rpFocusV01549 .rpTabsV01549{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}
      #random.rpFocusV01549 .rpTabsV01549 button{border:1px solid #35516f;background:#10243a;color:#9fb4cd;border-radius:7px;padding:6px 9px;font-size:10px;font-weight:850;cursor:pointer}
      #random.rpFocusV01549 .rpTabsV01549 button.active{background:#164d78;border-color:#3f9bdd;color:#fff;box-shadow:inset 0 -2px 0 #6fc5ff}
      #random.rpFocusV01549 .rpTabPanelV01549{padding:11px;min-width:0}
      #random.rpFocusV01549 .rpTabPanelV01549[hidden]{display:none!important}
      #random.rpFocusV01549 .rpTabPanelV01549>.panel,
      #random.rpFocusV01549 .rpTabPanelV01549>.grid2{margin-top:0!important}
      #random.rpFocusV01549 .rpTabPanelV01549>.panel{box-shadow:none}
      #random.rpFocusV01549 .rpQuickGridV01549{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      #random.rpFocusV01549 .rpQuickCardV01549{border:1px solid #29445f;border-radius:9px;background:#091725;padding:9px;min-width:0}
      #random.rpFocusV01549 .rpQuickCardV01549 span{display:block;font-size:9px;color:#7f96b2;margin-bottom:3px}
      #random.rpFocusV01549 .rpQuickCardV01549 b{display:block;font-size:12px;line-height:1.35;white-space:normal;overflow-wrap:anywhere}
      #random.rpFocusV01549 .rpQuickCardV01549.accent{border-color:#2d6b58;background:#0c241d}
      #random.rpFocusV01549 .rpQuickCardV01549.warn{border-color:#705b2d;background:#251f0d}
      #random.rpFocusV01549 .rpQuickCardV01549.wide{grid-column:1/-1}
      #random.rpFocusV01549 .rpTabPanelV01549 .liveSummaryPanel{min-width:0}

      @media(max-width:1100px){
        #random.rpFocusV01549>.randomHero{padding-right:14px;padding-top:48px}
        #random.rpFocusV01549 #randomInputAnchor{grid-template-columns:1fr}
        #random.rpFocusV01549 #poolInputs.poolGrid{grid-template-columns:1fr 1fr}
        #random.rpFocusV01549 .rpQuickGridV01549{grid-template-columns:1fr 1fr}
        #random.rpFocusV01549 .rpQuickCardV01549.wide{grid-column:1/-1}
        #random.rpFocusV01549 .rpFocusCardV01549{grid-template-columns:1fr}
        #random.rpFocusV01549 .rpFocusCardV01549>b{white-space:normal}
      }
      @media(max-width:680px){
        #random.rpFocusV01549 #poolInputs.poolGrid{grid-template-columns:1fr}
        #random.rpFocusV01549 .rpInfoHeadV01549{align-items:flex-start;flex-direction:column}
        #random.rpFocusV01549 .rpTabsV01549{justify-content:flex-start;width:100%;overflow-x:auto;flex-wrap:nowrap}
        #random.rpFocusV01549 .rpTabsV01549 button{flex:0 0 auto}
        #random.rpFocusV01549 .rpQuickGridV01549{grid-template-columns:1fr}
        #random.rpFocusV01549 .rpQuickCardV01549.wide{grid-column:auto}
      }
    `;document.head.appendChild(st);
  }

  function stageHead(id,title,sub,before){
    let el=$('#'+id);if(el)return el;
    el=document.createElement('div');el.id=id;el.className='rpStageHeadV01549';
    el.innerHTML=`<b>${esc(title)}</b><span>${esc(sub)}</span>`;
    before?.parentElement?.insertBefore(el,before);return el;
  }

  function setupSyncCompact(){
    const panel=$('#lolAutoSyncPanel');if(!panel)return;
    panel.classList.add('rpSyncCompactV01549');
    let b=panel.querySelector('.rpSyncDetailsBtnV01549');
    if(!b){
      b=document.createElement('button');b.type='button';b.className='rpSyncDetailsBtnV01549';
      const toolbar=panel.querySelector('.lolSyncToolbar');(toolbar||panel).appendChild(b);
      b.addEventListener('click',()=>{
        panel.classList.toggle('rpCollapsedV01549');
        try{localStorage.setItem('aram-random-sync-detail',panel.classList.contains('rpCollapsedV01549')?'0':'1')}catch{}
        syncSyncButton(panel);
      });
      let expanded=false;try{expanded=localStorage.getItem('aram-random-sync-detail')==='1'}catch{}
      panel.classList.toggle('rpCollapsedV01549',!expanded);
    }
    syncSyncButton(panel);
  }
  function syncSyncButton(panel){
    const b=panel.querySelector('.rpSyncDetailsBtnV01549');if(b)b.textContent=panel.classList.contains('rpCollapsedV01549')?'연동 상세':'상세 접기';
  }

  function setupPoolToggle(r){
    const p=r.poolPanel;if(!p)return;
    let title=p.querySelector(':scope > .title');
    let head=p.querySelector(':scope > .rpPanelHeadV01549');
    if(!head){
      head=document.createElement('div');head.className='rpPanelHeadV01549';
      p.insertBefore(head,p.firstChild);
      if(title)head.appendChild(title);
      const b=document.createElement('button');b.type='button';b.className='rpPoolToggleV01549';head.appendChild(b);
      b.addEventListener('click',()=>{
        p.classList.toggle('rpPoolCollapsedV01549');
        try{localStorage.setItem('aram-random-pool-collapsed',p.classList.contains('rpPoolCollapsedV01549')?'1':'0')}catch{}
        syncPoolButton(p);
      });
      let collapsed=false;try{collapsed=localStorage.getItem('aram-random-pool-collapsed')==='1'}catch{}
      p.classList.toggle('rpPoolCollapsedV01549',collapsed);
    }
    syncPoolButton(p);
  }
  function syncPoolButton(panel){
    const b=panel.querySelector('.rpPoolToggleV01549');if(!b)return;
    const filled=[...document.querySelectorAll('#poolInputs .randomPoolItem .searchInput')].filter(x=>String(x.value||'').trim()).length;
    b.textContent=`후보 ${filled}/15 · ${panel.classList.contains('rpPoolCollapsedV01549')?'펼치기':'접기'}`;
  }

  function topCombo(){
    const row=$('#comboResults .combo');
    if(!row)return{name:'',score:'',reason:'후보를 입력하면 완성 조합 TOP5에서 핵심 선택을 요약합니다.'};
    let name=txt(row.querySelector('.names'));
    name=name.replace(/🔒\s*고정.*$/,'').replace(/\s+/g,' ').trim();
    const score=txt(row.querySelector('.comboScore'));
    let reason=txt(row.querySelector('.desc')).replace(/^\S+\s*/,'').trim();
    if(reason.length>120)reason=reason.slice(0,117)+'…';
    return{name,score,reason:reason||'현재 입력 기준 가장 높은 완성 조합입니다.'};
  }
  function updateFocus(){
    const card=$('#rpFocusCardV01549');if(!card)return;
    const x=topCombo();
    card.innerHTML=`<span>💡 이번 선택의 핵심</span><b>${esc(x.name?`${x.name} · ${x.reason}`:x.reason)}</b><em>${esc(x.score||'계산 대기')}</em>`;
  }

  function quickHtml(){
    const q=$('#queueSize')?.value||'-';
    const hint=txt($('#queueHint'))||'큐 인원 입력 대기';
    const checks=[...document.querySelectorAll('#externalCheck .checkCard')];
    const missing=txt(checks[0]?.querySelector('b'))||'외부 확정픽 입력 대기';
    const damage=txt(checks[1]?.querySelector('b'))||'-';
    const calc=txt(checks[2]?.querySelector('b'))||'후보 계산 대기';
    const x=topCombo();
    return `<div class="rpQuickGridV01549">
      <div class="rpQuickCardV01549"><span>현재 큐</span><b>${esc(q+'인큐 · '+hint)}</b></div>
      <div class="rpQuickCardV01549 ${missing==='큰 구멍 없음'?'accent':'warn'}"><span>현재 결손</span><b>${esc(missing)}</b></div>
      <div class="rpQuickCardV01549"><span>실질 AD / AP</span><b>${esc(damage)}</b></div>
      <div class="rpQuickCardV01549"><span>후보 계산</span><b>${esc(calc)}</b></div>
      <div class="rpQuickCardV01549 accent"><span>현재 TOP1</span><b>${esc(x.name||'계산 대기')}</b></div>
      <div class="rpQuickCardV01549"><span>TOP1 점수</span><b>${esc(x.score||'-')}</b></div>
      <div class="rpQuickCardV01549 wide"><span>추천 방향</span><b>${esc(x.reason)}</b></div>
    </div>`;
  }

  function ensureInfoShell(r){
    let shell=$('#rpInfoShellV01549');
    if(!shell){
      shell=document.createElement('div');shell.id='rpInfoShellV01549';shell.className='rpInfoShellV01549 randomPickOnly';
      shell.innerHTML=`<div class="rpInfoHeadV01549"><b>선택 판단</b><div class="rpTabsV01549">
        <button data-rp49="quick">빠른 판단</button><button data-rp49="complete">완성 조합</button><button data-rp49="analysis">조합 분석</button><button data-rp49="detail">상세</button>
      </div></div>
      <div class="rpTabPanelV01549" data-rp49-panel="quick"></div>
      <div class="rpTabPanelV01549" data-rp49-panel="complete" hidden></div>
      <div class="rpTabPanelV01549" data-rp49-panel="analysis" hidden></div>
      <div class="rpTabPanelV01549" data-rp49-panel="detail" hidden></div>`;
      r.recommend?.parentElement?.insertBefore(shell,r.recommend.nextSibling);
      shell.querySelector('.rpTabsV01549').addEventListener('click',e=>{
        const b=e.target.closest('button[data-rp49]');if(!b)return;activeTab=b.dataset.rp49;applyTab();
      });
    }
    const complete=shell.querySelector('[data-rp49-panel="complete"]');
    const analysis=shell.querySelector('[data-rp49-panel="analysis"]');
    const detail=shell.querySelector('[data-rp49-panel="detail"]');
    if(r.detailPanel&&r.detailPanel.parentElement!==complete)complete.appendChild(r.detailPanel);
    if(r.summaryGrid&&r.summaryGrid.parentElement!==analysis)analysis.appendChild(r.summaryGrid);
    if(r.buildPanel&&r.buildPanel.parentElement!==detail)detail.appendChild(r.buildPanel);
    if(r.rolesPanel&&r.rolesPanel.parentElement!==detail)detail.appendChild(r.rolesPanel);
    applyTab();
  }
  function applyTab(){
    const shell=$('#rpInfoShellV01549');if(!shell)return;
    shell.querySelectorAll('button[data-rp49]').forEach(b=>b.classList.toggle('active',b.dataset.rp49===activeTab));
    shell.querySelectorAll('[data-rp49-panel]').forEach(p=>p.hidden=p.dataset.rp49Panel!==activeTab);
    const quick=shell.querySelector('[data-rp49-panel="quick"]');if(quick)quick.innerHTML=quickHtml();
  }

  function ensureFocusCard(r){
    let card=$('#rpFocusCardV01549');
    if(!card){card=document.createElement('div');card.id='rpFocusCardV01549';card.className='rpFocusCardV01549 randomPickOnly';r.recommend?.parentElement?.insertBefore(card,r.recommend)}
    updateFocus();
  }

  function prepareRecommendation(r){
    if(!r.recommend||!r.resultPanel)return;
    r.recommend.style.gridTemplateColumns='1fr';
    r.resultPanel.style.minWidth='0';
  }

  function refresh(){
    const r=refs();if(!r)return;
    r.root.classList.add('rpFocusV01549');
    setupSyncCompact();setupPoolToggle(r);prepareRecommendation(r);
    stageHead('rpInputHeadV01549','① 현재 팀 + 후보 풀','입력은 위에서, 판단은 아래에서',r.input);
    ensureFocusCard(r);
    ensureInfoShell(r);
    updateFocus();applyTab();syncPoolButton(r.poolPanel);
  }
  function schedule(){clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,35)}
  function observe(){
    // v0.15.72: recurring subtree observation is owned by the Random Practice coordinator.
    // Keep only the exact queue control refresh; render hooks cover all programmatic updates.
    $('#queueSize')?.addEventListener('change',schedule);
    return null;
  }

  function init(){
    if(!$('#random')||!$('#randomInputAnchor')||!$('#comboResults')||!$('#comboDetail'))return false;
    removeLegacyV48();ensureStyles();refresh();observe();
    window.__ARAM_RANDOM_PRACTICE_FOCUS_V01549__=true;
    window.aramRandomPracticeFocusV01549={version:V,refresh,active:()=>activeTab,score_logic_changed:false,dom_contract:'exact-index-2026-09-09'};
    return true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();
