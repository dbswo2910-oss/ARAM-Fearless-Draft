'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});

const runtime=read('update/v0.15.92/runtime-source-stability-v01592.js');
const main=read('update/v0.15.92/main-v01592.js');
const pkg=JSON.parse(read('update/v0.15.92/package.json'));
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));

ok('package version',pkg.version==='0.15.92',pkg.version);
ok('package entry',pkg.main==='main-v01592.js',pkg.main);
ok('manifest version',manifest.version==='0.15.92',manifest.version);
ok('manifest delivers main',by.get('main-v01592.js')==='update/v0.15.92/main-v01592.js',by.get('main-v01592.js')||'');
ok('manifest delivers runtime',by.get('runtime-source-stability-v01592.js')==='update/v0.15.92/runtime-source-stability-v01592.js',by.get('runtime-source-stability-v01592.js')||'');
ok('manifest delivers package',by.get('package.json')==='update/v0.15.92/package.json',by.get('package.json')||'');

let mod=null,patched='';
try{
  mod=require(path.join(root,'update/v0.15.92/runtime-source-stability-v01592.js'));
  const raw=read('update/v0.15.50/random-ingame-coach-v01550.js');
  patched=mod.patchRuntimeSource('random-ingame-coach-v01550.js',raw);
  new Function(patched);
  ok('patched IN GAME coach parses',true);
}catch(e){ok('patched IN GAME coach parses',false,e.stack||e.message)}

ok('shared build-item eligibility gate exists',patched.includes('function ri92BuildItemAllowed(name,id)'));
ok('Poro-Snax item id 2052 blocked',patched.includes("rid==='2052'"));
ok('localized Poro-Snax name filter present',/포로\\s\*간식/.test(patched)&&/poro\[\\s-\]\*snax/i.test(patched));
ok('inventory excludes blocked items',patched.includes('ri92BuildItemAllowed(n,rid)&&!seen.has(k)'));
ok('optimized route excludes blocked items',patched.includes("ri92BuildItemAllowed(x)&&!seen.has(k)"));
ok('priority rows exclude blocked items',patched.includes('.filter(n=>n&&ri92BuildItemAllowed(n)).slice(0,3)'));
ok('situational candidates exclude blocked items',patched.includes('if(!ri92BuildItemAllowed(n))continue;'));
ok('build target excludes blocked items',patched.includes('.find(n=>n&&ri92BuildItemAllowed(n))'));
ok('live route dedupe excludes blocked items',patched.includes('function ri87Unique(xs)')&&patched.includes("ri92BuildItemAllowed(x)&&!seen.has(k)"));
ok('scoring unchanged',mod&&mod.score_logic_changed===false,String(mod&&mod.score_logic_changed));
ok('item policy flag unchanged',mod&&mod.item_recommendation_logic_changed===false,String(mod&&mod.item_recommendation_logic_changed));
ok('Poro filter flag declared',mod&&mod.poro_snax_filtered===true,String(mod&&mod.poro_snax_filtered));
ok('v0.15.79 safety lineage preserved',main.includes("root:'main-v01579.js'")&&main.includes("replaceAll('0.15.79','0.15.80')"));
ok('v0.15.92 layer adds no scheduler',!runtime.includes('setInterval('));
ok('v0.15.92 layer adds no MutationObserver',!runtime.includes('MutationObserver'));

const report={version:'0.15.92',generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'Exclude Poro-Snax from every build/core/route recommendation surface without changing scoring or route-adoption behavior'}};
fs.mkdirSync(path.join(root,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(root,'audit-output/ingame-poro-snax-v01592-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
