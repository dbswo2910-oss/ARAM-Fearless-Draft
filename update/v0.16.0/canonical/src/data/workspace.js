'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
function directBranch(host,node){if(!host||!node||!host.contains?.(node))return null;let x=node;while(x?.parentElement&&x.parentElement!==host)x=x.parentElement;return x?.parentElement===host?x:null}
function nearestCommonWithin(view,a,b){if(!view||!a||!b||!view.contains?.(a)||!view.contains?.(b))return null;let p=a.parentElement;while(p&&p!==view&&!p.contains?.(b))p=p.parentElement;if(!p||!view.contains?.(p)||!p.contains?.(b))return null;return p}
function currentDataMode(card,{querySelector=((sel,root)=>root?.querySelector?.(sel)||null)}={}){if(card?.classList?.contains?.('dataHubPatchModeV01599'))return'patch';const original=querySelector('#dataHubNavV01599',card);if(original?.querySelector?.('[data-dh99-tab="patch"].active'))return'patch';return'tier'}
function resolveDataMode(requested,card,options){return requested==='patch'||requested==='tier'?requested:currentDataMode(card,options)}
function claimRole(el,role){if(!el||!role)return false;el.dataset=el.dataset||{};el.dataset.uiRole=String(role);return true}
module.exports={IMPLEMENTATION_VERSION,directBranch,nearestCommonWithin,currentDataMode,resolveDataMode,claimRole,production_active:false,score_logic_changed:false,random_scoring_changed:false};
