'use strict';
const researchEngine=require('../../../update/v0.15.129/rating-engine-v01');
const networkBt=require('./network-bt');

const MODELS=Object.freeze({
  'research-v032-elo-shadow':{name:'elo',status:'SHADOW',kind:'sequential',factory:()=>new researchEngine.TeamElo()},
  'research-v032-glicko-shadow':{name:'glicko',status:'SHADOW',kind:'sequential',factory:()=>new researchEngine.TeamGlicko()},
  'research-v032-trueskill-shadow':{name:'trueskill_family',status:'SHADOW',kind:'sequential',factory:()=>new researchEngine.TrueSkillTeam()},
  'research-v2-network-bt-shadow':{
    name:'network_bt',status:'SHADOW',kind:'batch',
    factory:()=>new networkBt.NetworkBradleyTerry({
      playerPriorSd:300,
      championPriorSd:80,
      championWeight:1,
      halfLifeDays:null,
      iterations:120,
      learningRate:0.045,
      uncertaintyInflation:1.35
    })
  }
});

function createEstimator(modelVersion='research-v032-elo-shadow'){
  const spec=MODELS[modelVersion];
  if(!spec)throw new Error(`unknown rating model version ${modelVersion}`);
  let fittedKey=null,fittedModel=null;

  return Object.freeze({
    modelVersion,
    modelName:spec.name,
    status:spec.status,
    productionActive:false,
    async estimate({puuid,matches}){
      const id=String(puuid||'');
      if(!id)throw new Error('puuid required');
      const rows=(Array.isArray(matches)?matches:[]).slice().sort((a,b)=>a.timestamp-b.timestamp||a.matchId.localeCompare(b.matchId));
      const targetGames=rows.filter(m=>Array.isArray(m?.teamA)&&Array.isArray(m?.teamB)&&(m.teamA.includes(id)||m.teamB.includes(id))).length;
      if(!targetGames)return{status:'INSUFFICIENT_DATA',rating:null,uncertainty:null,games:0,modelName:spec.name,modelStatus:spec.status};

      let model;
      if(spec.kind==='batch'){
        const probe=spec.factory();
        const key=networkBt.cacheKey(rows,typeof probe.config==='function'?probe.config():{});
        if(key!==fittedKey||!fittedModel){probe.fit(rows);fittedModel=probe;fittedKey=key}
        model=fittedModel;
      }else{
        model=spec.factory();
        for(const m of rows){
          if(!Array.isArray(m?.teamA)||!Array.isArray(m?.teamB)||m.teamA.length!==5||m.teamB.length!==5)continue;
          model.update(m.teamA,m.teamB,!!m.teamAWin);
        }
      }

      const view=model.view(id);
      return{
        status:'ESTIMATED_SHADOW',
        rating:view.rating,
        uncertainty:view.uncertainty,
        games:view.games,
        uncertaintyKind:view.uncertainty_kind,
        details:view.raw||null,
        modelName:spec.name,
        modelStatus:spec.status
      };
    }
  });
}

module.exports={MODELS,createEstimator,production_active:false,automatic_promotion:false};
