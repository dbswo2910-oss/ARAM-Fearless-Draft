'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8'),exists=p=>fs.existsSync(path.join(ROOT,p));
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};
const m=JSON.parse(read('update/manifest.json')),by=new Map((m.files||[]).map(x=>[x.path,x.source]));
const checks=[];const ok=(n,p,d='')=>checks.push({name:n,pass:!!p,detail:d});const src=t=>by.get(t)&&exists(by.get(t))?read(by.get(t)):'';
const pkg=JSON.parse(src('package.json')||'{}'),entryTarget=String(pkg.main||''),entry=src(entryTarget),v79Entry=src('main-v01579.js'),patchSrc=src('ingame-transition-patch-v01575.js');
function collectMainChain(startTarget){
  const out=[],seen=new Set();let target=startTarget;
  while(target&&by.get(target)&&!seen.has(target)&&out.length<40){
    seen.add(target);const source=by.get(target);if(!source||!exists(source))break;const text=read(source);out.push({target,source,text});
    const refs=[...text.matchAll(/['"](main-v\d+\.js)['"]/g)].map(x=>x[1]);
    target=refs.find(x=>by.has(x)&&!seen.has(x))||'';
  }
  return out;
}
const entryChain=collectMainChain(entryTarget),entryChainTargets=entryChain.map(x=>x.target);
const historicalEntry=exists('update/v0.15.75/main-v01575.js')?read('update/v0.15.75/main-v01575.js'):'';
const historicalPreload=exists('update/v0.15.75/preload.js')?read('update/v0.15.75/preload.js'):'';
const historicalWatch=exists('update/v0.15.75/freeze-watchdog-v01575.js')?read('update/v0.15.75/freeze-watchdog-v01575.js'):'';
for(const [n,s] of [['current entry',entry],['v0.15.79 safety successor base',v79Entry],['historical v75 entry',historicalEntry],['historical v75 preload',historicalPreload],['historical v75 watchdog',historicalWatch],['transition patch',patchSrc]]){try{new Function(s);ok(n+' parses',true)}catch(e){ok(n+' parses',false,e.message)}}
ok('manifest is v0.15.75 or newer',ge(m.version,'0.15.75'),m.version);ok('package is v0.15.75 or newer',ge(pkg.version,'0.15.75'),pkg.version||'');ok('current package entry delivered',!!by.get(entryTarget)&&!!entry,`${entryTarget} -> ${by.get(entryTarget)||'missing'}`);
ok('transition patch remains delivered',by.get('ingame-transition-patch-v01575.js')==='update/v0.15.75/ingame-transition-patch-v01575.js',by.get('ingame-transition-patch-v01575.js')||'');
ok('historical v75 trace implementation remains available',historicalPreload.includes("traceFreeze: payload => ipcRenderer.send('diagnostics:freeze-trace-v01575'")&&historicalWatch.includes("ipcMain.on('diagnostics:freeze-trace-v01575'"));
ok('historical v75 durable stage log remains available',historicalWatch.includes('freeze-stage-v01575.log')&&historicalWatch.includes('writeStage'));
ok('current entry inherits v0.15.79 safety successor',entryChainTargets.includes('main-v01579.js'),entryChainTargets.join(' -> '));
ok('successor chain still patches installed index before core/main compile',v79Entry.includes("require('./ingame-transition-patch-v01575')")&&v79Entry.indexOf('patchInstalledIndex')>0&&v79Entry.indexOf('patchInstalledIndex')<v79Entry.indexOf("const autosyncCore=require('./autosync-core')"));
let patch=null;try{patch=require(path.join(ROOT,by.get('ingame-transition-patch-v01575.js')))}catch(e){ok('transition patch module loads',false,e.message)}
if(patch){ok('transition patch module loads',true);const fixture=patch.RULES.map((r,i)=>`/*${i}*/${r.old}`).join('\n'),first=patch.patchIndexText(fixture),second=patch.patchIndexText(first.text);ok('fixture patches all four transition contracts',first.ok&&first.changed&&first.results.filter(x=>x.status==='patched').length===4,JSON.stringify(first.results));ok('transition patch is idempotent',second.ok&&!second.changed&&second.results.every(x=>x.status==='already-patched'),JSON.stringify(second.results));ok('in-game apply cancels pending pick combinations',first.text.includes('aramRandomPracticeRuntimeV01572?.cancelCombos?.()'));ok('in-game apply avoids synchronous pick render pipeline',first.text.includes("if(plan.kind==='in_game')")&&first.text.includes("return true}persist();renderRandomInputs();runRandomCombos();return true}"));ok('live detail delegates to single in-game owner',first.text.includes('LIVE_DETAIL_OWNER_REFRESH_QUEUED')&&first.text.includes("setTimeout(()=>window.aramRandomIngameRuntimeV01570?.refresh?.(),0)"));ok('in-game mode avoids legacy renderRandomDetails',first.text.includes('INGAME_MODE_CLICK_QUEUED')&&!first.text.includes("if(randomViewMode==='ingame')renderRandomDetails();"));ok('Random tab avoids analysis in in-game mode',first.text.includes("if(randomViewMode==='ingame'){setTimeout(()=>window.aramRandomIngameRuntimeV01570?.refresh?.(),0)}else renderRandomAnalysis()"));ok('function-stage codes bracket owner refresh',first.text.includes("code:'IG120'")&&first.text.includes("code:'IG121'"))}
ok('score logic untouched by current wrapper',!entry.includes('teamScore(')&&!entry.includes('recommendPicks(')&&!entry.includes('recommendBans(')&&patchSrc.includes('score_logic_changed:false'));
const report={version:'0.15.75-historical',checks,pass:checks.every(x=>x.pass),score_logic_changed:false,forwardCompatible:true,entryChain:entryChainTargets};fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/runtime-stability-v01575-report.json'),JSON.stringify(report,null,2));for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exit(1);
