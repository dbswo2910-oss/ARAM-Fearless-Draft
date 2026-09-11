'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01590')}catch{prior=require('../v0.15.90/runtime-source-stability-v01590')}

function countOf(src,needle){return String(src).split(needle).length-1}
function normalizeQueueSizeV01591(value){const n=Number(value);return String(Number.isFinite(n)?Math.max(1,Math.min(5,Math.round(n))):1)}

function ensurePickWindowStylesV01591(){
  if(document.querySelector('#rpPickWindowStyleV01591'))return;
  const st=document.createElement('style');st.id='rpPickWindowStyleV01591';st.textContent=`
    /* v0.15.91 · approved pick reference fidelity + window safety */
    #random.rpPickReferenceV01590{width:100%!important;max-width:100%!important;min-width:0!important;overflow-x:hidden!important;box-sizing:border-box!important}
    #random.rpPickReferenceV01590 *,#random.rpPickReferenceV01590 *:before,#random.rpPickReferenceV01590 *:after{box-sizing:border-box}

    #random.rpPickReferenceV01590>.randomHero{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(300px,.72fr) auto!important;grid-template-areas:'title toolbar reset' 'sub toolbar reset'!important;column-gap:18px!important;row-gap:3px!important;align-items:center!important;padding:12px 14px!important;overflow:visible!important}
    #random.rpPickReferenceV01590>.randomHero>.title{grid-area:title!important;min-width:0!important;margin:0!important;line-height:1.2!important}
    #random.rpPickReferenceV01590>.randomHero>.sub{grid-area:sub!important;min-width:0!important;margin:0!important;line-height:1.35!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
    #random.rpPickReferenceV01590>.randomHero>.toolbar{grid-area:toolbar!important;display:grid!important;grid-template-columns:auto minmax(120px,1fr)!important;align-items:center!important;gap:7px 9px!important;width:100%!important;max-width:none!important;margin:0!important;min-width:0!important}
    #random.rpPickReferenceV01590>.randomHero>.toolbar>span:first-child{display:block!important;white-space:nowrap!important;font-size:11px!important;font-weight:900!important;color:#dbeeff!important;overflow:visible!important}
    #random.rpPickReferenceV01590>.randomHero #queueSize{display:block!important;width:100%!important;min-width:0!important;height:34px!important;margin:0!important;overflow:visible!important}
    #random.rpPickReferenceV01590>.randomHero #queueHint{grid-column:1/-1!important;display:block!important;min-width:0!important;font-size:9px!important;line-height:1.25!important;white-space:normal!important;overflow:visible!important}
    #random.rpPickReferenceV01590>.randomHero>.randomResetAll{grid-area:reset!important;position:static!important;inset:auto!important;align-self:center!important;margin:0!important;white-space:nowrap!important}

    #random.rpPickReferenceV01590 #randomInputAnchor{width:100%!important;max-width:100%!important;min-width:0!important;gap:8px!important;align-items:start!important}
    #random.rpPickReferenceV01590 .rp90LeftPanel,#random.rpPickReferenceV01590 .rp90CenterStack,#random.rpPickReferenceV01590 .rpPickIntelV01589{min-width:0!important;max-width:100%!important}
    #random.rpPickReferenceV01590 .rp90Top5Panel>.title{display:none!important}
    #random.rpPickReferenceV01590 .rp90Top5Panel{overflow:hidden!important;padding:7px!important}
    #random.rpPickReferenceV01590 .rp90Top5Head{min-height:28px!important;padding:0 2px 5px!important;margin-bottom:4px!important}
    #random.rpPickReferenceV01590 .rp90Top5Head b{font-size:11px!important}
    #random.rpPickReferenceV01590 .rp90Top5Head small{font-size:7px!important}

    #random.rpPickReferenceV01590 #comboResults{gap:3px!important}
    #random.rpPickReferenceV01590 #comboResults .combo{min-height:43px!important;border-radius:7px!important;overflow:hidden!important}
    #random.rpPickReferenceV01590 .rp90ComboView{display:grid!important;grid-template-columns:22px minmax(150px,.9fr) 54px minmax(74px,.48fr) minmax(150px,1.25fr) auto!important;align-items:center!important;gap:6px!important;min-height:43px!important;padding:4px 6px!important;cursor:default!important}
    #random.rpPickReferenceV01590 .rp90Rank{width:20px!important;height:20px!important;font-size:8px!important}
    #random.rpPickReferenceV01590 .rp90PickIdentity{gap:5px!important;min-width:0!important;pointer-events:auto!important}
    #random.rpPickReferenceV01590 .rp90MiniIcons img{width:20px!important;height:20px!important;border-radius:4px!important}
    #random.rpPickReferenceV01590 .rp90Name{font-size:10px!important}
    #random.rpPickReferenceV01590 .rp90Badges{margin-top:2px!important;gap:2px!important;flex-wrap:nowrap!important;overflow:hidden!important}
    #random.rpPickReferenceV01590 .rp90Badge{font-size:6px!important;padding:1px 4px!important;white-space:nowrap!important}
    #random.rpPickReferenceV01590 .rp90Score{font-size:11px!important}
    #random.rpPickReferenceV01590 .rp90Damage{font-size:6px!important;min-width:0!important}
    #random.rpPickReferenceV01590 .rp90DamageBar{height:4px!important;margin-top:2px!important}
    #random.rpPickReferenceV01590 .rp90Desc{font-size:7px!important;line-height:1.25!important;-webkit-line-clamp:1!important;white-space:nowrap!important;text-overflow:ellipsis!important;display:block!important;overflow:hidden!important}
    #random.rpPickReferenceV01590 .rp90Detail{font-size:7px!important;padding:4px 6px!important}

    #random.rpPickReferenceV01590 .rpPickIntelV01589{overflow:hidden!important}
    #random.rpPickReferenceV01590 .rp90DnaMetric{padding:5px 0!important}
    #random.rpPickReferenceV01590 .rp90DnaBar{height:5px!important}
    #random.rpPickReferenceV01590 .rp89IntelSection{margin-top:6px!important;padding-top:5px!important}

    #random.rpPickReferenceV01590 .rpInfoShellV01549{margin-top:8px!important;overflow:hidden!important}
    #random.rpPickReferenceV01590 .rpInfoHeadV01549{padding:7px 9px!important}
    #random.rpPickReferenceV01590 .rpTabPanelV01549{padding:7px!important}
    #random.rpPickReferenceV01590 .rpQuickGridV01549{grid-template-columns:1.05fr 1.02fr 1.3fr 1.12fr .82fr 1.18fr!important;gap:5px!important}
    #random.rpPickReferenceV01590 .rpQuickCardV01549{min-height:54px!important;padding:6px 8px!important}
    #random.rpPickReferenceV01590 .rpQuickCardV01549 span{font-size:7px!important;margin-bottom:3px!important}
    #random.rpPickReferenceV01590 .rpQuickCardV01549 b{font-size:9px!important}
    #random.rpPickReferenceV01590 .rpQuickCardV01549.conclusion b{font-size:11px!important}

    @media(min-width:1181px){
      #random.rpPickReferenceV01590 #randomInputAnchor{grid-template-columns:minmax(300px,.9fr) minmax(500px,1.34fr) minmax(205px,.42fr)!important}
      #random.rpPickReferenceV01590 .rp90LeftPanel{grid-column:1!important;grid-row:1!important}
      #random.rpPickReferenceV01590 .rp90CenterStack{grid-column:2!important;grid-row:1!important}
      #random.rpPickReferenceV01590 .rpPickIntelV01589{grid-column:3!important;grid-row:1!important;display:block!important}
      #random.rpPickReferenceV01590 .rp90Damage{display:block!important}
      #random.rpPickReferenceV01590 .rp90MiniIcons{display:flex!important}
    }
    @media(max-width:1320px) and (min-width:1181px){
      #random.rpPickReferenceV01590 #randomInputAnchor{grid-template-columns:minmax(285px,.86fr) minmax(455px,1.3fr) minmax(188px,.42fr)!important}
      #random.rpPickReferenceV01590 .rp90ComboView{grid-template-columns:21px minmax(130px,.86fr) 48px minmax(62px,.42fr) minmax(120px,1.1fr) auto!important;gap:4px!important}
      #random.rpPickReferenceV01590 .rp90MiniIcons img{width:18px!important;height:18px!important}
      #random.rpPickReferenceV01590 .rp90Desc{font-size:6.5px!important}
    }
    @media(max-width:1180px) and (min-width:861px){
      #random.rpPickReferenceV01590>.randomHero{grid-template-columns:minmax(0,1fr) auto!important;grid-template-areas:'title reset' 'sub sub' 'toolbar toolbar'!important;row-gap:7px!important}
      #random.rpPickReferenceV01590 #randomInputAnchor{grid-template-columns:minmax(285px,.86fr) minmax(0,1.35fr)!important}
      #random.rpPickReferenceV01590 .rp90LeftPanel{grid-column:1!important;grid-row:1!important}
      #random.rpPickReferenceV01590 .rp90CenterStack{grid-column:2!important;grid-row:1!important}
      #random.rpPickReferenceV01590 .rpPickIntelV01589{grid-column:1/-1!important;grid-row:2!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:5px!important}
      #random.rpPickReferenceV01590 .rp89IntelHead,#random.rpPickReferenceV01590 .rp89IntelSection{grid-column:1/-1!important}
      #random.rpPickReferenceV01590 .rp90DnaMetric,#random.rpPickReferenceV01590 .rp90DnaDamage{border:1px solid #173247!important;border-radius:6px!important;padding:6px!important}
      #random.rpPickReferenceV01590 .rp90ComboView{grid-template-columns:21px minmax(125px,.85fr) 48px minmax(130px,1.1fr) auto!important}
      #random.rpPickReferenceV01590 .rp90Damage{display:none!important}
      #random.rpPickReferenceV01590 .rpQuickGridV01549{grid-template-columns:repeat(3,minmax(0,1fr))!important}
    }
    @media(max-width:860px){
      #random.rpPickReferenceV01590>.randomHero{grid-template-columns:1fr auto!important;grid-template-areas:'title reset' 'sub sub' 'toolbar toolbar'!important;row-gap:7px!important}
      #random.rpPickReferenceV01590>.randomHero>.toolbar{grid-template-columns:auto minmax(0,1fr)!important}
      #random.rpPickReferenceV01590 #randomInputAnchor{grid-template-columns:1fr!important}
      #random.rpPickReferenceV01590 .rp90LeftPanel,#random.rpPickReferenceV01590 .rp90CenterStack,#random.rpPickReferenceV01590 .rpPickIntelV01589{grid-column:1!important;grid-row:auto!important}
      #random.rpPickReferenceV01590 .rpPickIntelV01589{display:block!important}
      #random.rpPickReferenceV01590 #poolInputs.poolGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      #random.rpPickReferenceV01590 .rp90ComboView{grid-template-columns:21px minmax(120px,1fr) 46px auto!important}
      #random.rpPickReferenceV01590 .rp90MiniIcons,#random.rpPickReferenceV01590 .rp90Damage,#random.rpPickReferenceV01590 .rp90Desc{display:none!important}
      #random.rpPickReferenceV01590 .rpQuickGridV01549{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    }
    @media(max-width:600px){
      #random.rpPickReferenceV01590>.randomHero{grid-template-columns:1fr!important;grid-template-areas:'title' 'sub' 'toolbar' 'reset'!important}
      #random.rpPickReferenceV01590>.randomHero>.randomResetAll{justify-self:stretch!important}
      #random.rpPickReferenceV01590 #poolInputs.poolGrid{grid-template-columns:1fr!important}
      #random.rpPickReferenceV01590 .rpQuickGridV01549{grid-template-columns:1fr!important}
    }
  `;document.head.appendChild(st);
}

