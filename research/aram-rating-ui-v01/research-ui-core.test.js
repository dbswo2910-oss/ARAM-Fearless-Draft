'use strict';
const assert=require('assert');
const E=require('./rating-engine-v01.js');
const U=require('./research-ui-core.js');
function player(puuid,teamId,win){return{puuid,teamId,win,stats:{win}}}
function fixture(){
  const rows=[];
  for(let i=0;i<30;i++){
    const win=i%2===0,ps=[];
    const ids=[];
    if(i<25)ids.push('PLAYER_A');
    if(i===29)ids.push('PLAYER_B');
    let j=0;while(ids.length<10){const id=`N_${i}_${j++}`;if(!ids.includes(id))ids.push(id)}
    ids.forEach((id,k)=>ps.push(player(id,k<5?100:200,k<5?win:!win)));
    rows.push({gameId:String(900000+i),queueId:450,gameVersion:'16.18.1.1',gameCreation:1700000000000+i*60000,participants:ps});
  }
  return rows;
}
const run=E.buildLatestRun(fixture(),{phase:'B1',status:'phase_complete',sampling_version:'fixture-v0'});
assert.equal(run.selection.status,'insufficient_real_data');
assert.equal(run.players[run.identity.puuid_to_player_id.PLAYER_A].games,25);
assert.equal(run.players[run.identity.puuid_to_player_id.PLAYER_B].games,1);
const a=U.buildViewModel(run,'PLAYER_A',{hardCap:500});
assert.equal(a.kind,'player');assert.equal(a.player.games,25);assert.equal(a.confidence.key,'LOW');assert.notEqual(a.sample.key,'insufficient');
const ah=U.renderCard(a);assert(ah.includes('RESEARCH'));assert(ah.includes('Elo'));assert(ah.includes('Glicko'));assert(ah.includes('TrueSkill'));assert(ah.includes('INSUFFICIENT_REAL_DATA'));assert(!ah.includes('PRIMARY MODEL</small><b>TrueSkill'));
const b=U.buildViewModel(run,'PLAYER_B');assert.equal(b.kind,'player');assert.equal(b.sample.key,'insufficient');assert(U.renderCard(b).includes('표본 부족'));assert(U.renderCard(b).includes('arui-model-muted'));
const c=U.buildViewModel(run,'PLAYER_C');assert.equal(c.kind,'no_data');const ch=U.renderCard(c);assert(ch.includes('분석 데이터 없음'));assert(!ch.includes('1,500'));
const unavailable=U.buildViewModel(null,'PLAYER_A');assert.equal(unavailable.kind,'unavailable');assert(U.renderCard(unavailable).includes('Research data unavailable'));
const future=JSON.parse(JSON.stringify(run));future.selection={status:'candidate_winner',best_observed:'trueskill_family'};const fh=U.renderCard(U.buildViewModel(future,'PLAYER_A'));assert(fh.includes('PRIMARY MODEL'));assert(fh.includes('arui-model-primary'));
console.log(JSON.stringify({status:'PASS',fixtures:['Player A 20+','Player B 1','Player C absent','unavailable','future candidate_winner'],selection:run.selection.status},null,2));
