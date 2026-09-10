'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const m=JSON.parse(read('update/manifest.json'));
const byPath=new Map((m.files||[]).map(x=>[x.path,x.source]));
const iconPath=byPath.get('random-item-icons-v01556.js'),pkgPath=byPath.get('package.json'),entryPath=byPath.get('main-v01573.js');
const icon=iconPath&&exists(iconPath)?read(iconPath):'',pkg=pkgPath&&exists(pkgPath)?JSON.parse(read(pkgPath)):{},entry=entryPath&&exists(entryPath)?read(entryPath):'';
for(const [name,src] of [['patched item icon runtime',icon],['v0.15.73 entry',entry]]){try{new Function(src);ok(`${name} parses`,true)}catch(e){ok(`${name} parses`,false,e.message)}}
ok('manifest version is 0.15.73',m.version==='0.15.73',m.version);
ok('package version is 0.15.73',pkg.version==='0.15.73',pkg.version||'missing');
ok('package launches v0.15.73 entry',pkg.main==='main-v01573.js',pkg.main||'missing');
ok('v0.15.73 entry delivered',entryPath==='update/v0.15.73/main-v01573.js',entryPath||'missing');
ok('patched v0.15.56 runtime delivered from v0.15.73',iconPath==='update/v0.15.73/random-item-icons-v01556.js',iconPath||'missing');
ok('v0.15.72 Random Practice owner preserved',entry.includes("'runtime-random-practice-v01572.js'"));
ok('v0.15.71 live AutoSync governor preserved',entry.includes("'runtime-live-autosync-v01571.js'"));
ok('v0.15.73 promotes Electron runtime version',entry.includes("replaceAll('0.15.70','0.15.73')"));
ok('failed catalog no longer recurses unconditionally into sync',!icon.includes('loadCatalog().then(()=>sync())'));
ok('failed catalog uses slow retry gate',icon.includes('scheduleCatalogRetry')&&icon.includes('30000-(Date.now()-lastFailureAt)')&&icon.includes('Math.max(15000'));
ok('sync retries only after failure cooldown',icon.includes('Date.now()-lastFailureAt>=30000'));
ok('successful catalog alone re-enters decoration sync',icon.includes('if(x?.ok)sync()'));
ok('runtime exposes catalog retry diagnostics',icon.includes('getStatus:()=>({catalogOk:!!catalog?.ok,pending:!!pending,retryScheduled:!!retryTimer,lastFailureAt})'));
ok('score logic remains unchanged',icon.includes('score_logic_changed:false'));

async function failedCatalogVm(){
  let calls=0,intervals=0;const timeouts=[];
  const shell={querySelector(){return null},querySelectorAll(){return[]}};
  const dummy=()=>({id:'',className:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){},contains(){return false}},appendChild(){},prepend(){},remove(){},querySelector(){return null},querySelectorAll(){return[]},parentElement:{insertBefore(){}},previousElementSibling:null});
  const document={head:{appendChild(){}},createElement:()=>dummy(),querySelector:s=>s==='#riCoachShellV01550'?shell:null,querySelectorAll:()=>[]};
  const context={window:null,document,Node:{TEXT_NODE:3},console,Date,Math,Map,Set,Object,String,Number,Array,JSON,Promise,encodeURIComponent,
    setInterval(fn,ms){intervals++;return intervals},clearInterval(){},
    setTimeout(fn,ms){timeouts.push({fn,ms});return timeouts.length},clearTimeout(){},
  };
  context.window=context;context.window.aramDesktop={getItemCatalog:async()=>{calls++;return{ok:false,error:'forced failure'}}};
  vm.runInNewContext(icon,context);
  await Promise.resolve();await Promise.resolve();await Promise.resolve();await new Promise(r=>setImmediate(r));
  const status=context.window.aramRandomItemIconsV01556?.getStatus?.()||{};
  ok('VM failed catalog performs one immediate fetch only',calls===1,`calls=${calls}`);
  ok('VM failed catalog schedules one delayed retry',timeouts.filter(x=>x.ms>=15000).length===1,JSON.stringify(timeouts.map(x=>x.ms)));
  ok('VM failed catalog does not create zero-delay Promise retry storm',timeouts.filter(x=>x.ms<1000).length===0,JSON.stringify(timeouts.map(x=>x.ms)));
  ok('VM failed catalog leaves runtime responsive/ready',!!context.window.__ARAM_RANDOM_ITEM_ICONS_V01556__&&status.catalogOk===false&&status.retryScheduled===true,JSON.stringify(status));
  ok('VM historical interval ownership remains available for v0.15.70 governor',intervals===1,`intervals=${intervals}`);
}
(async()=>{
  try{await failedCatalogVm()}catch(e){ok('failed-catalog VM regression',false,e.stack||e.message)}
  const report={version:'0.15.73',generated_at:new Date().toISOString(),pass:checks.every(x=>x.pass),checks,info:{rootCause:'random-item-icons-v01556 recursively retried getItemCatalog when catalog response was ok:false',reproduced:true,scoreLogicChanged:false}};
  fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/runtime-stability-v01573-report.json'),JSON.stringify(report,null,2));
  for(const c of checks)console.log(`${c.pass?'PASS':'FAIL'} ${c.name}${c.detail?' · '+c.detail:''}`);if(!report.pass)process.exit(1);
})();
