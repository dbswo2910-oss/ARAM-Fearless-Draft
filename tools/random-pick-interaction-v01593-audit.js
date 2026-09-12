'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});

const runtime=read('update/v0.15.93/runtime-source-stability-v01593.js');
const main=read('update/v0.15.93/main-v01593.js');
const pkg=JSON.parse(read('update/v0.15.93/package.json'));
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
const activePatch=Number(String(manifest.version||'').split('.').pop())||0;

ok('package version',pkg.version==='0.15.93',pkg.version);
ok('package entry',pkg.main==='main-v01593.js',pkg.main);
ok('manifest version',String(manifest.version||'').startsWith('0.15.')&&activePatch>=93,manifest.version);
ok('manifest delivers main',by.get('main-v01593.js')==='update/v0.15.93/main-v01593.js',by.get('main-v01593.js')||'');
ok('manifest delivers runtime',by.get('runtime-source-stability-v01593.js')==='update/v0.15.93/runtime-source-stability-v01593.js',by.get('runtime-source-stability-v01593.js')||'');
ok('manifest delivers package',by.get('package.json')===`update/v${manifest.version}/package.json`,by.get('package.json')||'');

let mod=null,patched='';
try{
  mod=require(path.join(root,'update/v0.15.93/runtime-source-stability-v01593.js'));
  const raw=read('update/v0.15.72/random-practice-focus-v01549.js');
  patched=mod.patchRuntimeSource('random-practice-focus-v01549.js',raw);
  new Function(patched);
  ok('patched RANDOM focus parses',true);
}catch(e){ok('patched RANDOM focus parses',false,e.stack||e.message)}

ok('fullscreen wide breakpoint exists',patched.includes('@media(min-width:1500px)')&&patched.includes('minmax(760px,1.82fr)'));
ok('ultrawide breakpoint exists',patched.includes('@media(min-width:1780px)')&&patched.includes('minmax(900px,1.95fr)'));
ok('queue selector visible sizing exists',patched.includes('#queueSize')&&patched.includes('min-width:150px!important')&&patched.includes('font-size:15px!important'));
ok('old capture click blocker released',patched.includes("results.dataset.rp93Interaction='open'")&&!patched.includes("view.addEventListener('click',e=>{if(e.target?.closest?.('.rp90Detail'))return;e.preventDefault();e.stopPropagation()},true)"));
ok('candidate selection state exists',patched.includes('isSelectedV01593')&&patched.includes('selectedCandidate'));
ok('candidate preview updates DNA',patched.includes('applyCandidatePreviewV01593')&&patched.includes('.rp90DnaDamage'));
ok('candidate graph is candidate-aware',patched.includes('candidateDamageProfileV01593(row,name,m)')&&patched.includes('row.dataset.rp93Ad'));
ok('candidate graph does not blindly render global balance',!patched.includes('style="--ad:${m.adPct}%;--ap:${m.apPct}%"><i class="ad"></i><i class="ap"></i></div></div><div class="rp90Desc"'));
ok('candidate graph uses observed metadata first',patched.includes("source:'dataset'")&&patched.includes('candidateMetaFromGlobalsV01593'));
ok('detail action remains isolated',patched.includes("e.target?.closest?.('.rp90Detail')")&&patched.includes('oldBtn?.click()'));
ok('scoring unchanged',mod&&mod.score_logic_changed===false,String(mod&&mod.score_logic_changed));
ok('Poro-Snax filter inherited',mod&&mod.poro_snax_filtered===true,String(mod&&mod.poro_snax_filtered));
ok('v0.15.79 safety lineage preserved',main.includes("root:'main-v01579.js'")&&main.includes("replaceAll('0.15.79','0.15.80')"));
ok('v0.15.93 layer adds no scheduler',!runtime.includes('setInterval('));
ok('v0.15.93 layer adds no MutationObserver',!runtime.includes('MutationObserver'));

const report={version:'0.15.93',generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'RANDOM pick fullscreen density, queue visibility, candidate-specific balance preview, and TOP5 click interaction hotfix without scoring changes; later versions may supersede the preview renderer while retaining this layer.'}};
fs.mkdirSync(path.join(root,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(root,'audit-output/random-pick-interaction-v01593-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
