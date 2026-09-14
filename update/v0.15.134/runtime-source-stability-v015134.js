'use strict';
let prior;
try{prior=require('../v0.15.133/runtime-source-stability-v015133')}catch{prior=require('./runtime-source-stability-v015133')}

const SENTINEL='/* PATCH_NOTES_RESOLVED_TITLE_V015134 */';
const OLD_TITLE_STATE="title.hidden=patchMode;if(patchMode)title.setAttribute('aria-hidden','true');else{title.removeAttribute('aria-hidden');title.textContent=title.dataset.data115Original}";
const NEW_TITLE_STATE="title.hidden=patchMode;/* PATCH_NOTES_RESOLVED_TITLE_V015134 */if(patchMode){title.dataset.data115PatchShellHiddenV015134='1';title.setAttribute('aria-hidden','true');title.style.setProperty('display','none','important')}else{title.removeAttribute('aria-hidden');title.style.removeProperty('display');delete title.dataset.data115PatchShellHiddenV015134;title.textContent=title.dataset.data115Original}";

function patchResolvedDataTitle(input){
  let src=String(input||'');
  if(src.includes(SENTINEL))return src;
  const hits=src.split(OLD_TITLE_STATE).length-1;
  if(hits!==1)throw new Error(`v0.15.134 resolved DATA title contract mismatch: ${hits}`);
  return src.replace(OLD_TITLE_STATE,NEW_TITLE_STATE);
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  // ui-stability-v015115 is intentionally appended into this runtime target by the
  // existing single-owner source pipeline. Patch the exact title variable resolved
  // by syncData(), not an inferred #dataCard ancestor topology.
  if(file==='input-interaction-stability-v01539.js')src=patchResolvedDataTitle(src);
  return src;
}

module.exports={
  ...prior,
  patchRuntimeSource,
  patchResolvedDataTitle,
  score_logic_changed:false,
  random_scoring_changed:false,
  patch_notes_real_windows_shell_fix:true,
  patch_notes_shell_fix_target:'input-interaction-stability-v01539.js',
  patch_notes_shell_fix_owner:'ui-stability-v015115',
  patch_notes_shell_fix_strategy:'resolved-syncData-title-direct-style',
  active_sampling_in_production:false,
  b2_collector_in_production:false,
  research_evaluator_in_production:false,
  policy_version:'0.15.134'
};
