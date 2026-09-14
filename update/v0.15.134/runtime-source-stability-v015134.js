'use strict';
let prior;
try{prior=require('../v0.15.133/runtime-source-stability-v015133')}catch{prior=require('./runtime-source-stability-v015133')}

const SENTINEL='/* PATCH_NOTES_OWNER_TARGET_V015134 */';
const OLD_BLOCK=`    const title=p.detailBranch.querySelector(':scope > .panel > .title')||p.detailBranch.querySelector(':scope > .title')||p.card.closest('.panel')?.querySelector(':scope > .title');
    if(title){
      if(!title.dataset.data115Original)title.dataset.data115Original=text(title)||'챔피언 상세';
      title.textContent=mode==='patch'?'패치노트':title.dataset.data115Original;
    }
`;
const NEW_BLOCK=`    const title=p.detailBranch.querySelector(':scope > .panel > .title')||p.detailBranch.querySelector(':scope > .title')||p.card.closest('.panel')?.querySelector(':scope > .title');
    ${SENTINEL}
    if(title){
      if(!title.dataset.data115Original)title.dataset.data115Original=text(title)||'챔피언 상세';
      if(mode==='patch'){
        title.dataset.data115PatchShellHiddenV015134='1';
        title.hidden=true;
        title.setAttribute('aria-hidden','true');
        title.style.setProperty('display','none','important');
      }else{
        title.hidden=false;
        title.removeAttribute('aria-hidden');
        title.style.removeProperty('display');
        delete title.dataset.data115PatchShellHiddenV015134;
        title.textContent=title.dataset.data115Original;
      }
    }
`;

function patchDataOwnerSource(input){
  let src=String(input||'');
  if(src.includes(SENTINEL))return src;
  const hits=src.split(OLD_BLOCK).length-1;
  if(hits!==1)throw new Error(`v0.15.134 DATA owner title contract mismatch: ${hits}`);
  return src.replace(OLD_BLOCK,NEW_BLOCK);
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='ui-stability-baseline-v015115.js')src=patchDataOwnerSource(src);
  return src;
}

module.exports={
  ...prior,
  patchRuntimeSource,
  patchDataOwnerSource,
  score_logic_changed:false,
  random_scoring_changed:false,
  patch_notes_real_windows_shell_fix:true,
  patch_notes_shell_fix_target:'ui-stability-baseline-v015115.js',
  patch_notes_shell_fix_owner:'ui-stability-v015115',
  patch_notes_shell_fix_strategy:'resolved-detail-title-direct-owner-patch',
  active_sampling_in_production:false,
  b2_collector_in_production:false,
  research_evaluator_in_production:false,
  policy_version:'0.15.134'
};
