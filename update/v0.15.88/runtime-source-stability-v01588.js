'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01587')}catch{prior=require('../v0.15.87/runtime-source-stability-v01587')}

function countOf(src,needle){return String(src).split(needle).length-1}
function dedupeTop1LabelV01588(value){
  const raw=String(value??'').replace(/\s+/g,' ').trim();
  if(!raw)return raw;
  const compact=s=>String(s??'').replace(/\s+/g,'').trim();
  for(let i=1;i<raw.length;i++){
    const left=raw.slice(0,i).trim(),right=raw.slice(i).trim();
    if(left&&right&&compact(left)===compact(right))return left;
  }
  return raw;
}
function patchRandomPractice(src){
  const signature='function dedupeTop1LabelV01588(value)';
  if(src.includes(signature))return src;
  const anchor='  function topCombo(){';
  if(countOf(src,anchor)!==1)throw new Error(`v0.15.88 source contract mismatch topCombo count=${countOf(src,anchor)}`);
  const helper=`  ${dedupeTop1LabelV01588.toString()}\n\n`;
  src=src.replace(anchor,helper+anchor);
  const oldLine="    name=name.replace(/🔒\\s*고정.*$/,'').replace(/\\s+/g,' ').trim();";
  const newLine="    name=dedupeTop1LabelV01588(name.replace(/🔒\\s*고정.*$/,'').replace(/\\s+/g,' ').trim());";
  if(countOf(src,oldLine)!==1)throw new Error(`v0.15.88 source contract mismatch TOP1 label normalization count=${countOf(src,oldLine)}`);
  return src.replace(oldLine,newLine);
}
function patchRuntimeSource(file,input){
  let src=prior.patchRuntimeSource(file,input);
  if(file==='random-practice-focus-v01549.js')src=patchRandomPractice(src);
  return src;
}
module.exports={
  patchRuntimeSource,
  dedupeTop1LabelV01588,
  score_logic_changed:false,
  item_recommendation_logic_changed:prior.item_recommendation_logic_changed===true,
  route_adoption_changed:prior.route_adoption_changed===true,
  ingame_hud_changed:prior.ingame_hud_changed===true,
  champion_visuals_changed:prior.champion_visuals_changed===true,
  reference_layout_changed:prior.reference_layout_changed===true,
  fight_status_scale_changed:prior.fight_status_scale_changed===true,
  build_analysis_changed:prior.build_analysis_changed===true,
  random_top1_label_dedupe_changed:true,
  policy_version:'0.15.88'
};
