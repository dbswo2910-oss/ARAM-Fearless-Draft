'use strict';
const researchEngine=require('../../../update/v0.15.129/rating-engine-v01');
const MODELS=Object.freeze({
  'research-v032-elo-shadow':{name:'elo',status:'SHADOW',factory:()=>new researchEngine.TeamElo()},
  'research-v032-glicko-shadow':{name:'glicko',status:'SHADOW',factory:()=>new researchEngine.TeamGlicko()},
  'research-v032-trueskill-shadow':{name:'trueskill_family',status:'SHADOW',factory:()=>new researchEngine.TrueSkillTeam()}
});
function createEstimator(modelVersion='research-v032-elo-shadow'){
  const spec=MODELS[modelVersion];if(!spec)throw new Error(`unknown rating model version ${modelVersion}`);
  return Object.freeze({modelVersion,modelName:spec.name,status:spec.status,productionActive:false,async estimate({puuid,matches}){const id=String(puuid||'');if(!id)throw new Error('puuid required');const rows=(Array.isArray(matches)?matches:[]).slice().sort((a,b)=>a.timestamp-b.timestamp||a.matchId.localeCompare(b.matchId));const model=spec.factory();let targetGames=0;for(const m of rows){if(!Array.isArray(m?.teamA)||!Array.isArray(m?.teamB)||m.teamA.length!==5||m.teamB.length!==5)continue;model.update(m.teamA,m.teamB,!!m.teamAWin);if(m.teamA.includes(id)||m.teamB.includes(id))targetGames++}if(!targetGames)return{status:'INSUFFICIENT_DATA',rating:null,uncertainty:null,games:0};const view=model.view(id);return{status:'ESTIMATED_SHADOW',rating:view.rating,uncertainty:view.uncertainty,games:view.games,uncertaintyKind:view.uncertainty_kind,modelName:spec.name,modelStatus:spec.status}}});
}
module.exports={MODELS,createEstimator,production_active:false,automatic_promotion:false};