'use strict';
const V='0.15.119';
const NOW=()=>Date.now();
const CORE_INTERVAL_MS=1200;
const BACKOFF=[0,2000,3500,6000,10000,15000];

function runtime(core){
  if(core.__aramConcurrencyV015119)return core.__aramConcurrencyV015119;
  const state={
    running:false,stopped:false,inflight:null,pending:false,dueAt:0,generation:0,acceptedGeneration:0,
    failures:0,nextAllowedAt:0,overlapSkips:0,scheduledRuns:0,requestCoalesces:0,credentialEpoch:0,
    credentialRotations:0,staleEndpointRetries:0,lastTickMs:0,maxTickMs:0,lastError:'',requests:new Map()
  };
  try{Object.defineProperty(core,'__aramConcurrencyV015119',{value:state,writable:false,configurable:true})}
  catch{core.__aramConcurrencyV015119=state}
  return state;
}
function backoffMs(failures){return BACKOFF[Math.min(BACKOFF.length-1,Math.max(0,Number(failures)||0))]||0}
function credentialSignature(creds){
  if(!creds||typeof creds!=='object')return '';
  const keys=['port','password','token','protocol','address','host'];
  const picked=keys.map(k=>`${k}:${String(creds[k]??'')}`).join('|');
  if(picked.replace(/[^:|]/g,''))return picked;
  try{return JSON.stringify(creds)}catch{return String(creds)}
}
function invalidateConnectionCaches(core){
  try{core.__aramLiveEndpointCacheV01571?.clear?.()}catch{}
  try{core.__aramLiveFlowCacheV01571=null;core.__aramLiveFlowAtV01571=0}catch{}
  try{core.__aramLiveIdentityAtV01571=0;core.__aramLiveCredsAtV01571=0}catch{}
}
function singleFlight(core,key,fn){
  const s=runtime(core),existing=s.requests.get(key);
  if(existing){s.requestCoalesces++;return existing}
  let p;
  p=Promise.resolve().then(fn).finally(()=>{if(s.requests.get(key)===p)s.requests.delete(key)});
  s.requests.set(key,p);return p;
}
function schedule(core,delay=CORE_INTERVAL_MS){
  const s=runtime(core);if(s.stopped||!s.running)return false;
  const due=NOW()+Math.max(0,Number(delay)||0);
  if(core.timer&&s.dueAt&&s.dueAt<=due)return false;
  if(core.timer){try{clearTimeout(core.timer)}catch{};try{clearInterval(core.timer)}catch{};core.timer=null}
  s.dueAt=due;
  core.timer=setTimeout(async()=>{
    core.timer=null;s.dueAt=0;if(s.stopped||!s.running)return;
    const wait=Math.max(0,s.nextAllowedAt-NOW());if(wait>0){schedule(core,wait);return}
    s.scheduledRuns++;
    try{await core.tick()}catch{}
    if(!s.stopped&&s.running)schedule(core,Math.max(CORE_INTERVAL_MS,s.nextAllowedAt-NOW()));
  },Math.max(0,due-NOW()));
  core.timer?.unref?.();return true;
}
function patchCore(mod){
  if(!mod||mod.__ARAM_AUTOSYNC_CONCURRENCY_V015119__)return mod;
  const Core=mod.LeagueAutoSyncCore;if(!Core?.prototype)return mod;
  const oldTick=Core.prototype.tick;
  if(typeof oldTick==='function'){
    Core.prototype.tick=function(...args){
      const s=runtime(this);
      if(s.inflight){s.overlapSkips++;s.pending=true;return s.inflight}
      const generation=++s.generation,started=NOW();s.pending=false;
      let p;
      p=Promise.resolve().then(()=>oldTick.apply(this,args)).then(out=>{
        s.acceptedGeneration=Math.max(s.acceptedGeneration,generation);s.failures=0;s.nextAllowedAt=0;s.lastError='';return out;
      },err=>{
        s.failures++;s.nextAllowedAt=NOW()+backoffMs(s.failures);s.lastError=String(err?.message||err||'tick failed').slice(0,240);throw err;
      }).finally(()=>{
        const dt=Math.max(0,NOW()-started);s.lastTickMs=dt;s.maxTickMs=Math.max(s.maxTickMs,dt);
        if(s.inflight===p)s.inflight=null;
        if(s.pending){s.pending=false;if(s.running&&!s.stopped)schedule(this,0)}
      });
      s.inflight=p;return p;
    };
  }

  const oldStart=Core.prototype.start;
  Core.prototype.start=function(){
    const s=runtime(this);if(s.running||this.timer)return;
    s.running=true;s.stopped=false;s.nextAllowedAt=0;s.failures=0;
    schedule(this,0);
  };
  const oldStop=Core.prototype.stop;
  Core.prototype.stop=function(...args){
    const s=runtime(this);s.stopped=true;s.running=false;s.pending=false;s.dueAt=0;
    const timer=this.timer;let out;
    try{if(typeof oldStop==='function')out=oldStop.apply(this,args)}finally{
      try{clearTimeout(timer)}catch{};try{clearInterval(timer)}catch{};this.timer=null;
      for(const p of s.requests.values())void p;s.requests.clear();
    }
    return out;
  };
  void oldStart;

  const oldCapture=Core.prototype.captureIdentityAndParty;
  if(typeof oldCapture==='function')Core.prototype.captureIdentityAndParty=function(...args){
    const s=runtime(this),epoch=s.credentialEpoch;
    return singleFlight(this,'identity-party',async()=>{
      const out=await oldCapture.apply(this,args);
      if(epoch!==s.credentialEpoch){s.staleEndpointRetries++;return oldCapture.apply(this,args)}
      return out;
    });
  };

  const oldRefresh=Core.prototype.refreshCreds;
  if(typeof oldRefresh==='function')Core.prototype.refreshCreds=function(...args){
    return singleFlight(this,'credentials',async()=>{
      const s=runtime(this),before=credentialSignature(this.creds),out=await oldRefresh.apply(this,args),after=credentialSignature(this.creds);
      if(before&&after&&before!==after){s.credentialEpoch++;s.credentialRotations++;invalidateConnectionCaches(this)}
      return out;
    });
  };

  const oldFlow=Core.prototype.gameflowInfo;
  if(typeof oldFlow==='function')Core.prototype.gameflowInfo=function(...args){
    const s=runtime(this),epoch=s.credentialEpoch;
    return singleFlight(this,'gameflow',async()=>{
      const out=await oldFlow.apply(this,args);
      if(epoch!==s.credentialEpoch){s.staleEndpointRetries++;try{this.__aramLiveFlowCacheV01571=null;this.__aramLiveFlowAtV01571=0}catch{};return oldFlow.apply(this,args)}
      return out;
    });
  };

  const oldLiveGet=Core.prototype.liveGet;
  if(typeof oldLiveGet==='function')Core.prototype.liveGet=function(pathname,...args){
    const p=String(pathname||''),s=runtime(this),epoch=s.credentialEpoch,key='live:'+p;
    return singleFlight(this,key,async()=>{
      const out=await oldLiveGet.call(this,pathname,...args);
      if(epoch!==s.credentialEpoch){
        s.staleEndpointRetries++;try{this.__aramLiveEndpointCacheV01571?.delete?.(p)}catch{}
        return oldLiveGet.call(this,pathname,...args);
      }
      return out;
    });
  };

  Core.prototype.getConcurrencyStatsV015119=function(){
    const s=runtime(this);return {version:V,running:s.running,stopped:s.stopped,busy:!!s.inflight,generation:s.generation,acceptedGeneration:s.acceptedGeneration,failures:s.failures,nextAllowedAt:s.nextAllowedAt,overlapSkips:s.overlapSkips,scheduledRuns:s.scheduledRuns,requestCoalesces:s.requestCoalesces,credentialEpoch:s.credentialEpoch,credentialRotations:s.credentialRotations,staleEndpointRetries:s.staleEndpointRetries,lastTickMs:s.lastTickMs,maxTickMs:s.maxTickMs,lastError:s.lastError};
  };
  mod.aramAutosyncConcurrencyV015119={version:V,coreIntervalMs:CORE_INTERVAL_MS,maxBackoffMs:BACKOFF[BACKOFF.length-1],getCoreStats:core=>core?.getConcurrencyStatsV015119?.()||null,score_logic_changed:false};
  mod.__ARAM_AUTOSYNC_CONCURRENCY_V015119__=true;
  return mod;
}
function install(liveRuntimeModule){
  if(!liveRuntimeModule||liveRuntimeModule.__ARAM_AUTOSYNC_CONCURRENCY_WRAPPED_V015119__)return liveRuntimeModule;
  if(typeof liveRuntimeModule.patch!=='function')throw new Error('v0.15.119 AutoSync baseline patch() missing');
  const prior=liveRuntimeModule.patch;
  liveRuntimeModule.patch=function(mod){const out=prior(mod)||mod;return patchCore(out)};
  liveRuntimeModule.__ARAM_AUTOSYNC_CONCURRENCY_WRAPPED_V015119__=true;
  return liveRuntimeModule;
}
module.exports={install,patchCore,_test:{runtime,backoffMs,credentialSignature,invalidateConnectionCaches,singleFlight},score_logic_changed:false,random_scoring_changed:false,policy_version:V};
