'use strict';
const vm=require('vm');const L=require('./lib');const next=require('../../src/draft/risk-engine');
const profiles={
  AllyTank:{프론트:4.5,보호:3.2,역이니시:4.0,이니시:3.8,캐치:2.0,대탱:1.2,지속딜:1.4,'기능프로필18':{유지력:2.0,CC:4.2}},
  AllyCarry:{프론트:.5,보호:.4,역이니시:.2,이니시:.4,캐치:.7,대탱:4.1,지속딜:4.8,'기능프로필18':{'유효 사거리':4.2}},
  EnemyCatch:{캐치:4.7,이니시:4.2,포킹:1.6,다이브:1.0,프론트:1.0,보호:.5,대탱:1.2,지속딜:2.0,'기능프로필18':{CC:4.8,'장거리 CC':4.5,'광역 CC':3.0}},
  EnemyPoke:{캐치:1.3,이니시:.7,포킹:4.8,다이브:.5,프론트:.6,보호:.3,대탱:1.0,지속딜:3.1,'기능프로필18':{'유효 사거리':4.9,'장거리 포킹':4.8}},
  EnemyDive:{캐치:2.1,이니시:3.8,포킹:.5,다이브:4.9,프론트:2.2,보호:.4,대탱:2.5,지속딜:3.4,'기능프로필18':{'다이브/후방 접근':4.8,CC:3.8}},
  EnemyTank:{캐치:2.0,이니시:4.3,포킹:.2,다이브:2.1,프론트:4.9,보호:1.5,대탱:1.0,지속딜:1.4,'기능프로필18':{탱킹:4.8,'광역 CC':4.4}},
  EnemySupport:{캐치:2.4,이니시:2.0,포킹:1.4,다이브:.3,프론트:1.2,보호:4.7,대탱:.5,지속딜:.6,'기능프로필18':{유지력:4.8,'회복/보호막':4.9,'광역 한타':3.6,후반:4.2}}
};
const metricKeys=['캐치','포킹','다이브','이니시','프론트','보호','역이니시','대탱','지속딜'];
function compMetrics(names){const out={};for(const k of metricKeys)out[k]=(names||[]).reduce((s,n)=>s+Number(profiles[n]?.[k]||0),0);return out}
function partialCatch(enemy){const count=(enemy||[]).length,strongSources=(enemy||[]).filter(n=>Number(profiles[n]?.캐치||0)>=3.5||Number(profiles[n]?.['기능프로필18']?.CC||0)>=4.2).length;return{scale:Math.min(1,(strongSources*.26+count*.08)),strongSources}}
function legacyRisks(state){let src=L.read('update/v0.15.46/draft-risk-board-v01546.js');const cut=src.indexOf('  function badgeHtml');L.must(cut>0,'could not isolate legacy Draft risk pure section');src=src.slice(0,cut)+"  window.aramDraftRiskBoardV01546=risks;\n})();\n";const window={aramDraftPartialCatchPressureV01542:(enemy)=>partialCatch(enemy)},context={window,state,compMetrics,byName:profiles,console};vm.runInNewContext(src,context);return JSON.parse(JSON.stringify(window.aramDraftRiskBoardV01546()))}
const engine=next.createRiskEngine({compMetrics,byName:profiles,partialCatch});
const fixtures=[
 {our:[],enemy:['EnemyCatch'],enemyModes:{}},
 {our:['AllyTank','AllyCarry'],enemy:['EnemyCatch','EnemyPoke'],enemyModes:{}},
 {our:['AllyTank','AllyCarry'],enemy:['EnemyCatch','EnemyPoke','EnemyDive'],enemyModes:{}},
 {our:['AllyTank','AllyCarry'],enemy:['EnemyCatch','EnemyPoke','EnemyDive','EnemyTank','EnemySupport'],enemyModes:{}}
];
for(const state of fixtures){const a=legacyRisks(state),b=engine.risks(state);L.must(JSON.stringify(a)===JSON.stringify(b),`Draft risk output drift for ${state.our.length}v${state.enemy.length}`)}
L.must(next.CATEGORIES.join('|')==='밸류|포킹|돌진|강한 이니시|캐치/CC|전열 처리|유지력|광역 한타','Draft risk categories drift');L.must(next.production_active===false&&next.score_logic_changed===false&&next.random_scoring_changed===false,'canonical Draft risk shadow must remain inactive and scoring neutral');
const sample=engine.risks(fixtures[fixtures.length-1]);const report={status:'SUCCESS',production_active:false,implementation:next.IMPLEMENTATION_VERSION,fixtures:fixtures.length,categories:[...next.CATEGORIES],sample_order:sample.map(x=>x.key),sample_levels:sample.map(x=>({key:x.key,level:x.level,strength:x.strength})),semantic_contract:['partial-pick confidence','relative-to-our-comp mitigation','all eight risk categories','rank then strength ordering'],cutover_allowed:false};L.write('audit-output/stability/draft-canonical-differential.json',report);console.log('DRAFT CANONICAL DIFFERENTIAL: SUCCESS · v0.15.46 multi-risk semantics preserved');
