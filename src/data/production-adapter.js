'use strict';
const OWNER='data';
const IMPLEMENTATION_VERSION='0.16-production-adapter';
function mark(el,role){if(!el||typeof el.setAttribute!=='function')return false;el.setAttribute('data-canonical-owner',OWNER);el.setAttribute('data-canonical-owner-mode','production-adapter');if(role)el.setAttribute('data-ui-role',role);return true}
function activate({window,document}={}){
  if(!document)throw new Error('data production adapter requires document');
  let observer=null,disposed=false;
  const refresh=()=>{
    if(disposed)return{owner:OWNER,status:'disposed'};
    const root=document.getElementById?.('data')||document.querySelector?.('#data');
    const card=document.getElementById?.('dataCard')||document.querySelector?.('#dataCard');
    const patch=document.getElementById?.('dataPatchNotesV01599')||document.querySelector?.('#dataPatchNotesV01599');
    const nav=document.getElementById?.('dataHubTopNavV015115')||document.querySelector?.('#dataHubTopNavV015115');
    mark(root,'data-root');mark(card,'data-detail-card');mark(patch,'data-patch-notes');mark(nav,'data-top-navigation');
    return{owner:OWNER,status:'active',mode:'production-adapter',root_found:!!root,legacy_delegate:'ui-stability-v015115'};
  };
  const first=refresh();
  const MO=window?.MutationObserver||globalThis?.MutationObserver;
  const target=document.getElementById?.('data')||document.querySelector?.('#data')||document.body;
  if(typeof MO==='function'&&target){observer=new MO(()=>{try{refresh()}catch{}});try{observer.observe(target,{childList:true,subtree:true})}catch{observer=null}}
  return{...first,refresh,dispose(){disposed=true;try{observer?.disconnect?.()}catch{}},production_active:true};
}
module.exports={OWNER,IMPLEMENTATION_VERSION,activate,production_active:true,owner_status:'production',implementation_mode:'production-adapter',legacy_removal_authorized:false};
