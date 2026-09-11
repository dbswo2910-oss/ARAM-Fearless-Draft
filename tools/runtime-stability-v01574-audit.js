'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8'),exists=p=>fs.existsSync(path.join(ROOT,p));
const checks=[];const ok=(n,p,d='')=>checks.push({name:n,pass:!!p,detail:d});
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};
const m=JSON.parse(read('update/manifest.json')),by=new Map((m.files||[]).map(x=>[x.path,x.source]));
const src=t=>by.get(t)&&exists(by.get(t))?read(by.get(t)):'';
const pkg=JSON.parse(src('package.json')||'{}'),entryTarget=String(pkg.main||''),entry=src(entryTarget);
const historicalEntry=exists('update/v0.15.74/main-v01574.js')?read('update/v0.15.74/main-v01574.js'):'';
const historicalWatch=exists('update/v0.15.74/freeze-watchdog-v01574.js')?read('update/v0.15.74/freeze-watchdog-v01574.js'):'';
for(const [n,s] of [['current entry',entry],['historical v0.15.74 entry',historicalEntry],['historical v0.15.74 watchdog',historicalWatch]]){try{new Function(s);ok(n+' parses',true)}catch(e){ok(n+' parses',false,e.message)}}
ok('manifest is v0.15.74 or newer',ge(m.version,'0.15.74'),m.version);ok('package is v0.15.74 or newer',ge(pkg.version,'0.15.74'),pkg.version||'');ok('current package entry delivered',!!by.get(entryTarget)&&!!entry,`${entryTarget} -> ${by.get(entryTarget)||'missing'}`);
ok('historical v0.15.74 entry remains available',!!historicalEntry);ok('historical v0.15.74 watchdog remains available',!!historicalWatch);
let guardSource=entry;if(by.get('runtime-source-stability-v01577.js'))guardSource=src('runtime-source-stability-v01577.js');
ok('current runtime preserves shop53 retry guard',guardSource.includes("file==='random-ingame-shop-v01553.js'")&&guardSource.includes('Date.now()-Number(catalog.loadedAt||0)>15000')&&guardSource.includes('if(x?.ok)sync()'));
ok('current runtime preserves icons57 failed-catalog throttle',guardSource.includes("file==='item-icons-global-v01557.js'")&&guardSource.includes('else catalog=x||null')&&guardSource.includes('Date.now()-Number(catalog.loadedAt||0)>15000'));
ok('current runtime preserves art66 failed-catalog throttle',guardSource.includes("file==='item-art-runtime-v01566.js'")&&guardSource.includes('if(!catalog||Date.now()-Number(catalog.loadedAt||0)>15000)loadCatalog().then(x=>{if(x?.ok)scan(root)})'));
if(by.get('runtime-loader-v01577.js')){const loader=src('runtime-loader-v01577.js');ok('current catalog patches happen before script execution',loader.indexOf('patchRuntimeSource(file,code)')>0&&loader.indexOf('patchRuntimeSource(file,code)')<loader.indexOf('executeJavaScript(code,false)'))}else{const sourceUrlAt=entry.lastIndexOf('sourceURL=${file}'),patchA=entry.lastIndexOf("file==='random-ingame-shop-v01553.js'"),patchB=entry.lastIndexOf("file==='item-icons-global-v01557.js'"),patchC=entry.lastIndexOf("file==='item-art-runtime-v01566.js'");ok('current catalog patches happen before script execution',sourceUrlAt>0&&patchA>0&&patchB>patchA&&patchC>patchB&&patchC<sourceUrlAt)}
ok('historical watchdog records Electron unresponsive',historicalWatch.includes("wc.on('unresponsive'"));ok('historical watchdog records render-process-gone',historicalWatch.includes("wc.on('render-process-gone'"));ok('historical watchdog recorded renderer interaction/runtime stats',historicalWatch.includes('__ARAM_FREEZE_TRACE_V01574__')&&historicalWatch.includes('shop53:')&&historicalWatch.includes('icons57:')&&historicalWatch.includes('art66:'));ok('historical watchdog probe was bounded',historicalWatch.includes('1400')&&historicalWatch.includes('probe-timeout'));
ok('score logic untouched by current wrapper',!entry.includes('teamScore(')&&!entry.includes('recommendPicks(')&&!entry.includes('recommendBans('));
const report={version:'0.15.74-historical',checks,pass:checks.every(x=>x.pass),score_logic_changed:false,forwardCompatible:true};fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/runtime-stability-v01574-report.json'),JSON.stringify(report,null,2));for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exit(1);
