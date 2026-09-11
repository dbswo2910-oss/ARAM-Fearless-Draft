'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8'),exists=p=>fs.existsSync(path.join(ROOT,p));
const m=JSON.parse(read('update/manifest.json')),by=new Map((m.files||[]).map(x=>[x.path,x.source]));
const src=t=>by.get(t)&&exists(by.get(t))?read(by.get(t)):'';const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const pkg=JSON.parse(src('package.json')||'{}'),entry=src(pkg.main||''),preload=src('preload.js'),safe=src('update-safety-v01579.js'),up=src('updater-safety-patch-v01579.js'),rt=src('runtime-safety-net-v01579.js'),loader=src('runtime-loader-v01579.js'),hb=src('hang-heartbeat-v01579.js'),wd=src('external-watchdog-v01579.js'),stab=src('runtime-source-stability-v01579.js');
for(const [n,s] of [['entry',entry],['preload',preload],['update safety',safe],['updater patch',up],['runtime safety',rt],['loader',loader],['heartbeat',hb],['watchdog',wd],['source stability',stab]]){try{new Function(s);ok(n+' parses',true)}catch(e){ok(n+' parses',false,e.message)}}
ok('manifest version',m.version==='0.15.79',m.version);ok('package version',pkg.version==='0.15.79',pkg.version);ok('package entry',pkg.main==='main-v01579.js',pkg.main);
for(const f of ['main-v01579.js','preload.js','update-safety-v01579.js','updater-safety-patch-v01579.js','runtime-safety-net-v01579.js','runtime-loader-v01579.js','runtime-source-stability-v01579.js','hang-heartbeat-v01579.js','external-watchdog-v01579.js'])ok('delivered '+f,String(by.get(f)||'').startsWith('update/v0.15.79/'),by.get(f)||'');
ok('boot guard is first-class before base compile',entry.indexOf('installBootGuard')>0&&entry.indexOf('installBootGuard')<entry.indexOf("require('./autosync-live-runtime-v01571')"));
ok('stable heartbeat owner is installed',entry.includes("hang-heartbeat-v01579")&&preload.includes("heartbeat-renderer.json")&&hb.includes("heartbeat-main.json"));
ok('runtime safety injected before performance owners',entry.includes("'runtime-blackbox-v01577.js','runtime-safety-net-v01579.js','runtime-performance-v01568.js'"));
ok('isolated loader finalizes safety net',entry.includes("runtime-loader-v01579")&&loader.includes('aramSafetyNetV01579?.finalize'));
ok('updater becomes transactional',entry.includes('patchUpdaterSource(src)')&&up.includes('prepareUpdateTransaction')&&up.includes('markUpdateApplied')&&up.includes('abortUpdateTransaction'));
ok('persistent snapshots include critical base files',safe.includes("'index.html','autosync-core.js','main.js','preload.js','package.json'"));
ok('boot probation requires both heartbeats',safe.includes('heartbeat-main.json')&&safe.includes('heartbeat-renderer.json')&&safe.includes('healthy>=12'));
ok('abnormal boot/hang triggers rollback',safe.includes('abnormal||hang||markedFailure')&&safe.includes('restoreSnapshot(x,root)')&&safe.includes("'SAFE-RB1'"));
ok('watchdog writes rollback failure marker',wd.includes('safety-failure.json')&&wd.includes('/^HNG-[MRB]001$/'));
ok('renderer safety has reentry and circuit breakers',rt.includes("'SAFE-R001'")&&rt.includes("'SAFE-CB1'")&&rt.includes("'SAFE-CB2'")&&rt.includes('disabledUntil'));
ok('safety targets known heavy render paths',rt.includes('renderAll')&&rt.includes('runRandomCombos')&&rt.includes('renderRandomAnalysis')&&rt.includes('renderRandomDetails'));
let patcher=null;try{patcher=require(path.join(ROOT,by.get('runtime-source-stability-v01579.js'))).patchRuntimeSource;ok('source stability module loads',typeof patcher==='function')}catch(e){ok('source stability module loads',false,e.message)}
if(patcher){
  try{const raw=src('multi-user-isolation-v01516.js'),p=patcher('multi-user-isolation-v01516.js',raw);ok('live owner restore cannot call renderAll',!p.includes("if(typeof renderAll==='function')renderAll()"));ok('owner restore cannot launch TOP5',!p.match(/applyUserState[\s\S]{0,2600}runRandomCombos\s*\(/))}catch(e){ok('live owner restore cannot call renderAll',false,e.message)}
  const allow=new Set(['item-art-hotfix-v01563.js','item-art-unified-v01564.js','item-art-stable-v01565.js','ui-refresh-v01560.js','riot-grade-calibration-v01531.js']);let offenders=[];
  for(const [file,source] of by){if(!file.endsWith('.js')||allow.has(file)||file.startsWith('main'))continue;try{const p=patcher(file,read(source));if(/\.observe\(document\.(?:documentElement|body)/.test(p))offenders.push(file)}catch{}}
  ok('no new document-wide MutationObserver outside historical allowlist',offenders.length===0,offenders.join(','));
}
try{
  const patch=require(path.join(ROOT,by.get('updater-safety-patch-v01579.js'))).patchUpdaterSource,base=read('update/v0.15.70/main.js'),a=patch(base),b=patch(a);ok('updater patch idempotent',a===b);ok('updater snapshot occurs before writes',a.indexOf('prepareUpdateTransaction')<a.indexOf('for(const rel of touched)'));
}catch(e){ok('updater patch idempotent',false,e.message)}
try{
  const mod=require(path.join(ROOT,by.get('update-safety-v01579.js'))),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aram-v79-audit-')),app=path.join(tmp,'app'),root=path.join(tmp,'safe');fs.mkdirSync(app,{recursive:true});
  for(const [f,v] of [['a.js','OLD'],['index.html','IDX'],['autosync-core.js','CORE'],['main.js','MAIN'],['preload.js','PRE'],['package.json','PKG']])fs.writeFileSync(path.join(app,f),v);
  mod.prepareUpdateTransaction({root,appDir:app,current:'0.15.79',latest:'0.15.80',touched:['a.js','new.js']});fs.writeFileSync(path.join(app,'a.js'),'NEW');fs.writeFileSync(path.join(app,'new.js'),'NEWFILE');mod.markUpdateApplied({root,from:'0.15.79',to:'0.15.80'});const x=mod._test.readJson(path.join(root,'pending-update.json'));mod._test.restoreSnapshot(x,root);ok('snapshot rollback restores old file',fs.readFileSync(path.join(app,'a.js'),'utf8')==='OLD');ok('snapshot rollback removes newly added file',!fs.existsSync(path.join(app,'new.js')));fs.rmSync(tmp,{recursive:true,force:true});
}catch(e){ok('snapshot rollback restores old file',false,e.message);ok('snapshot rollback removes newly added file',false,e.message)}
try{
  const code=rt,events=[];let calls=0;const ctx={window:{},Date,JSON,Promise,setTimeout:()=>0,clearTimeout:()=>{},performance:{now:()=>Date.now()},console};ctx.window=ctx;ctx.aramDesktop={traceDiagnostic:e=>events.push(e)};ctx.runRandomCombos=function(){calls++;if(calls===1)ctx.runRandomCombos()};ctx.renderRandomDetails=function(){throw new Error('audit boom')};vm.createContext(ctx);vm.runInContext(code,ctx);ctx.aramSafetyNetV01579.finalize();ctx.runRandomCombos();ok('runtime safety blocks recursive heavy reentry',calls===1&&events.some(e=>e.code==='SAFE-R001'),String(calls));for(let i=0;i<3;i++)try{ctx.renderRandomDetails()}catch{}let threw=false;try{ctx.renderRandomDetails()}catch{threw=true}ok('runtime circuit opens after repeated renderer errors',!threw&&events.some(e=>e.code==='SAFE-CB1'));
}catch(e){ok('runtime safety blocks recursive heavy reentry',false,e.message);ok('runtime circuit opens after repeated renderer errors',false,e.message)}
ok('v79 remains scoring neutral',entry.includes("replaceAll('0.15.70','0.15.79')")&&!entry.includes('teamScore(')&&safe.includes('score_logic_changed:false')&&stab.includes('score_logic_changed:false'));
const report={version:'0.15.79',checks,pass:checks.every(x=>x.pass),score_logic_changed:false,info:{purpose:'permanent safety baseline for future patches: transaction rollback, hang probation, hot-path circuit breakers, CI policy'}};fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/runtime-stability-v01579-report.json'),JSON.stringify(report,null,2));for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exitCode=1;
