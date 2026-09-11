'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const modPath=path.join(ROOT,'update/v0.15.83/runtime-source-stability-v01583.js');
const mod=require(modPath);
const raw=read('update/v0.15.50/random-ingame-coach-v01550.js');
let code='';
try{code=mod.patchRuntimeSource('random-ingame-coach-v01550.js',raw);new Function(code);ok('patched coach parses',true)}catch(e){ok('patched coach parses',false,e.stack||e.message)}

ok('manifest is v0.15.83',manifest.version==='0.15.83',manifest.version);
ok('package points to v0.15.83 entry',by.get('package.json')==='update/v0.15.83/package.json',by.get('package.json')||'');
ok('v0.15.83 main delivered',by.get('main-v01583.js')==='update/v0.15.83/main-v01583.js',by.get('main-v01583.js')||'');
ok('v0.15.83 source stability delivered',by.get('runtime-source-stability-v01583.js')==='update/v0.15.83/runtime-source-stability-v01583.js',by.get('runtime-source-stability-v01583.js')||'');

const pkg=JSON.parse(read('update/v0.15.83/package.json'));
ok('package version is v0.15.83',pkg.version==='0.15.83',pkg.version);
ok('package entry is main-v01583.js',pkg.main==='main-v01583.js',pkg.main);
const main=read('update/v0.15.83/main-v01583.js');
try{new Function(main);ok('v0.15.83 main parses',true)}catch(e){ok('v0.15.83 main parses',false,e.message)}
ok('v0.15.83 inherits v0.15.82',main.includes("main-v01582.js")&&main.includes("replaceAll('0.15.82','0.15.83')"));
ok('v0.15.79 safety lineage stays explicit',main.includes("main-v01579.js")&&main.includes("replaceAll('0.15.79','0.15.80')"));

ok('v0.15.81 recommendation gate preserved',code.includes('function buildGateV01581(available,stat,ctx,threat)')&&code.includes('ranked=buildGateV01581(available,stat,ctx,top)'));
ok('v0.15.82 command center preserved',code.includes('function ensureCommandCenterStylesV01582()')&&code.includes('class="ri82Grid"'));
ok('champion portrait helper injected',code.includes('function portraitV01583(name')&&code.includes("typeof championIconHtml==='function'"));
ok('player card has champion portrait',code.includes('class="ri83PlayerHead"')&&code.includes("portraitV01583(me,'lg')"));
ok('threat TOP3 has champion portraits',code.includes('function threatTop3HtmlV01583')&&code.includes("portraitV01583(x?.name,'md')"));
ok('action text can decorate champion names',code.includes('function inlineChampionsV01583')&&code.includes('class="ri83Name"'));
ok('fight status has both team rosters',code.includes('>아군 조합<')&&code.includes('>적군 조합<')&&code.includes('function fightStatusHtmlV01583'));
ok('death return plan has champion visuals',code.includes('부활 후 역할과 최고위협을 이미지로 재확인')&&code.includes('ri83ReturnTarget'));
ok('preview copy explicitly exposes visual preview',code.includes('인게임 미리보기')&&code.includes('챔피언 이미지가 포함된 화면'));
ok('v0.15.83 source layer adds no scheduler/observer',!read('update/v0.15.83/runtime-source-stability-v01583.js').includes('setInterval(')&&!read('update/v0.15.83/runtime-source-stability-v01583.js').includes('MutationObserver'));
ok('draft scoring remains untouched',mod.score_logic_changed===false);
ok('item recommendation scoring remains inherited',mod.item_recommendation_logic_changed===false);
ok('champion visual change declared',mod.champion_visuals_changed===true);

