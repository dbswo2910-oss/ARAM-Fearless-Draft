'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});

const runtime=read('update/v0.15.94/runtime-source-stability-v01594.js');
const main=read('update/v0.15.94/main-v01594.js');
const pkg=JSON.parse(read('update/v0.15.94/package.json'));
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));

ok('package version',pkg.version==='0.15.94',pkg.version);
ok('package entry',pkg.main==='main-v01594.js',pkg.main);
ok('manifest version',manifest.version==='0.15.94',manifest.version);
ok('manifest delivers active package',by.get('package.json')==='update/v0.15.94/package.json',by.get('package.json')||'');
ok('manifest delivers main',by.get('main-v01594.js')==='update/v0.15.94/main-v01594.js',by.get('main-v01594.js')||'');
ok('manifest delivers runtime',by.get('runtime-source-stability-v01594.js')==='update/v0.15.94/runtime-source-stability-v01594.js',by.get('runtime-source-stability-v01594.js')||'');

let mod=null,patched='';
try{
  mod=require(path.join(root,'update/v0.15.94/runtime-source-stability-v01594.js'));
  const raw=read('update/v0.15.72/random-practice-focus-v01549.js');
  patched=mod.patchRuntimeSource('random-practice-focus-v01549.js',raw);
  new Function(patched);
  ok('patched RANDOM focus parses',true);
}catch(e){ok('patched RANDOM focus parses',false,e.stack||e.message)}

ok('candidate full DNA signal model exists',patched.includes('function candidateRoleSignalsV01594(')&&patched.includes('function candidateDnaPreviewV01594('));
ok('all five DNA lanes are candidate-preview capable',patched.includes("dnaMetricPreviewHtmlV01594('한타 개시(Engage)'")&&patched.includes("dnaMetricPreviewHtmlV01594('포킹(Poke)'")&&patched.includes("dnaMetricPreviewHtmlV01594('프론트라인(Frontline)'")&&patched.includes("dnaMetricPreviewHtmlV01594('지속 전투(Sustain)'")&&patched.includes("dnaMetricPreviewHtmlV01594('군중 제어(CC)'"));
ok('shortage chips are recomputed for selected candidate',patched.includes('shortageSignalV01594')&&patched.includes('부족한 역할 · ${esc(name)} 반영'));
ok('selected candidate replaces stale right-rail TOP1',patched.includes('✦ 선택 후보')&&patched.includes('${esc(name||\'선택 후보\')}'));
ok('candidate AD/AP remains connected',patched.includes('profile.adPct')&&patched.includes('profile.apPct')&&patched.includes('rp90DnaSplit'));
ok('candidate preview persists after base DNA refresh',patched.includes('refreshDnaV01590();\n    reapplySelectedCandidatePreviewV01594();'));
ok('TOP5 click routes to v0.15.94 preview',patched.includes('setTimeout(()=>applyCandidatePreviewV01594(')&&!patched.includes('setTimeout(()=>applyCandidatePreviewV01593('));
ok('selected row survives refresh cycles',patched.includes('results.dataset.selectedCandidate')&&patched.includes('reapplySelectedCandidatePreviewV01594'));
ok('bottom six-card judgment still updates with selected candidate',patched.includes("label==='현재 결론'")&&patched.includes("label==='실전 AD / AP'")&&patched.includes("label==='추천 방향'"));
ok('v0.15.93 fullscreen and queue fixes inherited',patched.includes('@media(min-width:1500px)')&&patched.includes('#queueSize')&&patched.includes("results.dataset.rp93Interaction='open'"));
ok('scoring unchanged',mod&&mod.score_logic_changed===false,String(mod&&mod.score_logic_changed));
ok('Poro-Snax filter inherited',mod&&mod.poro_snax_filtered===true,String(mod&&mod.poro_snax_filtered));
ok('full DNA preview flag declared',mod&&mod.random_pick_candidate_full_dna_preview_changed===true,String(mod&&mod.random_pick_candidate_full_dna_preview_changed));
ok('v0.15.79 safety lineage preserved',main.includes("root:'main-v01579.js'")&&main.includes("replaceAll('0.15.79','0.15.80')"));
ok('v0.15.94 layer adds no scheduler',!runtime.includes('setInterval('));
ok('v0.15.94 layer adds no MutationObserver',!runtime.includes('MutationObserver'));

const report={version:'0.15.94',generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'Keep selected TOP5 candidate analysis persistent and refresh the complete DNA/right-rail decision preview without changing recommendation scoring.'}};
fs.mkdirSync(path.join(root,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(root,'audit-output/random-pick-candidate-dna-v01594-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
