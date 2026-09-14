'use strict';
let prior;
try{prior=require('../v0.15.132/runtime-source-stability-v015132')}catch{prior=require('./runtime-source-stability-v015132')}

const SENTINEL='/* PATCH_NOTES_REAL_WINDOWS_V015133 */';

function applyPatchShellTitleState(parts,patchMode,textFn){
  const p=parts||{},text=typeof textFn==='function'?textFn:(el=>String(el?.textContent||'').replace(/\s+/g,' ').trim());
  const titles=[],seen=new Set();
  const add=title=>{
    if(!title||seen.has(title))return;
    try{if(title.closest?.('#dataPatchNotesV01599'))return}catch{}
    const label=text(title);
    if(!/챔피언\s*상세/.test(label)&&!/닫기/.test(label))return;
    seen.add(title);titles.push(title);
  };
  add(p.detailBranch?.querySelector?.(':scope > .title'));
  let node=p.card||null;
  while(node&&node!==p.host){
    if(node.matches?.('.panel'))add(node.querySelector?.(':scope > .title'));
    node=node.parentElement;
  }
  if(p.detailBranch?.matches?.('.panel'))add(p.detailBranch.querySelector?.(':scope > .title'));
  for(const title of titles){
    title.dataset=title.dataset||{};
    if(patchMode){
      title.dataset.data115PatchShellHiddenV015133='1';
      title.hidden=true;
      title.setAttribute?.('aria-hidden','true');
      title.style?.setProperty?.('display','none','important');
    }else if(title.dataset.data115PatchShellHiddenV015133==='1'){
      title.hidden=false;
      title.removeAttribute?.('aria-hidden');
      title.style?.removeProperty?.('display');
      delete title.dataset.data115PatchShellHiddenV015133;
    }
  }
  return titles.length;
}

function patchPatchNotesRealWindows(input){
  let src=String(input||'');
  if(src.includes(SENTINEL))return src;
  const anchor="    const eyebrow=$('#dataPatchNotesV01599 .dh99Eyebrow',p.card);";
  const hits=src.split(anchor).length-1;
  if(hits!==1)throw new Error(`v0.15.133 Patch Notes real-Windows anchor mismatch: ${hits}`);
  const injected=[
    `    ${SENTINEL}`,
    `    (${applyPatchShellTitleState.toString()})(p,patchMode,text);`,
    ''
  ].join('\n');
  return src.replace(anchor,injected+anchor);
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='input-interaction-stability-v01539.js')src=patchPatchNotesRealWindows(src);
  return src;
}

module.exports={
  ...prior,
  patchRuntimeSource,
  patchPatchNotesRealWindows,
  applyPatchShellTitleState,
  score_logic_changed:false,
  random_scoring_changed:false,
  patch_notes_real_windows_shell_fix:true,
  patch_notes_shell_fix_target:'input-interaction-stability-v01539.js',
  patch_notes_shell_fix_owner:'ui-stability-v015115',
  patch_notes_shell_fix_strategy:'exact-data-card-ancestor-chain',
  active_sampling_in_production:false,
  b2_collector_in_production:false,
  research_evaluator_in_production:false,
  policy_version:'0.15.133'
};
