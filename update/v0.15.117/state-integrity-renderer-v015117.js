'use strict';
(()=>{
  const V='0.15.117',NS='renderer-local-storage',PREFIX='aram_',MAX_VALUE_BYTES=2*1024*1024;
  if(window.__ARAM_STATE_INTEGRITY_V015117__)return;
  const stats={seeded:0,recoveredMalformed:0,recoveredMissing:0,blockedMalformedWrites:0,writes:0,deletes:0,flushes:0,flushErrors:0,bridge:false};
  const byteLen=s=>{try{return new TextEncoder().encode(String(s??'')).length}catch{return String(s??'').length}};
  const tracked=k=>String(k||'').startsWith(PREFIX);
  const json=s=>{try{return{ok:true,value:JSON.parse(s)}}catch{return{ok:false,value:null}}};
  function validValue(key,value){
    if(typeof value!=='string'||byteLen(value)>MAX_VALUE_BYTES)return false;
    if(key==='aram_cc_install_v1')return value.length>0&&value.length<=512;
    const p=json(value);
    if(key==='aram_match_lab_favorites_v1')return p.ok&&Array.isArray(p.value)&&p.value.length<=60&&p.value.every(x=>x&&typeof x==='object'&&!Array.isArray(x));
    if(key==='aram_cc_consent_v1')return p.ok&&p.value&&typeof p.value==='object'&&!Array.isArray(p.value);
    if(key==='aram_cc_queue_v1')return p.ok&&Array.isArray(p.value)&&p.value.length<=240;
    if(key==='aram_cc_sent_v1')return p.ok&&Array.isArray(p.value)&&p.value.length<=3000;
    const t=value.trim();
    if(t.startsWith('{')||t.startsWith('['))return p.ok;
    return true;
  }
  function diag(event,detail={}){try{window.aramDesktop?.traceStateIntegrity?.(event,{...detail,version:V})}catch{}}
  let storage;
  try{storage=window.localStorage}catch(e){diag('RENDERER_STORAGE_UNAVAILABLE',{message:e?.message||String(e)});window.__ARAM_STATE_INTEGRITY_V015117__=false;return}
  const proto=window.Storage?.prototype;
  const native={
    getItem:proto?.getItem,
    setItem:proto?.setItem,
    removeItem:proto?.removeItem,
    clear:proto?.clear,
    key:proto?.key
  };
  if(!proto||Object.values(native).some(x=>typeof x!=='function')){diag('RENDERER_STORAGE_API_MISSING');window.__ARAM_STATE_INTEGRITY_V015117__=false;return}
  const bridge=window.aramDesktop;
  stats.bridge=!!(bridge?.readStateMirror&&bridge?.writeStateMirror&&bridge?.traceStateIntegrity);
  if(!stats.bridge){diag('RENDERER_STATE_BRIDGE_MISSING');window.__ARAM_STATE_INTEGRITY_V015117__=false;return}

  let entries={};let flushQueued=false;let restoring=false;
  function currentKeys(){
    const out=[];
    try{for(let i=0;i<storage.length;i++){const k=native.key.call(storage,i);if(tracked(k))out.push(k)}}catch{}
    return [...new Set(out)];
  }
  function mirrorPayload(){return{schema:1,version:V,entries}}
  function flush(){
    if(flushQueued)return;flushQueued=true;
    queueMicrotask(()=>{
      flushQueued=false;
      try{const r=bridge.writeStateMirror(NS,mirrorPayload());if(!r?.ok)throw new Error(r?.error||'mirror write failed');stats.flushes++}
      catch(e){stats.flushErrors++;diag('RENDERER_MIRROR_FLUSH_ERROR',{message:e?.message||String(e)})}
    });
  }
  function remember(key,value){entries[key]={value,deleted:false,updatedAt:Date.now()};stats.writes++;flush()}
  function tombstone(key){entries[key]={value:'',deleted:true,updatedAt:Date.now()};stats.deletes++;flush()}
  function lkg(key){const e=entries[key];return e&&!e.deleted&&validValue(key,e.value)?e.value:null}
  function recoverInitial(){
    let mirror=null;
    try{const r=bridge.readStateMirror(NS);if(r?.ok&&r.payload?.schema===1&&r.payload.entries&&typeof r.payload.entries==='object')mirror=r.payload}catch(e){diag('RENDERER_MIRROR_READ_ERROR',{message:e?.message||String(e)})}
    entries=mirror?.entries&&typeof mirror.entries==='object'?{...mirror.entries}:{};
    const seen=new Set();restoring=true;
    try{
      for(const key of currentKeys()){
        seen.add(key);const cur=native.getItem.call(storage,key);
        if(validValue(key,cur)){entries[key]={value:cur,deleted:false,updatedAt:Number(entries[key]?.updatedAt)||Date.now()};stats.seeded++;continue}
        const backup=lkg(key);
        if(backup!==null){native.setItem.call(storage,key,backup);stats.recoveredMalformed++;diag('RENDERER_STATE_RECOVERED',{key,reason:'malformed-current'})}
        else diag('RENDERER_STATE_UNRECOVERABLE',{key,reason:'malformed-current-no-lkg'});
      }
      for(const [key,e] of Object.entries(entries)){
        if(!tracked(key)||seen.has(key)||!e||e.deleted)continue;
        if(validValue(key,e.value)){native.setItem.call(storage,key,e.value);stats.recoveredMissing++;diag('RENDERER_STATE_RECOVERED',{key,reason:'missing-current'})}
      }
    }finally{restoring=false}
    flush();
  }

  const wrappedSet=function(key,value){
    if(this!==storage)return native.setItem.apply(this,arguments);
    key=String(key);value=String(value);
    if(!tracked(key)||restoring)return native.setItem.call(this,key,value);
    const before=native.getItem.call(this,key),backup=validValue(key,before)?before:lkg(key);
    native.setItem.call(this,key,value);
    if(validValue(key,value)){remember(key,value);return}
    stats.blockedMalformedWrites++;diag('RENDERER_MALFORMED_WRITE_BLOCKED',{key,hadFallback:backup!==null});
    if(backup!==null){restoring=true;try{native.setItem.call(this,key,backup);entries[key]={value:backup,deleted:false,updatedAt:Date.now()}}finally{restoring=false};flush()}
  };
  const wrappedRemove=function(key){
    if(this!==storage)return native.removeItem.apply(this,arguments);
    key=String(key);const out=native.removeItem.call(this,key);if(tracked(key)&&!restoring)tombstone(key);return out;
  };
  const wrappedClear=function(){
    if(this!==storage)return native.clear.apply(this,arguments);
    const keys=currentKeys(),out=native.clear.call(this);if(!restoring){for(const key of keys)entries[key]={value:'',deleted:true,updatedAt:Date.now()};stats.deletes+=keys.length;flush()}return out;
  };
  try{
    Object.defineProperty(proto,'setItem',{...Object.getOwnPropertyDescriptor(proto,'setItem'),value:wrappedSet});
    Object.defineProperty(proto,'removeItem',{...Object.getOwnPropertyDescriptor(proto,'removeItem'),value:wrappedRemove});
    Object.defineProperty(proto,'clear',{...Object.getOwnPropertyDescriptor(proto,'clear'),value:wrappedClear});
    recoverInitial();
    window.aramStateIntegrityV015117={version:V,getStats:()=>({...stats,tracked:Object.keys(entries).length}),flush:()=>{flush();return true},validateValue,score_logic_changed:false,random_scoring_changed:false};
    window.__ARAM_STATE_INTEGRITY_V015117__=true;
    diag('RENDERER_STATE_INTEGRITY_READY',{tracked:Object.keys(entries).length});
  }catch(e){
    try{Object.defineProperty(proto,'setItem',{...Object.getOwnPropertyDescriptor(proto,'setItem'),value:native.setItem});Object.defineProperty(proto,'removeItem',{...Object.getOwnPropertyDescriptor(proto,'removeItem'),value:native.removeItem});Object.defineProperty(proto,'clear',{...Object.getOwnPropertyDescriptor(proto,'clear'),value:native.clear})}catch{}
    diag('RENDERER_STATE_INTEGRITY_INIT_ERROR',{message:e?.message||String(e)});
    window.__ARAM_STATE_INTEGRITY_V015117__=false;
  }
})();
