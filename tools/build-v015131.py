from pathlib import Path
import json, hashlib, shutil

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'update/v0.15.130'
DST=ROOT/'update/v0.15.131'
if DST.exists(): shutil.rmtree(DST)
DST.mkdir(parents=True)
for name in ['rating-engine-v01.js','research-ui-core.js','research-ui-devtools.js','ARAM_Fearless_Draft_Launcher_windows_x64.exe']:
    shutil.copy2(SRC/name,DST/name)

# Research storage is canonical/read-only on boot. No reset, no migration, no recollection.
storage="""'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ARAMRatingResearchStorageV015131=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const DB_NAME='aram-rating-research-v03',STORE='kv',CHECKPOINT_KEY='checkpoint-v03',LATEST_RUN_KEY='rating-ui-latest-run-v01';
  const arr=x=>Array.isArray(x)?x:[];
  function checkpointStamp(cp){const xs=arr(cp?.matches),last=xs.at(-1),id=last?.gameId??last?.id??last?.matchId??'';return[cp?.seed_fingerprint||'',cp?.phase||'',cp?.status||'',cp?.sampling_version||cp?.config?.samplingVersion||'',xs.length,cp?.finished_at_v031||cp?.finished_at||'',id].join('|')}
  function sourceMeta(cp){return{phase:String(cp?.phase||'UNKNOWN'),status:String(cp?.status||'unknown'),sampling_version:String(cp?.sampling_version||cp?.config?.samplingVersion||'v0.3'),source:`IndexedDB ${DB_NAME}/${CHECKPOINT_KEY}`}}
  async function databaseExists(idb,name){if(typeof idb?.databases!=='function')return null;try{return(await idb.databases()).some(x=>x?.name===name)}catch{return null}}
  async function openExistingDatabase(idb,name=DB_NAME){if(!idb?.open)throw Object.assign(new Error('indexedDB_unavailable'),{stage:'indexeddb_open'});const known=await databaseExists(idb,name);if(known===false)return{db:null,missing:true};return new Promise((resolve,reject)=>{let created=false;const q=idb.open(name);q.onupgradeneeded=e=>{if(Number(e.oldVersion||0)===0){created=true;try{q.transaction.abort()}catch{}}};q.onsuccess=()=>resolve({db:q.result,missing:false});q.onerror=()=>created&&q.error?.name==='AbortError'?resolve({db:null,missing:true}):reject(Object.assign(q.error||new Error('indexeddb_open_failed'),{stage:'indexeddb_open'}));q.onblocked=()=>reject(Object.assign(new Error('indexeddb_open_blocked'),{stage:'indexeddb_open'}))})}
  function readKey(db,key){return new Promise((resolve,reject)=>{let tx;try{tx=db.transaction(STORE,'readonly')}catch(e){reject(Object.assign(e,{stage:'schema_check'}));return}const q=tx.objectStore(STORE).get(key);q.onsuccess=()=>resolve(q.result??null);q.onerror=()=>reject(Object.assign(q.error||new Error('indexeddb_read_failed'),{stage:`read:${key}`}))})}
  function selectRun(cp,stored,opts={}){const matches=arr(cp?.matches);if(!cp)return{state:'checkpoint_missing',run:null,source:'none'};if(!matches.length)return{state:'dataset_empty',run:null,source:'checkpoint'};const stamp=(opts.checkpointStamp||checkpointStamp)(cp);if(!opts.forceBuild&&stored?.schema==='aram-rating-ui-latest-run-v01'&&stored?.source_run?.checkpoint_stamp===stamp)return{state:'available',run:stored,source:'derived_cache'};if(!opts.engine?.buildLatestRun)throw Object.assign(new Error('rating_engine_unavailable'),{stage:'rating_engine_init'});const run=opts.engine.buildLatestRun(matches,(opts.sourceMeta||sourceMeta)(cp));run.source_run={checkpoint_key:CHECKPOINT_KEY,checkpoint_stamp:stamp,checkpoint_finished_at:cp.finished_at_v031||cp.finished_at||null,checkpoint_status:cp.status||null,checkpoint_phase:cp.phase||null};return{state:'available',run,source:'checkpoint_rebuild_memory'}}
  async function loadExisting(opts={}){const d={db_name:DB_NAME,indexeddb_open:false,db_version:null,object_stores:[],checkpoint_found:false,match_count:0,player_count:0,rating_state_count:0,cache_status:'not_checked',source:'none',error_stage:'',error_name:'',error_message:''};let db=null;try{const o=await openExistingDatabase(opts.indexedDBRef||globalThis.indexedDB);if(o.missing)return{state:'checkpoint_missing',run:null,diagnostic:d};db=o.db;d.indexeddb_open=true;d.db_version=db.version;d.object_stores=Array.from(db.objectStoreNames||[]);if(!d.object_stores.includes(STORE))throw Object.assign(new Error(`object_store_missing:${STORE}`),{stage:'schema_check'});const cp=await readKey(db,CHECKPOINT_KEY);d.checkpoint_found=!!cp;d.match_count=arr(cp?.matches).length;if(!cp)return{state:'checkpoint_missing',run:null,diagnostic:d};if(!d.match_count)return{state:'dataset_empty',run:null,diagnostic:d};let cached=null;try{cached=await readKey(db,LATEST_RUN_KEY);d.cache_status=cached?'read':'missing'}catch(e){d.cache_status=`ignored_read_error:${e?.name||'Error'}`}const s=selectRun(cp,cached,opts);d.source=s.source;d.player_count=Number(s.run?.dataset?.players)||Object.keys(s.run?.players||{}).length;d.rating_state_count=Object.values(s.run?.players||{}).filter(p=>p?.models&&Object.keys(p.models).length).length;return{state:s.state,run:s.run,diagnostic:d}}catch(e){d.error_stage=e?.stage||'load';d.error_name=e?.name||'Error';d.error_message=e?.message||String(e);return{state:'database_unavailable',run:null,diagnostic:d,error:e}}finally{try{db?.close?.()}catch{}}}
  return{DB_NAME,STORE,CHECKPOINT_KEY,LATEST_RUN_KEY,checkpointStamp,sourceMeta,databaseExists,openExistingDatabase,readKey,selectRun,loadExisting,policy_version:'0.15.131',read_only_boot:true,destructive_migration:false};
});
"""
(DST/'research-storage-v015131.js').write_text(storage,encoding='utf-8')

