'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const fail=m=>{throw new Error(`v0.15.125 ARAM BUILD CACHE AUDIT: ${m}`)};
const ok=(c,m)=>{if(!c)fail(m)};
const count=(src,n)=>String(src).split(n).length-1;
const patchParts=v=>String(v||'').match(/^(\d+)\.(\d+)$/)?.slice(1).map(Number)||[];
const compatiblePatch=(provider,canonical)=>{const [pm,pn]=patchParts(provider),[cm,cn]=patchParts(canonical);return Number.isFinite(pm)&&Number.isFinite(cm)&&pn===cn&&(pm===cm||pm+10===cm)};

const canonicalPath='data/aram-builds/current.json';
const mirrorPath='update/data/aram-builds/current.json';
const cache=JSON.parse(read(canonicalPath));
const rows=Object.values(cache.champions||{});
ok(cache.schemaVersion>=2,'schemaVersion < 2');
ok(cache.mode==='ARAM','mode is not standard ARAM');
ok(Array.isArray(cache.excludes)&&cache.excludes.includes('ARAM_MAYHEM'),'ARAM_MAYHEM exclusion missing');
ok(/^\d+\.\d+$/.test(String(cache.canonicalPatch||'')),'canonical patch format invalid');
ok(cache.provider==='OP.GG','provider is not OP.GG');
ok(compatiblePatch(cache.providerPatch,cache.canonicalPatch),`provider/public patch alias mismatch ${cache.providerPatch}/${cache.canonicalPatch}`);
ok(Number(cache.providerMatchCount)>100000,'provider match sample unexpectedly small');
ok(rows.length>=170&&cache.rosterCount===rows.length,`roster contract failed ${rows.length}/${cache.rosterCount}`);
for(const r of rows){
  ok(Number(r.championId)>0,`invalid champion id ${r.championId}`);
  ok(String(r.name||'').trim(),`missing name ${r.championId}`);
  ok(Array.isArray(r.coreItemIds)&&r.coreItemIds.length>=2,`too few core ids ${r.name}`);
  ok(new Set(r.coreItemIds.map(Number)).size===r.coreItemIds.length,`duplicate core ids ${r.name}`);
  ok(Array.isArray(r.coreNames)&&r.coreNames.length===r.coreItemIds.length,`core name/id mismatch ${r.name}`);
  ok(String(r.tree||'')===r.coreNames.join(' → '),`tree/name mismatch ${r.name}`);
  ok(r.source==='OP.GG ARAM',`wrong source ${r.name}`);
  ok(r.canonicalPatch===cache.canonicalPatch,`row patch mismatch ${r.name}`);
}
const ahri=cache.champions['103'];
ok(ahri?.name==='아리','Ahri row missing');
ok(Array.isArray(ahri.coreNames)&&ahri.coreNames.length>=2,'Ahri current core baseline missing');
if(cache.canonicalPatch==='26.18')ok(ahri.tree==='루덴의 메아리 → 폭풍 쇄도 → 그림자불꽃',`26.18 Ahri sanity baseline changed unexpectedly: ${ahri?.tree}`);

ok(exists(mirrorPath),'updater-safe ARAM cache mirror missing');
ok(read(mirrorPath)===read(canonicalPath),'canonical ARAM cache and updater-safe mirror are not byte-identical');
const marker=JSON.parse(read('update/meta/v015125-safe-cache-source.json'));
ok(marker?.source===mirrorPath&&marker?.target==='aram-build-stats-current.json','safe-cache-source marker mismatch');

const current=require('../update/v0.15.125/runtime-source-stability-v015125');
const prior=require('../update/v0.15.124/runtime-source-stability-v015124');
const coachBase=read('update/v0.15.50/random-ingame-coach-v01550.js');
const coach124=prior.patchRuntimeSource('random-ingame-coach-v01550.js',coachBase);
const coach125=current.patchRuntimeSource('random-ingame-coach-v01550.js',coachBase);
ok(coach125!==coach124,'coach runtime did not change');
ok(coach125.includes('aramBuildStatsEmbeddedV015125'),'embedded cache runtime marker missing');
ok(coach125.includes('OP.GG ARAM ·'),'source label with provider missing');
ok(coach125.includes('갱신'),'source refresh date missing');
ok(coach125.includes('raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/main/data/aram-builds/current.json'),'single remote cache URL missing');
ok(coach125.includes("if(aramBuildStatsRefreshStartedV015125)return;aramBuildStatsRefreshStartedV015125=true"),'one-shot remote refresh guard missing');
ok(count(coach125,'setInterval(')===count(coach124,'setInterval('),'statistics runtime added an interval poller');
ok(count(coach125,'lol-api-champion.op.gg')===count(coach124,'lol-api-champion.op.gg'),'renderer added a direct OP.GG live API call');
ok(coach125.includes("it['기본 트리']"),'embedded champion DB fallback was removed');
ok(coach125.includes('function buildGateV01581('),'v0.15.81 item recommendation gate missing after patch');
new Function(coach125);

