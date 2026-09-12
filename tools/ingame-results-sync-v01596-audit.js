'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});

const runtime=read('update/v0.15.96/runtime-source-stability-v01596.js');
const main=read('update/v0.15.96/main-v01596.js');
const pkg=JSON.parse(read('update/v0.15.96/package.json'));
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
let mod=null,patched='';
try{
  mod=require(path.join(root,'update/v0.15.96/runtime-source-stability-v01596.js'));
  patched=mod.patchRuntimeSource('random-ingame-coach-v01550.js',read('update/v0.15.50/random-ingame-coach-v01550.js'));
  new Function(patched);
  ok('patched in-game coach parses',true);
}catch(e){ok('patched in-game coach parses',false,e.stack||e.message)}

ok('package version',pkg.version==='0.15.96',pkg.version);
ok('package entry',pkg.main==='main-v01596.js',pkg.main);
ok('manifest version',manifest.version==='0.15.96',manifest.version);
ok('manifest package',by.get('package.json')==='update/v0.15.96/package.json',by.get('package.json')||'');
ok('manifest main',by.get('main-v01596.js')==='update/v0.15.96/main-v01596.js',by.get('main-v01596.js')||'');
ok('manifest runtime',by.get('runtime-source-stability-v01596.js')==='update/v0.15.96/runtime-source-stability-v01596.js',by.get('runtime-source-stability-v01596.js')||'');
ok('v0.15.95 result UI retained',patched.includes('data-ri-tab="result">결과</button>')&&patched.includes('renderResultV01595'));
ok('game-end history sync wired',patched.includes('syncResultHistoryV01596(m)')&&patched.includes("requestResultHistorySyncV01596('game-end')"));
ok('manual result tab refresh wired',patched.includes("if(ui.tab==='result')requestResultHistorySyncV01596('tab')"));
ok('Match Lab loader reused',patched.includes("typeof loadAramHistory==='function'")&&patched.includes('loadAramHistory(true)'));
ok('current account forced for result',patched.includes("h.targetMode='current'")&&patched.includes('h.target=null'));
ok('standard ARAM forced for result',patched.includes("h.queueMode='standard'"));
ok('fresh game guard uses live game id',patched.includes('expectedKey')&&patched.includes('resultStateV01595.lastGameKey'));
ok('stale previous game blocked after finish',patched.includes('resultSyncV01596.blocking&&!resultSyncV01596.synced')&&patched.includes('renderResultSyncV01596()'));
ok('bounded retry exists',runtime.includes('attempt>=10')&&runtime.includes('ingame_results_retry_count:10'));
ok('existing 700ms coach heartbeat reused',!runtime.includes('setInterval(')&&patched.includes('pumpResultHistorySyncV01596()'));
ok('no new mutation observer',!runtime.includes('MutationObserver'));
ok('sync state participates in render signature',patched.includes('resultSyncSignatureV01596()'));
ok('retry failure is explicit, not stale result',patched.includes('방금 경기 결과를 아직 불러오지 못했습니다'));
ok('scoring unchanged',mod&&mod.score_logic_changed===false,String(mod&&mod.score_logic_changed));
ok('item recommendation inheritance preserved',mod&&mod.item_recommendation_logic_changed===true,String(mod&&mod.item_recommendation_logic_changed));
ok('Poro-Snax inherited',mod&&mod.poro_snax_filtered===true,String(mod&&mod.poro_snax_filtered));
ok('candidate DNA preview inherited',mod&&mod.random_pick_candidate_full_dna_preview_changed===true,String(mod&&mod.random_pick_candidate_full_dna_preview_changed));
ok('v0.15.79 safety lineage',main.includes("root:'main-v01579.js'")&&main.includes("replaceAll('0.15.79','0.15.80')"));

const report={version:'0.15.96',generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'Hotfix IN GAME post-match results so game end actively refreshes current-account standard-ARAM Match Lab history with bounded retries and never presents the previous match as the just-finished result.'}};
fs.mkdirSync(path.join(root,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(root,'audit-output/ingame-results-sync-v01596-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
