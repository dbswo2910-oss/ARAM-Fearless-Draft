'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});

const runtime=read('update/v0.15.97/runtime-source-stability-v01597.js');
const main=read('update/v0.15.97/main-v01597.js');
const pkg=JSON.parse(read('update/v0.15.97/package.json'));
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
let mod=null,prior=null,patched='';
try{
  prior=require(path.join(root,'update/v0.15.96/runtime-source-stability-v01596.js'));
  mod=require(path.join(root,'update/v0.15.97/runtime-source-stability-v01597.js'));
  patched=mod.patchRuntimeSource('random-ingame-coach-v01550.js',read('update/v0.15.50/random-ingame-coach-v01550.js'));
  new Function(patched);
  ok('patched in-game coach parses',true);
}catch(e){ok('patched in-game coach parses',false,e.stack||e.message)}

ok('package version',pkg.version==='0.15.97',pkg.version);
ok('package entry',pkg.main==='main-v01597.js',pkg.main);
ok('manifest version',manifest.version==='0.15.97',manifest.version);
ok('manifest package',by.get('package.json')==='update/v0.15.97/package.json',by.get('package.json')||'');
ok('manifest main',by.get('main-v01597.js')==='update/v0.15.97/main-v01597.js',by.get('main-v01597.js')||'');
ok('manifest runtime',by.get('runtime-source-stability-v01597.js')==='update/v0.15.97/runtime-source-stability-v01597.js',by.get('runtime-source-stability-v01597.js')||'');
ok('v0.15.96 result sync retained',patched.includes('syncResultHistoryV01596(m)')&&patched.includes('renderResultSyncV01596()'));
ok('nested stats compatibility added',patched.includes('p?.stats')&&patched.includes('resultStatsV01597'));
ok('raw LCU participant identity compatibility added',patched.includes('participantIdentities')&&patched.includes('resultAccountHintsV01597'));
ok('championId compatibility added',patched.includes('championId')&&patched.includes('resultChampionV01597'));
ok('nested final-item compatibility added',patched.includes("s?.['item'+i]")&&patched.includes('resultItemsV01597'));
ok('nested win compatibility added',patched.includes('s?.win')&&patched.includes('resultWinV01597'));
ok('existing-history backfill declared',mod&&mod.ingame_results_existing_history_backfill===true,String(mod&&mod.ingame_results_existing_history_backfill));
ok('no new timer',!runtime.includes('setInterval('));
ok('no new mutation observer',!runtime.includes('MutationObserver'));
ok('scoring unchanged',mod&&mod.score_logic_changed===false,String(mod&&mod.score_logic_changed));
ok('item recommendation inheritance preserved',mod&&prior&&mod.item_recommendation_logic_changed===prior.item_recommendation_logic_changed,`v96=${prior&&prior.item_recommendation_logic_changed} v97=${mod&&mod.item_recommendation_logic_changed}`);
ok('v0.15.79 safety lineage',main.includes("root:'main-v01579.js'")&&main.includes("via:'main-v01596.js'"));

try{
  const a=patched.indexOf('  function resultObjectsV01597('),b=patched.indexOf('  function kdaV01595(x){',a);
  if(a<0||b<0)throw new Error('compat parser slice not found');
  const code=patched.slice(a,b);
  const harness=new Function('historyStateV01595','resultNumV01595','norm','lolAutoSyncResolveChamp',`${code}\nreturn normalizeResultGameV01595({gameId:'KR-test',gameCreation:1770000000000,gameDuration:1200,participantIdentities:[{participantId:3,player:{puuid:'LOCAL-PUUID'}}],participants:[{participantId:3,championId:79,stats:{win:true,kills:8,deaths:6,assists:24,totalDamageDealtToChampions:28417,totalDamageTaken:52186,timeCCingOthers:48,visionScore:28,item0:6657,item1:3047,item2:3075,item3:3110,item4:3065,item5:3084,item6:0}}]});`);
  const num=(...xs)=>{for(const x of xs){const n=Number(x);if(Number.isFinite(n))return n}return null};
  const row=harness(()=>({account:{puuid:'LOCAL-PUUID'}}),num,v=>String(v??''),x=>Number(x?.championId??x)===79?'그라가스':'');
  ok('synthetic legacy LCU champion resolved',row.champ==='그라가스',row.champ);
  ok('synthetic legacy LCU KDA resolved',row.kills===8&&row.deaths===6&&row.assists===24,JSON.stringify([row.kills,row.deaths,row.assists]));
  ok('synthetic legacy LCU combat stats resolved',row.damage===28417&&row.taken===52186&&row.cc===48&&row.vision===28,JSON.stringify([row.damage,row.taken,row.cc,row.vision]));
  ok('synthetic legacy LCU items resolved',Array.isArray(row.items)&&row.items.length===6&&Number(row.items[0])===6657,JSON.stringify(row.items));
  ok('synthetic legacy LCU result resolved',row.result==='WIN',row.result);
}catch(e){ok('synthetic legacy LCU parser harness',false,e.stack||e.message)}

const report={version:'0.15.97',generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'Hotfix IN GAME Result parsing so existing League Client / Match Lab games using nested participant.stats and participantIdentities expose champion, KDA, damage, CC, vision and final items instead of win/loss-only placeholders.'}};
fs.mkdirSync(path.join(root,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(root,'audit-output/ingame-results-parser-v01597-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