# Patch production Research UI without changing Elo/Glicko/TrueSkill calculations.
ui=(DST/'research-ui-devtools.js').read_text(encoding='utf-8')
ui=ui.replace("const VERSION='aram-rating-ui-v015130-production-target-puuid'","const VERSION='aram-rating-ui-v015131-production-storage-recovery'",1)
ui=ui.replace("let disposed=false,observer=null,observedNode=null,mountQueued=false,mounting=false,latestRun=null,lastError=null,booting=true,lastIdentityKey='',lastDiagnostic=null;","let disposed=false,observer=null,observedNode=null,mountQueued=false,mounting=false,latestRun=null,lastError=null,booting=true,lastIdentityKey='',lastDiagnostic=null,bootState='loading',lastBootLogKey='',bootDiagnostic={db_name:DB_NAME,indexeddb_open:false,db_version:null,object_stores:[],checkpoint_found:false,match_count:0,player_count:0,rating_state_count:0,identity_resolved:'(none)',render_status:'loading',error_stage:'',error_name:'',error_message:'',renderer_origin:String(location?.origin||''),renderer_protocol:String(location?.protocol||''),renderer_entry:String(location?.pathname||'').split('/').pop()||''};",1)
a=ui.index('  function dbOpen()'); b=ui.index('  async function ensureModules()',a); assert a>=0 and b>a
ui=ui[:a]+ui[b:]
old="async function ensureModules(){if(!globalThis.ARAMRatingResearchEngineV01)throw new Error('ARAMRatingResearchEngineV01 bundled module unavailable');if(!globalThis.ARAMRatingResearchUICoreV01)throw new Error('ARAMRatingResearchUICoreV01 bundled module unavailable');return{E:globalThis.ARAMRatingResearchEngineV01,U:globalThis.ARAMRatingResearchUICoreV01}}"
new="async function ensureModules(){if(!globalThis.ARAMRatingResearchEngineV01)throw Object.assign(new Error('ARAMRatingResearchEngineV01 bundled module unavailable'),{stage:'rating_engine_init'});if(!globalThis.ARAMRatingResearchUICoreV01)throw Object.assign(new Error('ARAMRatingResearchUICoreV01 bundled module unavailable'),{stage:'ui_core_init'});if(!globalThis.ARAMRatingResearchStorageV015131)throw Object.assign(new Error('ARAMRatingResearchStorageV015131 bundled module unavailable'),{stage:'storage_module_init'});return{E:globalThis.ARAMRatingResearchEngineV01,U:globalThis.ARAMRatingResearchUICoreV01,S:globalThis.ARAMRatingResearchStorageV015131}}"
assert old in ui; ui=ui.replace(old,new,1)
a=ui.index('  async function buildAndStoreLatest'); b=ui.index('  function state()',a); assert a>=0 and b>a
ui=ui[:a]+"  async function synchronizeLatestRun(opts={}){const{E,S}=await ensureModules();bootState='loading';bootDiagnostic.render_status='loading';bootDiagnostic.error_stage='';bootDiagnostic.error_name='';bootDiagnostic.error_message='';const out=await S.loadExisting({indexedDBRef:indexedDB,engine:E,forceBuild:!!opts.forceBuild,checkpointStamp,sourceMeta});bootState=out.state||'database_unavailable';Object.assign(bootDiagnostic,out.diagnostic||{});latestRun=out.run||null;if(out.error){lastError=String(out.error?.message||out.error);bootDiagnostic.error_stage=out.diagnostic?.error_stage||out.error?.stage||'load';bootDiagnostic.error_name=out.error?.name||'Error';bootDiagnostic.error_message=lastError}else lastError=null;return latestRun}\n"+ui[b:]
logfn="  function emitBootDiagnostic(r=null,force=false){const U=globalThis.ARAMRatingResearchUICoreV01;if(r)bootDiagnostic.identity_resolved=U?.maskPuuid?.(r.puuid)||'(none)';const d=bootDiagnostic,k=JSON.stringify([bootState,d.indexeddb_open,d.db_version,d.checkpoint_found,d.match_count,d.player_count,d.rating_state_count,d.identity_resolved,d.render_status,d.error_stage,d.error_name,d.error_message]);if(!force&&k===lastBootLogKey)return d;lastBootLogKey=k;console.log(`[ARAM Rating Research boot]\\nDB name: ${DB_NAME}\\nIndexedDB open: ${d.indexeddb_open}\\nDB version: ${d.db_version??'(unknown)'}\\nobject stores: ${(d.object_stores||[]).join(', ')||'(none)'}\\ncheckpoint-v03 found: ${d.checkpoint_found}\\nmatch count: ${d.match_count||0}\\nplayer count: ${d.player_count||0}\\nrating state count: ${d.rating_state_count||0}\\nidentity resolved: ${d.identity_resolved||'(none)'}\\nrender status: ${d.render_status||bootState}\\nerror stage: ${d.error_stage||'(none)'}\\nerror name: ${d.error_name||'(none)'}\\nerror message: ${d.error_message||'(none)'}`);return d}\n"
ui=ui.replace('  function css(){',logfn+'  function css(){',1)
oldmount="let vm;if(lastError&&!latestRun)vm={kind:'unavailable',message:lastError};else if(!latestRun)vm={kind:'unavailable',message:'Research data unavailable'};else vm=U?.buildViewModel(latestRun,r.puuid,{hardCap:HARD_CAP})||{kind:'unavailable'};"
newmount="let vm;if(!latestRun)vm={kind:'unavailable',message:lastError||bootState};else vm=U?.buildViewModel(latestRun,r.puuid,{hardCap:HARD_CAP})||{kind:'unavailable'};if(vm?.kind==='no_data')bootState='player_not_found';else if(vm?.kind==='player')bootState=vm.sample?.key==='insufficient'?'insufficient_sample':'available';bootDiagnostic.identity_resolved=U?.maskPuuid?.(r.puuid)||'(none)';bootDiagnostic.render_status=bootState;"
assert oldmount in ui; ui=ui.replace(oldmount,newmount,1)
ui=ui.replace("const html=U?.renderCard(vm);if(!html)return false;","let html=U?.renderCard(vm);if(!html)return false;if(vm?.kind==='unavailable'){const copy={loading:['연구 데이터 불러오는 중','기존 연구 데이터를 확인하고 있습니다.'],database_unavailable:['연구 데이터 저장소를 열 수 없음','기존 데이터는 삭제하지 않았습니다. 진단 로그에서 실패 단계를 확인할 수 있습니다.'],checkpoint_missing:['기존 연구 데이터가 보이지 않음','checkpoint-v03을 찾지 못했습니다. 새 수집이나 초기화는 하지 않습니다.'],dataset_empty:['분석할 연구 데이터 없음','저장소는 열렸지만 분석할 경기가 없습니다.']}[bootState]||['연구 데이터를 불러올 수 없음','기존 전적검색에는 영향이 없습니다.'];html=html.replace('Research data unavailable<small>연구 데이터 로드에 실패했습니다. 기존 전적검색에는 영향을 주지 않습니다.</small>',`<b>${copy[0]}</b><small>${copy[1]}</small>`)}",1)
ui=ui.replace('lastIdentityKey=key;emitDiagnostic(r);ensureProfileObserver();return true','lastIdentityKey=key;emitDiagnostic(r);emitBootDiagnostic(r);ensureProfileObserver();return true',1)
a=ui.index('  async function refreshLocal()'); b=ui.index('  function onClick',a); assert a>=0 and b>a
ui=ui[:a]+"  async function refreshLocal(){const btn=document.querySelector('#aramRatingResearchCardV01 [data-arui-action=\\\"refresh\\\"]');if(btn)btn.disabled=true;try{await ensureModules();await synchronizeLatestRun({forceBuild:true});lastIdentityKey='';mount();return{status:latestRun?'ok':bootState,dataset:latestRun?.dataset||null,selection:latestRun?.selection||null}}catch(e){lastError=String(e?.message||e);bootState='database_unavailable';bootDiagnostic.error_stage=e?.stage||'refresh';bootDiagnostic.error_name=e?.name||'Error';bootDiagnostic.error_message=lastError;mount();emitBootDiagnostic(null,true);return{status:'unavailable',error:lastError}}finally{const b=document.querySelector('#aramRatingResearchCardV01 [data-arui-action=\\\"refresh\\\"]');if(b)b.disabled=false}}\n"+ui[b:]
ui=ui.replace("status:()=>({enabled:enabled()&&!disposed,booting,latest_run:!!latestRun,last_error:lastError,dataset:latestRun?.dataset||null,selection:latestRun?.selection||null,identity:lastDiagnostic})","status:()=>({enabled:enabled()&&!disposed,booting,boot_state:bootState,boot_diagnostic:bootDiagnostic,latest_run:!!latestRun,last_error:lastError,dataset:latestRun?.dataset||null,selection:latestRun?.selection||null,identity:lastDiagnostic}),debugBoot:()=>emitBootDiagnostic(resolution(),true)",1)
oldboot="(async()=>{try{await ensureModules();if(enabled()){await synchronizeLatestRun();lastError=null}else lastError='Research UI disabled by local feature flag'}catch(e){lastError=String(e?.message||e);console.warn('[ARAM Rating Research UI] unavailable; production match history/profile is unchanged',e)}finally{booting=false;try{ensureProfileObserver();mount()}catch{}window.__ARAM_RATING_RESEARCH_UI_V01__=!!enabled()}})();"
newboot="(async()=>{try{bootState='loading';bootDiagnostic.error_stage='module_init';await ensureModules();if(enabled())await synchronizeLatestRun();else{lastError='Research UI disabled by local feature flag';bootState='database_unavailable'}}catch(e){lastError=String(e?.message||e);bootState='database_unavailable';bootDiagnostic.error_stage=e?.stage||bootDiagnostic.error_stage||'boot';bootDiagnostic.error_name=e?.name||'Error';bootDiagnostic.error_message=lastError}finally{booting=false;try{ensureProfileObserver();mount()}catch(e){bootDiagnostic.render_status='render_failed';bootDiagnostic.error_stage='render';bootDiagnostic.error_name=e?.name||'Error';bootDiagnostic.error_message=e?.message||String(e)}emitBootDiagnostic(null,true);window.__ARAM_RATING_RESEARCH_UI_V01__=!!enabled()}})();"
assert oldboot in ui; ui=ui.replace(oldboot,newboot,1)
(DST/'research-ui-devtools.js').write_text(ui,encoding='utf-8')

