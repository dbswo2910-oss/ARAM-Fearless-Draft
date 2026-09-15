'use strict';
const OWNER='draft';
const IMPLEMENTATION_VERSION='0.16-production-adapter';
function mark(el,role){if(!el||typeof el.setAttribute!=='function')return false;el.setAttribute('data-canonical-owner',OWNER);el.setAttribute('data-canonical-owner-mode','production-adapter');if(role)el.setAttribute('data-ui-role',role);return true}
function activate({window,document}={}){
  if(!document)throw new Error('draft production adapter requires document');
  let observer=null,disposed=false;
  const refresh=()=>{
    if(disposed)return{owner:OWNER,status:'disposed'};
    const root=document.getElementById?.('builderCore')||document.querySelector?.('#builderCore')||document.querySelector?.('#draft');
    const draftView=document.getElementById?.('draft')||document.querySelector?.('#draft');
    const risk=document.getElementById?.('draftRiskBoardV01546')||document.querySelector?.('#draftRiskBoardV01546');
    mark(root,'draft-workspace');mark(draftView,'draft-root');mark(risk,'draft-risk-board');
    return{owner:OWNER,status:'active',mode:'production-adapter',root_found:!!root,legacy_delegate:'current-draft-runtime-chain'};
  };
  const first=refresh();
  const MO=window?.MutationObserver||globalThis?.MutationObserver;
  const target=document.getElementById?.('builderCore')||document.querySelector?.('#builderCore')||document.body;
  if(typeof MO==='function'&&target){observer=new MO(()=>{try{refresh()}catch{}});try{observer.observe(target,{childList:true,subtree:true})}catch{observer=null}}
  return{...first,refresh,dispose(){disposed=true;try{observer?.disconnect?.()}catch{}},production_active:true};
}
module.exports={OWNER,IMPLEMENTATION_VERSION,activate,production_active:true,owner_status:'production',implementation_mode:'production-adapter',legacy_removal_authorized:false};
