(()=>{
  'use strict';
  const APP_ID='aram-fearless-draft';
  const RESEARCH_DB='aram-rating-research-v03';
  const CHECKPOINT_KEY='checkpoint-v03';
  const MASK='***';
  const SECRET_KEY_RE=/(token|authorization|password|secret|credential|cookie|puuid|riot.?id)/i;
  const ABS_PATH_RE=/\b[A-Za-z]:\\Users\\[^\\\s]+|\/home\/[^\/\s]+|\/Users\/[^\/\s]+/g;
  const PUUID_RE=/\b[a-zA-Z0-9_-]{60,90}\b/g;
  function maskString(v){return String(v??'').replace(ABS_PATH_RE,'<user-path>').replace(PUUID_RE,'<masked-id>')}
  function sanitize(v,key=''){
    if(SECRET_KEY_RE.test(key))return MASK;
    if(typeof v==='string')return maskString(v);
    if(Array.isArray(v))return v.slice(0,100).map(x=>sanitize(x,''));
    if(v&&typeof v==='object'){
      const out={};for(const [k,x] of Object.entries(v)){if(k==='matches'||k==='matchHistory'||k==='rawHistory')continue;out[k]=sanitize(x,k)}return out;
    }
    return v;
  }
  function duplicateIds(doc=document){
    const seen=new Set(),dupes=new Set();
    for(const el of doc.querySelectorAll('[id]')){const id=el.id;if(!id)continue;if(seen.has(id))dupes.add(id);else seen.add(id)}
    return [...dupes].sort();
  }
  function contractViolations(doc=document){
    const violations=[];
    const roles=new Map();
    for(const el of doc.querySelectorAll('[data-ui-role]')){const r=el.getAttribute('data-ui-role');if(!roles.has(r))roles.set(r,[]);roles.get(r).push(el)}
    for(const [role,els] of roles)if(els.length>1)violations.push({type:'duplicate-ui-role',role,count:els.length});
    return violations;
  }
  function storageAvailability(){
    let local=false,indexed=false;
    try{const k='__aram_diag_probe__';localStorage.setItem(k,'1');localStorage.removeItem(k);local=true}catch{}
    try{indexed=!!window.indexedDB}catch{}
    return{local,indexed};
  }
  async function researchCheckpoint(){
    if(!window.indexedDB)return{database_name:RESEARCH_DB,checkpoint_key:CHECKPOINT_KEY,checkpoint_readable:false,status:'indexeddb-unavailable'};
    return new Promise(resolve=>{
      let settled=false;const done=v=>{if(settled)return;settled=true;resolve(v)};
      let req;try{req=indexedDB.open(RESEARCH_DB)}catch(e){done({database_name:RESEARCH_DB,checkpoint_key:CHECKPOINT_KEY,checkpoint_readable:false,status:'open-error',error:maskString(e?.message||e)});return}
      req.onerror=()=>done({database_name:RESEARCH_DB,checkpoint_key:CHECKPOINT_KEY,checkpoint_readable:false,status:'open-error'});
      req.onupgradeneeded=()=>{try{req.transaction?.abort()}catch{};done({database_name:RESEARCH_DB,checkpoint_key:CHECKPOINT_KEY,checkpoint_readable:false,status:'database-not-present'})};
      req.onsuccess=()=>{
        const db=req.result;let names=[];try{names=[...db.objectStoreNames]}catch{}
        const likely=names.find(n=>/checkpoint/i.test(n))||names.find(n=>/research|state|meta/i.test(n))||names[0];
        if(!likely){try{db.close()}catch{};done({database_name:RESEARCH_DB,checkpoint_key:CHECKPOINT_KEY,checkpoint_readable:false,status:'no-object-store'});return}
        try{
          const tx=db.transaction(likely,'readonly'),store=tx.objectStore(likely),get=store.get(CHECKPOINT_KEY);
          get.onsuccess=()=>{const val=get.result;try{db.close()}catch{};done({database_name:RESEARCH_DB,checkpoint_key:CHECKPOINT_KEY,checkpoint_readable:val!==undefined,status:val!==undefined?'ok':'key-not-found',accepted_matches:Number(val?.accepted_matches??val?.acceptedMatches??val?.summary?.accepted_matches)||null})};
          get.onerror=()=>{try{db.close()}catch{};done({database_name:RESEARCH_DB,checkpoint_key:CHECKPOINT_KEY,checkpoint_readable:false,status:'read-error'})};
        }catch(e){try{db.close()}catch{};done({database_name:RESEARCH_DB,checkpoint_key:CHECKPOINT_KEY,checkpoint_readable:false,status:'transaction-error',error:maskString(e?.message||e)})}
      };
      setTimeout(()=>done({database_name:RESEARCH_DB,checkpoint_key:CHECKPOINT_KEY,checkpoint_readable:false,status:'timeout'}),1500);
    });
  }
  function currentView(doc=document){
    const visible=[...doc.querySelectorAll('[data-view],#random,#data,#history')].find(el=>!el.hidden&&getComputedStyle(el).display!=='none');
    const role=visible?.getAttribute?.('data-ui-role')||visible?.getAttribute?.('data-view')||visible?.id||'unknown';
    let mode='unknown';
    if(doc.querySelector('#data.data115PatchMode,[data-mode="patch"]'))mode='patch';
    else if(doc.querySelector('#randomIngameShell:not([hidden]),[data-mode="ingame"]'))mode='ingame';
    else if(role.includes('random'))mode='pick';
    return{current_view:role,current_mode:mode};
  }
  function owners(){return sanitize(window.__ARAM_ACTIVE_OWNERS__||window.__aramOwners||{},'owners')}
  function loadedModules(){return Object.keys(window).filter(k=>/^__ARAM_[A-Z0-9_]+__$/.test(k)&&window[k]===true).sort().slice(0,250)}
  async function collect(extra={}){
    const avail=storageAvailability();
    const checkpoint=await researchCheckpoint();
    const payload={
      schema:1,
      generated_at:new Date().toISOString(),
      app:{version:String(extra.version||window.__ARAM_APP_VERSION__||'unknown'),app_identity:APP_ID},
      view:currentView(),
      ui:{duplicate_ids:duplicateIds(),contract_violations:contractViolations()},
      storage:{user_data_identity:APP_ID,local_storage_available:avail.local,indexeddb_available:avail.indexed},
      research:checkpoint,
      autosync:{status:String(extra.autosyncStatus||window.__ARAM_AUTOSYNC_STATUS__||'unknown'),queue_depth:Number(extra.autosyncQueueDepth??window.__ARAM_AUTOSYNC_QUEUE_DEPTH__??0)||0},
      runtime:{owners:owners(),loaded_modules:loadedModules()}
    };
    return sanitize(payload);
  }
  async function copy(extra={}){
    const payload=await collect(extra),text=JSON.stringify(payload,null,2);
    try{await navigator.clipboard.writeText(text);return{ok:true,text,payload}}catch{return{ok:false,text,payload}}
  }
  window.aramDiagnosticsV1={collect,copy,sanitize,duplicateIds,contractViolations,policy:'read-only privacy-safe diagnostics'};
})();
