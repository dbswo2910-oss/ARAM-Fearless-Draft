'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8'),exists=p=>fs.existsSync(path.join(ROOT,p));
const m=JSON.parse(read('update/manifest.json')),by=new Map((m.files||[]).map(x=>[x.path,x.source]));
const checks=[];const ok=(n,p,d='')=>checks.push({name:n,pass:!!p,detail:d});
const src=t=>by.get(t)&&exists(by.get(t))?read(by.get(t)):'';
const pkg=JSON.parse(src('package.json')||'{}'),entry=src(pkg.main||''),preload=src('preload.js'),watch=src('freeze-watchdog-v01575.js'),patchSrc=src('ingame-transition-patch-v01575.js');
for(const [n,s] of [['entry',entry],['preload',preload],['watchdog',watch],['transition patch',patchSrc]]){try{new Function(s);ok(n+' parses',true)}catch(e){ok(n+' parses',false,e.message)}}
ok('manifest version',m.version==='0.15.75',m.version);ok('package version',pkg.version==='0.15.75',pkg.version||'');ok('package entry',pkg.main==='main-v01575.js',pkg.main||'');
ok('transition patch delivered',by.get('ingame-transition-patch-v01575.js')==='update/v0.15.75/ingame-transition-patch-v01575.js',by.get('ingame-transition-patch-v01575.js')||'');
ok('preload v75 delivered',by.get('preload.js')==='update/v0.15.75/preload.js',by.get('preload.js')||'');
ok('watchdog v75 delivered',by.get('freeze-watchdog-v01575.js')==='update/v0.15.75/freeze-watchdog-v01575.js',by.get('freeze-watchdog-v01575.js')||'');
ok('entry patches installed index before core/main compile',entry.indexOf('patchInstalledIndexV01575();')>0&&entry.indexOf('patchInstalledIndexV01575();')<entry.indexOf("const autosyncCore=require('./autosync-core')"));
ok('entry preserves v74 catalog guards',entry.includes("file==='random-ingame-shop-v01553.js'")&&entry.includes("file==='item-icons-global-v01557.js'")&&entry.includes("file==='item-art-runtime-v01566.js'"));
ok('preload exposes main-process trace channel',preload.includes("traceFreeze: payload => ipcRenderer.send('diagnostics:freeze-trace-v01575'"));
ok('watchdog listens for function-stage trace',watch.includes("ipcMain.on('diagnostics:freeze-trace-v01575'"));
ok('watchdog has separate durable stage log',watch.includes('freeze-stage-v01575.log')&&watch.includes('writeStage'));
ok('watchdog probe remains bounded',watch.includes('1200')&&watch.includes('probe-timeout'));
let patch=null;try{patch=require(path.join(ROOT,by.get('ingame-transition-patch-v01575.js')))}catch(e){ok('transition patch module loads',false,e.message)}
if(patch){
  ok('transition patch module loads',true);
  const fixture=patch.RULES.map((r,i)=>`/*${i}*/${r.old}`).join('\n');
  const first=patch.patchIndexText(fixture),second=patch.patchIndexText(first.text);
  ok('fixture patches all four transition contracts',first.ok&&first.changed&&first.results.filter(x=>x.status==='patched').length===4,JSON.stringify(first.results));
  ok('transition patch is idempotent',second.ok&&!second.changed&&second.results.every(x=>x.status==='already-patched'),JSON.stringify(second.results));
  ok('in-game apply cancels pending pick combinations',first.text.includes('aramRandomPracticeRuntimeV01572?.cancelCombos?.()'));
  ok('in-game apply does not synchronously enter pick render pipeline',first.text.includes("if(plan.kind==='in_game')")&&first.text.includes("return true}persist();renderRandomInputs();runRandomCombos();return true}"));
  ok('live detail path delegates only to single in-game owner',first.text.includes("LIVE_DETAIL_OWNER_REFRESH_QUEUED")&&first.text.includes("setTimeout(()=>window.aramRandomIngameRuntimeV01570?.refresh?.(),0)"));
  ok('in-game mode click avoids legacy renderRandomDetails',first.text.includes("INGAME_MODE_CLICK_QUEUED")&&!first.text.includes("if(randomViewMode==='ingame')renderRandomDetails();"));
  ok('Random tab avoids renderRandomAnalysis in in-game mode',first.text.includes("if(randomViewMode==='ingame'){setTimeout(()=>window.aramRandomIngameRuntimeV01570?.refresh?.(),0)}else renderRandomAnalysis()"));
  ok('function-stage codes bracket owner refresh',first.text.includes("code:'IG120'")&&first.text.includes("code:'IG121'")&&first.text.indexOf("code:'IG120'")<first.text.indexOf("code:'IG121'"));
}
ok('score logic untouched by v75 wrapper',!entry.includes('teamScore(')&&!entry.includes('recommendPicks(')&&!entry.includes('recommendBans(')&&patchSrc.includes('score_logic_changed:false'));
const report={version:'0.15.75',checks,pass:checks.every(x=>x.pass),score_logic_changed:false,info:{rootCauseTarget:'in_game AutoSync was synchronously re-entering Random Practice pick recommendation and legacy detail pipelines while the v0.15.70 in-game owner was also active'}};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/runtime-stability-v01575-report.json'),JSON.stringify(report,null,2));for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exit(1);
