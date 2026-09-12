'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
const ok=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const atLeast=(a,b)=>{const A=String(a).split('.').map(Number),B=String(b).split('.').map(Number);for(let i=0;i<Math.max(A.length,B.length);i++){const x=A[i]||0,y=B[i]||0;if(x!==y)return x>y}return true};

const runtime=read('update/v0.15.100/runtime-source-stability-v015100.js');
const main=read('update/v0.15.100/main-v015100.js');
const pkg=JSON.parse(read('update/v0.15.100/package.json'));
const manifest=JSON.parse(read('update/manifest.json'));
const by=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
let mod=null,patched='';
try{
  mod=require(path.join(root,'update/v0.15.100/runtime-source-stability-v015100.js'));
  patched=mod.patchRuntimeSource('random-practice-focus-v01549.js',read('update/v0.15.72/random-practice-focus-v01549.js'));
  new Function(patched);
  ok('patched RANDOM focus parses',true);
}catch(e){ok('patched RANDOM focus parses',false,e.stack||e.message)}

ok('package version',pkg.version==='0.15.100',pkg.version);
ok('package entry',pkg.main==='main-v015100.js',pkg.main);
ok('manual selection snapshot exists',patched.includes('function selectedCandidateSnapshotV015100('));
ok('manual selection cache survives transient refresh',patched.includes('selectedCandidateScore')&&patched.includes('selectedCandidateDesc')&&patched.includes('selectedCandidateAd')&&patched.includes('selectedCandidateAp'));
ok('DNA refresh gives selected candidate priority',patched.includes('if(restoreSelectedCandidatePreviewV015100({clearMissing:true}))return;'));
ok('quick judgment reads selected candidate',patched.includes("const selected=selectedCandidateSnapshotV015100({clearMissing:true});")&&patched.includes("selected?'선택 미리보기':'최우선 추천'"));
ok('visible-name normalization respects selected candidate',patched.includes("const canonical=selected?.name||canonicalChampionNameV01590"));
ok('candidate click routes to locked preview',patched.includes('setTimeout(()=>applyCandidatePreviewV015100(')&&!patched.includes('setTimeout(()=>applyCandidatePreviewV01594('));
ok('TOP5 rebuild routes to locked preview',patched.includes('if(row)applyCandidatePreviewV015100(')&&!patched.includes('if(row)applyCandidatePreviewV01594('));
ok('stale v0.15.94 post-DNA reapply removed from refresh pipeline',!patched.includes('refreshDnaV01590();\n    reapplySelectedCandidatePreviewV01594();\n    normalizeVisibleNamesV01590();'));
ok('refresh order ends with selection-aware normalization',patched.includes('enhanceTop5V01590(r);\n    refreshDnaV01590();\n    normalizeVisibleNamesV01590();'));
ok('selected candidate clears only after real nonempty TOP5 no longer contains it',patched.includes('if(rows.length&&options.clearMissing!==false){clearSelectedCandidateV015100();return null}'));
ok('selection class updates are mutation-stable',patched.includes("if(x.classList.contains('isSelectedV01593')!==isSelected)x.classList.toggle('isSelectedV01593',isSelected)"));
ok('selection badge is not torn down on every refresh',patched.includes('if(isSelected&&nameBox&&!badge)')&&patched.includes('else if(!isSelected&&badge)badge.remove()'));
ok('candidate right-rail still uses full v0.15.94 DNA renderer',patched.includes('renderCandidateDnaV01594(row,selected,p,score,desc)'));
ok('all five DNA preview lanes inherited',['한타 개시(Engage)','포킹(Poke)','프론트라인(Frontline)','지속 전투(Sustain)','군중 제어(CC)'].every(x=>patched.includes(x)));
ok('score logic unchanged',mod&&mod.score_logic_changed===false,String(mod&&mod.score_logic_changed));
ok('manual preview lock flag declared',mod&&mod.random_pick_manual_preview_lock_changed===true,String(mod&&mod.random_pick_manual_preview_lock_changed));
ok('no new scheduler in v0.15.100 runtime',!runtime.includes('setInterval(')&&!runtime.includes('setTimeout('));
ok('no new MutationObserver in v0.15.100 runtime',!runtime.includes('MutationObserver'));
ok('v0.15.79 safety lineage preserved',main.includes("root:'main-v01579.js'")&&main.includes("replaceAll('0.15.79','0.15.80')"));

const manifestOkay=manifest.version==='0.15.99'||atLeast(manifest.version,'0.15.100');
ok('manifest is valid preactivation or successor',manifestOkay,manifest.version);
if(atLeast(manifest.version,'0.15.100')){
  ok('active package pointer',by.get('package.json')==='update/v0.15.100/package.json',by.get('package.json')||'');
  ok('active main pointer',by.get('main-v015100.js')==='update/v0.15.100/main-v015100.js',by.get('main-v015100.js')||'');
  ok('active runtime pointer',by.get('runtime-source-stability-v015100.js')==='update/v0.15.100/runtime-source-stability-v015100.js',by.get('runtime-source-stability-v015100.js')||'');
}

const report={version:'0.15.100',generated_at:new Date().toISOString(),pass:checks.filter(x=>x.pass).length,fail:checks.filter(x=>!x.pass).length,status:checks.every(x=>x.pass)?'PASS':'FAIL',checks,info:{purpose:'Keep a manually clicked Random Practice TOP5 candidate authoritative across MutationObserver-driven refreshes until that candidate actually leaves the recommendation set. Recommendation scoring is unchanged.'}};
fs.mkdirSync(path.join(root,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(root,'audit-output/random-pick-preview-lock-v015100-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:report.pass,fail:report.fail,status:report.status}));
for(const c of checks)if(!c.pass)console.error('FAIL',c.name,c.detail||'');
if(report.status!=='PASS')process.exit(1);
