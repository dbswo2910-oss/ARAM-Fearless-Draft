'use strict';
const selection=require('./selection-state');
const dna=require('./dna');
const preview=require('./candidate-preview');
const render=require('./render-core');
const IMPLEMENTATION_VERSION='0.16-shadow';
function createPickOwner({document,state,pickReferenceModel=(()=>({})),candidateMeta=(()=>null),normalizeName=(v=>String(v||'').trim()),canonicalName=((v)=>String(v||'').trim()),text=(el=>String(el?.textContent||'').replace(/\s+/g,' ').trim()),dnaTarget=null,quickTarget=null,onPreviewChange=(()=>{}),...renderDeps}={}){
  if(!document||!state)throw new Error('document and state required');
  const selectionState=selection.createSelectionState({normalizeName,canonicalName,text});
  const dnaEngine=dna.createDnaEngine({normalizeName,candidateMeta,pickReferenceModel});
  const previewController=preview.createCandidatePreviewController({document,selectionState,dnaEngine,referenceModel:pickReferenceModel,dnaTarget:dnaTarget||(()=>document.querySelector?.('[data-canonical-random-dna-host]')||document.querySelector?.('#rpPickIntelV01589')),quickTarget:quickTarget||(()=>document.querySelector?.('[data-canonical-random-quick-host]')),onChange:onPreviewChange});
  function candidateProfile(x,name){const direct=x?.profile||{adPct:x?.adPct,apPct:x?.apPct};let meta=null;try{meta=candidateMeta(name)}catch{}return preview.projectCandidateDamageProfile({reference:pickReferenceModel()||{},meta,text:String(x?.reason||x?.direction||''),direct})}
  const renderer=render.createRenderCore({document,state,candidateProfile,candidatePreview:previewController,...renderDeps});
  function ensureShadowSurfaces(){const root=document.getElementById?.('random')||document.querySelector?.('#random');if(!root||!document.createElement)return false;let dnaHost=document.querySelector?.('[data-canonical-random-dna-host]');if(!dnaHost){dnaHost=document.createElement('section');dnaHost.setAttribute('data-canonical-random-dna-host','1');dnaHost.setAttribute('data-ui-role','random-candidate-dna-host');dnaHost.hidden=true;root.appendChild?.(dnaHost)}let quickHost=document.querySelector?.('[data-canonical-random-quick-host]');if(!quickHost){quickHost=document.createElement('section');quickHost.setAttribute('data-canonical-random-quick-host','1');quickHost.setAttribute('data-ui-role','random-quick-judgment-host');quickHost.hidden=true;root.appendChild?.(quickHost)}return true}
  function renderAll(){ensureShadowSurfaces();return renderer.render()}
  function dispose(){renderer.dispose()}
  return{render:renderAll,dispose,renderer,preview:previewController,selection:selectionState,dna:dnaEngine,ensureShadowSurfaces};
}
module.exports={IMPLEMENTATION_VERSION,createPickOwner,production_active:false,score_logic_changed:false,random_scoring_changed:false,owner_status:'shadow'};
