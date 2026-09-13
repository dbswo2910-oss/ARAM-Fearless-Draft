'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const must=(s,n,l)=>{if(!String(s).includes(n))throw new Error(`v0.15.129 missing ${l}: ${n}`)};
const mustNot=(s,n,l)=>{if(String(s).includes(n))throw new Error(`v0.15.129 forbidden ${l}: ${n}`)};
const manifest=JSON.parse(read('update/manifest.json'));
if(manifest.version!=='0.15.129')throw new Error(`active manifest must be 0.15.129, got ${manifest.version}`);
const map=new Map(manifest.files.map(x=>[x.path,x.source]));
const expected={
  'rating-engine-v01.js':'update/v0.15.129/rating-engine-v01.js',
  'research-ui-core.js':'update/v0.15.129/research-ui-core.js',
  'research-ui-devtools.js':'update/v0.15.129/research-ui-devtools.js',
  'runtime-source-stability-v015129.js':'update/v0.15.129/runtime-source-stability-v015129.js',
  'main-v015129.js':'update/v0.15.129/main-v015129.js',
  'successor-route-v015129.js':'update/v0.15.129/successor-route-v015129.js',
  'package.json':'update/v0.15.129/package.json'
};
for(const[p,s]of Object.entries(expected)){if(map.get(p)!==s)throw new Error(`manifest mismatch ${p}: ${map.get(p)||'missing'}`);if(!exists(s))throw new Error(`missing source ${s}`)}
const pkg=JSON.parse(read(expected['package.json']));if(pkg.version!=='0.15.129'||pkg.main!=='main-v015129.js')throw new Error('package metadata mismatch');
const ui=read(expected['research-ui-devtools.js']),core=read(expected['research-ui-core.js']),engine=read(expected['rating-engine-v01.js']),runtimeSrc=read(expected['runtime-source-stability-v015129.js']),main=read(expected['main-v015129.js']),route=read(expected['successor-route-v015129.js']);
for(const[s,l]of [[ui,'ui'],[core,'core'],[engine,'engine'],[runtimeSrc,'runtime'],[main,'main'],[route,'route']]){try{new Function(s)}catch(e){throw new Error(`${l} parse failed: ${e.message}`)}}
must(ui,'aram_rating_research_ui_enabled_v015129','local feature flag');must(ui,'local-bundled:rating-engine-v01','local bundled engine');must(ui,'Research data unavailable','fail-safe copy');mustNot(ui,'raw.githubusercontent.com','remote GitHub loader');mustNot(ui,'fetch(`${url}','remote module fetch');
must(core,'분석 데이터 없음','missing player state');must(core,'표본 부족','low sample badge');must(core,'PRIMARY MODEL','future winner promotion');must(core,'Riot 공식 MMR','research disclaimer');
must(runtimeSrc,"if(file==='player-profile-v01519.js')",'profile-only injection');must(runtimeSrc,'aram_rating_research_ui_network_collection:false','no collection from UI');must(runtimeSrc,'score_logic_changed:false','scoring neutrality');
const runtime=require(path.join(ROOT,expected['runtime-source-stability-v015129.js']));const profileSource=read(map.get('player-profile-v01519.js'));const patched=runtime.patchRuntimeSource('player-profile-v01519.js',profileSource);must(patched,'/* ARAM_RATING_RESEARCH_UI_V015129 */','runtime sentinel');must(patched,'ARAMRatingResearchEngineV01','engine injection');must(patched,'ARAMRatingResearchUICoreV01','core injection');must(patched,'aramRatingResearchUIV01','UI injection');if((patched.match(/ARAM_RATING_RESEARCH_UI_V015129/g)||[]).length!==1)throw new Error('Research UI injected more than once');
const E=require(path.join(ROOT,expected['rating-engine-v01.js']));const U=require(path.join(ROOT,expected['research-ui-core.js']));
function game(i,players){const ps=players.map((p,j)=>({puuid:p,teamId:j<5?100:200,win:j<5?(i%2===0):(i%2!==0)}));return{gameId:`fixture-${i}`,queueId:450,gameEndTimestamp:1700000000000+i*60000,gameVersion:'26.18.1',participants:ps}}
const stable=Array.from({length:20},(_,i)=>game(i,Array.from({length:10},(_,j)=>`P${j}`)));const run=E.buildLatestRun(stable,{phase:'B1',status:'complete',sampling_version:'v0.3'});const vmA=U.buildViewModel(run,'P0');if(vmA.kind!=='player'||vmA.player.games<20)throw new Error('Player A 20+ fixture failed');if(U.sampleBadge(1).label!=='표본 부족')throw new Error('Player B low-sample fixture failed');if(U.buildViewModel(run,'NOT_IN_DB').kind!=='no_data')throw new Error('Player C no-data fixture failed');if(!U.renderCard({kind:'unavailable',message:'x'}).includes('Research data unavailable'))throw new Error('engine unavailable fail-safe fixture failed');
const report={status:'SUCCESS',version:'0.15.129',feature:'ARAM Rating Research UI',research_only:true,profile_target:'player-profile-v01519.js',external_module_fetch:false,collection_from_ui:false,fixtures:['Player A 20+','Player B 1','Player C absent','engine unavailable'],score_logic_changed:false};
fs.mkdirSync(path.join(ROOT,'audit-output'),{recursive:true});fs.writeFileSync(path.join(ROOT,'audit-output/v015129-aram-rating-research-ui-report.json'),JSON.stringify(report,null,2)+'\n');console.log('v0.15.129 ARAM RATING RESEARCH UI AUDIT: SUCCESS');
