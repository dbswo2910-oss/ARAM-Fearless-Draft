'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const ok=(c,m)=>{if(!c)throw new Error(`v0.15.126 MATCH SEARCH LABEL AUDIT: ${m}`)};
const count=(s,n)=>String(s).split(n).length-1;
const parse=(s,n)=>{try{new Function(s)}catch(e){throw new Error(`${n} parse failed: ${e.message}`)}};

const dir='update/v0.15.126/';
for(const p of ['match-search-labels-v015126.js','runtime-source-stability-v015126.js','successor-route-v015126.js','main-v015126.js','package.json'])ok(exists(dir+p),`missing ${p}`);
const label=read(dir+'match-search-labels-v015126.js');
const runtime=read(dir+'runtime-source-stability-v015126.js');
const routeSrc=read(dir+'successor-route-v015126.js');
const main=read(dir+'main-v015126.js');
parse(label,'label payload');parse(runtime,'runtime stability');parse(routeSrc,'successor route');parse(main,'main entry');

ok(label.includes("const TARGET='전적검색'"),'target visible name is not 전적검색');
ok(label.includes("document.getElementById('history')"),'exact #history scope missing');
ok(label.includes("const header=document.querySelector('header')"),'header-scoped navigation fallback missing');
ok(label.includes("header [data-view=\"history\"]")&&label.includes("header [aria-controls=\"history\"]"),'semantic history navigation selectors missing');
ok(label.includes("child.classList?.contains('badge')"),'LAB badge preservation guard missing');
ok(label.includes('frames>=12'),'bounded mount settle missing');
ok(!label.includes('MutationObserver'),'label patch added MutationObserver');
ok(!label.includes('setInterval('),'label patch added setInterval');
ok(!/\.id\s*=|setAttribute\(['"]id['"]/.test(label),'label patch must not rewrite internal IDs');
ok(label.includes('score_logic_changed:false')&&label.includes('random_scoring_changed:false'),'scoring neutrality markers missing');

const prior=require('../update/v0.15.125/runtime-source-stability-v015125');
const current=require('../update/v0.15.126/runtime-source-stability-v015126');
const inputBase=read('update/v0.15.39/input-interaction-stability-v01539.js');
const input125=prior.patchRuntimeSource('input-interaction-stability-v01539.js',inputBase);
const input126=current.patchRuntimeSource('input-interaction-stability-v01539.js',inputBase);
ok(input126!==input125,'input runtime did not receive label payload');
ok(count(input126,'/* ARAM_MATCH_SEARCH_LABELS_V015126 */')===1,'label payload injection count is not exactly one');
ok(input126.indexOf('/* ARAM_MATCH_SEARCH_LABELS_V015126 */')<input126.indexOf('/* ARAM_STATE_INTEGRITY_PAYLOAD_V015117 */'),'label payload must remain before state-integrity suffix');
parse(input126,'transformed input runtime');

for(const [file,p] of [
  ['match-lab-favorites-v01514.js','update/v0.15.14/match-lab-favorites-v01514.js'],
  ['match-lab-replay-v01515.js','update/v0.15.15/match-lab-replay-v01515.js'],
  ['match-lab-queue-v01517.js','update/v0.15.17/match-lab-queue-v01517.js'],
  ['runtime-random-practice-v01572.js','update/v0.15.72/runtime-random-practice-v01572.js'],
  ['ui-stability-baseline-v015115.js','update/v0.15.120/ui-stability-baseline-v015115.js'],
  ['autosync-concurrency-v015119.js','update/v0.15.119/autosync-concurrency-v015119.js'],
  ['riot-grade-collector-v01532.js','update/v0.15.122/riot-grade-collector-v01532.js']
]){
  const src=read(p);
  ok(prior.patchRuntimeSource(file,src)===current.patchRuntimeSource(file,src),`${file} changed outside visible label scope`);
}
ok(current.score_logic_changed===false,'score logic flag changed');
ok(current.random_scoring_changed===false,'RANDOM scoring flag changed');
ok(current.internal_match_lab_identifiers_preserved===true,'internal identifier preservation flag missing');
ok(current.match_search_visible_label==='전적검색','runtime label policy mismatch');

const route=require('../update/v0.15.126/successor-route-v015126');
const predecessor=read('update/v0.15.122/main-v015122.js');
ok(count(predecessor,route.OLD_ROUTE_FRAGMENT)===1,'v0.15.122 predecessor route cardinality changed');
const routed=route.patchSuccessorSource(predecessor);
ok(count(routed,route.OLD_ROUTE_FRAGMENT)===0&&count(routed,route.NEW_ROUTE_FRAGMENT)===1,'successor route transform failed');
parse(routed,'routed v0.15.122 predecessor');
ok(main.includes("const VERSION='0.15.126'"),'main explicit version missing');
ok(main.includes("main-v015122.js"),'known-good v0.15.122 recovery base missing');
ok(main.includes("root:'main-v01579.js'"),'v0.15.79 safety lineage missing');
const pkg=JSON.parse(read(dir+'package.json'));
ok(pkg.version==='0.15.126'&&pkg.main==='main-v015126.js','package contract mismatch');

const manifest=JSON.parse(read('update/manifest.json'));
if(String(manifest.version)==='0.15.126'){
  const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
  const expected={
    'package.json':'update/v0.15.126/package.json',
    'match-search-labels-v015126.js':'update/v0.15.126/match-search-labels-v015126.js',
    'successor-route-v015126.js':'update/v0.15.126/successor-route-v015126.js',
    'runtime-source-stability-v015126.js':'update/v0.15.126/runtime-source-stability-v015126.js',
    'main-v015126.js':'update/v0.15.126/main-v015126.js'
  };
  for(const [p,s] of Object.entries(expected))ok(map.get(p)===s,`active manifest mismatch ${p}: ${map.get(p)||'missing'}`);
  for(const row of manifest.files||[])ok(String(row.source||'').startsWith('update/'),`unsafe active source ${row.path} -> ${row.source}`);
}
const activation=read('tools/v015126-activate-match-search-labels.js');
ok(activation.includes("m.version='0.15.126'"),'activation version mutation missing');
const workflow=read('.github/workflows/v015126-activate-match-search-labels.yml');
ok(workflow.includes('node tools/sync-current-state.js'),'activation workflow continuity sync missing');
ok(workflow.includes('node tools/full-regression-audit.js'),'activation workflow Full Regression missing');
console.log('v0.15.126 MATCH SEARCH LABEL AUDIT: SUCCESS · visible Match Lab label -> 전적검색 · internal identifiers preserved');
