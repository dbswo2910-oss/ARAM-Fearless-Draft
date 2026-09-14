'use strict';
const L=require('./lib');const render=require('../../src/random/pick/render-core');
class El{
  constructor(id){this.id=id;this.attrs={};this.dataset={};this.innerHTML='';this.listeners={}}
  setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v)}
  getAttribute(k){return this.attrs[k]??null}
  addEventListener(t,fn){(this.listeners[t]||(this.listeners[t]=new Set())).add(fn)}
  removeEventListener(t,fn){this.listeners[t]?.delete(fn)}
  contains(x){return !!x&&x.__root===this}
  emit(t,event){for(const fn of this.listeners[t]||[])fn(event)}
}
const ids=['random','randomInputAnchor','externalInputs','manualPartyInputs','poolInputs','comboResults','comboDetail','randomOurFive','randomOurSummary','randomEnemySummary'];const els=Object.fromEntries(ids.map(id=>[id,new El(id)]));const document={getElementById:id=>els[id]||null};
const combos=[
 {party:['징크스','룰루'],sel:['룰루'],locked:['징크스'],names:['말파이트','제라스','아리','징크스','룰루'],score:321.45,direction:'하이퍼캐리 보호 FTB',reason:'ADC×유틸 18/20 · 실질 AD/AP 균형',warning:'큰 구조 결함 없음 · 상대 공개 후 세부 운영 조정',structure:'프론트 8 / 이니시 9',totalCombos:1234,provisional:false,parts:{overall:210.2,canonicalExtra:22.1,gapPenalty:3,rolePenalty:2,damagePenalty:1,damageBonus:4,synergy:9,specialUtility:4,specialBush:1.3,specialAlly:1.5}},
 {party:['자야','룰루'],sel:['자야'],locked:['룰루'],names:['말파이트','제라스','아리','자야','룰루'],score:318.1,direction:'밸런스 FTB',reason:'프론트+시동 · 실질 AD/AP 균형',warning:'큰 구조 결함 없음 · 상대 공개 후 세부 운영 조정',structure:'프론트 8 / 이니시 9',totalCombos:1234,provisional:true,parts:{overall:207,canonicalExtra:21,gapPenalty:4,rolePenalty:2,damagePenalty:0,damageBonus:4,synergy:7,specialUtility:3,specialBush:.4,specialAlly:1.2}}
];
const state={combos,selectedCombo:0,ourModes:{}};let persisted=0,analysis=0;
const owner=render.createRenderCore({document,state,championIconHtml:n=>`<img alt="${n}">`,nval:v=>Number(v)||0,teamBushUtilityValue:()=>({grade:'A',v:3}),teamBushMetricText:()=> 'A 3.0',teamBushAxisText:()=> '시야/부쉬',persist:()=>persisted++,renderAnalysis:()=>analysis++});
L.must(owner.render()===true,'render core failed');
for(const [id,role] of Object.entries(render.ROLE_BY_ID))L.must(els[id]?.attrs['data-ui-role']===role,`stable role missing ${id} -> ${role}`);
L.must(els.comboResults.innerHTML.includes('data-random-combo-index="0"')&&els.comboResults.innerHTML.includes('comboRank1 selected'),'TOP5 selected-row render drift');
L.must(els.comboResults.innerHTML.includes('하이퍼캐리 보호 FTB')&&els.comboResults.innerHTML.includes('321.4'),'TOP5 score/direction render drift');
L.must(els.comboDetail.innerHTML.includes('후보 계산')&&els.comboDetail.innerHTML.includes('1,234개 조합 전수'),'detail calculation render drift');
L.must(els.comboDetail.innerHTML.includes('팀 부쉬지표')&&els.comboDetail.innerHTML.includes('점수 구조'),'detail semantic sections missing');
L.must((els.comboResults.listeners.click?.size||0)===1,'selection listener must be single-owner/idempotent');owner.bindSelection();L.must((els.comboResults.listeners.click?.size||0)===1,'selection listener duplicated');
const row={__root:els.comboResults,getAttribute:k=>k==='data-random-combo-index'?'1':null},target={closest:sel=>sel==='[data-random-combo-index]'?row:null};els.comboResults.emit('click',{target});
L.must(state.selectedCombo===1&&persisted===1&&analysis===1,'delegated selection route drift');L.must(els.comboResults.innerHTML.includes('comboRank2 selected'),'selected combo did not re-render');L.must(els.comboDetail.innerHTML.includes('외부픽 미완성 임시평가'),'selected detail provisional marker missing');
owner.dispose();L.must((els.comboResults.listeners.click?.size||0)===0,'selection listener cleanup failed');
const installed=L.read('docs/INSTALLED_BASELINE_v0.15.49.md');for(const id of ['#random','#randomInputAnchor','#poolInputs','#comboResults','#comboDetail','#randomOurFive','#randomOurSummary','#randomEnemySummary','#randomRoles'])L.must(installed.includes(id),`installed Random DOM anchor missing ${id}`);
const legacy=L.read('update/v0.15.72/runtime-random-practice-v01572.js');L.must(legacy.includes('renderRandomComboResults()')&&legacy.includes('renderComboDetail()'),'legacy cooperative TOP5 completion no longer routes through render functions');
L.must(render.production_active===false&&render.score_logic_changed===false&&render.random_scoring_changed===false,'render core must remain production inactive/scoring neutral');
L.write('audit-output/stability/random-render-core-canonical.json',{status:'SUCCESS',production_active:false,stable_roles:Object.values(render.ROLE_BY_ID),single_listener:true,disposable_listener:true,selection_rerender:true,installed_dom_anchor_contract:true,score_logic_changed:false,random_scoring_changed:false,scope:'canonical base TOP5/detail render core; v0.15.90-v0.15.100 candidate-preview presentation parity remains a separate final-owner gate',cutover_allowed:false});console.log('RANDOM RENDER CORE CANONICAL AUDIT: SUCCESS · exact-ID roles + disposable selection core');
