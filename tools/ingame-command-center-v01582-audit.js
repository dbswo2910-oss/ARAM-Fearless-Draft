'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const versionParts=String(manifest.version||'0.0.0').split('.').map(Number);
const atLeast82=versionParts[0]>0||versionParts[1]>15||(versionParts[1]===15&&versionParts[2]>=82);
const digits=String(manifest.version||'0.15.82').replace(/\D/g,'');
const currentStability=`update/v${manifest.version}/runtime-source-stability-v${digits}.js`;
const modPath=path.join(ROOT,fs.existsSync(path.join(ROOT,currentStability))?currentStability:'update/v0.15.82/runtime-source-stability-v01582.js');
const mod=require(modPath);
const raw=read('update/v0.15.50/random-ingame-coach-v01550.js');
let code='';
try{code=mod.patchRuntimeSource('random-ingame-coach-v01550.js',raw);new Function(code);ok('patched coach parses',true)}catch(e){ok('patched coach parses',false,e.stack||e.message)}

ok('manifest is v0.15.82 or successor',atLeast82,manifest.version);
ok('current package follows active manifest version',by.get('package.json')===`update/v${manifest.version}/package.json`,by.get('package.json')||'');
ok('v0.15.82 main delivered',by.get('main-v01582.js')==='update/v0.15.82/main-v01582.js',by.get('main-v01582.js')||'');
ok('v0.15.82 source stability delivered',by.get('runtime-source-stability-v01582.js')==='update/v0.15.82/runtime-source-stability-v01582.js',by.get('runtime-source-stability-v01582.js')||'');

const pkg=JSON.parse(read('update/v0.15.82/package.json'));
ok('historical v0.15.82 package remains intact',pkg.version==='0.15.82',pkg.version);
ok('historical v0.15.82 package entry remains intact',pkg.main==='main-v01582.js',pkg.main);
const activePkg=JSON.parse(read(by.get('package.json')));
ok('active package version matches manifest',activePkg.version===manifest.version,`${activePkg.version} vs ${manifest.version}`);
const main=read('update/v0.15.82/main-v01582.js');
try{new Function(main);ok('v0.15.82 main parses',true)}catch(e){ok('v0.15.82 main parses',false,e.message)}
ok('v0.15.82 inherits v0.15.81',main.includes("main-v01581.js")&&main.includes("replaceAll('0.15.81','0.15.82')"));
ok('v0.15.79 safety lineage stays explicit',main.includes("main-v01579.js")&&main.includes("replaceAll('0.15.79','0.15.80')"));

const successorLayout=code.includes('ri84LiveStack');
ok('v0.15.81 recommendation gate preserved',code.includes('function buildGateV01581(available,stat,ctx,threat)')&&code.includes('ranked=buildGateV01581(available,stat,ctx,top)'));
ok('live command center injected',code.includes('function ensureCommandCenterStylesV01582()')&&(code.includes('ri82Grid')||successorLayout));
ok('live hierarchy has current judgment',code.includes('현재 판단'));
ok('live hierarchy has player action panel',code.includes('내 플레이')&&(code.includes('지금 해야 할 순서')||code.includes('지금 내가 해야 할 플레이')));
ok('live hierarchy has threat TOP3 contract',code.includes('위협 TOP3')&&(code.includes('threatTop3HtmlV01582')||code.includes('threatCardsV01584')));
ok('live hierarchy has real-time build',code.includes('실시간 빌드')&&(code.includes('다음 코어')||code.includes('다음 코어 아이템')));
ok('live footer keeps combat/gold/life state',(code.includes('LIVE 파워')||code.includes('팀 전투력'))&&(code.includes('보유 골드')||code.includes('내 골드'))&&(code.includes('내 상태')||code.includes('생존 현황')));
ok('death build keeps shop-planner anchors',code.includes('class="riBuildCompare"')&&code.includes('class="riBuildCard opt"')&&code.includes('class="riBuildMain"'));
ok('death build adds return plan',code.includes('class="ri82ReturnPlan"')&&code.includes('복귀 후 첫 행동'));
ok('live tab label becomes Korean',code.includes('data-ri-tab="live">실시간</button>'));
ok('historical v0.15.82 source layer adds no scheduler/observer',!read('update/v0.15.82/runtime-source-stability-v01582.js').includes('setInterval(')&&!read('update/v0.15.82/runtime-source-stability-v01582.js').includes('MutationObserver'));
ok('draft scoring remains untouched',mod.score_logic_changed===false);
ok('item recommendation scoring remains inherited',mod.item_recommendation_logic_changed===false);
ok('HUD change is explicitly declared',mod.ingame_hud_changed===true);