# Existing DATA owner edit for Patch Notes. No new competing UI owner.
data=(ROOT/'update/v0.15.120/ui-stability-baseline-v015115.js').read_text(encoding='utf-8')
data=data.replace("const PRESENTATION='0.15.120';","const PRESENTATION='0.15.131';",1)
css_anchor='      @media(max-width:1180px){'
assert css_anchor in data
data=data.replace(css_anchor,"      /* v0.15.131 Patch Notes: generic champion-detail header/close row is never shown. */\n      #data.data115View.data115PatchMode .data115DetailBranch > .title,\n      #data.data115View.data115PatchMode .data115DetailBranch > .panel > .title{display:none!important}\n\n"+css_anchor,1)
mode="    const mode=requested==='patch'||requested==='tier'?requested:currentDataMode(p.card);"
assert mode in data
data=data.replace(mode,mode+"\n    const patchMode=mode==='patch';\n    if(patchMode){for(const el of [p.detailBranch,p.card]){el.hidden=false;el.removeAttribute('aria-hidden');el.classList.remove('hidden','collapsed','is-collapsed');el.style?.removeProperty?.('display');el.style?.removeProperty?.('visibility');el.style?.removeProperty?.('max-height')}}",1)
oldtitle="    if(title){\n      if(!title.dataset.data115Original)title.dataset.data115Original=text(title)||'챔피언 상세';\n      title.textContent=mode==='patch'?'패치노트':title.dataset.data115Original;\n    }"
newtitle="    if(title){\n      if(!title.dataset.data115Original)title.dataset.data115Original=text(title)||'챔피언 상세';\n      title.hidden=patchMode;if(patchMode)title.setAttribute('aria-hidden','true');else{title.removeAttribute('aria-hidden');title.textContent=title.dataset.data115Original}\n    }"
assert oldtitle in data; data=data.replace(oldtitle,newtitle,1)
click="  document.addEventListener('click',e=>{\n    if(e.target?.closest?.('#randomPickModeBtn,#randomIngameModeBtn'))queueMicrotask(claimRandom);\n  },false);"
assert click in data
data=data.replace(click,click+"\n\n  document.addEventListener('click',e=>{const view=$('#data');if(!view?.classList.contains('data115PatchMode'))return;const p=dataParts(),btn=e.target?.closest?.('button');if(!p||!btn||!p.detailBranch.contains(btn)||!/닫기/.test(text(btn)))return;e.preventDefault();e.stopImmediatePropagation();syncData('patch')},true);",1)
(DST/'ui-stability-baseline-v015115.js').write_text(data,encoding='utf-8')

