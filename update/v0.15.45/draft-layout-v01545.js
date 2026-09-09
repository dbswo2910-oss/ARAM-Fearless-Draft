'use strict';
(()=>{
  const V='0.15.45';
  if(window.__ARAM_DRAFT_LAYOUT_V01545__)return;
  const text=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();

  function titleNodes(root){return [...root.querySelectorAll('.title,.panelTitle,.recTitle,h1,h2,h3,h4,strong,b')]}
  function findTitle(root,re){return titleNodes(root).find(el=>re.test(text(el)))||null}
  function closestRecPanel(el,root){
    if(!el)return null;
    const direct=el.closest?.('.panel,.card,.recommendPanel,.recommendationPanel,.recPanel');
    if(direct&&root.contains(direct))return direct;
    for(let p=el.parentElement,depth=0;p&&p!==root&&depth<7;p=p.parentElement,depth++){
      const hasRows=p.querySelectorAll?.('table,.recRow,.recommendRow,.recommendList,[class*="recommend"],[class*="Rec"]')?.length||0;
      if(hasRows&&text(p).length<14000)return p;
    }
    return el.parentElement&&root.contains(el.parentElement)?el.parentElement:null;
  }
  function pickRec(root){
    return document.getElementById('pickRecAnchor')||document.getElementById('pickRecPanel')||
      closestRecPanel(document.getElementById('pickRecSub'),root)||
      closestRecPanel(findTitle(root,/^(?:실시간\s*다음\s*픽|\d+픽)\s*추천\s*TOP\s*6/i),root);
  }
  function banRec(root){
    return document.getElementById('banRecAnchor')||document.getElementById('banRecPanel')||
      closestRecPanel(document.getElementById('banRecSub'),root)||
      closestRecPanel(findTitle(root,/^(?:우리\s*4\s*[~\-]?\s*5밴\s*추천|이번\s*세트\s*위협\s*밴|위협\s*밴).*TOP\s*6/i),root);
  }
  function unwrapHost(el){
    let p=el?.parentElement||null;
    if(p&&/^draft(?:Phase|Current)SectionV01545$/.test(p.id||''))p=p.parentElement;
    return p;
  }
  function ensureSection(id,title,content,host){
    if(!content||!host)return null;
    let sec=document.getElementById(id);
    if(!sec){
      sec=document.createElement('section');sec.id=id;sec.className='draftLeftSectionV01545';
      const h=document.createElement('div');h.className='draftStageTitleV01545';h.textContent=title;sec.appendChild(h);
      if(content.parentElement===host)host.insertBefore(sec,content);else host.appendChild(sec);
    }
    let h=sec.querySelector(':scope > .draftStageTitleV01545');
    if(!h){h=document.createElement('div');h.className='draftStageTitleV01545';sec.prepend(h)}
    h.textContent=title;
    if(content.parentElement!==sec)sec.appendChild(content);
    return sec;
  }
  function hideLegacyHeading(root,re,inside){
    for(const el of titleNodes(root)){
      const t=text(el);if(!re.test(t)||t.length>40)continue;
      if(inside?.contains(el))continue;
      el.classList.add('draftLegacyHeadingHiddenV01545');
    }
  }
  function moveAfter(anchor,node){
    if(!anchor||!node||anchor===node)return;
    if(anchor.nextElementSibling!==node)anchor.insertAdjacentElement('afterend',node);
  }
  function currentSection(root,leftHost,after){
    const grid=root.querySelector('.currentPickGrid');if(!grid||!leftHost)return null;
    let sec=document.getElementById('draftCurrentSectionV01545');
    if(!sec){
      sec=document.createElement('section');sec.id='draftCurrentSectionV01545';sec.className='draftLeftSectionV01545 draftCurrentV01545';
      const h=document.createElement('div');h.className='draftStageTitleV01545';h.textContent='현재 픽 입력';sec.appendChild(h);
      if(after?.parentElement===leftHost)after.insertAdjacentElement('afterend',sec);else leftHost.appendChild(sec);
    }
    if(grid.parentElement!==sec)sec.appendChild(grid);
    const analyze=[...root.querySelectorAll('button')].find(b=>/완성\s*조합\s*분석\s*보기/.test(text(b)));
    if(analyze&&!sec.contains(analyze)){
      let foot=sec.querySelector(':scope > .draftCurrentFooterV01545');
      if(!foot){foot=document.createElement('div');foot.className='draftCurrentFooterV01545';sec.appendChild(foot)}
      foot.appendChild(analyze);
    }
    return sec;
  }
  function normalizeRecommendationTitles(pr,br){
    const pt=pr?.querySelector?.('.title,.panelTitle,.recTitle,h1,h2,h3,h4');
    if(pt)pt.textContent='실시간 다음 픽 추천 TOP 6';
    const bt=br?.querySelector?.('.title,.panelTitle,.recTitle,h1,h2,h3,h4');
    if(bt)bt.textContent='우리 4~5밴 추천 TOP 6';
  }

  function applyLayout(){
    const root=document.getElementById('builder');if(!root)return false;
    const phase1=document.getElementById('banPhase1'),phase2=document.getElementById('banPhase2');
    if(!phase1||!phase2)return false;

    let leftHost=unwrapHost(phase1)||unwrapHost(phase2);
    if(!leftHost||!root.contains(leftHost))return false;

    const p1=ensureSection('draftPhase1SectionV01545','1차 밴 · 1~3밴',phase1,leftHost);
    const p2=ensureSection('draftPhase2SectionV01545','2차 밴 · 4~5밴',phase2,leftHost);
    if(p1&&p1.parentElement!==leftHost)leftHost.appendChild(p1);
    if(p2&&p2.parentElement!==leftHost)leftHost.appendChild(p2);
    moveAfter(p1,p2);

    const current=currentSection(root,leftHost,p2);
    if(current&&current.parentElement!==leftHost)leftHost.appendChild(current);
    moveAfter(p2,current);

    const engine=document.getElementById('builderEngineAnchor');
    if(engine){if(engine.parentElement!==leftHost)leftHost.appendChild(engine);moveAfter(current,engine)}
    const pool=document.getElementById('builderPoolMount');
    if(pool){if(pool.parentElement!==leftHost)leftHost.appendChild(pool);moveAfter(engine||current,pool)}

    const pr=pickRec(root),br=banRec(root);
    if(pr&&br&&pr!==br){
      const rightHost=pr.parentElement;
      if(rightHost&&br.parentElement!==rightHost)rightHost.appendChild(br);
      moveAfter(pr,br);
      normalizeRecommendationTitles(pr,br);
      rightHost?.classList.add('draftRightStackV01545');
    }else normalizeRecommendationTitles(pr,br);

    hideLegacyHeading(root,/^1차\s*밴(?:\s*[·\-:]|\s)/,p1);
    hideLegacyHeading(root,/^2차\s*밴(?:\s*[·\-:]|\s)/,p2);
    hideLegacyHeading(root,/^현재\s*픽\s*입력$/,current);

    leftHost.classList.add('draftLeftStackV01545');
    root.querySelector('.builderWorkspace')?.classList.add('draftWorkspaceStableV01545');
    return true;
  }

  function ensureStyle(){
    if(document.getElementById('aram-draft-layout-v01545-style'))return;
    const st=document.createElement('style');st.id='aram-draft-layout-v01545-style';st.textContent=`
      #builderDraftLayoutV01543{display:none!important}
      .draftLegacyHeadingHiddenV01545{display:none!important}
      #builder .draftLeftStackV01545{min-width:0!important}
      #builder .draftLeftSectionV01545{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin:0 0 12px!important}
      #builder .draftStageTitleV01545{font-size:12px;font-weight:950;color:#eaf4ff;margin:0 0 9px;padding:0 0 7px;border-bottom:1px solid #29425e}
      #builder #draftPhase1SectionV01545 #banPhase1,#builder #draftPhase2SectionV01545 #banPhase2{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;box-sizing:border-box!important}
      #builder #draftPhase1SectionV01545 #banPhase1 .banRow,#builder #draftPhase2SectionV01545 #banPhase2 .banRow{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
      #builder #draftCurrentSectionV01545 .currentPickGrid{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
      #builder #builderEngineAnchor,#builder #builderPoolMount{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin-left:0!important;margin-right:0!important}
      #builder .draftCurrentFooterV01545{display:flex;justify-content:flex-start;margin-top:8px}
      #builder .draftRightStackV01545>*{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin-left:0!important;margin-right:0!important}
      #builder .draftRightStackV01545>*+*{margin-top:12px!important}
      #builder .draftWorkspaceStableV01545{align-items:start!important}
    `;document.head.appendChild(st);
  }

  function apply(){ensureStyle();try{return applyLayout()}catch(e){console.warn('[v0.15.45] stable draft layout',e);return false}}
  const oldRender=typeof renderBuilder==='function'?renderBuilder:null;
  if(oldRender)renderBuilder=function(...args){const r=oldRender.apply(this,args);apply();requestAnimationFrame(apply);return r};
  const oldPoolRender=typeof window.renderBuilderPool==='function'?window.renderBuilderPool:null;
  if(oldPoolRender)window.renderBuilderPool=function(...args){const r=oldPoolRender.apply(this,args);requestAnimationFrame(apply);return r};
  ensureStyle();apply();setTimeout(apply,0);setTimeout(apply,120);setTimeout(apply,400);

  window.aramApplyDraftLayoutV01545=apply;
  if(typeof DATA!=='undefined'){
    DATA.version=V;
    DATA.draft_layout_v01545={version:'v0.15.45 · Stable independent-column draft layout',principle:'원본 2열 workspace를 유지하고 왼쪽/오른쪽 컬럼을 독립 스택으로 재정렬',left_order:['BAN 1-3','BAN 4-5','CURRENT PICKS','PICK JUDGMENT','CHAMPION POOL'],right_order:['NEXT PICK TOP6','OUR BAN TOP6'],equal_left_width:true,independent_column_flow:true,legacy_v01543_grid_disabled:true,v01544_not_required:true,score_logic_changed:false};
  }
  if(typeof syncAppVersionUI==='function')try{syncAppVersionUI()}catch{}
  window.__ARAM_DRAFT_LAYOUT_V01545__=true;
})();
