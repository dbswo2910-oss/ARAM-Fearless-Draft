'use strict';
const OWNER='random_pick';
const IMPLEMENTATION_VERSION='0.16-production-adapter';
function mark(el,role){if(!el||typeof el.setAttribute!=='function')return false;el.setAttribute('data-canonical-owner',OWNER);el.setAttribute('data-canonical-owner-mode','production-adapter');if(role)el.setAttribute('data-ui-role',role);return true}
function activate({window,document}={}){
  if(!document)throw new Error('random pick production adapter requires document');
  let observer=null,disposed=false;
  const refresh=()=>{
    if(disposed)return{owner:OWNER,status:'disposed'};
    const root=document.getElementById?.('random')||document.querySelector?.('#random');
    const input=document.getElementById?.('randomInputAnchor')||document.querySelector?.('#randomInputAnchor');
    const results=document.getElementById?.('comboResults')||document.querySelector?.('#comboResults');
    const detail=document.getElementById?.('comboDetail')||document.querySelector?.('#comboDetail');
    mark(root,'random-root');mark(input,'random-input-anchor');mark(results,'random-top5');mark(detail,'random-top5-detail');
    return{owner:OWNER,status:'active',mode:'production-adapter',root_found:!!root,legacy_delegate:'runtime-v015100-single-owner-baseline'};
  };
  const first=refresh();
  const MO=window?.MutationObserver||globalThis?.MutationObserver;
  const target=document.getElementById?.('random')||document.querySelector?.('#random')||document.body;
  if(typeof MO==='function'&&target){observer=new MO(()=>{try{refresh()}catch{}});try{observer.observe(target,{childList:true,subtree:true})}catch{observer=null}}
  return{...first,refresh,dispose(){disposed=true;try{observer?.disconnect?.()}catch{}},production_active:true};
}
module.exports={OWNER,IMPLEMENTATION_VERSION,activate,production_active:true,owner_status:'production',implementation_mode:'production-adapter',score_logic_changed:false,random_scoring_changed:false,legacy_removal_authorized:false};
