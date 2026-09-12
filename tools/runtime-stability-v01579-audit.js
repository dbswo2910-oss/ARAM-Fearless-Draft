'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const parts=v=>String(v||'0').split('.').map(x=>Number.parseInt(x,10)||0);
const atLeast=(a,b)=>{const A=parts(a),B=parts(b),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y}return true};
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const src=name=>by.get(name)&&exists(by.get(name))?read(by.get(name)):'';
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const pkg=JSON.parse(src('package.json')||'{}');
const currentTarget=String(pkg.main||''),currentEntry=src(currentTarget);
function collectMainChain(startTarget){
  const out=[],seen=new Set();let target=startTarget;
  while(target&&by.get(target)&&!seen.has(target)&&out.length<40){
    seen.add(target);const source=by.get(target);if(!source||!exists(source))break;const text=read(source);out.push({target,source,text});
    const refs=[...text.matchAll(/['"](main-v\d+\.js)['"]/g)].map(x=>x[1]);
    target=refs.find(x=>by.has(x)&&!seen.has(x))||'';
  }
  return out;
}
const currentChain=collectMainChain(currentTarget),currentChainTargets=currentChain.map(x=>x.target);
const baselineEntry=src('main-v01579.js');
const preload=src('preload.js'),safe=src('update-safety-v01579.js'),up=src('updater-safety-patch-v01579.js'),rt=src('runtime-safety-net-v01579.js'),loader=src('runtime-loader-v01579.js'),hb=src('hang-heartbeat-v01579.js'),wd=src('external-watchdog-v01579.js'),stab=src('runtime-source-stability-v01579.js');

for(const [name,code] of [['current entry',currentEntry],['v0.15.79 baseline entry',baselineEntry],['preload',preload],['update safety',safe],['updater patch',up],['runtime safety',rt],['loader',loader],['heartbeat',hb],['watchdog',wd],['source stability',stab]]){
  try{new Function(code);ok(name+' parses',!!code)}catch(e){ok(name+' parses',false,e.message)}
}
ok('manifest stays at or above safety baseline',atLeast(manifest.version,'0.15.79'),manifest.version);
ok('package stays at or above safety baseline',atLeast(pkg.version,'0.15.79'),pkg.version||'');
ok('current package entry is delivered',!!pkg.main&&!!by.get(pkg.main)&&!!currentEntry,pkg.main||'');
ok('v0.15.79 baseline entry remains delivered',String(by.get('main-v01579.js')||'').startsWith('update/v0.15.79/'),by.get('main-v01579.js')||'');
if(pkg.main!=='main-v01579.js')ok('successor entry inherits v0.15.79 baseline',currentChainTargets.includes('main-v01579.js'),currentChainTargets.join(' -> '));
else ok('v0.15.79 baseline is current entry',true,pkg.main);
for(const f of ['preload.js','update-safety-v01579.js','updater-safety-patch-v01579.js','runtime-safety-net-v01579.js','runtime-loader-v01579.js','runtime-source-stability-v01579.js','hang-heartbeat-v01579.js','external-watchdog-v01579.js'])ok('safety module delivered '+f,!!by.get(f)&&!!src(f),by.get(f)||'');

ok('boot guard runs before normal runtime compile',baselineEntry.indexOf('installBootGuard')>0&&baselineEntry.indexOf('installBootGuard')<baselineEntry.indexOf("require('./autosync-live-runtime-v01571')"));
ok('v78 freeze fix remains before base compile',baselineEntry.includes('patchInGame(before)')&&baselineEntry.includes('patchRenderAll(a.text)')&&baselineEntry.indexOf('patchInstalledIndex()')<baselineEntry.indexOf("const autosyncCore=require('./autosync-core')"));
ok('stable dual heartbeat installed',baselineEntry.includes('hang-heartbeat-v01579')&&preload.includes('heartbeat-renderer.json')&&hb.includes('heartbeat-main.json'));
ok('safety net loads before performance owners',baselineEntry.includes("'runtime-blackbox-v01577.js','runtime-safety-net-v01579.js','runtime-performance-v01568.js'"));
ok('isolated loader finalizes safety net',baselineEntry.includes('runtime-loader-v01579')&&loader.includes('aramSafetyNetV01579?.finalize'));
ok('updater is transaction wrapped',baselineEntry.includes('patchUpdaterSource(src)')&&up.includes('prepareUpdateTransaction')&&up.includes('markUpdateApplied')&&up.includes('abortUpdateTransaction'));
ok('persistent snapshot covers critical installed base',safe.includes("'index.html','autosync-core.js','main.js','preload.js','package.json'"));
ok('new-version probation requires both heartbeats',safe.includes('heartbeat-main.json')&&safe.includes('heartbeat-renderer.json')&&safe.includes('healthy>=12'));
ok('abnormal probation boot can restore snapshot',safe.includes('abnormal||hang||markedFailure')&&safe.includes('restoreSnapshot(x,root)')&&safe.includes("'SAFE-RB1'"));
ok('watchdog marks MAIN/RENDERER/BOTH failures for rollback',wd.includes('safety-failure.json')&&wd.includes("'HNG-M001'")&&wd.includes("'HNG-R001'")&&wd.includes("'HNG-B001'"));
ok('renderer safety includes reentry + two circuit types',rt.includes("'SAFE-R001'")&&rt.includes("'SAFE-CB1'")&&rt.includes("'SAFE-CB2'")&&rt.includes('disabledUntil'));
ok('renderer safety guards known heavy paths',rt.includes('renderAll')&&rt.includes('runRandomCombos')&&rt.includes('renderRandomAnalysis')&&rt.includes('renderRandomDetails')&&rt.includes('renderDataExplorer')&&rt.includes('renderAramHistoryFeedback'));

let patcher=null;
try{patcher=require(path.join(ROOT,by.get('runtime-source-stability-v01579.js'))).patchRuntimeSource;ok('source stability module loads',typeof patcher==='function')}catch(e){ok('source stability module loads',false,e.message)}
if(patcher){
  try{const p=patcher('multi-user-isolation-v01516.js',src('multi-user-isolation-v01516.js'));ok('owner-state restore cannot call monolithic renderAll',!p.includes("if(typeof renderAll==='function')renderAll()"));ok('owner-state restore cannot launch TOP5',!/applyUserState[\s\S]{0,3000}runRandomCombos\s*\(/.test(p));ok('owner activation stays deferred out of AutoSync stack',p.includes("code:'USR-110'")&&p.includes('setTimeout(()=>{try{activateOwner(p,s.account)'))}catch(e){ok('owner-state source hardening applies',false,e.message)}
  const historicalAllow=new Set(['item-art-hotfix-v01563.js','item-art-unified-v01564.js','item-art-stable-v01565.js','ui-refresh-v01560.js','riot-grade-calibration-v01531.js']);
  const nodeOnly=/^(?:main|runtime-source-stability|safe-index-patch|ingame-transition-patch|updater-safety-patch|update-safety|hang-heartbeat|external-watchdog|runtime-loader)/;
  const offenders=[];
  for(const [file,source] of by){
    if(!file.endsWith('.js')||historicalAllow.has(file)||nodeOnly.test(file))continue;
    try{const patched=patcher(file,read(source));if(/\.observe\(document\.(?:documentElement|body)/.test(patched))offenders.push(file)}catch(e){offenders.push(file+':PATCH_ERROR:'+e.message)}
  }
  ok('no new renderer document-wide MutationObserver outside historical allowlist',offenders.length===0,offenders.join(','));
}

try{
  const patch=require(path.join(ROOT,by.get('updater-safety-patch-v01579.js'))).patchUpdaterSource;
  const base=read('update/v0.15.70/main.js'),once=patch(base),twice=patch(once);
  ok('updater safety transform is idempotent',once===twice);
  ok('snapshot transaction begins before updater writes',once.indexOf('prepareUpdateTransaction')>=0&&once.indexOf('prepareUpdateTransaction')<once.indexOf('for(const rel of touched)'));
}catch(e){ok('updater safety transform executes',false,e.message)}

try{
  const mod=require(path.join(ROOT,by.get('update-safety-v01579.js'))),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'aram-v79-audit-')),appDir=path.join(tmp,'app'),root=path.join(tmp,'safe');fs.mkdirSync(appDir,{recursive:true});
  for(const [f,v] of [['a.js','OLD'],['index.html','IDX'],['autosync-core.js','CORE'],['main.js','MAIN'],['preload.js','PRE'],['package.json','PKG']])fs.writeFileSync(path.join(appDir,f),v);
  mod.prepareUpdateTransaction({root,appDir,current:'0.15.79',latest:'0.15.80',touched:['a.js','new.js']});
  fs.writeFileSync(path.join(appDir,'a.js'),'NEW');fs.writeFileSync(path.join(appDir,'new.js'),'NEWFILE');mod.markUpdateApplied({root,from:'0.15.79',to:'0.15.80'});
  const pending=mod._test.readJson(path.join(root,'pending-update.json'));mod._test.restoreSnapshot(pending,root);
  ok('rollback restores overwritten file',fs.readFileSync(path.join(appDir,'a.js'),'utf8')==='OLD');
  ok('rollback removes file introduced by failed update',!fs.existsSync(path.join(appDir,'new.js')));
  ok('rollback preserves critical base snapshot',fs.readFileSync(path.join(appDir,'package.json'),'utf8')==='PKG');
  fs.rmSync(tmp,{recursive:true,force:true});
}catch(e){ok('transaction rollback simulation',false,e.stack||e.message)}

try{
  const events=[];let calls=0;const ctx={Date,JSON,Promise,console,setTimeout:()=>0,clearTimeout:()=>{},performance:{now:()=>Date.now()}};ctx.window=ctx;ctx.aramDesktop={traceDiagnostic:e=>events.push(e)};ctx.runRandomCombos=function(){calls++;if(calls===1)ctx.runRandomCombos()};ctx.renderRandomDetails=function(){throw new Error('audit boom')};vm.createContext(ctx);vm.runInContext(rt,ctx);ctx.aramSafetyNetV01579.finalize();ctx.runRandomCombos();ok('runtime safety blocks recursive heavy reentry',calls===1&&events.some(e=>e.code==='SAFE-R001'),String(calls));for(let i=0;i<3;i++)try{ctx.renderRandomDetails()}catch{}let fourthThrew=false;try{ctx.renderRandomDetails()}catch{fourthThrew=true}ok('runtime circuit opens after repeated renderer errors',!fourthThrew&&events.some(e=>e.code==='SAFE-CB1'));
}catch(e){ok('runtime safety VM',false,e.stack||e.message)}

ok('safety baseline is scoring neutral',baselineEntry.includes("replaceAll('0.15.70','0.15.79')")&&!baselineEntry.includes('teamScore(')&&!baselineEntry.includes('recommendPicks(')&&!baselineEntry.includes('recommendBans(')&&safe.includes('score_logic_changed:false')&&stab.includes('score_logic_changed:false'));
const report={version:'0.15.79-baseline',currentVersion:manifest.version,checks,pass:checks.every(x=>x.pass),score_logic_changed:false,info:{purpose:'Permanent safety baseline preserved across successor versions: transaction rollback, probation, hot-path circuit breakers and release-gate policy',forwardCompatible:true,entryChain:currentChainTargets}};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/runtime-stability-v01579-report.json'),JSON.stringify(report,null,2));
for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exit(1);
