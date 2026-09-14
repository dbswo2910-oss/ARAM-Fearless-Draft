'use strict';
const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(R,p),'utf8'),buf=p=>fs.readFileSync(path.join(R,p));
const must=(s,n,l=n)=>{if(!String(s).includes(n))throw new Error(`missing ${l}: ${n}`)};
const mustNot=(s,n,l=n)=>{if(String(s).includes(n))throw new Error(`forbidden ${l}: ${n}`)};
const m=JSON.parse(read('update/manifest.json')),map=new Map(m.files.map(x=>[x.path,x.source]));
if(m.version!=='0.15.131'||String(m.min_launcher)!=='2.0.2')throw new Error('v0.15.131 manifest/bootstrap mismatch');
if(map.get('ui-stability-baseline-v015115.js')!=='update/v0.15.120/ui-stability-baseline-v015115.js')throw new Error('DATA single-owner source path must remain the approved v0.15.120 owner');
if(!buf('update/v0.15.131/rating-engine-v01.js').equals(buf('update/v0.15.130/rating-engine-v01.js')))throw new Error('Elo/Glicko/TrueSkill engine bytes changed');
const old=read('update/v0.15.130/research-ui-devtools.js'),ui=read('update/v0.15.131/research-ui-devtools.js'),storage=read('update/v0.15.131/research-storage-v015131.js'),runtime=read('update/v0.15.131/runtime-source-stability-v015131.js');
must(old,'indexedDB.open(DB_NAME,1)','v0.15.130 explicit DB version');
must(old,'await kvSet(LATEST_RUN_KEY,run)','v0.15.130 mandatory derived-cache write');
for(const x of ["DB_NAME='aram-rating-research-v03'","STORE='kv'","CHECKPOINT_KEY='checkpoint-v03'",'idb.open(name)',"transaction(STORE,'readonly')"])must(storage,x,'read-only canonical storage');
for(const x of ['deleteDatabase(',"'readwrite'",'.put(','localStorage.clear'])mustNot(storage,x,'destructive boot storage operation');
for(const x of ['[ARAM Rating Research boot]','DB name:','IndexedDB open:','DB version:','object stores:','checkpoint-v03 found:','match count:','player count:','rating state count:','identity resolved:','render status:','error stage:','error name:','error message:'])must(ui,x,'boot diagnostic');
for(const x of ['loading','database_unavailable','checkpoint_missing','dataset_empty','player_not_found','insufficient_sample','available'])must(ui,x,'boot state');
for(const x of ['Active Sampling','phase-b2-v031','collector-core-v031']){mustNot(ui,x,'Research collector production coupling');mustNot(runtime,x,'Research collector production coupling')}
const S=require('../update/v0.15.131/research-storage-v015131.js');
const cp={phase:'B1',status:'complete',sampling_version:'v0.3',matches:Array.from({length:159},(_,i)=>({gameId:`g${i}`}))};
let buildCalls=0;
const recovered=S.selectRun(cp,null,{engine:{buildLatestRun(ms){buildCalls++;return{schema:'aram-rating-ui-latest-run-v01',dataset:{matches:ms.length,players:1238},players:{p:{games:2,models:{elo:{rating:1500}}}}}}}});
if(recovered.state!=='available'||recovered.run.dataset.matches!==159||recovered.run.dataset.players!==1238||buildCalls!==1)throw new Error('159-match / 1,238-player checkpoint recovery fixture failed');

