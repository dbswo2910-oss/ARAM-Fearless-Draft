'use strict';
const assert=require('assert');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const legacy=require(path.join(ROOT,'update/v0.15.25/autosync-cc-impact-v01525.js'));
const canonical=require(path.join(ROOT,'src/autosync/cc-impact.js'));
function createModule(){return{normalizeAramHistoryGame:(game,target)=>({me:{puuid:target?.puuid,participantId:3,championId:22,teamId:100},base:true})}}
function fixture(){return{participants:[{participantId:3,puuid:'ME',championId:22,teamId:100,stats:{enemyChampionImmobilizations:8,immobilizeAndKillWithAlly:3,knockEnemyIntoTeamAndKill:1},challenges:{highestCrowdControlScore:42}},{participantId:4,puuid:'OTHER',championId:23,teamId:100,stats:{enemyChampionImmobilizations:99}}]}}
function exercise(patcher){const mod=createModule();patcher(mod);const out=mod.normalizeAramHistoryGame(fixture(),{puuid:'ME'});return{out,semantic:!!mod.__ARAM_AUTOSYNC_CC_IMPACT__,legacy:!!mod.__ARAM_CC_IMPACT_NORMALIZER_V01525__}}
const before=exercise(legacy.patch),after=exercise(canonical.install);
const a={...after};delete a.semantic;delete a.legacy;const b={...before};delete b.semantic;delete b.legacy;
assert.deepStrictEqual(a,b,'canonical CC-impact changed normalized output');
assert.strictEqual(after.semantic,true,'canonical CC-impact semantic readiness missing');
assert.strictEqual(after.legacy,true,'canonical CC-impact legacy compatibility missing');
const mod=createModule();canonical.install(mod);const normalize=mod.normalizeAramHistoryGame;legacy.patch(mod);assert.strictEqual(mod.normalizeAramHistoryGame,normalize,'legacy CC-impact rewrapped canonical normalizer');
console.log(JSON.stringify({status:'PASS',owner:canonical.OWNER,normalizerParity:true,noDoubleWrap:true}));
