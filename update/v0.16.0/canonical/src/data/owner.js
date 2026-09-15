'use strict';
const workspace=require('./workspace');
const mode=require('./mode-controller');
const navigation=require('./navigation');
const patchRenderer=require('./patch-notes-render');
const IMPLEMENTATION_VERSION='0.16-shadow';
function structuralDetailShell(detailBranch,card){if(!detailBranch)return null;const direct=detailBranch.querySelector?.(':scope > .panel > .title')||detailBranch.querySelector?.(':scope > .title');if(direct)return direct;const panel=card?.closest?.('.panel');return panel?.querySelector?.(':scope > .title')||null}
function resolveParts(document){const view=document?.getElementById?.('data')||document?.querySelector?.('#data'),card=document?.getElementById?.('dataCard')||document?.querySelector?.('#dataCard');if(!view||!card||!view.contains?.(card))return null;const host=card.closest?.('.grid2')||card.parentElement;if(!host||!view.contains?.(host))return null;const detailBranch=workspace.directBranch(host,card)||card,tierBranch=[...(host.children||[])].find(x=>x!==detailBranch&&x.id!==navigation.NAV_ID&&x.id!=='dataHubTopNavV015115')||null;let patchBody=card.querySelector?.('#dataPatchNotesV01599')||document.querySelector?.('#dataPatchNotesV01599');const detailShell=structuralDetailShell(detailBranch,card);return{view,card,host,detailBranch,tierBranch,patchBody,detailShell,nav:null}}
function ensurePatchBody(document,parts){if(parts.patchBody)return parts.patchBody;if(!document?.createElement)return null;const body=document.createElement('section');body.id='dataPatchNotesV01599';body.dataset=body.dataset||{};body.dataset.uiRole='data-patch-notes';body.hidden=true;parts.card.appendChild?.(body);parts.patchBody=body;return body}
function createDataOwner({document,patchModel=null,patchLabel=null,champUrl=(()=>''),itemUrl=(()=>''),onMode=(()=>{})}={}){
  if(!document)throw new Error('document required');let parts=null,nav=null,current='tier',disposed=false;
  function syncParts(){parts=resolveParts(document);if(!parts)return null;ensurePatchBody(document,parts);parts.nav=nav;return parts}
  function applyVisibility(p,m){if(p.tierBranch)p.tierBranch.hidden=m==='patch';if(p.patchBody)p.patchBody.hidden=m!=='patch';if(p.detailBranch)p.detailBranch.hidden=false;return true}
  function setMode(next){if(disposed)return{ok:false,reason:'disposed'};const p=syncParts();if(!p)return{ok:false,reason:'unresolved-workspace'};const requested=next==='patch'||next==='tier'?next:current;const result=mode.applyDataMode(p,{requested});if(!result.ok)return result;current=result.mode;applyVisibility(p,current);onMode(current);return result}
  function ensureNav(){const p=syncParts();if(!p)return null;if(!nav){nav=navigation.createNavigation(document,{patchLabel:patchLabel||patchModel?.version||'패치',onMode:setMode})}const navHost=p.host.parentElement||p.view;navigation.mountNavigation(navHost,nav);p.nav=nav;return nav}
  function renderPatch(model=patchModel){const p=syncParts();if(!p)return false;if(!model)return !!p.patchBody;patchModel=model;return patchRenderer.renderInto(p.patchBody,patchModel,{champUrl,itemUrl})}
  function render({mode:requested=current,patch=patchModel}={}){if(disposed)return false;const p=syncParts();if(!p)return false;ensureNav();if(patch)renderPatch(patch);setMode(requested);p.view.dataset=p.view.dataset||{};p.view.dataset.aramSingleOwnerBaseline='canonical-v016-shadow';p.view.dataset.dataPresentationRevision='0.16-canonical-shadow';return true}
  function dispose(){if(nav?.remove)nav.remove();nav=null;disposed=true}
  return{render,setMode,renderPatch,resolve:()=>syncParts(),ensureNav,dispose,get mode(){return current}};
}
module.exports={IMPLEMENTATION_VERSION,structuralDetailShell,resolveParts,ensurePatchBody,createDataOwner,production_active:false,score_logic_changed:false,random_scoring_changed:false,owner_status:'shadow',semantic_sweep_required:false};