runtime=(SRC/'runtime-source-stability-v015130.js').read_text(encoding='utf-8').replace('V015130','V015131').replace('v0.15.130','v0.15.131').replace("'0.15.130'","'0.15.131'")
runtime=runtime.replace("  const ui=readLocal('research-ui-devtools.js');","  const storage=readLocal('research-storage-v015131.js');\n  const ui=readLocal('research-ui-devtools.js');",1)
runtime=runtime.replace("  if(!ui.includes('aramRatingResearchUIV01'))throw new Error('v0.15.131 research UI runtime contract mismatch');","  if(!storage.includes('ARAMRatingResearchStorageV015131'))throw new Error('v0.15.131 research storage contract mismatch');\n  if(!ui.includes('aramRatingResearchUIV01'))throw new Error('v0.15.131 research UI runtime contract mismatch');",1)
runtime=runtime.replace("cached=[engine,core,ui].join('\\n;\\n');","cached=[engine,core,storage,ui].join('\\n;\\n');",1)
runtime=runtime.replace('  let src=prior.patchRuntimeSource(file,input);',"  let src=prior.patchRuntimeSource(file,input);\n  if(file==='ui-stability-baseline-v015115.js')src=readLocal('ui-stability-baseline-v015115.js');",1)
runtime=runtime.replace('  aram_rating_search_target_rerender:true,','  aram_rating_search_target_rerender:true,\n  aram_rating_storage_read_only_recovery:true,\n  aram_rating_checkpoint_preserved:true,\n  patch_notes_detail_header_removed:true,',1)
(DST/'runtime-source-stability-v015131.js').write_text(runtime,encoding='utf-8')
(DST/'main-v015131.js').write_text((SRC/'main-v015130.js').read_text(encoding='utf-8').replace('v015130','v015131').replace('V015130','V015131').replace('0.15.130','0.15.131'),encoding='utf-8')
(DST/'successor-route-v015131.js').write_text((SRC/'successor-route-v015130.js').read_text(encoding='utf-8').replace('v015130','v015131').replace('0.15.130','0.15.131'),encoding='utf-8')
(DST/'cold-start-promotion-v015131.js').write_text((SRC/'cold-start-promotion-v015130.js').read_text(encoding='utf-8').replace('v015130','v015131').replace('0.15.130','0.15.131'),encoding='utf-8')
(DST/'package.json').write_text(json.dumps({'name':'aram-fearless-draft-update','version':'0.15.131','description':'Upgrade package v0.15.131 - Research IndexedDB recovery + always-visible Patch Notes detail','main':'main-v015131.js'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

manifest=json.loads((ROOT/'update/manifest.json').read_text(encoding='utf-8'))
manifest['version']='0.15.131';manifest['message']='v0.15.131 · RESEARCH STORAGE RECOVERY + PATCH NOTES DETAIL FIX';manifest['min_launcher']='2.0.2'
sources={'package.json':'update/v0.15.131/package.json','rating-engine-v01.js':'update/v0.15.131/rating-engine-v01.js','research-ui-core.js':'update/v0.15.131/research-ui-core.js','research-ui-devtools.js':'update/v0.15.131/research-ui-devtools.js','ui-stability-baseline-v015115.js':'update/v0.15.131/ui-stability-baseline-v015115.js','ARAM_Fearless_Draft_Launcher_windows_x64.exe':'update/v0.15.131/ARAM_Fearless_Draft_Launcher_windows_x64.exe','research-storage-v015131.js':'update/v0.15.131/research-storage-v015131.js','runtime-source-stability-v015131.js':'update/v0.15.131/runtime-source-stability-v015131.js','main-v015131.js':'update/v0.15.131/main-v015131.js','successor-route-v015131.js':'update/v0.15.131/successor-route-v015131.js','cold-start-promotion-v015131.js':'update/v0.15.131/cold-start-promotion-v015131.js'}
by={x['path']:x for x in manifest['files']}
for target,source in sources.items():
    e=by.get(target)
    if e is None:e={'path':target};manifest['files'].append(e);by[target]=e
    e['source']=source;e['sha256']=hashlib.sha256((ROOT/source).read_bytes()).hexdigest()
(ROOT/'update/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Audits
(ROOT/'tools/v015131-production-audit.js').write_text("""'use strict';
const fs=require('fs'),path=require('path');const R=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(R,p),'utf8'),buf=p=>fs.readFileSync(path.join(R,p));const must=(s,n)=>{if(!String(s).includes(n))throw new Error('missing '+n)},mustNot=(s,n)=>{if(String(s).includes(n))throw new Error('forbidden '+n)};const m=JSON.parse(read('update/manifest.json'));if(m.version!=='0.15.131'||String(m.min_launcher)!=='2.0.2')throw new Error('manifest mismatch');if(!buf('update/v0.15.131/rating-engine-v01.js').equals(buf('update/v0.15.130/rating-engine-v01.js')))throw new Error('rating engine changed');const old=read('update/v0.15.130/research-ui-devtools.js'),ui=read('update/v0.15.131/research-ui-devtools.js'),s=read('update/v0.15.131/research-storage-v015131.js'),data=read('update/v0.15.131/ui-stability-baseline-v015115.js');must(old,'indexedDB.open(DB_NAME,1)');must(old,'await kvSet(LATEST_RUN_KEY,run)');for(const x of [\"DB_NAME='aram-rating-research-v03'\",\"STORE='kv'\",\"CHECKPOINT_KEY='checkpoint-v03'\",'idb.open(name)',\"transaction(STORE,'readonly')\"])must(s,x);for(const x of ['deleteDatabase(',\"'readwrite'\",'.put('])mustNot(s,x);for(const x of ['[ARAM Rating Research boot]','DB name:','IndexedDB open:','DB version:','object stores:','checkpoint-v03 found:','match count:','player count:','rating state count:','identity resolved:','render status:','error stage:','error name:','error message:'])must(ui,x);for(const x of ['loading','database_unavailable','checkpoint_missing','dataset_empty','player_not_found','insufficient_sample','available'])must(ui,x);const S=require('../update/v0.15.131/research-storage-v015131.js');const cp={phase:'B1',status:'complete',sampling_version:'v0.3',matches:Array.from({length:159},(_,i)=>({gameId:'g'+i}))};const selected=S.selectRun(cp,null,{engine:{buildLatestRun(ms){return{schema:'aram-rating-ui-latest-run-v01',dataset:{matches:ms.length,players:1238},players:{p:{games:2,models:{elo:{}}}}}}}});if(selected.state!=='available'||selected.run.dataset.matches!==159||selected.run.dataset.players!==1238)throw new Error('159 checkpoint fixture');for(const x of [\"const PRESENTATION='0.15.131'\",'.data115PatchMode .data115DetailBranch > .title','title.hidden=patchMode','!/닫기/.test(text(btn))','dh99ChampionGrid','dh99Side'])must(data,x);const out={status:'SUCCESS',version:'0.15.131',checkpoint_159:'PASS',read_only_boot:true,rating_engine_unchanged:true,patch_notes_header_removed:true};fs.mkdirSync(path.join(R,'audit-output'),{recursive:true});fs.writeFileSync(path.join(R,'audit-output/v015131-production-report.json'),JSON.stringify(out,null,2)+'\\n');console.log('v0.15.131 PRODUCTION AUDIT: SUCCESS');
""",encoding='utf-8')
(ROOT/'tools/v015131-history-preservation-audit.js').write_text((ROOT/'tools/v015130-history-preservation-audit.js').read_text(encoding='utf-8').replace('v0.15.130','v0.15.131').replace('v015130','v015131').replace('../update/v0.15.130/runtime-source-stability-v015130','../update/v0.15.131/runtime-source-stability-v015131'),encoding='utf-8')

wf="""name: v0.15.131 Production Release Audit
on:
  push:
    branches: [ release/v0.15.131-research-storage-patchnotes ]
  pull_request:
    branches: [ main ]
    paths: [ 'update/v0.15.131/**', 'update/manifest.json', 'tools/v015131-production-audit.js', '.github/workflows/v015131-production-audit.yml' ]
  workflow_dispatch:
permissions:
  contents: read
jobs:
  audit:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22.x'
      - name: Compile package
        run: |
          node -c update/v0.15.131/research-storage-v015131.js
          node -c update/v0.15.131/research-ui-devtools.js
          node -c update/v0.15.131/ui-stability-baseline-v015115.js
          node -c update/v0.15.131/runtime-source-stability-v015131.js
          node -c update/v0.15.131/main-v015131.js
      - name: Research and Patch Notes fixtures
        run: node tools/v015131-production-audit.js
      - name: Cold-start fixtures
        working-directory: launcher/stable-v203
        run: go test -v ./...
      - name: Full Regression
        run: node tools/full-regression-audit.js
      - name: Match History
        run: node tools/v015131-history-preservation-audit.js
      - name: Player Profile
        run: node tools/profile-ux-audit.js
      - name: AutoSync
        run: node tools/v015119-autosync-concurrency-audit.js
      - name: RANDOM
        run: node tools/v015121-random-practice-restore-audit.js
      - name: DATA and Patch Notes
        run: node tools/v015120-data-subnav-audit.js
      - name: Item
        run: node tools/item-recommendation-v01581-audit.js
      - name: Updater safety
        run: |
          node tools/v015115-single-owner-stability-audit.js
          node tools/v015116-runtime-update-stability-audit.js
          node tools/v015117-state-integrity-audit.js
          node tools/v015118-resource-lifecycle-audit.js
      - name: Continuity
        run: |
          node tools/sync-current-state.js --check
          node tools/ai-continuity-audit.js
"""
(ROOT/'.github/workflows/v015131-production-audit.yml').write_text(wf,encoding='utf-8')
print('generated v0.15.131')