function restoreNativePickStructureV01591(r){
  const input=r?.input||document.querySelector('#randomInputAnchor');
  if(!input)return;
  const pool=r?.poolPanel||document.querySelector('#poolInputs')?.closest('.panel');
  const recommend=r?.recommend||document.querySelector('#randomRecommendAnchor');
  const result=r?.resultPanel||document.querySelector('#comboResults')?.closest('.panel');
  const detail=document.querySelector('#comboDetail')?.closest('.panel');
  const intel=document.querySelector('#rpPickIntelV01589');
  const center=input.querySelector(':scope>.rp90CenterStack');
  if(pool&&pool.parentElement!==input)input.insertBefore(pool,intel||center||null);
  if(recommend&&result&&result.parentElement!==recommend)recommend.insertBefore(result,detail||recommend.firstChild||null);
  if(center&&center.children.length===0)center.remove();
}

function bindQueueSelectV01591(r){
  const q=document.querySelector('#queueSize');if(!q||q.dataset.rp91Bound==='1')return;
  const original=window.randomQueueChanged;
  q.removeAttribute('onchange');q.dataset.rp91Bound='1';q.value=normalizeQueueSizeV01591(q.value);
  q.addEventListener('change',()=>{
    q.value=normalizeQueueSizeV01591(q.value);
    restoreNativePickStructureV01591(r);
    let failed=false;
    try{if(typeof original==='function')original.call(q);else failed=true}catch(e){failed=true;console.warn('[v0.15.91] queue change recovered',e)}
    if(failed){
      try{window.renderRandomInputs?.()}catch{}
      try{window.renderExternalCheck?.()}catch{}
      try{window.renderRandomAnalysis?.()}catch{}
    }
    setTimeout(()=>{
      try{refreshPickWindowV01591(r)}catch(e){console.warn('[v0.15.91] post queue refresh failed',e)}
      try{window.aramRandomPracticeFocusV01549?.refresh?.()}catch{}
    },0);
  });
}

