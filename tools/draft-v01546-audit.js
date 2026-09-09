'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const report={generatedAt:new Date().toISOString(),pass:[],fail:[],info:{}};
const ok=(cond,name,detail='')=>(cond?report.pass:report.fail).push({name,detail});
const m=JSON.parse(read('update/manifest.json'));
const byPath=new Map((m.files||[]).map(x=>[x.path,x.source]));
const riskPath=byPath.get('draft-risk-board-v01546.js');
const layoutPath=byPath.get('draft-layout-v01545.js');
const balancePath=byPath.get('draft-balance-alerts-v01543.js');
const mainPath=byPath.get('main.js');
const pkgPath=byPath.get('package.json');
ok(m.version==='0.15.46','Manifest is v0.15.46',m.version);
ok(!!riskPath&&exists(riskPath),'v0.15.46 risk runtime delivered',riskPath||'missing');
ok(!!layoutPath&&/v0\.15\.45\/draft-layout-v01545\.js$/.test(layoutPath),'Stable v0.15.45 layout is retained',layoutPath||'missing');
ok(!!balancePath&&/v0\.15\.45\/draft-balance-alerts-v01543-clean\.js$/.test(balancePath),'Clean no-layout balance runtime is retained',balancePath||'missing');
ok(!!mainPath&&/v0\.15\.46\/main\.js$/.test(mainPath),'v0.15.46 main runtime delivered',mainPath||'missing');
ok(!!pkgPath&&/v0\.15\.46\/package\.json$/.test(pkgPath),'v0.15.46 package metadata delivered',pkgPath||'missing');
const s=riskPath&&exists(riskPath)?read(riskPath):'';
const main=mainPath&&exists(mainPath)?read(mainPath):'';
const pkg=pkgPath&&exists(pkgPath)?JSON.parse(read(pkgPath)):{};
try{new Function(s);ok(true,'Risk runtime parses as JavaScript')}catch(e){ok(false,'Risk runtime parses as JavaScript',e.message)}
try{new Function(main);ok(true,'Main runtime parses as JavaScript')}catch(e){ok(false,'Main runtime parses as JavaScript',e.message)}
ok(/__ARAM_DRAFT_RISK_BOARD_V01546__\s*=\s*true/.test(s),'v0.15.46 readiness marker exists');
for(const label of ['밸류 위험','포킹 위험','돌진 위험','강한 이니시 위험','캐치\/CC 위험','전열 처리 위험','유지력 위험','광역 한타 위험']){
  const plain=label.replace('\\/','/');ok(s.includes(plain),`Risk category exists: ${plain}`);
}
ok(/builderCore/.test(s)&&/insertAdjacentHTML\('afterbegin'/.test(s),'Risk board is rendered inside pick judgment builderCore');
ok(/draftEmergencyStack,#draftRiskBoardV01546/.test(s),'Legacy emergency cards are replaced instead of duplicated');
ok(/active\.map\(badgeHtml\)/.test(s),'All active risks are shown as compact badges');
ok(/active\.slice\(0,2\)/.test(s)&&/draftRiskDetailsV01546/.test(s),'Top two risks receive detailed explanations');
ok(/confidence\(ec\)/.test(s)&&/relative_to_our_comp:true/.test(s),'Partial-pick confidence and our-comp mitigation are encoded');
ok(/score_logic_changed:false/.test(s),'Risk board does not change recommendation scoring');
ok(main.includes("'draft-balance-alerts-v01543.js','draft-layout-v01545.js','draft-risk-board-v01546.js','role-metric-detail-v01518.js'"),'Main injection order keeps balance -> stable layout -> risk board');
ok(main.includes('__ARAM_DRAFT_RISK_BOARD_V01546__'),'Main readiness guard covers v0.15.46 risk board');
ok(/const VERSION='0\.15\.46'/.test(main),'Main VERSION is v0.15.46');
ok(pkg.version==='0.15.46','package.json VERSION is v0.15.46',pkg.version);
report.summary={pass:report.pass.length,fail:report.fail.length,status:report.fail.length?'FAIL':'PASS'};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output','draft-v01546-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report.summary));
for(const x of report.fail)console.error('FAIL',x.name,x.detail||'');
process.exitCode=report.fail.length?1:0;