const neutralTargets=[
  ['runtime-random-practice-v01572.js','update/v0.15.72/runtime-random-practice-v01572.js'],
  ['ui-stability-baseline-v015115.js','update/v0.15.120/ui-stability-baseline-v015115.js'],
  ['autosync-concurrency-v015119.js','update/v0.15.119/autosync-concurrency-v015119.js'],
  ['riot-grade-collector-v01532.js','update/v0.15.122/riot-grade-collector-v01532.js']
];
for(const [file,p] of neutralTargets){
  const src=read(p),a=prior.patchRuntimeSource(file,src),b=current.patchRuntimeSource(file,src);
  ok(a===b,`${file} changed outside ARAM build baseline scope`);
}
ok(current.score_logic_changed===false,'score logic flag must remain false');
ok(current.random_scoring_changed===false,'RANDOM scoring flag must remain false');
ok(current.item_recommendation_logic_changed===true,'item recommendation baseline effect flag missing');

const route=require('../update/v0.15.125/successor-route-v015125');
const main122=read('update/v0.15.122/main-v015122.js');
const routed=route.patchSuccessorSource(main122);
ok(routed.includes("'0.15.125').replaceAll(stabilityAnchor,'runtime-source-stability-v015125')"),'v0.15.125 successor route missing');
ok(!routed.includes("'0.15.122').replaceAll(stabilityAnchor,'runtime-source-stability-v015122')"),'old v0.15.122 route remained');
new Function(routed);
const pkg=JSON.parse(read('update/v0.15.125/package.json'));
ok(pkg.version==='0.15.125'&&pkg.main==='main-v015125.js','package entry mismatch');
const main125=read('update/v0.15.125/main-v015125.js');
ok(main125.includes("const VERSION='0.15.125'"),'main explicit version contract missing');
ok(main125.includes("main-v015122.js"),'known-good startup recovery base not preserved');

const manifest=JSON.parse(read('update/manifest.json'));
if(String(manifest.version)==='0.15.125'){
  const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
  ok(map.get('package.json')==='update/v0.15.125/package.json','active package mapping wrong');
  ok(map.get('main-v015125.js')==='update/v0.15.125/main-v015125.js','active main mapping wrong');
  ok(map.get('runtime-source-stability-v015125.js')==='update/v0.15.125/runtime-source-stability-v015125.js','active runtime mapping wrong');
  ok(map.get('aram-build-stat-runtime-v015125.js')==='update/v0.15.125/aram-build-stat-runtime-v015125.js','active stats runtime mapping wrong');
  ok(map.get('aram-build-stats-current.json')===mirrorPath,'active cache mapping is not updater-safe');
  for(const row of manifest.files||[])ok(String(row.source||'').startsWith('update/'),`active manifest contains disallowed source ${row.path} -> ${row.source}`);
}
const updaterSafety=read('update/v0.15.116/updater-safety-patch-v01579.js');
ok(updaterSafety.includes("if(!s.startsWith('update/'))throw new Error('허용되지 않은 update source: '+s);"),'v0.15.116 updater source allowlist was weakened');
const activation=read('tools/v015125-activate-aram-build-stat-cache.js');
ok(activation.includes("const safeCacheSource='update/data/aram-builds/current.json';"),'activation does not use updater-safe cache source');
const refreshWorkflow=read('.github/workflows/aram-build-stats-refresh.yml');
ok(refreshWorkflow.includes('update/data/aram-builds/current.json'),'scheduled refresh does not maintain updater-safe cache mirror');
ok(refreshWorkflow.includes('git add data/aram-builds/current.json update/data/aram-builds/current.json'),'scheduled refresh does not stage canonical+mirror together');
console.log(`v0.15.125 ARAM BUILD CACHE AUDIT: SUCCESS · ${rows.length} champions · ${cache.canonicalPatch} · ${Number(cache.providerMatchCount||0).toLocaleString('en-US')} matches · updater-safe mirror`);
