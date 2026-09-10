'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const report={generatedAt:new Date().toISOString(),pass:[],fail:[],info:{}};
const ok=(cond,name,detail='')=>(cond?report.pass:report.fail).push({name,detail});
const ge=(a,b)=>{const A=String(a||'0').split('.').map(Number),B=String(b||'0').split('.').map(Number),n=Math.max(A.length,B.length);for(let i=0;i<n;i++){if((A[i]||0)!==(B[i]||0))return(A[i]||0)>(B[i]||0)}return true};

const m=JSON.parse(read('update/manifest.json'));
const byPath=new Map((m.files||[]).map(x=>[x.path,x.source]));
const runtimePath=byPath.get('item-art-runtime-v01566.js');
const mainPath=byPath.get('main.js');
const pkgPath=byPath.get('package.json');

ok(ge(m.version,'0.15.66'),'Manifest is v0.15.66 or newer',m.version);
ok(!!runtimePath&&/v0\.15\.66\/item-art-runtime-v01566\.js$/.test(runtimePath)&&exists(runtimePath),'v0.15.66 responsiveness owner remains delivered',runtimePath||'missing');
ok(!!mainPath&&exists(mainPath),'Current main is delivered',mainPath||'missing');
ok(!!pkgPath&&exists(pkgPath),'Current package is delivered',pkgPath||'missing');

const runtime=runtimePath&&exists(runtimePath)?read(runtimePath):'';
const main=mainPath&&exists(mainPath)?read(mainPath):'';
const pkg=pkgPath&&exists(pkgPath)?JSON.parse(read(pkgPath)):{};
for(const [code,name] of [[runtime,'v0.15.66 item-art runtime'],[main,'current main']]){
  try{new Function(code);ok(true,`${name} parses as JavaScript`)}catch(e){ok(false,`${name} parses as JavaScript`,e.message)}
}

ok(/__ARAM_UI_REFRESH_V01560__\s*=\s*true/.test(runtime),'v0.15.60 polling layer is preempted before load');
ok(/__ARAM_ITEM_ART_HOTFIX_V01563__\s*=\s*true/.test(runtime),'v0.15.63 polling layer is preempted before load');
ok(/__ARAM_ITEM_ART_UNIFIED_V01564__\s*=\s*true/.test(runtime),'v0.15.64 polling layer is preempted before load');
ok(/__ARAM_ITEM_ART_STABLE_V01565__\s*=\s*true/.test(runtime),'v0.15.65 polling layer is preempted before load');
ok(/__ARAM_ITEM_ART_RUNTIME_V01566__\s*=\s*true/.test(runtime)&&/__ARAM_ITEM_ART_SINGLE_OWNER_V01566__\s*=\s*true/.test(runtime),'v0.15.66 single-owner readiness markers exist');
ok(!/setInterval\s*\(/.test(runtime),'v0.15.66 has no recurring full-document polling interval');
ok(!/sessionNonce/.test(runtime),'v0.15.66 does not force per-session icon redownloads');
ok(/new MutationObserver\(onMutations\)/.test(runtime),'v0.15.66 uses one mutation-driven image observer');
ok(/aramItemArtResolverV01565\s*=\s*api/.test(runtime)&&/aramItemArtResolverV01564\s*=\s*api/.test(runtime),'Historical resolver API names are shimmed to the v0.15.66 owner');
ok(/score_logic_changed:false/.test(runtime),'Responsiveness hotfix is score-neutral');

const runtimeAt=main.indexOf("'item-art-runtime-v01566.js'");
const ui60At=main.indexOf("'ui-refresh-v01560.js'");
const hotfix63At=main.indexOf("'item-art-hotfix-v01563.js'");
const unified64At=main.indexOf("'item-art-unified-v01564.js'");
const stable65At=main.indexOf("'item-art-stable-v01565.js'");
ok(runtimeAt>=0&&runtimeAt<ui60At&&runtimeAt<hotfix63At&&runtimeAt<unified64At&&runtimeAt<stable65At,'Current main keeps v0.15.66 owner before every historical item-art polling layer');
ok(main.includes('__ARAM_ITEM_ART_RUNTIME_V01566__')&&main.includes('__ARAM_ITEM_ART_SINGLE_OWNER_V01566__'),'Current main readiness guard covers v0.15.66 runtime owner');
const vmVersion=(main.match(/const VERSION='([^']+)'/)||[])[1]||'';
ok(ge(vmVersion,'0.15.66'),'Current main VERSION is v0.15.66 or newer',vmVersion);
ok(ge(pkg.version,'0.15.66'),'Package version is v0.15.66 or newer',pkg.version);

// Runtime preemption simulation: v0.15.66 executes first, then historical item-art layers.
try{
  let observerCount=0,intervalCount=0;
  class FakeMutationObserver{constructor(cb){this.cb=cb;observerCount++}observe(){}disconnect(){}}
  const document={
    documentElement:{},
    head:{appendChild(){}},
    getElementById(){return null},
    createElement(){return{id:'',textContent:'',style:{},dataset:{}}},
    querySelectorAll(){return[]},
    addEventListener(){}
  };
  const window={aramDesktop:{getItemCatalog:()=>Promise.resolve({ok:true,version:'test',items:{}})}};
  const context=vm.createContext({window,document,MutationObserver:FakeMutationObserver,URL,Promise,console,setTimeout,clearTimeout,setInterval:(...args)=>{intervalCount++;return 1},clearInterval});
  vm.runInContext(runtime,context,{filename:'item-art-runtime-v01566.js'});
  for(const p of ['ui-refresh-v01560.js','item-art-hotfix-v01563.js','item-art-unified-v01564.js','item-art-stable-v01565.js']){
    const src=byPath.get(p);if(src&&exists(src))vm.runInContext(read(src),context,{filename:p});
  }
  ok(observerCount===1,'Preemption simulation leaves exactly one item-art MutationObserver',`observers=${observerCount}`);
  ok(intervalCount===0,'Preemption simulation leaves zero historical item-art polling intervals',`intervals=${intervalCount}`);
  ok(window.__ARAM_ITEM_ART_RUNTIME_V01566__===true&&window.__ARAM_ITEM_ART_SINGLE_OWNER_V01566__===true,'Preemption simulation exposes v0.15.66 runtime owner');
}catch(e){
  ok(false,'Runtime preemption simulation executes',e.stack||e.message);
}

report.info={
  scope:'Historical v0.15.66 startup/item-art responsiveness owner remains regression-covered while later releases may add additional performance ownership around it. Its item-art single-owner ordering, compatibility markers, no-polling guarantee, and score neutrality remain verified.',
  scoreLogicChanged:false,
  requiresRealWindowsVisualCheck:true,
  forwardCompatible:true
};
report.summary={pass:report.pass.length,fail:report.fail.length,status:report.fail.length?'FAIL':'PASS'};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output','runtime-stability-v01566-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report.summary));
for(const x of report.fail)console.error('FAIL',x.name,x.detail||'');
process.exitCode=report.fail.length?1:0;