const E=require('../update/v0.15.131/rating-engine-v01.js'),U=require('../update/v0.15.131/research-ui-core.js');
function game(i,players,ids={}){const ps=players.map((p,j)=>({puuid:p,gameName:ids[p]?.gameName,tagLine:ids[p]?.tagLine,riotId:ids[p]?.riotId,teamId:j<5?100:200,win:j<5?(i%2===0):(i%2!==0)}));return{gameId:`fixture-${i}`,queueId:450,gameEndTimestamp:1700000000000+i*60000,gameVersion:'26.18.1',participants:ps,me:{player:ps[0]}}}
const ids={P0:{riotId:'Current#KR1',gameName:'Current',tagLine:'KR1'},P1:{riotId:'SearchA#KR1',gameName:'SearchA',tagLine:'KR1'},TWO:{riotId:'SearchB#KR1',gameName:'SearchB',tagLine:'KR1'},SINGLE:{riotId:'SearchOne#KR1',gameName:'SearchOne',tagLine:'KR1'}};
const matches=[];for(let i=0;i<12;i++){const ps=Array.from({length:10},(_,j)=>`P${j}`);if(i<2)ps[8]='TWO';if(i===11)ps[9]='SINGLE';matches.push(game(i,ps,ids))}
const run=E.buildLatestRun(matches,{phase:'B1',status:'complete',sampling_version:'v0.3'});
let r=U.resolveTargetIdentity({targetMode:'current',localAccount:{puuid:'P0',riotId:'Current#KR1'},matches},'');let vmSelf=U.buildViewModel(run,r.puuid);if(r.puuid!=='P0'||vmSelf.kind!=='player')throw new Error('self Rating fixture failed');
r=U.resolveTargetIdentity({targetMode:'searched',target:{puuid:'P1',riotId:'SearchA#KR1'},localAccount:{puuid:'P0'},matches},'SearchA#KR1');const vmA=U.buildViewModel(run,r.puuid),keyA=`searched|SearchA#KR1|${r.puuid}`;if(r.puuid!=='P1'||vmA.kind!=='player'||vmA.player.games<2)throw new Error('searched player 2+ direct-PUUID fixture failed');
r=U.resolveTargetIdentity({targetMode:'searched',target:{riotId:'SearchB#KR1'},account:{riotId:'SearchB#KR1'},localAccount:{puuid:'P0'},matches},'SearchB#KR1');const vmB=U.buildViewModel(run,r.puuid),keyB=`searched|SearchB#KR1|${r.puuid}`;if(r.puuid!=='TWO'||vmB.kind!=='player'||vmB.player.games!==2||vmB.sample.key==='insufficient')throw new Error('searched player exactly-2 fixture failed');if(keyA===keyB||vmA.player_id===vmB.player_id)throw new Error('search A -> B identity/rerender fixture failed');
r=U.resolveTargetIdentity({targetMode:'searched',target:{riotId:'SearchOne#KR1'},localAccount:{puuid:'P0'},matches},'SearchOne#KR1');const vmOne=U.buildViewModel(run,r.puuid);if(r.puuid!=='SINGLE'||vmOne.kind!=='player'||vmOne.player.games!==1||vmOne.sample.label!=='표본 부족')throw new Error('searched player one-match fixture failed');
r=U.resolveTargetIdentity({targetMode:'searched',target:{riotId:'Absent#KR1'},localAccount:{puuid:'P0'},matches:[]},'Absent#KR1');if(r.puuid)throw new Error('searched mode fell back to logged-in PUUID');if(U.buildViewModel(run,'NOT_IN_DB').kind!=='no_data')throw new Error('DB-absent player fixture failed');

const RT=require('../update/v0.15.131/runtime-source-stability-v015131.js');
const dataBase=read('update/v0.15.120/ui-stability-baseline-v015115.js'),patchedData=RT.patchPatchNotesOwner(dataBase);
for(const x of ["const PRESENTATION='0.15.131'",'PATCH_NOTES_ALWAYS_OPEN_V015131','.data115PatchMode .data115DetailBranch > .title','title.hidden=patchMode','!/닫기/.test(text(btn))','dh99ChampionGrid','dh99Side','data-v115-tab="patch"'])must(patchedData,x,'Patch Notes always-open transform');
if((patchedData.match(/PATCH_NOTES_ALWAYS_OPEN_V015131/g)||[]).length!==1)throw new Error('Patch Notes transform duplicated');
const patchedAgain=RT.patchPatchNotesOwner(patchedData);if(patchedAgain!==patchedData)throw new Error('Patch Notes owner transform is not idempotent');

const report={status:'SUCCESS',version:'0.15.131',manifest_version:m.version,min_launcher:m.min_launcher,rating_engine_byte_identical_to_v015130:true,storage:{db:S.DB_NAME,store:S.STORE,checkpoint:S.CHECKPOINT_KEY,read_only_boot:S.read_only_boot,destructive_migration:S.destructive_migration},fixtures:{checkpoint_159_matches_1238_players:'PASS',self:'PASS',other_2_plus:'PASS',other_exact_2:'PASS',other_1:'PASS 표본 부족',db_absent:'PASS 분석 데이터 없음',search_A_to_B:'PASS',searched_to_local_fallback:'BLOCKED',patch_header_close_removed:'PASS',patch_quick_nav_preserved:'PASS'},data_owner_source_preserved:true,active_sampling_in_production:false,b2_collector_in_production:false};
fs.mkdirSync(path.join(R,'audit-output'),{recursive:true});fs.writeFileSync(path.join(R,'audit-output/v015131-production-report.json'),JSON.stringify(report,null,2)+'\n');console.log('v0.15.131 PRODUCTION AUDIT: SUCCESS');
