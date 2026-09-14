'use strict';
const vm=require('vm');const L=require('./lib');const next=require('../../src/random/pick/dna');
const meta={
  Nautilus:{role:'tank engage',tags:['Tank','Support'],damageType:'AP'},
  Jinx:{role:'marksman adc',tags:['Marksman'],damageType:'AD'},
  Xerath:{role:'mage artillery poke',tags:['Mage'],damageType:'AP'},
  Lulu:{role:'support enchanter',tags:['Support'],damageType:'AP'}
};
const normalize=v=>String(v||'').trim();
const candidateMeta=n=>meta[n]||null;
const reference={dna:{engage:{pct:22,state:'부족',missing:true},poke:{pct:80,state:'확보',missing:false},front:{pct:18,state:'부족',missing:true},sustain:{pct:42,state:'부족',missing:true},cc:{pct:35,state:'부족',missing:true}},shortages:['이니시 부족','프론트라인 부족','지속 전투 부족','군중 제어 부족','AD 부족']};
const pickReferenceModel=()=>JSON.parse(JSON.stringify(reference));
function row(text,names=[]){return{textContent:text,querySelectorAll(){return names.map(n=>({dataset:{championName:n},getAttribute(){return''}}))}}}
function legacy(){
  const src=L.read('update/v0.15.94/runtime-source-stability-v01594.js'),start=src.indexOf('function candidateRoleSignalsV01594('),end=src.indexOf('function dnaMetricPreviewHtmlV01594(');L.must(start>=0&&end>start,'could not isolate legacy RANDOM DNA pure functions');
  const window={},context={window,normalizeNameV01593:normalize,candidateMetaFromGlobalsV01593:candidateMeta,pickReferenceModelV01590:pickReferenceModel,console};vm.runInNewContext(src.slice(start,end)+'\nwindow.api={candidateRoleSignalsV01594,mergeDnaMetricV01594,shortageSignalV01594,candidateDnaPreviewV01594};',context);return window.api;
}
const old=legacy(),engine=next.createDnaEngine({normalizeName:normalize,candidateMeta,pickReferenceModel});
const rows=[row('탱커 이니시 강한 CC',['Nautilus']),row('장거리 포킹 메이지',['Xerath']),row('원딜 지속딜',['Jinx']),row('서포터 보호 회복',['Lulu']),row('브루저 돌진 fighter',[])];
const names=['Nautilus','Xerath','Jinx','Lulu','Unknown'],descs=['이니시 탱커','포킹 artillery','marksman adc','보호 회복 enchanter','fighter dive'];
for(let i=0;i<rows.length;i++){const a=old.candidateRoleSignalsV01594(rows[i],names[i],descs[i]),b=engine.candidateRoleSignals(rows[i],names[i],descs[i]);L.must(JSON.stringify(a)===JSON.stringify(b),`candidate role signal drift ${names[i]}`)}
for(const base of [{pct:20,state:'부족',missing:true},{pct:82,state:'확보',missing:false},null])for(const sig of [0,.3,.5,.74,1])L.must(JSON.stringify(old.mergeDnaMetricV01594(base,sig))===JSON.stringify(engine.mergeDnaMetric(base,sig)),`DNA merge drift ${sig}`);
const profileFixtures=[{adPct:70,apPct:30},{adPct:45,apPct:55}];for(const p of profileFixtures)for(const text of reference.shortages){const s={engage:1,poke:.2,front:.8,sustain:.6,cc:.9};L.must(old.shortageSignalV01594(text,s,p)===engine.shortageSignal(text,s,p),'shortage signal drift')}
const previewCases=[[rows[0],'Nautilus','이니시 탱커',{adPct:30,apPct:70}],[rows[2],'Jinx','원딜 지속딜',{adPct:85,apPct:15}],[rows[3],'Lulu','보호 회복 서포터',{adPct:10,apPct:90}]];
for(const args of previewCases){const a=old.candidateDnaPreviewV01594(...args),b=engine.candidateDnaPreview(...args);L.must(JSON.stringify(a)===JSON.stringify(b),`candidate DNA preview drift ${args[1]}`)}
L.must(next.production_active===false&&next.score_logic_changed===false&&next.random_scoring_changed===false,'canonical RANDOM DNA must remain inactive and scoring-neutral');const report={status:'SUCCESS',production_active:false,implementation:next.IMPLEMENTATION_VERSION,signal_fixtures:rows.length,preview_fixtures:previewCases.length,semantic_contract:['five DNA lanes','candidate metadata signals','shortage recomputation','AD/AP shortage threshold'],scoring_changed:false,cutover_allowed:false};L.write('audit-output/stability/random-dna-canonical-differential.json',report);console.log('RANDOM DNA CANONICAL DIFFERENTIAL: SUCCESS · candidate preview semantics preserved');
