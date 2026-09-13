'use strict';
/*
 * ARAM Rating Research UI v0.1
 * Local-only research feature. Not referenced by update/manifest.json.
 * It never starts history collection and never replaces production Match History / Player Profile owners.
 */
(()=>{
  const VERSION='aram-rating-ui-v01';
  const FLAG_KEY='aram_rating_research_ui_enabled_v01';
  const DB_NAME='aram-rating-research-v03',STORE='kv';
  const CHECKPOINT_KEY='checkpoint-v03',LATEST_RUN_KEY='rating-ui-latest-run-v01';
  const BRANCH='research/aram-rating-ui-v01';
  const RAW=`https://raw.githubusercontent.com/dbswo2910-oss/ARAM-Fearless-Draft/${BRANCH}/research/aram-rating-ui-v01`;
  const ENGINE_URL=`${RAW}/rating-engine-v01.js`;
  const CORE_URL=`${RAW}/research-ui-core.js`;
  const HARD_CAP=500;

  try{window.aramRatingResearchUIV01?.dispose?.()}catch{}
  let disposed=false,observer=null,observedNode=null,mountQueued=false,mounting=false,latestRun=null,lastError=null,booting=true;
  const enabled=()=>{try{return localStorage.getItem(FLAG_KEY)!=='false'}catch{return true}};
  window.ARAM_RATING_RESEARCH_UI=enabled();

  function dbOpen(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
  async function kvGet(key){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(key);r.onsuccess=()=>{db.close();resolve(r.result??null)};r.onerror=()=>{db.close();reject(r.error)}})}
  async function kvSet(key,val){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(val,key);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}

  async function loadScript(url,globalKey){
    if(globalThis[globalKey])return globalThis[globalKey];
    const text=await fetch(`${url}?ts=${Date.now()}`).then(r=>{if(!r.ok)throw new Error(`${globalKey} static module fetch failed (${r.status})`);return r.text()});
    (0,eval)(text);
    if(!globalThis[globalKey])throw new Error(`${globalKey} unavailable after load`);
    return globalThis[globalKey];
  }
  async function ensureModules(){
    const E=await loadScript(ENGINE_URL,'ARAMRatingResearchEngineV01');
    const U=await loadScript(CORE_URL,'ARAMRatingResearchUICoreV01');
    return{E,U};
  }
  function checkpointStamp(cp){
    const xs=Array.isArray(cp?.matches)?cp.matches:[],last=xs.at(-1),id=last?.gameId??last?.id??last?.matchId??'';
    return [cp?.seed_fingerprint||'',cp?.phase||'',cp?.status||'',xs.length,cp?.finished_at||'',id].join('|');
  }
  function sourceMeta(cp){return{phase:String(cp?.phase||'UNKNOWN'),status:String(cp?.status||'unknown'),sampling_version:String(cp?.sampling_version||cp?.config?.samplingVersion||'v0.3'),source:`IndexedDB ${DB_NAME}/${CHECKPOINT_KEY}`}}

  async function buildAndStoreLatest(cp){
    const E=globalThis.ARAMRatingResearchEngineV01;
    if(!E)throw new Error('rating_engine_unavailable');
    if(!cp||!Array.isArray(cp.matches)||cp.matches.length<10)throw new Error('research_checkpoint_missing_or_too_small');
    const run=E.buildLatestRun(cp.matches,sourceMeta(cp));
    run.source_run={checkpoint_key:CHECKPOINT_KEY,checkpoint_stamp:checkpointStamp(cp),checkpoint_finished_at:cp.finished_at||null,checkpoint_status:cp.status||null,checkpoint_phase:cp.phase||null};
    await kvSet(LATEST_RUN_KEY,run);
    latestRun=run;lastError=null;
    return run;
  }

  async function synchronizeLatestRun(){
    const [cp,stored]=await Promise.all([kvGet(CHECKPOINT_KEY),kvGet(LATEST_RUN_KEY)]);
    const stamp=checkpointStamp(cp);
    if(stored?.schema==='aram-rating-ui-latest-run-v01'&&stored?.source_run?.checkpoint_stamp===stamp){latestRun=stored;return stored}
    return buildAndStoreLatest(cp);
  }

  function state(){try{return typeof aramHistoryState!=='undefined'?aramHistoryState:window.aramHistoryState}catch{return window.aramHistoryState}}
  function currentPuuid(){
    const s=state()||{},a=s.account||s.target||s.localAccount||{};
    const direct=a.puuid||a.player?.puuid||s.targetPuuid||s.puuid;
    if(direct)return String(direct);
    const ms=Array.isArray(s.matches)?s.matches:[];
    for(const m of ms){const p=m?.me?.player?.puuid||m?.me?.puuid;if(p)return String(p)}
    return'';
  }

  function css(){
    if(document.getElementById('aruiResearchStyleV01'))return;
    const st=document.createElement('style');st.id='aruiResearchStyleV01';st.textContent=`
#aramRatingResearchCardV01.arui-card{margin:16px 0;padding:17px;border:1px solid rgba(91,132,190,.28);border-radius:16px;background:linear-gradient(145deg,rgba(12,24,43,.98),rgba(18,31,53,.96));box-shadow:0 16px 40px rgba(0,0,0,.18);color:#e8eff9;font-family:inherit}
.arui-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.arui-head>div{min-width:0}.arui-head h3{display:inline-block;margin:0 0 0 8px;font-size:15px;letter-spacing:.01em}.arui-head small{display:block;margin-top:6px;color:#8495ad;font-size:11px}.arui-badge{display:inline-flex;align-items:center;border:1px solid rgba(75,190,255,.5);border-radius:999px;padding:3px 7px;background:rgba(36,117,170,.17);color:#8ed8ff;font-size:9px;font-weight:800;letter-spacing:.12em;vertical-align:2px}.arui-refresh{border:1px solid rgba(122,151,190,.28);border-radius:9px;background:rgba(255,255,255,.035);color:#a9bad0;width:30px;height:30px;cursor:pointer;font-size:16px}.arui-refresh:hover{background:rgba(255,255,255,.07);color:#fff}.arui-refresh:disabled{opacity:.45;cursor:wait}
.arui-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:14px}.arui-summary>div{padding:10px 11px;border:1px solid rgba(113,142,180,.15);border-radius:11px;background:rgba(255,255,255,.025)}.arui-summary small,.arui-player-meta small{display:block;color:#8091a9;font-size:10px}.arui-summary b{display:block;margin-top:3px;font-size:14px}.arui-summary em{display:block;margin-top:3px;color:#7f91a9;font-size:9px;font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.arui-confidence.low b{color:#f3c978}.arui-confidence.medium b{color:#9fd7ff}.arui-confidence.high b{color:#92e4c0}
.arui-research-status{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:9px;padding:10px 12px;border-radius:11px;background:rgba(77,102,139,.11);border:1px solid rgba(119,149,191,.12)}.arui-research-status small{display:block;color:#7e90a8;font-size:9px;text-transform:uppercase;letter-spacing:.08em}.arui-research-status b{font-size:13px}.arui-research-status>span{color:#93a4ba;font-size:10px;text-align:right}.arui-research-status.candidate{border-color:rgba(84,211,157,.3);background:rgba(45,145,102,.08)}
.arui-models{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:9px}.arui-model{position:relative;padding:12px;border-radius:12px;border:1px solid rgba(109,143,188,.19);background:rgba(7,16,29,.48);min-width:0}.arui-model-head{display:flex;align-items:center;justify-content:space-between;gap:6px;color:#9fb1c9;font-size:10px;font-weight:700}.arui-model strong{display:block;margin-top:9px;font-size:21px;line-height:1;color:#f5f8fc}.arui-model small{display:block;margin-top:7px;color:#7588a2;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.arui-model-muted{opacity:.54}.arui-model-primary{border-color:rgba(69,212,151,.42);box-shadow:inset 0 0 0 1px rgba(69,212,151,.08)}.arui-primary,.arui-observed{font-size:7px;padding:2px 5px;border-radius:999px;letter-spacing:.07em}.arui-primary{color:#8de8bd;background:rgba(53,157,111,.13)}.arui-observed{color:#92caf4;background:rgba(58,119,165,.14)}
.arui-player-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:9px}.arui-player-meta>div{min-height:52px;padding:9px 10px;border-radius:10px;background:rgba(255,255,255,.022);border:1px solid rgba(113,142,180,.1)}.arui-player-meta b{display:inline-block;margin-top:3px;font-size:11px}.arui-sample{display:inline-block;margin-left:6px;padding:2px 5px;border-radius:999px;background:rgba(245,193,99,.11);color:#e9c77e;font-size:8px}.arui-trend{display:grid!important;grid-template-columns:1fr auto;align-items:center}.arui-trend small{grid-column:1/3}.arui-spark{width:70px;height:19px;color:#79bde7;opacity:.82}
.arui-dataset-mini{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}.arui-dataset-mini span{padding:4px 7px;border-radius:999px;background:rgba(73,96,127,.14);color:#8295ae;font-size:8px}.arui-details{margin-top:10px;border-top:1px solid rgba(104,132,169,.13);padding-top:9px}.arui-details summary{cursor:pointer;color:#9cb0ca;font-size:10px;font-weight:700;list-style:none}.arui-details summary::-webkit-details-marker{display:none}.arui-details summary:after{content:'＋';float:right;color:#60728a}.arui-details[open] summary:after{content:'－'}.arui-detail-body{padding-top:10px}.arui-detail-block{padding:10px;border-radius:10px;background:rgba(5,13,24,.35);border:1px solid rgba(106,139,181,.11)}.arui-detail-block h4{margin:0 0 8px;color:#8298b4;font-size:9px;letter-spacing:.09em}.arui-detail-block table{width:100%;border-collapse:collapse;font-size:9px}.arui-detail-block th,.arui-detail-block td{padding:5px 4px;text-align:right;border-bottom:1px solid rgba(114,139,171,.08)}.arui-detail-block th:first-child,.arui-detail-block td:first-child{text-align:left}.arui-detail-block th{color:#6f8199;font-weight:600}.arui-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.arui-detail-block dl{margin:0}.arui-detail-block dl>div{display:flex;justify-content:space-between;gap:10px;padding:4px 0;font-size:9px}.arui-detail-block dt{color:#72859e}.arui-detail-block dd{margin:0;color:#c0cede}.arui-collection{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:9px;color:#8498b1}.arui-collection b{color:#dbe7f5}.arui-disclaimer,.arui-foot{margin-top:9px;color:#60738c;font-size:8px}.arui-empty{margin-top:14px;padding:20px 12px;text-align:center;border:1px dashed rgba(116,145,184,.18);border-radius:12px;color:#b8c7da}.arui-empty b{display:block}.arui-empty small{display:block;margin-top:6px;color:#71849c}.arui-state{min-height:110px}
@media(max-width:860px){.arui-summary,.arui-models{grid-template-columns:1fr}.arui-player-meta{grid-template-columns:1fr 1fr}.arui-detail-grid{grid-template-columns:1fr}}
`;
    document.head.appendChild(st);
  }

  function renderUnavailable(message){
    const U=globalThis.ARAMRatingResearchUICoreV01;if(!U)return;
    latestRun=null;lastError=message||'Research data unavailable';mount();
  }

  function makeNode(html){const w=document.createElement('div');w.innerHTML=html.trim();return w.firstElementChild}
  function mount(){
    if(disposed||!enabled()||mounting)return false;
    const body=document.querySelector('#pp19c .ppbody');if(!body)return false;
    css();mounting=true;
    try{
      const old=document.getElementById('aramRatingResearchCardV01');
      let vm;
      if(lastError&&!latestRun)vm={kind:'unavailable',message:lastError};
      else if(!latestRun)vm={kind:'unavailable',message:'Research data unavailable'};
      else vm=globalThis.ARAMRatingResearchUICoreV01?.buildViewModel(latestRun,currentPuuid(),{hardCap:HARD_CAP})||{kind:'unavailable'};
      const html=globalThis.ARAMRatingResearchUICoreV01?.renderCard(vm);if(!html)return false;
      const node=makeNode(html);if(old)old.replaceWith(node);else{const hero=body.querySelector('.pphero');if(hero)hero.insertAdjacentElement('afterend',node);else body.prepend(node)}
      ensureProfileObserver();return true;
    }catch(e){console.warn('[ARAM Rating Research UI] render failed safely',e);return false}finally{mounting=false}
  }
  function scheduleMount(){if(disposed||mountQueued)return;mountQueued=true;queueMicrotask(()=>{mountQueued=false;mount()})}
  function ensureProfileObserver(){
    const node=document.getElementById('pp19c');if(!node||node===observedNode)return;
    try{observer?.disconnect()}catch{}
    observedNode=node;observer=new MutationObserver(muts=>{if(disposed||mounting)return;const changed=muts.some(m=>m.type==='childList');if(changed&&!document.getElementById('aramRatingResearchCardV01'))scheduleMount()});observer.observe(node,{childList:true,subtree:true});
  }

  async function refreshLocal(){
    const btn=document.querySelector('#aramRatingResearchCardV01 [data-arui-action="refresh"]');if(btn)btn.disabled=true;
    try{
      if(!globalThis.ARAMRatingResearchEngineV01||!globalThis.ARAMRatingResearchUICoreV01)throw new Error('rating_engine_unavailable');
      const cp=await kvGet(CHECKPOINT_KEY);await buildAndStoreLatest(cp);mount();return{status:'ok',dataset:latestRun.dataset,selection:latestRun.selection};
    }catch(e){lastError=String(e?.message||e);console.warn('[ARAM Rating Research UI] local refresh unavailable; production UI remains untouched',e);mount();return{status:'unavailable',error:lastError}}
    finally{const b=document.querySelector('#aramRatingResearchCardV01 [data-arui-action="refresh"]');if(b)b.disabled=false}
  }

  function onClick(e){
    const refresh=e.target?.closest?.('[data-arui-action="refresh"]');if(refresh){e.preventDefault();e.stopPropagation();refreshLocal();return}
    if(e.target?.closest?.('#pp19open')){setTimeout(()=>{ensureProfileObserver();mount()},0)}
  }
  document.addEventListener('click',onClick,false);

  function dispose(){
    disposed=true;try{observer?.disconnect()}catch{}observer=null;observedNode=null;document.removeEventListener('click',onClick,false);document.getElementById('aramRatingResearchCardV01')?.remove();window.ARAM_RATING_RESEARCH_UI=false;
  }
  function setEnabled(v){try{localStorage.setItem(FLAG_KEY,v?'true':'false')}catch{}window.ARAM_RATING_RESEARCH_UI=!!v;if(v){disposed=false;document.addEventListener('click',onClick,false);scheduleMount()}else dispose()}
  const api={version:VERSION,featureFlag:FLAG_KEY,latestRunKey:LATEST_RUN_KEY,checkpointKey:CHECKPOINT_KEY,refresh:refreshLocal,mount,dispose,enable:()=>setEnabled(true),disable:()=>setEnabled(false),status:()=>({enabled:enabled()&&!disposed,booting,latest_run:!!latestRun,last_error:lastError,dataset:latestRun?.dataset||null,selection:latestRun?.selection||null})};
  window.aramRatingResearchUIV01=api;

  (async()=>{
    try{
      await ensureModules();
      if(enabled()){await synchronizeLatestRun();lastError=null}else lastError='Research UI disabled by local feature flag';
    }catch(e){lastError=String(e?.message||e);console.warn('[ARAM Rating Research UI] unavailable; production match history/profile is unchanged',e)}
    finally{booting=false;try{ensureProfileObserver();mount()}catch{}window.__ARAM_RATING_RESEARCH_UI_V01__=!!enabled()}
  })();
})();
