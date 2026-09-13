'use strict';
const assert=require('assert');
const C=require('./collector-core');
const players=n=>Array.from({length:n},(_,i)=>`p${i+1}`);
function match(id,ps,t=Date.now()){return {gameId:id,queueId:450,gameEndTimestamp:t,participants:ps.map((p,i)=>({puuid:p,teamId:i<5?100:200,win:i<5}))}}
const p=players(30);
const seed=[match('m1',p.slice(0,10),1),match('m2',[p[0],...p.slice(10,19)],2),match('m3',[p[0],p[1],...p.slice(19,27)],3)];
const ranked=C.scoreCandidates(seed);
assert.equal(ranked[0].puuid,'p1','repeated/connected player should rank first');
assert(ranked.find(x=>x.puuid==='p1').priority>ranked.find(x=>x.puuid==='p27').priority,'repeat candidate should outrank singleton');
const fetched=[seed[0],match('m4',[p[0],p[1],p[2],p[3],p[4],'n1','n2','n3','n4','n5'],4)];
const merged=C.mergeExpansion(seed,fetched,'p1');
assert.equal(merged.duplicates.length,1);assert.equal(merged.new_matches.length,1);assert.equal(merged.new_players,5);assert(merged.already_known_player_appearances>=5);assert(merged.information_gain>0);
const before=C.kpis(seed),after=C.kpis(merged.after_rows);assert(after.players_2_plus>=before.players_2_plus);assert(after.matches===4);
const wrong=C.mergeExpansion(seed,[match('other',p.slice(10,20),5)],'p1');assert.equal(wrong.target_hits,0,'data-source validation must detect wrong target history');
console.log('ARAM Rating v0.3 collector core fixture: SUCCESS');
