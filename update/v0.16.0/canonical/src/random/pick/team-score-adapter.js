'use strict';
const crypto=require('crypto');
const IMPLEMENTATION_VERSION='0.16-shadow';
function fnSource(fn){try{return Function.prototype.toString.call(fn)}catch{return''}}
function sha256(s){return crypto.createHash('sha256').update(String(s||''),'utf8').digest('hex')}
function describeLegacyTeamScore(fn,{includeSource=false}={}){if(typeof fn!=='function')return{available:false,sha256:null,length:0,native:false};const source=fnSource(fn),out={available:true,sha256:sha256(source),length:source.length,native:/\[native code\]/.test(source)};if(includeSource)out.source=source;return out}
function createLegacyTeamScoreAdapter({resolveLegacy=(()=>globalThis.teamScore)}={}){
  function getLegacy(){const fn=resolveLegacy();if(typeof fn!=='function')throw new Error('legacy teamScore is not available in this runtime');return fn}
  function score(names,modes){return getLegacy()(names,modes)}
  function describe(options){return describeLegacyTeamScore(getLegacy(),options)}
  function evaluate(fixtures=[]){return fixtures.map((f,i)=>({id:f?.id??i,names:Array.isArray(f?.names)?f.names:[],modes:f?.modes&&typeof f.modes==='object'?f.modes:{},result:score(Array.isArray(f?.names)?f.names:[],f?.modes&&typeof f.modes==='object'?f.modes:{})}))}
  return{score,describe,evaluate};
}
module.exports={IMPLEMENTATION_VERSION,fnSource,sha256,describeLegacyTeamScore,createLegacyTeamScoreAdapter,production_active:false,scoring_math_owned:false,score_logic_changed:false,random_scoring_changed:false,requires_real_installed_baseline_source:true};
