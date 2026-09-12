'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});

const runtime=read('update/v0.15.98/runtime-source-stability-v01598.js');
const main=read('update/v0.15.98/main-v01598.js');
const pkg=JSON.parse(read('update/v0.15.98/package.json'));
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
let mod=null,prior=null,patched='';
try{
  prior=require(path.join(root,'update/v0.15.97/runtime-source-stability-v01597.js'));
  mod=require(path.join(root,'update/v0.15.98/runtime-source-stability-v01598.js'));
  patched=mod.patchRuntimeSource('random-ingame-coach-v01550.js',read('update/v0.15.50/random-ingame-coach-v01550.js'));
  new Function(patched);
  ok('patched in-game coach parses',true);
}catch(e){ok('patched in-game coach parses',false,e.stack||e.message)}

ok('package version',pkg.version==='0.15.98',pkg.version);
ok('package entry',pkg.main==='main-v01598.js',pkg.main);
ok('manifest version',manifest.version==='0.15.98',manifest.version);
ok('manifest package',by.get('package.json')==='update/v0.15.98/package.json',by.get('package.json')||'');
ok('manifest main',by.get('main-v01598.js')==='update/v0.15.98/main-v01598.js',by.get('main-v01598.js')||'');
ok('manifest runtime',by.get('runtime-source-stability-v01598.js')==='update/v0.15.98/runtime-source-stability-v01598.js',by.get('runtime-source-stability-v01598.js')||'');
ok('v0.15.97 parser retained',patched.includes('resultObjectsV01597')&&patched.includes('resultParticipantV01597'));
ok('v0.15.96 result sync retained',patched.includes('syncResultHistoryV01596(m)')&&patched.includes('renderResultSyncV01596()'));
ok('team KP uses team kills',patched.includes("teamKills=sum('kills')")&&patched.includes('/teamKills*100'));
ok('team damage rank added',patched.includes('damageRank')&&patched.includes('팀 내 ${c.damageRank}위'));
ok('vision placeholder removed from result renderer',!patched.includes('<span>시야 점수</span>'));
ok('CC seconds metadata added',patched.includes("'timeCCingOthers'")&&patched.includes("suffix:timed?'초':''"));
ok('item resolver used',patched.includes('aramItemArtResolverV01566')&&patched.includes('data-item-id'));
ok('numeric item-id UI removed from v98 renderer',patched.includes('itemHtmlV01598')&&!patched.includes('${label.slice(0,5)}'));
ok('champion square hard-fit added',patched.includes('.ri95ChampIcon>*')&&patched.includes('object-fit:cover!important'));
ok('recent-match header added',patched.includes('ri98RecentHeader')&&patched.includes('<span>아이템</span><span>평가</span>'));
ok('result renderer upgraded',patched.includes('renderResultV01598()')&&!patched.includes("ui.tab==='result'?renderResultV01595()"));
ok('visible coach version synced',patched.includes('INGAME COACH · v0.15.98'));
ok('result analysis upgraded',patched.includes('한타 관여도 ${c.kp}%')&&patched.includes('전방 수행'));
ok('old K+A mislabeled value removed',!patched.includes("<span>킬 관여</span><b>${x.kills===null||x.assists===null?'-':fmtV01595(x.kills+x.assists)}"));
ok('no new timer',!runtime.includes('setInterval('));
ok('no new mutation observer',!runtime.includes('MutationObserver'));
ok('scoring unchanged',mod&&mod.score_logic_changed===false,String(mod&&mod.score_logic_changed));
ok('item recommendation inheritance preserved',mod&&prior&&mod.item_recommendation_logic_changed===prior.item_recommendation_logic_changed,`v97=${prior&&prior.item_recommendation_logic_changed} v98=${mod&&mod.item_recommendation_logic_changed}`);
ok('safety lineage retained',main.includes("root:'main-v01579.js'")&&main.includes("via:'main-v01597.js'"));
ok('v98 feature flags',mod&&mod.ingame_results_team_kp===true&&mod.ingame_results_item_icons===true&&mod.ingame_results_champion_square_fit===true);

const report={version:'0.15.98',generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'Verify IN GAME Results integrity and visual hotfix: real KP percentage, team-relative ranks/share, CC units, item artwork, square champion portraits, upgraded coaching copy, visible version sync, and inherited safety/result-sync behavior.'}};
fs.mkdirSync(path.join(root,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(root,'audit-output/ingame-results-integrity-v01598-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