function expose(src){
  const anchor='  ensureShell();document.addEventListener';
  if(!src.includes(anchor))throw new Error('coach startup anchor missing');
  return src.replace(anchor,'  window.__V82_TEST__={renderLive,renderBuild};\n'+anchor);
}
try{
  const testCode=expose(code);
  const document={querySelector(){return null},querySelectorAll(){return[]},getElementById(){return null},addEventListener(){},createElement(){return{id:'',textContent:'',style:{},dataset:{},classList:{add(){},toggle(){},contains(){return false}},appendChild(){},addEventListener(){}}},head:{appendChild(){}},body:{classList:{toggle(){}}}};
  const ctx={console,document,localStorage:{getItem:()=>null,setItem:()=>{}},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},Promise,Date,Number,String,Object,Array,Map,Set,Math,JSON,performance:{now:()=>0}};
  ctx.window=ctx;ctx.window.addEventListener=()=>{};ctx.window.aramDesktop={};ctx.championIconHtml=name=>`<img data-champ="${String(name)}">`;
  vm.createContext(ctx);vm.runInContext(testCode,ctx);
  const api=ctx.__V82_TEST__;
  const model={source:'preview',life:'alive',gameTime:742,gold:1480,respawn:0,alive:{our:5,enemy:4},local:{name:'그라가스'},ours:['그라가스','제리','룰루','브라움','오리아나'],enemies:['징크스','말파이트','오리아나','브랜드','애쉬'],threat:{name:'징크스',score:94,damageType:'물리',dead:false,respawn:0},threats:[{name:'징크스',score:94,damageType:'물리'},{name:'말파이트',score:81,damageType:'마법'},{name:'오리아나',score:76,damageType:'마법'}],item:{name:'란두인의 예언',score:91,reason:'징크스 성장 + 치명타 위협 때문에 이번 판 우선순위 상승'},alts:['정령의 형상','워모그의 갑옷'],stat:{tree:'가시 갑옷 → 워모그의 갑옷 → 정령의 형상',source:'ARAM DB',verified:'A'},buildSame:false,job:'적 첫 진입을 받아친 뒤 2차 진입',matchup:'우리 약우세',power:{our:69,enemy:64,diff:5},plan:{tone:'good',headline:'지금 교전 가치 높음',detail:'상대 핵심 딜러 위치를 확인하고 수적 우위를 활용하세요.',steps:['상대 핵심 CC 위치 확인','우리 딜러 프리딜 공간 확보','징크스 노출 시 화력 집중']},warning:{tone:'warn',text:'말파이트 R 연계 가능 · 팀 간격 유지'},advice:{direction:'치명타 대응'}};
  const live=api.renderLive(model);
  ok('VM live renders all command-center semantics',live.includes('현재 판단')&&live.includes('내 플레이')&&live.includes('위협 TOP3')&&live.includes('실시간 빌드')&&(live.includes('LIVE 파워')||live.includes('한타 현황')));
  ok('VM live renders top-three threats',live.includes('징크스')&&live.includes('말파이트')&&live.includes('오리아나'));
  const dead={...model,life:'dead',respawn:23};
  const build=api.renderBuild(dead);
  ok('VM death render preserves purchase target hooks',build.includes('riRespawnStrip')&&build.includes('riBuildCompare')&&build.includes('riBuildCard opt')&&build.includes('riBuildMain'));
  ok('VM death render includes return sequence',build.includes('복귀 후 첫 행동')&&build.includes('적 첫 진입을 받아친 뒤 2차 진입')&&build.includes('징크스 위치 확인 전 무리 진입 금지'));
}catch(e){ok('VM command center render',false,e.stack||e.message)}

const report={version:'0.15.82+',active_version:manifest.version,generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'verify v0.15.82 command-center semantics remain intact while allowing intentional successor layout refinements',score_logic_changed:false,item_recommendation_logic_changed:false,ingame_hud_changed:true}};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/ingame-command-center-v01582-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status,active:manifest.version}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
