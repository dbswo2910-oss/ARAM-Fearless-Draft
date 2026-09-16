'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const shadow=require(path.join(ROOT,'src/research/dual-shadow.js'));
let pass=0;const ok=(c,m)=>{if(!c)throw new Error('R15 DUAL SHADOW AUDIT: '+m);pass++};

ok(shadow.production_active===false,'production inactive');
ok(shadow.automatic_collection===false,'no automatic collection');
ok(JSON.stringify(shadow.MODEL_NAMES)===JSON.stringify(['elo','glicko']),'Elo/Glicko only');
ok(shadow.CONTRACT.storage_writes===false,'no storage writes');
ok(shadow.CONTRACT.network_requests===false,'no network requests');
ok(shadow.CONTRACT.ui_writes===false,'no UI writes');
ok(shadow.CONTRACT.production_score_writes===false,'no production score writes');
ok(shadow.CONTRACT.raw_identity_export===false,'no raw identity export');

const testId='test-puuid-00000000000000000000000000000000';
const fake={
  observed_leader:'elo',observed_runner_up:'glicko',selection:{status:'no_clear_winner'},
  dataset:{matches:2001,players:11000,fingerprint:'abc123'},
  identity:{player_count:11000,puuid_to_player_id:{[testId]:'7'}},
  players:{'7':{models:{elo:{rating:1532,uncertainty:61,games:18,uncertainty_kind:'sample_size_proxy'},glicko:{rating:1519,uncertainty:74,games:18,uncertainty_kind:'glicko_rd'}}}},
  models:{
    elo:{frozen:{n:400,accuracy:.55,log_loss:.692,brier:.249,ece:.04},walk_forward:{n:400,accuracy:.54,log_loss:.694,brier:.251,ece:.05}},
    glicko:{frozen:{n:400,accuracy:.53,log_loss:.712,brier:.258,ece:.06},walk_forward:{n:400,accuracy:.52,log_loss:.721,brier:.263,ece:.07}},
    trueskill_family:{frozen:{n:400,log_loss:.713},walk_forward:{n:400,log_loss:.726}}
  }
};
const snap=shadow.buildSnapshot(fake,{targetPuuid:testId});
ok(snap?.schema==='aram-rating-dual-shadow-v1','schema');
ok(snap?.shadow_strategy==='elo_glicko_dual_shadow','no-clear-winner maps to dual shadow');
ok(snap?.metrics?.elo?.frozen?.log_loss===.692,'Elo metric retained');
ok(snap?.metrics?.glicko?.frozen?.log_loss===.712,'Glicko metric retained');
ok(Math.abs(snap.metrics.log_loss_gap_glicko_minus_elo.frozen-.020)<1e-12,'gap computed');
ok(snap?.target?.present===true&&snap?.target?.player_id==='7','target mapped internally');
ok(!JSON.stringify(snap).includes(testId),'raw PUUID not exported');
ok(!JSON.stringify(snap).includes('trueskill_family'),'TrueSkill not exported to dual shadow');

const owner=shadow.createDualShadowOwner();
const first=owner.observeRun(fake,{targetPuuid:testId});
ok(owner.observations===1&&owner.snapshot===first,'in-memory owner observes once');
owner.clear();ok(owner.snapshot===null,'clear is in-memory only');
owner.observeRun(fake);owner.dispose();ok(owner.disposed===true&&owner.snapshot===null,'dispose clears snapshot');

const src=fs.readFileSync(path.join(ROOT,'src/research/dual-shadow.js'),'utf8');
ok(!src.includes('indexedDB'),'dual shadow has no IndexedDB access');
ok(!src.includes('getAramMatchHistory'),'dual shadow has no Riot/LCU bridge');
ok(!src.includes('.innerHTML')&&!src.includes('appendChild'),'dual shadow has no UI mutation');

const ownerSrc=fs.readFileSync(path.join(ROOT,'src/research/owner.js'),'utf8');
ok(ownerSrc.includes("require('./dual-shadow')"),'canonical research owner imports dual shadow');
ok(ownerSrc.includes('shadow.observeRun(latest'),'canonical owner observes successful run');
ok(ownerSrc.includes('get shadowSnapshot()'),'shadow snapshot exposed read-only');
const indexSrc=fs.readFileSync(path.join(ROOT,'src/research/index.js'),'utf8');
ok(indexSrc.includes("const dualShadow=require('./dual-shadow')"),'research index exports dual shadow');

const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'update/manifest.json'),'utf8'));
ok(!(manifest.files||[]).some(x=>String(x.source||'').includes('src/research/dual-shadow.js')),'shadow source not shipped through production manifest');

const report={status:'SUCCESS',passes:pass,phase:'R15_DUAL_SHADOW_ARCHITECTURE',models:['elo','glicko'],production_active:false,storage_writes:false,network_requests:false,ui_writes:false,production_score_writes:false,raw_identity_export:false,canonical_owner:'src/research'};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/aram-rating-v032-r15-dual-shadow-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(`R15 DUAL SHADOW ARCHITECTURE AUDIT: SUCCESS · ${pass} checks`);
