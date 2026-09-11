'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01585')}catch{prior=require('../v0.15.85/runtime-source-stability-v01585')}
let styleSrc,logic;
try{styleSrc=require('./build-analysis-style-v01586');logic=require('./build-analysis-logic-v01586')}catch{styleSrc=require('../v0.15.86/build-analysis-style-v01586');logic=require('../v0.15.86/build-analysis-logic-v01586')}
function countOf(src,needle){return String(src).split(needle).length-1}
function insertBefore(src,anchor,text,signature,label){if(src.includes(signature))return src;const n=countOf(src,anchor);if(n!==1)throw new Error(`v0.15.86 source contract mismatch ${label} count=${n}`);return src.replace(anchor,text+anchor)}
function replaceRange(src,start,end,replacement,signature,label){if(src.includes(signature))return src;const a=src.indexOf(start),b=a>=0?src.indexOf(end,a+start.length):-1;if(a<0||b<0||src.indexOf(start,a+1)>=0)throw new Error(`v0.15.86 source contract mismatch ${label}`);return src.slice(0,a)+replacement+src.slice(b)}
function replaceExact(src,from,to,label){if(src.includes(to))return src;const n=countOf(src,from);if(n!==1)throw new Error(`v0.15.86 source contract mismatch ${label} count=${n}`);return src.replace(from,to)}
function patchCoach(src){src=insertBefore(src,'  function renderBuild(m){',styleSrc+logic.helpers,'function ensureBuildAnalysisStylesV01586()','build analysis helpers');src=replaceRange(src,'  function renderBuild(m){','  function detailThreats(m){',logic.render,'기본 통계 빌드와 현재 상황 빌드를 함께 비교','build analysis render');return src}
function patchShop(src){return replaceExact(src,"    let box=old;if(!box){box=document.createElement('div');box.id='riShopPlannerV01553';compare.parentElement.insertBefore(box,compare)}","    const slot=$('.ri86ShopSlot',shell);let box=old;if(!box){box=document.createElement('div');box.id='riShopPlannerV01553';if(slot)slot.appendChild(box);else compare.parentElement.insertBefore(box,compare)}else if(slot&&box.parentElement!==slot)slot.appendChild(box)",'shop planner build-analysis slot')}
function patchRuntimeSource(file,input){let src=prior.patchRuntimeSource(file,input);if(file==='random-ingame-coach-v01550.js')src=patchCoach(src);else if(file==='random-ingame-shop-v01553.js')src=patchShop(src);return src}
module.exports={patchRuntimeSource,score_logic_changed:false,item_recommendation_logic_changed:false,ingame_hud_changed:true,champion_visuals_changed:true,reference_layout_changed:true,fight_status_scale_changed:true,build_analysis_changed:true,policy_version:'0.15.86'};
