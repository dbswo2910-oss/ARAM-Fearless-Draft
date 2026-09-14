'use strict';
const fs=require('fs');
const path=require('path');
let prior;
try{prior=require('../v0.15.128/runtime-source-stability-v015128')}catch{prior=require('./runtime-source-stability-v015128')}
const SENTINEL='/* ARAM_RATING_RESEARCH_UI_V015132 */';
let cached='';
function readLocal(name){
  const candidates=[
    path.join(__dirname,name),
    path.join(__dirname,'..','v0.15.132',name),
    path.join(__dirname,'..','v0.15.131',name),
    path.join(__dirname,'..','v0.15.130',name)
  ];
  const p=candidates.find(fs.existsSync);
  if(!p)throw new Error(`v0.15.132 bundled module missing: ${name}`);
  return fs.readFileSync(p,'utf8');
}
function payloadSource(){
  if(cached)return cached;
  const engine=readLocal('rating-engine-v01.js');
  const core=readLocal('research-ui-core.js');
  const storage=readLocal('research-storage-v015131.js');
  const ui=readLocal('research-ui-devtools.js');
  if(!engine.includes('ARAMRatingResearchEngineV01'))throw new Error('v0.15.132 rating engine contract mismatch');
  if(!core.includes('ARAMRatingResearchUICoreV01'))throw new Error('v0.15.132 research UI core contract mismatch');
  if(!storage.includes('ARAMRatingResearchStorageV015132')&&!storage.includes('ARAMRatingResearchStorageV015131'))throw new Error('v0.15.132 research storage contract mismatch');
  if(!ui.includes('aramRatingResearchUIV01'))throw new Error('v0.15.132 research UI runtime contract mismatch');
  cached=[engine,core,storage,ui].join('\n;\n');
  return cached;
}
function injectResearchUI(src){
  src=String(src||'');
  if(src.includes(SENTINEL))return src;
  if(!src.includes('__ARAM_PLAYER_PROFILE_V01519__'))throw new Error('v0.15.132 player profile owner marker missing');
  return src+'\n'+SENTINEL+'\n'+payloadSource()+'\n';
}
function replaceOne(src,from,to,label){
  const hits=src.split(from).length-1;
  if(hits!==1)throw new Error(`v0.15.132 Patch Notes owner contract mismatch (${label}): ${hits}`);
  return src.replace(from,to);
}
function patchPatchNotesOwner(input){
  let src=String(input||'');
  if(src.includes("const PRESENTATION='0.15.132';")&&src.includes('PATCH_NOTES_ALWAYS_OPEN_V015132'))return src;
  if(src.includes("const PRESENTATION='0.15.120';"))src=replaceOne(src,"const PRESENTATION='0.15.120';","const PRESENTATION='0.15.132';",'presentation-120');
  else if(src.includes("const PRESENTATION='0.15.115';"))src=replaceOne(src,"const PRESENTATION='0.15.115';","const PRESENTATION='0.15.132';",'presentation-115');
  else if(!src.includes("const PRESENTATION='0.15.132';"))throw new Error('v0.15.132 Patch Notes owner presentation anchor missing');
  const cssAnchor='      @media(max-width:1180px){';
  const cssPatch=`      /* PATCH_NOTES_ALWAYS_OPEN_V015132: remove the generic champion-detail title/close row only in Patch Notes mode. */\n      #data.data115View.data115PatchMode .data115DetailBranch > .title,\n      #data.data115View.data115PatchMode .data115DetailBranch > .panel > .title{display:none!important}\n\n`;
  src=replaceOne(src,cssAnchor,cssPatch+cssAnchor,'css');
  const modeAnchor="    const mode=requested==='patch'||requested==='tier'?requested:currentDataMode(p.card);";
  src=replaceOne(src,modeAnchor,modeAnchor+"\n    const patchMode=mode==='patch';\n    if(patchMode){for(const el of [p.detailBranch,p.card]){el.hidden=false;el.removeAttribute('aria-hidden');el.classList.remove('hidden','collapsed','is-collapsed');el.style?.removeProperty?.('display');el.style?.removeProperty?.('visibility');el.style?.removeProperty?.('max-height')}}",'always-open');
  const titleOld="    if(title){\n      if(!title.dataset.data115Original)title.dataset.data115Original=text(title)||'챔피언 상세';\n      title.textContent=mode==='patch'?'패치노트':title.dataset.data115Original;\n    }";
  const titleNew="    if(title){\n      if(!title.dataset.data115Original)title.dataset.data115Original=text(title)||'챔피언 상세';\n      title.hidden=patchMode;if(patchMode)title.setAttribute('aria-hidden','true');else{title.removeAttribute('aria-hidden');title.textContent=title.dataset.data115Original}\n    }";
  src=replaceOne(src,titleOld,titleNew,'title-row');
  const clickAnchor="  document.addEventListener('click',e=>{\n    if(e.target?.closest?.('#randomPickModeBtn,#randomIngameModeBtn'))queueMicrotask(claimRandom);\n  },false);";
  const closeGuard="\n\n  document.addEventListener('click',e=>{const view=$('#data');if(!view?.classList.contains('data115PatchMode'))return;const p=dataParts(),btn=e.target?.closest?.('button');if(!p||!btn||!p.detailBranch.contains(btn)||!/닫기/.test(text(btn)))return;e.preventDefault();e.stopImmediatePropagation();syncData('patch')},true);";
  src=replaceOne(src,clickAnchor,clickAnchor+closeGuard,'legacy-close-guard');
  return src;
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  // v0.15.115 does not inject ui-stability-baseline-v015115.js as a standalone script.
  // It appends that owner payload to input-interaction-stability-v01539.js. Patch the
  // actual injected runtime target, not the source filename that never reaches the loader.
  if(file==='input-interaction-stability-v01539.js')src=patchPatchNotesOwner(src);
  if(file==='player-profile-v01519.js')src=injectResearchUI(src);
  return src;
}
module.exports={
  ...prior,
  patchRuntimeSource,
  patchPatchNotesOwner,
  score_logic_changed:false,
  random_scoring_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  aram_rating_research_ui:true,
  aram_rating_research_ui_mode:'local-personal-research',
  aram_rating_research_ui_default_enabled:true,
  aram_rating_research_ui_network_collection:false,
  aram_rating_research_ui_target:'player-profile-v01519.js',
  aram_rating_resolved_puuid_join:true,
  aram_rating_search_target_rerender:true,
  aram_rating_storage_read_only_recovery:true,
  aram_rating_checkpoint_preserved:true,
  stable_user_data_restored:true,
  patch_notes_detail_header_removed:true,
  patch_notes_actual_runtime_target:'input-interaction-stability-v01539.js',
  active_sampling_in_production:false,
  b2_collector_in_production:false,
  research_evaluator_in_production:false,
  activation_targets:[...new Set([...(prior.activation_targets||[]),'player-profile-v01519.js','input-interaction-stability-v01539.js'])],
  policy_version:'0.15.132'
};
