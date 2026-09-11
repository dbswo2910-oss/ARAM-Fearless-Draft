'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const parts=String(manifest.version||'0.0.0').split('.').map(Number);
const atLeast=(maj,min,patch)=>parts[0]>maj||(parts[0]===maj&&(parts[1]>min||(parts[1]===min&&parts[2]>=patch)));
const digits=String(manifest.version||'0.15.82').replace(/\D/g,'');
const current=`update/v${manifest.version}/runtime-source-stability-v${digits}.js`;
const mod=require(path.join(ROOT,fs.existsSync(path.join(ROOT,current))?current:'update/v0.15.82/runtime-source-stability-v01582.js'));
const raw=read('update/v0.15.50/random-ingame-coach-v01550.js');
let code='';
try{code=mod.patchRuntimeSource('random-ingame-coach-v01550.js',raw);new Function(code);ok('patched coach parses',true)}catch(e){ok('patched coach parses',false,e.stack||e.message)}

ok('manifest is v0.15.82 or successor',atLeast(0,15,82),manifest.version);
ok('active package follows manifest',by.get('package.json')===`update/v${manifest.version}/package.json`,by.get('package.json')||'');
ok('historical v0.15.82 main delivered',by.get('main-v01582.js')==='update/v0.15.82/main-v01582.js',by.get('main-v01582.js')||'');
ok('historical v0.15.82 stability delivered',by.get('runtime-source-stability-v01582.js')==='update/v0.15.82/runtime-source-stability-v01582.js',by.get('runtime-source-stability-v01582.js')||'');
const pkg=JSON.parse(read('update/v0.15.82/package.json')),main=read('update/v0.15.82/main-v01582.js');
ok('historical v0.15.82 package intact',pkg.version==='0.15.82'&&pkg.main==='main-v01582.js',`${pkg.version} / ${pkg.main}`);
ok('v0.15.82 inherits v0.15.81',main.includes('main-v01581.js')&&main.includes("replaceAll('0.15.81','0.15.82')"));
ok('v0.15.79 safety lineage stays explicit',main.includes('main-v01579.js')&&main.includes("replaceAll('0.15.79','0.15.80')"));

ok('recommendation gate hook preserved',code.includes('function buildGateV01581(available,stat,ctx,threat)')&&code.includes('ranked=buildGateV01581(available,stat,ctx,top)'));
ok('command-center style owner preserved',code.includes('function ensureCommandCenterStylesV01582()'));
ok('live current-judgment semantics preserved',code.includes('현재 판단'));
ok('live player-action semantics preserved',code.includes('내 플레이'));
ok('live threat TOP3 semantics preserved',code.includes('위협 TOP3'));
ok('live build semantics preserved',code.includes('실시간 빌드'));
ok('live fight-status semantics preserved',(code.includes('한타 현황')||code.includes('LIVE 파워'))&&(code.includes('팀 전투력'))&&(code.includes('보유 골드')||code.includes('내 골드'))&&(code.includes('생존 현황')||code.includes('내 상태')));
ok('death build shop hooks preserved',code.includes('riBuildCompare')&&code.includes('riBuildCard opt')&&code.includes('riBuildMain'));
ok('death return plan preserved',code.includes('ri82ReturnPlan')&&code.includes('복귀 후 첫 행동'));
ok('Korean live tab preserved',code.includes('data-ri-tab="live">실시간</button>'));
ok('historical v0.15.82 layer adds no scheduler or observer',!read('update/v0.15.82/runtime-source-stability-v01582.js').includes('setInterval(')&&!read('update/v0.15.82/runtime-source-stability-v01582.js').includes('MutationObserver'));
ok('draft/champion scoring remains untouched',mod.score_logic_changed===false);
const itemPolicyOk=mod.item_recommendation_logic_changed===false||(atLeast(0,15,87)&&mod.item_recommendation_logic_changed===true&&mod.route_adoption_changed===true);
ok('item recommendation policy is inherited or explicit successor route-adoption policy',itemPolicyOk,`item=${mod.item_recommendation_logic_changed} route=${mod.route_adoption_changed}`);
ok('HUD change remains explicit',mod.ingame_hud_changed===true);
if(atLeast(0,15,87)){
  ok('v0.15.87 route-adoption successor keeps v0.15.82 command center semantics',code.includes('사용자 선택 반영')&&code.includes('초기 추천 루트 A')&&code.includes('다음 구매 우선순위 TOP3'));
}

const report={version:'0.15.82-forward-contract',active_version:manifest.version,generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'verify the v0.15.82 command-center contract remains intact while allowing explicit successor recommendation policies',score_logic_changed:mod.score_logic_changed,item_recommendation_logic_changed:mod.item_recommendation_logic_changed,route_adoption_changed:!!mod.route_adoption_changed,ingame_hud_changed:mod.ingame_hud_changed}};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/ingame-command-center-v01582-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status,active:manifest.version}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
