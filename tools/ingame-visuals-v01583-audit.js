'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const nums=v=>String(v).split('.').map(Number);const atLeast=(v,min)=>{const a=nums(v),b=nums(min);for(let i=0;i<3;i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false}return true};
const mod=require(path.join(ROOT,'update/v0.15.83/runtime-source-stability-v01583.js'));
const raw=read('update/v0.15.50/random-ingame-coach-v01550.js');
let code='';
try{code=mod.patchRuntimeSource('random-ingame-coach-v01550.js',raw);new Function(code);ok('v0.15.83 patched coach parses',true)}catch(e){ok('v0.15.83 patched coach parses',false,e.stack||e.message)}

ok('manifest remains v0.15.83 or newer',atLeast(manifest.version,'0.15.83'),manifest.version);
ok('v0.15.83 main remains delivered',by.get('main-v01583.js')==='update/v0.15.83/main-v01583.js',by.get('main-v01583.js')||'');
ok('v0.15.83 source stability remains delivered',by.get('runtime-source-stability-v01583.js')==='update/v0.15.83/runtime-source-stability-v01583.js',by.get('runtime-source-stability-v01583.js')||'');
const activePkg=by.get('package.json')||'';ok('active package is v0.15.83 or successor',/^update\/v0\.15\.(?:8[3-9]|9\d)\/package\.json$/.test(activePkg),activePkg);

const pkg=JSON.parse(read('update/v0.15.83/package.json'));
ok('historical package stays v0.15.83',pkg.version==='0.15.83',pkg.version);
ok('historical entry stays main-v01583.js',pkg.main==='main-v01583.js',pkg.main);
const main=read('update/v0.15.83/main-v01583.js');
try{new Function(main);ok('v0.15.83 main parses',true)}catch(e){ok('v0.15.83 main parses',false,e.message)}
ok('v0.15.83 inherits v0.15.82',main.includes('main-v01582.js')&&main.includes("replaceAll('0.15.82','0.15.83')"));
ok('v0.15.79 safety lineage stays explicit',main.includes('main-v01579.js')&&main.includes("replaceAll('0.15.79','0.15.80')"));

ok('v0.15.81 recommendation gate preserved',code.includes('function buildGateV01581(available,stat,ctx,threat)')&&code.includes('ranked=buildGateV01581(available,stat,ctx,top)'));
ok('v0.15.82 command center preserved',code.includes('function ensureCommandCenterStylesV01582()'));
ok('champion portrait helper preserved',code.includes('function portraitV01583(name')&&code.includes("typeof championIconHtml==='function'"));
ok('player portrait preserved',code.includes('class="ri83PlayerHead"')&&code.includes("portraitV01583(me,'lg')"));
ok('threat TOP3 portraits preserved',code.includes('function threatTop3HtmlV01583')&&code.includes("portraitV01583(x?.name,'md')"));
ok('inline champion-name visuals preserved',code.includes('function inlineChampionsV01583')&&code.includes('class="ri83Name"'));
ok('team roster visuals preserved',code.includes('>아군 조합<')&&code.includes('>적군 조합<')&&code.includes('function fightStatusHtmlV01583'));
ok('death-return champion visuals preserved',code.includes('ri83ReturnTarget'));
ok('historical v0.15.83 layer adds no scheduler/observer',!read('update/v0.15.83/runtime-source-stability-v01583.js').includes('setInterval(')&&!read('update/v0.15.83/runtime-source-stability-v01583.js').includes('MutationObserver'));
ok('draft scoring remains untouched',mod.score_logic_changed===false);
ok('item recommendation scoring remains inherited',mod.item_recommendation_logic_changed===false);
ok('champion visual change remains declared',mod.champion_visuals_changed===true);

function expose(src){const anchor='  ensureShell();document.addEventListener';if(!src.includes(anchor))throw new Error('coach startup anchor missing');return src.replace(anchor,'  window.__V83_TEST__={renderLive,renderBuild};\n'+anchor)}
try{
  const testCode=expose(code);const document={querySelector(){return null},querySelectorAll(){return[]},getElementById(){return null},addEventListener(){},createElement(){return{id:'',textContent:'',style:{},dataset:{},classList:{add(){},toggle(){},contains(){return false}},appendChild(){},addEventListener(){}}},head:{appendChild(){}},body:{classList:{toggle(){}}}};
  const ctx={console,document,localStorage:{getItem:()=>null,setItem:()=>{}},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},Promise,Date,Number,String,Object,Array,Map,Set,Math,JSON,performance:{now:()=>0}};ctx.window=ctx;ctx.window.addEventListener=()=>{};ctx.window.aramDesktop={};ctx.championIconHtml=name=>`<img data-champ="${String(name)}" alt="${String(name)}">`;vm.createContext(ctx);vm.runInContext(testCode,ctx);
  const model={source:'preview',life:'alive',gameTime:742,gold:1480,respawn:0,alive:{our:5,enemy:4},local:{name:'그라가스'},ours:['그라가스','제리','룰루','브라움','오리아나'],enemies:['징크스','말파이트','브랜드','카타리나','애쉬'],threat:{name:'징크스',score:94,damageType:'물리',dead:false,respawn:0},threats:[{name:'징크스',score:94,damageType:'물리'},{name:'말파이트',score:81,damageType:'마법'},{name:'브랜드',score:76,damageType:'마법'}],item:{name:'란두인의 예언',score:91,reason:'치명타 대응'},alts:['정령의 형상'],stat:{tree:'가시 갑옷 → 정령의 형상',source:'ARAM DB',verified:'A'},buildSame:false,job:'제리 옆에서 받아치기',matchup:'우리 약우세',power:{our:69,enemy:64,diff:5},plan:{tone:'good',headline:'지금 교전 가치 높음',detail:'말파이트 첫 진입을 확인하고 징크스 위치를 보세요.',steps:['제리 옆에서 받아치기','말파이트 진입 확인','징크스 노출 시 화력 집중']},warning:{tone:'warn',text:'말파이트 R 연계 가능'},advice:{direction:'치명타 대응'}};
  const live=ctx.__V83_TEST__.renderLive(model);ok('historical VM still renders champion portraits',live.includes('data-champ="그라가스"')&&live.includes('data-champ="징크스"'));
}catch(e){ok('historical VM champion visual render',false,e.stack||e.message)}

const report={version:'0.15.83-history',active_version:manifest.version,generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'forward-compatible historical contract for v0.15.83 champion visuals',score_logic_changed:false,item_recommendation_logic_changed:false}};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/ingame-visuals-v01583-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status,active:manifest.version}));for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');if(report.status!=='PASS')process.exit(1);
