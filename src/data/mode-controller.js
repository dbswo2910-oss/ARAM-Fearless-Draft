'use strict';
const workspace=require('./workspace');
const IMPLEMENTATION_VERSION='0.16-shadow';
const PRESENTATION='0.16-canonical-shadow';
const ROLE_MAP=Object.freeze({view:'data-root',host:'data-workspace-host',card:'data-card',nav:'data-nav',tierBranch:'data-tier-branch',detailBranch:'data-detail-branch',detailShell:'data-detail-shell',patchBody:'data-patch-notes'});
function toggleClass(el,name,on){el?.classList?.toggle?.(name,!!on)}
function claim(el,role){if(!el)return false;el.dataset=el.dataset||{};el.dataset.uiRole=role;return true}
function buttonMode(btn){return btn?.dataset?.v115Tab||btn?.dataset?.dataMode||''}
function applyNavState(nav,mode){if(!nav?.querySelectorAll)return;for(const b of nav.querySelectorAll('[data-v115-tab],[data-data-mode]')||[])b.classList?.toggle?.('active',buttonMode(b)===mode)}
function syncDetailShell(parts,mode){const shell=parts?.detailShell;if(!shell)return false;claim(shell,ROLE_MAP.detailShell);if(mode==='patch'){shell.hidden=true;shell.setAttribute?.('aria-hidden','true');shell.style?.setProperty?.('display','none','important')}else{shell.hidden=false;shell.removeAttribute?.('aria-hidden');shell.style?.removeProperty?.('display')}return true}
function applyDataMode(parts,{requested,querySelector=((sel,root)=>root?.querySelector?.(sel)||null),presentation=PRESENTATION}={}){
  const p=parts||{};if(!p.view||!p.card||!p.host||!p.tierBranch||!p.detailBranch)return{ok:false,reason:'unresolved-workspace'};
  const mode=workspace.resolveDataMode(requested,p.card,{querySelector});
  toggleClass(p.view,'data115View',true);toggleClass(p.host,'data115DataHost',true);toggleClass(p.detailBranch,'data115DetailBranch',true);toggleClass(p.tierBranch,'data115TierBranch',true);toggleClass(p.view,'data115PatchMode',mode==='patch');
  claim(p.view,ROLE_MAP.view);claim(p.host,ROLE_MAP.host);claim(p.card,ROLE_MAP.card);claim(p.tierBranch,ROLE_MAP.tierBranch);claim(p.detailBranch,ROLE_MAP.detailBranch);if(p.nav)claim(p.nav,ROLE_MAP.nav);if(p.patchBody)claim(p.patchBody,ROLE_MAP.patchBody);
  p.view.dataset=p.view.dataset||{};p.view.dataset.data115Mode=mode;p.view.dataset.dataPresentationRevision=presentation;p.view.dataset.aramSingleOwnerBaseline='canonical-v016-shadow';
  applyNavState(p.nav,mode);syncDetailShell(p,mode);
  return{ok:true,mode,presentation,roles:{...ROLE_MAP},genericShellHidden:!!p.detailShell&&mode==='patch'};
}
module.exports={IMPLEMENTATION_VERSION,PRESENTATION,ROLE_MAP,toggleClass,claim,applyNavState,syncDetailShell,applyDataMode,production_active:false,score_logic_changed:false,random_scoring_changed:false,observer_required:false};
