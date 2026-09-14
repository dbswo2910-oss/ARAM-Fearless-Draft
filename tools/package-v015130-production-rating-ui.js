'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const DIR=path.join(ROOT,'update/v0.15.130');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
function exact(src,from,to,label){const n=src.split(from).length-1;if(n!==1)throw new Error(`${label} exact replacement count=${n}`);return src.replace(from,to)}

// Productionize only the stable searched-player UI fixes from research PR #74.
// Rating engine bytes are deliberately unchanged from v0.15.129.
const oldEngine=path.join(ROOT,'update/v0.15.129/rating-engine-v01.js');
const newEngine=path.join(DIR,'rating-engine-v01.js');
if(!fs.existsSync(newEngine))fs.copyFileSync(oldEngine,newEngine);
if(!fs.readFileSync(oldEngine).equals(fs.readFileSync(newEngine)))throw new Error('rating engine must be byte-identical to v0.15.129');

let ui=fs.readFileSync(path.join(DIR,'research-ui-devtools.js'),'utf8');
if(ui.includes("const VERSION='aram-rating-ui-v015129-search-puuid-fix';"))ui=exact(ui,"const VERSION='aram-rating-ui-v015129-search-puuid-fix';","const VERSION='aram-rating-ui-v015130-production-target-puuid';",'ui version');
if(ui.includes("const FLAG_KEY='aram_rating_research_ui_enabled_v015129';"))ui=exact(ui,"const FLAG_KEY='aram_rating_research_ui_enabled_v015129';","const FLAG_KEY='aram_rating_research_ui_enabled_v015130';",'feature flag');
if(!ui.includes("const VERSION='aram-rating-ui-v015130-production-target-puuid';")||!ui.includes("const FLAG_KEY='aram_rating_research_ui_enabled_v015130';"))throw new Error('v0.15.130 UI production transform missing');
if(ui.includes('raw.githubusercontent.com')||ui.includes('getAramMatchHistory('))throw new Error('production Research UI must stay local-only and must not collect history');
fs.writeFileSync(path.join(DIR,'research-ui-devtools.js'),ui);

let core=fs.readFileSync(path.join(DIR,'research-ui-core.js'),'utf8');
const oldConfidence="if(games<=2)return{key:'LOW',label:'낮음',reason:'개인 관측이 1~2경기라 표본이 부족합니다.'};";
const newConfidence="if(games===1)return{key:'LOW',label:'낮음',reason:'개인 관측이 1경기라 표본이 부족합니다.'};if(games===2)return{key:'LOW',label:'낮음',reason:'개인 관측이 2경기라 점수 신뢰도는 아직 낮습니다.'};";
if(core.includes(oldConfidence))core=exact(core,oldConfidence,newConfidence,'1-vs-2 confidence wording');else if(!core.includes(newConfidence))throw new Error('1-vs-2 confidence transform missing');
const oldBadge="if(g<=2)return{key:'insufficient',label:'표본 부족'};",newBadge="if(g===1)return{key:'insufficient',label:'표본 부족'};";
if(core.includes(oldBadge))core=exact(core,oldBadge,newBadge,'one-observation badge');else if(!core.includes(newBadge))throw new Error('one-observation badge transform missing');
fs.writeFileSync(path.join(DIR,'research-ui-core.js'),core);

const manifestPath=path.join(ROOT,'update/manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
manifest.version='0.15.130';
manifest.message='v0.15.130 · SEARCHED PLAYER RATING + COLD START PROMOTION — resolved PUUID production UI';
manifest.min_launcher='2.0.3';
const upsert=(p,s,hash)=>{const i=manifest.files.findIndex(x=>x.path===p);const row={path:p,source:s};if(hash)row.sha256=hash;if(i>=0)manifest.files[i]=row;else manifest.files.push(row)};
for(const p of ['rating-engine-v01.js','research-ui-core.js','research-ui-devtools.js','runtime-source-stability-v015130.js','main-v015130.js','successor-route-v015130.js','cold-start-promotion-v015130.js','package.json'])upsert(p,`update/v0.15.130/${p}`,sha(`update/v0.15.130/${p}`));
const launcher='update/v0.15.130/ARAM_Fearless_Draft_Launcher_windows_x64.exe';
if(!fs.existsSync(path.join(ROOT,launcher)))throw new Error('v2.0.3 launcher binary missing; build it before packaging manifest');
upsert('ARAM_Fearless_Draft_Launcher_windows_x64.exe',launcher,sha(launcher));
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log('v0.15.130 production Rating UI + cold-start launcher package prepared');
