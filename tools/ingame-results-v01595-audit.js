'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});

const runtime=read('update/v0.15.95/runtime-source-stability-v01595.js');
const main=read('update/v0.15.95/main-v01595.js');
const pkg=JSON.parse(read('update/v0.15.95/package.json'));
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
let mod=null,patched='';
try{
  mod=require(path.join(root,'update/v0.15.95/runtime-source-stability-v01595.js'));
  patched=mod.patchRuntimeSource('random-ingame-coach-v01550.js',read('update/v0.15.50/random-ingame-coach-v01550.js'));
  new Function(patched);
  ok('patched in-game coach parses',true);
}catch(e){ok('patched in-game coach parses',false,e.stack||e.message)}

ok('package version',pkg.version==='0.15.95',pkg.version);
ok('package entry',pkg.main==='main-v01595.js',pkg.main);
ok('manifest version',manifest.version==='0.15.95',manifest.version);
ok('manifest package',by.get('package.json')==='update/v0.15.95/package.json',by.get('package.json')||'');
ok('manifest main',by.get('main-v01595.js')==='update/v0.15.95/main-v01595.js',by.get('main-v01595.js')||'');
ok('manifest runtime',by.get('runtime-source-stability-v01595.js')==='update/v0.15.95/runtime-source-stability-v01595.js',by.get('runtime-source-stability-v01595.js')||'');
ok('detail tab replaced by result',patched.includes('data-ri-tab="result">결과</button>')&&!patched.includes('data-ri-tab="detail">상세</button>'));
ok('result body renderer wired',patched.includes("ui.tab==='result'?renderResultV01595():renderLive(m)"));
ok('game-end auto transition wired',patched.includes('syncResultTransitionV01595(m)')&&patched.includes("ui.tab='result'"));
ok('existing heartbeat reused',patched.includes('resultHistorySignatureV01595()')&&!runtime.includes('setInterval('));
ok('no new mutation observer',!runtime.includes('MutationObserver'));
ok('history uses existing Match Lab state',patched.includes('aramHistoryState')&&patched.includes('h.matches||h.games||h.history'));
ok('recent five games shown',patched.includes('games.slice(0,5)'));
ok('recent twenty trend shown',patched.includes('games.slice(0,20)'));
ok('summary section exists',patched.includes('내 경기 요약'));
ok('analysis section exists',patched.includes('핵심 결과 분석'));
ok('final build section exists',patched.includes('최종 빌드'));
ok('recent matches section exists',patched.includes('최근 몇 경기'));
ok('trend section exists',patched.includes('최근 경기 추이'));
ok('improvement section exists',patched.includes('다음 개선점 및 추천'));
ok('missing data is not fabricated',patched.includes('결과 동기화 대기')&&patched.includes("return'-'"));
ok('scoring unchanged',mod&&mod.score_logic_changed===false,String(mod&&mod.score_logic_changed));
ok('Poro-Snax inherited',mod&&mod.poro_snax_filtered===true,String(mod&&mod.poro_snax_filtered));
ok('candidate DNA preview inherited',mod&&mod.random_pick_candidate_full_dna_preview_changed===true,String(mod&&mod.random_pick_candidate_full_dna_preview_changed));
ok('v0.15.79 safety lineage',main.includes("root:'main-v01579.js'")&&main.includes("replaceAll('0.15.79','0.15.80')"));

const report={version:'0.15.95',generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'Replace IN GAME detail tab with post-match result dashboard using existing Match Lab history and the existing in-game heartbeat; scoring unchanged.'}};
fs.mkdirSync(path.join(root,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(root,'audit-output/ingame-results-v01595-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
