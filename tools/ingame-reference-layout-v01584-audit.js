'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const mod=require(path.join(ROOT,'update/v0.15.84/runtime-source-stability-v01584.js'));
const raw=read('update/v0.15.50/random-ingame-coach-v01550.js');
let code='';
try{code=mod.patchRuntimeSource('random-ingame-coach-v01550.js',raw);new Function(code);ok('patched coach parses',true)}catch(e){ok('patched coach parses',false,e.stack||e.message)}

ok('manifest is v0.15.84',manifest.version==='0.15.84',manifest.version);
ok('package points to v0.15.84 entry',by.get('package.json')==='update/v0.15.84/package.json',by.get('package.json')||'');
ok('v0.15.84 main delivered',by.get('main-v01584.js')==='update/v0.15.84/main-v01584.js',by.get('main-v01584.js')||'');
ok('v0.15.84 source stability delivered',by.get('runtime-source-stability-v01584.js')==='update/v0.15.84/runtime-source-stability-v01584.js',by.get('runtime-source-stability-v01584.js')||'');

const pkg=JSON.parse(read('update/v0.15.84/package.json'));
ok('package version is v0.15.84',pkg.version==='0.15.84',pkg.version);
ok('package entry is main-v01584.js',pkg.main==='main-v01584.js',pkg.main);
const main=read('update/v0.15.84/main-v01584.js');
try{new Function(main);ok('v0.15.84 main parses',true)}catch(e){ok('v0.15.84 main parses',false,e.message)}
ok('v0.15.84 inherits v0.15.83',main.includes("main-v01583.js")&&main.includes("replaceAll('0.15.83','0.15.84')"));
ok('v0.15.79 safety lineage stays explicit',main.includes('main-v01579.js')&&main.includes("replaceAll('0.15.79','0.15.80')"));

ok('v0.15.81 recommendation gate preserved',code.includes('function buildGateV01581(available,stat,ctx,threat)')&&code.includes('ranked=buildGateV01581(available,stat,ctx,top)'));
ok('v0.15.83 champion portraits preserved',code.includes('function portraitV01583(name')&&code.includes("typeof championIconHtml==='function'"));
ok('reference layout helper injected',code.includes('function ensureReferenceLayoutStylesV01584()'));
ok('decision banner is full-width first block',code.includes('ri84LiveStack')&&code.includes('ri84Decision'));
ok('play/threat row preserved',code.includes('ri84MyPlay')&&code.includes('ri84ThreatGrid'));
ok('build/return row present',code.includes('실시간 빌드')&&code.includes('사망 시 복귀 플랜')&&code.includes('ri84ReturnGrid'));
ok('fight status remains full-width',code.includes('function fightStatusV01584')&&code.includes('ri84Fight'));
ok('item art uses current resolver owner',code.includes('window.aramItemArtResolverV01566')&&code.includes('row?.candidates?.[0]'));
ok('v0.15.84 source adds no scheduler/observer',!read('update/v0.15.84/runtime-source-stability-v01584.js').includes('setInterval(')&&!read('update/v0.15.84/runtime-source-stability-v01584.js').includes('MutationObserver'));
ok('draft scoring remains untouched',mod.score_logic_changed===false);
ok('item recommendation scoring remains inherited',mod.item_recommendation_logic_changed===false);
ok('reference layout change declared',mod.reference_layout_changed===true);

