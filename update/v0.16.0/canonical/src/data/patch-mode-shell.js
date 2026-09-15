'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const HIDDEN_DATASET_KEY='uiPatchShellHidden';
const UI_ROLE='data-detail-generic-shell-header';
function applyPatchShellSemanticSweep(parts,patchMode,textFn){
  const p=parts||{},view=p.view;if(!view?.querySelectorAll)return 0;
  const text=typeof textFn==='function'?textFn:(el=>String(el?.textContent||'').replace(/\s+/g,' ').trim());
  const closeLabel=btn=>`${text(btn)} ${String(btn?.getAttribute?.('aria-label')||'')}`.replace(/\s+/g,' ').trim();
  const rows=[],seen=new Set(),add=row=>{
    if(!row||row===view||seen.has(row))return;
    try{if(row.closest?.('#dataPatchNotesV01599,#dataHubTopNavV015115,#dataHubNavV01599'))return}catch{}
    try{if(row===p.card||row.contains?.(p.card)||row.querySelector?.('#dataPatchNotesV01599'))return}catch{}
    const label=text(row);if(!/챔피언\s*상세/.test(label)||label.length>160)return;
    const buttons=[...(row.querySelectorAll?.('button')||[])];if(!buttons.some(btn=>/닫기/.test(closeLabel(btn))))return;
    seen.add(row);rows.push(row);
  };
  for(const title of view.querySelectorAll('.title'))add(title);
  for(const btn of view.querySelectorAll('button')){
    if(!/닫기/.test(closeLabel(btn)))continue;let node=btn.closest?.('.title')||btn.parentElement;
    for(let depth=0;node&&node!==view&&depth<5;depth++,node=node.parentElement){try{if(node===p.card||node.contains?.(p.card))break}catch{}if(/챔피언\s*상세/.test(text(node))){add(node);break}}
  }
  for(const tagged of view.querySelectorAll('[data-ui-patch-shell-hidden="1"]'))if(!seen.has(tagged)){seen.add(tagged);rows.push(tagged)}
  let matched=0;
  for(const row of rows){row.dataset=row.dataset||{};if(!row.dataset.uiRole)row.dataset.uiRole=UI_ROLE;if(patchMode){row.dataset[HIDDEN_DATASET_KEY]='1';row.hidden=true;row.setAttribute?.('aria-hidden','true');row.style?.setProperty?.('display','none','important');matched++}else if(row.dataset[HIDDEN_DATASET_KEY]==='1'){row.hidden=false;row.removeAttribute?.('aria-hidden');row.style?.removeProperty?.('display');delete row.dataset[HIDDEN_DATASET_KEY]}}
  try{view.dataset.uiPatchShellMatches=String(matched)}catch{}return matched;
}
module.exports={IMPLEMENTATION_VERSION,HIDDEN_DATASET_KEY,UI_ROLE,applyPatchShellSemanticSweep,production_active:false,score_logic_changed:false,random_scoring_changed:false};
