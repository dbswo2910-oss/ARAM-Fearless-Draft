'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const ok=(c,m)=>{if(!c)throw new Error(`v0.15.130 RESEARCH UI BOOT AUDIT: ${m}`)};
const count=(s,n)=>String(s).split(n).length-1;
const parse=(s,n)=>{try{new Function(s)}catch(e){throw new Error(`${n} parse failed: ${e.message}`)}};

const manifest=JSON.parse(read('update/manifest.json'));
ok(String(manifest.version)==='0.15.130',`active manifest must be 0.15.130, got ${manifest.version}`);
const map=new Map((manifest.files||[]).map(x=>[x.path,x.source]));
ok(map.size===(manifest.files||[]).length,'duplicate manifest outputs');
for(const row of manifest.files||[]){ok(String(row.source||'').startsWith('update/'),`unsafe source ${row.path}`);ok(exists(row.source),`missing manifest source ${row.path} -> ${row.source}`)}
ok(map.get('package.json')==='update/v0.15.130/package.json','package source is not v0.15.130');
ok(map.get('player-profile-v01519.js')==='update/v0.15.130/player-profile-v01519.js','Player Profile does not use static v0.15.130 bundle');
ok(map.get('main-v015130.js')==='update/v0.15.130/main-v015130.js','v0.15.130 main entry missing');
ok(map.get('successor-route-v015130.js')==='update/v0.15.130/successor-route-v015130.js','v0.15.130 successor route missing');
ok(!map.has('runtime-source-stability-v015129.js'),'v0.15.129 Research UI runtime-patcher layer is still active');

const pkg=JSON.parse(read('update/v0.15.130/package.json'));
ok(pkg.version==='0.15.130'&&pkg.main==='main-v015130.js','package metadata mismatch');
const main=read('update/v0.15.130/main-v015130.js'),routeSrc=read('update/v0.15.130/successor-route-v015130.js'),profile=read('update/v0.15.130/player-profile-v01519.js');
parse(main,'main wrapper');parse(routeSrc,'successor route');parse(profile,'static Player Profile bundle');
ok(main.includes("runtimePolicy:'runtime-source-stability-v015128'"),'main wrapper does not declare preserved v0.15.128 runtime policy');
ok(main.includes("main-v015122.js"),'main wrapper does not boot from proven recovery base');
const route=require('../update/v0.15.130/successor-route-v015130');
const predecessor=read('update/v0.15.122/main-v015122.js');
ok(count(predecessor,route.OLD_ROUTE_FRAGMENT)===1,'v0.15.122 route cardinality changed');
const routed=route.patchSuccessorSource(predecessor);
ok(count(routed,route.NEW_ROUTE_FRAGMENT)===1,'v0.15.130 route was not applied exactly once');
ok(routed.includes("'0.15.130').replaceAll(stabilityAnchor,'runtime-source-stability-v015128')"),'v0.15.130 route does not preserve v0.15.128 runtime policy');
ok(!routed.includes("replaceAll(stabilityAnchor,'runtime-source-stability-v015129')"),'v0.15.129 runtime policy leaked into v0.15.130 route');
parse(routed,'routed v0.15.122 predecessor');

const sentinel='/* ARAM_RATING_RESEARCH_UI_V015130_STATIC */';
ok(count(profile,sentinel)===1,'static Research UI sentinel count != 1');
for(const n of ['__ARAM_PLAYER_PROFILE_V01519__','ARAMRatingResearchEngineV01','ARAMRatingResearchUICoreV01','aramRatingResearchUIV01','aram_rating_research_ui_enabled_v015129','Research data unavailable'])ok(profile.includes(n),`static Player Profile missing ${n}`);
ok(!profile.includes('raw.githubusercontent.com'),'static Research UI contains runtime GitHub loader');
const runtime128=require('../update/v0.15.128/runtime-source-stability-v015128');
const after128=runtime128.patchRuntimeSource('player-profile-v01519.js',profile);
ok(count(after128,sentinel)===1,'v0.15.128 runtime policy altered/duplicated static Research UI');
ok(after128.includes('aramRatingResearchUIV01'),'Research UI lost after v0.15.128 runtime transform');
parse(after128,'v0.15.128-transformed static Player Profile');

const report={
  version:'0.15.130',status:'SUCCESS',research_only:true,
  architecture:'static-player-profile-bundle',runtime_policy:'v0.15.128',
  removed_active_layer:'runtime-source-stability-v015129.js',
  score_logic_changed:false,random_scoring_changed:false,autosync_changed:false,history_latency_changed:false,
  checks:['manifest/package consistency','successor boot route','v0.15.128 runtime preservation','static Research UI parse','Player Profile transform preservation']
};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'audit-output/v015130-research-ui-boot-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('v0.15.130 RESEARCH UI BOOT AUDIT: SUCCESS');
