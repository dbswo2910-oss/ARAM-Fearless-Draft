'use strict';
const assert=require('assert');
const C=require('./collector-core-v031');
function match(id,ps,t){return{gameId:id,queueId:450,gameCreation:t,participants:ps.map((p,i)=>({puuid:p,teamId:i<5?100:200,win:i<5}))}}
const seedPlayers=Array.from({length:160},(_,i)=>`s${i+1}`),seed=[];let next=0;
// Synthetic 20-match / 160-player seed with ten repeat hubs.
for(let i=0;i<20;i++){const ps=[`s${(i%10)+1}`,`s${((i+1)%10)+1}`];if(i<10)ps.push(`s${((i+2)%10)+1}`);while(ps.length<10)ps.push(seedPlayers[10+(next++%150)]);seed.push(match(`seed-${i}`,ps,1000+i))}
// 139 more valid 5v5 matches create a 159-match checkpoint. b1..b40 recur, filler identities are singletons.
const current=seed.slice();
for(let i=0;i<139;i++){const target=i<20?'s1':i<33?'s2':i<36?'s11':`b${(i%40)+1}`;const ps=[target];while(ps.length<10)ps.push(`x${i}-${ps.length}`);current.push(match(`b-${i}`,ps,2000+i))}
const cp={seed_matches:seed,matches:current,completed_puuids:[],completed_puuids_v031:[]};
assert.equal(C.kpis(cp.matches).matches,159,'checkpoint fixture must resume at 159 accepted matches');
const saturated=C.scoreFeature({source_pool:'phase_a_seed',current_observation_count:20,already_observed_recent_matches:20,repeat_neighbor_ratio:.5,degree_norm:.5},{historyLimit:20,skipHeadroomLTE:2,skipDuplicateRatioGTE:.8});
assert.equal(saturated.expected_new_headroom,0);assert.equal(saturated.skip,true,'20/20 saturated candidate must skip');
const shallow=C.scoreFeature({source_pool:'phase_a_seed',current_observation_count:1,already_observed_recent_matches:1,repeat_neighbor_ratio:.5,degree_norm:.5},{historyLimit:20,skipHeadroomLTE:2,skipDuplicateRatioGTE:.8});
assert.equal(shallow.expected_new_headroom,19);assert(shallow.priority>saturated.priority,'shallow seed should outrank saturated seed');
const pool=C.buildCandidatePool(cp,{historyLimit:20,skipHeadroomLTE:2,skipDuplicateRatioGTE:.8});
assert(pool.length>0);assert(pool.some(x=>x.source_pool==='phase_b_repeat'&&x.current_observation_count>=2),'Pool 2 repeated Phase-B player fixture missing');assert(pool.every(x=>!(x.source_pool==='phase_b_repeat'&&x.current_observation_count<2)),'new Phase-B singletons must not enter candidate pool');assert(pool.every(x=>x.expected_new_headroom>2&&x.expected_duplicate_ratio<.8));
// B1-pattern counterfactual: saturated old top candidate must collapse while shallow candidates rise.
const fixture=[
 {priority:7.409,priority_components:{uncertainty_reduction_value:.559016994,component_density_value:2.75},duplicates:20,new_unique_matches:0,information_gain:-10,retries:0},
 {priority:6.533,priority_components:{uncertainty_reduction_value:.693375245,component_density_value:.943},duplicates:13,new_unique_matches:7,information_gain:-4.2,retries:0},
 {priority:5.323,priority_components:{uncertainty_reduction_value:1.443375673,component_density_value:.208},duplicates:3,new_unique_matches:17,information_gain:14.1,retries:0},
 {priority:4.976,priority_components:{uncertainty_reduction_value:1.767766953,component_density_value:.151},duplicates:2,new_unique_matches:18,information_gain:61.6,retries:0}
];
const cf=C.counterfactualB1(fixture);assert.equal(cf[0].skip,true);assert(cf[3].new_priority>cf[0].new_priority);assert(cf[2].new_priority>cf[1].new_priority);
const totals=C.phaseTotals([{requests:2,new_unique_matches:18,fetched_matches:20,duplicates:2,new_players:100,already_known_player_appearances:30,threshold_crossings:{two_plus:5,five_plus:1,ten_plus:1},information_gain:40,density_gain:44}]);assert.equal(totals.density_gain_per_request,22);assert.equal(totals.new_unique_matches_per_request,9);
console.log('ARAM Rating v0.3.1 sampling fixture: SUCCESS · saturation/headroom/pools/159-resume/counterfactual');
