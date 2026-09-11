'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const checks=[];const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});

const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const mod=require(path.join(ROOT,'update/v0.15.88/runtime-source-stability-v01588.js'));
const raw=read('update/v0.15.72/random-practice-focus-v01549.js');
let patched='';
try{patched=mod.patchRuntimeSource('random-practice-focus-v01549.js',raw);new Function(patched);ok('patched RANDOM focus parses',true)}catch(e){ok('patched RANDOM focus parses',false,e.stack||e.message)}

ok('manifest version is v0.15.88',manifest.version==='0.15.88',manifest.version);
ok('active package is v0.15.88',by.get('package.json')==='update/v0.15.88/package.json',by.get('package.json')||'');
ok('v0.15.88 main delivered',by.get('main-v01588.js')==='update/v0.15.88/main-v01588.js',by.get('main-v01588.js')||'');
ok('v0.15.88 runtime stability delivered',by.get('runtime-source-stability-v01588.js')==='update/v0.15.88/runtime-source-stability-v01588.js',by.get('runtime-source-stability-v01588.js')||'');

const pkg=JSON.parse(read('update/v0.15.88/package.json'));
ok('package version matches',pkg.version==='0.15.88',pkg.version);
ok('package entry matches',pkg.main==='main-v01588.js',pkg.main);
const main=read('update/v0.15.88/main-v01588.js');
ok('v0.15.88 inherits v0.15.87',main.includes("main-v01587.js")&&main.includes("replaceAll('0.15.87','0.15.88')"));
ok('v0.15.79 safety lineage remains explicit',main.includes("main-v01579.js")&&main.includes("replaceAll('0.15.79','0.15.80')"));

ok('TOP1 dedupe helper injected',patched.includes('function dedupeTop1LabelV01588(value)'));
ok('topCombo routes label through dedupe',patched.includes('name=dedupeTop1LabelV01588(name.replace('));
ok('duplicate compact champion label collapses',mod.dedupeTop1LabelV01588('신 짜오신 짜오')==='신 짜오',mod.dedupeTop1LabelV01588('신 짜오신 짜오'));
ok('duplicate spaced champion label collapses',mod.dedupeTop1LabelV01588('신 짜오 신 짜오')==='신 짜오',mod.dedupeTop1LabelV01588('신 짜오 신 짜오'));
ok('normal single champion label stays intact',mod.dedupeTop1LabelV01588('신 짜오')==='신 짜오',mod.dedupeTop1LabelV01588('신 짜오'));
ok('normal multi-champion text stays intact',mod.dedupeTop1LabelV01588('신 짜오 · 세라핀')==='신 짜오 · 세라핀',mod.dedupeTop1LabelV01588('신 짜오 · 세라핀'));
ok('draft scoring untouched',mod.score_logic_changed===false,String(mod.score_logic_changed));
ok('v0.15.87 recommendation policy inherited',mod.item_recommendation_logic_changed===true,String(mod.item_recommendation_logic_changed));
ok('v0.15.87 route adoption inherited',mod.route_adoption_changed===true,String(mod.route_adoption_changed));
ok('dedupe change declared',mod.random_top1_label_dedupe_changed===true,String(mod.random_top1_label_dedupe_changed));
const layer=read('update/v0.15.88/runtime-source-stability-v01588.js');
ok('v0.15.88 adds no scheduler',!layer.includes('setInterval('));
ok('v0.15.88 adds no observer',!layer.includes('MutationObserver'));

const report={version:'0.15.88',generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'prevent duplicate champion names in RANDOM > 선택 판단 > 현재 TOP1 without changing scoring or v0.15.87 route-adoption behavior',score_logic_changed:false,item_recommendation_logic_changed:true,display_only_fix:true}};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/random-top1-label-v01588-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