function expose(src){
  const anchor='  ensureShell();document.addEventListener';
  if(!src.includes(anchor))throw new Error('coach startup anchor missing');
  return src.replace(anchor,'  window.__V84_TEST__={renderLive,renderBuild};\n'+anchor);
}
try{
  const testCode=expose(code);
  const document={querySelector(){return null},querySelectorAll(){return[]},getElementById(){return null},addEventListener(){},createElement(){return{id:'',textContent:'',style:{},dataset:{},classList:{add(){},toggle(){},contains(){return false}},appendChild(){},addEventListener(){}}},head:{appendChild(){}},body:{classList:{toggle(){}}}};
  const catalog={ok:true,items:{'3143':{name:'란두인의 예언',iconPrimaryUrl:'https://example/3143.png'},'3065':{name:'정령의 형상',iconPrimaryUrl:'https://example/3065.png'}}};
  const resolver={resolve(name){const row=Object.entries(catalog.items).find(([,x])=>x.name===name);return row?{id:row[0],item:row[1],candidates:[row[1].iconPrimaryUrl]}:null},getCatalog:()=>catalog};
  const ctx={console,document,localStorage:{getItem:()=>null,setItem:()=>{}},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},Promise,Date,Number,String,Object,Array,Map,Set,Math,JSON,performance:{now:()=>0}};
  ctx.window=ctx;ctx.window.addEventListener=()=>{};ctx.window.aramDesktop={};ctx.window.aramItemArtResolverV01566=resolver;
  ctx.championIconHtml=name=>`<img data-champ="${String(name)}" alt="${String(name)}">`;
  vm.createContext(ctx);vm.runInContext(testCode,ctx);
  const api=ctx.__V84_TEST__;
  const model={source:'preview',life:'alive',gameTime:742,gold:1480,respawn:0,alive:{our:5,enemy:5},local:{name:'그라가스'},ours:['그라가스','제리','룰루','브라움','오리아나'],enemies:['징크스','말파이트','브랜드','카타리나','애쉬'],threat:{name:'징크스',score:95,damageType:'물리',dead:false,respawn:0},threats:[{name:'징크스',score:95,damageType:'물리'},{name:'말파이트',score:88,damageType:'마법'},{name:'브랜드',score:82,damageType:'마법'}],item:{name:'란두인의 예언',score:91,reason:'징크스 성장 + 치명타 위협 때문에 이번 판 우선순위 상승'},alts:['정령의 형상'],stat:{tree:'가시 갑옷 → 정령의 형상',source:'ARAM DB',verified:'A'},buildSame:false,job:'제리 옆에서 적 첫 진입을 받아친 뒤 2차 진입',matchup:'조건부 교전',power:{our:46,enemy:54,diff:-8},plan:{tone:'bad',headline:'상대 우세 · 먼저 열지 말 것',detail:'상대 조합의 광역 피해와 진입력이 더 강합니다. 시야 없이 먼저 진입하면 한타가 불리해질 가능성이 높습니다.',steps:['상대가 먼저 사용할 주요 스킬 확인 후 진입','말파이트 R, 브랜드 R 쿨타임 주시','아군과 함께, 좁은 구간에서 싸울 것']},warning:{tone:'warn',text:'말파이트 R 연계 가능 · 팀 간격 유지'},advice:{direction:'치명타 대응'}};
  const live=api.renderLive(model);
  ok('VM renders full-width decision before two-column rows',live.indexOf('ri84Decision')<live.indexOf('ri84Row'));
  ok('VM renders large player portrait',live.includes('data-champ="그라가스"')&&live.includes('ri84HeroCard'));
  ok('VM renders three threat cards',live.includes('data-champ="징크스"')&&live.includes('data-champ="말파이트"')&&live.includes('data-champ="브랜드"'));
  ok('VM renders build and return panels in same live page',live.includes('실시간 빌드')&&live.includes('사망 시 복귀 플랜'));
  ok('VM renders item art',live.includes('data-item-id="3143"'));
  ok('VM renders full-width fight status last',live.lastIndexOf('ri84Fight')>live.lastIndexOf('ri84ReturnGrid'));
}catch(e){ok('VM reference layout render',false,e.stack||e.message)}

const report={version:'0.15.84',generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'align IN GAME preview/live layout with approved visual reference while preserving recommendation and safety behavior',score_logic_changed:false,item_recommendation_logic_changed:false,ingame_hud_changed:true,champion_visuals_changed:true,reference_layout_changed:true}};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/ingame-reference-layout-v01584-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