function expose(src){
  const anchor='  ensureShell();document.addEventListener';
  if(!src.includes(anchor))throw new Error('coach startup anchor missing');
  return src.replace(anchor,'  window.__V83_TEST__={renderLive,renderBuild};\n'+anchor);
}
try{
  const testCode=expose(code);
  const document={
    querySelector(){return null},
    querySelectorAll(){return[]},
    getElementById(){return null},
    addEventListener(){},
    createElement(){return{id:'',textContent:'',style:{},dataset:{},classList:{add(){},toggle(){},contains(){return false}},appendChild(){},addEventListener(){}}},
    head:{appendChild(){}},
    body:{classList:{toggle(){}}}
  };
  const ctx={console,document,localStorage:{getItem:()=>null,setItem:()=>{}},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},Promise,Date,Number,String,Object,Array,Map,Set,Math,JSON,performance:{now:()=>0}};
  ctx.window=ctx;ctx.window.addEventListener=()=>{};ctx.window.aramDesktop={};
  ctx.championIconHtml=name=>`<img data-champ="${String(name)}" alt="${String(name)}">`;
  vm.createContext(ctx);vm.runInContext(testCode,ctx);
  const api=ctx.__V83_TEST__;
  const model={
    source:'preview',life:'alive',gameTime:742,gold:1480,respawn:0,alive:{our:5,enemy:4},
    local:{name:'그라가스'},ours:['그라가스','제리','룰루','브라움','오리아나'],enemies:['징크스','말파이트','브랜드','카타리나','애쉬'],
    threat:{name:'징크스',score:94,damageType:'물리',dead:false,respawn:0},
    threats:[{name:'징크스',score:94,damageType:'물리'},{name:'말파이트',score:81,damageType:'마법'},{name:'브랜드',score:76,damageType:'마법'}],
    item:{name:'란두인의 예언',score:91,reason:'징크스 성장 + 치명타 위협 때문에 이번 판 우선순위 상승'},
    alts:['정령의 형상','워모그의 갑옷'],stat:{tree:'가시 갑옷 → 워모그의 갑옷 → 정령의 형상',source:'ARAM DB',verified:'A'},buildSame:false,
    job:'제리 옆에서 적 첫 진입을 받아친 뒤 2차 진입',matchup:'우리 약우세',power:{our:69,enemy:64,diff:5},
    plan:{tone:'good',headline:'지금 교전 가치 높음',detail:'말파이트와 브랜드의 첫 진입을 확인하고 징크스 위치를 보세요.',steps:['제리 옆에서 첫 진입 받아치기','말파이트 진입 확인 후 2차 진입','징크스 노출 시 화력 집중']},
    warning:{tone:'warn',text:'말파이트 R 연계 가능 · 팀 간격 유지'},advice:{direction:'치명타 대응'}
  };
  const live=api.renderLive(model);
  ok('VM preview renders player portrait',live.includes('data-champ="그라가스"'));
  ok('VM preview renders TOP3 portraits',live.includes('data-champ="징크스"')&&live.includes('data-champ="말파이트"')&&live.includes('data-champ="브랜드"'));
  ok('VM preview renders ally/enemy roster portraits',live.includes('아군 조합')&&live.includes('적군 조합')&&live.includes('data-champ="제리"')&&live.includes('data-champ="애쉬"'));
  ok('VM action line renders inline champion portrait',live.includes('ri83Name')&&live.includes('제리'));
  const dead={...model,life:'dead',respawn:23};
  const build=api.renderBuild(dead);
  ok('VM death render preserves purchase target hooks',build.includes('riRespawnStrip')&&build.includes('riBuildCompare')&&build.includes('riBuildCard opt')&&build.includes('riBuildMain'));
  ok('VM death return plan renders player/threat portraits',build.includes('data-champ="그라가스"')&&build.includes('data-champ="징크스"')&&build.includes('복귀 후 첫 행동'));
}catch(e){ok('VM visual command center render',false,e.stack||e.message)}

const report={version:'0.15.83',generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'add champion portraits and team-composition visuals to IN GAME live/preview/death coaching while keeping recommendation logic unchanged',score_logic_changed:false,item_recommendation_logic_changed:false,ingame_hud_changed:true,champion_visuals_changed:true}};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/ingame-visuals-v01583-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
