'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'../..');
const gate=require(path.join(ROOT,'src/research/shadow-promotion-gate.js'));
let pass=0;const ok=(c,m)=>{if(!c)throw new Error('R16 SHADOW PROMOTION GATE AUDIT: '+m);pass++};

ok(gate.production_active===false,'production inactive');
ok(gate.automatic_promotion===false,'no automatic promotion');
ok(gate.CONTRACT.storage_writes===false,'no storage writes');
ok(gate.CONTRACT.network_requests===false,'no network requests');
ok(gate.CONTRACT.ui_writes===false,'no UI writes');
ok(gate.CONTRACT.production_score_writes===false,'no production score writes');
ok(gate.CONTRACT.production_activation===false,'no production activation');
ok(gate.CONTRACT.manual_release_approval_required===true,'manual approval required');

function snap(fp,matches,status='candidate_winner',leader='elo',fg=.018,wg=.015){return{schema:'aram-rating-dual-shadow-v1',observed_leader:leader,selection_status:status,dataset:{fingerprint:fp,matches},metrics:{log_loss_gap_glicko_minus_elo:{frozen:fg,walk_forward:wg}}}}

const current=gate.evaluatePromotion([snap('r14',2020,'no_clear_winner','elo',.019,.026)]);
ok(current.status==='hold_shadow','R14-style no-clear-winner remains shadow hold');
ok(current.production_activation_authorized===false,'hold cannot activate production');
ok(current.next_step==='CONTINUE_PASSIVE_DUAL_SHADOW_OBSERVATION','hold next step');

const eligible=gate.evaluatePromotion([
  snap('a',2020,'candidate_winner','elo',.012,.010),
  snap('b',2075,'candidate_winner','elo',.014,.011),
  snap('c',2130,'candidate_winner','elo',.016,.013)
]);
ok(eligible.status==='eligible_for_manual_promotion_review','mature stable shadow evidence reaches review only');
ok(eligible.production_activation_authorized===false,'eligible still does not auto-authorize production');
ok(eligible.automatic_promotion===false,'eligible still manual');
ok(eligible.conditions.distinct_snapshots===true,'distinct snapshot gate');
ok(eligible.conditions.match_growth===true,'match growth gate');
ok(eligible.conditions.candidate_winner===true,'candidate gate');
ok(eligible.conditions.stable_leader===true,'stable leader gate');
ok(eligible.conditions.positive_frozen_gap===true&&eligible.conditions.positive_walk_forward_gap===true,'positive primary-metric gaps');

const unstable=gate.evaluatePromotion([
  snap('a',2020,'candidate_winner','elo',.01,.01),
  snap('b',2075,'candidate_winner','glicko',-.01,-.01),
  snap('c',2130,'candidate_winner','elo',.01,.01)
]);
ok(unstable.status==='hold_shadow'&&unstable.conditions.stable_leader===false,'leader flip blocks review');

const src=fs.readFileSync(path.join(ROOT,'src/research/shadow-promotion-gate.js'),'utf8');
ok(!src.includes('indexedDB'),'gate has no IndexedDB access');
ok(!src.includes('getAramMatchHistory'),'gate has no Riot/LCU bridge');
ok(!src.includes('.innerHTML')&&!src.includes('appendChild'),'gate has no UI mutation');

const evidence=JSON.parse(fs.readFileSync(path.join(ROOT,'research/aram-rating-v032/evidence/b51r14-user-pc-result.json'),'utf8'));
ok(evidence.selection_status==='no_clear_winner','R14 evidence is no-clear-winner');
ok(evidence.next_step==='BUILD_ELO_GLICKO_DUAL_SHADOW_AND_STOP_BLIND_COLLECTION','R14 evidence requires dual shadow');

const report={status:'SUCCESS',passes:pass,phase:'R16_SHADOW_PROMOTION_GATE',current_r14_state:'hold_shadow',production_active:false,automatic_promotion:false,manual_release_approval_required:true,min_distinct_snapshots:gate.POLICY.min_distinct_snapshots,min_match_growth:gate.POLICY.min_match_growth};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/aram-rating-v032-r16-shadow-promotion-gate-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(`R16 SHADOW PROMOTION GATE AUDIT: SUCCESS · ${pass} checks`);
