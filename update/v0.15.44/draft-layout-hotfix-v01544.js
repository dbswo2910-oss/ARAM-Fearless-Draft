'use strict';
(()=>{
  const V='0.15.44';
  if(window.__ARAM_DRAFT_LAYOUT_HOTFIX_V01544__)return;

  function text(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim()}
  function titleCandidates(root){return [...root.querySelectorAll('.title,.panelTitle,.recTitle,h1,h2,h3,h4,strong,b')]}
  function panelFromTitle(el,root){
    if(!el)return null;
    const direct=el.closest?.('.panel,.card,.recommendPanel,.recommendationPanel,.recPanel');
    if(direct&&root.contains(direct))return direct;
    for(let p=el.parentElement,depth=0;p&&p!==root&&depth<7;p=p.parentElement,depth++){
      const t=text(p),tables=p.querySelectorAll?.('table,.recRow,.recommendRow,.recommendList,[class*="recommend"],[class*="Rec"]')?.length||0;
      if(tables&&t.length<12000)return p;
    }
    return el.parentElement;
  }
  function findByTitle(root,res){
    for(const el of titleCandidates(root)){
      const t=text(el);if(res.some(re=>re.test(t)))return panelFromTitle(el,root);
    }
    return null;
  }
  function pickRec(root){
    return document.getElementById('pickRecAnchor')||document.getElementById('pickRecPanel')||
      findByTitle(root,[/^\s*\d+픽\s*추천\s*TOP\s*6/i,/실시간.*픽.*추천\s*TOP\s*6/i,/다음.*픽.*추천/i]);
  }
  function banRec(root){
    return document.getElementById('banRecAnchor')||document.getElementById('banRecPanel')||
      findByTitle(root,[/이번\s*세트.*밴\s*TOP\s*6/i,/위협\s*밴\s*TOP\s*6/i,/4\s*[~\-]?\s*5\s*밴.*추천/i,/밴.*추천\s*TOP/i]);
  }
  function currentPick(root){
    const holder=document.getElementById('draftV01543Current');
    if(holder?.firstElementChild)return holder.firstElementChild;
    const g=root.querySelector('.currentPickGrid');
    if(g){const p=g.closest('.panel,.card');return p||g.parentElement||g}
    return findByTitle(root,[/현재\s*픽\s*입력/]);
  }
  function ensure(id,cls,parent){let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.className=cls;parent.appendChild(el)}return el}

  function fixLayout(){
    const root=document.getElementById('builder');if(!root)return false;
    const workspace=root.querySelector('.builderWorkspace');
    let layout=document.getElementById('builderDraftLayoutV01543');
    if(!layout){layout=document.createElement('div');layout.id='builderDraftLayoutV01543';(workspace||root).insertAdjacentElement(workspace?'afterend':'beforeend',layout)}
    const row1=ensure('draftV01543Row1','draftV01543Row',layout);
    const row2=ensure('draftV01543Row2','draftV01543Row',layout);
    const cur=ensure('draftV01543Current','draftV01543LeftOnly',layout);
    const decision=ensure('draftV01543Decision','draftV01543LeftOnly',layout);
    const pool=ensure('draftV01543Pool','draftV01543Full',layout);
    row1.className='draftV01543Row';row2.className='draftV01543Row';cur.className='draftV01543LeftOnly';decision.className='draftV01543LeftOnly';pool.className='draftV01543Full';

    const phase1=document.getElementById('banPhase1'),phase2=document.getElementById('banPhase2');
    const pr=pickRec(root),br=banRec(root),cp=currentPick(root),engine=document.getElementById('builderEngineAnchor'),poolMount=document.getElementById('builderPoolMount');
    if(phase1&&phase1.parentElement!==row1)row1.appendChild(phase1);
    if(pr&&pr!==row1&&pr.parentElement!==row1)row1.appendChild(pr);
    if(phase2&&phase2.parentElement!==row2)row2.appendChild(phase2);
    if(br&&br!==row2&&br.parentElement!==row2)row2.appendChild(br);
    if(cp&&cp!==cur&&cp.parentElement!==cur)cur.appendChild(cp);
    if(engine&&engine.parentElement!==decision)decision.appendChild(engine);
    if(poolMount&&poolMount.parentElement!==pool)pool.appendChild(poolMount);

    const prTitle=pr?.querySelector?.('.title,.panelTitle,.recTitle,h1,h2,h3,h4');
    if(prTitle)prTitle.textContent='실시간 다음 픽 추천 TOP 6';
    const brTitle=br?.querySelector?.('.title,.panelTitle,.recTitle,h1,h2,h3,h4');
    if(brTitle)brTitle.textContent='우리 4~5밴 추천 TOP 6';

    if(workspace){workspace.classList.add('builderWorkspaceV01544Compact');}
    layout.dataset.layoutFixed='v0.15.44';
    return !!(phase1&&phase2&&pr&&br);
  }

  function ensureStyle(){
    if(document.getElementById('aram-draft-layout-hotfix-v01544-style'))return;
    const st=document.createElement('style');st.id='aram-draft-layout-hotfix-v01544-style';st.textContent=`
      #builder .builderWorkspaceV01544Compact{min-height:0!important;height:auto!important;margin-bottom:0!important;padding-bottom:0!important}
      #builderDraftLayoutV01543{display:flex!important;flex-direction:column!important;gap:10px!important;margin-top:10px!important;width:100%!important;min-width:0!important}
      #builderDraftLayoutV01543 .draftV01543Row{display:grid!important;grid-template-columns:minmax(0,50%) minmax(0,50%)!important;gap:10px!important;align-items:start!important;width:100%!important;min-width:0!important}
      #builderDraftLayoutV01543 .draftV01543Row>*{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin-left:0!important;margin-right:0!important}
      #builderDraftLayoutV01543 .draftV01543LeftOnly{width:calc(50% - 5px)!important;max-width:calc(50% - 5px)!important;min-width:0!important}
      #builderDraftLayoutV01543 .draftV01543LeftOnly>*{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;margin-left:0!important;margin-right:0!important}
      #builderDraftLayoutV01543 .draftV01543Full{width:100%!important;max-width:100%!important;min-width:0!important}
      #builderDraftLayoutV01543 #banPhase1,#builderDraftLayoutV01543 #banPhase2{width:100%!important;max-width:100%!important;margin:0!important;box-sizing:border-box!important}
      #builderDraftLayoutV01543 #banPhase1 .banRow,#builderDraftLayoutV01543 #banPhase2 .banRow{width:100%!important;max-width:100%!important;box-sizing:border-box!important}
      #builderDraftLayoutV01543 #draftV01543Current .currentPickGrid{width:100%!important;max-width:100%!important;box-sizing:border-box!important}
      #builderDraftLayoutV01543 #builderEngineAnchor,#builderDraftLayoutV01543 #builderPoolMount{margin-top:0!important}
      @media(max-width:1100px){
        #builderDraftLayoutV01543 .draftV01543Row{grid-template-columns:1fr!important}
        #builderDraftLayoutV01543 .draftV01543LeftOnly{width:100%!important;max-width:100%!important}
      }
    `;document.head.appendChild(st);
  }

  function apply(){ensureStyle();try{fixLayout()}catch(e){console.warn('[v0.15.44] draft layout hotfix',e)}}
  const prevRender=typeof renderBuilder==='function'?renderBuilder:null;
  if(prevRender)renderBuilder=function(...args){const r=prevRender.apply(this,args);apply();requestAnimationFrame(apply);return r};
  ensureStyle();apply();setTimeout(apply,0);setTimeout(apply,120);setTimeout(apply,450);

  window.aramApplyDraftLayoutV01544=apply;
  if(typeof DATA!=='undefined'){
    DATA.version=V;
    DATA.draft_layout_hotfix_v01544={version:'v0.15.44 · Draft layout hotfix',reason:'v0.15.43 pick recommendation selector missed dynamic N픽 title and left the original workspace tall; fixed panel detection and equal left-column sizing',row1:'BAN 1-3 | next pick TOP6',row2:'BAN 4-5 | our ban TOP6',left_equal_width:true,blank_gap_fixed:true,score_logic_changed:false};
  }
  if(typeof syncAppVersionUI==='function')try{syncAppVersionUI()}catch{}
  window.__ARAM_DRAFT_LAYOUT_HOTFIX_V01544__=true;
})();