function guardTop5InteractionV01591(r){
  const results=r?.results||document.querySelector('#comboResults');if(!results)return;
  results.querySelectorAll('.rp90ComboView').forEach(view=>{
    if(view.dataset.rp91Guard==='1')return;view.dataset.rp91Guard='1';
    view.addEventListener('click',e=>{if(e.target?.closest?.('.rp90Detail'))return;e.preventDefault();e.stopPropagation()},true);
    view.addEventListener('dblclick',e=>{if(e.target?.closest?.('.rp90Detail'))return;e.preventDefault();e.stopPropagation()},true);
  });
}

function refreshPickWindowV01591(r){
  if(!r?.root)return;
  ensurePickWindowStylesV01591();
  bindQueueSelectV01591(r);
  guardTop5InteractionV01591(r);
}

function patchRandomPracticeV01591(src){
  const signature='function ensurePickWindowStylesV01591()';if(src.includes(signature))return src;
  const insertAnchor='  function stageHead(id,title,sub,before){';
  if(countOf(src,insertAnchor)!==1)throw new Error(`v0.15.91 source contract mismatch stageHead count=${countOf(src,insertAnchor)}`);
  const helpers=[normalizeQueueSizeV01591,ensurePickWindowStylesV01591,restoreNativePickStructureV01591,bindQueueSelectV01591,guardTop5InteractionV01591,refreshPickWindowV01591].map(fn=>'  '+fn.toString().replace(/\n/g,'\n  ')).join('\n\n')+'\n\n';
  src=src.replace(insertAnchor,helpers+insertAnchor);
  const hook='    refreshPickReferenceV01590(r);';
  const replacement='    refreshPickReferenceV01590(r);\n    refreshPickWindowV01591(r);';
  if(countOf(src,hook)!==1)throw new Error(`v0.15.91 source contract mismatch refresh hook count=${countOf(src,hook)}`);
  return src.replace(hook,replacement);
}

function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-practice-focus-v01549.js')src=patchRandomPracticeV01591(src);
  return src;
}

module.exports={
  patchRuntimeSource,
  normalizeQueueSizeV01591,
  score_logic_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  route_adoption_changed:prior.route_adoption_changed===true,
  random_pick_reference_layout_changed:prior.random_pick_reference_layout_changed===true,
  random_pick_window_fix_changed:true,
  policy_version:'0.15.91'
};
