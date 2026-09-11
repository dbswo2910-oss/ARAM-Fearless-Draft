'use strict';
(()=>{
  if(window.__ARAM_SAFETY_NET_V01579__)return;
  const V='0.15.79',TARGETS={
    renderAll:{slow:300,crit:1000,reentry:true},runRandomCombos:{slow:220,crit:900,reentry:true},renderRandomAnalysis:{slow:220,crit:900,reentry:true},renderRandomDetails:{slow:220,crit:900,reentry:true},renderDataExplorer:{slow:300,crit:1100,reentry:true},renderAramHistoryFeedback:{slow:300,crit:1100,reentry:true}
  };
  const stats={wrapped:[],errors:{},critical:{},circuits:{},reentry:{},slow:{}};
  const trace=(code,kind,detail)=>{try{window.aramDesktop?.traceDiagnostic?.({code,kind,detail:{version:V,...detail}})}catch{}};
  const now=()=>Date.now();
  function pushRecent(obj,name,windowMs){const t=now(),a=(obj[name]||[]).filter(x=>t-x<windowMs);a.push(t);obj[name]=a;return a.length}
  function wrap(name,cfg){
    const orig=window[name];if(typeof orig!=='function'||orig.__aramSafetyV01579)return false;
    let running=0,disabledUntil=0;
    function onError(e){const n=pushRecent(stats.errors,name,30000);trace('SAFE-E001','guarded-function-error',{name,count:n,message:e?.message||String(e),stack:String(e?.stack||'').slice(0,1600)});if(n>=3){disabledUntil=now()+30000;stats.circuits[name]=(stats.circuits[name]||0)+1;trace('SAFE-CB1','circuit-open',{name,reason:'repeated-errors',ms:30000})}}
    function finish(t0){const ms=(performance?.now?.()||Date.now())-t0;if(ms>=cfg.slow){stats.slow[name]=(stats.slow[name]||0)+1;trace(ms>=cfg.crit?'SAFE-P002':'SAFE-P001',ms>=cfg.crit?'critical-blocking-call':'slow-call',{name,ms:Number(ms.toFixed(1))});if(ms>=cfg.crit){const n=pushRecent(stats.critical,name,20000);if(n>=2){disabledUntil=now()+30000;stats.circuits[name]=(stats.circuits[name]||0)+1;trace('SAFE-CB2','circuit-open',{name,reason:'repeated-critical-blocks',ms:30000})}}}}
    const guarded=function(...args){
      if(now()<disabledUntil){trace('SAFE-CB0','circuit-skip',{name,remainingMs:disabledUntil-now()});return undefined}
      if(cfg.reentry&&running>0){stats.reentry[name]=(stats.reentry[name]||0)+1;trace('SAFE-R001','reentry-blocked',{name});return undefined}
      running++;const t0=performance?.now?.()||Date.now();let out,sync=true;
      try{out=orig.apply(this,args);if(out&&typeof out.then==='function'){sync=false;return Promise.resolve(out).catch(e=>{onError(e);throw e}).finally(()=>{running--;finish(t0)})}return out}
      catch(e){onError(e);throw e}
      finally{if(sync){running--;finish(t0)}}
    };
    Object.defineProperty(guarded,'__aramSafetyV01579',{value:true});Object.defineProperty(guarded,'__aramOriginal',{value:orig});window[name]=guarded;stats.wrapped.push(name);return true
  }
  function rescan(){for(const [n,c] of Object.entries(TARGETS))wrap(n,c);return [...stats.wrapped]}
  function finalize(){rescan();trace('SAFE-READY','safety-net-ready',{wrapped:[...new Set(stats.wrapped)]});return true}
  rescan();setTimeout(rescan,400);setTimeout(rescan,1300);setTimeout(finalize,3200);
  window.aramSafetyNetV01579={version:V,rescan,finalize,getStats:()=>JSON.parse(JSON.stringify(stats)),score_logic_changed:false};
  window.__ARAM_SAFETY_NET_V01579__=true;
})();
