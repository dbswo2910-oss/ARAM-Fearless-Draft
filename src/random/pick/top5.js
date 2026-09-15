'use strict';
const IMPLEMENTATION_VERSION='0.16-shadow';
const DEFAULT_CACHE_LIMIT=6500;
function modeKey(names,modes){const xs=(names||[]).filter(Boolean),mm=xs.map(n=>`${n}:${String(modes?.[n]||'자동')}`).join('|');return xs.join('\u0001')+'\u0002'+mm}
function createScoreResolver(teamScore,{cacheLimit=DEFAULT_CACHE_LIMIT}={}){
  if(typeof teamScore!=='function')throw new Error('teamScore function required');const cache=new Map();
  function scoreTeam(names,modes){const k=modeKey(names,modes);if(cache.has(k))return cache.get(k);const value=teamScore(names,modes);cache.set(k,value);if(cache.size>cacheLimit)cache.clear();return value}
  return{scoreTeam,cache,clear:()=>cache.clear(),size:()=>cache.size}
}
function comboCmp(a,b){return b.score-a.score||a.party.join('|').localeCompare(b.party.join('|'),'ko')}
function makeCombo(plan,sel,{scoreTeam,modes}={}){if(typeof scoreTeam!=='function')throw new Error('scoreTeam function required');const party=[...(plan.locked||[]),...(sel||[])],names=[...(plan.external||[]),...party],ts=scoreTeam(names,modes||{});return{sel:[...(sel||[])],party,locked:[...(plan.locked||[])],names,score:ts.s,direction:ts.direction,reason:ts.reason,warning:ts.warning,structure:ts.structure,parts:ts.parts,pair:ts.pair,totalCombos:plan.totalCombos,provisional:plan.provisional}}
function* comboIter(arr,k,start=0,p=[]){if(p.length===k){yield [...p];return}for(let i=start;i<=arr.length-(k-p.length);i++){p.push(arr[i]);yield* comboIter(arr,k,i+1,p);p.pop()}}
function enumerateTop5(plan,{teamScore,modes={}}={}){
  if(!plan||typeof plan!=='object')throw new Error('plan required');if(typeof teamScore!=='function')throw new Error('teamScore function required');const resolver=createScoreResolver(teamScore),top=[];
  if((plan.duplicates||[]).length)return{status:'duplicate',top:[],processed:0,duplicates:[...plan.duplicates]};if((plan.pool||[]).length<Number(plan.needed||0))return{status:'short',top:[],processed:0};if(Number(plan.needed||0)===0)return{status:'ok',top:[makeCombo(plan,[],{scoreTeam:resolver.scoreTeam,modes})],processed:1,cacheSize:resolver.size()};
  let processed=0;for(const sel of comboIter(plan.pool||[],Number(plan.needed||0))){const row=makeCombo(plan,sel,{scoreTeam:resolver.scoreTeam,modes});processed++;top.push(row);top.sort(comboCmp);if(top.length>5)top.pop()}
  return{status:'ok',top:top.sort(comboCmp),processed,cacheSize:resolver.size()};
}
module.exports={IMPLEMENTATION_VERSION,DEFAULT_CACHE_LIMIT,modeKey,createScoreResolver,comboCmp,makeCombo,comboIter,enumerateTop5,production_active:false,score_logic_changed:false,random_scoring_changed:false};
