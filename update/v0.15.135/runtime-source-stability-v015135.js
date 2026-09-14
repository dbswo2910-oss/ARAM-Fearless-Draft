'use strict';
let prior;
try{prior=require('../v0.15.134/runtime-source-stability-v015134')}catch{prior=require('./runtime-source-stability-v015134')}

const SENTINEL='/* PATCH_NOTES_SEMANTIC_SHELL_V015135 */';

function applyPatchShellSemanticSweepV015135(parts,patchMode,textFn){
  const p=parts||{},view=p.view;
  if(!view?.querySelectorAll)return 0;
  const text=typeof textFn==='function'?textFn:(el=>String(el?.textContent||'').replace(/\s+/g,' ').trim());
  const closeLabel=btn=>`${text(btn)} ${String(btn?.getAttribute?.('aria-label')||'')}`.replace(/\s+/g,' ').trim();
  const rows=[],seen=new Set();
  const add=row=>{
    if(!row||row===view||seen.has(row))return;
    try{if(row.closest?.('#dataPatchNotesV01599,#dataHubTopNavV015115,#dataHubNavV01599'))return}catch{}
    try{if(row===p.card||row.contains?.(p.card)||row.querySelector?.('#dataPatchNotesV01599'))return}catch{}
    const label=text(row);
    if(!/챔피언\s*상세/.test(label)||label.length>160)return;
    const buttons=[...(row.querySelectorAll?.('button')||[])];
    if(!buttons.some(btn=>/닫기/.test(closeLabel(btn))))return;
    seen.add(row);rows.push(row);
  };

  for(const title of view.querySelectorAll('.title'))add(title);
  for(const btn of view.querySelectorAll('button')){
    if(!/닫기/.test(closeLabel(btn)))continue;
    let node=btn.closest?.('.title')||btn.parentElement;
    for(let depth=0;node&&node!==view&&depth<5;depth++,node=node.parentElement){
      try{if(node===p.card||node.contains?.(p.card))break}catch{}
      if(/챔피언\s*상세/.test(text(node))){add(node);break}
    }
  }
  for(const tagged of view.querySelectorAll('[data-data115-patch-shell-hidden-v015135="1"]')){
    if(!seen.has(tagged)){seen.add(tagged);rows.push(tagged)}
  }

  let matched=0;
  for(const row of rows){
    row.dataset=row.dataset||{};
    if(patchMode){
      row.dataset.data115PatchShellHiddenV015135='1';
      row.hidden=true;
      row.setAttribute?.('aria-hidden','true');
      row.style?.setProperty?.('display','none','important');
      matched++;
    }else if(row.dataset.data115PatchShellHiddenV015135==='1'){
      row.hidden=false;
      row.removeAttribute?.('aria-hidden');
      row.style?.removeProperty?.('display');
      delete row.dataset.data115PatchShellHiddenV015135;
    }
  }
  try{view.dataset.data115PatchShellMatchesV015135=String(matched)}catch{}
  return matched;
}

function patchPatchNotesSemanticShell(input){
  let src=String(input||'');
  if(src.includes(SENTINEL))return src;
  const anchor="    const eyebrow=$('#dataPatchNotesV01599 .dh99Eyebrow',p.card);";
  const hits=src.split(anchor).length-1;
  if(hits!==1)throw new Error(`v0.15.135 Patch Notes semantic-shell anchor mismatch: ${hits}`);
  const helper=applyPatchShellSemanticSweepV015135.toString();
  const injected=[
    `    ${SENTINEL}`,
    `    const sweepPatchShellV015135=${helper};`,
    `    sweepPatchShellV015135(p,patchMode,text);`,
    `    if(!p.view.__aramPatchShellObserverV015135){`,
    `      const observer=new MutationObserver(mutations=>{`,
    `        if(!mutations.some(m=>m.addedNodes?.length||m.removedNodes?.length))return;`,
    `        if(p.view?.dataset?.data115Mode!=='patch')return;`,
    `        queueMicrotask(()=>{try{const next=dataParts();if(next&&next.view?.dataset?.data115Mode==='patch')sweepPatchShellV015135(next,true,text)}catch{}});`,
    `      });`,
    `      observer.observe(p.view,{childList:true,subtree:true});`,
    `      try{Object.defineProperty(p.view,'__aramPatchShellObserverV015135',{value:observer,configurable:true})}catch{p.view.__aramPatchShellObserverV015135=observer}`,
    `    }`,
    `    if(patchMode){`,
    `      requestAnimationFrame(()=>{try{const next=dataParts();if(next&&next.view?.dataset?.data115Mode==='patch')sweepPatchShellV015135(next,true,text)}catch{}});`,
    `      setTimeout(()=>{try{const next=dataParts();if(next&&next.view?.dataset?.data115Mode==='patch')sweepPatchShellV015135(next,true,text)}catch{}},120);`,
    `    }`,
    ''
  ].join('\n');
  return src.replace(anchor,injected+anchor);
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  // Keep DATA ownership in ui-stability-v015115. The live Windows evidence proved
  // that choosing one inferred title node is insufficient, so sweep only the #data
  // view for the exact generic shell semantics and re-apply after child replacement.
  if(file==='input-interaction-stability-v01539.js')src=patchPatchNotesSemanticShell(src);
  return src;
}

module.exports={
  ...prior,
  patchRuntimeSource,
  patchPatchNotesSemanticShell,
  applyPatchShellSemanticSweepV015135,
  score_logic_changed:false,
  random_scoring_changed:false,
  patch_notes_real_windows_shell_fix:true,
  patch_notes_shell_fix_target:'input-interaction-stability-v01539.js',
  patch_notes_shell_fix_owner:'ui-stability-v015115',
  patch_notes_shell_fix_strategy:'scoped-semantic-title-close-sweep-plus-child-observer',
  patch_notes_shell_scope:'#data excluding Patch Notes body/nav',
  active_sampling_in_production:false,
  b2_collector_in_production:false,
  research_evaluator_in_production:false,
  policy_version:'0.15.135'
};
