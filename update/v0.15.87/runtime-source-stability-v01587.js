'use strict';
let prior;
try{prior=require('./runtime-source-stability-v01586')}catch{prior=require('../v0.15.86/runtime-source-stability-v01586')}
let styleSrc,live,gateSrc;
try{styleSrc=require('./live-route-style-v01587');live=require('./live-route-logic-v01587');gateSrc=require('./route-adoption-gate-v01587')}catch{styleSrc=require('../v0.15.87/live-route-style-v01587');live=require('../v0.15.87/live-route-logic-v01587');gateSrc=require('../v0.15.87/route-adoption-gate-v01587')}
function countOf(src,needle){return String(src).split(needle).length-1}
function insertBefore(src,anchor,text,signature,label){if(src.includes(signature))return src;const n=countOf(src,anchor);if(n!==1)throw new Error(`v0.15.87 source contract mismatch ${label} count=${n}`);return src.replace(anchor,text+anchor)}
function replaceRange(src,start,end,replacement,signature,label){if(src.includes(signature))return src;const a=src.indexOf(start),b=a>=0?src.indexOf(end,a+start.length):-1;if(a<0||b<0||src.indexOf(start,a+1)>=0)throw new Error(`v0.15.87 source contract mismatch ${label}`);return src.slice(0,a)+replacement+src.slice(b)}
function patchCoach(src){
  src=replaceRange(src,'  function buildGateV01581(available,stat,ctx,threat){','\n\n  function buildRealModel(){',gateSrc,'function routeProfileV01587(ctx,stat)','route-adoption recommendation gate');
  src=insertBefore(src,'  function renderLive(m){',styleSrc+live.helpers,'function ensureLiveRouteStylesV01587()','live route helpers');
  src=replaceRange(src,'  function renderLive(m){','\n\n  // v0.15.86 — dedicated Build analysis:',live.render,'실시간 빌드 갱신','live route render');
  return src;
}
function patchRuntimeSource(file,input){let src=prior.patchRuntimeSource(file,input);if(file==='random-ingame-coach-v01550.js')src=patchCoach(src);return src}
module.exports={patchRuntimeSource,score_logic_changed:false,item_recommendation_logic_changed:true,route_adoption_changed:true,ingame_hud_changed:true,champion_visuals_changed:true,reference_layout_changed:true,fight_status_scale_changed:true,build_analysis_changed:true,policy_version:'0.15.87'};
