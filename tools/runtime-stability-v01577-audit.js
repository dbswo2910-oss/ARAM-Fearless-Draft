'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8'),exists=p=>fs.existsSync(path.join(ROOT,p));
const m=JSON.parse(read('update/manifest.json')),by=new Map((m.files||[]).map(x=>[x.path,x.source]));
const checks=[];const ok=(n,p,d='')=>checks.push({name:n,pass:!!p,detail:d});
const src=t=>by.get(t)&&exists(by.get(t))?read(by.get(t)):'';
const pkg=JSON.parse(src('package.json')||'{}'),entry=src(pkg.main||''),preload=src('preload.js');
const bb=src('freeze-blackbox-v01577.js'),ren=src('runtime-blackbox-v01577.js'),stab=src('runtime-source-stability-v01577.js'),loader=src('runtime-loader-v01577.js');
for(const [n,s] of [['entry',entry],['preload',preload],['blackbox',bb],['renderer blackbox',ren],['source stability',stab],['runtime loader',loader]]){try{new Function(s);ok(n+' parses',true)}catch(e){ok(n+' parses',false,e.message)}}
ok('manifest version',m.version==='0.15.77',m.version);ok('package version',pkg.version==='0.15.77',pkg.version||'');ok('package entry',pkg.main==='main-v01577.js',pkg.main||'');
for(const [t,s] of [['main-v01577.js','update/v0.15.77/main-v01577.js'],['preload.js','update/v0.15.77/preload.js'],['freeze-blackbox-v01577.js','update/v0.15.77/freeze-blackbox-v01577.js'],['runtime-blackbox-v01577.js','update/v0.15.77/runtime-blackbox-v01577.js'],['runtime-source-stability-v01577.js','update/v0.15.77/runtime-source-stability-v01577.js'],['runtime-loader-v01577.js','update/v0.15.77/runtime-loader-v01577.js']])ok('delivered '+t,by.get(t)===s,by.get(t)||'');
ok('preload exposes blackbox trace',preload.includes("traceDiagnostic: payload => ipcRenderer.send('diagnostics:blackbox-v01577'"));
ok('preload exposes last diagnostic',preload.includes("getLastDiagnostic: () => ipcRenderer.invoke('diagnostics:get-last-v01577')"));
ok('main installs blackbox before base compile',entry.indexOf("blackbox.install({version:'0.15.77'})")>0&&entry.indexOf("blackbox.install({version:'0.15.77'})")<entry.indexOf("const autosyncCore=require('./autosync-core')"));
ok('main injects renderer blackbox first',entry.includes("'runtime-blackbox-v01577.js','runtime-performance-v01568.js'"));
ok('main delegates injection to isolated loader',entry.includes("runtime-loader-v01577').injectRuntimeStack"));
ok('loader isolates per-file failures',loader.includes('runtime-inject-error')&&loader.includes('for(let i=0;i<scripts.length;i++)')&&loader.includes('results.push({file,code:injCode,ok})'));
ok('loader always reaches finalization after handled per-file errors',loader.includes('runtime-finalize-end')&&loader.includes('finishBootstrap')&&loader.includes('restoreTimerHook')&&loader.includes('aramBlackboxV01577?.rescan'));
ok('loader assigns deterministic RTI codes',loader.includes("'RTI-'+String(i+1).padStart(3,'0')")&&loader.includes("'RTI-BS1'")&&loader.includes("'RTI-FIN'"));
ok('slow runtime injection requests exact stack capture',loader.includes('runtime-inject-slow')&&loader.includes("captureNow(wc,'runtime-inject:'+file)"));
ok('watchdog probe is single-flight',bb.includes('if(wc.isDestroyed()||probeBusy)return')&&!bb.includes('Promise.race([wc.executeJavaScript'));
ok('debugger is prepared before freeze capture',bb.indexOf('prepareDebugger().catch(()=>{})')>0&&bb.indexOf('prepareDebugger().catch(()=>{})')<bb.indexOf('const captureStack=async'));
ok('CDP debugger force pause is wired',bb.includes("dbg.sendCommand('Debugger.enable')")&&bb.includes("dbg.sendCommand('Debugger.pause')")&&bb.includes("dbg.sendCommand('Debugger.resume')"));
ok('FRZ-003 persists call stack',bb.includes("recordStack('FRZ-003'")&&bb.includes('functionName')&&bb.includes('line:Number')&&bb.includes('column:Number'));
ok('blackbox distinguishes timeout/unresponsive/crash',bb.includes("'FRZ-001'")&&bb.includes("'FRZ-002'")&&bb.includes("'CRS-001'"));
ok('renderer blackbox records JS errors/rejections',ren.includes("'JS-E001'")&&ren.includes("'JS-E002'")&&ren.includes("'JS-P001'")&&ren.includes("'JS-P002'"));
ok('renderer blackbox records slow operations and long tasks',ren.includes("'OP-SLOW'")&&ren.includes("'OP-CRIT'")&&ren.includes("'LT-001'")&&ren.includes("'LT-002'"));
ok('renderer diagnostic badge exists',ren.includes('aramBbxBadgeV01577')&&ren.includes('DIAG OK'));
let patcher=null;try{patcher=require(path.join(ROOT,by.get('runtime-source-stability-v01577.js'))).patchRuntimeSource;ok('source stability module loads',typeof patcher==='function')}catch(e){ok('source stability module loads',false,e.message)}
if(patcher){
 const targets=['random-ingame-shop-v01553.js','item-icons-global-v01557.js','item-art-runtime-v01566.js','role-mastery-drilldown-v01522.js','role-profile-specialized-v01530.js','profile-ux-v01537.js','riot-grade-calibration-history-v01532.js'];
 for(const f of targets){try{const raw=src(f),one=patcher(f,raw),two=patcher(f,one);ok('source patch idempotent '+f,!!raw&&one===two)}catch(e){ok('source patch idempotent '+f,false,e.message)}}
 try{const x=patcher('item-art-runtime-v01566.js',src('item-art-runtime-v01566.js'));ok('item art observer no longer watches documentElement attributes',!x.includes("observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true")&&x.includes("document.getElementById('random')")&&x.includes('observer.observe(root,{childList:true,subtree:true})'))}catch(e){ok('item art observer no longer watches documentElement attributes',false,e.message)}
 for(const f of ['role-mastery-drilldown-v01522.js','role-profile-specialized-v01530.js','profile-ux-v01537.js','riot-grade-calibration-history-v01532.js']){try{const x=patcher(f,src(f));ok('profile observer scoped '+f,!x.includes('mo.observe(document.documentElement,{subtree:true,childList:true});')&&x.includes("document.getElementById('pp19ov')"))}catch(e){ok('profile observer scoped '+f,false,e.message)}}
 try{const x=patcher('random-ingame-shop-v01553.js',src('random-ingame-shop-v01553.js'));ok('v53 catalog retry guard retained',x.includes('Date.now()-Number(catalog.loadedAt||0)>15000')&&x.includes('if(x?.ok)sync()'))}catch(e){ok('v53 catalog retry guard retained',false,e.message)}
}
(async()=>{
 let tmp=[];
 try{
  const loaderPath=path.join(ROOT,by.get('runtime-loader-v01577.js')),dir=path.dirname(loaderPath);tmp=['__audit_ok_a.js','__audit_fail.js','__audit_ok_b.js'];
  fs.writeFileSync(path.join(dir,tmp[0]),'window.A=1;');fs.writeFileSync(path.join(dir,tmp[1]),"throw new Error('audit fail');");fs.writeFileSync(path.join(dir,tmp[2]),'window.B=1;');
  const {injectRuntimeStack}=require(loaderPath),calls=[],events=[];
  const wc={executeJavaScript:code=>{calls.push(code);return code.includes('sourceURL=__audit_fail.js')?Promise.reject(new Error('audit fail')):Promise.resolve(true)}};
  const fake={record:(code,kind,detail)=>events.push({code,kind,detail}),captureNow:()=>Promise.resolve(true)};
  const r=await injectRuntimeStack({mainWindow:{webContents:wc},scripts:tmp,blackbox:fake,patchRuntimeSource:(_f,c)=>c});
  ok('runtime failure does not abort later injection',r.map(x=>x.ok).join(',')==='true,false,true'&&calls.some(x=>x.includes('sourceURL=__audit_ok_b.js')));
  ok('runtime failure still reaches finalizer',events.some(x=>x.code==='RTI-FIN'&&x.kind==='runtime-finalize-end')&&calls.some(x=>x.includes('restoreTimerHook')));
 }catch(e){ok('runtime failure does not abort later injection',false,e.message);ok('runtime failure still reaches finalizer',false,e.message)}
 finally{try{const dir=path.dirname(path.join(ROOT,by.get('runtime-loader-v01577.js')));for(const f of tmp)fs.rmSync(path.join(dir,f),{force:true})}catch{}}
 ok('score logic untouched by v77 infrastructure',!entry.includes('teamScore(')&&!entry.includes('recommendPicks(')&&!entry.includes('recommendBans(')&&ren.includes('score_logic_changed:false'));
 const report={version:'0.15.77',checks,pass:checks.every(x=>x.pass),score_logic_changed:false,info:{purpose:'capture exact renderer freeze stacks and prevent partial runtime initialization'}};
 fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/runtime-stability-v01577-report.json'),JSON.stringify(report,null,2));
 for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exitCode=1;
})();
